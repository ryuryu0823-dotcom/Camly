/**
 * Stripe client (raw fetch based, no `stripe` npm package dependency)
 *
 * Master Handoff v2 §8 準拠の決済アーキテクチャ:
 * - JPY 50,000のPaymentIntentを capture_method=manual で作成する(単一のオーソリ)。
 * - オーソリ成立後だけ貸出権限を付与する。
 * - 返却成立/運営確認後、利用料+選択したCamly Careだけをpartial captureする。
 * - 未返却/破損疑い/扉未閉等で自動的に全額captureしない。
 * - 金額はブラウザから受け取らず、サーバーでPricingRuleから再計算する(呼び出し側の責務)。
 * - Stripe metadataには内部IDのみを保存し、氏名・動画URL・暗証番号等は入れない。
 *
 * 既存の legacy/vercel-functions-v0 と同様、Stripe REST APIを直接fetchで呼ぶ。
 * npm registryにアクセスできない検証環境でも動作コードを書けるようにするための選択。
 * (本番運用では公式SDKへの切替も可能。ロジックはこのモジュールに閉じているため差し替えは容易。)
 */

const STRIPE_API_BASE = "https://api.stripe.com/v1";

export interface StripeConfig {
  secretKey: string;
}

export class StripeApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(message);
  }
}

async function stripeRequest(
  config: StripeConfig,
  method: "GET" | "POST",
  path: string,
  params?: URLSearchParams,
  idempotencyKey?: string
): Promise<any> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.secretKey}`,
  };
  if (method === "POST") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  const url = method === "GET" && params ? `${STRIPE_API_BASE}${path}?${params}` : `${STRIPE_API_BASE}${path}`;

  const res = await fetch(url, {
    method,
    headers,
    body: method === "POST" ? params : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new StripeApiError(json?.error?.message ?? `Stripe API error (${res.status})`, res.status, json);
  }
  return json;
}

/**
 * カード情報だけを保存する Checkout Session(mode=setup)を作成する。
 * この時点では課金しない。setup完了後、success側で customer + payment_method を取得し、
 * createAuthorizationHold() で単一の¥50,000オーソリを作成する(§8.1のアーキテクチャに合わせた二段構成)。
 */
export async function createSetupCheckoutSession(
  config: StripeConfig,
  params: { rentalId: string; successUrl: string; cancelUrl: string; customerEmail?: string }
): Promise<any> {
  const body = new URLSearchParams();
  body.append("mode", "setup");
  body.append("success_url", params.successUrl);
  body.append("cancel_url", params.cancelUrl);
  body.append("customer_creation", "always");
  if (params.customerEmail) body.append("customer_email", params.customerEmail);
  body.append("metadata[rental_id]", params.rentalId);
  return stripeRequest(config, "POST", "/checkout/sessions", body, `camly-setup-${params.rentalId}`);
}

export async function retrieveCheckoutSession(config: StripeConfig, sessionId: string): Promise<any> {
  const params = new URLSearchParams();
  params.append("expand[]", "setup_intent.payment_method");
  return stripeRequest(config, "GET", `/checkout/sessions/${sessionId}`, params);
}

/**
 * §8.1: 単一の¥50,000オーソリを作成する(capture_method=manual)。
 * customerId/paymentMethodId はCheckout Session完了後にsuccess側で取得したものを渡す想定。
 * metadataには内部Rental IDのみを入れ、PII(氏名/電話/動画URL/暗証番号)は入れない(§8.1)。
 */
export async function createAuthorizationHold(
  config: StripeConfig,
  params: {
    amountJpy: number;
    customerId: string;
    paymentMethodId: string;
    rentalId: string;
    idempotencyKey: string;
  }
): Promise<any> {
  const body = new URLSearchParams();
  body.append("amount", String(params.amountJpy));
  body.append("currency", "jpy");
  body.append("customer", params.customerId);
  body.append("payment_method", params.paymentMethodId);
  body.append("capture_method", "manual");
  body.append("automatic_payment_methods[enabled]", "true");
  body.append("automatic_payment_methods[allow_redirects]", "never");
  body.append("confirm", "true");
  body.append("metadata[service]", "Camly");
  body.append("metadata[rental_id]", params.rentalId);

  return stripeRequest(config, "POST", "/payment_intents", body, params.idempotencyKey);
}

/**
 * §8.1: 返却成立後、利用料+Careだけをpartial captureする。
 * 残りの与信枠は自動的に解放される(Stripeの挙動。§8.2で前提として明記)。
 */
export async function capturePartialAmount(
  config: StripeConfig,
  params: {
    paymentIntentId: string;
    amountToCaptureJpy: number;
    idempotencyKey: string;
  }
): Promise<any> {
  const body = new URLSearchParams();
  body.append("amount_to_capture", String(params.amountToCaptureJpy));
  return stripeRequest(
    config,
    "POST",
    `/payment_intents/${params.paymentIntentId}/capture`,
    body,
    params.idempotencyKey
  );
}

export async function cancelAuthorization(
  config: StripeConfig,
  params: { paymentIntentId: string; idempotencyKey: string }
): Promise<any> {
  const body = new URLSearchParams();
  return stripeRequest(config, "POST", `/payment_intents/${params.paymentIntentId}/cancel`, body, params.idempotencyKey);
}

export async function retrievePaymentIntent(config: StripeConfig, paymentIntentId: string): Promise<any> {
  return stripeRequest(config, "GET", `/payment_intents/${paymentIntentId}`);
}

/**
 * §8.3: 破損対応(2)の選択肢に相当。事前同意のうえ保存済みPaymentMethodへoff-session請求する場合に使う。
 * 通常フローでは使わない(§9 Camly Careの範囲内は原則5,000円上限で別途運用)。
 */
export async function chargeOffSessionAdditional(
  config: StripeConfig,
  params: {
    amountJpy: number;
    customerId: string;
    paymentMethodId: string;
    rentalId: string;
    reason: string;
    idempotencyKey: string;
  }
): Promise<any> {
  const body = new URLSearchParams();
  body.append("amount", String(params.amountJpy));
  body.append("currency", "jpy");
  body.append("customer", params.customerId);
  body.append("payment_method", params.paymentMethodId);
  body.append("off_session", "true");
  body.append("confirm", "true");
  body.append("metadata[service]", "Camly");
  body.append("metadata[rental_id]", params.rentalId);
  body.append("metadata[reason]", params.reason);
  return stripeRequest(config, "POST", "/payment_intents", body, params.idempotencyKey);
}

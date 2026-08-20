/**
 * Stripe webhook signature verification
 *
 * Master Handoff v2 §8.1準拠。npm `stripe` パッケージの `stripe.webhooks.constructEvent` に相当する処理を、
 * Stripeが公開している署名スキームに基づき node:crypto のみで実装する。
 *
 * 署名スキーム(Stripe公式ドキュメントで公開されている仕様):
 *   Stripe-Signature ヘッダは "t=<timestamp>,v1=<signature>[,v1=<signature>...]" の形式。
 *   signed_payload = "<timestamp>.<raw_body>"
 *   expected_signature = HMAC-SHA256(webhookSecret, signed_payload) を16進数化したもの
 *   v1のいずれかがexpected_signatureと一致し、かつtimestampが許容範囲内であれば正当とみなす。
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export class WebhookVerificationError extends Error {}

export interface VerifiedStripeEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
  [key: string]: unknown;
}

const DEFAULT_TOLERANCE_SECONDS = 5 * 60; // 5分

export function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string,
  now: Date = new Date(),
  toleranceSeconds = DEFAULT_TOLERANCE_SECONDS
): VerifiedStripeEvent {
  if (!signatureHeader) {
    throw new WebhookVerificationError("missing Stripe-Signature header");
  }

  const parts = signatureHeader.split(",").map((p) => p.trim());
  let timestamp: string | null = null;
  const v1Signatures: string[] = [];
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "t") timestamp = value;
    if (key === "v1") v1Signatures.push(value);
  }

  if (!timestamp || v1Signatures.length === 0) {
    throw new WebhookVerificationError("malformed Stripe-Signature header");
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", webhookSecret).update(signedPayload).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");

  const matched = v1Signatures.some((sig) => {
    let sigBuf: Buffer;
    try {
      sigBuf = Buffer.from(sig, "hex");
    } catch {
      return false;
    }
    if (sigBuf.length !== expectedBuf.length) return false;
    return timingSafeEqual(sigBuf, expectedBuf);
  });

  if (!matched) {
    throw new WebhookVerificationError("signature mismatch");
  }

  const timestampMs = Number(timestamp) * 1000;
  const ageSeconds = Math.abs(now.getTime() - timestampMs) / 1000;
  if (ageSeconds > toleranceSeconds) {
    throw new WebhookVerificationError("timestamp outside tolerance (possible replay)");
  }

  const parsed = JSON.parse(rawBody);
  if (!parsed?.id || !parsed?.type) {
    throw new WebhookVerificationError("event body missing id/type");
  }
  return parsed as VerifiedStripeEvent;
}

/**
 * event IDの一意制約 + 冪等処理(§8.1)。
 * 呼び出し側がDB(payments.stripeEventId UNIQUE等)で「既に処理済みか」を確認するための純粋関数。
 * ここでは「既知のevent ID集合」を受け取り、未処理なら処理対象として返す形にしている。
 */
export function isDuplicateWebhookEvent(eventId: string, processedEventIds: ReadonlySet<string>): boolean {
  return processedEventIds.has(eventId);
}

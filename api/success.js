export default {
  async fetch(request) {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session_id");

    if (!sessionId) {
      return new Response("session_id がありません", { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    try {
      // ① Checkout Sessionを取得
      const sessionResponse = await fetch(
        `https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=payment_intent`,
        {
          headers: {
            Authorization: `Bearer ${stripeKey}`,
          },
        }
      );

      const session = await sessionResponse.json();

      if (!sessionResponse.ok) {
        return new Response(
          `Stripe Session取得エラー: ${
            session.error?.message || "unknown"
          }`,
          { status: 400 }
        );
      }

      // ② 990円の支払い確認
      if (session.payment_status !== "paid") {
        return new Response(
          "990円の決済が完了していません。",
          { status: 400 }
        );
      }

      const customerId = session.customer;
      const paymentMethodId =
        session.payment_intent?.payment_method;

      if (!customerId || !paymentMethodId) {
        return new Response(
          "決済カード情報を取得できませんでした。",
          { status: 400 }
        );
      }

      // ③ 50,000円の仮押さえPaymentIntentを作成
      const params = new URLSearchParams();

      params.append("amount", "50000");
      params.append("currency", "jpy");

      params.append("customer", customerId);
      params.append("payment_method", paymentMethodId);

      // オーソリのみ。まだ請求確定しない
      params.append("capture_method", "manual");

      // ダッシュボードで有効な決済方法を利用
      params.append(
        "automatic_payment_methods[enabled]",
        "true"
      );

      // リダイレクト系決済方法を除外
      params.append(
        "automatic_payment_methods[allow_redirects]",
        "never"
      );

      // その場でカード承認
      params.append("confirm", "true");

      // Stripe上で検索しやすくする
      params.append(
        "metadata[service]",
        "Camly"
      );

      params.append(
        "metadata[type]",
        "GR III deposit"
      );

      params.append(
        "metadata[checkout_session_id]",
        sessionId
      );

      const holdResponse = await fetch(
        "https://api.stripe.com/v1/payment_intents",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${stripeKey}`,
            "Content-Type":
              "application/x-www-form-urlencoded",

            // 同じCheckout Sessionで二重仮押さえされるのを防ぐ
            "Idempotency-Key":
              `camly-deposit-${sessionId}`,
          },
          body: params,
        }
      );

      const hold = await holdResponse.json();

      // ④ 仮押さえ成功
      if (
        holdResponse.ok &&
        hold.status === "requires_capture"
      ) {
        return new Response(
          `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>Camly</title>

  <style>
    body {
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Helvetica Neue",
        sans-serif;

      background: #f5f5f5;
      margin: 0;
      color: #111;
    }

    .container {
      max-width: 420px;
      margin: 0 auto;
      padding: 48px 22px;
    }

    .card {
      background: #fff;
      padding: 32px 24px;
      border-radius: 20px;
      text-align: center;
      box-shadow:
        0 8px 30px rgba(0, 0, 0, 0.08);
    }

    .camera {
      font-size: 48px;
    }

    h1 {
      margin-top: 12px;
      font-size: 25px;
    }

    .label {
      margin-top: 32px;
      color: #777;
      font-size: 14px;
    }

    .password {
      font-size: 46px;
      font-weight: 700;
      letter-spacing: 10px;
      margin: 8px 0 30px;
    }

    .steps {
      background: #f6f6f6;
      border-radius: 12px;
      padding: 18px;
      text-align: left;
      line-height: 1.9;
      font-size: 15px;
    }

    .deposit {
      margin-top: 24px;
      color: #777;
      font-size: 12px;
      line-height: 1.7;
    }
  </style>
</head>

<body>
  <div class="container">
    <div class="card">

      <div class="camera">📷</div>

      <h1>レンタル準備完了</h1>

      <p>
        RICOH GR IIIをお楽しみください。
      </p>

      <div class="label">
        キーボックス暗証番号
      </div>

      <div class="password">
        2580
      </div>

      <div class="steps">
        <strong>カメラの取り出し方</strong>
        <br><br>

        ① キーボックスに暗証番号を入力
        <br>

        ② 中の鍵を取り出す
        <br>

        ③ Camly BOXを開ける
        <br>

        ④ カメラケースを取り出す
      </div>

      <div class="deposit">
        ¥990のお支払いが完了しました。
        <br>

        保証として¥50,000のカード利用枠を
        一時的に確保しています。
        <br>

        正常返却確認後、請求せず解除します。
      </div>

    </div>
  </div>
</body>
</html>
          `,
          {
            status: 200,
            headers: {
              "Content-Type":
                "text/html; charset=utf-8",
            },
          }
        );
      }

      // ⑤ 仮押さえ失敗
      return new Response(
        `
保証枠50,000円の確保に失敗しました。

Status: ${hold.status || "unknown"}

${hold.error?.message || ""}
        `,
        {
          status: 400,
          headers: {
            "Content-Type":
              "text/plain; charset=utf-8",
          },
        }
      );

    } catch (error) {
      return new Response(
        `エラーが発生しました: ${error.message}`,
        {
          status: 500,
          headers: {
            "Content-Type":
              "text/plain; charset=utf-8",
          },
        }
      );
    }
  },
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session_id");

    if (!sessionId) {
      return new Response("session_id がありません", { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    try {
      // ① Stripe Checkoutの決済結果を取得
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
          `Stripe Session取得エラー: ${session.error?.message || "unknown"}`,
          { status: 400 }
        );
      }

      // ② 990円が実際に支払われているか確認
      if (session.payment_status !== "paid") {
        return new Response(
          "990円の決済が完了していません。",
          { status: 400 }
        );
      }

      const customerId = session.customer;
      const paymentMethodId = session.payment_intent?.payment_method;

      if (!customerId || !paymentMethodId) {
        return new Response(
          "決済カード情報を取得できませんでした。",
          { status: 400 }
        );
      }

      // ③ 同じカードで50,000円を仮押さえ
      const params = new URLSearchParams();

      params.append("amount", "50000");
      params.append("currency", "jpy");
      params.append("customer", customerId);
      params.append("payment_method", paymentMethodId);

      // ここが「仮押さえ」の設定
      params.append("capture_method", "manual");

      // カードをその場で認証
      params.append("confirm", "true");

      // Stripe管理画面で後から見つけやすくする
      params.append("metadata[service]", "Camly");
      params.append("metadata[type]", "GR III deposit");
      params.append("metadata[checkout_session_id]", sessionId);

      const holdResponse = await fetch(
        "https://api.stripe.com/v1/payment_intents",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${stripeKey}`,
            "Content-Type": "application/x-www-form-urlencoded",

            // ページ再読み込みによる二重仮押さえ防止
            "Idempotency-Key": `camly-deposit-${sessionId}`,
          },
          body: params,
        }
      );

      const hold = await holdResponse.json();

      // ④ 5万円の仮押さえ成功
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
            <meta name="viewport"
              content="width=device-width, initial-scale=1.0">
            <title>Camly</title>

            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont,
                  "Helvetica Neue", sans-serif;
                background: #f5f5f5;
                margin: 0;
                color: #111;
              }

              .container {
                max-width: 420px;
                margin: auto;
                padding: 48px 22px;
              }

              .card {
                background: white;
                padding: 32px 24px;
                border-radius: 20px;
                text-align: center;
                box-shadow: 0 8px 30px rgba(0,0,0,.08);
              }

              h1 {
                font-size: 25px;
              }

              .camera {
                font-size: 48px;
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

                <p>RICOH GR IIIをお楽しみください。</p>

                <div class="label">
                  キーボックス暗証番号
                </div>

                <div class="password">
                  2580
                </div>

                <div class="steps">
                  <strong>カメラの取り出し方</strong><br><br>
                  ① キーボックスに暗証番号を入力<br>
                  ② 鍵を取り出す<br>
                  ③ Camly BOXを開ける<br>
                  ④ カメラケースを取り出す
                </div>

                <div class="deposit">
                  ¥990のお支払いが完了しました。<br>
                  保証として¥50,000のカード利用枠を
                  一時的に確保しています。<br>
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
              "Content-Type": "text/html; charset=utf-8",
            },
          }
        );
      }

      // 5万円仮押さえに失敗した場合は
      // 絶対に暗証番号を見せない
      return new Response(
        `保証枠50,000円の確保に失敗しました。
Status: ${hold.status || "unknown"}
${hold.error?.message || ""}`,
        { status: 400 }
      );

    } catch (error) {
      return new Response(
        `エラーが発生しました: ${error.message}`,
        { status: 500 }
      );
    }
  },
};

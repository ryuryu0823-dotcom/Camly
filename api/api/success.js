export default async function handler(req, res) {
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).send("session_id がありません");
  }

  try {
    // 1. Checkout Sessionを取得
    const sessionResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${session_id}?expand[]=payment_intent`,
      {
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        },
      }
    );

    const session = await sessionResponse.json();

    if (!sessionResponse.ok) {
      throw new Error(session.error?.message || "Session取得エラー");
    }

    // 990円の決済が完了しているか確認
    if (session.payment_status !== "paid") {
      return res.status(400).send("990円の決済が完了していません。");
    }

    const customerId = session.customer;
    const paymentMethodId = session.payment_intent?.payment_method;

    if (!customerId || !paymentMethodId) {
      return res
        .status(400)
        .send("カード情報を確認できませんでした。");
    }

    // 2. 50,000円のデポジットを仮押さえ
    const params = new URLSearchParams();

    params.append("amount", "50000");
    params.append("currency", "jpy");
    params.append("customer", customerId);
    params.append("payment_method", paymentMethodId);

    // 仮押さえ
    params.append("capture_method", "manual");

    // 保存済みカードを利用
    params.append("confirm", "true");
    params.append("off_session", "true");

    // Stripe上で後から探しやすくする
    params.append(
      "metadata[checkout_session_id]",
      session_id
    );
    params.append(
      "metadata[purpose]",
      "Camly GR III deposit"
    );

    const holdResponse = await fetch(
      "https://api.stripe.com/v1/payment_intents",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",

          // ページを再読み込みしても
          // 仮押さえが重複しないようにする
          "Idempotency-Key": `camly-deposit-${session_id}`,
        },
        body: params,
      }
    );

    const hold = await holdResponse.json();

    // 3. 仮押さえ成功
    if (
      holdResponse.ok &&
      hold.status === "requires_capture"
    ) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");

      return res.status(200).send(`
        <!DOCTYPE html>
        <html lang="ja">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Camly - Rental Ready</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                margin: 0;
                background: #f5f5f5;
                color: #111;
              }

              .container {
                max-width: 420px;
                margin: 0 auto;
                padding: 50px 24px;
                text-align: center;
              }

              .card {
                background: white;
                border-radius: 20px;
                padding: 32px 24px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.08);
              }

              h1 {
                font-size: 25px;
                margin-bottom: 10px;
              }

              .success {
                font-size: 48px;
                margin-bottom: 12px;
              }

              .password-label {
                margin-top: 32px;
                font-size: 14px;
                color: #666;
              }

              .password {
                font-size: 44px;
                font-weight: 700;
                letter-spacing: 8px;
                margin: 10px 0 30px;
              }

              .instruction {
                text-align: left;
                line-height: 1.8;
                font-size: 15px;
                background: #f7f7f7;
                padding: 18px;
                border-radius: 12px;
              }

              .deposit {
                margin-top: 24px;
                font-size: 12px;
                color: #777;
                line-height: 1.6;
              }
            </style>
          </head>

          <body>
            <div class="container">
              <div class="card">

                <div class="success">📷</div>

                <h1>レンタル準備完了</h1>

                <p>
                  RICOH GR IIIをお楽しみください。
                </p>

                <div class="password-label">
                  キーボックス暗証番号
                </div>

                <div class="password">
                  2580
                </div>

                <div class="instruction">
                  <strong>カメラの取り出し方</strong><br><br>
                  ① キーボックスに暗証番号を入力<br>
                  ② 中の鍵を取り出す<br>
                  ③ Camly BOXを開ける<br>
                  ④ カメラケースを取り出す
                </div>

                <div class="deposit">
                  ¥990のお支払いが完了しました。<br>
                  また、保証として¥50,000のカード利用枠を
                  一時的に確保しています。<br>
                  正常返却確認後、請求せず解除します。
                </div>

              </div>
            </div>
          </body>
        </html>
      `);
    }

    // 3Dセキュア等の追加認証が必要だった場合は
    // パスワードを出さない
    return res.status(400).send(`
      デポジットのカード認証を完了できませんでした。
      カメラの貸出はまだ開始されていません。
    `);

  } catch (error) {
    console.error(error);

    return res.status(500).send(
      "決済処理中にエラーが発生しました。"
    );
  }
}

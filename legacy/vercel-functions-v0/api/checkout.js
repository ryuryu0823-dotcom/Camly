export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const params = new URLSearchParams();

  params.append("mode", "payment");

  // 990円の商品
  params.append(
    "line_items[0][price]",
    "price_1U3pWpHSN8DZz1rOYkxrlftK"
  );
  params.append("line_items[0][quantity]", "1");

  // 支払い方法を保存して、あとで5万円の仮押さえに使う
  params.append(
    "payment_intent_data[setup_future_usage]",
    "off_session"
  );

  // Customerを必ず作成
  params.append("customer_creation", "always");

  // 決済成功後
  params.append(
    "success_url",
    "https://camly-plum.vercel.app/api/success?session_id={CHECKOUT_SESSION_ID}"
  );

  // キャンセル時
  params.append(
    "cancel_url",
    "https://camly-plum.vercel.app/api/checkout"
  );

  const response = await fetch(
    "https://api.stripe.com/v1/checkout/sessions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    }
  );

  const session = await response.json();

  if (!response.ok) {
    return res.status(response.status).json(session);
  }

  // Stripe Checkoutへそのまま移動
  res.redirect(303, session.url);
}

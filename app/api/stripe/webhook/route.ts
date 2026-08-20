/**
 * POST /api/stripe/webhook
 *
 * §8.1: 「Webhookは署名検証、event IDの一意制約、冪等処理、監査ログを必須とする」
 *
 * - 生のリクエストボディに対して署名検証を行う(req.text()で取得。req.json()は使わない)。
 * - event IDをpayments.stripeEventId(UNIQUE制約)で冪等化する。
 * - 未知のevent typeは200を返してAckしつつ、処理はスキップする(Stripe側の無限リトライを防ぐ)。
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyStripeWebhookSignature, WebhookVerificationError } from "@/lib/stripe/webhook";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET not configured" }, { status: 500 });
  }

  let event;
  try {
    event = verifyStripeWebhookSignature(rawBody, signature, webhookSecret);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.error("webhook signature verification failed", err.message);
      return NextResponse.json({ error: "signature verification failed" }, { status: 400 });
    }
    throw err;
  }

  // 冪等性チェック: 既に処理済みのevent IDならAckだけ返す。
  const existing = await prisma.payment.findUnique({ where: { stripeEventId: event.id } });
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const obj = event.data.object as any;
  const paymentIntentId: string | undefined = obj?.id ?? obj?.payment_intent;

  switch (event.type) {
    case "payment_intent.payment_failed": {
      if (paymentIntentId) {
        const rental = await prisma.rental.findUnique({ where: { paymentIntentId } });
        if (rental) {
          await prisma.payment.create({
            data: { rentalId: rental.id, stripePaymentIntentId: paymentIntentId, eventType: "FAILED", amountJpy: 0, stripeEventId: event.id },
          });
          await writeAuditLog({ actorType: "system", action: "webhook.payment_intent.payment_failed", targetType: "rental", targetId: rental.id, metadata: { eventId: event.id } });
        }
      }
      break;
    }
    case "payment_intent.canceled": {
      if (paymentIntentId) {
        const rental = await prisma.rental.findUnique({ where: { paymentIntentId } });
        if (rental) {
          await prisma.payment.create({
            data: { rentalId: rental.id, stripePaymentIntentId: paymentIntentId, eventType: "CANCELED", amountJpy: 0, stripeEventId: event.id },
          });
          await writeAuditLog({ actorType: "system", action: "webhook.payment_intent.canceled", targetType: "rental", targetId: rental.id, metadata: { eventId: event.id } });
        }
      }
      break;
    }
    case "charge.dispute.created": {
      // 異議申立(チャージバック)。DamageCase/管理画面フローへ接続する必要がある(Step5以降のTODO)。
      await writeAuditLog({ actorType: "system", action: "webhook.charge.dispute.created", metadata: { eventId: event.id, raw: obj } });
      break;
    }
    default: {
      // 未対応イベントは記録だけしてAckする。
      await writeAuditLog({ actorType: "system", action: `webhook.unhandled.${event.type}`, metadata: { eventId: event.id } });
    }
  }

  return NextResponse.json({ received: true });
}

// Next.js App RouterのRoute Handlerはデフォルトでbodyパーサーを持たないため特別な設定は不要。
// (Pages Router時代のapi.bodyParser=false相当の設定は不要。req.text()で生ボディを取得できる。)

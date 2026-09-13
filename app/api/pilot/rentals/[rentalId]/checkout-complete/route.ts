/**
 * GET /api/pilot/rentals/:rentalId/checkout-complete?session_id=...
 *
 * Stripe Checkout Session(mode=setup)完了後のリダイレクト先。
 * §6 step6-8, §8.1準拠:
 * - Checkout Sessionからcustomer/payment_methodを取得
 * - 単一の¥50,000 PaymentIntent(capture_method=manual)をオーソリ
 * - 成功した場合のみ Rental を PAYMENT_AUTHORIZED へ進め、compartmentをOCCUPIEDにする
 * - Phase A(PILOT_PHYSICAL_LOCK): Box.currentPhysicalUnlockCodeを取得して案内する
 * - Phase B(SMART_BOX): 別途 /api/box/commands 経由でUNLOCKコマンドを発行する(このファイルでは未実装、Step4参照)
 *
 * 冪等性: 同一rentalIdに対して二重にオーソリが作られないよう、idempotencyKeyをrentalId固定にする。
 * また、Rental.statusが既にHELDでない場合は何もしない(Stripeのリトライ/二重アクセスに耐える)。
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { retrieveCheckoutSession, createAuthorizationHold } from "@/lib/stripe/client";
import { assertValidTransition } from "@/lib/state-machine/rental";
import { writeRentalEventBestEffort, writeAuditLogBestEffort } from "@/lib/audit";
import { generateIdempotencyKey } from "@/lib/ids";

const DEPOSIT_AMOUNT_JPY = 50000;
const AUTH_VALID_HOURS = 24 * 7; // captureBefore監視用の目安。Stripeの実際のオーソリ有効期限は決済手段により異なる。

// Stripe決済の与信作成・DB更新を伴うため、キャッシュ/静的化させない。
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { rentalId: string } }) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  const rental = await prisma.rental.findUnique({
    where: { id: params.rentalId },
    include: { checkoutCompartment: { include: { box: true } }, customer: true },
  });
  if (!rental) {
    return NextResponse.json({ error: "rental not found" }, { status: 404 });
  }

  if (rental.status !== "HELD") {
    // 既に処理済み(Stripeのリトライ/リロード等)。現状のRentalを返して終わる。
    return NextResponse.redirect(new URL(`/app/rentals/${rental.token}`, req.nextUrl.origin));
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY not configured" }, { status: 500 });
  }
  const config = { secretKey: stripeSecretKey };

  const session = await retrieveCheckoutSession(config, sessionId);
  const customerId: string | undefined = session.customer;
  const paymentMethodId: string | undefined = session.setup_intent?.payment_method?.id ?? session.setup_intent?.payment_method;

  if (!customerId || !paymentMethodId) {
    return NextResponse.json({ error: "could not resolve customer/payment method from checkout session" }, { status: 400 });
  }

  let hold;
  try {
    hold = await createAuthorizationHold(config, {
      amountJpy: DEPOSIT_AMOUNT_JPY,
      customerId,
      paymentMethodId,
      rentalId: rental.id,
      idempotencyKey: generateIdempotencyKey("deposit", rental.id),
    });
  } catch (err) {
    console.error("authorization hold failed", err);
    assertValidTransition("HELD", "PAYMENT_FAILED");
    await prisma.rental.update({ where: { id: rental.id }, data: { status: "PAYMENT_FAILED" } });
    await writeRentalEventBestEffort({ rentalId: rental.id, fromStatus: "HELD", toStatus: "PAYMENT_FAILED", actor: "system", reason: "authorization_hold_failed" });
    return NextResponse.json({ error: "payment authorization failed" }, { status: 402 });
  }

  if (hold.status !== "requires_capture") {
    assertValidTransition("HELD", "PAYMENT_FAILED");
    await prisma.rental.update({ where: { id: rental.id }, data: { status: "PAYMENT_FAILED" } });
    await writeRentalEventBestEffort({ rentalId: rental.id, fromStatus: "HELD", toStatus: "PAYMENT_FAILED", actor: "system", reason: `unexpected_status:${hold.status}` });
    return NextResponse.json({ error: "payment not authorized", stripeStatus: hold.status }, { status: 402 });
  }

  const box = rental.checkoutCompartment.box;
  const captureBefore = new Date(Date.now() + AUTH_VALID_HOURS * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    assertValidTransition("HELD", "PAYMENT_AUTHORIZED");
    await tx.rental.update({
      where: { id: rental.id },
      data: {
        status: "PAYMENT_AUTHORIZED",
        paymentIntentId: hold.id,
        authorizedAmountJpy: DEPOSIT_AMOUNT_JPY,
        captureBefore,
        paymentAuthorizedAt: new Date(),
      },
    });
    await tx.payment.create({
      data: { rentalId: rental.id, stripePaymentIntentId: hold.id, eventType: "AUTHORIZED", amountJpy: DEPOSIT_AMOUNT_JPY },
    });
    await tx.compartment.update({ where: { id: rental.checkoutCompartmentId }, data: { status: "OCCUPIED" } });

    // Phase A: 物理鍵。Phase Bは別途 UNLOCK コマンド発行(Step4のBoxProvider経由)。
    if (box.mode === "PILOT_PHYSICAL_LOCK") {
      assertValidTransition("PAYMENT_AUTHORIZED", "UNLOCK_REQUESTED");
      assertValidTransition("UNLOCK_REQUESTED", "DOOR_OPEN");
      assertValidTransition("DOOR_OPEN", "RENTED");
      await tx.rental.update({
        where: { id: rental.id },
        data: { status: "RENTED", unlockRequestedAt: new Date(), doorOpenedAt: new Date(), rentalStartedAt: new Date() },
      });
    }
  });

  await writeRentalEventBestEffort({ rentalId: rental.id, fromStatus: "HELD", toStatus: "PAYMENT_AUTHORIZED", actor: "system", reason: "stripe_authorization_succeeded", metadata: { paymentIntentId: hold.id } });
  await writeAuditLogBestEffort({ actorType: "system", action: "payment.authorize", targetType: "rental", targetId: rental.id, metadata: { paymentIntentId: hold.id, amountJpy: DEPOSIT_AMOUNT_JPY } });

  if (box.mode === "PILOT_PHYSICAL_LOCK") {
    await writeRentalEventBestEffort({ rentalId: rental.id, fromStatus: "PAYMENT_AUTHORIZED", toStatus: "RENTED", actor: "system", reason: "physical_lock_code_issued" });
  }

  return NextResponse.redirect(new URL(`/app/rentals/${rental.token}`, req.nextUrl.origin));
}

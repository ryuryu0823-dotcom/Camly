/**
 * POST /api/admin/rentals/:id/approve-return
 *
 * 管理者による返却確認・承認(§10, §15)。
 * AI_REVIEW_REQUIRED状態のRentalを、管理者が動画を確認したうえで3択で判断する:
 * - action="capture_usage"(既定): finalAmountJpy(利用料+Care)だけをpartial captureする(§8.1)。
 *   残りの与信枠は自動解放される。通常の正常返却で使う。
 * - action="capture_full": 破損・紛失等、保証枠を大きく請求すべきケースで使う。
 *   安心プラン(CarePlan.liabilityCapJpy)加入中はその上限額を、未加入なら¥50,000与信枠を全額captureする。
 * - action="waive": 何も請求せず、¥50,000与信枠を丸ごと解放する(PaymentIntentをcancel)。
 *
 * 部分的な増額請求(利用料+修理実費の一部だけ、等)は別途DamageCase起票フロー
 * (未実装。Step5以降)の対象。
 *
 * 認証: このMVPでは呼び出し元でAdminUser認証済みである前提(実際のRBACミドルウェアはStep2の
 * 残タスクとして別途実装が必要。ここではadminUserIdをボディで受け取る簡易実装に留める)。
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertValidTransition } from "@/lib/state-machine/rental";
import { capturePartialAmount, cancelAuthorization } from "@/lib/stripe/client";
import { writeRentalEventBestEffort, writeAuditLogBestEffort } from "@/lib/audit";
import { generateIdempotencyKey } from "@/lib/ids";

type ApproveAction = "capture_usage" | "capture_full" | "waive";

interface ApproveBody {
  adminUserId: string;
  action?: ApproveAction;
  reason?: string;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json()) as ApproveBody;
  if (!body.adminUserId) {
    return NextResponse.json({ error: "adminUserId is required (audit trail)" }, { status: 400 });
  }
  const action: ApproveAction = body.action ?? "capture_usage";

  const rental = await prisma.rental.findUnique({ where: { id: params.id }, include: { carePlan: true } });
  if (!rental) return NextResponse.json({ error: "rental not found" }, { status: 404 });
  if (rental.status !== "AI_REVIEW_REQUIRED") {
    return NextResponse.json({ error: `cannot approve from status ${rental.status}` }, { status: 409 });
  }
  if (!rental.paymentIntentId || rental.finalAmountJpy == null || rental.authorizedAmountJpy == null) {
    return NextResponse.json(
      { error: "rental missing paymentIntentId, finalAmountJpy, or authorizedAmountJpy" },
      { status: 500 }
    );
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY not configured" }, { status: 500 });
  }

  const capturedJpy =
    action === "waive"
      ? 0
      : action === "capture_full"
        ? (rental.carePlan?.liabilityCapJpy ?? rental.authorizedAmountJpy)
        : rental.finalAmountJpy;
  try {
    if (action === "waive") {
      await cancelAuthorization(
        { secretKey: stripeSecretKey },
        { paymentIntentId: rental.paymentIntentId, idempotencyKey: generateIdempotencyKey("cancel", rental.id) }
      );
    } else {
      await capturePartialAmount(
        { secretKey: stripeSecretKey },
        {
          paymentIntentId: rental.paymentIntentId,
          amountToCaptureJpy: capturedJpy,
          idempotencyKey: generateIdempotencyKey(`capture-${action}`, rental.id),
        }
      );
    }
  } catch (err) {
    console.error(`${action} failed`, err);
    await writeAuditLogBestEffort({
      actorType: "admin",
      actorId: body.adminUserId,
      action: action === "waive" ? "payment.cancel_failed" : "payment.capture_failed",
      targetType: "rental",
      targetId: rental.id,
      reasonText: body.reason,
    });
    return NextResponse.json({ error: `${action} failed` }, { status: 502 });
  }

  await prisma.$transaction(async (tx) => {
    assertValidTransition("AI_REVIEW_REQUIRED", "RETURN_DOOR_OPEN");
    assertValidTransition("RETURN_DOOR_OPEN", "CHARGE_REQUIRED");
    assertValidTransition("CHARGE_REQUIRED", "RETURNED_PENDING_REVIEW");
    assertValidTransition("RETURNED_PENDING_REVIEW", "COMPLETED");

    await tx.rental.update({
      where: { id: rental.id },
      data: { status: "COMPLETED", returnCompletedAt: new Date() },
    });
    await tx.payment.create({
      data: {
        rentalId: rental.id,
        stripePaymentIntentId: rental.paymentIntentId!,
        eventType: action === "waive" ? "CANCELED" : "PARTIAL_CAPTURED",
        amountJpy: capturedJpy,
      },
    });
    await tx.compartment.updateMany({
      where: { id: rental.checkoutCompartmentId },
      data: { status: "AVAILABLE" },
    });
    await tx.device.update({ where: { id: rental.deviceId }, data: { status: "AVAILABLE" } });
  });

  await writeRentalEventBestEffort({
    rentalId: rental.id,
    fromStatus: "AI_REVIEW_REQUIRED",
    toStatus: "COMPLETED",
    actor: `admin:${body.adminUserId}`,
    reason: body.reason ?? `manual_return_${action}`,
    metadata: { action, capturedJpy },
  });
  await writeAuditLogBestEffort({
    actorType: "admin",
    actorId: body.adminUserId,
    action: `rental.manual_return_${action}`,
    targetType: "rental",
    targetId: rental.id,
    reasonText: body.reason,
    metadata: { action, capturedJpy },
  });

  return NextResponse.json({ status: "COMPLETED", action, capturedJpy });
}

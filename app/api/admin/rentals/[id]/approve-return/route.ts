/**
 * POST /api/admin/rentals/:id/approve-return
 *
 * 管理者による返却確認・承認(§10, §15)。
 * - AI_REVIEW_REQUIRED状態のRentalを、管理者が動画を確認したうえで判断する。
 * - action="capture"(既定): finalAmountJpy(+ Care)だけをpartial captureする(§8.1)。残枠は自動解放される。
 * - action="waive": 何も請求せず、¥50,000与信枠を丸ごと解放する(PaymentIntentをcancel)。
 *   利用料を請求するかどうかは管理者がこの2択で都度判断する(破損時の増額請求は別途DamageCase
 *   起票フロー(未実装。Step5以降)の対象)。
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

interface ApproveBody {
  adminUserId: string;
  action?: "capture" | "waive";
  reason?: string;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json()) as ApproveBody;
  if (!body.adminUserId) {
    return NextResponse.json({ error: "adminUserId is required (audit trail)" }, { status: 400 });
  }
  const action = body.action ?? "capture";

  const rental = await prisma.rental.findUnique({ where: { id: params.id } });
  if (!rental) return NextResponse.json({ error: "rental not found" }, { status: 404 });
  if (rental.status !== "AI_REVIEW_REQUIRED") {
    return NextResponse.json({ error: `cannot approve from status ${rental.status}` }, { status: 409 });
  }
  if (!rental.paymentIntentId || rental.finalAmountJpy == null) {
    return NextResponse.json({ error: "rental missing paymentIntentId or finalAmountJpy" }, { status: 500 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY not configured" }, { status: 500 });
  }

  const capturedJpy = action === "waive" ? 0 : rental.finalAmountJpy;
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
          amountToCaptureJpy: rental.finalAmountJpy,
          idempotencyKey: generateIdempotencyKey("capture", rental.id),
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
    reason: body.reason ?? (action === "waive" ? "manual_return_waived" : "manual_return_approved"),
    metadata: { action, capturedJpy },
  });
  await writeAuditLogBestEffort({
    actorType: "admin",
    actorId: body.adminUserId,
    action: action === "waive" ? "rental.manual_return_waive" : "rental.manual_return_approve",
    targetType: "rental",
    targetId: rental.id,
    reasonText: body.reason,
    metadata: { action, capturedJpy },
  });

  return NextResponse.json({ status: "COMPLETED", action, capturedJpy });
}

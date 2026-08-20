/**
 * POST /api/admin/rentals/:id/approve-return
 *
 * 管理者による返却確認・承認(§10, §15)。
 * - AI_REVIEW_REQUIRED状態のRentalを、管理者が現物確認したうえで承認する。
 * - 承認時に、finalAmountJpy(+ Care)だけをpartial captureする(§8.1)。残枠は自動解放される。
 * - 破損が疑われる場合は承認せず、別途DamageCase起票フロー(未実装。Step5以降)へ回す。
 *
 * 認証: このMVPでは呼び出し元でAdminUser認証済みである前提(実際のRBACミドルウェアはStep2の
 * 残タスクとして別途実装が必要。ここではadminUserIdをボディで受け取る簡易実装に留める)。
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertValidTransition } from "@/lib/state-machine/rental";
import { capturePartialAmount } from "@/lib/stripe/client";
import { writeRentalEvent, writeAuditLog } from "@/lib/audit";
import { generateIdempotencyKey } from "@/lib/ids";

interface ApproveBody {
  adminUserId: string;
  reason?: string;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json()) as ApproveBody;
  if (!body.adminUserId) {
    return NextResponse.json({ error: "adminUserId is required (audit trail)" }, { status: 400 });
  }

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

  let capture;
  try {
    capture = await capturePartialAmount(
      { secretKey: stripeSecretKey },
      {
        paymentIntentId: rental.paymentIntentId,
        amountToCaptureJpy: rental.finalAmountJpy,
        idempotencyKey: generateIdempotencyKey("capture", rental.id),
      }
    );
  } catch (err) {
    console.error("partial capture failed", err);
    await writeAuditLog({
      actorType: "admin",
      actorId: body.adminUserId,
      action: "payment.capture_failed",
      targetType: "rental",
      targetId: rental.id,
      reasonText: body.reason,
    });
    return NextResponse.json({ error: "capture failed" }, { status: 502 });
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
        eventType: "PARTIAL_CAPTURED",
        amountJpy: rental.finalAmountJpy!,
      },
    });
    await tx.compartment.updateMany({
      where: { id: rental.checkoutCompartmentId },
      data: { status: "AVAILABLE" },
    });
    await tx.device.update({ where: { id: rental.deviceId }, data: { status: "AVAILABLE" } });
  });

  await writeRentalEvent({
    rentalId: rental.id,
    fromStatus: "AI_REVIEW_REQUIRED",
    toStatus: "COMPLETED",
    actor: `admin:${body.adminUserId}`,
    reason: body.reason ?? "manual_return_approved",
    metadata: { capturedJpy: rental.finalAmountJpy, stripePaymentIntentId: capture.id },
  });
  await writeAuditLog({
    actorType: "admin",
    actorId: body.adminUserId,
    action: "rental.manual_return_approve",
    targetType: "rental",
    targetId: rental.id,
    reasonText: body.reason,
    metadata: { capturedJpy: rental.finalAmountJpy },
  });

  return NextResponse.json({ status: "COMPLETED", capturedJpy: rental.finalAmountJpy });
}

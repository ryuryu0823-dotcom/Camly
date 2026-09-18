/**
 * POST /api/admin/rentals/:id/force-release
 *
 * 管理者による強制解放(§15)。返却フロー(動画確認→承認)を経ずに、Rentalを
 * CANCELEDにしてcompartment/deviceをAVAILABLEへ戻す。
 * - status=HELD: 決済を最後まで完了せずに離脱したケース。Stripe側では何も確定していないため
 *   PaymentIntentの操作は不要。
 * - status=UNLOCK_REQUESTED/DOOR_OPEN/RENTED: 既に¥50,000のオーソリが確定しているケース。
 *   テスト取引の取消や、返却動画フローを経ずに与信枠だけ解放したい例外対応として、
 *   PaymentIntentをcancelしてから状態遷移する(§8.1)。
 *
 * 認証: 他のadmin系routeと同様、このMVPではadminUserIdをボディで受け取る簡易実装。
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertValidTransition, RentalStatus } from "@/lib/state-machine/rental";
import { cancelAuthorization } from "@/lib/stripe/client";
import { writeRentalEventBestEffort, writeAuditLogBestEffort } from "@/lib/audit";
import { generateIdempotencyKey } from "@/lib/ids";

interface ForceReleaseBody {
  adminUserId: string;
  reason?: string;
}

const RELEASABLE_STATUSES: RentalStatus[] = ["HELD", "UNLOCK_REQUESTED", "DOOR_OPEN", "RENTED"];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json()) as ForceReleaseBody;
  if (!body.adminUserId) {
    return NextResponse.json({ error: "adminUserId is required (audit trail)" }, { status: 400 });
  }

  const rental = await prisma.rental.findUnique({ where: { id: params.id } });
  if (!rental) return NextResponse.json({ error: "rental not found" }, { status: 404 });
  const fromStatus = rental.status as RentalStatus;
  if (!RELEASABLE_STATUSES.includes(fromStatus)) {
    return NextResponse.json({ error: `cannot force-release from status ${fromStatus}` }, { status: 409 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (fromStatus !== "HELD") {
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "STRIPE_SECRET_KEY not configured" }, { status: 500 });
    }
    if (!rental.paymentIntentId) {
      return NextResponse.json({ error: "rental missing paymentIntentId" }, { status: 500 });
    }
    try {
      await cancelAuthorization(
        { secretKey: stripeSecretKey },
        { paymentIntentId: rental.paymentIntentId, idempotencyKey: generateIdempotencyKey("force-cancel", rental.id) }
      );
    } catch (err) {
      console.error("force-release: authorization cancel failed", err);
      return NextResponse.json({ error: "stripe cancel failed" }, { status: 502 });
    }
  }

  await prisma.$transaction(async (tx) => {
    assertValidTransition(fromStatus, "CANCELED");
    await tx.rental.update({ where: { id: rental.id }, data: { status: "CANCELED" } });
    await tx.compartment.update({ where: { id: rental.checkoutCompartmentId }, data: { status: "AVAILABLE" } });
    await tx.device.update({ where: { id: rental.deviceId }, data: { status: "AVAILABLE" } });
  });

  await writeRentalEventBestEffort({
    rentalId: rental.id,
    fromStatus,
    toStatus: "CANCELED",
    actor: `admin:${body.adminUserId}`,
    reason: body.reason ?? "manual_force_release",
  });
  await writeAuditLogBestEffort({
    actorType: "admin",
    actorId: body.adminUserId,
    action: "rental.force_release",
    targetType: "rental",
    targetId: rental.id,
    reasonText: body.reason,
  });

  return NextResponse.json({ status: "CANCELED" });
}

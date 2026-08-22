/**
 * POST /api/admin/rentals/:id/force-release
 *
 * 管理者による強制解放(§15)。
 * 決済を最後まで完了せずに離脱した(Stripe Checkoutを閉じた等)HELD状態のRentalを
 * CANCELEDにし、compartment/deviceをAVAILABLEへ戻す。通常はStripe側のcheckout
 * セッション作成失敗時に自動で解放されるが(pilot/rentals/route.ts内部)、
 * それ以外の理由で人が離脱した場合の受け皿として管理者が手動で使う。
 *
 * 認証: 他のadmin系routeと同様、このMVPではadminUserIdをボディで受け取る簡易実装。
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertValidTransition } from "@/lib/state-machine/rental";
import { writeRentalEventBestEffort, writeAuditLogBestEffort } from "@/lib/audit";

interface ForceReleaseBody {
  adminUserId: string;
  reason?: string;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json()) as ForceReleaseBody;
  if (!body.adminUserId) {
    return NextResponse.json({ error: "adminUserId is required (audit trail)" }, { status: 400 });
  }

  const rental = await prisma.rental.findUnique({ where: { id: params.id } });
  if (!rental) return NextResponse.json({ error: "rental not found" }, { status: 404 });
  if (rental.status !== "HELD") {
    return NextResponse.json({ error: `cannot force-release from status ${rental.status}` }, { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    assertValidTransition("HELD", "CANCELED");
    await tx.rental.update({ where: { id: rental.id }, data: { status: "CANCELED" } });
    await tx.compartment.update({ where: { id: rental.checkoutCompartmentId }, data: { status: "AVAILABLE" } });
    await tx.device.update({ where: { id: rental.deviceId }, data: { status: "AVAILABLE" } });
  });

  await writeRentalEventBestEffort({
    rentalId: rental.id,
    fromStatus: "HELD",
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

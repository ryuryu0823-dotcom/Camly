/**
 * GET /api/rentals/:token
 *
 * 利用中画面(§6 step10)向けのステータスAPI。
 * - 経過時間、現在の料金目安(参考値。確定はしない §7)、次に料金が上がる時刻を返す。
 * - Phase Aの暗証番号は初回アクセス時にのみ返し、以降は隠す(§6 step8「一度だけ表示」)。
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateTotalPrice, computeDurationMinutes, PricingTier } from "@/lib/pricing/engine";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const rental = await prisma.rental.findUnique({
    where: { token: params.token },
    include: {
      device: true,
      checkoutCompartment: { include: { box: true } },
      pricingVersion: true,
      carePlan: true,
    },
  });
  if (!rental) {
    return NextResponse.json({ error: "rental not found" }, { status: 404 });
  }

  let unlockCode: string | null = null;
  const box = rental.checkoutCompartment.box;
  if (box.mode === "PILOT_PHYSICAL_LOCK" && !rental.unlockCodeRevealedAt && rental.status === "RENTED") {
    unlockCode = box.currentPhysicalUnlockCode;
    await prisma.rental.update({ where: { id: rental.id }, data: { unlockCodeRevealedAt: new Date() } });
  }

  let estimate: ReturnType<typeof calculateTotalPrice> | null = null;
  if (rental.rentalStartedAt) {
    const now = new Date();
    const minutes = computeDurationMinutes(rental.rentalStartedAt, now);
    const tiers = rental.pricingVersion.tiers as unknown as PricingTier[];
    estimate = calculateTotalPrice(
      minutes,
      { tiers, additionalPer24hJpy: rental.pricingVersion.additionalPer24hJpy },
      rental.carePlan ? { priceJpy: rental.carePlan.priceJpy } : null
    );
  }

  return NextResponse.json({
    status: rental.status,
    device: { model: rental.device.model },
    rentalStartedAt: rental.rentalStartedAt,
    unlockCode, // nullなら非表示(既に表示済み、またはPhase B/未貸出)
    estimate: estimate
      ? { totalJpy: estimate.totalJpy, durationMinutes: estimate.durationMinutes, appliedTierLabel: estimate.appliedTierLabel }
      : null,
  });
}

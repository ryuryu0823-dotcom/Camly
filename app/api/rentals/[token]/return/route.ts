/**
 * POST /api/rentals/:token/return
 *
 * 返却申請(§10)。動画・写真は事前にMedia Storageへアップロード済みで、
 * ここではそのstorageKeyとチェック項目・アンケートだけを受け取る想定。
 *
 * - returnRequestedAt(動画/写真/チェック項目が揃った時刻)を料金計算の基準にする(§10 step9)。
 * - AI一次判定: 動画AIのベンダー/モデルは未決定(Master Handoff v2 §21)。
 *   ここでは常に HUMAN_REVIEW とし、必ず管理者確認を経由させる(判定を偽装しない)。
 * - 即時応答は「返却申請を受け付けました」であり、断定的な「返却完了」ではない(§10 step10)。
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertValidTransition } from "@/lib/state-machine/rental";
import { calculateTotalPrice, computeDurationMinutes, PricingTier } from "@/lib/pricing/engine";
import { writeRentalEvent, writeAuditLog } from "@/lib/audit";

interface ReturnBody {
  videoAssetKey: string;
  photoAssetKey: string;
  checklist: Record<string, boolean>;
  doorClosed: boolean;
  chargerConnected: boolean;
  surveyAnswers?: Record<string, unknown>;
}

const REQUIRED_CHECKLIST_ITEMS = [
  "camera_body",
  "battery",
  "sd_card",
  "sd_card_reader",
  "strap",
  "case",
  "ac_charger",
  "carry_cable",
  "no_visible_damage_or_reported",
];

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const body = (await req.json()) as ReturnBody;

  const rental = await prisma.rental.findUnique({
    where: { token: params.token },
    include: { pricingVersion: true, carePlan: true },
  });
  if (!rental) return NextResponse.json({ error: "rental not found" }, { status: 404 });
  if (!["RENTED", "OVERDUE"].includes(rental.status)) {
    return NextResponse.json({ error: `cannot return from status ${rental.status}` }, { status: 409 });
  }
  if (!rental.rentalStartedAt) {
    return NextResponse.json({ error: "rental has no start time" }, { status: 500 });
  }
  if (!body.videoAssetKey || !body.photoAssetKey) {
    return NextResponse.json({ error: "video and photo are required" }, { status: 400 });
  }

  const missingItems = REQUIRED_CHECKLIST_ITEMS.filter((item) => body.checklist?.[item] !== true);

  const returnRequestedAt = new Date();
  const minutes = computeDurationMinutes(rental.rentalStartedAt, returnRequestedAt);
  const tiers = rental.pricingVersion.tiers as unknown as PricingTier[];
  const price = calculateTotalPrice(
    minutes,
    { tiers, additionalPer24hJpy: rental.pricingVersion.additionalPer24hJpy },
    rental.carePlan ? { priceJpy: rental.carePlan.priceJpy } : null
  );

  await prisma.$transaction(async (tx) => {
    const fromRented = rental.status as "RENTED" | "OVERDUE";
    if (fromRented === "RENTED") assertValidTransition("RENTED", "RETURN_VIDEO_PENDING");
    // AI一次判定は常にHUMAN_REVIEW行き(ベンダー未決定のため判定を偽装しない)。
    assertValidTransition("RETURN_VIDEO_PENDING", "AI_REVIEW");
    assertValidTransition("AI_REVIEW", "AI_REVIEW_REQUIRED");

    await tx.rental.update({
      where: { id: rental.id },
      data: {
        status: "AI_REVIEW_REQUIRED",
        returnRequestedAt,
        finalAmountJpy: price.totalJpy,
        finalAmountBreakdown: price.breakdown as any,
      },
    });

    await tx.mediaAsset.createMany({
      data: [
        {
          rentalId: rental.id,
          kind: "RETURN_VIDEO",
          storageKey: body.videoAssetKey,
          mimeType: "video/mp4",
          retainUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 原則90日保存(§11)
        },
        {
          rentalId: rental.id,
          kind: "RETURN_PHOTO",
          storageKey: body.photoAssetKey,
          mimeType: "image/jpeg",
          retainUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    await tx.returnInspection.create({
      data: {
        rentalId: rental.id,
        videoAssetId: null,
        photoAssetId: null,
        aiResult: "HUMAN_REVIEW",
        aiNotes: missingItems.length > 0 ? `missing checklist items: ${missingItems.join(", ")}` : null,
        checklist: body.checklist as any,
        doorClosed: body.doorClosed,
        chargerConnected: body.chargerConnected,
        surveyAnswers: (body.surveyAnswers as any) ?? null,
      },
    });
  });

  await writeRentalEvent({
    rentalId: rental.id,
    fromStatus: rental.status,
    toStatus: "AI_REVIEW_REQUIRED",
    actor: "customer",
    reason: "return_submitted",
    metadata: { minutes, finalAmountJpy: price.totalJpy, missingItems },
  });
  await writeAuditLog({
    actorType: "customer",
    action: "rental.return_submit",
    targetType: "rental",
    targetId: rental.id,
    metadata: { finalAmountJpy: price.totalJpy },
  });

  return NextResponse.json({
    message: "返却申請を受け付けました。現物確認後にご案内します。",
    status: "AI_REVIEW_REQUIRED",
  });
}

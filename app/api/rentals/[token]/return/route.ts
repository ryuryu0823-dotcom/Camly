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
import { writeRentalEventBestEffort, writeAuditLogBestEffort } from "@/lib/audit";
import { RETURN_STEPS } from "@/lib/return-steps";

interface ReturnStepUpload {
  stepKey: string;
  storageKey: string;
  mimeType: string;
}

interface ReturnBody {
  steps: ReturnStepUpload[];
  surveyAnswers?: Record<string, unknown>;
}

const STEP_KIND_BY_KEY = new Map(RETURN_STEPS.map((s) => [s.key, s.kind]));

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
  if (!body.steps || body.steps.length === 0) {
    return NextResponse.json({ error: "steps are required" }, { status: 400 });
  }

  const uploadedStepKeys = new Set(body.steps.map((s) => s.stepKey));
  const missingItems = RETURN_STEPS.filter((step) => !uploadedStepKeys.has(step.key)).map((step) => step.label);
  if (missingItems.length > 0) {
    return NextResponse.json({ error: `未撮影の項目があります: ${missingItems.join("、")}` }, { status: 400 });
  }

  // door_closed / charger_connected は今はステップ動画が届いたことを証跡として扱う。
  // 将来Boxのセンサー(box_capabilities.charger_sense / remote_unlock)が使えるようになったら、
  // そちらの検知結果に差し替える(§12.3)。
  const doorClosed = uploadedStepKeys.has("door_closed");
  const chargerConnected = uploadedStepKeys.has("charger_connected");
  const checklist = Object.fromEntries(RETURN_STEPS.map((step) => [step.key, uploadedStepKeys.has(step.key)]));

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
      data: body.steps.map((step) => ({
        rentalId: rental.id,
        // kindはクライアント申告ではなく、共有定義(RETURN_STEPS)から解決する(改ざん防止)。
        kind: STEP_KIND_BY_KEY.get(step.stepKey) === "photo" ? ("RETURN_PHOTO" as const) : ("RETURN_VIDEO" as const),
        stepKey: step.stepKey,
        storageKey: step.storageKey,
        mimeType: step.mimeType,
        retainUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 原則90日保存(§11)
      })),
    });

    await tx.returnInspection.create({
      data: {
        rentalId: rental.id,
        videoAssetId: null,
        photoAssetId: null,
        aiResult: "HUMAN_REVIEW",
        checklist: checklist as any,
        doorClosed,
        chargerConnected,
        surveyAnswers: (body.surveyAnswers as any) ?? null,
      },
    });
  });

  await writeRentalEventBestEffort({
    rentalId: rental.id,
    fromStatus: rental.status,
    toStatus: "AI_REVIEW_REQUIRED",
    actor: "customer",
    reason: "return_submitted",
    metadata: { minutes, finalAmountJpy: price.totalJpy },
  });
  await writeAuditLogBestEffort({
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

/**
 * POST /api/admin/rentals/:id/ai-review
 *
 * 返却写真のAI一次判定を実行し、ReturnInspectionに結果を保存する(§10, §21)。
 * 管理者が返却レビュー画面で明示的に実行するオンデマンド方式(返却申請時に自動実行して
 * 顧客を待たせたり、Vercel Functionsのタイムアウトに引っかかるのを避けるため)。
 *
 * 結果はあくまで参考所見であり、承認・請求の最終判断は既存どおり管理者が行う
 * (このAPIはReturnInspectionを更新するだけで、Rental.status等は一切変更しない)。
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createPresignedGetUrl } from "@/lib/storage/s3-presign";
import { RETURN_STEPS } from "@/lib/return-steps";
import { reviewReturnPhotos, AiReviewError, ReturnPhotoInput } from "@/lib/ai/return-review";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const endpoint = process.env.MEDIA_STORAGE_ENDPOINT;
  const bucket = process.env.MEDIA_STORAGE_BUCKET;
  const accessKeyId = process.env.MEDIA_STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.MEDIA_STORAGE_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    return NextResponse.json({ error: "media storage is not configured" }, { status: 500 });
  }
  const storageConfig = { endpoint, bucket, region: process.env.MEDIA_STORAGE_REGION ?? "auto", accessKeyId, secretAccessKey };

  const rental = await prisma.rental.findUnique({
    where: { id: params.id },
    include: { mediaAssets: true, returnInspection: true },
  });
  if (!rental) return NextResponse.json({ error: "rental not found" }, { status: 404 });
  if (!rental.returnInspection) {
    return NextResponse.json({ error: "return not yet submitted for this rental" }, { status: 409 });
  }

  const photoStepKeys = new Set(RETURN_STEPS.filter((s) => s.kind === "photo").map((s) => s.key));
  const photoAssets = rental.mediaAssets.filter((m) => m.stepKey && photoStepKeys.has(m.stepKey));
  if (photoAssets.length === 0) {
    return NextResponse.json({ error: "no photo assets found for this rental" }, { status: 409 });
  }

  let photos: ReturnPhotoInput[];
  try {
    photos = await Promise.all(
      photoAssets.map(async (asset) => {
        const url = createPresignedGetUrl(storageConfig, asset.storageKey, 300);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`failed to fetch ${asset.stepKey}: ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        const step = RETURN_STEPS.find((s) => s.key === asset.stepKey);
        return {
          stepKey: asset.stepKey!,
          label: step?.label ?? asset.stepKey!,
          imageBase64: buf.toString("base64"),
          mediaType: asset.mimeType,
        };
      })
    );
  } catch (err: any) {
    console.error("ai-review: failed to fetch photos", err);
    return NextResponse.json({ error: "failed to fetch photos from storage" }, { status: 502 });
  }

  try {
    const result = await reviewReturnPhotos(apiKey, photos);

    const notes = [
      result.summary,
      ...result.items.map((i) => `${i.ok ? "✓" : "△"} ${i.label}: ${i.note}`),
    ].join("\n");

    await prisma.returnInspection.update({
      where: { rentalId: rental.id },
      data: { aiResult: result.overall === "PASS" ? "PASS" : "HUMAN_REVIEW", aiNotes: notes },
    });

    return NextResponse.json({ overall: result.overall, items: result.items, summary: result.summary });
  } catch (err: any) {
    console.error("ai-review failed", err);
    const message = err instanceof AiReviewError ? err.message : "AI review failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

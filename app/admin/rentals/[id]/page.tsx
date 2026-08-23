/**
 * 管理者による返却動画レビュー画面(§4 `/admin/rentals/[id]`, §10, §15)。
 * ステップ式ガイド撮影(src/lib/return-steps.ts)で撮られた各動画を項目ごとに確認し、
 * 問題なければ承認する(承認処理そのものは既存の approve-return API を使う。
 * finalAmountJpyだけpartial captureし、¥50,000与信枠の残りはStripe側で自動解放される)。
 *
 * ⚠ 認証未実装。admin/page.tsxと同様、本番投入前に必ずRBACガードを追加すること。
 */
import { prisma } from "@/lib/db";
import { createPresignedGetUrl } from "@/lib/storage/s3-presign";
import { RETURN_STEPS } from "@/lib/return-steps";
import { ApproveButton } from "./ApproveButton";
import { ForceReleaseButton } from "./ForceReleaseButton";

// レビュー・承認操作を行う運用画面のため、キャッシュせず毎回最新のDB状態を取得する。
export const dynamic = "force-dynamic";

export default async function AdminRentalDetailPage({ params }: { params: { id: string } }) {
  const rental = await prisma.rental.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      device: true,
      carePlan: true,
      checkoutCompartment: { include: { box: { include: { location: true } } } },
      mediaAssets: { orderBy: { createdAt: "asc" } },
      returnInspection: true,
    },
  });

  if (!rental) {
    return (
      <main className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
        <p className="text-camly-inkMuted">レンタルが見つかりません。</p>
      </main>
    );
  }

  const mediaByStep = new Map(rental.mediaAssets.map((m) => [m.stepKey, m]));
  const storageConfigured = Boolean(
    process.env.MEDIA_STORAGE_ENDPOINT &&
      process.env.MEDIA_STORAGE_BUCKET &&
      process.env.MEDIA_STORAGE_ACCESS_KEY_ID &&
      process.env.MEDIA_STORAGE_SECRET_ACCESS_KEY
  );

  return (
    <main className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
      <a href="/admin" className="text-xs text-camly-inkMuted underline">
        ← 貸出一覧へ戻る
      </a>
      <h1 className="text-2xl font-bold mt-3 mb-1">
        {rental.checkoutCompartment.box.location.name} / {rental.device.model}
      </h1>
      <p className="text-camly-inkMuted text-sm mb-8">
        {rental.customer?.name ?? "-"} ({rental.customer?.email ?? "-"}) / 状態: <strong>{rental.status}</strong>
      </p>

      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4">返却撮影ステップ</h2>
        {!storageConfigured && (
          <p className="text-xs text-camly-inkMuted mb-3">
            ⚠ メディアストレージ未設定のため写真・動画は再生できません(.env.localのMEDIA_STORAGE_*を参照)。
          </p>
        )}
        <div className="space-y-4">
          {RETURN_STEPS.map((step) => {
            const asset = mediaByStep.get(step.key);
            const url = asset && storageConfigured ? getPresignedUrlForAsset(asset.storageKey) : null;
            return (
              <div key={step.key} className="rounded-xl border border-camly-line p-4">
                <p className="text-sm font-bold mb-2">
                  {step.label} <span className="text-camly-inkMuted font-normal">({step.kind === "photo" ? "写真" : "動画"})</span>
                </p>
                {url ? (
                  step.kind === "photo" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={step.label} className="w-full rounded-lg bg-black max-h-80 object-contain" />
                  ) : (
                    <video src={url} controls playsInline className="w-full rounded-lg bg-black max-h-80" />
                  )
                ) : (
                  <p className="text-xs text-red-400">未撮影、または再生できません</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {rental.returnInspection && (
        <section className="mb-10 text-sm">
          <h2 className="text-lg font-bold mb-3">チェック項目</h2>
          <ul className="space-y-1 text-camly-inkMuted">
            <li>扉を閉めた状態の撮影: {rental.returnInspection.doorClosed ? "✓" : "✗"}</li>
            <li>充電ケーブル接続の撮影: {rental.returnInspection.chargerConnected ? "✓" : "✗"}</li>
          </ul>
        </section>
      )}

      <section className="mb-10 text-sm">
        <h2 className="text-lg font-bold mb-3">金額</h2>
        <p>与信(オーソリ): {rental.authorizedAmountJpy != null ? `¥${rental.authorizedAmountJpy.toLocaleString()}` : "-"}</p>
        <p>最終確定額(利用料+Care): {rental.finalAmountJpy != null ? `¥${rental.finalAmountJpy.toLocaleString()}` : "-"}</p>
        <p>
          安心プラン:{" "}
          {rental.carePlan?.liabilityCapJpy != null
            ? `加入中(破損時上限¥${rental.carePlan.liabilityCapJpy.toLocaleString()})`
            : "未加入"}
        </p>
      </section>

      <section>
        {rental.status === "AI_REVIEW_REQUIRED" ? (
          <ApproveButton
            rentalId={rental.id}
            finalAmountJpy={rental.finalAmountJpy}
            fullCaptureJpy={rental.carePlan?.liabilityCapJpy ?? rental.authorizedAmountJpy}
          />
        ) : RELEASABLE_STATUSES.includes(rental.status) ? (
          <ForceReleaseButton rentalId={rental.id} status={rental.status} />
        ) : (
          <p className="text-xs text-camly-inkMuted">現在の状態(status={rental.status})ではここでの操作はできません。</p>
        )}
      </section>
    </main>
  );
}

const RELEASABLE_STATUSES = ["HELD", "UNLOCK_REQUESTED", "DOOR_OPEN", "RENTED"];

function getPresignedUrlForAsset(storageKey: string): string | null {
  const endpoint = process.env.MEDIA_STORAGE_ENDPOINT;
  const bucket = process.env.MEDIA_STORAGE_BUCKET;
  const accessKeyId = process.env.MEDIA_STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.MEDIA_STORAGE_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null;

  return createPresignedGetUrl(
    { endpoint, bucket, region: process.env.MEDIA_STORAGE_REGION ?? "auto", accessKeyId, secretAccessKey },
    storageKey,
    900
  );
}

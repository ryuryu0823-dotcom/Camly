/**
 * 初期不良・破損報告一覧(管理画面)。
 * DamageCase(§14)を新しい順に一覧表示し、紐づく証跡動画(MediaAsset kind=DAMAGE_EVIDENCE)を
 * 署名付きURLで確認できるようにする。
 */
import { prisma } from "@/lib/db";
import { createPresignedGetUrl } from "@/lib/storage/s3-presign";

export const dynamic = "force-dynamic";

export default async function AdminDamageCasesPage() {
  const cases = await prisma.damageCase.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      rental: {
        include: {
          customer: true,
          checkoutCompartment: { include: { box: { include: { location: true } } } },
        },
      },
    },
  });

  const rentalIds = [...new Set(cases.map((c) => c.rentalId))];
  const mediaAssets = rentalIds.length
    ? await prisma.mediaAsset.findMany({
        where: { rentalId: { in: rentalIds }, kind: "DAMAGE_EVIDENCE" },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const endpoint = process.env.MEDIA_STORAGE_ENDPOINT;
  const bucket = process.env.MEDIA_STORAGE_BUCKET;
  const accessKeyId = process.env.MEDIA_STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.MEDIA_STORAGE_SECRET_ACCESS_KEY;
  const storageConfig =
    endpoint && bucket && accessKeyId && secretAccessKey
      ? { endpoint, bucket, region: process.env.MEDIA_STORAGE_REGION ?? "auto", accessKeyId, secretAccessKey }
      : null;

  const mediaByRental = new Map<string, typeof mediaAssets>();
  for (const m of mediaAssets) {
    const list = mediaByRental.get(m.rentalId) ?? [];
    list.push(m);
    mediaByRental.set(m.rentalId, list);
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">初期不良・破損報告一覧</h1>
        <a href="/admin" className="text-xs underline text-camly-inkMuted">
          貸出一覧に戻る
        </a>
      </div>
      <p className="text-camly-inkMuted text-sm mb-8">{cases.length}件</p>

      {cases.length === 0 && (
        <p className="rounded-xl border border-camly-line px-4 py-8 text-center text-camly-inkMuted text-sm">
          報告はありません
        </p>
      )}

      <div className="space-y-4">
        {cases.map((c) => {
          const media = mediaByRental.get(c.rentalId) ?? [];
          return (
            <div key={c.id} className="rounded-xl border border-camly-line p-4">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <a href={`/admin/rentals/${c.rentalId}`} className="font-bold text-sm underline">
                  {c.rental.checkoutCompartment.box.location.name} / {c.rental.customer?.name ?? "-"}
                </a>
                <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-camly-charcoal text-camly-inkMuted">
                  {c.status}
                </span>
              </div>
              <p className="text-xs text-camly-inkMuted mb-3">
                {c.createdAt.toISOString()} / 報告者: {c.reportedBy}
              </p>
              <p className="text-sm whitespace-pre-wrap mb-3">{c.description}</p>
              {media.length > 0 && storageConfig && (
                <div className="flex flex-wrap gap-3">
                  {media.map((m) => (
                    <a
                      key={m.id}
                      href={createPresignedGetUrl(storageConfig, m.storageKey, 3600)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline text-camly-accent"
                    >
                      証跡動画を再生({m.createdAt.toISOString()})
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}

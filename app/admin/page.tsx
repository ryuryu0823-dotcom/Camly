/**
 * 管理画面(§4 `/admin/*`, §15)のダッシュボード雛形。
 * サーバーコンポーネントとしてPrismaに直接クエリする(App Routerの標準パターン)。
 *
 * TODO(このセッションでは未実装。Step2の残タスク):
 * - AdminUser認証・RBACミドルウェア(現状このページに認証ガードが無い。本番投入前に必須)
 * - 拠点/Box/収納口/カメラ個体/付属品CRUD
 * - DamageCase一覧・修理見積フロー
 * - 料金/Care/規約のversion管理UI
 * - 台別売上・利用時間・回転率・故障率・粗利のダッシュボード
 * - QR閲覧→入力→与信成功→貸出→返却のfunnel可視化
 */
import { prisma } from "@/lib/db";
import { UnlockCodeEditor } from "./UnlockCodeEditor";

// 貸出状況を都度確認する運用画面のため、キャッシュせず毎回最新のDB状態を取得する。
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [rentals, boxes] = await Promise.all([
    prisma.rental.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { device: true, customer: true, checkoutCompartment: { include: { box: { include: { location: true } } } } },
    }),
    prisma.box.findMany({ include: { location: true }, orderBy: { label: "asc" } }),
  ]);

  return (
    <main className="min-h-screen px-6 py-12 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">管理画面</h1>
      <p className="text-camly-inkMuted text-sm mb-8">⚠ 認証未実装。本番投入前に必ずRBACガードを追加すること。</p>

      <h2 className="text-lg font-bold mb-4">キーボックス暗証番号</h2>
      <div className="grid gap-4 mb-10 sm:grid-cols-2">
        {boxes.map((box) => (
          <div key={box.id}>
            <p className="text-xs text-camly-inkMuted mb-2">
              {box.location.name} / {box.label}
            </p>
            <UnlockCodeEditor boxId={box.id} currentCode={box.currentPhysicalUnlockCode} />
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold mb-4">貸出一覧(直近50件)</h2>

      {rentals.length === 0 && (
        <p className="rounded-xl border border-camly-line px-4 py-8 text-center text-camly-inkMuted text-sm">
          貸出データがありません
        </p>
      )}

      {/* スマホ: カードリスト */}
      <div className="space-y-3 md:hidden">
        {rentals.map((r) => (
          <a
            key={r.id}
            href={`/admin/rentals/${r.id}`}
            className="block rounded-xl border border-camly-line p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm">{r.checkoutCompartment.box.location.name}</span>
              <StatusBadge status={r.status} />
            </div>
            <p className="text-xs text-camly-inkMuted mb-1">
              {r.device.model} / {r.customer?.name ?? "-"}
            </p>
            <div className="flex items-center justify-between text-xs text-camly-inkMuted mt-2 pt-2 border-t border-camly-line">
              <span>{r.finalAmountJpy != null ? `¥${r.finalAmountJpy.toLocaleString()}` : "-"}</span>
              <span>{r.createdAt.toISOString()}</span>
            </div>
          </a>
        ))}
      </div>

      {/* PC: テーブル */}
      {rentals.length > 0 && (
        <div className="hidden md:block overflow-x-auto rounded-xl border border-camly-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-camly-inkMuted border-b border-camly-line">
                <th className="px-4 py-3">拠点</th>
                <th className="px-4 py-3">カメラ</th>
                <th className="px-4 py-3">利用者</th>
                <th className="px-4 py-3">状態</th>
                <th className="px-4 py-3">最終金額</th>
                <th className="px-4 py-3">作成日時</th>
              </tr>
            </thead>
            <tbody>
              {rentals.map((r) => (
                <tr key={r.id} className="border-b border-camly-line last:border-0">
                  <td className="px-4 py-3">
                    <a href={`/admin/rentals/${r.id}`} className="underline">
                      {r.checkoutCompartment.box.location.name}
                    </a>
                  </td>
                  <td className="px-4 py-3">{r.device.model}</td>
                  <td className="px-4 py-3">{r.customer?.name ?? "-"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3">{r.finalAmountJpy != null ? `¥${r.finalAmountJpy.toLocaleString()}` : "-"}</td>
                  <td className="px-4 py-3 text-camly-inkMuted">{r.createdAt.toISOString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const needsAttention = ["AI_REVIEW_REQUIRED", "DAMAGE_REVIEW", "BOX_OFFLINE", "OVERDUE", "REFUND_REQUIRED"].includes(status);
  return (
    <span
      className={`inline-block px-2 py-1 rounded text-xs font-bold ${
        needsAttention ? "bg-camly-accent text-camly-black" : "bg-camly-charcoal text-camly-inkMuted"
      }`}
    >
      {status}
    </span>
  );
}

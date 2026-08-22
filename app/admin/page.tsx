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

export default async function AdminDashboardPage() {
  const rentals = await prisma.rental.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { device: true, customer: true, checkoutCompartment: { include: { box: { include: { location: true } } } } },
  });

  return (
    <main className="min-h-screen px-6 py-12 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">管理画面</h1>
      <p className="text-camly-inkMuted text-sm mb-8">⚠ 認証未実装。本番投入前に必ずRBACガードを追加すること。</p>

      <h2 className="text-lg font-bold mb-4">貸出一覧(直近50件)</h2>
      <div className="overflow-x-auto rounded-xl border border-camly-line">
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
            {rentals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-camly-inkMuted">
                  貸出データがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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

"use client";

/**
 * 強制解放ボタン(§15)。
 * 既存の POST /api/admin/rentals/:id/force-release をそのまま呼ぶ。
 * status=HELDならStripeへの操作なし、それ以外(RENTED等)なら¥50,000与信枠を
 * PaymentIntentごとcancelして解放する。返却フロー(動画確認)を経ない例外対応。
 *
 * ⚠ 管理者認証未実装(ApproveButtonと同じTODO)。まだ個人アカウントが無いため、
 * adminUserIdは入力させず固定値("admin-web")を送る(APIの監査ログ用必須項目を満たすためだけの仮値)。
 * その代わり、実際にお金が動く操作なので押した直後に確認ダイアログを挟む。
 */
import { useState } from "react";

const ADMIN_ACTOR_ID = "admin-web";

export function ForceReleaseButton({ rentalId, status }: { rentalId: string; status: string }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleRelease() {
    const warning =
      status !== "HELD"
        ? "既に確定済みの¥50,000与信枠も全額解放されます。よろしいですか?この操作は取り消せません。"
        : "返却フローを経ずに強制キャンセルします。よろしいですか?この操作は取り消せません。";
    if (!window.confirm(warning)) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/rentals/${rentalId}/force-release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUserId: ADMIN_ACTOR_ID, reason: reason || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "解放に失敗しました");
      setDone(true);
    } catch (err: any) {
      setError(err.message ?? "エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <p className="text-camly-accent font-bold text-sm">
        強制キャンセルしました。{status !== "HELD" && "¥50,000与信枠は全額解放されます。"}
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-camly-line p-4 space-y-3">
      <p className="text-xs text-camly-inkMuted">
        返却フローを経ずに強制キャンセルします。
        {status !== "HELD" && "既に確定済みの¥50,000与信枠も全額解放されます。"}
      </p>
      <label className="block">
        <span className="block text-xs text-camly-inkMuted mb-1.5">メモ(任意)</span>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-lg bg-camly-charcoal border border-camly-line px-4 py-2.5 text-base"
        />
      </label>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="button"
        onClick={handleRelease}
        disabled={submitting}
        className="w-full rounded-full border border-camly-line text-camly-ink font-bold py-3 text-sm disabled:opacity-50"
      >
        {submitting ? "処理中…" : "強制キャンセルして解放"}
      </button>
    </div>
  );
}

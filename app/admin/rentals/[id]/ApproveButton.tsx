"use client";

/**
 * 返却承認ボタン(§10, §15)。
 * 既存の POST /api/admin/rentals/:id/approve-return を呼ぶ。管理者が動画を見て2択で判断する:
 * - 「承認して利用料を請求」: finalAmountJpyだけpartial captureし、¥50,000与信枠の残りは自動解放
 * - 「請求せず与信枠を解除」: 何も請求せず、¥50,000与信枠を丸ごと解放(PaymentIntentをcancel)
 *
 * ⚠ 管理者認証未実装(admin/page.tsxと同じTODO)。adminUserIdは簡易な入力欄で受け取る。
 */
import { useState } from "react";

export function ApproveButton({ rentalId, finalAmountJpy }: { rentalId: string; finalAmountJpy: number | null }) {
  const [adminUserId, setAdminUserId] = useState("");
  const [reason, setReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState<"capture" | "waive" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ action: string; capturedJpy: number } | null>(null);

  async function handleSubmit(action: "capture" | "waive") {
    if (!adminUserId) {
      setError("管理者ID(AdminUser.id)を入力してください。");
      return;
    }
    setSubmittingAction(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/rentals/${rentalId}/approve-return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUserId, action, reason: reason || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "処理に失敗しました");
      setDone({ action, capturedJpy: data.capturedJpy });
    } catch (err: any) {
      setError(err.message ?? "エラーが発生しました");
    } finally {
      setSubmittingAction(null);
    }
  }

  if (done) {
    return (
      <p className="text-camly-accent font-bold text-sm">
        {done.action === "waive"
          ? "請求せず¥50,000与信枠を全額解放しました。"
          : `¥${done.capturedJpy.toLocaleString()}を請求し、与信枠の残りを解放しました。`}
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-camly-line p-4 space-y-3">
      <label className="block">
        <span className="block text-xs text-camly-inkMuted mb-1.5">管理者ID(AdminUser.id)</span>
        <input
          value={adminUserId}
          onChange={(e) => setAdminUserId(e.target.value)}
          className="w-full rounded-lg bg-camly-charcoal border border-camly-line px-4 py-2.5 text-sm"
        />
      </label>
      <label className="block">
        <span className="block text-xs text-camly-inkMuted mb-1.5">メモ(任意)</span>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-lg bg-camly-charcoal border border-camly-line px-4 py-2.5 text-sm"
        />
      </label>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleSubmit("waive")}
          disabled={submittingAction !== null}
          className="flex-1 rounded-full border border-camly-line text-camly-ink font-bold py-3 text-sm disabled:opacity-50"
        >
          {submittingAction === "waive" ? "処理中…" : "請求せず与信枠を解除"}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit("capture")}
          disabled={submittingAction !== null}
          className="flex-[2] rounded-full bg-camly-accent text-camly-black font-bold py-3 text-sm disabled:opacity-50"
        >
          {submittingAction === "capture"
            ? "処理中…"
            : `承認して利用料${finalAmountJpy != null ? `¥${finalAmountJpy.toLocaleString()}` : ""}を請求`}
        </button>
      </div>
    </div>
  );
}

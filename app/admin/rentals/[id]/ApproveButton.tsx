"use client";

/**
 * 返却承認ボタン(§10, §15)。
 * 既存の POST /api/admin/rentals/:id/approve-return を呼ぶ。管理者が動画を見て3択で判断する:
 * - 「利用額のみ請求」: finalAmountJpyだけpartial captureし、¥50,000与信枠の残りは自動解放(通常ケース)
 * - 「利用額とオーソリ額を請求」: 安心プラン加入中はその上限額、未加入なら¥50,000与信枠を全額capture(破損等)
 * - 「請求しない」: 何も請求せず、¥50,000与信枠を丸ごと解放(PaymentIntentをcancel)
 *
 * ⚠ 管理者認証未実装(admin/page.tsxと同じTODO)。まだ個人アカウントが無いため、
 * adminUserIdは入力させず固定値("admin-web")を送る(APIの監査ログ用必須項目を満たすためだけの仮値)。
 * その代わり、実際にお金が動く操作なので押した直後に確認ダイアログを挟む。
 */
import { useState } from "react";

type ApproveAction = "capture_usage" | "capture_full" | "waive";

const ADMIN_ACTOR_ID = "admin-web";

const ACTION_LABELS: Record<ApproveAction, string> = {
  capture_usage: "利用額のみ請求",
  capture_full: "利用額とオーソリ額を請求",
  waive: "請求しない",
};

export function ApproveButton({
  rentalId,
  finalAmountJpy,
  fullCaptureJpy,
}: {
  rentalId: string;
  finalAmountJpy: number | null;
  fullCaptureJpy: number | null;
}) {
  const [submittingAction, setSubmittingAction] = useState<ApproveAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ action: ApproveAction; capturedJpy: number } | null>(null);

  function confirmationText(action: ApproveAction): string {
    if (action === "waive") return "請求せず、¥50,000の与信枠を全額解放します。よろしいですか?この操作は取り消せません。";
    const amount = action === "capture_usage" ? finalAmountJpy : fullCaptureJpy;
    return `${ACTION_LABELS[action]}(¥${amount != null ? amount.toLocaleString() : "-"})を実行します。よろしいですか?この操作は取り消せません。`;
  }

  async function handleSubmit(action: ApproveAction) {
    if (!window.confirm(confirmationText(action))) return;
    setSubmittingAction(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/rentals/${rentalId}/approve-return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUserId: ADMIN_ACTOR_ID, action }),
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
    const messages: Record<ApproveAction, string> = {
      waive: "請求せず与信枠を全額解放しました。",
      capture_full: `¥${done.capturedJpy.toLocaleString()}を請求し、与信枠の残りを解放しました。`,
      capture_usage: `利用額¥${done.capturedJpy.toLocaleString()}を請求し、与信枠の残りを解放しました。`,
    };
    return <p className="text-camly-accent font-bold text-sm">{messages[done.action]}</p>;
  }

  return (
    <div className="rounded-xl border border-camly-line p-4 space-y-3">
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="button"
        onClick={() => handleSubmit("capture_usage")}
        disabled={submittingAction !== null}
        className="w-full rounded-full bg-camly-accent text-camly-black font-bold py-3 text-sm disabled:opacity-50"
      >
        {submittingAction === "capture_usage"
          ? "処理中…"
          : `利用額のみ請求${finalAmountJpy != null ? `(¥${finalAmountJpy.toLocaleString()})` : ""}`}
      </button>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => handleSubmit("capture_full")}
          disabled={submittingAction !== null}
          className="flex-1 rounded-full border border-camly-line text-camly-ink font-bold py-3 text-sm disabled:opacity-50"
        >
          {submittingAction === "capture_full"
            ? "処理中…"
            : `利用額とオーソリ額を請求${fullCaptureJpy != null ? `(¥${fullCaptureJpy.toLocaleString()})` : ""}`}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit("waive")}
          disabled={submittingAction !== null}
          className="flex-1 rounded-full border border-camly-line text-camly-ink font-bold py-3 text-sm disabled:opacity-50"
        >
          {submittingAction === "waive" ? "処理中…" : "請求しない"}
        </button>
      </div>
    </div>
  );
}

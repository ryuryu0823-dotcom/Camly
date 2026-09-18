"use client";

/**
 * 物理キーボックス暗証番号の設定フォーム(§17)。
 * POST /api/admin/boxes/:id/unlock-code を呼ぶ。設定後、次にRENTED状態になった
 * Rentalの利用中画面(/app/rentals/[token])で一度だけ利用者に案内される。
 *
 * ⚠ 管理者認証未実装(ApproveButtonと同じTODO)。まだ個人アカウントが無いため、
 * adminUserIdは入力させず固定値("admin-web")を送る(APIの監査ログ用必須項目を満たすためだけの仮値)。
 */
import { useState } from "react";

const ADMIN_ACTOR_ID = "admin-web";

export function UnlockCodeEditor({ boxId, currentCode }: { boxId: string; currentCode: string | null }) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCode, setSavedCode] = useState<string | null>(null);

  async function handleSave() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/boxes/${boxId}/unlock-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUserId: ADMIN_ACTOR_ID, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "更新に失敗しました");
      setSavedCode(code);
      setCode("");
    } catch (err: any) {
      setError(err.message ?? "エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-camly-line p-4 space-y-3">
      <p className="text-xs text-camly-inkMuted">
        現在設定中の番号: <strong className="text-camly-ink">{savedCode ?? currentCode ?? "未設定"}</strong>
      </p>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="4〜8桁の数字"
        inputMode="numeric"
        className="w-full rounded-lg bg-camly-charcoal border border-camly-line px-4 py-2.5 text-base"
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="button"
        onClick={handleSave}
        disabled={submitting}
        className="w-full rounded-full bg-camly-accent text-camly-black font-bold py-2.5 text-sm disabled:opacity-50"
      >
        {submitting ? "保存中…" : "暗証番号を更新"}
      </button>
    </div>
  );
}

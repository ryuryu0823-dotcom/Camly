"use client";

/**
 * 物理キーボックス暗証番号の設定フォーム(§17)。
 * POST /api/admin/boxes/:id/unlock-code を呼ぶ。設定後、次にRENTED状態になった
 * Rentalの利用中画面(/app/rentals/[token])で一度だけ利用者に案内される。
 */
import { useState } from "react";

export function UnlockCodeEditor({ boxId, currentCode }: { boxId: string; currentCode: string | null }) {
  const [code, setCode] = useState("");
  const [adminUserId, setAdminUserId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCode, setSavedCode] = useState<string | null>(null);

  async function handleSave() {
    if (!adminUserId) {
      setError("管理者ID(AdminUser.id)を入力してください。");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/boxes/${boxId}/unlock-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUserId, code }),
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
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="4〜8桁の数字"
          className="flex-1 rounded-lg bg-camly-charcoal border border-camly-line px-4 py-2.5 text-sm"
        />
        <input
          value={adminUserId}
          onChange={(e) => setAdminUserId(e.target.value)}
          placeholder="管理者ID"
          className="flex-1 rounded-lg bg-camly-charcoal border border-camly-line px-4 py-2.5 text-sm"
        />
      </div>
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

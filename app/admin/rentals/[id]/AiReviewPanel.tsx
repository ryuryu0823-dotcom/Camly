"use client";

/**
 * AI一次判定パネル(§10, §21)。
 * POST /api/admin/rentals/:id/ai-review を呼び、返却写真をAIに確認させる。
 * あくまで参考所見であり、承認・請求の最終判断はこのページの下にある
 * ApproveButton/ForceReleaseButtonで管理者自身が行う(自動承認はしない)。
 */
import { useState } from "react";

interface ReviewItem {
  stepKey: string;
  label: string;
  ok: boolean;
  note: string;
}

interface ReviewResult {
  overall: "PASS" | "HUMAN_REVIEW";
  items: ReviewItem[];
  summary: string;
}

export function AiReviewPanel({
  rentalId,
  initialResult,
  initialNotes,
}: {
  rentalId: string;
  initialResult: string | null;
  initialNotes: string | null;
}) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReviewResult | null>(null);

  async function handleRun() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/rentals/${rentalId}/ai-review`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI判定に失敗しました");
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? "エラーが発生しました");
    } finally {
      setRunning(false);
    }
  }

  const overall = result?.overall ?? initialResult;

  return (
    <div className="rounded-xl border border-camly-line p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">AI一次判定(参考所見)</p>
        {overall && (
          <span
            className={`text-xs font-bold px-2 py-1 rounded ${
              overall === "PASS" ? "bg-camly-accent text-camly-black" : "bg-camly-charcoal text-camly-accentSoft"
            }`}
          >
            {overall === "PASS" ? "問題なし" : "要確認"}
          </span>
        )}
      </div>

      {!result && initialNotes && <p className="text-xs text-camly-inkMuted whitespace-pre-line">{initialNotes}</p>}

      {result && (
        <div className="space-y-1.5">
          <p className="text-xs text-camly-inkMuted">{result.summary}</p>
          {result.items.map((item) => (
            <p key={item.stepKey} className="text-xs">
              <span className={item.ok ? "text-camly-accent" : "text-camly-accentSoft"}>{item.ok ? "✓" : "△"}</span>{" "}
              <span className="text-camly-inkMuted">
                {item.label}: {item.note}
              </span>
            </p>
          ))}
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        type="button"
        onClick={handleRun}
        disabled={running}
        className="w-full rounded-full border border-camly-line text-camly-ink font-bold py-2.5 text-sm disabled:opacity-50"
      >
        {running ? "判定中…" : overall ? "AI判定をやり直す" : "AI判定を実行"}
      </button>
      <p className="text-[10px] text-camly-inkMuted">
        AIの所見は参考情報です。実際の承認・請求は下の操作から管理者が判断してください。
      </p>
    </div>
  );
}

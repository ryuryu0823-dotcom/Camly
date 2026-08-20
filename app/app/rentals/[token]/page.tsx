"use client";

/**
 * 利用中画面(§4 `/app/rentals/[token]`, §6 step10)。
 * 経過時間・現在の料金目安・暗証番号(初回のみ)・返却ボタンを表示する。
 */
import { useEffect, useState } from "react";

interface RentalStatusResponse {
  status: string;
  device: { model: string };
  rentalStartedAt: string | null;
  unlockCode: string | null;
  estimate: { totalJpy: number; durationMinutes: number; appliedTierLabel: string } | null;
}

export default function RentalActivePage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<RentalStatusResponse | null>(null);
  const [revealedCode, setRevealedCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const res = await fetch(`/api/rentals/${params.token}`);
      if (!res.ok) return;
      const json: RentalStatusResponse = await res.json();
      if (cancelled) return;
      setData(json);
      if (json.unlockCode) setRevealedCode(json.unlockCode); // 一度だけ来る値をローカルに保持し続ける
    }
    poll();
    const interval = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [params.token]);

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-camly-inkMuted text-sm">読み込み中…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-16 max-w-lg mx-auto">
      <p className="text-camly-accent text-xs tracking-widest font-bold mb-2">利用中</p>
      <h1 className="text-2xl font-bold mb-8">{data.device.model}</h1>

      {revealedCode && (
        <div className="rounded-xl bg-camly-charcoal border border-camly-line p-6 mb-6 text-center">
          <p className="text-xs text-camly-inkMuted mb-2">キーボックス暗証番号</p>
          <p className="text-4xl font-bold tracking-[0.3em]">{revealedCode}</p>
        </div>
      )}

      {data.estimate && (
        <div className="rounded-xl border border-camly-line p-5 mb-8 space-y-2">
          <Row label="経過時間" value={`${Math.floor(data.estimate.durationMinutes / 60)}時間${data.estimate.durationMinutes % 60}分`} />
          <Row label="現在の料金目安" value={`¥${data.estimate.totalJpy.toLocaleString()}`} />
          <p className="text-[11px] text-camly-inkMuted pt-1">
            最終金額は返却申請成立時刻に自動確定します。表示額は参考値です。
          </p>
        </div>
      )}

      <a
        href={`/app/rentals/${params.token}/return`}
        className="block text-center w-full rounded-full bg-camly-accent text-camly-black font-bold py-4 text-sm"
      >
        返却する
      </a>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-camly-inkMuted">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

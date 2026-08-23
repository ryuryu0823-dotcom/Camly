"use client";

/**
 * 利用中画面(§4 `/app/rentals/[token]`, §6 step10)。
 * 暗証番号(初回のみ)・使い方ステップ・経過時間・現在の料金目安・返却ボタンを表示する。
 * 暗証番号と使い方は「一目で分かる」ことを優先し、画面上部にまとめて配置している。
 */
import { useEffect, useState } from "react";

interface RentalStatusResponse {
  status: string;
  device: { model: string };
  rentalStartedAt: string | null;
  unlockCode: string | null;
  estimate: { totalJpy: number; durationMinutes: number; appliedTierLabel: string } | null;
}

const USAGE_STEPS: [string, string][] = [
  ["01", "上の暗証番号をキーボックスに入力して解錠"],
  ["02", "カメラ・付属品一式を取り出す"],
  ["03", "使い終わったら下の「返却する」から返却手続きへ"],
];

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
      <h1 className="text-2xl font-bold mb-6">{data.device.model}</h1>

      {revealedCode && (
        <div className="rounded-xl bg-camly-charcoal border-2 border-camly-accent p-6 mb-4 text-center">
          <p className="text-xs text-camly-inkMuted mb-2">キーボックス暗証番号</p>
          <p className="text-5xl font-bold tracking-[0.3em] text-camly-accent">{revealedCode}</p>
        </div>
      )}

      <div className="rounded-xl border border-camly-line divide-y divide-camly-line mb-8">
        {USAGE_STEPS.map(([num, text]) => (
          <div key={num} className="flex items-center gap-4 px-5 py-4">
            <span className="text-camly-accentSoft font-bold text-lg shrink-0 w-6">{num}</span>
            <p className="text-sm">{text}</p>
          </div>
        ))}
      </div>

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
      <a
        href="/"
        className="flex items-center justify-center gap-1.5 rounded-full border border-camly-line text-camly-ink text-xs font-bold px-5 py-2.5 mt-4"
      >
        Camlyについて詳しく見る
        <span aria-hidden>→</span>
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

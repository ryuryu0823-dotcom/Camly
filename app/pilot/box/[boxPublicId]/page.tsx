"use client";

/**
 * Phase A貸出フロー入口(§4 `/pilot/box/[boxPublicId]`, §6)。
 * QRを読み取った直後にブランド説明画面(intro)を挟み、「はじめる」タップで
 * 本人情報・同意取得フォーム(form)に切り替わる。フォーム自体はPOST /api/pilot/rentals
 * → Stripe Checkoutへのリダイレクトという既存の流れそのまま。
 */
import { useEffect, useState } from "react";

interface CarePlanInfo {
  id: string;
  priceJpy: number;
  liabilityCapJpy: number | null;
}

export default function PilotBoxPage({ params }: { params: { boxPublicId: string } }) {
  const [view, setView] = useState<"intro" | "form">("intro");
  const [form, setForm] = useState({ name: "", email: "", phone: "", stayReservationName: "" });
  const [agreed, setAgreed] = useState(false);
  const [carePlanOptIn, setCarePlanOptIn] = useState(false);
  const [carePlan, setCarePlan] = useState<CarePlanInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentVersionIds, setConsentVersionIds] = useState<string[] | null>(null);

  useEffect(() => {
    fetch("/api/consent-versions/current")
      .then((r) => r.json())
      .then((data) => {
        if (data.consentVersionIds) setConsentVersionIds(data.consentVersionIds);
      })
      .catch(() => setError("規約情報の取得に失敗しました。時間をおいて再度お試しください。"));

    fetch("/api/care-plans/current")
      .then((r) => r.json())
      .then((data) => {
        if (data.plan) setCarePlan(data.plan);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) {
      setError("利用規約・補償規定・プライバシーポリシーへの同意が必要です。");
      return;
    }
    if (!consentVersionIds) {
      setError("規約情報を読み込み中です。少し待ってから再度お試しください。");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pilot/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boxPublicId: params.boxPublicId,
          name: form.name,
          email: form.email,
          phone: form.phone,
          stayReservationName: form.stayReservationName || undefined,
          consentVersionIds,
          carePlanId: carePlanOptIn && carePlan ? carePlan.id : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "エラーが発生しました");
        setLoading(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError("通信エラーが発生しました");
      setLoading(false);
    }
  }

  if (view === "intro") {
    return <IntroScreen onStart={() => setView("form")} />;
  }

  return (
    <main className="min-h-screen px-6 py-16 max-w-lg mx-auto animate-fadeIn">
      <h1 className="text-2xl font-bold mb-2">カメラをレンタルする</h1>
      <p className="text-camly-inkMuted text-sm mb-8">SONY Cyber-shot DSC-RX100M3 / nasu room MINI</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="お名前" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field label="メールアドレス" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        <Field label="電話番号" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
        <Field
          label="宿泊予約名(任意)"
          value={form.stayReservationName}
          onChange={(v) => setForm({ ...form, stayReservationName: v })}
        />

        <div className="rounded-xl border border-camly-line p-4 text-xs text-camly-inkMuted leading-relaxed">
          決済時に¥50,000のカード利用枠を一時的に確保します(保証枠)。正常返却後、利用料以外は請求しません。
        </div>

        {carePlan && (
          <label className="flex items-start gap-3 rounded-xl border border-camly-line p-4 cursor-pointer">
            <input
              type="checkbox"
              checked={carePlanOptIn}
              onChange={(e) => setCarePlanOptIn(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-sm">
              <span className="font-bold">安心プラン(+¥{carePlan.priceJpy.toLocaleString()})</span>
              <span className="block text-xs text-camly-inkMuted mt-1 leading-relaxed">
                通常使用中に偶発的な破損があった場合の請求上限を¥
                {carePlan.liabilityCapJpy?.toLocaleString() ?? "-"}
                に抑えます。紛失・盗難・故意/重過失等は対象外です。
                <a href="/care" className="underline">
                  詳しくはこちら
                </a>
              </span>
            </span>
          </label>
        )}

        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1" />
          <span>
            <a href="/terms" className="underline">
              利用規約
            </a>
            、
            <a href="/care" className="underline">
              補償規定
            </a>
            、
            <a href="/privacy" className="underline">
              プライバシーポリシー
            </a>
            に同意します。
          </span>
        </label>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-camly-accent text-camly-black font-bold py-4 text-sm disabled:opacity-50"
        >
          {loading ? "処理中…" : "同意して決済へ進む"}
        </button>
      </form>
    </main>
  );
}

const INTRO_STEPS: [string, string][] = [
  ["01", "決済(お名前とカード情報を登録)"],
  ["02", "表示された暗証番号でキーボックスを解錠"],
  ["03", "カメラを楽しむ"],
];

const PRICING_TIERS: [string, string][] = [
  ["3時間以内", "¥990"],
  ["12時間以内", "¥1,490"],
  ["12時間以降", "¥1,990"],
];

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden animate-fadeIn">
      {/* 装飾: 絞り(アパーチャ)を思わせる同心円。カメラという被写体そのものから着想。 */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[520px] h-[520px] rounded-full border border-camly-line/60" />
        <div className="absolute w-[380px] h-[380px] rounded-full border border-camly-line/50" />
        <div className="absolute w-[240px] h-[240px] rounded-full border border-camly-accent/25" />
        <div className="absolute w-[240px] h-[240px] rounded-full bg-camly-accent/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
        <p className="text-camly-accentSoft text-[11px] tracking-[0.3em] font-bold mb-5">NASU ROOM MINI</p>

        <h1 className="text-6xl font-bold tracking-tight mb-4">Camly</h1>

        <p className="text-camly-ink text-base leading-relaxed mb-1 text-balance">
          あらゆる場所に、
          <br />
          新しい可能性を。
        </p>
        <p className="text-camly-inkMuted text-xs leading-relaxed mb-10">
          この場所に置かれたカメラを、
          <br />
          スマホひとつでその場からレンタルできます。
        </p>

        <div className="w-full rounded-xl border border-camly-line bg-camly-charcoal/60 backdrop-blur-sm divide-y divide-camly-line mb-6">
          {INTRO_STEPS.map(([num, text]) => (
            <div key={num} className="flex items-center gap-4 px-5 py-3.5 text-left">
              <span className="text-camly-accentSoft font-bold text-sm shrink-0 w-5">{num}</span>
              <p className="text-xs text-camly-ink">{text}</p>
            </div>
          ))}
        </div>

        <div className="w-full rounded-xl border border-camly-line px-5 py-4 mb-10">
          <p className="text-[10px] text-camly-inkMuted tracking-wider mb-3">料金(利用時間に応じて自動確定)</p>
          <div className="flex justify-between gap-2">
            {PRICING_TIERS.map(([label, price]) => (
              <div key={label} className="flex-1 text-left">
                <p className="text-[10px] text-camly-inkMuted mb-0.5">{label}</p>
                <p className="text-lg font-bold text-camly-accent tabular-nums">{price}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-camly-inkMuted mt-3 pt-3 border-t border-camly-line">
            +¥200の安心プランで、破損時の請求上限を¥3,000に抑えられます(次の画面で選択)。
          </p>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="w-full rounded-full bg-camly-accent text-camly-black font-bold py-4 text-sm active:scale-[0.98] transition-transform"
        >
          はじめる
        </button>
        <p className="text-camly-inkMuted text-[10px] mt-4">SONY Cyber-shot DSC-RX100M3 を今すぐレンタル</p>
        <a
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-camly-line text-camly-ink text-xs font-bold px-5 py-2.5 mt-6"
        >
          Camlyについて詳しく見る
          <span aria-hidden>→</span>
        </a>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-camly-inkMuted mb-1.5">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-camly-charcoal border border-camly-line px-4 py-3 text-sm outline-none focus:border-camly-accent"
      />
    </label>
  );
}

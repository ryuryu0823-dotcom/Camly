"use client";

/**
 * Phase A貸出フロー入口(§4 `/pilot/box/[boxPublicId]`, §6)。
 * 本人情報・同意取得 → POST /api/pilot/rentals → Stripe Checkoutへリダイレクト。
 */
import { useEffect, useState } from "react";

export default function PilotBoxPage({ params }: { params: { boxPublicId: string } }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", stayReservationName: "" });
  const [agreed, setAgreed] = useState(false);
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

  return (
    <main className="min-h-screen px-6 py-16 max-w-lg mx-auto">
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

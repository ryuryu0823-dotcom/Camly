const FAQS: [string, string][] = [
  ["予約は必要ですか?", "不要です。現地のQRを読んでその場でお借りいただけます。"],
  ["返却が遅れそうな場合は?", "利用中画面から延長方法をご案内します(準備中)。"],
  ["カメラを壊してしまったら?", "Camly Care補償の範囲内かどうかをご案内します。詳細はCamly Careページをご覧ください。"],
];

export default function FaqPage() {
  return (
    <main className="min-h-screen px-6 py-16 max-w-2xl mx-auto">
      <p className="text-camly-accent text-xs font-bold mb-2">DRAFT</p>
      <h1 className="text-2xl font-bold mb-8">よくある質問</h1>
      <div className="space-y-6">
        {FAQS.map(([q, a]) => (
          <div key={q}>
            <p className="font-bold text-sm mb-1">{q}</p>
            <p className="text-camly-inkMuted text-sm">{a}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

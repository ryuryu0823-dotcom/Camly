export default function CarePage() {
  return (
    <main className="min-h-screen px-6 py-16 max-w-2xl mx-auto">
      <p className="text-camly-accent text-xs font-bold mb-2">DRAFT — 未確定</p>
      <h1 className="text-2xl font-bold mb-6">Camly Care 補償規定(v1-draft)</h1>
      <p className="text-camly-inkMuted text-sm leading-relaxed mb-4">
        Camly Careは保険会社の商品ではなく、Camly独自の補償制度です(§9)。
      </p>
      <ul className="text-sm text-camly-inkMuted space-y-2 list-disc list-inside">
        <li>Careあり: 通常使用中の偶発的な一部破損は利用者負担上限¥5,000</li>
        <li>Careなし: 合理的な修理・検査・配送実費、原則として事故時点の個体時価まで</li>
        <li>対象外: 紛失・盗難・未返却・故意/重過失・水没・無断分解・転貸・規約違反・必要な警察届なし</li>
        <li>通常損耗・貸出前の傷・自然故障は請求しない</li>
      </ul>
      <p className="text-camly-inkMuted text-xs mt-6">
        Camly Careを必須/任意のどちらにするか、および請求文言の最終確定は未決事項です(LAUNCH_BLOCKERS.md参照)。
      </p>
    </main>
  );
}

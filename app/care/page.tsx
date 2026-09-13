export default function CarePage() {
  return (
    <main className="min-h-screen px-6 py-16 max-w-2xl mx-auto">
      <p className="text-camly-accent text-xs font-bold mb-2">DRAFT — 未確定</p>
      <h1 className="text-2xl font-bold mb-2">Camly Care 補償規定</h1>
      <p className="text-camly-inkMuted text-xs mb-8">v1-draft</p>

      <p className="text-camly-inkMuted text-xs leading-relaxed mb-10 rounded-lg border border-camly-line p-4">
        この補償規定はドラフトであり、正式な法的レビューを経ていません。公開前に必ず弁護士等による確認のうえ
        確定版へ差し替えてください。
      </p>

      <div className="space-y-8 text-sm text-camly-ink leading-relaxed">
        <section>
          <h2 className="font-bold mb-2">Camly Careとは</h2>
          <p>
            Camly Care(安心プラン)は、保険会社が提供する保険商品ではなく、Camly独自の補償制度です。通常使用中に生じた偶発的な破損について、利用者の負担額に上限を設けるものです。
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2">安心プラン未加入の場合</h2>
          <p className="text-camly-inkMuted">
            通常使用の範囲を超える破損・故障が生じた場合、当社は現物確認のうえ、合理的な修理・検査・配送実費を、保証枠(¥50,000)の範囲内で請求することがあります。請求額は原則として事故発生時点のカメラ機材の時価を上限とします。
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2">安心プラン加入の場合(+¥200)</h2>
          <p className="text-camly-inkMuted">
            通常使用中の偶発的な一部破損について、利用者の負担上限は<strong className="text-camly-ink">¥3,000</strong>となります。上限を超える修理費用が生じた場合でも、対象範囲内であれば差額をご請求することはありません。
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2">補償の対象外となる場合</h2>
          <p className="text-camly-inkMuted mb-2">
            安心プランへの加入有無にかかわらず、以下に該当する場合は上限の適用対象外とし、実費(保証枠の範囲内)をご請求します。
          </p>
          <ul className="list-disc list-inside space-y-1 text-camly-inkMuted">
            <li>紛失・盗難・未返却</li>
            <li>故意または重大な過失による破損</li>
            <li>水没・水濡れ</li>
            <li>無断分解・改造</li>
            <li>第三者への転貸</li>
            <li>利用規約違反に起因する破損</li>
            <li>盗難の場合で、必要な警察への届出(盗難届)がなされていないとき</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold mb-2">補償の対象とならない損耗</h2>
          <p className="text-camly-inkMuted">
            通常使用に伴う経年劣化・自然損耗、貸出前から存在した傷や不具合については、安心プランの加入有無にかかわらず利用者に請求しません。
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2">確認・請求の手続き</h2>
          <p className="text-camly-inkMuted">
            返却時にご提出いただく撮影内容(カメラ本体・付属品・Box施錠状態等)を当社が確認し、破損等が疑われる場合は現物確認のうえ請求内容を判断します。判定結果および請求額については、登録いただいたメールアドレス宛にご連絡します。
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2">SDカードのデータについて</h2>
          <p className="text-camly-inkMuted">
            返却時点でSDカードにお客様のデータが残っていた場合、その閲覧・削除・消失を含め当社は一切の責任を負いません。返却前に必ずご自身でデータの転送・バックアップを行ってください(利用規約第9条参照)。
          </p>
        </section>
      </div>
    </main>
  );
}

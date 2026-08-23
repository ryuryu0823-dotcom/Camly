export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-16 max-w-2xl mx-auto">
      <p className="text-camly-accent text-xs font-bold mb-2">DRAFT — 未確定</p>
      <h1 className="text-2xl font-bold mb-2">プライバシーポリシー</h1>
      <p className="text-camly-inkMuted text-xs mb-8">v1-draft</p>

      <p className="text-camly-inkMuted text-xs leading-relaxed mb-10 rounded-lg border border-camly-line p-4">
        このプライバシーポリシーはドラフトであり、正式な法的レビューを経ていません。公開前に必ず弁護士等による確認のうえ
        確定版へ差し替えてください(事業者名・連絡先等は未確定のため仮のプレースホルダーです)。
      </p>

      <div className="space-y-8 text-sm text-camly-ink leading-relaxed">
        <section>
          <h2 className="font-bold mb-2">1. 事業者情報</h2>
          <p className="text-camly-inkMuted">
            【事業者名】(以下「当社」)は、カメラレンタルサービス「Camly」(以下「本サービス」)における利用者の個人情報を、以下のとおり取り扱います。
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2">2. 取得する情報</h2>
          <ul className="list-disc list-inside space-y-1 text-camly-inkMuted">
            <li>氏名、電話番号、メールアドレス</li>
            <li>
              決済情報(クレジットカード情報)— 当社サーバーには保存せず、決済代行事業者(Stripe, Inc.)が直接取得・管理します
            </li>
            <li>返却時にご提出いただく動画・写真(カメラ本体・付属品・Box施錠状態の確認用)</li>
            <li>アクセスログ、利用日時、利用時間等の利用履歴</li>
            <li>宿泊予約名等、貸出の任意項目としてご入力いただいた情報</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold mb-2">3. 利用目的</h2>
          <ul className="list-disc list-inside space-y-1 text-camly-inkMuted">
            <li>本人確認、貸出・返却手続きの実施</li>
            <li>利用料金・保証枠の決済処理</li>
            <li>破損・紛失等が生じた場合の状況確認・証跡保全</li>
            <li>カスタマーサポート、お問い合わせへの対応</li>
            <li>不正利用の防止、規約違反への対応</li>
            <li>サービス改善のための統計的分析(個人を特定しない形式)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold mb-2">4. 保存期間</h2>
          <p className="text-camly-inkMuted">
            返却時にご提出いただく動画・写真は、原則として取得から90日間保存した後、削除します。ただし、破損・紛失等のトラブルや、異議申立て・紛争が生じ解決に至っていない場合は、解決までの間、保存期間を延長することがあります(リーガルホールド)。氏名・電話番号・メールアドレス等は、法令上必要な期間、または問い合わせ対応・不正防止に必要な範囲で保存します。
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2">5. 第三者提供・業務委託</h2>
          <p className="text-camly-inkMuted mb-2">
            当社は、以下の場合を除き、あらかじめ利用者の同意を得ることなく個人情報を第三者に提供しません。
          </p>
          <ul className="list-disc list-inside space-y-1 text-camly-inkMuted">
            <li>決済処理のため、決済代行事業者(Stripe, Inc.)に必要な情報を提供する場合</li>
            <li>返却動画・写真の保管のため、クラウドストレージ事業者に業務委託する場合</li>
            <li>法令に基づき開示が求められた場合</li>
            <li>人の生命、身体または財産の保護のために必要があり、本人の同意を得ることが困難な場合</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold mb-2">6. Cookie等の利用</h2>
          <p className="text-camly-inkMuted">
            本サービスは、利用状況の把握やサービス改善のためCookie等の技術を利用することがあります。これにより個人を特定する情報を取得するものではありません。
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2">7. 安全管理措置</h2>
          <p className="text-camly-inkMuted">
            当社は、取得した個人情報の漏えい、滅失またはき損の防止その他の安全管理のため、必要かつ適切な措置を講じます。決済情報はStripe社の管理下に置かれ、当社サーバーには保存しません。
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2">8. SDカードのデータについて</h2>
          <p className="text-camly-inkMuted">
            利用者がカメラで撮影したデータ(SDカード内のデータ)は、利用者ご自身の情報であり、当社が取得・保存するものではありません。返却前に必ずご自身でデータの転送・バックアップを行ってください。返却時点でSDカードにデータが残っていた場合の取扱い(閲覧・削除・消失を含む)について、当社は一切の責任を負いません。
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2">9. 開示・訂正・削除等のご請求</h2>
          <p className="text-camly-inkMuted">
            利用者は、当社が保有する自己の個人情報について、法令に基づき開示・訂正・利用停止・削除等を請求することができます。ご希望の場合は、下記お問い合わせ窓口までご連絡ください。
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2">10. お問い合わせ窓口</h2>
          <p className="text-camly-inkMuted">
            事業者名: 【事業者名】
            <br />
            住所: 【住所】
            <br />
            メール: 【問い合わせ用メールアドレス】
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2">11. 本ポリシーの改定</h2>
          <p className="text-camly-inkMuted">
            当社は、必要に応じて本ポリシーの内容を変更することがあります。変更後の内容は、本ページに掲載した時点から効力を生じるものとします。
          </p>
        </section>
      </div>
    </main>
  );
}

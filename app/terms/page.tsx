export default function TermsPage() {
  return (
    <main className="min-h-screen px-6 py-16 max-w-2xl mx-auto">
      <p className="text-camly-accent text-xs font-bold mb-2">DRAFT — 未確定</p>
      <h1 className="text-2xl font-bold mb-2">利用規約</h1>
      <p className="text-camly-inkMuted text-xs mb-8">v1-draft</p>

      <p className="text-camly-inkMuted text-xs leading-relaxed mb-10 rounded-lg border border-camly-line p-4">
        この利用規約はドラフトであり、正式な法的レビューを経ていません。公開前に必ず弁護士等による確認のうえ
        確定版へ差し替えてください(事業者名・住所・連絡先等は未確定のため仮のプレースホルダーです。
        詳細はLAUNCH_BLOCKERS.mdを参照)。
      </p>

      <div className="space-y-8 text-sm text-camly-ink leading-relaxed">
        <Article num="1" title="適用">
          <p>
            本規約は、【事業者名】(以下「当社」といいます)が提供するカメラレンタルサービス「Camly」(以下「本サービス」)の利用条件を定めるものです。利用者は、本サービスを利用することにより本規約に同意したものとみなされます。
          </p>
        </Article>

        <Article num="2" title="定義">
          <ul className="list-disc list-inside space-y-1 text-camly-inkMuted">
            <li>「Box」とは、カメラ機材を収納する無人設置型の保管庫をいいます。</li>
            <li>「貸出」とは、利用者がBoxからカメラ機材を取り出し、利用を開始することをいいます。</li>
            <li>「返却」とは、利用者がカメラ機材一式をBoxへ収納し、返却手続きを完了することをいいます。</li>
            <li>「保証枠」とは、貸出時にクレジットカードへ一時的に確保される利用枠(第6条)をいいます。</li>
          </ul>
        </Article>

        <Article num="3" title="利用登録">
          <p>
            利用者は、本サービスの利用にあたり、氏名・電話番号・メールアドレス・支払い用クレジットカード情報を登録するものとします。虚偽の情報を登録した場合、当社は利用をお断りすることがあります。未成年者は親権者等の同意を得たうえで利用してください。
          </p>
        </Article>

        <Article num="4" title="貸出の申込・成立">
          <p>
            利用者は、設置場所に掲示されたQRコードを読み取り、画面の案内に従って情報を登録し、本規約・Camly補償規定・プライバシーポリシーに同意のうえ決済手続き(第6条)を完了することで貸出契約が成立します。決済(カード登録・保証枠の確保)が完了しない場合、貸出は成立しません。
          </p>
        </Article>

        <Article num="5" title="利用料金">
          <p>利用料金は、貸出開始時刻から返却申請成立時刻までの経過時間に応じて自動的に確定します(表示額は目安であり、最終金額は返却成立時刻を基準に確定します)。</p>
          <table className="w-full text-xs mt-3 border border-camly-line rounded-lg overflow-hidden">
            <tbody>
              <tr className="border-b border-camly-line">
                <td className="px-3 py-2 text-camly-inkMuted">3時間以内</td>
                <td className="px-3 py-2 text-right font-bold tabular-nums">¥990</td>
              </tr>
              <tr className="border-b border-camly-line">
                <td className="px-3 py-2 text-camly-inkMuted">12時間以内</td>
                <td className="px-3 py-2 text-right font-bold tabular-nums">¥1,490</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-camly-inkMuted">12時間超(以降は一律)</td>
                <td className="px-3 py-2 text-right font-bold tabular-nums">¥1,990</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-camly-inkMuted mt-2">料金は予告のうえ改定する場合があります。</p>
        </Article>

        <Article num="6" title="保証枠(与信枠)">
          <p>
            貸出開始時、当社は利用者のクレジットカードに対し¥50,000の利用枠を一時的に確保します(オーソリゼーション)。これは実際の請求ではなく、返却完了後、利用料金(および安心プラン加入時のご利用料金)のみを確定・請求し、残額は自動的に解放されます。破損・紛失等が生じた場合の取扱いはCamly補償規定(第10条)によります。
          </p>
        </Article>

        <Article num="7" title="安心プラン">
          <p>
            利用者は、貸出申込時に追加料金¥200を支払うことで「安心プラン」に加入できます。安心プラン加入中は、通常使用中に生じた偶発的な破損について、利用者の負担上限が¥3,000となります。適用範囲・対象外事項の詳細はCamly補償規定をご確認ください。
          </p>
        </Article>

        <Article num="8" title="利用者の義務・禁止事項">
          <p>利用者は、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
          <ul className="list-disc list-inside space-y-1 text-camly-inkMuted mt-2">
            <li>カメラ機材・付属品の第三者への転貸、譲渡、担保提供</li>
            <li>カメラ機材の分解、改造、記録媒体の抜き取り以外の内部操作</li>
            <li>法令、公序良俗に反する撮影・利用</li>
            <li>撮影対象者のプライバシー・肖像権を侵害する行為</li>
            <li>虚偽の情報登録、他人になりすましての利用</li>
            <li>本サービスの運営を妨害する行為</li>
          </ul>
        </Article>

        <Article num="9" title="返却">
          <p>
            利用者は、利用終了後速やかに、設置場所に掲示された返却用QRコードから返却手続きを行うものとします。返却手続きでは、カメラ本体・付属品一式・Boxの扉施錠状態等をサイト内カメラで撮影し、送信していただきます。撮影・送信内容の確認(現物確認)をもって返却が成立します。
          </p>
          <p className="mt-2">
            記録メディア(SDカード)については、返却前にご自身でデータをカードリーダー等へ転送してください。転送後にお使いの機器・アプリから「削除しますか?」等の確認が表示された場合は、次回以降のお客様が確実にご利用いただけるよう削除にご協力ください。<strong>返却時点でSDカードにデータが残っていた場合の当該データの取扱い(閲覧・削除・消失を含む)について、当社は一切の責任を負いません。</strong>大切なデータは必ず事前にご自身でバックアップしたうえで返却してください。
          </p>
        </Article>

        <Article num="10" title="破損・紛失時の責任">
          <p>
            カメラ機材の破損・紛失・盗難・未返却が生じた場合の利用者の負担範囲は、Camly補償規定に定めるところによります。当社は、現物確認・返却撮影内容の確認を経たうえで、保証枠の範囲内で利用料金に加え、必要な費用を請求することがあります。
          </p>
        </Article>

        <Article num="11" title="利用制限・強制返却">
          <p>
            利用者が本規約に違反した場合、または長時間の未返却等、当社が本サービスの適正な運営上必要と判断した場合、当社は利用者への事前の通知なく、保証枠からの請求、利用停止、その他必要な措置を講じることがあります。
          </p>
        </Article>

        <Article num="12" title="免責事項">
          <ul className="list-disc list-inside space-y-1 text-camly-inkMuted">
            <li>当社は、カメラ機材の故障・不具合により生じた撮影機会の損失について、責任を負いません。</li>
            <li>当社は、天災・停電・通信障害等、当社の責に帰さない事由による本サービスの提供不能について、責任を負いません。</li>
            <li>当社は、法令上許容される範囲を超えて利用者に生じた損害を賠償する責任を負いません。</li>
          </ul>
        </Article>

        <Article num="13" title="規約の変更">
          <p>
            当社は、必要と判断した場合、利用者への事前の通知なく本規約を変更することがあります。変更後の規約は、本ページに掲載した時点から効力を生じるものとします。
          </p>
        </Article>

        <Article num="14" title="準拠法・合意管轄">
          <p>
            本規約の解釈にあたっては日本法を準拠法とします。本サービスに関して紛争が生じた場合には、【管轄裁判所】を第一審の専属的合意管轄裁判所とします。
          </p>
        </Article>

        <Article num="15" title="お問い合わせ">
          <p>本サービスに関するお問い合わせは、以下までご連絡ください。</p>
          <p className="text-camly-inkMuted mt-1">
            事業者名: 【事業者名】
            <br />
            住所: 【住所】
            <br />
            電話番号: 【電話番号】
            <br />
            メール: 【問い合わせ用メールアドレス】
          </p>
        </Article>

        <Article num="附則" title="特定商取引法に基づく表示">
          <p className="text-camly-inkMuted">
            販売事業者名・所在地・電話番号・代表者名・返品/キャンセルに関する事項等、特定商取引法に基づく表示事項は別途確定し、本ページに掲載します(未確定。LAUNCH_BLOCKERS.md参照)。
          </p>
        </Article>
      </div>
    </main>
  );
}

function Article({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-bold mb-2">
        第{num}条 {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

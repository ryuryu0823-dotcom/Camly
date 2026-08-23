/**
 * ブランドLP(§4 `/`, §16)。
 * 黒/チャコール中心+オレンジアクセント。実証実験中であることを明示しつつ、
 * 料金・借り方・返し方まで一望できる構成にして、初見の信頼性を担保する。
 * 実写真素材は未提供のため、このバージョンはタイポグラフィ+装飾円中心の構成にしている。
 */
const PRICING_ROWS: [string, string][] = [
  ["3時間以内", "¥990"],
  ["12時間以内", "¥1,490"],
  ["12時間超(以降は一律)", "¥1,990"],
];

const BORROW_STEPS: [string, string][] = [
  ["01", "設置場所のQRコードを読み取る"],
  ["02", "お名前・連絡先を入力し、カード情報を登録(¥50,000を一時的に保証枠として確保)"],
  ["03", "表示された暗証番号でキーボックスを解錠し、カメラを取り出す"],
];

const RETURN_STEPS_SUMMARY: [string, string][] = [
  ["01", "返却用QRコードを読み取る(利用中の方のページへ自動でつながります)"],
  ["02", "サイト内カメラで本体・付属品・扉の状態をステップごとに撮影"],
  ["03", "内容を確認して送信。現物確認後、利用料以外は請求されません"],
];

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <section className="relative flex-1 flex flex-col justify-center px-6 md:px-16 py-24 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-60">
          <div className="w-[640px] h-[640px] rounded-full border border-camly-line/50 -translate-x-1/4" />
          <div className="absolute w-[440px] h-[440px] rounded-full border border-camly-line/40 -translate-x-1/4" />
          <div className="absolute w-[260px] h-[260px] rounded-full bg-camly-accent/10 blur-3xl -translate-x-1/4" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-camly-accent/40 px-3 py-1 mb-6 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-camly-accent" />
            <span className="text-camly-accentSoft text-[11px] font-bold tracking-wider">現在、実証実験(パイロット)期間中です</span>
          </div>

          <p className="text-camly-accent text-xs md:text-sm tracking-[0.2em] font-bold mb-6">CAMLY</p>
          <h1 className="text-4xl md:text-7xl font-bold leading-tight max-w-4xl">
            あらゆる場所に、
            <br />
            新しい可能性を。
          </h1>
          <p className="mt-6 text-camly-inkMuted text-base md:text-lg max-w-xl">
            Make every place more possible. — 洗練された宿、クラブ、撮影目的地に置く、無人カメラレンタル。
            予約もアプリも不要、QRを読んでその場で借りて、その場で返す。
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <a
              href="#locations"
              className="inline-flex items-center justify-center rounded-full bg-camly-accent text-camly-black font-bold px-8 py-4 text-sm tracking-wide"
            >
              カメラを借りる
            </a>
            <a
              href="/support"
              className="inline-flex items-center justify-center rounded-full border border-camly-line text-camly-ink font-bold px-8 py-4 text-sm tracking-wide"
            >
              Camlyを設置する
            </a>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-16 py-16 border-t border-camly-line grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          ["QRを読む", "現地のQRから拠点とカメラを自動識別"],
          ["スマホで決済", "予約不要、アプリ不要。その場で完結"],
          ["同じ場所へ返却", "撮影ガイドに沿って動画を撮るだけで返却申請完了"],
        ].map(([title, body]) => (
          <div key={title}>
            <h3 className="font-bold text-lg mb-2">{title}</h3>
            <p className="text-camly-inkMuted text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </section>

      <section id="locations" className="px-6 md:px-16 py-16 border-t border-camly-line">
        <p className="text-camly-accent text-xs font-bold tracking-wider mb-3">設置場所</p>
        <h2 className="text-2xl font-bold mb-8">今すぐ借りられる場所</h2>

        <div className="rounded-2xl border border-camly-line bg-camly-charcoal/60 p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
          <div className="flex-1">
            <p className="text-camly-inkMuted text-xs mb-1">nasu room MINI</p>
            <h3 className="text-xl font-bold mb-2">SONY Cyber-shot DSC-RX100M3</h3>
            <p className="text-camly-inkMuted text-sm leading-relaxed">
              栃木県那須。滞在先にそのままカメラが置いてある、Camly最初のパイロット拠点です。
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <a
              href="/pilot/box/box_pub_3e9d7b"
              className="inline-flex items-center justify-center rounded-full bg-camly-accent text-camly-black font-bold px-8 py-4 text-sm tracking-wide whitespace-nowrap"
            >
              借りる →
            </a>
            <a
              href="/pilot/box/box_pub_3e9d7b/return"
              className="inline-flex items-center justify-center rounded-full border border-camly-line text-camly-inkMuted px-8 py-2.5 text-xs tracking-wide whitespace-nowrap"
            >
              ご利用中の方はこちら(返却)
            </a>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-16 py-16 border-t border-camly-line">
        <p className="text-camly-accent text-xs font-bold tracking-wider mb-3">料金</p>
        <h2 className="text-2xl font-bold mb-8">シンプルな時間制</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mb-6">
          {PRICING_ROWS.map(([label, price]) => (
            <div key={label} className="rounded-xl border border-camly-line p-5">
              <p className="text-xs text-camly-inkMuted mb-2">{label}</p>
              <p className="text-3xl font-bold text-camly-accent tabular-nums">{price}</p>
            </div>
          ))}
        </div>
        <p className="text-camly-inkMuted text-sm max-w-xl leading-relaxed">
          貸出時にカードの利用枠¥50,000を一時的に確保しますが、これは保証枠であり請求ではありません。
          正常に返却いただければ、上記の利用料以外は一切請求しません。+¥200の「安心プラン」に加入すると、
          万が一の破損時も負担上限が¥3,000に抑えられます。
        </p>
      </section>

      <section className="px-6 md:px-16 py-16 border-t border-camly-line grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <p className="text-camly-accent text-xs font-bold tracking-wider mb-3">借り方</p>
          <h2 className="text-xl font-bold mb-6">3ステップで、その場から</h2>
          <div className="space-y-4">
            {BORROW_STEPS.map(([num, text]) => (
              <div key={num} className="flex gap-4">
                <span className="text-camly-accentSoft font-bold text-sm shrink-0 w-5">{num}</span>
                <p className="text-sm text-camly-inkMuted leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-camly-accent text-xs font-bold tracking-wider mb-3">返し方</p>
          <h2 className="text-xl font-bold mb-6">同じ場所で、動画を撮るだけ</h2>
          <div className="space-y-4">
            {RETURN_STEPS_SUMMARY.map(([num, text]) => (
              <div key={num} className="flex gap-4">
                <span className="text-camly-accentSoft font-bold text-sm shrink-0 w-5">{num}</span>
                <p className="text-sm text-camly-inkMuted leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 md:px-16 py-16 border-t border-camly-line grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          ["安心して使える", "破損時も安心プランで負担上限¥3,000。決済はStripeで安全に処理し、カード情報は当社サーバーに保存しません。"],
          ["プライバシーに配慮", "返却確認用の動画・写真は原則90日で削除。撮影データ(SDカード内)はお客様ご自身のものとして扱います。"],
          ["実証実験中だからこそ", "今この期間は、皆さまの声をもとにサービスを磨いています。返却時のアンケートにぜひご協力ください。"],
        ].map(([title, body]) => (
          <div key={title}>
            <h3 className="font-bold text-lg mb-2">{title}</h3>
            <p className="text-camly-inkMuted text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </section>

      <footer className="px-6 md:px-16 py-8 border-t border-camly-line text-xs text-camly-inkMuted flex flex-wrap gap-4">
        <a href="/terms">利用規約</a>
        <a href="/care">Camly Care</a>
        <a href="/privacy">プライバシーポリシー</a>
        <a href="/legal">特定商取引法に基づく表示</a>
        <a href="/faq">よくある質問</a>
        <a href="/support">お問い合わせ</a>
      </footer>
    </main>
  );
}

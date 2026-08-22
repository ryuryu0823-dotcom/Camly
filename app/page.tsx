/**
 * ブランドLP(§4 `/`, §16)。
 * 黒/チャコール中心+オレンジアクセント。大きなタイポグラフィ、余白、控えめなmotionなし(CSSのみ)。
 * 実写真素材は未提供のため、このバージョンはタイポグラフィ中心の構成にしている。
 * Step6(ブランド仕上げ)で実機写真・設置先別コンテンツを追加する。
 */
export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <section className="flex-1 flex flex-col justify-center px-6 md:px-16 py-24">
        <p className="text-camly-accent text-xs md:text-sm tracking-[0.2em] font-bold mb-6">CAMLY</p>
        <h1 className="text-4xl md:text-7xl font-bold leading-tight max-w-4xl">
          あらゆる場所に、
          <br />
          新しい可能性を。
        </h1>
        <p className="mt-6 text-camly-inkMuted text-base md:text-lg max-w-xl">
          Make every place more possible. — 洗練された宿、クラブ、撮影目的地に置く、無人カメラレンタル。
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
      </section>

      <section className="px-6 md:px-16 py-16 border-t border-camly-line grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          ["QRを読む", "現地のQRから拠点とカメラを自動識別"],
          ["スマホで決済", "予約不要、アプリ不要。その場で完結"],
          ["同じ場所へ返却", "動画1本+写真1枚で返却申請完了"],
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

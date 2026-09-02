/**
 * ブランドLP(§4 `/`, §16)。camly.jp のルートとして配信される。
 * 元はClaude Artifactとして作り込んだ「サービス概要」ページをそのまま移植したもの
 * (デザイン・コピーは https://claude.ai/code/artifact/2491aefb-65b6-4dd6-a960-5463935b108f 由来)。
 * スタイルは元Artifactの<style>ブロックをほぼそのまま持ち込んでいる(Tailwindのcamly-*パレットと同じ値)。
 */
import RevealOnScroll from "./_components/RevealOnScroll";
import GalleryLoop from "./_components/GalleryLoop";

const GALLERY_IMAGES = [
  "/marketing/gallery-1.jpg",
  "/marketing/gallery-2.jpg",
  "/marketing/gallery-3.jpg",
  "/marketing/gallery-4.jpg",
  "/marketing/gallery-5.jpg",
];

const PAGE_STYLES = `
  :root{
    --black:#141210;
    --charcoal:#1e1b18;
    --line:#35302b;
    --ink:#f5f1ea;
    --ink-muted:#a69c8d;
    --accent:#ff5a1f;
    --accent-soft:#ffb08a;
    --font-heading:"Hiragino Kaku Gothic ProN","Hiragino Sans",-apple-system,BlinkMacSystemFont,"Yu Gothic",sans-serif;
  }
  .lp *{box-sizing:border-box;}
  .lp{background:var(--black); color:var(--ink); line-height:1.7;}
  .lp ::selection{background:var(--accent); color:var(--black);}
  .lp a{color:inherit; text-decoration:none;}
  .lp a:focus-visible, .lp button:focus-visible{outline:2px solid var(--accent); outline-offset:3px;}
  .lp p{margin:0;}
  .lp h1, .lp h2, .lp h3{font-family:var(--font-heading);}

  .lp .wrap{max-width:1120px; margin:0 auto; padding-inline:clamp(1.25rem,4vw,4rem);}
  .lp .border-t{border-top:1px solid var(--line);}

  .lp .eyebrow{
    color:var(--accent);
    font-size:0.75rem;
    font-weight:700;
    letter-spacing:0.2em;
    margin-bottom:0.75rem;
  }

  .lp header{
    position:sticky; top:0; z-index:20;
    background:rgba(20,18,16,0.82);
    backdrop-filter:blur(8px);
    border-bottom:1px solid var(--line);
  }
  .lp .header-inner{
    display:flex; align-items:center; justify-content:space-between;
    padding-block:1.1rem;
  }
  .lp .logo-mark{display:block; height:22px; width:auto;}
  .lp .logo-mark.lg{height:34px;}
  .lp .footer-inner .logo{display:flex; flex-direction:column; align-items:flex-start; gap:0.5rem;}
  .lp .header-links{display:flex; align-items:center; gap:0.75rem;}
  .lp .text-link{font-size:0.82rem; color:var(--ink-muted);}
  .lp .text-link:hover{color:var(--ink);}
  .lp .pill{
    display:inline-flex; align-items:center; justify-content:center;
    border-radius:999px;
    font-weight:700;
    font-size:0.85rem;
    letter-spacing:0.02em;
    padding:0.7em 1.6em;
    white-space:nowrap;
  }
  .lp .pill-sm{padding:0.55em 1.3em; font-size:0.78rem;}
  .lp .pill-accent{background:var(--accent); color:var(--black);}
  .lp .pill-outline{border:1px solid var(--line); color:var(--ink);}
  .lp .pill-outline:hover{border-color:var(--accent);}

  .lp .hero{
    position:relative;
    padding-block:clamp(3.5rem,9vw,7rem) clamp(3rem,7vw,5rem);
    overflow:hidden;
  }
  .lp .hero-rings{
    pointer-events:none;
    position:absolute; inset:0;
    display:flex; align-items:center; justify-content:center;
    opacity:0.6;
  }
  .lp .deco-ring{
    position:absolute;
    border-radius:50%;
    border:1px solid rgba(53,48,43,0.5);
  }
  .lp .deco-ring.r1{width:640px; height:640px; transform:translateX(18%);}
  .lp .deco-ring.r2{width:440px; height:440px; border-color:rgba(53,48,43,0.4); transform:translateX(18%);}
  .lp .glow{
    position:absolute;
    width:260px; height:260px;
    border-radius:50%;
    background:var(--accent);
    opacity:0.12;
    filter:blur(60px);
    transform:translateX(18%);
  }

  .lp .status-badge{
    position:relative; z-index:1;
    display:inline-flex; align-items:center; gap:0.5em;
    border:1px solid rgba(255,90,31,0.4);
    border-radius:999px;
    padding:0.35em 0.9em 0.35em 0.7em;
    margin-bottom:1.5rem;
  }
  .lp .status-dot{width:6px; height:6px; border-radius:50%; background:var(--accent);}
  .lp .status-badge .label{color:var(--accent-soft); font-size:0.72rem; font-weight:700; letter-spacing:0.05em;}

  .lp .kicker-group{position:relative; z-index:1; margin-bottom:1.5rem;}
  .lp .kicker-sub{
    margin-top:0.35rem;
    color:var(--ink-muted); font-size:0.68rem; font-weight:700;
    letter-spacing:0.14em;
  }
  .lp .logo small{
    display:block;
    font-size:0.62rem;
    font-weight:700;
    letter-spacing:0.15em;
    color:var(--accent-soft);
    margin-top:0.15rem;
  }
  .lp .hero h1{
    position:relative; z-index:1;
    font-size:clamp(2.4rem,6.5vw,4.6rem);
    font-weight:800;
    line-height:1.15;
    text-wrap:balance;
    margin:0;
  }
  .lp .hero-sub{
    position:relative; z-index:1;
    margin-top:1.5rem;
    max-width:38em;
    color:var(--ink-muted);
    font-size:clamp(1rem,1.6vw,1.15rem);
  }
  .lp .cta-row{
    position:relative; z-index:1;
    display:flex; flex-wrap:wrap; gap:1rem;
    margin-top:2.5rem;
  }

  .lp .specs{
    position:relative; z-index:1;
    margin-top:clamp(3rem,7vw,4rem);
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:1rem;
    max-width:640px;
  }
  @media (max-width:640px){ .lp .specs{grid-template-columns:1fr;} }
  .lp .spec{border:1px solid var(--line); border-radius:0.9rem; padding:1.1rem 1.25rem;}
  .lp .spec .k{font-size:0.72rem; color:var(--ink-muted);}
  .lp .spec .v{margin-top:0.4rem; font-size:1.4rem; font-weight:800; font-variant-numeric:tabular-nums; color:var(--accent);}
  .lp .spec .v small{font-size:0.6rem; color:var(--ink-muted); font-weight:400;}

  .lp section.block{padding-block:clamp(3rem,7vw,5rem);}
  .lp section.block h2{font-size:clamp(1.4rem,2.6vw,1.9rem); font-weight:800; margin:0 0 1.75rem; text-wrap:balance;}

  .lp .lede{max-width:38em; color:var(--ink-muted); font-size:1rem; margin-top:-0.75rem; margin-bottom:2rem;}

  .lp .gallery-track-wrap{
    overflow:hidden;
    -webkit-mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent);
    mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent);
  }
  .lp .gallery-track{display:flex; gap:1.25rem; width:max-content; animation:gallery-scroll 34s linear infinite;}
  .lp .gallery-track:hover{animation-play-state:paused;}
  .lp .gallery-track figure{margin:0; flex-shrink:0; width:320px; height:220px; border-radius:1.25rem; overflow:hidden; border:1px solid var(--line);}
  .lp .gallery-track img{display:block; width:100%; height:100%; object-fit:cover;}
  @keyframes gallery-scroll{from{transform:translateX(-50%);} to{transform:translateX(0);}}
  @media (max-width:640px){ .lp .gallery-track figure{width:220px; height:150px;} }
  .lp .gallery-caption{margin-top:1rem; color:var(--ink-muted); font-size:0.85rem;}

  .lp .grid3{display:grid; grid-template-columns:repeat(3,1fr); gap:2rem;}
  @media (max-width:760px){ .lp .grid3{grid-template-columns:1fr;} }
  .lp .grid3 h3{font-weight:700; font-size:1.05rem; margin:0 0 0.5rem;}
  .lp .grid3 p{color:var(--ink-muted); font-size:0.92rem; line-height:1.7;}

  .lp .flow-grid{display:grid; grid-template-columns:repeat(2,1fr); gap:3rem;}
  @media (max-width:760px){ .lp .flow-grid{grid-template-columns:1fr;} }
  .lp .flow-col > .eyebrow{margin-bottom:1.25rem;}
  .lp .flow-step{display:flex; gap:1rem; margin-bottom:1.1rem; align-items:flex-start;}
  .lp .flow-step .n{color:var(--accent-soft); font-weight:700; font-size:0.9rem; flex-shrink:0; width:1.4em;}
  .lp .flow-step p{color:var(--ink-muted); font-size:0.92rem; line-height:1.7;}
  .lp .flow-thumb{
    width:72px; height:72px;
    border-radius:0.9rem;
    border:1px solid var(--line);
    background:var(--charcoal);
    flex-shrink:0;
    margin-left:auto;
    display:flex; align-items:center; justify-content:center;
  }
  .lp .flow-thumb svg{width:40px; height:40px;}

  .lp .partner-grid{display:grid; grid-template-columns:repeat(2,1fr); gap:1.5rem;}
  @media (max-width:760px){ .lp .partner-grid{grid-template-columns:1fr;} }
  .lp .partner-card{border:1px solid var(--line); border-radius:1rem; padding:1.75rem;}
  .lp .partner-card .eyebrow{font-size:0.7rem;}
  .lp .partner-card p{color:var(--ink-muted); font-size:0.92rem; line-height:1.7;}

  .lp .contact-card{
    border:1px solid var(--line);
    background:var(--charcoal);
    border-radius:1.25rem;
    padding:clamp(1.75rem,4vw,2.5rem);
    display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:1.5rem;
  }
  .lp .contact-card .k{font-size:0.75rem; color:var(--ink-muted); margin-bottom:0.4rem;}
  .lp .contact-card .email{font-size:clamp(1.15rem,2.6vw,1.5rem); font-weight:700;}
  .lp .contact-card .email:hover{color:var(--accent-soft);}
  .lp .contact-card .hint{color:var(--ink-muted); font-size:0.85rem; text-align:right;}

  .lp footer{padding-block:2rem;}
  .lp .footer-inner{
    display:flex; flex-wrap:wrap; justify-content:space-between; gap:1.5rem; align-items:flex-start;
    font-size:0.8rem; color:var(--ink-muted);
  }
  .lp .footer-inner .logo{font-size:0.95rem; color:var(--ink); margin-bottom:0.6rem;}
  .lp .footer-inner .foot-note{max-width:34em;}
  .lp .footer-meta{text-align:right;}

  .lp [data-reveal]{opacity:1; transform:none;}
  .lp [data-reveal].reveal-armed{opacity:0; transform:translateY(12px); transition:opacity 0.6s ease, transform 0.6s ease;}
  .lp [data-reveal].reveal-armed.is-visible{opacity:1; transform:none;}

  @media (prefers-reduced-motion: reduce){
    .lp *{animation-duration:0.001ms !important; transition-duration:0.001ms !important;}
    .lp [data-reveal]{opacity:1; transform:none;}
  }
`;

export default function HomePage() {
  return (
    <div className="lp">
      <style>{PAGE_STYLES}</style>
      <RevealOnScroll />

      <header>
        <div className="wrap header-inner">
          <img className="logo-mark" src="/camly-logo.png" alt="Camly" />
          <div className="header-links">
            <a className="text-link" href="/guide">
              使い方ガイド
            </a>
            <a className="pill pill-outline pill-sm" href="#contact">
              お問い合わせ
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="hero wrap">
          <div className="hero-rings" aria-hidden="true">
            <div className="deco-ring r1" />
            <div className="deco-ring r2" />
            <div className="glow" />
          </div>

          <div className="status-badge" data-reveal="true">
            <span className="status-dot" />
            <span className="label">現在、実証実験(パイロット)期間中です</span>
          </div>

          <div className="kicker-group" data-reveal="true">
            <img className="logo-mark lg" src="/camly-logo.png" alt="Camly" />
            <p className="kicker-sub">CAPTURE YOUR MOMENT ANYWHERE — カメラレンタル事業</p>
          </div>

          <h1 data-reveal="true">
            あらゆる場所に、
            <br />
            新しい可能性を。
          </h1>

          <p className="hero-sub" data-reveal="true">
            Make every place more possible. — 洗練された宿、クラブ、撮影目的地に置く、無人カメラレンタル。
            予約もアプリも不要、QRを読んでその場で借りて、その場で返す。
          </p>

          <div className="cta-row" data-reveal="true">
            <a className="pill pill-accent" href="/pilot/box/box_pub_3e9d7b">
              カメラを借りる
            </a>
            <a className="pill pill-outline" href="/partners">
              導入・提携について相談する
            </a>
          </div>

          <div className="specs" data-reveal="true">
            <div className="spec">
              <div className="k">Pilot Since</div>
              <div className="v">2026</div>
            </div>
            <div className="spec">
              <div className="k">稼働拠点</div>
              <div className="v">
                1拠点
                <br />
                <small>nasu room MINI</small>
              </div>
            </div>
            <div className="spec">
              <div className="k">基本料金</div>
              <div className="v">¥990〜</div>
            </div>
          </div>
        </section>

        <section className="block border-t wrap" id="what">
          <div data-reveal="true">
            <p className="eyebrow">WHAT IS CAMLY</p>
            <h2>その瞬間に、カメラがある。</h2>
          </div>
          <p className="lede" data-reveal="true">
            いい瞬間は、予定していないときに来ます。カメラを持ってきていない、充電が切れている、
            スマホのカメラでは残しきれない——そんな理由で、多くの瞬間はそのまま流れていきます。
            Camlyは、その瞬間が生まれやすい場所に、あらかじめカメラを置いておくサービスです。
            借りるための予約やアプリのインストールは必要ありません。
          </p>
          <div className="grid3" data-reveal="true">
            <div>
              <h3>QRを読む</h3>
              <p>現地のQRから拠点とカメラを自動識別</p>
            </div>
            <div>
              <h3>スマホで決済</h3>
              <p>予約不要、アプリ不要。その場で完結</p>
            </div>
            <div>
              <h3>同じ場所へ返却</h3>
              <p>撮影ガイドに沿って動画・写真を撮るだけで返却申請完了</p>
            </div>
          </div>
        </section>

        <section className="block border-t wrap" id="gallery">
          <div data-reveal="true">
            <p className="eyebrow">PHOTO GALLERY</p>
            <h2>このカメラで、こんな写真が撮れる。</h2>
          </div>
          <div className="gallery-track-wrap" data-reveal="true">
            <div className="gallery-track" id="galleryTrack">
              {GALLERY_IMAGES.map((src, i) => (
                <figure key={src}>
                  <img src={src} alt={`Camlyのカメラで撮影した写真の例 ${i + 1}`} />
                </figure>
              ))}
            </div>
          </div>
          <GalleryLoop trackId="galleryTrack" />
          <p className="gallery-caption" data-reveal="true">
            実際にレンタル機材で撮影された参考イメージです。
          </p>
        </section>

        <section className="block border-t wrap" id="how">
          <div data-reveal="true">
            <p className="eyebrow">HOW IT WORKS</p>
            <h2>借りるのも、返すのも、その場で。</h2>
          </div>
          <div className="flow-grid" data-reveal="true">
            <div className="flow-col">
              <p className="eyebrow" style={{ fontSize: "0.7rem" }}>
                借り方
              </p>
              <div className="flow-step">
                <span className="n">01</span>
                <p>設置場所のQRコードを読み取る</p>
                <div className="flow-thumb">
                  <svg viewBox="0 0 44 44" fill="none" aria-hidden="true">
                    <rect x="10" y="3" width="24" height="38" rx="5" stroke="var(--line)" strokeWidth="1.5" />
                    <rect x="16" y="11" width="4" height="4" fill="var(--accent)" />
                    <rect x="24" y="11" width="4" height="4" fill="var(--accent)" />
                    <rect x="16" y="19" width="4" height="4" fill="var(--accent)" />
                    <rect x="24" y="19" width="4" height="4" stroke="var(--accent)" strokeWidth="1.5" />
                    <rect x="16" y="27" width="4" height="4" stroke="var(--accent)" strokeWidth="1.5" />
                    <rect x="24" y="27" width="4" height="4" fill="var(--accent-soft)" />
                  </svg>
                </div>
              </div>
              <div className="flow-step">
                <span className="n">02</span>
                <p>お名前・連絡先を入力し、カードを登録(¥50,000は一時的な保証枠。使わなければ請求されません)</p>
                <div className="flow-thumb">
                  <svg viewBox="0 0 44 44" fill="none" aria-hidden="true">
                    <rect x="10" y="3" width="24" height="38" rx="5" stroke="var(--line)" strokeWidth="1.5" />
                    <rect x="15" y="15" width="14" height="9" rx="2" stroke="var(--accent)" strokeWidth="1.5" />
                    <rect x="15" y="18" width="14" height="2" fill="var(--accent)" />
                    <circle cx="29" cy="30" r="7" fill="var(--black)" stroke="var(--accent-soft)" strokeWidth="1.5" />
                    <path
                      d="M26 30l2 2 4-4.5"
                      stroke="var(--accent-soft)"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div className="flow-step">
                <span className="n">03</span>
                <p>決済完了後、画面のパスワードでキーボックスを開けて鍵を取り出し、その鍵でBOXの扉を開ける</p>
              </div>
            </div>
            <div className="flow-col">
              <p className="eyebrow" style={{ fontSize: "0.7rem" }}>
                返し方
              </p>
              <div className="flow-step">
                <span className="n">01</span>
                <p>返却用のQRコードを読み取る(利用中ページへ自動でつながります)</p>
              </div>
              <div className="flow-step">
                <span className="n">02</span>
                <p>サイト内カメラで本体・付属品・扉の状態をステップごとに撮影</p>
              </div>
              <div className="flow-step">
                <span className="n">03</span>
                <p>内容を確認して送信。現物確認後、利用料以外は請求されません</p>
              </div>
            </div>
          </div>
        </section>

        <section className="block border-t wrap" id="trust">
          <div data-reveal="true">
            <p className="eyebrow">TRUST BY DESIGN</p>
            <h2>信頼は、仕組みで担保する。</h2>
          </div>
          <p className="lede" data-reveal="true">
            新しい体験ほど、お金の流れが見えることが安心につながると考えています。
            Camlyの与信・確認プロセスは、利用者にも設置先の事業者にも不利益が出ないように設計しています。
          </p>
          <div className="grid3" data-reveal="true">
            <div>
              <h3>請求は、使った分だけ</h3>
              <p>¥50,000は与信枠の確保であり、その場での請求ではありません。実際に請求されるのは確定した利用料金だけです。</p>
            </div>
            <div>
              <h3>最終確認は、必ず人が行う</h3>
              <p>返却時の写真・動画はAIによる一次チェックのあとも、必ず人の目で最終確認します。自動判定だけで高額請求が発生することはありません。</p>
            </div>
            <div>
              <h3>安心プラン(Camly Care)</h3>
              <p>+¥200でご加入いただくと、万が一の破損時のご負担は¥3,000が上限になります。</p>
            </div>
          </div>
        </section>

        <section className="block border-t wrap" id="partners">
          <div data-reveal="true">
            <p className="eyebrow">FOR PARTNERS</p>
            <h2>一緒に置く場所を、増やしていく。</h2>
          </div>
          <p className="lede" data-reveal="true">
            現在は1拠点での実証実験フェーズです。ここで得た知見をもとに、設置先とハードウェアの
            両面で次のフェーズに進めていきたいと考えています。
          </p>
          <div className="partner-grid" data-reveal="true">
            <div className="partner-card">
              <p className="eyebrow">設置をご検討の事業者様へ</p>
              <p>宿泊施設・クラブ・撮影目的地など、お客様の記憶に残る瞬間が生まれる場所への設置を想定しています。運用モデルについてご相談させてください。</p>
              <p style={{ marginTop: "1rem" }}>
                <a className="pill pill-outline pill-sm" href="/partners">
                  導入メリットを詳しく見る →
                </a>
              </p>
            </div>
            <div className="partner-card">
              <p className="eyebrow">投資家・OEM/ODMご担当者様へ</p>
              <p>実証実験の状況、料金設計、今後のハードウェア展開(スマートボックス化)を含めた資料をご用意しています。ご連絡いただければお送りします。</p>
            </div>
          </div>
        </section>

        <section className="block border-t wrap" id="contact">
          <div data-reveal="true">
            <p className="eyebrow">CONTACT</p>
            <h2>まずは、話を聞かせてください。</h2>
          </div>
          <div className="contact-card" data-reveal="true">
            <div>
              <div className="k">Email</div>
              <a className="email" href="mailto:camly.support@gmail.com">
                camly.support@gmail.com
              </a>
            </div>
            <div className="hint">
              導入・提携・投資に関するご相談
              <br />
              すべてこちらまで
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t wrap">
        <div className="footer-inner">
          <div>
            <p className="logo">
              <img className="logo-mark" src="/camly-logo.png" alt="Camly" />
              <small>CAPTURE YOUR MOMENT ANYWHERE</small>
            </p>
            <p className="foot-note">
              Make every place more possible. — 現在は実証実験(パイロット)フェーズです。
              正式な事業者情報・特定商取引法に基づく表示は準備中のため、本ページには掲載していません。
            </p>
            <a
              className="text-link"
              href="https://www.instagram.com/camly_jp/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", marginTop: "0.85rem" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
              </svg>
              @camly_jp
            </a>
          </div>
          <div className="footer-meta">
            © 2026 CAMLY
            <br />
            UNMANNED CAMERA RENTAL
          </div>
        </div>
      </footer>
    </div>
  );
}

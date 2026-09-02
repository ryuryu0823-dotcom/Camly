/**
 * 使い方ガイド(guide.camly.jp のルートとして配信される)。
 * 元はClaude Artifactの「Camlyの使い方ガイド」ページをそのまま移植したもの
 * (デザイン・コピーは https://claude.ai/code/artifact/03fa52d5-4d98-4768-9f1d-7a2e43369e7a 由来)。
 */
import RevealOnScroll from "../_components/RevealOnScroll";

const START_STEPS = [
  {
    n: "01",
    title: "QRコードをスキャン",
    body: "BOX扉、またはこの冊子の裏表紙にある「RENT」のQRコードを読み取ります。",
    photo: "/marketing/step-qr.jpg",
    alt: "QRコードをスキャンするイメージ",
  },
  {
    n: "02",
    title: "画面の案内に従って決済",
    body: "お名前・連絡先を入力し、カード情報を登録します。この時点では課金されません。",
    photo: "/marketing/step-pay.jpg",
    alt: "決済画面のイメージ",
  },
  {
    n: "03",
    title: "パスワードでキーボックスを解錠",
    body: "決済が完了すると、画面にキーボックスの解錠パスワードが表示されます。入力してキーボックスを開け、中の鍵を取り出してください。",
    photo: "/marketing/step-keybox.jpg",
    alt: "キーボックスと鍵",
  },
  {
    n: "04",
    title: "鍵でBOXを開けて撮影スタート",
    body: "取り出した鍵でBOXの扉を開け、カメラを取り出したら、あとは自由に使うだけ。Let's Camly!",
    photo: "/marketing/step-camera.jpg",
    alt: "BOXからカメラを取り出すイメージ",
  },
];

const PRICE_TIERS: [string, string][] = [
  ["3時間以内", "¥990"],
  ["12時間以内", "¥1,490"],
  ["チェックアウトまで(12時間以上)", "¥1,990"],
];

const SETTINGS_CARDS = [
  {
    num: "01",
    title: "PORTRAIT",
    sub: "人物を撮るとき",
    photo: "/marketing/settings-portrait.jpg",
    alt: "人物を撮影した写真の例",
    rows: [
      ["MODE", "M(マニュアル)"],
      ["FLASH", "暗い場所ではON"],
      ["APERTURE", "F2.8"],
      ["ISO", "AUTO"],
      ["QUALITY", "FINE JPEG"],
    ],
  },
  {
    num: "02",
    title: "LANDSCAPE",
    sub: "風景を撮るとき",
    photo: "/marketing/settings-landscape.jpg",
    alt: "風景を撮影した写真の例",
    rows: [
      ["MODE", "A(絞り優先)"],
      ["FLASH", "OFF"],
      ["APERTURE", "F4.0"],
      ["ISO", "AUTO"],
      ["QUALITY", "FINE JPEG"],
    ],
  },
];

const CARE_CARDS = [
  ["01", "レンズを触らない", "レンズ表面にはなるべく触れないようお願いします。電源OFF時はレンズが収納されていることを確認してから持ち歩いてください。"],
  ["02", "雨・水・砂に注意", "このカメラは防水カメラではありません。雨、水まわり、砂浜などでは特に注意して使用をお願いします。"],
  ["03", "盗難に注意", "置き忘れや紛失・盗難には十分ご注意ください。席などに置いたままにせず、持ち歩きの際はしっかり管理をお願いします。"],
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
  .gd *{box-sizing:border-box;}
  .gd{background:var(--black); color:var(--ink); line-height:1.7;}
  .gd ::selection{background:var(--accent); color:var(--black);}
  .gd a{color:inherit; text-decoration:none;}
  .gd a:focus-visible, .gd button:focus-visible{outline:2px solid var(--accent); outline-offset:3px;}
  .gd p{margin:0;}
  .gd h1, .gd h2, .gd h3{font-family:var(--font-heading);}

  .gd .wrap{max-width:1120px; margin:0 auto; padding-inline:clamp(1.25rem,4vw,4rem);}
  .gd .border-t{border-top:1px solid var(--line);}

  .gd .eyebrow{color:var(--accent); font-size:0.75rem; font-weight:700; letter-spacing:0.2em; margin-bottom:0.75rem;}

  .gd header{
    position:sticky; top:0; z-index:20;
    background:rgba(20,18,16,0.82);
    backdrop-filter:blur(8px);
    border-bottom:1px solid var(--line);
  }
  .gd .header-inner{display:flex; align-items:center; justify-content:space-between; padding-block:1.1rem; gap:1rem;}
  .gd .logo{font-weight:800; font-size:1.1rem; letter-spacing:0.02em; display:flex; align-items:center; gap:0.6rem;}
  .gd .logo-mark{display:block; height:20px; width:auto;}
  .gd .footer-inner .logo{align-items:flex-start; flex-direction:column; gap:0.5rem;}
  .gd .logo small{
    display:block;
    font-size:0.62rem;
    font-weight:700;
    letter-spacing:0.15em;
    color:var(--accent-soft);
    margin-top:0.15rem;
  }
  .gd .header-links{display:flex; align-items:center; gap:0.75rem;}
  .gd .text-link{font-size:0.82rem; color:var(--ink-muted);}
  .gd .text-link:hover{color:var(--ink);}

  .gd .pill{
    display:inline-flex; align-items:center; justify-content:center;
    border-radius:999px; font-weight:700; font-size:0.85rem; letter-spacing:0.02em;
    padding:0.7em 1.6em; white-space:nowrap;
  }
  .gd .pill-sm{padding:0.55em 1.3em; font-size:0.78rem;}
  .gd .pill-outline{border:1px solid var(--line); color:var(--ink);}
  .gd .pill-outline:hover{border-color:var(--accent);}

  .gd .hero{position:relative; padding-block:clamp(3rem,7vw,5rem) clamp(2.5rem,5vw,3.5rem); overflow:hidden;}
  .gd .hero-rings{pointer-events:none; position:absolute; inset:0; display:flex; align-items:center; justify-content:flex-end; opacity:0.6;}
  .gd .deco-ring{position:absolute; border-radius:50%; border:1px solid rgba(53,48,43,0.5);}
  .gd .deco-ring.r1{width:520px; height:520px; transform:translateX(26%);}
  .gd .deco-ring.r2{width:360px; height:360px; border-color:rgba(53,48,43,0.4); transform:translateX(26%);}
  .gd .glow{position:absolute; width:220px; height:220px; border-radius:50%; background:var(--accent); opacity:0.12; filter:blur(60px); transform:translateX(20%);}

  .gd .kicker{position:relative; z-index:1; color:var(--accent); font-size:0.8rem; font-weight:700; letter-spacing:0.2em; margin-bottom:1.25rem;}
  .gd .hero h1{position:relative; z-index:1; font-size:clamp(2.1rem,5.2vw,3.6rem); font-weight:800; line-height:1.25; text-wrap:balance; margin:0; max-width:16ch;}
  .gd .hero-sub{position:relative; z-index:1; margin-top:1.4rem; max-width:36em; color:var(--ink-muted); font-size:clamp(1rem,1.5vw,1.1rem);}

  .gd section.block{padding-block:clamp(3rem,7vw,5rem);}
  .gd section.block h2{font-size:clamp(1.4rem,2.6vw,1.9rem); font-weight:800; margin:0 0 1.75rem; text-wrap:balance;}
  .gd .lede{max-width:38em; color:var(--ink-muted); font-size:1rem; margin-top:-0.75rem; margin-bottom:2rem;}

  .gd .step-list{display:flex; flex-direction:column;}
  .gd .step{
    display:grid;
    grid-template-columns:3rem 1fr auto;
    gap:1.5rem;
    align-items:center;
    padding-block:1.75rem;
    border-top:1px solid var(--line);
  }
  .gd .step:last-child{padding-bottom:0;}
  @media (max-width:640px){
    .gd .step{grid-template-columns:1fr; gap:0.75rem;}
    .gd .step .n{order:-2;}
    .gd .step-thumb{order:-1;}
  }
  .gd .step .n{font-size:0.8rem; font-weight:800; color:var(--accent-soft); letter-spacing:0.05em;}
  .gd .step h3{font-size:1.05rem; font-weight:800; margin:0 0 0.4rem;}
  .gd .step p{color:var(--ink-muted); font-size:0.94rem; max-width:42em;}
  .gd .step-thumb{
    width:84px; height:84px;
    border-radius:0.9rem;
    border:1px solid var(--line);
    background:var(--charcoal);
    flex-shrink:0;
    overflow:hidden;
    display:flex; align-items:center; justify-content:center;
  }
  .gd .step-thumb img{width:100%; height:100%; object-fit:cover;}
  .gd .price-box{border:1px solid var(--line); border-radius:1.25rem; padding:1.5rem 1.75rem; margin-top:2.25rem;}
  .gd .price-box-label{font-size:0.78rem; color:var(--ink-muted); letter-spacing:0.05em; margin-bottom:1.1rem;}
  .gd .price-tiers{display:flex; gap:1.5rem; flex-wrap:wrap;}
  .gd .price-tier{flex:1; min-width:100px;}
  .gd .price-tier .t-label{display:block; font-size:0.78rem; color:var(--ink-muted); margin-bottom:0.3rem;}
  .gd .price-tier .t-price{display:block; font-size:1.4rem; font-weight:800; color:var(--accent); font-variant-numeric:tabular-nums;}
  .gd .price-box-note{font-size:0.8rem; color:var(--ink-muted); margin-top:1.25rem; padding-top:1.25rem; border-top:1px solid var(--line);}
  @media (max-width:480px){ .gd .price-tiers{gap:1rem;} }

  .gd .settings-grid{display:grid; grid-template-columns:repeat(2,1fr); gap:1.75rem;}
  @media (max-width:760px){ .gd .settings-grid{grid-template-columns:1fr;} }
  .gd .settings-card{border:1px solid var(--line); border-radius:1.25rem; overflow:hidden;}
  .gd .settings-photo{aspect-ratio:16/10; overflow:hidden;}
  .gd .settings-photo img{display:block; width:100%; height:100%; object-fit:cover;}
  .gd .settings-head{display:flex; align-items:baseline; gap:0.75rem; padding:1.5rem 1.5rem 0;}
  .gd .settings-head .num{font-size:1.8rem; font-weight:800; color:var(--accent); font-variant-numeric:tabular-nums;}
  .gd .settings-head h3{font-size:1.1rem; font-weight:800; margin:0;}
  .gd .settings-head .sub{color:var(--ink-muted); font-size:0.82rem;}
  .gd .settings-list{padding:1.25rem 1.5rem 1.5rem; display:flex; flex-direction:column; gap:0.7rem;}
  .gd .settings-list .row{display:flex; gap:0.75rem; font-size:0.88rem;}
  .gd .settings-list .row .label{color:var(--accent-soft); font-weight:700; flex-shrink:0; width:6.5em;}
  .gd .settings-list .row .val{color:var(--ink-muted);}

  .gd .care-grid{display:grid; grid-template-columns:repeat(3,1fr); gap:1.5rem;}
  @media (max-width:760px){ .gd .care-grid{grid-template-columns:1fr;} }
  .gd .care-card{border:1px solid var(--line); border-radius:1rem; padding:1.5rem 1.6rem;}
  .gd .care-card .num{font-size:1.6rem; font-weight:800; color:var(--accent); font-variant-numeric:tabular-nums;}
  .gd .care-card h3{font-size:1.02rem; font-weight:800; margin:0.75rem 0 0.6rem;}
  .gd .care-card p{color:var(--ink-muted); font-size:0.9rem; line-height:1.7;}

  .gd .care-notes{margin-top:1.75rem; display:flex; flex-direction:column; gap:0.75rem;}
  .gd .care-notes .note{display:flex; gap:0.75rem; color:var(--ink-muted); font-size:0.9rem;}
  .gd .care-notes .note .mark{color:var(--accent); flex-shrink:0;}

  .gd .contact-card{
    border:1px solid var(--line); background:var(--charcoal); border-radius:1.25rem;
    padding:clamp(1.75rem,4vw,2.5rem);
    display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:1.5rem;
  }
  .gd .contact-card .k{font-size:0.75rem; color:var(--ink-muted); margin-bottom:0.4rem;}
  .gd .contact-card .email{font-size:clamp(1.1rem,2.4vw,1.4rem); font-weight:700;}
  .gd .contact-card .email:hover{color:var(--accent-soft);}
  .gd .contact-card .hint{color:var(--ink-muted); font-size:0.85rem; text-align:right;}

  .gd footer{padding-block:2rem;}
  .gd .footer-inner{display:flex; flex-wrap:wrap; justify-content:space-between; gap:1.5rem; align-items:flex-start; font-size:0.8rem; color:var(--ink-muted);}
  .gd .footer-inner .logo{font-size:0.95rem; color:var(--ink); margin-bottom:0.6rem;}
  .gd .footer-inner .foot-note{max-width:34em;}
  .gd .footer-meta{text-align:right;}

  .gd [data-reveal]{opacity:1; transform:none;}
  .gd [data-reveal].reveal-armed{opacity:0; transform:translateY(12px); transition:opacity 0.6s ease, transform 0.6s ease;}
  .gd [data-reveal].reveal-armed.is-visible{opacity:1; transform:none;}

  @media (prefers-reduced-motion: reduce){
    .gd *{animation-duration:0.001ms !important; transition-duration:0.001ms !important;}
    .gd [data-reveal]{opacity:1; transform:none;}
  }
`;

export default function GuidePage() {
  return (
    <div className="gd">
      <style>{PAGE_STYLES}</style>
      <RevealOnScroll />

      <header>
        <div className="wrap header-inner">
          <span className="logo">
            <img className="logo-mark" src="/camly-logo.png" alt="Camly" />
            <small>USE GUIDE</small>
          </span>
          <div className="header-links">
            <a className="text-link" href="/">
              サービス概要
            </a>
            <a className="pill pill-outline pill-sm" href="/pilot/box/box_pub_3e9d7b">
              借りる
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

          <p className="kicker" data-reveal="true">
            QUICK PHOTO GUIDE
          </p>
          <h1 data-reveal="true">Camlyの使い方ガイド</h1>
          <p className="hero-sub" data-reveal="true">
            Capture your moment, anywhere. — 借りてから返すまで、迷わないための使い方をまとめました。
            困ったときはいつでもサポートまでご連絡ください。
          </p>
        </section>

        <section className="block border-t wrap" id="start">
          <div data-reveal="true">
            <p className="eyebrow">HOW TO START</p>
            <h2>Camlyの始めかた</h2>
          </div>
          <div className="step-list" data-reveal="true">
            {START_STEPS.map((s) => (
              <div className="step" key={s.n}>
                <div className="n">{s.n}</div>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
                <div className="step-thumb">
                  <img src={s.photo} alt={s.alt} />
                </div>
              </div>
            ))}
          </div>

          <div className="price-box" data-reveal="true">
            <p className="price-box-label">料金(利用時間に応じて自動確定)</p>
            <div className="price-tiers">
              {PRICE_TIERS.map(([label, price]) => (
                <div className="price-tier" key={label}>
                  <span className="t-label">{label}</span>
                  <span className="t-price">{price}</span>
                </div>
              ))}
            </div>
            <p className="price-box-note">+¥200の安心プランで、破損時の請求上限を¥3,000に抑えられます(決済時に選択できます)。</p>
          </div>
        </section>

        <section className="block border-t wrap" id="settings">
          <div data-reveal="true">
            <p className="eyebrow">HOW TO USE</p>
            <h2>迷った時は、この2つの設定で。</h2>
          </div>
          <div className="settings-grid" data-reveal="true">
            {SETTINGS_CARDS.map((c) => (
              <div className="settings-card" key={c.num}>
                <div className="settings-photo">
                  <img src={c.photo} alt={c.alt} />
                </div>
                <div className="settings-head">
                  <span className="num">{c.num}</span>
                  <div>
                    <h3>{c.title}</h3>
                    <span className="sub">{c.sub}</span>
                  </div>
                </div>
                <div className="settings-list">
                  {c.rows.map(([label, val]) => (
                    <div className="row" key={label}>
                      <span className="label">{label}</span>
                      <span className="val">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="block border-t wrap" id="care">
          <div data-reveal="true">
            <p className="eyebrow">PLEASE TAKE CARE</p>
            <h2>レンタル中の3つの注意。</h2>
          </div>
          <div className="care-grid" data-reveal="true">
            {CARE_CARDS.map(([num, title, body]) => (
              <div className="care-card" key={num}>
                <div className="num">{num}</div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
          <div className="care-notes" data-reveal="true">
            <div className="note">
              <span className="mark">—</span>
              <span>落下の危険がある場所では、ストラップの使用をお願いします。</span>
            </div>
            <div className="note">
              <span className="mark">—</span>
              <span>カメラに異常を感じた際は、無理に操作せずサポートチームにご連絡ください。</span>
            </div>
          </div>
        </section>

        <section className="block border-t wrap" id="follow">
          <div data-reveal="true">
            <p className="eyebrow">FOLLOW US</p>
            <h2>Instagramでも、使い方を発信中。</h2>
          </div>
          <div className="contact-card" data-reveal="true">
            <div>
              <div className="k">Instagram</div>
              <a
                className="email"
                href="https://www.instagram.com/camly_jp/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.55rem" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
                </svg>
                @camly_jp
              </a>
            </div>
            <div className="hint">
              撮り方のコツや実際の使用例も紹介しています
              <br />
              ぜひフォローしてください
            </div>
          </div>
        </section>

        <section className="block border-t wrap" id="contact">
          <div data-reveal="true">
            <p className="eyebrow">OK, LET&apos;S CAMLY!</p>
            <h2>困ったときは、いつでもご連絡ください。</h2>
          </div>
          <div className="contact-card" data-reveal="true">
            <div>
              <div className="k">Email</div>
              <a className="email" href="mailto:camly.support@gmail.com?subject=Camly%E3%81%AE%E4%BD%BF%E3%81%84%E6%96%B9%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6">
                camly.support@gmail.com
              </a>
            </div>
            <div className="hint">
              カメラの不具合・使い方のご質問など
              <br />
              お気軽にどうぞ
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
            <p className="foot-note">Make every place more possible. — 現在は実証実験(パイロット)フェーズです。</p>
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

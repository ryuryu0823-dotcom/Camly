/**
 * 導入検討ページ(camly.jp/partners)。
 * 元はClaude Artifactの「Camlyを導入する」ページをそのまま移植したもの
 * (デザイン・コピーは https://claude.ai/code/artifact/01f88b9c-1086-4785-84b6-adcda9da780e 由来)。
 * 他ページ(/, /guide)とは異なり、このページのみ白背景テーマ。
 */
import RevealOnScroll from "../_components/RevealOnScroll";

const PAIN_CARDS = [
  ["SNS映えする瞬間なのに、スマホではうまく撮れない", "暗い店内や夜景、動きのあるシーンでは満足のいく写真が残しにくく、滞在の満足度に影響します。"],
  ["貸出用カメラを自前で用意すると、管理が大変", "破損・紛失のリスクや充電・清掃の手間まで、施設側で抱え込むことになります。"],
  ["他の施設と差がつく、新しいアメニティを探している", "Wi-Fiやアメニティグッズだけでは伝わらない、体験としての差別化がほしい。"],
];

const MERIT_POINTS = [
  ["01", "差別化になるアメニティ", "「この場所にはカメラが置いてある」——それ自体が選ばれる理由になります。必要なのは電源とわずかな設置スペースだけです。"],
  ["02", "滞在中の接点が生まれる", "借りるときと返すときの2回、ゲストが施設の共用部やフロントを意識するきっかけになります。"],
  ["03", "SNS・UGCのきっかけになる", "センスのいい一枚は、ゲスト自身の手で自然にSNSへ投稿され、施設の魅力が発信されていきます。"],
];

const FLOW_CARDS = [
  ["STEP 01", "お問い合わせ", "施設の状況やゲスト層について、簡単にヒアリングさせてください。"],
  ["STEP 02", "導入プランのご提案", "設置場所、運用方法、収益モデルをご相談の上でご提案します。"],
  ["STEP 03", "設置", "カメラとキーボックスを設置します。必要なのは電源と、わずかな設置スペースだけです。"],
  ["STEP 04", "運用開始", "QRコードを掲示するだけで、ゲストがご自身で借りられるようになります。"],
];

const FAQS = [
  ["スタッフの対応は必要ですか？", "いいえ。ゲストご自身がQRコードから貸出・返却まで完結します。"],
  ["破損や盗難が起きた場合、施設の負担になりますか？", "いいえ。貸出時に一時的な保証枠を確保しており、施設側にご負担いただくことはありません。"],
  ["設置費用や収益の分配はどうなりますか？", "実証実験フェーズにつき、拠点ごとにご相談の上で決めさせていただいています。個別にご提案します。"],
  ["契約期間は決まっていますか？", "現在は実証実験期間中のため、柔軟にご相談いただけます。"],
];

const PAGE_STYLES = `
  :root{
    --black:#141210;
    --bg:#ffffff;
    --charcoal:#f5f2ec;
    --line:#e6e0d3;
    --ink:#181410;
    --ink-muted:#6d6255;
    --accent:#ea580c;
    --accent-soft:#b8460c;
    --font-heading:"Hiragino Kaku Gothic ProN","Hiragino Sans",-apple-system,BlinkMacSystemFont,"Yu Gothic",sans-serif;
  }
  .pt *{box-sizing:border-box;}
  .pt{background:var(--bg); color:var(--ink); line-height:1.7;}
  .pt ::selection{background:var(--accent); color:#fff;}
  .pt a{color:inherit; text-decoration:none;}
  .pt a:focus-visible, .pt button:focus-visible{outline:2px solid var(--accent); outline-offset:3px;}
  .pt p{margin:0;}
  .pt h1, .pt h2, .pt h3{font-family:var(--font-heading);}

  .pt .wrap{max-width:1120px; margin:0 auto; padding-inline:clamp(1.25rem,4vw,4rem);}
  .pt .border-t{border-top:1px solid var(--line);}

  .pt .eyebrow{color:var(--accent-soft); font-size:0.75rem; font-weight:700; letter-spacing:0.2em; margin-bottom:0.75rem;}

  .pt header{
    position:sticky; top:0; z-index:20;
    background:rgba(255,255,255,0.86);
    backdrop-filter:blur(8px);
    border-bottom:1px solid var(--line);
  }
  .pt .header-inner{display:flex; align-items:center; justify-content:space-between; padding-block:1.1rem; gap:1rem;}
  .pt .logo{font-weight:800; font-size:1.1rem; letter-spacing:0.02em; display:flex; align-items:center; gap:0.6rem;}
  .pt .logo-mark{display:block; height:20px; width:auto;}
  .pt .footer-inner .logo{align-items:flex-start; flex-direction:column; gap:0.5rem;}
  .pt .logo small{
    display:block;
    font-size:0.62rem;
    font-weight:700;
    letter-spacing:0.15em;
    color:var(--accent-soft);
    margin-top:0.15rem;
  }
  .pt .header-links{display:flex; align-items:center; gap:0.75rem;}
  .pt .text-link{font-size:0.82rem; color:var(--ink-muted);}
  .pt .text-link:hover{color:var(--ink);}

  .pt .pill{
    display:inline-flex; align-items:center; justify-content:center;
    border-radius:999px; font-weight:700; font-size:0.85rem; letter-spacing:0.02em;
    padding:0.7em 1.6em; white-space:nowrap;
  }
  .pt .pill-sm{padding:0.55em 1.3em; font-size:0.78rem;}
  .pt .pill-accent{background:var(--accent); color:#fff;}
  .pt .pill-outline{border:1px solid var(--line); color:var(--ink);}
  .pt .pill-outline:hover{border-color:var(--accent);}

  .pt .hero{position:relative; padding-block:clamp(3rem,8vw,6rem) clamp(2.5rem,6vw,4rem); overflow:hidden;}
  .pt .hero-rings{pointer-events:none; position:absolute; inset:0; display:flex; align-items:center; justify-content:flex-end; opacity:0.7;}
  .pt .deco-ring{position:absolute; border-radius:50%; border:1px solid rgba(53,48,43,0.14);}
  .pt .deco-ring.r1{width:560px; height:560px; transform:translateX(28%);}
  .pt .deco-ring.r2{width:380px; height:380px; border-color:rgba(53,48,43,0.11); transform:translateX(28%);}
  .pt .glow{position:absolute; width:240px; height:240px; border-radius:50%; background:var(--accent); opacity:0.08; filter:blur(60px); transform:translateX(20%);}

  .pt .kicker{position:relative; z-index:1; color:var(--accent-soft); font-size:0.8rem; font-weight:700; letter-spacing:0.2em; margin-bottom:1.25rem;}
  .pt .hero h1{position:relative; z-index:1; font-size:clamp(2.1rem,5.4vw,3.8rem); font-weight:800; line-height:1.25; text-wrap:balance; margin:0;}
  .pt .hero-sub{position:relative; z-index:1; margin-top:1.4rem; max-width:38em; color:var(--ink-muted); font-size:clamp(1rem,1.5vw,1.1rem);}
  .pt .cta-row{position:relative; z-index:1; display:flex; flex-wrap:wrap; gap:1rem; margin-top:2.25rem;}

  .pt .specs{position:relative; z-index:1; margin-top:clamp(2.5rem,6vw,3.5rem); display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; max-width:700px;}
  @media (max-width:640px){ .pt .specs{grid-template-columns:1fr;} }
  .pt .spec{border:1px solid var(--line); border-radius:0.9rem; padding:1.1rem 1.25rem; background:var(--charcoal);}
  .pt .spec .k{font-size:0.72rem; color:var(--ink-muted);}
  .pt .spec .v{margin-top:0.4rem; font-size:1.15rem; font-weight:800; color:var(--accent-soft); line-height:1.3;}

  .pt section.block{padding-block:clamp(3rem,7vw,5rem);}
  .pt section.block h2{font-size:clamp(1.4rem,2.6vw,1.9rem); font-weight:800; margin:0 0 1.75rem; text-wrap:balance;}
  .pt .lede{max-width:38em; color:var(--ink-muted); font-size:1rem; margin-top:-0.75rem; margin-bottom:2rem;}

  .pt .grid2{display:grid; grid-template-columns:repeat(2,1fr); gap:1.25rem;}
  @media (max-width:760px){ .pt .grid2{grid-template-columns:1fr;} }
  .pt .pain-card{border:1px solid var(--line); border-radius:1rem; padding:1.5rem 1.6rem;}
  .pt .pain-card p{color:var(--ink-muted); font-size:0.94rem; line-height:1.7;}
  .pt .pain-card .q{color:var(--ink); font-weight:700; margin-bottom:0.4rem; display:block;}

  .pt .solution-band{
    border:1px solid var(--line);
    border-radius:1.25rem;
    background:var(--charcoal);
    padding:clamp(1.75rem,4vw,2.5rem);
  }
  .pt .solution-band p{color:var(--ink-muted); font-size:0.98rem; max-width:44em;}
  .pt .solution-band p + p{margin-top:0.9rem;}

  .pt .point-list{display:flex; flex-direction:column;}
  .pt .point{
    display:grid;
    grid-template-columns:3rem 1fr;
    gap:1.5rem;
    padding-block:1.75rem;
    border-top:1px solid var(--line);
  }
  .pt .point:last-child{padding-bottom:0;}
  @media (max-width:640px){ .pt .point{grid-template-columns:1fr; gap:0.6rem;} }
  .pt .point .num{font-size:0.8rem; font-weight:800; color:var(--accent-soft); letter-spacing:0.05em;}
  .pt .point h3{font-size:1.1rem; font-weight:800; margin:0 0 0.5rem;}
  .pt .point p{color:var(--ink-muted); font-size:0.95rem; max-width:42em;}

  .pt .case-card{
    border:1px solid var(--line);
    border-radius:1.25rem;
    padding:clamp(1.75rem,4vw,2.5rem);
    display:flex;
    flex-wrap:wrap;
    gap:2rem;
    justify-content:space-between;
    align-items:flex-start;
  }
  .pt .future-frame{border:1px solid var(--line); border-radius:1.25rem; overflow:hidden; background:var(--charcoal); max-width:360px;}
  .pt .future-frame img{display:block; width:100%; height:auto;}
  .pt .case-card .loc{color:var(--ink-muted); font-size:0.82rem; margin-bottom:0.3rem;}
  .pt .case-card h3{font-size:1.3rem; font-weight:800; margin:0 0 0.75rem;}
  .pt .case-card p{color:var(--ink-muted); font-size:0.94rem; max-width:32em;}
  .pt .case-badge{
    flex-shrink:0;
    border:1px solid rgba(234,88,12,0.35);
    border-radius:999px;
    padding:0.4em 0.9em;
    font-size:0.72rem;
    font-weight:700;
    color:var(--accent-soft);
    white-space:nowrap;
  }

  .pt .flow-grid{display:grid; grid-template-columns:repeat(4,1fr); gap:1.25rem;}
  @media (max-width:900px){ .pt .flow-grid{grid-template-columns:repeat(2,1fr);} }
  @media (max-width:520px){ .pt .flow-grid{grid-template-columns:1fr;} }
  .pt .flow-card{border:1px solid var(--line); border-radius:1rem; padding:1.5rem 1.4rem;}
  .pt .flow-card .step-n{font-size:0.72rem; font-weight:700; color:var(--accent-soft); letter-spacing:0.1em; margin-bottom:0.75rem;}
  .pt .flow-card h3{font-size:1rem; font-weight:700; margin:0 0 0.5rem;}
  .pt .flow-card p{color:var(--ink-muted); font-size:0.87rem; line-height:1.65;}

  .pt .faq-item{border-top:1px solid var(--line); padding-block:1.5rem;}
  .pt .faq-item:last-child{padding-bottom:0;}
  .pt .faq-item .q{display:flex; gap:0.75rem; font-weight:700; margin-bottom:0.5rem;}
  .pt .faq-item .q .mark{color:var(--accent-soft); flex-shrink:0;}
  .pt .faq-item .a{display:flex; gap:0.75rem; color:var(--ink-muted); font-size:0.94rem;}
  .pt .faq-item .a .mark{color:var(--ink-muted); flex-shrink:0;}

  .pt .contact-card{
    border:1px solid var(--line); background:var(--charcoal); border-radius:1.25rem;
    padding:clamp(1.75rem,4vw,2.5rem);
    display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:1.5rem;
  }
  .pt .contact-card .k{font-size:0.75rem; color:var(--ink-muted); margin-bottom:0.4rem;}
  .pt .contact-card .email{font-size:clamp(1.15rem,2.6vw,1.5rem); font-weight:700; color:var(--accent-soft);}
  .pt .contact-card .email:hover{color:var(--accent);}
  .pt .contact-card .hint{color:var(--ink-muted); font-size:0.85rem; text-align:right;}

  .pt footer{padding-block:2rem;}
  .pt .footer-inner{display:flex; flex-wrap:wrap; justify-content:space-between; gap:1.5rem; align-items:flex-start; font-size:0.8rem; color:var(--ink-muted);}
  .pt .footer-inner .logo{font-size:0.95rem; color:var(--ink); margin-bottom:0.6rem;}
  .pt .footer-inner .foot-note{max-width:34em;}
  .pt .footer-meta{text-align:right;}

  .pt [data-reveal]{opacity:1; transform:none;}
  .pt [data-reveal].reveal-armed{opacity:0; transform:translateY(12px); transition:opacity 0.6s ease, transform 0.6s ease;}
  .pt [data-reveal].reveal-armed.is-visible{opacity:1; transform:none;}

  @media (prefers-reduced-motion: reduce){
    .pt *{animation-duration:0.001ms !important; transition-duration:0.001ms !important;}
    .pt [data-reveal]{opacity:1; transform:none;}
  }
`;

export default function PartnersPage() {
  return (
    <div className="pt">
      <style>{PAGE_STYLES}</style>
      <RevealOnScroll />

      <header>
        <div className="wrap header-inner">
          <span className="logo">
            <img className="logo-mark" src="/camly-logo-dark.png" alt="Camly" />
            <small>FOR PARTNERS</small>
          </span>
          <div className="header-links">
            <a className="text-link" href="/">
              サービス概要
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

          <p className="kicker" data-reveal="true">
            CAMLYを導入する
          </p>
          <h1 data-reveal="true">
            その一枚が、
            <br />
            次のお客様を連れてくる。
          </h1>
          <p className="hero-sub" data-reveal="true">
            Camlyは、宿泊施設・クラブ・撮影目的地に置く無人カメラレンタルです。
            ゲストの滞在体験を一段引き上げながら、センスのいい一枚がSNSでシェアされることで、
            施設の評判と集客につながります。
          </p>
          <div className="cta-row" data-reveal="true">
            <a className="pill pill-accent" href="#contact">
              導入について相談する
            </a>
            <a className="pill pill-outline" href="/">
              サービス概要を見る
            </a>
          </div>

          <div className="specs" data-reveal="true">
            <div className="spec">
              <div className="k">スタッフ対応</div>
              <div className="v">不要</div>
            </div>
            <div className="spec">
              <div className="k">設置スペース</div>
              <div className="v">最小限</div>
            </div>
            <div className="spec">
              <div className="k">レベニューシェア</div>
              <div className="v">ご相談可能</div>
            </div>
          </div>
        </section>

        <section className="block border-t wrap" id="pain">
          <div data-reveal="true">
            <p className="eyebrow">こんなお悩みありませんか？</p>
            <h2>スマホだけでは、その瞬間を撮りきれない。</h2>
          </div>
          <div className="grid2" data-reveal="true">
            {PAIN_CARDS.map(([q, body]) => (
              <div className="pain-card" key={q}>
                <span className="q">{q}</span>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="block border-t wrap" id="solution">
          <div data-reveal="true">
            <p className="eyebrow">SOLUTION</p>
            <h2>運用は、Camlyがすべて引き受けます。</h2>
          </div>
          <div className="solution-band" data-reveal="true">
            <p>
              ゲストご自身がQRコードを読み取り、貸出から返却までその場で完結します。予約受付、決済、貸出中のサポート、破損時の確認、保険設計——日々の運用はすべてCamly側で行います。
            </p>
            <p>施設側にお願いすることは、電源とわずかな設置スペースをご用意いただくことだけです。</p>
          </div>
        </section>

        <section className="block border-t wrap" id="merits">
          <div data-reveal="true">
            <p className="eyebrow">導入メリット</p>
            <h2>3つのメリットを、運用負荷ゼロで。</h2>
          </div>
          <div data-reveal="true">
            <p className="lede">貸出対応も、破損時の確認も、トラブル対応も——日々の運用はすべてCamly側が担います。施設に増えるのは、次の3つだけです。</p>
          </div>
          <div className="point-list" data-reveal="true">
            {MERIT_POINTS.map(([num, title, body]) => (
              <div className="point" key={num}>
                <div className="num">{num}</div>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="block border-t wrap" id="case">
          <div data-reveal="true">
            <p className="eyebrow">導入事例</p>
            <h2>今、実際に稼働している拠点。</h2>
          </div>
          <div className="case-card" data-reveal="true">
            <div>
              <p className="loc">栃木県那須</p>
              <h3>nasu room MINI</h3>
              <p>
                Camly最初のパイロット拠点。滞在先にそのままカメラが置いてあり、その場で借りてその場で返せる体験を提供しています。現在は実証実験期間中のため、事例はこの1拠点です。だからこそ、次に導入いただく施設様の声を、そのままサービスに反映させていきます。
              </p>
            </div>
            <span className="case-badge">実証実験中</span>
          </div>
        </section>

        <section className="block border-t wrap" id="future">
          <div data-reveal="true">
            <p className="eyebrow">FUTURE / PHASE B</p>
            <h2>将来的には、スマートボックス化も構想中。</h2>
            <p className="lede">現在は物理キー式のBOX(Phase A)で運用していますが、複数台のカメラを収容できるスマートボックスへの展開も構想しています。仕様・導入時期は未確定です。</p>
          </div>
          <div className="future-frame" data-reveal="true">
            <img src="/marketing/box-concept.jpg" alt="Camly 10-BAYスマートボックスのコンセプト" />
          </div>
        </section>

        <section className="block border-t wrap" id="flow">
          <div data-reveal="true">
            <p className="eyebrow">導入までの流れ</p>
            <h2>ご相談から運用開始まで。</h2>
          </div>
          <div className="flow-grid" data-reveal="true">
            {FLOW_CARDS.map(([step, title, body]) => (
              <div className="flow-card" key={step}>
                <div className="step-n">{step}</div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="block border-t wrap" id="faq">
          <div data-reveal="true">
            <p className="eyebrow">FAQ</p>
            <h2>よくあるご質問。</h2>
          </div>
          <div data-reveal="true">
            {FAQS.map(([q, a]) => (
              <div className="faq-item" key={q}>
                <div className="q">
                  <span className="mark">Q.</span>
                  <span>{q}</span>
                </div>
                <div className="a">
                  <span className="mark">A.</span>
                  <span>{a}</span>
                </div>
              </div>
            ))}
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
              <a className="email" href="mailto:camly.support@gmail.com?subject=Camly%E5%B0%8E%E5%85%A5%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6">
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
              <img className="logo-mark" src="/camly-logo-dark.png" alt="Camly" />
              <small>CAPTURE YOUR MOMENT ANYWHERE</small>
            </p>
            <p className="foot-note">
              Make every place more possible. — 現在は実証実験(パイロット)フェーズです。
              正式な事業者情報・特定商取引法に基づく表示は準備中のため、本ページには掲載していません。
            </p>
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

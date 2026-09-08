/**
 * マーケティングページ(/, /partners, /guide)共通のデザイントークン+構造CSS。
 * 従来は各ページの PAGE_STYLES にほぼ同一のCSSを3重に複製していた
 * (.lp / .pt / .gd という別クラスで、色トークンだけ微妙に違う状態)。
 * ここに一本化し、`.site[data-theme="dark|light"]` で明暗を切り替える。
 *
 * デザイン方針(Apple型): 装飾(リング・グリッド・グロー・多重シャドウ)を削り、
 * 大きな余白・単一フォント(システムフォントのみ)・巨大タイポグラフィで静けさを作る。
 * アクセントカラーはCTAなど本当に必要な箇所だけに絞って使う。
 *
 * 個別ページ固有のセクション(例: /partnersのcase-card)もここに含めており、
 * 未使用クラスがページに残るのは許容している(inline <style>なので追加コストはテキスト量のみ)。
 */
export const MARKETING_STYLES = `
  .site[data-theme="dark"]{
    --black:#141210;
    --bg:#141210;
    --charcoal:#1c1a17;
    --charcoal-2:#242019;
    --line:#2e2a25;
    --line-soft:rgba(245,241,234,0.08);
    --ink:#f5f1ea;
    --ink-muted:#948a7c;
    --accent:#ff5a1f;
    --accent-soft:#ffb08a;
    --selection-fg:var(--black);
  }
  .site[data-theme="light"]{
    --black:#141210;
    --bg:#fbfaf6;
    --charcoal:#f4f1ea;
    --charcoal-2:#efe8d9;
    --line:#e6e0d3;
    --line-soft:rgba(24,20,16,0.07);
    --ink:#181410;
    --ink-muted:#797063;
    --accent:#ea580c;
    --accent-soft:#b8460c;
    --selection-fg:#fff;
  }

  .site{
    --font-sys:-apple-system,BlinkMacSystemFont,"SF Pro Text","Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic",sans-serif;
    font-family:var(--font-sys);
    background:var(--bg); color:var(--ink); line-height:1.6;
  }
  .site *{box-sizing:border-box;}
  .site ::selection{background:var(--accent); color:var(--selection-fg);}
  .site a{color:inherit; text-decoration:none; -webkit-tap-highlight-color:transparent;}
  .site a:focus-visible, .site button:focus-visible{outline:2px solid var(--accent); outline-offset:3px; border-radius:2px;}
  .site p{margin:0;}
  .site h1, .site h2, .site h3{font-family:var(--font-sys); letter-spacing:-0.02em; font-weight:600;}

  .site .wrap{max-width:1120px; margin:0 auto; padding-inline:clamp(1.25rem,4vw,4rem);}
  /* Apple型: セクションの区切りはボーダーではなく背景の交互(bg/charcoal)で作る */
  .site .border-t{border-top:none;}
  .site main > section.block:nth-of-type(even){background:var(--charcoal);}

  .site .eyebrow{
    display:block;
    color:var(--ink-muted);
    font-size:0.8rem;
    font-weight:600;
    letter-spacing:0.01em;
    margin-bottom:0.6rem;
  }
  .site[data-theme="dark"] .eyebrow{color:var(--ink-muted);}

  .site header{
    position:sticky; top:0; z-index:20;
    background:color-mix(in srgb, var(--bg) 72%, transparent);
    backdrop-filter:saturate(1.6) blur(16px);
    -webkit-backdrop-filter:saturate(1.6) blur(16px);
    border-bottom:1px solid var(--line-soft);
  }
  .site .header-inner{display:flex; align-items:center; justify-content:space-between; padding-block:1rem; gap:1rem;}
  .site .logo{font-weight:600; font-size:1.05rem; letter-spacing:-0.01em; display:flex; align-items:center; gap:0.6rem;}
  .site .logo-mark{display:block; height:19px; width:auto;}
  .site .logo-mark.lg{height:30px;}
  .site .footer-inner .logo{display:flex; align-items:flex-start; flex-direction:column; gap:0.5rem;}
  .site .logo small{
    display:block;
    font-size:0.62rem; font-weight:500; letter-spacing:0.08em;
    color:var(--ink-muted); margin-top:0.15rem;
  }
  .site .header-links{display:flex; align-items:center; gap:1.5rem;}
  .site .text-link{font-size:0.86rem; color:var(--ink-muted); transition:color 0.2s ease;}
  .site .text-link:hover{color:var(--ink);}

  .site .pill{
    display:inline-flex; align-items:center; justify-content:center; gap:0.5em;
    border-radius:980px; font-weight:400; font-size:1.05rem; letter-spacing:0;
    padding:0.68em 1.3em; white-space:nowrap;
    transition:opacity 0.2s ease, background 0.2s ease, color 0.2s ease;
  }
  .site .pill-sm{padding:0.55em 1.1em; font-size:0.92rem;}
  .site .pill-accent{background:var(--accent); color:#fff;}
  .site .pill-accent:hover{opacity:0.86;}
  .site .pill-outline{
    padding-inline:0; border-radius:0; color:var(--accent);
    display:inline-flex; align-items:center; gap:0.3em;
  }
  .site .pill-outline::after{content:"›"; font-size:1.1em; transition:transform 0.2s ease;}
  .site .pill-outline:hover{text-decoration:underline; text-underline-offset:0.2em;}
  .site .pill-outline:hover::after{transform:translateX(3px);}
  .site .pill-outline.pill-sm{font-size:0.92rem;}

  .site .hero{position:relative; padding-block:clamp(4rem,11vw,8.5rem) clamp(3.5rem,8vw,6rem); overflow:hidden; text-align:center;}
  .site .hero .wrap, .site .hero.wrap{display:flex; flex-direction:column; align-items:center;}
  .site .hero-rings, .site .deco-ring, .site .glow{display:none;}
  /* 単色フラットすぎないよう、控えめなグラデーションの光だまりを1つだけ背後に置く */
  .site .hero::before{
    content:""; position:absolute; z-index:0; top:-15%; left:50%; transform:translateX(-50%);
    width:min(70vw,760px); height:min(70vw,760px); border-radius:50%;
    background:radial-gradient(circle, var(--accent) 0%, transparent 68%);
    opacity:0.16; filter:blur(70px); pointer-events:none;
  }

  /* Instagramのストーリーハイライトを参考にした、主要情報へのショートカット */
  .site .highlights{position:relative; z-index:1; display:flex; gap:clamp(1.1rem,3vw,2rem); margin-top:2.75rem; flex-wrap:wrap; justify-content:center;}
  .site .highlight{display:flex; flex-direction:column; align-items:center; gap:0.55rem; width:68px;}
  .site .highlight .ring{
    width:58px; height:58px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    background:var(--charcoal-2); border:1.5px solid var(--accent);
    transition:transform 0.2s ease, box-shadow 0.2s ease;
  }
  .site .highlight .ring svg{width:24px; height:24px;}
  .site .highlight:hover .ring{transform:translateY(-3px); box-shadow:0 8px 20px -10px color-mix(in srgb, var(--accent) 55%, transparent);}
  .site .highlight span{font-size:0.74rem; color:var(--ink-muted); text-align:center; line-height:1.3;}

  /*
   * サイトを開いた瞬間に画面いっぱいに出るロゴのスプラッシュ。実体のホーム画面(ヘッダー・hero)の上に
   * 固定表示し、一定時間で自動フェードアウトしてホームを見せる(BrandIntro.tsx側でタイマー制御)。
   */
  .site .brand-intro{
    position:fixed; inset:0; z-index:100;
    background:var(--black); color:#fff;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    text-align:center; padding:2rem; cursor:pointer;
    opacity:1; transition:opacity 0.6s ease;
  }
  .site .brand-intro.is-hiding{opacity:0; pointer-events:none;}
  .site .brand-intro .logo{
    height:clamp(72px,15vw,168px); width:auto; display:block;
    animation:logo-rise 1s cubic-bezier(0.16,1,0.3,1) 0.12s both;
  }
  .site .brand-intro .tagline{
    margin-top:1.6rem; color:var(--accent); font-weight:600; letter-spacing:0.12em;
    font-size:clamp(0.82rem,1.9vw,1.15rem); text-transform:uppercase;
    animation:fade-up 0.9s ease-out 0.5s both;
  }
  @keyframes logo-rise{0%{opacity:0; transform:translateY(22px) scale(0.94);} 100%{opacity:1; transform:translateY(0) scale(1);}}
  @keyframes fade-up{0%{opacity:0; transform:translateY(8px);} 100%{opacity:1; transform:translateY(0);}}

  .site .status-badge{
    position:relative; z-index:1; display:inline-flex; align-items:center; gap:0.55em;
    background:var(--charcoal-2);
    border-radius:980px; padding:0.4em 1em 0.4em 0.8em; margin-bottom:2rem;
  }
  .site .status-dot{width:6px; height:6px; border-radius:50%; background:var(--accent);}
  .site .status-badge .label{color:var(--ink-muted); font-size:0.78rem; font-weight:500; letter-spacing:0;}

  .site .kicker-group{position:relative; z-index:1; margin-bottom:1.75rem; display:flex; flex-direction:column; align-items:center;}
  .site .kicker-sub{margin-top:0.6rem; color:var(--ink-muted); font-size:0.78rem; font-weight:500; letter-spacing:0.01em;}
  .site .kicker{position:relative; z-index:1; color:var(--ink-muted); font-size:0.85rem; font-weight:500; letter-spacing:0; margin-bottom:1.5rem;}

  .site .hero h1{
    position:relative; z-index:1;
    font-size:clamp(2.6rem,8vw,6rem); font-weight:600; line-height:1.05; letter-spacing:-0.015em;
    text-wrap:balance; margin:0;
  }
  .site .hero-sub{
    position:relative; z-index:1; margin-top:1.5rem; max-width:34em;
    color:var(--ink-muted); font-size:clamp(1.05rem,1.8vw,1.3rem); line-height:1.55;
  }
  .site .cta-row{position:relative; z-index:1; display:flex; flex-wrap:wrap; justify-content:center; gap:1.5rem; margin-top:2.5rem; align-items:center;}

  .site .specs{
    position:relative; z-index:1; margin-top:clamp(3.5rem,8vw,5rem);
    display:grid; grid-template-columns:repeat(3,1fr); gap:0; max-width:640px; width:100%;
    border-top:1px solid var(--line);
  }
  @media (max-width:640px){ .site .specs{grid-template-columns:1fr;} }
  .site .spec{padding:1.5rem 1rem; text-align:center; border-right:1px solid var(--line);}
  .site .spec:last-child{border-right:none;}
  @media (max-width:640px){ .site .spec{border-right:none; border-bottom:1px solid var(--line);} .site .spec:last-child{border-bottom:none;} }
  .site .spec .k{font-size:0.78rem; color:var(--ink-muted);}
  .site .spec .v{margin-top:0.5rem; font-size:1.5rem; font-weight:600; font-variant-numeric:tabular-nums; letter-spacing:-0.01em;}
  .site .spec .v small{font-size:0.62rem; color:var(--ink-muted); font-weight:400;}

  .site section.block{padding-block:clamp(4.5rem,10vw,7rem); text-align:center;}
  .site section.block h2{
    font-size:clamp(1.9rem,4.5vw,3.5rem); font-weight:600; margin:0 auto 1.5rem; text-wrap:balance;
    line-height:1.15; letter-spacing:-0.015em; max-width:16em;
  }
  .site .lede{max-width:34em; color:var(--ink-muted); font-size:1.1rem; line-height:1.6; margin:0 auto 3rem;}

  .site .gallery-track-wrap{
    overflow:hidden;
    -webkit-mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent);
    mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent);
  }
  .site .gallery-track{display:flex; gap:1.25rem; width:max-content; animation:gallery-scroll 34s linear infinite;}
  .site .gallery-track:hover{animation-play-state:paused;}
  .site .gallery-track figure{margin:0; flex-shrink:0; width:320px; height:220px; border-radius:1.75rem; overflow:hidden;}
  .site .gallery-track img{display:block; width:100%; height:100%; object-fit:cover; transition:transform 0.6s ease;}
  .site .gallery-track figure:hover img{transform:scale(1.07);}
  @keyframes gallery-scroll{from{transform:translateX(-50%);} to{transform:translateX(0);}}
  @media (max-width:640px){ .site .gallery-track figure{width:220px; height:150px;} }
  .site .gallery-caption{margin-top:1.25rem; color:var(--ink-muted); font-size:0.9rem;}

  /* Instagramのグリッド投稿を参考にした正方形フォトグリッド */
  .site .ig-grid{display:grid; grid-template-columns:repeat(3,1fr); gap:0.4rem; text-align:left;}
  .site .ig-grid figure{position:relative; margin:0; aspect-ratio:1; overflow:hidden; border-radius:1.1rem; background:var(--charcoal-2);}
  .site .ig-grid img{display:block; width:100%; height:100%; object-fit:cover; transition:transform 0.5s ease;}
  .site .ig-grid figure:hover img{transform:scale(1.08);}
  .site .ig-grid figure::after{
    content:""; position:absolute; inset:0; opacity:0; transition:opacity 0.25s ease;
    background:linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.45) 100%);
  }
  .site .ig-grid figure:hover::after{opacity:1;}
  .site .ig-like{
    position:absolute; left:0.9rem; bottom:0.8rem; z-index:1; display:flex; align-items:center; gap:0.4rem;
    color:#fff; font-size:0.82rem; font-weight:600; opacity:0; transform:translateY(6px);
    transition:opacity 0.25s ease, transform 0.25s ease;
  }
  .site .ig-grid figure:hover .ig-like{opacity:1; transform:translateY(0);}
  @media (max-width:520px){ .site .ig-grid{gap:0.25rem;} .site .ig-grid figure{border-radius:0.7rem;} }

  /* Instagramのプロフィールカードを参考にしたフォロー導線 */
  .site .ig-follow{
    display:flex; align-items:center; gap:1.25rem; flex-wrap:wrap;
    background:var(--charcoal-2); border-radius:1.75rem; padding:1.5rem 1.75rem; text-align:left;
  }
  .site .ig-avatar{
    width:56px; height:56px; border-radius:50%; flex-shrink:0; padding:2.5px;
    background:linear-gradient(135deg, var(--accent-soft), var(--accent) 60%, var(--accent-soft));
  }
  .site .ig-avatar img{width:100%; height:100%; border-radius:50%; object-fit:cover; border:2.5px solid var(--charcoal-2);}
  .site .ig-follow-meta{flex:1; min-width:180px;}
  .site .ig-follow-meta .handle{font-weight:600; font-size:1.02rem; letter-spacing:-0.01em;}
  .site .ig-follow-meta .sub{color:var(--ink-muted); font-size:0.88rem; margin-top:0.25rem;}


  /* Instagramの「1st location alert」投稿を参考にした、実写背景つきの告知バナー */
  .site .location-alert{
    position:relative; z-index:1; margin:0 auto;
    border-radius:1.75rem; overflow:hidden; text-align:left;
    aspect-ratio:4/5; display:flex; align-items:flex-end; max-width:440px; width:100%;
    background:var(--charcoal-2);
  }
  .site .location-alert img{position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; transition:transform 0.6s ease;}
  .site .location-alert:hover img{transform:scale(1.05);}
  .site .location-alert::before{
    content:""; position:absolute; inset:0; z-index:0;
    background:linear-gradient(180deg, rgba(20,18,16,0.05) 35%, rgba(20,18,16,0.92) 100%);
  }
  .site .location-alert .content{position:relative; z-index:1; padding:1.75rem; color:#fff;}
  .site .location-alert .tag{
    display:inline-block; background:var(--accent); color:#fff; font-size:0.7rem; font-weight:700;
    letter-spacing:0.08em; padding:0.4em 0.85em; border-radius:980px; margin-bottom:0.9rem;
  }
  .site .location-alert h3{font-size:1.5rem; font-weight:600; margin:0 0 0.35rem; color:#fff; letter-spacing:-0.01em;}
  .site .location-alert p{color:rgba(255,255,255,0.82); font-size:0.92rem;}

  .site .grid2{display:grid; grid-template-columns:repeat(2,1fr); gap:1rem; text-align:left;}
  @media (max-width:760px){ .site .grid2{grid-template-columns:1fr;} }
  .site .grid3{display:grid; grid-template-columns:repeat(3,1fr); gap:2.5rem; text-align:left;}
  @media (max-width:760px){ .site .grid3{grid-template-columns:1fr; gap:2rem;} }
  .site .grid3 h3{font-weight:600; font-size:1.15rem; margin:0 0 0.5rem; letter-spacing:-0.01em;}
  .site .grid3 p{color:var(--ink-muted); font-size:0.98rem; line-height:1.65;}

  .site .pain-card{background:var(--charcoal-2); border-radius:1.75rem; padding:2rem; text-align:left; transition:transform 0.25s ease, box-shadow 0.25s ease;}
  .site .pain-card:hover{transform:translateY(-4px);}
  .site .pain-card p{color:var(--ink-muted); font-size:0.98rem; line-height:1.65;}
  .site .pain-card .q{color:var(--ink); font-weight:600; margin-bottom:0.6rem; display:block; letter-spacing:-0.01em;}

  .site .solution-band{background:var(--charcoal-2); border-radius:1.75rem; padding:clamp(2rem,5vw,3rem); text-align:left;}
  .site .solution-band p{color:var(--ink-muted); font-size:1.05rem; max-width:44em; line-height:1.7;}
  .site .solution-band p + p{margin-top:1rem;}

  .site .point-list{display:flex; flex-direction:column; text-align:left;}
  .site .point{display:grid; grid-template-columns:3rem 1fr; gap:1.5rem; padding-block:2rem; border-top:1px solid var(--line);}
  .site .point:last-child{padding-bottom:0;}
  @media (max-width:640px){ .site .point{grid-template-columns:1fr; gap:0.6rem;} }
  .site .point .num{font-size:0.9rem; font-weight:600; color:var(--ink-muted); letter-spacing:0;}
  .site .point h3{font-size:1.2rem; font-weight:600; margin:0 0 0.5rem; letter-spacing:-0.01em;}
  .site .point p{color:var(--ink-muted); font-size:1rem; max-width:42em; line-height:1.65;}

  .site .flow-grid{display:grid; grid-template-columns:repeat(4,1fr); gap:1.5rem; text-align:left;}
  @media (max-width:900px){ .site .flow-grid{grid-template-columns:repeat(2,1fr);} }
  @media (max-width:520px){ .site .flow-grid{grid-template-columns:1fr;} }
  .site .flow-card{background:var(--charcoal-2); border-radius:1.75rem; padding:1.75rem 1.5rem; transition:transform 0.25s ease, box-shadow 0.25s ease;}
  .site .flow-card:hover{transform:translateY(-4px);}
  .site .flow-card .step-n{font-size:0.78rem; font-weight:500; color:var(--ink-muted); letter-spacing:0.02em; margin-bottom:0.9rem;}
  .site .flow-card h3{font-size:1.05rem; font-weight:600; margin:0 0 0.5rem; letter-spacing:-0.01em;}
  .site .flow-card p{color:var(--ink-muted); font-size:0.9rem; line-height:1.6;}

  /* トップページ専用: 借り方/返し方の2カラム手順 */
  .site .flow-2col{display:grid; grid-template-columns:repeat(2,1fr); gap:3rem; text-align:left;}
  @media (max-width:760px){ .site .flow-2col{grid-template-columns:1fr;} }
  .site .flow-col > .eyebrow{margin-bottom:1.25rem; font-weight:600;}
  .site .flow-step{display:flex; gap:1rem; margin-bottom:1.2rem; align-items:flex-start;}
  .site .flow-step .n{color:var(--ink-muted); font-weight:600; font-size:0.9rem; flex-shrink:0; width:1.4em;}
  .site .flow-step p{color:var(--ink-muted); font-size:0.96rem; line-height:1.65;}
  .site .flow-thumb{
    width:64px; height:64px; border-radius:1.25rem; background:var(--charcoal-2);
    flex-shrink:0; margin-left:auto; display:flex; align-items:center; justify-content:center;
  }
  .site .flow-thumb svg{width:36px; height:36px;}

  .site .partner-grid{display:grid; grid-template-columns:repeat(2,1fr); gap:1.25rem; text-align:left;}
  @media (max-width:760px){ .site .partner-grid{grid-template-columns:1fr;} }
  .site .partner-card{background:var(--charcoal-2); border-radius:1.75rem; padding:2rem; transition:transform 0.25s ease, box-shadow 0.25s ease;}
  .site .partner-card:hover{transform:translateY(-4px);}
  .site .partner-card .eyebrow{font-size:0.82rem; color:var(--ink); font-weight:600;}
  .site .partner-card p{color:var(--ink-muted); font-size:0.98rem; line-height:1.65;}

  .site .case-card{
    background:var(--charcoal-2); border-radius:1.75rem; padding:clamp(2rem,5vw,3rem);
    display:flex; flex-wrap:wrap; gap:2rem; justify-content:space-between; align-items:flex-start;
    text-align:left;
  }
  .site .future-frame{border-radius:1.75rem; overflow:hidden; background:var(--charcoal-2); max-width:360px;}
  .site .future-frame img{display:block; width:100%; height:auto;}
  .site .case-card .loc{color:var(--ink-muted); font-size:0.88rem; margin-bottom:0.4rem;}
  .site .case-card h3{font-size:1.4rem; font-weight:600; margin:0 0 0.75rem; letter-spacing:-0.01em;}
  .site .case-card p{color:var(--ink-muted); font-size:1rem; max-width:32em; line-height:1.65;}
  .site .case-badge{
    flex-shrink:0; background:var(--bg); border-radius:980px;
    padding:0.45em 1em; font-size:0.78rem; font-weight:500; color:var(--ink-muted); white-space:nowrap;
  }

  .site .faq-item{border-top:1px solid var(--line); padding-block:1.75rem; text-align:left;}
  .site .faq-item:last-child{padding-bottom:0;}
  .site .faq-item .q{display:flex; gap:0.75rem; font-weight:600; margin-bottom:0.6rem; font-size:1.02rem; letter-spacing:-0.01em;}
  .site .faq-item .q .mark{color:var(--ink-muted); flex-shrink:0;}
  .site .faq-item .a{display:flex; gap:0.75rem; color:var(--ink-muted); font-size:0.98rem; line-height:1.6;}
  .site .faq-item .a .mark{color:var(--ink-muted); flex-shrink:0;}

  .site .step-list{display:flex; flex-direction:column; text-align:left;}
  .site .step{
    display:grid; grid-template-columns:3rem 1fr; gap:1.5rem; align-items:start;
    padding-block:2rem; border-top:1px solid var(--line);
  }
  .site .step:last-child{padding-bottom:0;}
  @media (max-width:640px){
    .site .step{grid-template-columns:1fr; gap:0.5rem;}
  }
  .site .step .n{font-size:0.9rem; font-weight:600; color:var(--ink-muted); letter-spacing:0;}
  .site .step h3{font-size:1.1rem; font-weight:600; margin:0 0 0.4rem; letter-spacing:-0.01em;}
  .site .step p{color:var(--ink-muted); font-size:0.98rem; max-width:42em; line-height:1.6;}
  .site .step-thumb{
    width:76px; height:76px; border-radius:1.25rem; background:var(--charcoal-2);
    flex-shrink:0; overflow:hidden; display:flex; align-items:center; justify-content:center;
  }
  .site .step-thumb img{width:100%; height:100%; object-fit:cover;}
  .site .step-photo{margin-top:1rem; width:160px; max-width:100%; border-radius:1rem; overflow:hidden;}
  .site .step-photo img{display:block; width:100%; height:auto;}

  .site .price-box{background:var(--charcoal-2); border-radius:1.75rem; padding:2rem 2.25rem; margin-top:2.5rem; text-align:left;}
  .site .price-box-label{font-size:0.85rem; color:var(--ink-muted); font-weight:500; margin-bottom:1.25rem;}
  .site .price-tiers{display:flex; gap:1.5rem; flex-wrap:wrap;}
  .site .price-tier{flex:1; min-width:100px;}
  .site .price-tier .t-label{display:block; font-size:0.82rem; color:var(--ink-muted); margin-bottom:0.35rem;}
  .site .price-tier .t-price{display:block; font-size:1.5rem; font-weight:600; font-variant-numeric:tabular-nums; letter-spacing:-0.01em;}
  .site .price-box-note{font-size:0.85rem; color:var(--ink-muted); margin-top:1.5rem; padding-top:1.5rem; border-top:1px solid var(--line);}
  @media (max-width:480px){ .site .price-tiers{gap:1rem;} }

  .site .settings-grid{display:grid; grid-template-columns:repeat(2,1fr); gap:1.5rem; text-align:left;}
  @media (max-width:760px){ .site .settings-grid{grid-template-columns:1fr;} }
  .site .settings-card{background:var(--charcoal-2); border-radius:1.75rem; overflow:hidden; transition:transform 0.25s ease, box-shadow 0.25s ease;}
  .site .settings-card:hover{transform:translateY(-4px);}
  .site .settings-photo{aspect-ratio:16/10; overflow:hidden;}
  .site .settings-photo img{display:block; width:100%; height:100%; object-fit:cover;}
  .site .settings-head{display:flex; align-items:baseline; gap:0.75rem; padding:1.5rem 1.5rem 0;}
  .site .settings-head .num{font-size:1.7rem; font-weight:600; font-variant-numeric:tabular-nums; color:var(--ink-muted);}
  .site .settings-head h3{font-size:1.1rem; font-weight:600; margin:0; letter-spacing:-0.01em;}
  .site .settings-head .sub{color:var(--ink-muted); font-size:0.85rem;}
  .site .settings-list{padding:1.25rem 1.5rem 1.5rem; display:flex; flex-direction:column; gap:0.7rem;}
  .site .settings-list .row{display:flex; gap:0.75rem; font-size:0.9rem;}
  .site .settings-list .row .label{color:var(--ink); font-weight:600; flex-shrink:0; width:6.5em;}
  .site .settings-list .row .val{color:var(--ink-muted);}

  .site .care-grid{display:grid; grid-template-columns:repeat(3,1fr); gap:1.25rem; text-align:left;}
  @media (max-width:760px){ .site .care-grid{grid-template-columns:1fr;} }
  .site .care-card{background:var(--charcoal-2); border-radius:1.75rem; padding:1.75rem; transition:transform 0.25s ease, box-shadow 0.25s ease;}
  .site .care-card:hover{transform:translateY(-4px);}
  .site .care-card .num{font-size:1.6rem; font-weight:600; color:var(--ink-muted); font-variant-numeric:tabular-nums;}
  .site .care-card h3{font-size:1.05rem; font-weight:600; margin:0.9rem 0 0.6rem; letter-spacing:-0.01em;}
  .site .care-card p{color:var(--ink-muted); font-size:0.92rem; line-height:1.65;}

  .site .care-notes{margin-top:2rem; display:flex; flex-direction:column; gap:0.85rem; text-align:left;}
  .site .care-notes .note{display:flex; gap:0.75rem; color:var(--ink-muted); font-size:0.92rem;}
  .site .care-notes .note .mark{color:var(--ink-muted); flex-shrink:0;}

  .site .contact-card{
    background:var(--charcoal-2); border-radius:1.75rem;
    padding:clamp(2rem,5vw,3rem);
    display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:1.5rem;
    text-align:left;
  }
  .site .contact-card .k{font-size:0.85rem; color:var(--ink-muted); margin-bottom:0.5rem;}
  .site .contact-card .email{font-size:clamp(1.2rem,2.6vw,1.6rem); font-weight:600; letter-spacing:-0.01em; transition:color 0.2s ease;}
  .site .contact-card .email:hover{color:var(--accent);}
  .site .contact-card .hint{color:var(--ink-muted); font-size:0.9rem; text-align:right;}
  @media (max-width:520px){ .site .contact-card .hint{text-align:left;} }

  .site footer{padding-block:2.5rem;}
  .site .footer-inner{display:flex; flex-wrap:wrap; justify-content:space-between; gap:1.5rem; align-items:flex-start; font-size:0.85rem; color:var(--ink-muted); text-align:left;}
  .site .footer-inner .logo{font-size:0.98rem; color:var(--ink); margin-bottom:0.6rem;}
  .site .footer-inner .foot-note{max-width:34em; line-height:1.6;}
  .site .footer-social{display:inline-flex; align-items:center; gap:0.4rem; margin-top:0.9rem;}
  .site .footer-meta{text-align:right;}

  .site [data-reveal]{opacity:1; transform:none;}
  .site [data-reveal].reveal-armed{opacity:0; transform:translateY(10px); transition:opacity 0.7s ease, transform 0.7s ease;}
  .site [data-reveal].reveal-armed.is-visible{opacity:1; transform:none;}

  @media (prefers-reduced-motion: reduce){
    .site *{animation-duration:0.001ms !important; transition-duration:0.001ms !important;}
    .site [data-reveal]{opacity:1; transform:none;}
  }
`;

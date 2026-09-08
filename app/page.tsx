/**
 * ブランドLP(§4 `/`, §16)。camly.jp のルートとして配信される。
 * 元はClaude Artifactとして作り込んだ「サービス概要」ページをそのまま移植したものだが、
 * 抽象的なコピー・英語のセクション見出し・重複した説明を整理し、
 * 「何ができて、いくらで、どこにあるか」が最初の数行でわかる構成に書き直した。
 * スタイルは app/_components/marketingTheme.ts の共通デザインシステムを使用(/partners, /guide と共通)。
 */
import RevealOnScroll from "./_components/RevealOnScroll";
import GalleryLoop from "./_components/GalleryLoop";
import BrandIntro from "./_components/BrandIntro";
import SiteHeader from "./_components/SiteHeader";
import SiteFooter from "./_components/SiteFooter";
import { MARKETING_STYLES } from "./_components/marketingTheme";

const GALLERY_IMAGES = [
  "/marketing/gallery-1.jpg",
  "/marketing/gallery-2.jpg",
  "/marketing/gallery-3.jpg",
  "/marketing/gallery-4.jpg",
  "/marketing/gallery-5.jpg",
];

export default function HomePage() {
  return (
    <div className="site" data-theme="dark">
      <style>{MARKETING_STYLES}</style>
      <RevealOnScroll />

      <BrandIntro />

      <SiteHeader
        variant="dark"
        links={[{ href: "/guide", label: "使い方ガイド" }]}
        cta={{ href: "#contact", label: "お問い合わせ" }}
      />

      <main>
        <section className="hero wrap">
          <div className="status-badge" data-reveal="true">
            <span className="status-dot" />
            <span className="label">実証実験(パイロット)中 — 稼働は現在1拠点です</span>
          </div>

          <h1 data-reveal="true">その場で借りて、その場で返す。</h1>

          <p className="hero-sub" data-reveal="true">
            宿泊施設やクラブに置かれたカメラを、QRコードを読むだけでレンタルできます。
            予約もアプリのインストールも不要。今使えるのは栃木・那須「nasu room MINI」の1拠点、¥990からです。
          </p>

          <div className="cta-row" data-reveal="true">
            <a className="pill pill-accent" href="/pilot/box/box_pub_3e9d7b">
              カメラを借りる
            </a>
            <a className="pill pill-outline" href="/partners">
              施設への導入を相談する
            </a>
          </div>

          <div className="specs" data-reveal="true">
            <div className="spec">
              <div className="k">開始時期</div>
              <div className="v">2026年</div>
            </div>
            <div className="spec">
              <div className="k">利用できる場所</div>
              <div className="v">
                nasu room MINI
                <br />
                <small>栃木県那須(1拠点)</small>
              </div>
            </div>
            <div className="spec">
              <div className="k">料金</div>
              <div className="v">¥990〜</div>
            </div>
          </div>

          <div className="highlights" data-reveal="true">
            <a className="highlight" href="#how">
              <span className="ring">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="7" width="18" height="13" rx="2.5" stroke="var(--ink-muted)" strokeWidth="1.6" />
                  <path d="M8 7l1.6-2.5h4.8L16 7" stroke="var(--ink-muted)" strokeWidth="1.6" strokeLinejoin="round" />
                  <circle cx="12" cy="13.5" r="3.4" stroke="var(--ink-muted)" strokeWidth="1.6" />
                </svg>
              </span>
              <span>使い方</span>
            </a>
            <a className="highlight" href="#trust">
              <span className="ring">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="var(--ink-muted)" strokeWidth="1.6" />
                  <path d="M12 7v10M9.5 9.3c0-1.1 1.1-1.9 2.5-1.9s2.5.8 2.5 1.8-1 1.5-2.5 1.8-2.5.8-2.5 1.8 1.1 1.8 2.5 1.8 2.5-.8 2.5-1.9" stroke="var(--ink-muted)" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              <span>料金</span>
            </a>
            <a className="highlight" href="/partners#case">
              <span className="ring">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 21s-7-6.2-7-11.2A7 7 0 0 1 19 9.8C19 14.8 12 21 12 21z" stroke="var(--ink-muted)" strokeWidth="1.6" strokeLinejoin="round" />
                  <circle cx="12" cy="9.5" r="2.4" stroke="var(--ink-muted)" strokeWidth="1.6" />
                </svg>
              </span>
              <span>設置場所</span>
            </a>
            <a className="highlight" href="#gallery">
              <span className="ring">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" stroke="var(--ink-muted)" strokeWidth="1.6" />
                  <circle cx="12" cy="12" r="4.2" stroke="var(--ink-muted)" strokeWidth="1.6" />
                  <circle cx="17.4" cy="6.6" r="1.1" fill="var(--ink-muted)" />
                </svg>
              </span>
              <span>Instagram</span>
            </a>
          </div>
        </section>

        <section className="block border-t wrap" id="how">
          <div data-reveal="true">
            <p className="eyebrow">使い方</p>
            <h2>借りるのも、返すのも、その場で。</h2>
          </div>
          <p className="lede" data-reveal="true">
            設置場所のQRコードを読み取り、画面の案内に沿って進めるだけです。スタッフの対応や事前予約はありません。
          </p>
          <div className="flow-2col" data-reveal="true">
            <div className="flow-col">
              <p className="eyebrow" style={{ fontSize: "0.8rem" }}>
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
              <p className="eyebrow" style={{ fontSize: "0.8rem" }}>
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

        <section className="block border-t wrap" id="location">
          <div className="location-alert" data-reveal="true">
            <img src="/marketing/nasu-room-mini.jpg" alt="nasu room MINIのウッドデッキと森" style={{ objectPosition: "center 78%" }} />
            <div className="content">
              <span className="tag">1ST LOCATION ALERT</span>
              <h3>nasu room MINI(栃木・那須)</h3>
              <p>SONY RX100 M3を¥990〜でレンタル可能。滞在中の思い出を、自由に撮影できます。</p>
            </div>
          </div>
        </section>

        <section className="block border-t wrap" id="gallery">
          <div data-reveal="true">
            <p className="eyebrow">撮れる写真</p>
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
            すべて、実際にnasu room MINIで貸し出しているカメラで撮影したものです。
          </p>

          <div className="ig-follow" data-reveal="true" style={{ marginTop: "1.75rem" }}>
            <span className="ig-avatar">
              <span
                style={{
                  display: "flex",
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: "var(--bg)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="7" width="18" height="13" rx="2.5" stroke="var(--accent)" strokeWidth="1.6" />
                  <path d="M8 7l1.6-2.5h4.8L16 7" stroke="var(--accent)" strokeWidth="1.6" strokeLinejoin="round" />
                  <circle cx="12" cy="13.5" r="3.4" stroke="var(--accent)" strokeWidth="1.6" />
                </svg>
              </span>
            </span>
            <div className="ig-follow-meta">
              <div className="handle">@camly_jp</div>
              <div className="sub">撮り方のコツや実際の使用例を発信中</div>
            </div>
            <a className="pill pill-accent pill-sm" href="https://www.instagram.com/camly_jp/" target="_blank" rel="noopener noreferrer">
              フォローする
            </a>
          </div>
        </section>

        <section className="block border-t wrap" id="trust">
          <div data-reveal="true">
            <p className="eyebrow">料金と保証</p>
            <h2>お金の流れは、先に全部見せます。</h2>
          </div>
          <div className="grid3" data-reveal="true">
            <div>
              <h3>請求は、使った分だけ</h3>
              <p>貸出時に確保する¥50,000は与信枠で、その場での請求ではありません。実際に請求されるのは確定した利用料金だけです。</p>
            </div>
            <div>
              <h3>最終確認は、必ず人が行う</h3>
              <p>返却時の写真・動画はAIで一次チェックしたあと、必ず人の目で確認します。自動判定だけで高額請求が発生することはありません。</p>
            </div>
            <div>
              <h3>安心プランで上限¥3,000</h3>
              <p>+¥200の安心プラン(Camly Care)に加入すると、万が一の破損時のご負担が¥3,000までに収まります。</p>
            </div>
          </div>
        </section>

        <section className="block border-t wrap" id="partners">
          <div data-reveal="true">
            <p className="eyebrow">施設への導入</p>
            <h2>置いていただける場所を、探しています。</h2>
          </div>
          <p className="lede" data-reveal="true">
            宿泊施設・クラブ・撮影目的地など、ゲストの記憶に残る瞬間が生まれる場所への設置を想定しています。
            必要なのは電源とわずかな設置スペースだけで、運用はすべてCamly側が担当します。
          </p>
          <p data-reveal="true">
            <a className="pill pill-outline" href="/partners">
              導入メリットと流れを見る →
            </a>
          </p>
        </section>

        <section className="block border-t wrap" id="contact">
          <div data-reveal="true">
            <p className="eyebrow">お問い合わせ</p>
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

      <SiteFooter
        variant="dark"
        showInstagram
        note="現在は実証実験(パイロット)フェーズです。正式な事業者情報・特定商取引法に基づく表示は準備中のため、本ページには掲載していません。"
      />
    </div>
  );
}

/**
 * 使い方ガイド(guide.camly.jp のルートとして配信される)。
 * 元はClaude Artifactの「Camlyの使い方ガイド」ページをそのまま移植したものだが、
 * AI生成のモックアップ画像(手でスマホを持つ合成写真など)を外し、実物の写真だけを使うようにした。
 * スタイルは app/_components/marketingTheme.ts の共通デザインシステムを使用。
 */
import RevealOnScroll from "../_components/RevealOnScroll";
import SiteHeader from "../_components/SiteHeader";
import SiteFooter from "../_components/SiteFooter";
import { MARKETING_STYLES } from "../_components/marketingTheme";

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
    alt: "実際に使用しているキーボックスと鍵",
  },
  {
    n: "04",
    title: "鍵でBOXを開けて撮影スタート",
    body: "取り出した鍵でBOXの扉を開け、カメラを取り出したら、あとは自由に使うだけです。",
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
    title: "人物を撮るとき",
    photo: "/marketing/settings-portrait.jpg",
    alt: "このカメラで実際に撮影した人物写真の例",
    rows: [
      ["モード", "M(マニュアル)"],
      ["フラッシュ", "暗い場所ではON"],
      ["絞り(F値)", "F2.8"],
      ["ISO", "AUTO"],
      ["画質", "FINE / JPEG"],
    ],
  },
  {
    num: "02",
    title: "風景を撮るとき",
    photo: "/marketing/settings-landscape.jpg",
    alt: "このカメラで実際に撮影した風景写真の例",
    rows: [
      ["モード", "A(絞り優先)"],
      ["フラッシュ", "OFF"],
      ["絞り(F値)", "F4.0"],
      ["ISO", "AUTO"],
      ["画質", "FINE / JPEG"],
    ],
  },
];

const CARE_CARDS = [
  ["01", "レンズを触らない", "レンズ表面にはなるべく触れないようお願いします。電源OFF時はレンズが収納されていることを確認してから持ち歩いてください。"],
  ["02", "雨・水・砂に注意", "このカメラは防水カメラではありません。雨、水まわり、砂浜などでは特に注意して使用をお願いします。"],
  ["03", "盗難に注意", "置き忘れや紛失・盗難には十分ご注意ください。席などに置いたままにせず、持ち歩きの際はしっかり管理をお願いします。"],
];

export default function GuidePage() {
  return (
    <div className="site" data-theme="dark">
      <style>{MARKETING_STYLES}</style>
      <RevealOnScroll />

      <SiteHeader
        variant="dark"
        badge="使い方ガイド"
        links={[{ href: "/", label: "サービス概要" }]}
        cta={{ href: "/pilot/box/box_pub_3e9d7b", label: "借りる" }}
      />

      <main>
        <section className="hero wrap">
          <h1 data-reveal="true">Camlyの使い方ガイド</h1>
          <p className="hero-sub" data-reveal="true">
            借りてから返すまで、迷わないための使い方をまとめました。困ったときはいつでもサポートまでご連絡ください。
          </p>
        </section>

        <section className="block border-t wrap" id="start">
          <div data-reveal="true">
            <p className="eyebrow">はじめかた</p>
            <h2>Camlyの始めかた</h2>
          </div>
          <div className="step-list" data-reveal="true">
            {START_STEPS.map((s) => (
              <div className="step" key={s.n}>
                <div className="n">{s.n}</div>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                  {s.photo && (
                    <div className="step-photo">
                      <img src={s.photo} alt={s.alt} />
                    </div>
                  )}
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
            <p className="eyebrow">撮影のコツ</p>
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
                  <h3>{c.title}</h3>
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
            <p className="eyebrow">使用時の注意</p>
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
            <p className="eyebrow">フォローする</p>
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
            <p className="eyebrow">お問い合わせ</p>
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

      <SiteFooter variant="dark" note="現在は実証実験(パイロット)フェーズです。" />
    </div>
  );
}

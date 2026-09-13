/**
 * 導入検討ページ(camly.jp/partners)。
 * 元はClaude Artifactの「Camlyを導入する」ページをそのまま移植したもの
 * (デザイン・コピーは https://claude.ai/code/artifact/01f88b9c-1086-4785-84b6-adcda9da780e 由来)。
 * 他ページ(/, /guide)とは異なり、このページのみ白背景テーマ(data-theme="light")。
 * スタイルは app/_components/marketingTheme.ts の共通デザインシステムを使用。
 */
import RevealOnScroll from "../_components/RevealOnScroll";
import SiteHeader from "../_components/SiteHeader";
import SiteFooter from "../_components/SiteFooter";
import { MARKETING_STYLES } from "../_components/marketingTheme";

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

export default function PartnersPage() {
  return (
    <div className="site" data-theme="light">
      <style>{MARKETING_STYLES}</style>
      <RevealOnScroll />

      <SiteHeader
        variant="light"
        badge="導入について"
        links={[{ href: "/", label: "サービス概要" }]}
        cta={{ href: "#contact", label: "お問い合わせ" }}
      />

      <main>
        <section className="hero wrap">
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
            <p className="eyebrow">サービス内容</p>
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
            <p className="eyebrow">今後の展開</p>
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
            <p className="eyebrow">よくある質問</p>
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
            <p className="eyebrow">お問い合わせ</p>
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

      <SiteFooter
        variant="light"
        note="現在は実証実験(パイロット)フェーズです。正式な事業者情報・特定商取引法に基づく表示は準備中のため、本ページには掲載していません。"
      />
    </div>
  );
}

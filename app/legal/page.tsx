import SiteHeader from "../_components/SiteHeader";
import SiteFooter from "../_components/SiteFooter";
import { MARKETING_STYLES } from "../_components/marketingTheme";

export default function LegalPage() {
  return (
    <div className="site" data-theme="dark">
      <style>{MARKETING_STYLES}</style>
      <SiteHeader variant="dark" links={[]} cta={{ href: "/", label: "サービス概要" }} />

      <main className="wrap" style={{ paddingBlock: "clamp(3rem,7vw,5rem)", maxWidth: "42rem" }}>
        <p className="eyebrow">DRAFT — 未確定・公開ブロッカー</p>
        <h1 style={{ fontSize: "clamp(1.6rem,3.5vw,2.1rem)", fontWeight: 800, marginBottom: "1.25rem" }}>
          特定商取引法に基づく表示
        </h1>
        <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem", lineHeight: 1.8 }}>
          販売事業者名・住所・電話番号・代表者名・返品/キャンセルポリシー等、正式な情報が未確定のため未記載です。
          この情報が揃うまで一般公開しないでください(LAUNCH_BLOCKERS.md参照)。
        </p>
      </main>

      <SiteFooter variant="dark" note="Make every place more possible. — 現在は実証実験(パイロット)フェーズです。" />
    </div>
  );
}

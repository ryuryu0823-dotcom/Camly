import SiteHeader from "../_components/SiteHeader";
import SiteFooter from "../_components/SiteFooter";
import { MARKETING_STYLES } from "../_components/marketingTheme";

export default function SupportPage() {
  return (
    <div className="site" data-theme="dark">
      <style>{MARKETING_STYLES}</style>
      <SiteHeader variant="dark" links={[]} cta={{ href: "/", label: "サービス概要" }} />

      <main className="wrap" style={{ paddingBlock: "clamp(3rem,7vw,5rem)", maxWidth: "42rem" }}>
        <p className="eyebrow">DRAFT — 未確定</p>
        <h1 style={{ fontSize: "clamp(1.6rem,3.5vw,2.1rem)", fontWeight: 800, marginBottom: "1.25rem" }}>お問い合わせ</h1>
        <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem", lineHeight: 1.8 }}>
          本番の問い合わせ窓口(電話/メール/チャット等)は未確定です(LAUNCH_BLOCKERS.md参照)。
          施設設置に関するご相談は 18ryu81@gmail.com までご連絡ください。
        </p>
      </main>

      <SiteFooter variant="dark" note="Make every place more possible. — 現在は実証実験(パイロット)フェーズです。" />
    </div>
  );
}

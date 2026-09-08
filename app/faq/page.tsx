import SiteHeader from "../_components/SiteHeader";
import SiteFooter from "../_components/SiteFooter";
import { MARKETING_STYLES } from "../_components/marketingTheme";

const FAQS: [string, string][] = [
  ["予約は必要ですか?", "不要です。現地のQRを読んでその場でお借りいただけます。"],
  ["返却が遅れそうな場合は?", "利用中画面から延長方法をご案内します(準備中)。"],
  ["カメラを壊してしまったら?", "Camly Care補償の範囲内かどうかをご案内します。詳細はCamly Careページをご覧ください。"],
];

export default function FaqPage() {
  return (
    <div className="site" data-theme="dark">
      <style>{MARKETING_STYLES}</style>
      <SiteHeader variant="dark" links={[]} cta={{ href: "/", label: "サービス概要" }} />

      <main className="wrap" style={{ paddingBlock: "clamp(3rem,7vw,5rem)", maxWidth: "42rem" }}>
        <p className="eyebrow">DRAFT</p>
        <h1 style={{ fontSize: "clamp(1.6rem,3.5vw,2.1rem)", fontWeight: 800, marginBottom: "2rem" }}>よくある質問</h1>
        <div className="faq-item" style={{ borderTop: "none" }}>
          {FAQS.map(([q, a], i) => (
            <div key={q} style={i > 0 ? { borderTop: "1px solid var(--line)", marginTop: "1.5rem", paddingTop: "1.5rem" } : undefined}>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.4rem" }}>{q}</p>
              <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>{a}</p>
            </div>
          ))}
        </div>
      </main>

      <SiteFooter variant="dark" note="Make every place more possible. — 現在は実証実験(パイロット)フェーズです。" />
    </div>
  );
}

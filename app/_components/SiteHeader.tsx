type SiteHeaderProps = {
  variant: "dark" | "light";
  badge?: string;
  links: { href: string; label: string }[];
  cta: { href: string; label: string };
};

/**
 * マーケティングページ共通ヘッダー。variant="light" のときだけ
 * 黒背景用ロゴ(camly-logo-dark.png)を使う(/partnersのみ白背景テーマのため)。
 */
export default function SiteHeader({ variant, badge, links, cta }: SiteHeaderProps) {
  const logoSrc = variant === "light" ? "/camly-logo-dark.png" : "/camly-logo.png";
  return (
    <header>
      <div className="wrap header-inner">
        <span className="logo">
          <img className="logo-mark" src={logoSrc} alt="Camly" />
          {badge && <small>{badge}</small>}
        </span>
        <div className="header-links">
          {links.map((link) => (
            <a key={link.href} className="text-link" href={link.href}>
              {link.label}
            </a>
          ))}
          <a className="pill pill-outline pill-sm" href={cta.href}>
            {cta.label}
          </a>
        </div>
      </div>
    </header>
  );
}

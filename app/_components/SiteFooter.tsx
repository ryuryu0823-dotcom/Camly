type SiteFooterProps = {
  variant: "dark" | "light";
  note: string;
  showInstagram?: boolean;
};

/** マーケティングページ共通フッター。 */
export default function SiteFooter({ variant, note, showInstagram }: SiteFooterProps) {
  const logoSrc = variant === "light" ? "/camly-logo-dark.png" : "/camly-logo.png";
  return (
    <footer className="border-t wrap">
      <div className="footer-inner">
        <div>
          <p className="logo">
            <img className="logo-mark" src={logoSrc} alt="Camly" />
            <small>CAPTURE YOUR MOMENT ANYWHERE</small>
          </p>
          <p className="foot-note">{note}</p>
          {showInstagram && (
            <a
              className="text-link footer-social"
              href="https://www.instagram.com/camly_jp/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
              </svg>
              @camly_jp
            </a>
          )}
        </div>
        <div className="footer-meta">
          © 2026 CAMLY
          <br />
          UNMANNED CAMERA RENTAL
        </div>
      </div>
    </footer>
  );
}

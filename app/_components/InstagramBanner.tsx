/** 借りるQR/返すQRどちらの入口画面にも表示する、実際の使い方・利用イメージ写真への導線。 */
export default function InstagramBanner() {
  return (
    <a
      href="https://www.instagram.com/camly_jp/"
      target="_blank"
      rel="noopener noreferrer"
      className="w-full flex items-center justify-between gap-3 rounded-xl border border-camly-accent/40 bg-camly-accent/10 px-5 py-3.5 mb-6"
    >
      <span className="text-xs text-camly-ink text-left leading-snug">
        使い方・利用イメージ写真は
        <br />
        <span className="font-bold">Instagram @camly_jp</span> でも公開中
      </span>
      <span aria-hidden className="text-camly-accent text-lg shrink-0">
        →
      </span>
    </a>
  );
}

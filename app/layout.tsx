import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Camly — Make every place more possible.",
  description: "あらゆる場所に、新しい可能性を。無人カメラレンタル Camly。",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#141210",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="font-sans bg-camly-black text-camly-ink min-h-screen antialiased">{children}</body>
    </html>
  );
}

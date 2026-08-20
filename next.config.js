/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PWA manifest/service workerは Step6(ブランド仕上げ)で追加する。
  // 現時点ではmanifest.jsonとアイコンのみ用意している(public/manifest.json)。
};

module.exports = nextConfig;

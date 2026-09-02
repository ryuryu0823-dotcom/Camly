import { NextRequest, NextResponse } from "next/server";

/**
 * /admin配下の簡易Basic認証(§15)。
 * AdminUser単位のログイン・RBACはまだ未実装(既存TODO)だが、それまでの間、
 * URLを知っているだけの第三者が実際の承認・請求操作をできてしまう状態を防ぐための
 * 最低限のゲート。ADMIN_BASIC_AUTH_PASSWORD未設定の環境(ローカル開発等)では認証をスキップする。
 */
function checkAdminAuth(req: NextRequest): NextResponse | null {
  const password = process.env.ADMIN_BASIC_AUTH_PASSWORD;
  if (!password) return null; // 未設定環境(ローカル等)では無効化

  const auth = req.headers.get("authorization");
  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      const [, suppliedPassword] = Buffer.from(encoded, "base64").toString("utf8").split(":");
      if (suppliedPassword === password) {
        return null;
      }
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Camly Admin"' },
  });
}

/**
 * ドメイン単位のルーティング。
 * camly.jp / guide.camly.jp / rent.camly.jp を同一Vercelプロジェクトにぶら下げ、
 * リクエストのホスト名によって内部的に配信するページを切り替える(見た目のURLはそのまま)。
 * - guide.camly.jp        → /guide 配下をそのまま配信
 * - rent.camly.jp のルート → 現状唯一のパイロット拠点(/pilot/box/box_pub_3e9d7b)
 * - camly.jp(その他)      → 通常どおり(何もしない)
 */
function applyDomainRouting(req: NextRequest): NextResponse | null {
  const host = (req.headers.get("host") ?? "").split(":")[0];

  if (host === "guide.camly.jp" && !req.nextUrl.pathname.startsWith("/guide")) {
    const url = req.nextUrl.clone();
    url.pathname = `/guide${req.nextUrl.pathname === "/" ? "" : req.nextUrl.pathname}`;
    return NextResponse.rewrite(url);
  }

  if (host === "rent.camly.jp" && req.nextUrl.pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/pilot/box/box_pub_3e9d7b";
    return NextResponse.rewrite(url);
  }

  return null;
}

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin") || req.nextUrl.pathname.startsWith("/api/admin")) {
    return checkAdminAuth(req) ?? NextResponse.next();
  }

  return applyDomainRouting(req) ?? NextResponse.next();
}

export const config = {
  // 静的アセット・画像最適化・faviconなどは対象外にし、それ以外の全パスでドメイン判定を行う。
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json).*)"],
};

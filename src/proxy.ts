import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { isSessionActive } from "@/lib/auth/session-store";

// Páginas abertas: a home, as telas de acesso e os arquivos estáticos.
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/cadastro",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
  "/icon.svg",
  "/manifest.json",
  "/favicon.ico",
]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith("/_next") || pathname.startsWith("/icons")) {
    return NextResponse.next();
  }

  let claims;
  try {
    claims = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  } catch {
    return new NextResponse("App não configurado: defina APP_SECRET.", { status: 503 });
  }

  // Cookie com assinatura válida, mas de uma sessão encerrada (saiu ou trocou a senha), não entra.
  if (claims && (await isSessionActive(claims))) return NextResponse.next();

  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname + req.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

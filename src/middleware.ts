import { NextRequest, NextResponse } from "next/server";
import { getExpectedSessionToken, SESSION_COOKIE } from "@/lib/auth/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname === "/login" ||
    pathname === "/api/auth/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/icon.svg" ||
    pathname === "/manifest.json" ||
    pathname === "/favicon.ico";

  if (isPublic) return NextResponse.next();

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  let expected: string | null = null;
  try {
    expected = await getExpectedSessionToken();
  } catch {
    // Credenciais de sessão não configuradas ainda — deixa passar para não travar o dev local
    // antes do .env.local estar preenchido, mas isso deve ser corrigido antes do deploy.
    return NextResponse.next();
  }

  if (cookie === expected) return NextResponse.next();

  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

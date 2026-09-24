import { NextRequest, NextResponse } from "next/server";
import { getExpectedSessionToken, verifyPasscode, SESSION_COOKIE } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const passcode = body?.passcode;

  if (typeof passcode !== "string" || !verifyPasscode(passcode)) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const token = await getExpectedSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return res;
}

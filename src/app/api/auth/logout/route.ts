import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { endSession } from "@/lib/auth/session-store";

export async function POST(req: NextRequest) {
  // Encerra a sessão no servidor também: uma cópia do cookie deixa de funcionar.
  const claims = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value).catch(() => null);
  if (claims) await endSession(claims);

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

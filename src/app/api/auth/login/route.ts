import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, normalizeEmail } from "@/lib/firebase/accounts";
import { sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth/session";
import { startSession } from "@/lib/auth/session-store";
import { clientIp, LIMITS, tooManyRequests, withinLimits } from "@/lib/security/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
  }

  // Por IP barra quem testa várias contas; por e-mail barra quem tenta adivinhar uma senha só.
  const allowed = await withinLimits([
    [`login-ip:${clientIp(req)}`, LIMITS.loginPerIp],
    [`login-email:${normalizeEmail(parsed.data.email)}`, LIMITS.loginPerEmail],
  ]);
  if (!allowed) return tooManyRequests();

  const account = await authenticate(parsed.data.email, parsed.data.password);
  if (!account) {
    return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, name: account.name });
  res.cookies.set(SESSION_COOKIE, await startSession(account.uid), sessionCookieOptions);
  return res;
}

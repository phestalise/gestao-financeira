import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAccount, EmailTakenError } from "@/lib/firebase/accounts";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth/session";

const signupSchema = z.object({
  name: z.string().trim().min(1, "Diga como podemos te chamar.").max(60),
  email: z.string().trim().email("E-mail inválido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(200),
  invitedBy: z.string().max(60).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = signupSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  try {
    const account = await createAccount(parsed.data);
    const res = NextResponse.json({ ok: true, name: account.name });
    res.cookies.set(SESSION_COOKIE, await createSessionToken(account.uid), sessionCookieOptions);
    return res;
  } catch (err) {
    if (err instanceof EmailTakenError) {
      return NextResponse.json({ error: "Esse e-mail já tem conta. Que tal entrar?" }, { status: 409 });
    }
    throw err;
  }
}

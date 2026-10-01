import { createHash } from "node:crypto";
import { getDb } from "@/lib/firebase/admin";

// Limite por janela fixa, guardado em rateLimits/{hash da chave}. Fica no Firestore porque as
// funções da Vercel não compartilham memória: um contador local zeraria a cada instância nova.
// expiresAt permite ligar uma política de TTL no Firestore para limpar os documentos velhos.
export interface RateLimit {
  limit: number;
  windowSeconds: number;
}

export async function consumeRateLimit(key: string, { limit, windowSeconds }: RateLimit): Promise<boolean> {
  const windowMs = windowSeconds * 1000;
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const id = createHash("sha256").update(`${key}|${windowStart}`).digest("hex");
  const ref = getDb().collection("rateLimits").doc(id);

  return getDb().runTransaction(async (tx) => {
    const count = ((await tx.get(ref)).data()?.count as number | undefined) ?? 0;
    if (count >= limit) return false;
    tx.set(ref, { count: count + 1, expiresAt: new Date(windowStart + windowMs) });
    return true;
  });
}

// Consome todos os limites; basta um estourar para barrar a requisição.
export async function withinLimits(checks: [string, RateLimit][]): Promise<boolean> {
  const results = await Promise.all(checks.map(([key, limit]) => consumeRateLimit(key, limit)));
  return results.every(Boolean);
}

// Na Vercel, o primeiro IP de x-forwarded-for é o do cliente (a própria Vercel preenche o cabeçalho).
export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export function tooManyRequests(message = "Muitas tentativas. Espere alguns minutos e tente de novo.") {
  return Response.json({ error: message }, { status: 429 });
}

export const LIMITS = {
  loginPerIp: { limit: 20, windowSeconds: 15 * 60 },
  loginPerEmail: { limit: 8, windowSeconds: 15 * 60 },
  signupPerIp: { limit: 5, windowSeconds: 60 * 60 },
  aiPerHour: { limit: 60, windowSeconds: 60 * 60 },
  aiPerDay: { limit: 300, windowSeconds: 24 * 60 * 60 },
} satisfies Record<string, RateLimit>;

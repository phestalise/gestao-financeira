// Sessão = cookie assinado "uid.sessionId.expiraEm.assinatura" (HMAC-SHA256 com APP_SECRET).
// Só usa Web Crypto, então roda tanto no proxy quanto nas rotas e páginas do servidor.
// A assinatura prova que o cookie foi emitido pelo app; se a sessão ainda vale (não saiu, não
// trocou a senha) é checado em users/{uid}/sessions/{sessionId}, ver session-store.ts.
const encoder = new TextEncoder();

export const SESSION_COOKIE = "gf_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 180; // 180 dias, em segundos

export interface SessionClaims {
  uid: string;
  sessionId: string;
  expiresAt: number;
}

function getSecret(): string {
  const secret = process.env.APP_SECRET;
  if (!secret) throw new Error("APP_SECRET precisa estar definido em .env.local");
  return secret;
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function newSessionId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken({ uid, sessionId, expiresAt }: SessionClaims): Promise<string> {
  const payload = `${uid}.${sessionId}.${expiresAt}`;
  return `${payload}.${await sign(payload)}`;
}

// Devolve os dados da sessão se o cookie tiver assinatura válida e não tiver expirado; senão null.
export async function verifySessionToken(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [uid, sessionId, expiresAt, signature] = parts;
  if (!uid || !sessionId || !(Number(expiresAt) > Date.now())) return null;
  if (!safeEqual(signature, await sign(`${uid}.${sessionId}.${expiresAt}`))) return null;
  return { uid, sessionId, expiresAt: Number(expiresAt) };
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

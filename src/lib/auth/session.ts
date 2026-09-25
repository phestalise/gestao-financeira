// Sessão = cookie assinado "uid.expiraEm.assinatura" (HMAC-SHA256 com APP_SECRET).
// Só usa Web Crypto, então roda tanto no proxy quanto nas rotas e páginas do servidor.
const encoder = new TextEncoder();

export const SESSION_COOKIE = "gf_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 180; // 180 dias, em segundos

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

export async function createSessionToken(uid: string): Promise<string> {
  const payload = `${uid}.${Date.now() + SESSION_MAX_AGE * 1000}`;
  return `${payload}.${await sign(payload)}`;
}

// Devolve o uid dono da sessão, ou null se o cookie for inválido ou tiver expirado.
export async function verifySessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [uid, expiresAt, signature] = parts;
  if (!uid || !(Number(expiresAt) > Date.now())) return null;
  return safeEqual(signature, await sign(`${uid}.${expiresAt}`)) ? uid : null;
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

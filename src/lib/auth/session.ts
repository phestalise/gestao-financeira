const encoder = new TextEncoder();

async function sha256Hex(input: string): Promise<string> {
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const SESSION_COOKIE = "gf_session";

export async function getExpectedSessionToken(): Promise<string> {
  const passcode = process.env.APP_PASSCODE;
  const secret = process.env.APP_SECRET;
  if (!passcode || !secret) {
    throw new Error("APP_PASSCODE e APP_SECRET precisam estar definidos em .env.local");
  }
  return sha256Hex(`${passcode}:${secret}`);
}

export function verifyPasscode(input: string): boolean {
  return Boolean(process.env.APP_PASSCODE) && input === process.env.APP_PASSCODE;
}

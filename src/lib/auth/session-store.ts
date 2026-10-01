import { getDb } from "@/lib/firebase/admin";
import {
  createSessionToken,
  newSessionId,
  SESSION_MAX_AGE,
  type SessionClaims,
} from "@/lib/auth/session";

// Cada login vira users/{uid}/sessions/{sessionId}. Sair apaga o documento; trocar a senha
// (scripts/reset-password.cjs) apaga todos — e o cookie correspondente deixa de valer.
function sessionRef(uid: string, sessionId: string) {
  return getDb().collection("users").doc(uid).collection("sessions").doc(sessionId);
}

export async function startSession(uid: string): Promise<string> {
  const claims: SessionClaims = { uid, sessionId: newSessionId(), expiresAt: Date.now() + SESSION_MAX_AGE * 1000 };
  await sessionRef(uid, claims.sessionId).set({
    createdAt: new Date().toISOString(),
    expiresAt: new Date(claims.expiresAt),
  });
  return createSessionToken(claims);
}

export async function endSession({ uid, sessionId }: SessionClaims): Promise<void> {
  await sessionRef(uid, sessionId).delete();
}

// Uma página do painel consulta o usuário várias vezes; guarda por pouco tempo as sessões já
// confirmadas para não ler o Firestore a cada chamada. Uma sessão revogada para de valer em até 1 min.
const CONFIRMED_TTL_MS = 60_000;
const confirmed = new Map<string, number>();

export async function isSessionActive({ uid, sessionId }: SessionClaims): Promise<boolean> {
  const key = `${uid}.${sessionId}`;
  if ((confirmed.get(key) ?? 0) > Date.now()) return true;

  const active = (await sessionRef(uid, sessionId).get()).exists;
  if (active) {
    if (confirmed.size > 1000) confirmed.clear();
    confirmed.set(key, Date.now() + CONFIRMED_TTL_MS);
  } else {
    confirmed.delete(key);
  }
  return active;
}

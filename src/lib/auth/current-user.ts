import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { isSessionActive } from "@/lib/auth/session-store";

export class UnauthenticatedError extends Error {
  constructor() {
    super("Não autenticado.");
  }
}

// uid de quem está logado nesta requisição. O proxy só confere a assinatura do cookie;
// aqui também se confirma que a sessão não foi encerrada, antes de qualquer dado ser lido.
export async function getCurrentUserId(): Promise<string> {
  const uid = await getOptionalUserId();
  if (!uid) throw new UnauthenticatedError();
  return uid;
}

export async function getOptionalUserId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const claims = await verifySessionToken(token);
  if (!claims || !(await isSessionActive(claims))) return null;
  return claims.uid;
}

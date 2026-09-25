import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

export class UnauthenticatedError extends Error {
  constructor() {
    super("Não autenticado.");
  }
}

// uid de quem está logado nesta requisição. O proxy já barra quem não tem sessão;
// a checagem aqui garante que nenhum dado seja lido sem dono, mesmo se o proxy mudar.
export async function getCurrentUserId(): Promise<string> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const uid = await verifySessionToken(token);
  if (!uid) throw new UnauthenticatedError();
  return uid;
}

export async function getOptionalUserId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

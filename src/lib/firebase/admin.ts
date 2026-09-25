import { getCurrentUserId } from "@/lib/auth/current-user";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App;

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Credenciais do Firebase Admin ausentes. Configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY em .env.local"
    );
  }

  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });

  return app;
}

export function getDb(): Firestore {
  return getFirestore(getAdminApp());
}

// Espaço de dados de antes do cadastro por e-mail; a conta de OWNER_EMAIL continua usando ele.
export const LEGACY_OWNER_ID = "default-user";

// Documento users/{uid} de quem está logado: raiz de tudo que é dessa pessoa.
export async function currentUserDoc() {
  return getDb().collection("users").doc(await getCurrentUserId());
}

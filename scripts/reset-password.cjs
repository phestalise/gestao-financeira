// Troca a senha de uma conta existente (logins/{email}), no mesmo formato de src/lib/firebase/accounts.ts,
// e encerra todas as sessões abertas dela.
// Para o e-mail de OWNER_EMAIL, também cria a conta se ainda não existir, ligada a users/default-user
// (os dados de antes do cadastro) — o cadastro pelo site não aceita esse e-mail.
// Uso: node scripts/reset-password.cjs voce@email.com
// A senha é pedida no terminal, sem aparecer na tela. Não é aceita como argumento: ficaria no
// histórico do shell e visível para outros processos (ps).
const { loadEnvConfig } = require("@next/env");
const { randomBytes, scrypt } = require("node:crypto");
const { promisify } = require("node:util");
const { cert, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

loadEnvConfig(process.cwd(), true);

function askHidden(question) {
  return new Promise((resolve) => {
    const { stdin, stdout } = process;
    stdout.write(question);
    let value = "";
    if (!stdin.isTTY) {
      // sem terminal interativo (ex.: echo senha | node ...): lê a primeira linha
      stdin.setEncoding("utf8");
      stdin.on("data", (chunk) => (value += chunk));
      stdin.on("end", () => resolve(value.split(/\r?\n/)[0]));
      return;
    }
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    stdin.resume();
    const onData = (ch) => {
      if (ch === "\r" || ch === "\n" || ch === "\u0004") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.off("data", onData);
        stdout.write("\n");
        resolve(value);
      } else if (ch === "\u0003") {
        process.exit(1);
      } else if (ch === "\u007f") {
        value = value.slice(0, -1);
      } else {
        value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const email = (process.argv[2] || "").trim().toLowerCase();
  if (!email) {
    console.error("Uso: node scripts/reset-password.cjs voce@email.com");
    process.exit(1);
  }

  const app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
  const db = getFirestore(app);
  const ref = db.collection("logins").doc(email);
  const existing = await ref.get();
  const isOwner = (process.env.OWNER_EMAIL || "").trim().toLowerCase() === email;
  if (!existing.exists && !isOwner) {
    console.error(`Nenhuma conta com o e-mail ${email}.`);
    process.exit(1);
  }

  const password = await askHidden("Nova senha (mín. 8 caracteres): ");
  if (password.length < 8) {
    console.error("A senha precisa ter pelo menos 8 caracteres.");
    process.exit(1);
  }

  const salt = randomBytes(16).toString("hex");
  const hash = await promisify(scrypt)(password, salt, 64);
  const passwordHash = `${salt}:${hash.toString("hex")}`;

  if (existing.exists) {
    await ref.update({ passwordHash, ...(isOwner ? { uid: "default-user" } : {}) });
  } else {
    await ref.create({ uid: "default-user", email, name: "Você", passwordHash, createdAt: new Date().toISOString() });
    await db.collection("users").doc("default-user").set({ email }, { merge: true });
  }

  // Derruba as sessões abertas (de quem quer que tenha a senha antiga).
  const uids = new Set([existing.data()?.uid, isOwner ? "default-user" : undefined].filter(Boolean));
  for (const uid of uids) {
    const sessions = await db.collection("users").doc(uid).collection("sessions").listDocuments();
    await Promise.all(sessions.map((s) => s.delete()));
  }

  console.log(`Senha de ${email} ${existing.exists ? "atualizada" : "criada"}. Sessões antigas encerradas. Já dá para entrar.`);
}

main();

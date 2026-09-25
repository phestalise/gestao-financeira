// Troca a senha de uma conta existente (logins/{email}), no mesmo formato de src/lib/firebase/accounts.ts.
// Uso: node scripts/reset-password.cjs voce@email.com
// A nova senha é pedida no terminal, sem aparecer na tela nem ficar no histórico do shell.
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
  const ref = getFirestore(app).collection("logins").doc(email);
  if (!(await ref.get()).exists) {
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
  await ref.update({ passwordHash: `${salt}:${hash.toString("hex")}` });
  console.log(`Senha de ${email} atualizada. Já dá para entrar.`);
}

main();

// Envia as variáveis do .env.local para a Vercel (production e preview).
// Uso: node scripts/push-env.cjs
const { loadEnvConfig } = require("@next/env");
const { spawnSync } = require("child_process");

const { combinedEnv } = loadEnvConfig(process.cwd(), true);
const keys = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "GEMINI_API_KEY",
  "APP_PASSCODE",
  "APP_SECRET",
];

for (const k of keys) {
  const v = combinedEnv[k];
  if (!v) {
    console.log(k, "AUSENTE no .env.local");
    continue;
  }
  for (const target of ["production", "preview"]) {
    const r = spawnSync("vercel", ["env", "add", k, target, "--force"], { input: v, encoding: "utf8" });
    console.log(k, target, r.status === 0 ? "ok" : "FALHOU: " + (r.stderr || "").trim().split("\n").slice(-2).join(" "));
  }
}

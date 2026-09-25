"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { AuthField, AuthShell } from "@/components/auth/AuthShell";

function passwordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const STRENGTH = [
  { label: "Muito curta", color: "var(--lp-red)" },
  { label: "Fraca", color: "var(--lp-red)" },
  { label: "Razoável", color: "var(--lp-amber)" },
  { label: "Boa", color: "var(--lp-sky)" },
  { label: "Forte", color: "var(--lp-green)" },
];

function SignupForm() {
  const router = useRouter();
  const invitedBy = useSearchParams().get("convite")?.slice(0, 60) || undefined;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const strength = passwordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, invitedBy }),
    });

    if (!res.ok) {
      setLoading(false);
      setError((await res.json().catch(() => null))?.error ?? "Não foi possível criar a conta.");
      return;
    }

    router.replace("/configuracoes?bemvindo=1");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="mb-8">
        {invitedBy && (
          <p className="lp-pill mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm" style={{ color: "var(--lp-sky)" }}>
            💌 {invitedBy} te convidou
          </p>
        )}
        <h1 className="text-4xl font-semibold tracking-tight">
          Comece sua <span className="lp-serif lp-gradient-text">história.</span>
        </h1>
        <p className="mt-2" style={{ color: "var(--lp-dim)" }}>
          Grátis, em menos de um minuto. Seus dados ficam só com você.
        </p>
      </div>
      <AuthField label="Como podemos te chamar?" autoComplete="given-name" autoFocus required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
      <AuthField label="E-mail" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
      <div>
        <AuthField label="Senha" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Pelo menos 8 caracteres" />
        {password && (
          <div className="mt-2 flex items-center gap-3">
            <div className="flex flex-1 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="h-1 flex-1 rounded-full transition-colors duration-300"
                  style={{ background: i < strength ? STRENGTH[strength].color : "rgba(255,255,255,0.08)" }}
                />
              ))}
            </div>
            <span className="text-xs" style={{ color: STRENGTH[strength].color }}>
              {STRENGTH[strength].label}
            </span>
          </div>
        )}
      </div>
      {error && (
        <p className="lp-pop rounded-xl px-3 py-2.5 text-sm" style={{ background: "rgba(255,107,130,0.12)", color: "var(--lp-red)" }}>
          {error}
        </p>
      )}
      <button type="submit" disabled={loading} className="lp-cta flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-semibold text-white disabled:opacity-60">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Criar minha conta <ArrowRight className="h-4 w-4" /></>}
      </button>
      <ul className="space-y-1.5 text-sm" style={{ color: "var(--lp-faint)" }}>
        {["Sem cartão de crédito", "IA para lançar e tirar dúvidas", "Convide quem você quiser depois"].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5" style={{ color: "var(--lp-green)" }} /> {t}
          </li>
        ))}
      </ul>
      <p className="text-center text-sm" style={{ color: "var(--lp-dim)" }}>
        Já tem conta?{" "}
        <Link href="/login" className="font-medium" style={{ color: "var(--lp-sky)" }}>
          Entrar
        </Link>
      </p>
    </form>
  );
}

export default function CadastroPage() {
  return (
    <AuthShell>
      <Suspense>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}

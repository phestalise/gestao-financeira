"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { AuthField, AuthShell } from "@/components/auth/AuthShell";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      setLoading(false);
      setError((await res.json().catch(() => null))?.error ?? "Não foi possível entrar.");
      return;
    }

    const next = searchParams.get("next");
    // só aceita caminhos internos, para o parâmetro não virar redirecionamento para outro site
    router.replace(next?.startsWith("/") && !next.startsWith("//") ? next : "/painel");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight">
          Que bom te ver <span className="lp-serif lp-gradient-text">de novo.</span>
        </h1>
        <p className="mt-2" style={{ color: "var(--lp-dim)" }}>
          Entre para continuar a sua história.
        </p>
      </div>
      <AuthField label="E-mail" type="email" autoComplete="email" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
      <AuthField label="Senha" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      {error && (
        <p className="lp-pop rounded-xl px-3 py-2.5 text-sm" style={{ background: "rgba(255,107,130,0.12)", color: "var(--lp-red)" }}>
          {error}
        </p>
      )}
      <button type="submit" disabled={loading} className="lp-cta flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-semibold text-white disabled:opacity-60">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Entrar <ArrowRight className="h-4 w-4" /></>}
      </button>
      <p className="text-center text-sm" style={{ color: "var(--lp-dim)" }}>
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium" style={{ color: "var(--lp-sky)" }}>
          Criar agora
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}

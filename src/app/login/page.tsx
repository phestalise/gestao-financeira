"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Senha incorreta.");
      return;
    }

    router.replace(searchParams.get("next") || "/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <div className="mb-8 text-center">
        <span
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
          style={{ background: "var(--nav-accent-soft)" }}
        >
          💰
        </span>
        <h1 className="text-xl font-semibold text-white">Meu Dinheiro</h1>
        <p className="mt-1 text-sm text-[var(--nav-fg)]">Digite sua senha para continuar</p>
      </div>
      <input
        type="password"
        autoFocus
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        className="w-full rounded-xl border px-4 py-3 text-center text-lg text-white outline-none transition-shadow placeholder:text-[var(--nav-fg)] focus:ring-2 focus:ring-[var(--primary-strong)]/40"
        style={{ background: "rgba(255,255,255,0.04)", borderColor: "var(--nav-border)" }}
        placeholder="Senha"
      />
      {error && <p className="text-center text-sm text-[#ff8a8a]">{error}</p>}
      <Button
        type="submit"
        disabled={loading || !passcode}
        className="w-full"
        style={{ background: "var(--nav-accent)" }}
      >
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--nav-bg)" }}
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}

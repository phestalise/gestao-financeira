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
      <div className="mb-6 text-center">
        <p className="text-2xl">💰</p>
        <h1 className="mt-2 text-xl font-semibold">Meu Dinheiro</h1>
        <p className="text-sm text-[var(--muted)]">Digite sua senha para continuar</p>
      </div>
      <input
        type="password"
        autoFocus
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-center text-lg outline-none focus:border-[var(--primary)]"
        placeholder="Senha"
      />
      {error && <p className="text-center text-sm text-[var(--negative)]">{error}</p>}
      <Button type="submit" disabled={loading || !passcode} className="w-full">
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}

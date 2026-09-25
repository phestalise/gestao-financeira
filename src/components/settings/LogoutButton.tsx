"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm font-medium text-[var(--negative)] hover:bg-[var(--negative-soft)] disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" />
      {loading ? "Saindo…" : "Sair"}
    </button>
  );
}

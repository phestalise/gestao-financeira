"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const [name, setName] = useState(profile.name ?? "");
  const [income, setIncome] = useState(String(profile.income || ""));
  const [savingsGoalPercent, setSavingsGoalPercent] = useState(String(profile.savingsGoalPercent ?? 20));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name || undefined,
        income: Number(income) || 0,
        savingsGoalPercent: Number(savingsGoalPercent) || 0,
        onboardingComplete: true,
      }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-[var(--muted)]">Seu nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-strong)]/35 transition-shadow"
            placeholder="Como quer ser chamado no app"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--muted)]">Renda mensal</label>
          <input
            type="number"
            step="0.01"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-strong)]/35 transition-shadow"
            placeholder="0,00"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--muted)]">Meta de economia (% da renda)</label>
          <input
            type="number"
            value={savingsGoalPercent}
            onChange={(e) => setSavingsGoalPercent(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-strong)]/35 transition-shadow"
          />
        </div>
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? "Salvando..." : saved ? "Salvo ✓" : "Salvar"}
        </Button>
      </form>
    </Card>
  );
}

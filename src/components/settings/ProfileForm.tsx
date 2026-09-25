"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, UserRound } from "lucide-react";
import { UserProfile } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/currency";

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const [name, setName] = useState(profile.name ?? "");
  const [income, setIncome] = useState(String(profile.income || ""));
  const [savingsGoalPercent, setSavingsGoalPercent] = useState(String(profile.savingsGoalPercent ?? 20));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const goalAmount = ((Number(income) || 0) * (Number(savingsGoalPercent) || 0)) / 100;

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
    <Card className="p-5 sm:p-6">
      <SectionTitle icon={UserRound} title="Perfil e renda" subtitle="A base dos cálculos do painel." />
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm text-[var(--muted)]">Seu nome</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="app-input"
            placeholder="Como quer ser chamado no app"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-[1.6fr_1fr]">
          <label className="block">
            <span className="mb-1.5 block text-sm text-[var(--muted)]">Renda mensal</span>
            <span className="app-input app-affix">
              <span className="text-sm text-[var(--muted)]">R$</span>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="0,00"
              />
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-[var(--muted)]">Meta de economia</span>
            <span className="app-input app-affix">
              <input
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                value={savingsGoalPercent}
                onChange={(e) => setSavingsGoalPercent(e.target.value)}
              />
              <span className="text-sm text-[var(--muted)]">% da renda</span>
            </span>
          </label>
        </div>
        {goalAmount > 0 && (
          <p className="rounded-xl bg-[var(--positive-soft)] px-3.5 py-2.5 text-sm text-[var(--positive)]">
            Meta: guardar <strong className="tabular-nums">{formatCurrency(goalAmount)}</strong> por mês.
          </p>
        )}
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <>
              <Check className="h-4 w-4" /> Salvo
            </>
          ) : (
            "Salvar"
          )}
        </Button>
      </form>
    </Card>
  );
}

export function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof UserRound;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--primary-soft)] text-[var(--accent-text)]">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div>
        <h2 className="font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--muted)]">{subtitle}</p>}
      </div>
    </div>
  );
}

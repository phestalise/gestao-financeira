"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Repeat, Plus, X } from "lucide-react";
import { RecurringExpense } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { EXPENSE_CATEGORIES, getCategoryById } from "@/constants/categories";
import { formatCurrency } from "@/lib/utils/currency";
import { SectionTitle } from "@/components/settings/ProfileForm";

export function RecurringExpensesForm({ recurring }: { recurring: RecurringExpense[] }) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("outros_gasto");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const active = recurring.filter((r) => r.active);
  const total = active.reduce((sum, r) => sum + r.amount, 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fetch("/api/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: description.trim(),
        amount: Number(amount),
        categoryId,
        dayOfMonth: Number(dayOfMonth),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Confira a descrição, o valor e o dia.");
      return;
    }
    setDescription("");
    setAmount("");
    setAdding(false);
    router.refresh();
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    await fetch(`/api/recurring/${id}`, { method: "DELETE" });
    setRemovingId(null);
    router.refresh();
  }

  return (
    <Card className="p-5 sm:p-6">
      <SectionTitle
        icon={Repeat}
        title="Gastos fixos"
        subtitle="Entram sozinhos todo mês. Remover um não apaga os meses que já passaram."
      />

      {active.length > 0 ? (
        <div className="mb-4 overflow-hidden rounded-xl border border-[var(--border)]">
          <div className="divide-y divide-[var(--border)]">
            {active.map((r) => {
              const category = getCategoryById(r.categoryId);
              return (
                <div key={r.id} className="group flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-[var(--surface-2)]">
                  <div className="flex min-w-0 items-center gap-3">
                    <CategoryBadge categoryId={r.categoryId} icon={category?.icon ?? "more-horizontal"} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.description}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {category?.name} · todo dia {r.dayOfMonth}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="text-sm font-semibold tabular-nums">{formatCurrency(r.amount)}</span>
                    <button
                      onClick={() => handleRemove(r.id)}
                      disabled={removingId === r.id}
                      aria-label={`Remover ${r.description}`}
                      className="rounded-lg p-2 text-[var(--negative)] transition-opacity hover:bg-[var(--negative-soft)] disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between bg-[var(--surface-2)] px-3 py-2.5 text-sm">
            <span className="text-[var(--muted)]">Total por mês</span>
            <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
          </div>
        </div>
      ) : (
        <p className="mb-4 rounded-xl border border-dashed border-[var(--border-strong)] px-4 py-5 text-center text-sm text-[var(--muted)]">
          Nenhum gasto fixo ainda. Aluguel, internet e assinaturas são bons candidatos.
        </p>
      )}

      {adding ? (
        <form onSubmit={handleAdd} className="space-y-3 rounded-xl border border-[var(--border)] p-3">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (ex: Aluguel)"
            autoFocus
            className="app-input"
          />
          <div className="grid grid-cols-[1.4fr_1fr] gap-3">
            <span className="app-input app-affix">
              <span className="text-sm text-[var(--muted)]">R$</span>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                aria-label="Valor"
              />
            </span>
            <span className="app-input app-affix">
              <span className="text-sm text-[var(--muted)]">dia</span>
              <input
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                aria-label="Dia do mês"
              />
            </span>
          </div>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="app-input" aria-label="Categoria">
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {error && <p className="text-xs text-[var(--negative)]">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setAdding(false)} aria-label="Cancelar">
              <X className="h-4 w-4" />
            </Button>
            <Button
              type="submit"
              disabled={saving || !description.trim() || !(Number(amount) > 0)}
              className="flex-1"
            >
              {saving ? "Adicionando..." : "Adicionar gasto fixo"}
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="secondary" onClick={() => setAdding(true)} className="w-full">
          <Plus className="h-4 w-4" /> Novo gasto fixo
        </Button>
      )}
    </Card>
  );
}

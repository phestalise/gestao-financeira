"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Repeat } from "lucide-react";
import { RecurringExpense } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { EXPENSE_CATEGORIES, getCategoryById } from "@/constants/categories";
import { formatCurrency } from "@/lib/utils/currency";

const inputClass =
  "w-full rounded-xl border border-[var(--border)] px-3 py-2.5 outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-strong)]/35 transition-shadow";

export function RecurringExpensesForm({ recurring }: { recurring: RecurringExpense[] }) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("outros_gasto");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    router.refresh();
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    await fetch(`/api/recurring/${id}`, { method: "DELETE" });
    setRemovingId(null);
    router.refresh();
  }

  return (
    <Card className="mt-4 p-5">
      <div className="mb-1 flex items-center gap-2">
        <Repeat className="h-4 w-4 text-[var(--muted)]" />
        <p className="text-sm font-medium">Gastos fixos mensais</p>
      </div>
      <p className="mb-4 text-xs text-[var(--muted)]">
        Entram automaticamente todo mês a partir do mês atual e ficam salvos no histórico. Remover um gasto fixo
        não apaga os meses que já passaram.
      </p>

      {active.length > 0 && (
        <div className="mb-4 divide-y divide-[var(--border)]">
          {active.map((r) => {
            const category = getCategoryById(r.categoryId);
            return (
              <div key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <CategoryBadge categoryId={r.categoryId} icon={category?.icon ?? "more-horizontal"} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.description}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {category?.name} • todo dia {r.dayOfMonth}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="text-sm font-medium tabular-nums">{formatCurrency(r.amount)}</span>
                  <button
                    onClick={() => handleRemove(r.id)}
                    disabled={removingId === r.id}
                    aria-label={`Remover ${r.description}`}
                    className="rounded-lg p-2 hover:bg-[var(--negative-soft)]"
                  >
                    <Trash2 className="h-4 w-4 text-[var(--negative)]" />
                  </button>
                </div>
              </div>
            );
          })}
          <div className="flex justify-between pt-2.5 text-sm">
            <span className="text-[var(--muted)]">Total por mês</span>
            <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleAdd} className="space-y-3">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição (ex: Aluguel)"
          className={inputClass}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Valor"
            className={inputClass}
          />
          <input
            type="number"
            min={1}
            max={31}
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(e.target.value)}
            aria-label="Dia do mês"
            placeholder="Dia"
            className={inputClass}
          />
        </div>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-[var(--negative)]">{error}</p>}
        <Button
          type="submit"
          variant="secondary"
          disabled={saving || !description.trim() || !(Number(amount) > 0)}
          className="w-full"
        >
          {saving ? "Adicionando..." : "Adicionar gasto fixo"}
        </Button>
      </form>
    </Card>
  );
}

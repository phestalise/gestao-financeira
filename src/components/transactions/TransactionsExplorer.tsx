"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Search, Pencil, Trash2, SearchX, X, ArrowDownLeft, ArrowUpRight, Repeat, CreditCard } from "lucide-react";
import { Transaction } from "@/types";
import { Card } from "@/components/ui/Card";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { AddTransactionSheet } from "@/components/transactions/AddTransactionSheet";
import { getCategoryById } from "@/constants/categories";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateLabel, monthKeyOf, shortMonthLabel } from "@/lib/utils/date";

type TypeFilter = "all" | "income" | "expense";

const TYPE_FILTERS: { id: TypeFilter; label: string }[] = [
  { id: "all", label: "Tudo" },
  { id: "expense", label: "Saídas" },
  { id: "income", label: "Entradas" },
];

function signed(t: Transaction): number {
  return t.type === "income" ? t.amount : -t.amount;
}

export function TransactionsExplorer({ initialTransactions }: { initialTransactions: Transaction[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return initialTransactions.filter(
      (t) =>
        (typeFilter === "all" || t.type === typeFilter) &&
        (!term ||
          t.description.toLowerCase().includes(term) ||
          getCategoryById(t.categoryId)?.name.toLowerCase().includes(term))
    );
  }, [search, typeFilter, initialTransactions]);

  // Agrupa por dia, mantendo a ordem (mais recente primeiro) que vem do servidor.
  const days = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    for (const t of filtered) groups.set(t.date, [...(groups.get(t.date) ?? []), t]);
    return [...groups.entries()];
  }, [filtered]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filtered) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, balance: income - expense };
  }, [filtered]);

  // Primeiro toque arma a exclusão, o segundo confirma; se não confirmar em 3s, desarma.
  async function handleDelete(id: string) {
    if (confirmingId !== id) {
      setConfirmingId(id);
      setTimeout(() => setConfirmingId((current) => (current === id ? null : current)), 3000);
      return;
    }
    setConfirmingId(null);
    setDeletingId(id);
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        <Stat label="Entradas" value={totals.income} icon={ArrowDownLeft} tone="text-[var(--positive)]" />
        <Stat label="Saídas" value={totals.expense} icon={ArrowUpRight} tone="text-[var(--negative)]" />
        <Stat label="Saldo" value={totals.balance} tone={totals.balance >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"} highlight />
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 transition-shadow focus-within:border-[var(--primary-strong)]/50 focus-within:ring-4 focus-within:ring-[var(--primary)]/20">
          <Search className="h-4 w-4 shrink-0 text-[var(--muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por descrição ou categoria"
            className="w-full bg-transparent text-sm outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Limpar busca" className="rounded-md p-0.5 text-[var(--muted)] hover:text-[var(--foreground)]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              className={clsx(
                "flex-1 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors sm:flex-none",
                typeFilter === f.id
                  ? "bg-[var(--primary-soft)] text-[var(--foreground)] shadow-[inset_0_0_0_1px_rgba(142,210,245,0.22)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {days.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={SearchX}
            title={initialTransactions.length === 0 ? "Nenhum lançamento ainda" : "Nada encontrado"}
            description={
              initialTransactions.length === 0
                ? "Use o botão Adicionar ou conte um gasto para a IA."
                : "Tente outra busca ou mude o filtro."
            }
          />
        </Card>
      ) : (
        <div className="space-y-5">
          {days.map(([date, items]) => {
            const dayTotal = items.reduce((sum, t) => sum + signed(t), 0);
            return (
              <section key={date}>
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {formatDateLabel(date)}
                  </h2>
                  <span className="text-xs tabular-nums text-[var(--muted-2)]">
                    {dayTotal > 0 ? "+" : dayTotal < 0 ? "−" : ""}
                    {formatCurrency(Math.abs(dayTotal))}
                  </span>
                </div>
                <Card className="divide-y divide-[var(--border)] overflow-hidden">
                  {items.map((t) => (
                    <Row
                      key={t.id}
                      t={t}
                      confirming={confirmingId === t.id}
                      deleting={deletingId === t.id}
                      onEdit={() => setEditing(t)}
                      onDelete={() => handleDelete(t.id)}
                    />
                  ))}
                </Card>
              </section>
            );
          })}
        </div>
      )}

      <AddTransactionSheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        editId={editing?.id}
        initialValues={
          editing
            ? {
                type: editing.type,
                amount: editing.amount,
                categoryId: editing.categoryId,
                description: editing.description,
                date: editing.date,
                paymentMethod: editing.paymentMethod,
                note: editing.note ?? "",
              }
            : undefined
        }
      />
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone,
  highlight,
}: {
  label: string;
  value: number;
  icon?: typeof ArrowDownLeft;
  tone: string;
  highlight?: boolean;
}) {
  return (
    <Card className={clsx("min-w-0 p-3 sm:p-4", highlight && "app-hero col-span-2 border-0 text-white sm:col-span-1")}>
      <p className={clsx("flex items-center gap-1.5 text-xs", highlight ? "text-white/70" : "text-[var(--muted)]")}>
        {Icon && <Icon className={clsx("h-3.5 w-3.5", tone)} />}
        {label}
      </p>
      <p className="mt-1 truncate text-[0.95rem] font-semibold tracking-tight tabular-nums sm:text-xl">
        {value < 0 ? "−" : ""}
        {formatCurrency(Math.abs(value))}
      </p>
    </Card>
  );
}

function Row({
  t,
  confirming,
  deleting,
  onEdit,
  onDelete,
}: {
  t: Transaction;
  confirming: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const category = getCategoryById(t.categoryId);
  // Compra no cartão que pesa na fatura de outro mês.
  const invoiceMonth = t.referenceMonth && t.referenceMonth !== monthKeyOf(t.date) ? t.referenceMonth : null;

  return (
    <div
      className={clsx(
        "group flex items-center justify-between gap-3 px-3 py-3 transition-colors hover:bg-[var(--surface-2)] sm:px-4",
        deleting && "opacity-40"
      )}
    >
      <button onClick={onEdit} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <CategoryBadge categoryId={t.categoryId} icon={category?.icon ?? "more-horizontal"} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{t.description}</p>
          <p className="flex min-w-0 items-center gap-1.5 text-xs text-[var(--muted)]">
            <span className="truncate">{category?.name}</span>
            {t.installment && (
              <Tag>
                {t.installment.current}/{t.installment.total}
              </Tag>
            )}
            {t.recurringId && (
              <Tag>
                <Repeat className="h-3 w-3" /> fixo
              </Tag>
            )}
            {invoiceMonth && (
              <Tag>
                <CreditCard className="h-3 w-3" /> fatura {shortMonthLabel(invoiceMonth)}
              </Tag>
            )}
          </p>
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-0.5">
        <p
          className={clsx(
            "mr-1.5 text-sm font-semibold tabular-nums",
            t.type === "income" ? "text-[var(--positive)]" : "text-[var(--foreground)]"
          )}
        >
          {t.type === "income" ? "+" : "−"}
          {formatCurrency(t.amount)}
        </p>
        <button
          onClick={onEdit}
          aria-label="Editar"
          className="hidden rounded-lg p-2 text-[var(--muted)] opacity-0 transition-opacity hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] group-hover:opacity-100 focus-visible:opacity-100 sm:block"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          aria-label={confirming ? "Confirmar exclusão" : "Excluir"}
          className={clsx(
            "flex items-center gap-1 rounded-lg p-2 text-[var(--negative)] transition-all hover:bg-[var(--negative-soft)]",
            confirming ? "bg-[var(--negative-soft)] px-2.5 opacity-100" : "sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          )}
        >
          <Trash2 className="h-4 w-4" />
          {confirming && <span className="text-xs font-semibold">Excluir?</span>}
        </button>
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[var(--border)] px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
      {children}
    </span>
  );
}

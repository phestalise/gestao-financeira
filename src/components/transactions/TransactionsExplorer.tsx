"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Pencil, Trash2 } from "lucide-react";
import { Transaction } from "@/types";
import { Card } from "@/components/ui/Card";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { AddTransactionSheet } from "@/components/transactions/AddTransactionSheet";
import { getCategoryById } from "@/constants/categories";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateLabel } from "@/lib/utils/date";

export function TransactionsExplorer({ initialTransactions }: { initialTransactions: Transaction[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return initialTransactions;
    return initialTransactions.filter(
      (t) =>
        t.description.toLowerCase().includes(term) ||
        getCategoryById(t.categoryId)?.name.toLowerCase().includes(term)
    );
  }, [search, initialTransactions]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
        <Search className="h-4 w-4 text-[var(--muted)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por descrição ou categoria"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <Card className="divide-y divide-[var(--border)] p-2">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-[var(--muted)]">Nenhuma movimentação encontrada.</p>
        ) : (
          filtered.map((t) => {
            const category = getCategoryById(t.categoryId);
            return (
              <div key={t.id} className="flex items-center justify-between gap-3 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)]">
                    <CategoryIcon icon={category?.icon ?? "circle"} className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.description}</p>
                    <p className="truncate text-xs text-[var(--muted)]">
                      {category?.name} • {formatDateLabel(t.date)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <p
                    className={`mr-1 text-sm font-medium ${
                      t.type === "income" ? "text-[var(--positive)]" : "text-[var(--foreground)]"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </p>
                  <button
                    onClick={() => setEditing(t)}
                    aria-label="Editar"
                    className="rounded-lg p-2 hover:bg-[var(--surface-muted)]"
                  >
                    <Pencil className="h-4 w-4 text-[var(--muted)]" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deletingId === t.id}
                    aria-label="Excluir"
                    className="rounded-lg p-2 hover:bg-[var(--negative-bg)]"
                  >
                    <Trash2 className="h-4 w-4 text-[var(--negative)]" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </Card>

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


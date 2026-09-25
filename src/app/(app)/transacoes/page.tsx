import { listTransactions } from "@/lib/firebase/transactions";
import { TransactionsExplorer } from "@/components/transactions/TransactionsExplorer";
import { ensureRecurringForMonth } from "@/lib/firebase/recurring";
import { currentMonthKey, isMonthKey, monthLabel, transactionMonth } from "@/lib/utils/date";
import { getCategoryById } from "@/constants/categories";
import { formatCurrency } from "@/lib/utils/currency";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ categoria?: string; tipo?: string; mes?: string }>;
}

export default async function TransacoesPage({ searchParams }: Props) {
  const { categoria, tipo, mes } = await searchParams;
  const month = isMonthKey(mes) ? mes : null;

  await ensureRecurringForMonth(month ?? currentMonthKey());

  // O mês é filtrado pelo mês de referência (mês da fatura), que pode diferir da data da compra.
  const transactions = (
    await listTransactions({
      categoryId: categoria,
      type: tipo === "income" || tipo === "expense" ? tipo : undefined,
    })
  ).filter((t) => !month || transactionMonth(t) === month);

  const category = categoria ? getCategoryById(categoria) : undefined;
  const total = transactions.reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0);
  const hasFilter = Boolean(month || category);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 pt-[max(env(safe-area-inset-top),1.5rem)] sm:px-8 sm:pt-10">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">
          Movimentações
          {month && <span className="font-normal text-[var(--muted)]"> · {monthLabel(month)}</span>}
        </h1>
        {hasFilter && (
          <Link href="/transacoes" className="shrink-0 text-sm font-medium text-[var(--primary-strong)]">
            Ver todas
          </Link>
        )}
      </div>
      {category && (
        <Card className="mb-4 flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <CategoryBadge categoryId={category.id} icon={category.icon} />
            <div>
              <p className="text-sm font-medium">{category.name}</p>
              <p className="text-xs text-[var(--muted)]">
                {transactions.length} {transactions.length === 1 ? "lançamento" : "lançamentos"}
              </p>
            </div>
          </div>
          <p className="text-lg font-semibold tabular-nums">{formatCurrency(Math.abs(total))}</p>
        </Card>
      )}
      <TransactionsExplorer initialTransactions={transactions} />
    </div>
  );
}

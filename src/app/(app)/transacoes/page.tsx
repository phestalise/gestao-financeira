import { listTransactions } from "@/lib/firebase/transactions";
import { TransactionsExplorer } from "@/components/transactions/TransactionsExplorer";
import { ensureRecurringForMonth } from "@/lib/firebase/recurring";
import { currentBudgetMonth, FIRST_MONTH, isMonthKey, monthLabel, transactionMonth } from "@/lib/utils/date";
import { getCategoryById, PAYMENT_METHODS } from "@/constants/categories";
import { formatCurrency } from "@/lib/utils/currency";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ categoria?: string; tipo?: string; mes?: string; forma?: string }>;
}

export default async function TransacoesPage({ searchParams }: Props) {
  const { categoria, tipo, mes, forma } = await searchParams;
  const month = isMonthKey(mes) && mes >= FIRST_MONTH ? mes : null;
  // "nao_informado" é o grupo do painel para gastos sem forma de pagamento.
  const method = forma === "nao_informado" ? forma : PAYMENT_METHODS.find((p) => p.id === forma)?.id;
  const methodLabel = method === "nao_informado" ? "Sem forma de pagamento" : PAYMENT_METHODS.find((p) => p.id === method)?.label;
  // O tipo só escolhe a aba inicial; a lista continua com entradas e saídas para dar para trocar de aba.
  const initialType = tipo === "income" || tipo === "expense" ? tipo : "all";

  await ensureRecurringForMonth(month ?? currentBudgetMonth());

  // O mês é filtrado pelo mês de referência (mês da fatura), que pode diferir da data da compra.
  const transactions = (
    await listTransactions({ categoryId: categoria })
  ).filter(
    (t) =>
      (!month || transactionMonth(t) === month) &&
      (!method || (t.paymentMethod ?? "nao_informado") === method)
  );

  const category = categoria ? getCategoryById(categoria) : undefined;
  const total = transactions.reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0);
  const hasFilter = Boolean(month || category || method || initialType !== "all");

  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 pt-[max(env(safe-area-inset-top),1.5rem)] sm:px-8 sm:pt-10">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">
            Seus <span className="brand-serif brand-gradient pr-1">lançamentos</span>
          </h1>
          <p className="mt-1 text-sm capitalize-first text-[var(--muted)]">
            {month ? monthLabel(month) : "Tudo o que entrou e saiu"}
            {methodLabel && <> · {methodLabel}</>} · {transactions.length}{" "}
            {transactions.length === 1 ? "lançamento" : "lançamentos"}
          </p>
        </div>
        {hasFilter && (
          <Link
            href="/transacoes"
            className="shrink-0 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--accent-text)] hover:bg-[var(--surface-2)]"
          >
            Ver todos
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
      <TransactionsExplorer key={initialType} initialTransactions={transactions} initialType={initialType} />
    </div>
  );
}

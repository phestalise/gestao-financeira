import { listTransactions } from "@/lib/firebase/transactions";
import { TransactionsExplorer } from "@/components/transactions/TransactionsExplorer";
import { ensureRecurringForMonth } from "@/lib/firebase/recurring";
import { currentMonthKey, isMonthKey, monthLabel, monthRange } from "@/lib/utils/date";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ categoria?: string; tipo?: string; mes?: string }>;
}

export default async function TransacoesPage({ searchParams }: Props) {
  const { categoria, tipo, mes } = await searchParams;
  const month = isMonthKey(mes) ? mes : null;

  await ensureRecurringForMonth(month ?? currentMonthKey());

  const transactions = await listTransactions({
    ...(month ? monthRange(month) : {}),
    categoryId: categoria,
    type: tipo === "income" || tipo === "expense" ? tipo : undefined,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 pt-[max(env(safe-area-inset-top),1.5rem)] sm:px-8 sm:pt-10">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">
          Movimentações
          {month && <span className="font-normal text-[var(--muted)]"> · {monthLabel(month)}</span>}
        </h1>
        {month && (
          <Link href="/transacoes" className="shrink-0 text-sm font-medium text-[var(--primary-strong)]">
            Ver todas
          </Link>
        )}
      </div>
      <TransactionsExplorer initialTransactions={transactions} />
    </div>
  );
}

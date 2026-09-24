import { listTransactions } from "@/lib/firebase/transactions";
import { TransactionsExplorer } from "@/components/transactions/TransactionsExplorer";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ categoria?: string; tipo?: string }>;
}

export default async function TransacoesPage({ searchParams }: Props) {
  const { categoria, tipo } = await searchParams;

  const transactions = await listTransactions({
    categoryId: categoria,
    type: tipo === "income" || tipo === "expense" ? tipo : undefined,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 pt-[max(env(safe-area-inset-top),1.5rem)] sm:px-8 sm:pt-10">
      <h1 className="mb-4 text-xl font-semibold tracking-tight">Movimentações</h1>
      <TransactionsExplorer initialTransactions={transactions} />
    </div>
  );
}

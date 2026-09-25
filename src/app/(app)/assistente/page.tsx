import { ChatAssistant, type MonthSnapshot } from "@/components/chat/ChatAssistant";
import { listTransactions } from "@/lib/firebase/transactions";
import { getProfile } from "@/lib/firebase/profile";
import { listOpeningBalances } from "@/lib/firebase/months";
import { buildSummary } from "@/lib/services/dashboard";
import { currentMonthKey, transactionMonth } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function AssistentePage() {
  const month = currentMonthKey();
  const [transactions, profile, openingBalances] = await Promise.all([
    listTransactions(),
    getProfile(),
    listOpeningBalances(),
  ]);
  const inMonth = transactions.filter((t) => transactionMonth(t) === month);
  const summary = buildSummary(inMonth, profile, openingBalances[month] ?? 0);

  // Só mostra o resumo quando existe algo para resumir; conta nova começa com a tela limpa.
  const snapshot: MonthSnapshot | null =
    summary.income > 0 || inMonth.length > 0
      ? {
          balance: summary.balance,
          expenses: summary.expenses,
          budgetUsedPercent: summary.budgetUsedPercent,
          status: summary.status,
          count: inMonth.length,
        }
      : null;

  return <ChatAssistant firstName={profile.name?.split(" ")[0]} snapshot={snapshot} />;
}

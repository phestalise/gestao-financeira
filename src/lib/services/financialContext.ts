import { listTransactions } from "@/lib/firebase/transactions";
import { getProfile } from "@/lib/firebase/profile";
import { buildSummary, buildCategoryBreakdown, biggestExpense } from "@/lib/services/dashboard";
import { toISODate } from "@/lib/utils/date";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";

export async function buildFinancialContext() {
  const now = new Date();
  const previousMonth = subMonths(now, 1);

  const currentRange = { from: toISODate(startOfMonth(now)), to: toISODate(endOfMonth(now)) };
  const previousRange = {
    from: toISODate(startOfMonth(previousMonth)),
    to: toISODate(endOfMonth(previousMonth)),
  };

  const [currentTransactions, previousTransactions, profile] = await Promise.all([
    listTransactions(currentRange),
    listTransactions(previousRange),
    getProfile(),
  ]);

  const currentSummary = buildSummary(currentTransactions, profile);
  const previousSummary = buildSummary(previousTransactions, profile);

  return {
    hoje: toISODate(now),
    rendaMensalCadastrada: profile.income,
    metaEconomiaPercent: profile.savingsGoalPercent ?? null,
    mesAtual: {
      periodo: currentRange,
      resumo: currentSummary,
      gastosPorCategoria: buildCategoryBreakdown(currentTransactions),
      maiorGasto: biggestExpense(currentTransactions),
      quantidadeLancamentos: currentTransactions.length,
      lancamentos: currentTransactions.slice(0, 40).map((t) => ({
        id: t.id,
        tipo: t.type,
        valor: t.amount,
        categoria: t.categoryId,
        descricao: t.description,
        data: t.date,
        formaPagamento: t.paymentMethod,
      })),
    },
    mesAnterior: {
      periodo: previousRange,
      resumo: previousSummary,
      gastosPorCategoria: buildCategoryBreakdown(previousTransactions),
    },
  };
}

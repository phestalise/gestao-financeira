import { listTransactions } from "@/lib/firebase/transactions";
import { getProfile } from "@/lib/firebase/profile";
import { buildSummary, buildCategoryBreakdown, biggestExpense, buildMonthlyHistory } from "@/lib/services/dashboard";
import { ensureRecurringForMonth, listRecurring } from "@/lib/firebase/recurring";
import { currentMonthKey, shiftMonth, toISODate } from "@/lib/utils/date";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";

export async function buildFinancialContext() {
  const now = new Date();
  const previousMonth = subMonths(now, 1);

  const currentRange = { from: toISODate(startOfMonth(now)), to: toISODate(endOfMonth(now)) };
  const previousRange = {
    from: toISODate(startOfMonth(previousMonth)),
    to: toISODate(endOfMonth(previousMonth)),
  };

  await ensureRecurringForMonth(currentMonthKey());

  const [allTransactions, profile, recurring] = await Promise.all([
    listTransactions(),
    getProfile(),
    listRecurring(),
  ]);
  const inRange = (range: { from: string; to: string }) =>
    allTransactions.filter((t) => t.date >= range.from && t.date <= range.to);
  const currentTransactions = inRange(currentRange);
  const previousTransactions = inRange(previousRange);
  const lastMonths = Array.from({ length: 6 }, (_, i) => shiftMonth(currentMonthKey(), -i));

  const currentSummary = buildSummary(currentTransactions, profile);
  const previousSummary = buildSummary(previousTransactions, profile);

  return {
    hoje: toISODate(now),
    rendaMensalCadastrada: profile.income,
    metaEconomiaPercent: profile.savingsGoalPercent ?? null,
    observacaoSaldo:
      "Quando não há entradas lançadas no mês, a renda do mês é a renda mensal cadastrada e o saldo é renda − gastos.",
    gastosFixosMensais: recurring
      .filter((r) => r.active)
      .map((r) => ({ descricao: r.description, valor: r.amount, categoria: r.categoryId, dia: r.dayOfMonth })),
    historicoMensal: buildMonthlyHistory(allTransactions, profile, lastMonths),
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

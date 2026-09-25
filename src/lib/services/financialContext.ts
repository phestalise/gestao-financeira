import { listTransactions } from "@/lib/firebase/transactions";
import { getProfile } from "@/lib/firebase/profile";
import { buildSummary, buildCategoryBreakdown, biggestExpense, buildMonthlyHistory } from "@/lib/services/dashboard";
import { ensureRecurringForMonth, listRecurring } from "@/lib/firebase/recurring";
import { listOpeningBalances } from "@/lib/firebase/months";
import { currentMonthKey, shiftMonth, toISODate, transactionMonth } from "@/lib/utils/date";

export async function buildFinancialContext() {
  const now = new Date();
  const currentMonth = currentMonthKey();
  const previousMonth = shiftMonth(currentMonth, -1);

  await ensureRecurringForMonth(currentMonth);

  const [allTransactions, profile, recurring, openingBalances] = await Promise.all([
    listTransactions(),
    getProfile(),
    listRecurring(),
    listOpeningBalances(),
  ]);
  const inMonth = (month: string) => allTransactions.filter((t) => transactionMonth(t) === month);
  const currentTransactions = inMonth(currentMonth);
  const previousTransactions = inMonth(previousMonth);
  const lastMonths = Array.from({ length: 6 }, (_, i) => shiftMonth(currentMonth, -i));

  const currentSummary = buildSummary(currentTransactions, profile, openingBalances[currentMonth] ?? 0);
  const previousSummary = buildSummary(previousTransactions, profile, openingBalances[previousMonth] ?? 0);

  return {
    hoje: toISODate(now),
    rendaMensalCadastrada: profile.income,
    metaEconomiaPercent: profile.savingsGoalPercent ?? null,
    observacaoSaldo:
      "Resultado do mês = renda + valor na conta no início do mês − despesas. Sem entradas lançadas, a renda do mês é a renda mensal cadastrada. Compras no cartão contam no mês em que a fatura é paga (mesReferencia), não na data da compra.",
    gastosFixosMensais: recurring
      .filter((r) => r.active)
      .map((r) => ({ descricao: r.description, valor: r.amount, categoria: r.categoryId, dia: r.dayOfMonth })),
    historicoMensal: buildMonthlyHistory(allTransactions, profile, lastMonths, openingBalances),
    mesAtual: {
      mes: currentMonth,
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
        mesReferencia: transactionMonth(t),
        formaPagamento: t.paymentMethod,
      })),
    },
    mesAnterior: {
      mes: previousMonth,
      resumo: previousSummary,
      gastosPorCategoria: buildCategoryBreakdown(previousTransactions),
    },
  };
}

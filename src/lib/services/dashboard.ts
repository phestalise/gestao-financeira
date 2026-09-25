import { Transaction, DashboardSummary, UserProfile } from "@/types";
import { getCategoryById } from "@/constants/categories";
import { monthKeyOf, type MonthKey } from "@/lib/utils/date";

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  icon: string;
  total: number;
  percentOfExpenses: number;
}

export function buildSummary(transactions: Transaction[], profile: UserProfile): DashboardSummary {
  const registeredIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Sem entradas lançadas no mês, a renda mensal cadastrada no perfil vale como a renda do mês:
  // saldo disponível = renda − gastos.
  const incomeFromProfile = registeredIncome === 0 && profile.income > 0;
  const income = incomeFromProfile ? profile.income : registeredIncome;

  const balance = income - expenses;
  const savings = balance > 0 ? balance : 0;

  const budgetUsedPercent = income > 0 ? Math.round((expenses / income) * 100) : 0;

  let status: DashboardSummary["status"] = "ok";
  if (budgetUsedPercent >= 100) status = "over";
  else if (budgetUsedPercent >= 80) status = "warning";

  return { income, incomeFromProfile, expenses, balance, savings, budgetUsedPercent, status };
}

export function buildCategoryBreakdown(transactions: Transaction[]): CategoryBreakdownItem[] {
  const expenses = transactions.filter((t) => t.type === "expense");
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

  const totals = new Map<string, number>();
  for (const t of expenses) {
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
  }

  return Array.from(totals.entries())
    .map(([categoryId, total]) => {
      const category = getCategoryById(categoryId);
      return {
        categoryId,
        name: category?.name ?? categoryId,
        icon: category?.icon ?? "circle",
        total,
        percentOfExpenses: totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export function biggestExpense(transactions: Transaction[]): Transaction | null {
  const expenses = transactions.filter((t) => t.type === "expense");
  if (expenses.length === 0) return null;
  return expenses.reduce((max, t) => (t.amount > max.amount ? t : max), expenses[0]);
}

export interface MonthHistoryItem {
  month: MonthKey;
  income: number;
  incomeFromProfile: boolean;
  expenses: number;
  balance: number;
}

// Resumo de cada mês, do mais recente para o mais antigo, a partir de todos os lançamentos armazenados.
export function buildMonthlyHistory(
  transactions: Transaction[],
  profile: UserProfile,
  months: MonthKey[]
): MonthHistoryItem[] {
  return months.map((month) => {
    const summary = buildSummary(
      transactions.filter((t) => monthKeyOf(t.date) === month),
      profile
    );
    return {
      month,
      income: summary.income,
      incomeFromProfile: summary.incomeFromProfile,
      expenses: summary.expenses,
      balance: summary.balance,
    };
  });
}

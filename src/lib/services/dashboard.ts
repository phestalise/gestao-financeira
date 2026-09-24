import { Transaction, DashboardSummary, UserProfile } from "@/types";
import { getCategoryById } from "@/constants/categories";

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  icon: string;
  total: number;
  percentOfExpenses: number;
}

export function buildSummary(transactions: Transaction[], profile: UserProfile): DashboardSummary {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expenses;
  const savings = balance > 0 ? balance : 0;

  const referenceIncome = income > 0 ? income : profile.income;
  const budgetUsedPercent = referenceIncome > 0 ? Math.round((expenses / referenceIncome) * 100) : 0;

  let status: DashboardSummary["status"] = "ok";
  if (budgetUsedPercent >= 100) status = "over";
  else if (budgetUsedPercent >= 80) status = "warning";

  return { income, expenses, balance, savings, budgetUsedPercent, status };
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

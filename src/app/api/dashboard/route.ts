import { NextResponse } from "next/server";
import { listTransactions } from "@/lib/firebase/transactions";
import { getProfile } from "@/lib/firebase/profile";
import { buildSummary, buildCategoryBreakdown, biggestExpense } from "@/lib/services/dashboard";
import { listOpeningBalances } from "@/lib/firebase/months";
import { currentMonthKey, transactionMonth } from "@/lib/utils/date";

export async function GET() {
  const month = currentMonthKey();
  const [allTransactions, profile, openingBalances] = await Promise.all([
    listTransactions(),
    getProfile(),
    listOpeningBalances(),
  ]);
  const transactions = allTransactions.filter((t) => transactionMonth(t) === month);

  const summary = buildSummary(transactions, profile, openingBalances[month] ?? 0);
  const categoryBreakdown = buildCategoryBreakdown(transactions);
  const biggest = biggestExpense(transactions);

  return NextResponse.json({
    summary,
    categoryBreakdown,
    biggestExpense: biggest,
    transactionCount: transactions.length,
    recentTransactions: transactions.slice(0, 5),
    profile,
  });
}

import { NextResponse } from "next/server";
import { listTransactions } from "@/lib/firebase/transactions";
import { getProfile } from "@/lib/firebase/profile";
import { buildSummary, buildCategoryBreakdown, biggestExpense } from "@/lib/services/dashboard";
import { currentMonthRange } from "@/lib/utils/date";

export async function GET() {
  const { from, to } = currentMonthRange();
  const [transactions, profile] = await Promise.all([
    listTransactions({ from, to }),
    getProfile(),
  ]);

  const summary = buildSummary(transactions, profile);
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

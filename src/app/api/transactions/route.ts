import { NextRequest, NextResponse } from "next/server";
import { listTransactions, createTransaction } from "@/lib/firebase/transactions";
import { transactionInputSchema } from "@/lib/validation/transaction";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const type = (searchParams.get("type") as "income" | "expense" | null) ?? undefined;

  const transactions = await listTransactions({ from, to, categoryId, type: type ?? undefined });
  return NextResponse.json({ transactions });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const result = transactionInputSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const transaction = await createTransaction(result.data);
  return NextResponse.json({ transaction }, { status: 201 });
}

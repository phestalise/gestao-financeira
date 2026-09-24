import { NextRequest, NextResponse } from "next/server";
import { updateTransaction, deleteTransaction } from "@/lib/firebase/transactions";
import { transactionUpdateSchema } from "@/lib/validation/transaction";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const result = transactionUpdateSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const transaction = await updateTransaction(id, result.data);
  if (!transaction) {
    return NextResponse.json({ error: "Movimentação não encontrada." }, { status: 404 });
  }
  return NextResponse.json({ transaction });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const deleted = await deleteTransaction(id);
  if (!deleted) {
    return NextResponse.json({ error: "Movimentação não encontrada." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

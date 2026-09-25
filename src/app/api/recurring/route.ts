import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listRecurring, createRecurring } from "@/lib/firebase/recurring";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { currentMonthKey, isMonthKey } from "@/lib/utils/date";

const expenseCategoryIds = EXPENSE_CATEGORIES.map((c) => c.id) as [string, ...string[]];

const recurringInputSchema = z.object({
  description: z.string().min(1).max(120),
  amount: z.number().positive(),
  categoryId: z.enum(expenseCategoryIds),
  dayOfMonth: z.number().int().min(1).max(31),
  paymentMethod: z
    .enum(["dinheiro", "pix", "debito", "credito", "boleto", "transferencia", "outro"])
    .nullable()
    .default(null),
  startMonth: z.string().refine(isMonthKey, "Mês inválido.").optional(),
});

export async function GET() {
  const recurring = await listRecurring();
  return NextResponse.json({ recurring });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const result = recurringInputSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const recurring = await createRecurring({
    ...result.data,
    startMonth: result.data.startMonth ?? currentMonthKey(),
  });
  return NextResponse.json({ recurring }, { status: 201 });
}

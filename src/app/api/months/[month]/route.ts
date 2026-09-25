import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setOpeningBalance } from "@/lib/firebase/months";
import { isMonthKey } from "@/lib/utils/date";

interface Params {
  params: Promise<{ month: string }>;
}

const monthInputSchema = z.object({
  openingBalance: z.number().finite(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  const { month } = await params;
  if (!isMonthKey(month)) {
    return NextResponse.json({ error: "Mês inválido." }, { status: 400 });
  }

  const result = monthInputSchema.safeParse(await req.json().catch(() => null));
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  await setOpeningBalance(month, result.data.openingBalance);
  return NextResponse.json({ ok: true });
}

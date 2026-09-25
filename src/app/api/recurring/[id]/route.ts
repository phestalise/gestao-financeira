import { NextRequest, NextResponse } from "next/server";
import { deactivateRecurring } from "@/lib/firebase/recurring";

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ok = await deactivateRecurring(id);
  if (!ok) {
    return NextResponse.json({ error: "Gasto fixo não encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

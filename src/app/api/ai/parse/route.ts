import { NextRequest, NextResponse } from "next/server";
import { parseTransactionMessage } from "@/lib/ai/gemini";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const message = body?.message;

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });
  }

  try {
    const parsed = await parseTransactionMessage(message);
    return NextResponse.json({ parsed });
  } catch (error) {
    console.error("Erro ao interpretar mensagem com IA:", error);
    return NextResponse.json(
      { error: "Não consegui entender essa movimentação. Pode reformular?" },
      { status: 422 }
    );
  }
}

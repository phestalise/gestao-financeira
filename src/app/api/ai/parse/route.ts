import { NextRequest, NextResponse } from "next/server";
import { parseTransactionMessage } from "@/lib/ai/gemini";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { LIMITS, tooManyRequests, withinLimits } from "@/lib/security/rate-limit";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const message = body?.message;

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });
  }
  if (message.length > 2_000) {
    return NextResponse.json({ error: "Mensagem longa demais." }, { status: 400 });
  }

  const uid = await getCurrentUserId();
  if (!(await withinLimits([[`ai-hour:${uid}`, LIMITS.aiPerHour], [`ai-day:${uid}`, LIMITS.aiPerDay]]))) {
    return tooManyRequests("Você usou bastante o assistente agora. Tenta de novo daqui a pouco.");
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

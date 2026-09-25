import { NextRequest, NextResponse } from "next/server";
import { chatWithFinancialContext, type ChatImage } from "@/lib/ai/gemini";
import { buildFinancialContext } from "@/lib/services/financialContext";
import { updateTransaction, deleteTransaction, getTransaction } from "@/lib/firebase/transactions";
import { getCategoryById } from "@/constants/categories";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateLabel } from "@/lib/utils/date";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
// O corpo de uma função na Vercel é limitado a ~4,5 MB; o cliente já reduz a imagem antes de enviar.
const MAX_IMAGE_BASE64_LENGTH = 4_000_000;

interface ChatRequestBody {
  message: string;
  image?: ChatImage | null;
  history?: { role: "user" | "assistant"; content: string }[];
  lastTransactionId?: string | null;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as ChatRequestBody | null;

  const image = body?.image ?? null;
  if (
    image &&
    (typeof image.data !== "string" ||
      !ALLOWED_IMAGE_TYPES.includes(image.mimeType) ||
      image.data.length > MAX_IMAGE_BASE64_LENGTH)
  ) {
    return NextResponse.json({ error: "Imagem inválida ou grande demais." }, { status: 400 });
  }

  if (!body || typeof body.message !== "string" || (!body.message.trim() && !image)) {
    return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });
  }

  const financialContext = await buildFinancialContext();

  let result;
  try {
    result = await chatWithFinancialContext({
      message: body.message,
      image,
      history: body.history ?? [],
      financialContext,
    });
  } catch (error) {
    console.error("Erro no chat da IA:", error);
    return NextResponse.json(
      { reply: "Tive um problema para processar isso agora. Pode tentar de novo?", action: "clarify" },
      { status: 200 }
    );
  }

  switch (result.action) {
    case "create_transaction": {
      const t = result.transaction;
      if (!t || !t.amount || !t.categoryId || !t.type) {
        return NextResponse.json({
          action: "clarify",
          reply: result.clarifyingQuestion ?? "Não entendi bem o valor ou a categoria. Pode detalhar?",
        });
      }
      const category = getCategoryById(t.categoryId);
      return NextResponse.json({
        action: "create_transaction",
        reply: `${category?.name ?? t.categoryId}\n${formatCurrency(t.amount)}\n${formatDateLabel(t.date ?? "")}\n\nPosso registrar?`,
        preview: t,
      });
    }

    case "update_transaction": {
      if (!body.lastTransactionId) {
        return NextResponse.json({
          action: "clarify",
          reply: "Não sei qual lançamento corrigir. Pode me dizer o valor ou a descrição dele?",
        });
      }
      const existing = await getTransaction(body.lastTransactionId);
      if (!existing) {
        return NextResponse.json({
          action: "clarify",
          reply: "Não encontrei esse lançamento para corrigir.",
        });
      }
      const updated = await updateTransaction(body.lastTransactionId, result.transaction ?? {});
      return NextResponse.json({
        action: "update_transaction",
        reply: `Atualizei o lançamento para ${formatCurrency(updated?.amount ?? existing.amount)}.`,
        transaction: updated,
      });
    }

    case "delete_transaction": {
      if (!body.lastTransactionId) {
        return NextResponse.json({
          action: "clarify",
          reply: "Não sei qual lançamento apagar. Pode especificar?",
        });
      }
      const deleted = await deleteTransaction(body.lastTransactionId);
      return NextResponse.json({
        action: "delete_transaction",
        reply: deleted ? "Apaguei esse lançamento." : "Não encontrei esse lançamento.",
      });
    }

    case "answer_question": {
      return NextResponse.json({
        action: "answer_question",
        reply: result.answer ?? "Não tenho essa informação ainda.",
      });
    }

    case "clarify":
    default: {
      return NextResponse.json({
        action: "clarify",
        reply: result.clarifyingQuestion ?? "Pode explicar melhor?",
      });
    }
  }
}

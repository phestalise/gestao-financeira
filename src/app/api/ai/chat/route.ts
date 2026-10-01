import { NextRequest, NextResponse } from "next/server";
import { chatWithFinancialContext, type ChatImage } from "@/lib/ai/gemini";
import { buildFinancialContext } from "@/lib/services/financialContext";
import { updateTransaction, getTransaction } from "@/lib/firebase/transactions";
import { formatCurrency } from "@/lib/utils/currency";
import { transactionUpdateSchema } from "@/lib/validation/transaction";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { LIMITS, tooManyRequests, withinLimits } from "@/lib/security/rate-limit";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
// O corpo de uma função na Vercel é limitado a ~4,5 MB; o cliente já reduz a imagem antes de enviar.
const MAX_IMAGE_BASE64_LENGTH = 4_000_000;
// Limites de texto: cada chamada à IA custa cota da GEMINI_API_KEY, e o histórico vai inteiro a cada mensagem.
const MAX_MESSAGE_LENGTH = 2_000;
const MAX_HISTORY_ITEMS = 20;
const MAX_HISTORY_ITEM_LENGTH = 2_000;

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
  if (body.message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "Mensagem longa demais." }, { status: 400 });
  }
  const history = (Array.isArray(body.history) ? body.history : [])
    .filter((h) => (h?.role === "user" || h?.role === "assistant") && typeof h.content === "string")
    .slice(-MAX_HISTORY_ITEMS)
    .map((h) => ({ role: h.role, content: h.content.slice(0, MAX_HISTORY_ITEM_LENGTH) }));

  const uid = await getCurrentUserId();
  if (!(await withinLimits([[`ai-hour:${uid}`, LIMITS.aiPerHour], [`ai-day:${uid}`, LIMITS.aiPerDay]]))) {
    return tooManyRequests("Você usou bastante o assistente agora. Tenta de novo daqui a pouco.");
  }

  const financialContext = await buildFinancialContext();

  let result;
  try {
    result = await chatWithFinancialContext({
      message: body.message,
      image,
      history,
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
      // O cartão de confirmação mostra categoria, valor e data; o texto só apresenta o cartão.
      return NextResponse.json({
        action: "create_transaction",
        reply: t.type === "income" ? "Opa, dinheiro entrando! 💸 Entendi assim:" : "Entendi assim. Confere e registra:",
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
      // A IA sugere os campos; passam pela mesma validação de uma edição feita na tela.
      const changes = transactionUpdateSchema.safeParse(result.transaction ?? {});
      if (!changes.success) {
        return NextResponse.json({ action: "clarify", reply: "Não entendi bem a correção. Pode detalhar?" });
      }
      const updated = await updateTransaction(body.lastTransactionId, changes.data);
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
      // Não apaga direto: o pedido pode vir de um texto escondido numa imagem. Quem confirma é a pessoa,
      // pelo botão do chat, que chama DELETE /api/transactions/{id}.
      const target = await getTransaction(body.lastTransactionId);
      if (!target) {
        return NextResponse.json({ action: "clarify", reply: "Não encontrei esse lançamento." });
      }
      return NextResponse.json({
        action: "delete_transaction",
        reply: `Quer mesmo apagar "${target.description}" (${formatCurrency(target.amount)})?`,
        deleteTarget: { id: target.id },
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

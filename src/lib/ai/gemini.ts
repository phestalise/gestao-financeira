import { GoogleGenAI } from "@google/genai";
import { parseTransactionPrompt, chatSystemPrompt } from "@/lib/ai/prompts";
import {
  parsedTransactionSchema,
  chatActionSchema,
  geminiTransactionResponseSchema,
  geminiChatResponseSchema,
  type ParsedTransaction,
  type ChatAction,
} from "@/lib/ai/schema";

const MODEL = "gemini-3.8-flash";

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY ausente. Configure em .env.local");
  }
  return new GoogleGenAI({ apiKey });
}

function isRetryableStatus(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  return status === 503 || status === 429;
}

// O tier gratuito do Gemini ocasionalmente responde 503 (alta demanda) ou 429 (limite de taxa).
// Como é um app de uso pessoal com poucas chamadas, vale a pena tentar de novo em vez de
// devolver erro na primeira falha transitória.
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryableStatus(error) || i === attempts - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 800 * (i + 1)));
    }
  }
  throw lastError;
}

export async function parseTransactionMessage(message: string): Promise<ParsedTransaction> {
  const ai = getClient();

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: message,
      config: {
        systemInstruction: parseTransactionPrompt(),
        responseMimeType: "application/json",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        responseSchema: geminiTransactionResponseSchema as any,
      },
    })
  );

  const raw = response.text;
  if (!raw) throw new Error("A IA não retornou resposta.");

  const parsed = JSON.parse(raw);
  return parsedTransactionSchema.parse(parsed);
}

interface ChatContext {
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
  financialContext: Record<string, unknown>;
}

export async function chatWithFinancialContext({
  message,
  history,
  financialContext,
}: ChatContext): Promise<ChatAction> {
  const ai = getClient();

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: [
        ...history.map((h) => ({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content }],
        })),
        { role: "user", parts: [{ text: message }] },
      ],
      config: {
        systemInstruction: chatSystemPrompt(JSON.stringify(financialContext)),
        responseMimeType: "application/json",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        responseSchema: geminiChatResponseSchema as any,
      },
    })
  );

  const raw = response.text;
  if (!raw) throw new Error("A IA não retornou resposta.");

  const parsed = JSON.parse(raw);
  return chatActionSchema.parse(parsed);
}

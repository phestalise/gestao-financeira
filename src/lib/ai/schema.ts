import { z } from "zod";
import { ALL_CATEGORIES } from "@/constants/categories";

const categoryIds = ALL_CATEGORIES.map((c) => c.id) as [string, ...string[]];
const paymentMethods = [
  "dinheiro",
  "pix",
  "debito",
  "credito",
  "boleto",
  "transferencia",
  "outro",
] as const;

export const parsedTransactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive(),
  categoryId: z.enum(categoryIds),
  description: z.string().min(1).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMethod: z.enum(paymentMethods).nullable(),
  confidence: z.enum(["high", "low"]),
});

export type ParsedTransaction = z.infer<typeof parsedTransactionSchema>;

// Schema no formato aceito pela API do Gemini (subconjunto de OpenAPI).
export const geminiTransactionResponseSchema = {
  type: "OBJECT",
  properties: {
    type: { type: "STRING", enum: ["income", "expense"] },
    amount: { type: "NUMBER" },
    categoryId: { type: "STRING", enum: categoryIds },
    description: { type: "STRING" },
    date: { type: "STRING", description: "Data no formato YYYY-MM-DD" },
    paymentMethod: {
      type: "STRING",
      enum: [...paymentMethods, "null"],
      nullable: true,
    },
    confidence: { type: "STRING", enum: ["high", "low"] },
  },
  required: ["type", "amount", "categoryId", "description", "date", "confidence"],
};

export const chatActionSchema = z.object({
  action: z.enum(["create_transaction", "update_transaction", "delete_transaction", "answer_question", "clarify"]),
  transaction: parsedTransactionSchema.partial().nullish(),
  targetTransactionId: z.string().nullish(),
  answer: z.string().nullish(),
  clarifyingQuestion: z.string().nullish(),
});

export type ChatAction = z.infer<typeof chatActionSchema>;

export const geminiChatResponseSchema = {
  type: "OBJECT",
  properties: {
    action: {
      type: "STRING",
      enum: ["create_transaction", "update_transaction", "delete_transaction", "answer_question", "clarify"],
    },
    transaction: {
      type: "OBJECT",
      properties: geminiTransactionResponseSchema.properties,
      nullable: true,
    },
    targetTransactionId: { type: "STRING", nullable: true },
    answer: { type: "STRING", nullable: true },
    clarifyingQuestion: { type: "STRING", nullable: true },
  },
  required: ["action"],
};

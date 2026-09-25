import { z } from "zod";
import { ALL_CATEGORIES } from "@/constants/categories";

const categoryIds = ALL_CATEGORIES.map((c) => c.id) as [string, ...string[]];

export const transactionInputSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive("O valor precisa ser maior que zero."),
  categoryId: z.enum(categoryIds),
  description: z.string().min(1, "Descrição obrigatória.").max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  paymentMethod: z
    .enum(["dinheiro", "pix", "debito", "credito", "boleto", "transferencia", "outro"])
    .nullable(),
  note: z.string().max(500).optional(),
  referenceMonth: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mês inválido.")
    .optional(),
});

export type TransactionInput = z.infer<typeof transactionInputSchema>;

export const transactionUpdateSchema = transactionInputSchema.partial();

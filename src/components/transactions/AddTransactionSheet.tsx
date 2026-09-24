"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from "@/constants/categories";
import { today } from "@/lib/utils/date";
import { TransactionType } from "@/types";

const formSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("Informe um valor maior que zero."),
  categoryId: z.string().min(1, "Escolha uma categoria."),
  description: z.string().min(1, "Descreva a movimentação."),
  date: z.string().min(1),
  paymentMethod: z.string().nullable(),
  note: z.string().optional(),
});

type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  initialValues?: Partial<FormInput>;
  editId?: string;
}

export function AddTransactionSheet({ open, onClose, initialValues, editId }: Props) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "expense",
      amount: 0,
      categoryId: "",
      description: "",
      date: today(),
      paymentMethod: null,
      note: "",
      ...initialValues,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        type: "expense",
        amount: 0,
        categoryId: "",
        description: "",
        date: today(),
        paymentMethod: null,
        note: "",
        ...initialValues,
      });
      setSubmitError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialValues]);

  const type = watch("type") as TransactionType;
  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    const res = await fetch(editId ? `/api/transactions/${editId}` : "/api/transactions", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        paymentMethod: values.paymentMethod || null,
      }),
    });

    if (!res.ok) {
      setSubmitError("Não consegui salvar. Tente novamente.");
      return;
    }

    onClose();
    router.refresh();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-[2px] sm:items-center">
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-[var(--surface)] sm:max-w-md sm:rounded-3xl">
        <div className="flex justify-center pt-2.5 sm:hidden">
          <div className="h-1 w-9 rounded-full bg-[var(--border-strong)]" />
        </div>

        <div className="flex items-center justify-between px-6 pb-4 pt-3 sm:pt-6">
          <h2 className="text-lg font-semibold tracking-tight">
            {editId ? "Editar movimentação" : "Adicionar movimentação"}
          </h2>
          <button onClick={onClose} aria-label="Fechar" className="rounded-full p-2 hover:bg-[var(--surface-2)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 space-y-5 overflow-y-auto px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)]"
        >
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--surface-2)] p-1">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setValue("type", t);
                  setValue("categoryId", "");
                }}
                className={`rounded-lg py-2 text-sm font-medium transition-all ${
                  type === t
                    ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted)]"
                }`}
              >
                {t === "expense" ? "Saída" : "Entrada"}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-2 block text-sm text-[var(--muted)]">Valor</label>
            <div className="flex items-baseline justify-center gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-5">
              <span className="text-xl font-medium text-[var(--muted)]">R$</span>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                autoFocus
                className="w-full max-w-[12rem] bg-transparent text-center text-4xl font-semibold tracking-tight tabular-nums outline-none"
                placeholder="0,00"
                {...register("amount")}
              />
            </div>
            {errors.amount && <p className="mt-1 text-xs text-[var(--negative)]">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm text-[var(--muted)]">Categoria</label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((c) => {
                const selected = watch("categoryId") === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setValue("categoryId", c.id, { shouldValidate: true })}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 pt-2.5 text-center transition-all ${
                      selected
                        ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                        : "border-transparent hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    <CategoryBadge categoryId={c.id} icon={c.icon} size="sm" />
                    <span className="line-clamp-2 text-[10px] leading-tight text-[var(--muted)]">
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-[var(--negative)]">{errors.categoryId.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Descrição</label>
            <input
              className="w-full rounded-xl border border-[var(--border)] px-3 py-3 outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-strong)]/35 transition-shadow"
              placeholder="Exemplo: Gasolina"
              {...register("description")}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-[var(--negative)]">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-[var(--muted)]">Data</label>
              <input
                type="date"
                className="w-full rounded-xl border border-[var(--border)] px-3 py-3 outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-strong)]/35 transition-shadow"
                {...register("date")}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--muted)]">Pagamento</label>
              <select
                className="w-full rounded-xl border border-[var(--border)] px-3 py-3 outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-strong)]/35 transition-shadow"
                {...register("paymentMethod")}
              >
                <option value="">Não informado</option>
                {PAYMENT_METHODS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Observação (opcional)</label>
            <textarea
              rows={2}
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-strong)]/35 transition-shadow"
              {...register("note")}
            />
          </div>

          {submitError && <p className="text-sm text-[var(--negative)]">{submitError}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {editId ? "Salvar alterações" : "Salvar movimentação"}
          </Button>
        </form>
      </div>
    </div>
  );
}

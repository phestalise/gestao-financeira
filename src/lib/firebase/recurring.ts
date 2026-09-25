import { FieldValue } from "firebase-admin/firestore";
import { currentUserDoc, getDb } from "@/lib/firebase/admin";
import { RecurringExpense } from "@/types";
import { currentMonthKey, shiftMonth, type MonthKey } from "@/lib/utils/date";

async function collection() {
  return (await currentUserDoc()).collection("recurring");
}

export async function listRecurring(): Promise<RecurringExpense[]> {
  const snapshot = await (await collection()).orderBy("createdAt", "asc").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as RecurringExpense);
}

export async function createRecurring(
  data: Omit<RecurringExpense, "id" | "active" | "generatedMonths" | "createdAt">
): Promise<RecurringExpense> {
  const ref = await (await collection()).add({
    ...data,
    active: true,
    generatedMonths: [],
    createdAt: new Date().toISOString(),
  });
  const doc = await ref.get();
  return { id: doc.id, ...doc.data() } as RecurringExpense;
}

// Desativa o gasto fixo para os próximos meses; os lançamentos já gerados continuam no histórico.
export async function deactivateRecurring(id: string): Promise<boolean> {
  const ref = (await collection()).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return false;
  await ref.update({ active: false });
  return true;
}

function dateInMonth(month: MonthKey, dayOfMonth: number): string {
  const [year, m] = month.split("-").map(Number);
  const lastDay = new Date(year, m, 0).getDate();
  return `${month}-${String(Math.min(dayOfMonth, lastDay)).padStart(2, "0")}`;
}

// Cria, uma única vez por mês, o lançamento de cada gasto fixo ativo. Vai até o próximo mês, para dar
// para planejá-lo; meses mais distantes não são gerados.
// O mês fica marcado em generatedMonths, então apagar ou editar o lançamento não faz ele voltar.
export async function ensureRecurringForMonth(month: MonthKey): Promise<void> {
  if (month > shiftMonth(currentMonthKey(), 1)) return;

  const pending = (await listRecurring()).filter(
    (r) => r.active && r.startMonth <= month && !r.generatedMonths.includes(month)
  );
  if (pending.length === 0) return;

  const db = getDb();
  const recurring = await collection();
  const transactions = (await currentUserDoc()).collection("transactions");

  await Promise.all(
    pending.map((r) =>
      db.runTransaction(async (tx) => {
        const ref = recurring.doc(r.id);
        const fresh = await tx.get(ref);
        if ((fresh.data()?.generatedMonths as string[] | undefined)?.includes(month)) return;

        const now = new Date().toISOString();
        tx.set(transactions.doc(), {
          type: "expense",
          amount: r.amount,
          categoryId: r.categoryId,
          description: r.description,
          date: dateInMonth(month, r.dayOfMonth),
          paymentMethod: r.paymentMethod,
          note: "Gasto fixo mensal",
          recurringId: r.id,
          createdAt: now,
          updatedAt: now,
        });
        tx.update(ref, { generatedMonths: FieldValue.arrayUnion(month) });
      })
    )
  );
}

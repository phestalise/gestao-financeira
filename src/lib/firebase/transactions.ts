import { currentUserDoc } from "@/lib/firebase/admin";
import { Transaction } from "@/types";
import { budgetMonthOf, FIRST_MONTH, transactionMonth } from "@/lib/utils/date";

async function collection() {
  return (await currentUserDoc()).collection("transactions");
}

export interface TransactionFilters {
  from?: string; // ISO date
  to?: string; // ISO date
  categoryId?: string;
  type?: Transaction["type"];
}

export async function listTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
  let query: FirebaseFirestore.Query = await collection();

  if (filters.from) query = query.where("date", ">=", filters.from);
  if (filters.to) query = query.where("date", "<=", filters.to);

  const snapshot = await query.orderBy("date", "desc").get();
  // Categoria e tipo são filtrados em memória: combinados com o filtro/ordenação por data, o Firestore
  // exigiria um índice composto para cada combinação. O volume de um app pessoal cabe tranquilo aqui.
  // Meses anteriores ao início do controle não aparecem no app.
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Transaction)
    .filter(
      (t) =>
        transactionMonth(t) >= FIRST_MONTH &&
        (!filters.categoryId || t.categoryId === filters.categoryId) &&
        (!filters.type || t.type === filters.type)
    );
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  const doc = await (await collection()).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Transaction;
}

export async function createTransaction(
  data: Omit<Transaction, "id" | "createdAt" | "updatedAt">
): Promise<Transaction> {
  const now = new Date().toISOString();
  const referenceMonth = data.referenceMonth ?? budgetMonthOf(data.date);
  const docRef = await (await collection()).add({ ...data, referenceMonth, createdAt: now, updatedAt: now });
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() } as Transaction;
}

export async function updateTransaction(
  id: string,
  data: Partial<Omit<Transaction, "id" | "createdAt">>
): Promise<Transaction | null> {
  const ref = (await collection()).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return null;

  // Mudou a data: o mês do orçamento acompanha, a não ser que o lançamento esteja preso a uma fatura de cartão.
  const current = existing.data() as Transaction;
  const followsDate = !current.referenceMonth || current.referenceMonth === budgetMonthOf(current.date);
  const update = { ...data };
  if (data.date && !data.referenceMonth && followsDate) update.referenceMonth = budgetMonthOf(data.date);

  await ref.update({ ...update, updatedAt: new Date().toISOString() });
  const updated = await ref.get();
  return { id: updated.id, ...updated.data() } as Transaction;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const ref = (await collection()).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return false;
  await ref.delete();
  return true;
}

export async function getLastTransaction(): Promise<Transaction | null> {
  const snapshot = await (await collection()).orderBy("createdAt", "desc").limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Transaction;
}

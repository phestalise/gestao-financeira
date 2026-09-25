import { currentUserDoc } from "@/lib/firebase/admin";
import { Transaction } from "@/types";

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
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Transaction)
    .filter(
      (t) =>
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
  const docRef = await (await collection()).add({ ...data, createdAt: now, updatedAt: now });
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

  await ref.update({ ...data, updatedAt: new Date().toISOString() });
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

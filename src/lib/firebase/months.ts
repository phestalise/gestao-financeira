import { currentUserDoc } from "@/lib/firebase/admin";
import type { MonthKey } from "@/lib/utils/date";

// Dados que pertencem ao mês como um todo, guardados em users/{id}/months/{yyyy-MM}.
async function collection() {
  return (await currentUserDoc()).collection("months");
}

// Valor que já estava na conta no início de cada mês, indexado por yyyy-MM.
export async function listOpeningBalances(): Promise<Record<MonthKey, number>> {
  const snapshot = await (await collection()).get();
  const balances: Record<MonthKey, number> = {};
  for (const doc of snapshot.docs) {
    const value = doc.data().openingBalance;
    if (typeof value === "number") balances[doc.id] = value;
  }
  return balances;
}

export async function setOpeningBalance(month: MonthKey, openingBalance: number): Promise<void> {
  await (await collection()).doc(month).set({ openingBalance, updatedAt: new Date().toISOString() }, { merge: true });
}

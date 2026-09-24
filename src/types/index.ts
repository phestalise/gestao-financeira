export type TransactionType = "income" | "expense";

export type PaymentMethod =
  | "dinheiro"
  | "pix"
  | "debito"
  | "credito"
  | "boleto"
  | "transferencia"
  | "outro";

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
  monthlyBudget?: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  date: string; // ISO date (yyyy-MM-dd)
  paymentMethod: PaymentMethod | null;
  note?: string;
  installment?: {
    current: number;
    total: number;
    groupId: string;
  };
  recurringId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  categoryId: string;
  monthlyLimit: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  monthlyContribution?: number;
  createdAt: string;
}

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  dayOfMonth: number;
  paymentMethod: PaymentMethod | null;
  active: boolean;
}

export interface UserProfile {
  name?: string;
  income: number;
  savingsGoalPercent?: number;
  onboardingComplete: boolean;
}

export interface DashboardSummary {
  income: number;
  expenses: number;
  balance: number;
  savings: number;
  budgetUsedPercent: number;
  status: "ok" | "warning" | "over";
}

export interface AIParsedTransaction {
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  date: string;
  paymentMethod: PaymentMethod | null;
  confidence: "high" | "low";
}

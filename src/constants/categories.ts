import { Category } from "@/types";

export const EXPENSE_CATEGORIES: Category[] = [
  { id: "alimentacao", name: "Alimentação", icon: "utensils", type: "expense" },
  { id: "mercado", name: "Mercado", icon: "shopping-cart", type: "expense" },
  { id: "combustivel", name: "Combustível", icon: "fuel", type: "expense" },
  { id: "transporte_publico", name: "Transporte público", icon: "bus", type: "expense" },
  { id: "uber", name: "Uber / Transporte", icon: "car", type: "expense" },
  { id: "moradia", name: "Moradia", icon: "home", type: "expense" },
  { id: "energia", name: "Energia", icon: "zap", type: "expense" },
  { id: "agua", name: "Água", icon: "droplet", type: "expense" },
  { id: "internet", name: "Internet", icon: "wifi", type: "expense" },
  { id: "telefone", name: "Telefone", icon: "phone", type: "expense" },
  { id: "saude", name: "Saúde", icon: "heart-pulse", type: "expense" },
  { id: "educacao", name: "Educação", icon: "graduation-cap", type: "expense" },
  { id: "lazer", name: "Lazer", icon: "gamepad-2", type: "expense" },
  { id: "compras", name: "Compras", icon: "shopping-bag", type: "expense" },
  { id: "assinaturas", name: "Assinaturas", icon: "repeat", type: "expense" },
  { id: "carro", name: "Carro", icon: "wrench", type: "expense" },
  { id: "casamento", name: "Casamento", icon: "gem", type: "expense" },
  { id: "pets", name: "Pets", icon: "paw-print", type: "expense" },
  { id: "impostos", name: "Impostos", icon: "landmark", type: "expense" },
  { id: "outros_gasto", name: "Outros", icon: "more-horizontal", type: "expense" },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: "salario", name: "Salário", icon: "wallet", type: "income" },
  { id: "renda_extra", name: "Renda extra", icon: "plus-circle", type: "income" },
  { id: "freelance", name: "Freelance", icon: "laptop", type: "income" },
  { id: "investimentos", name: "Investimentos", icon: "trending-up", type: "income" },
  { id: "reembolso", name: "Reembolso", icon: "undo-2", type: "income" },
  { id: "outros_entrada", name: "Outros", icon: "more-horizontal", type: "income" },
];

export const ALL_CATEGORIES: Category[] = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export function getCategoryById(id: string): Category | undefined {
  return ALL_CATEGORIES.find((c) => c.id === id);
}

export const PAYMENT_METHODS = [
  { id: "dinheiro", label: "Dinheiro" },
  { id: "pix", label: "Pix" },
  { id: "debito", label: "Débito" },
  { id: "credito", label: "Crédito" },
  { id: "boleto", label: "Boleto" },
  { id: "transferencia", label: "Transferência" },
  { id: "outro", label: "Outro" },
] as const;

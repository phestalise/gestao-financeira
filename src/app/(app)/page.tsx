import Link from "next/link";
import { listTransactions } from "@/lib/firebase/transactions";
import { getProfile } from "@/lib/firebase/profile";
import { buildSummary, buildCategoryBreakdown, biggestExpense } from "@/lib/services/dashboard";
import { currentMonthRange, currentMonthLabel, formatDateLabel } from "@/lib/utils/date";
import { formatCurrency } from "@/lib/utils/currency";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { getCategoryById } from "@/constants/categories";

export const dynamic = "force-dynamic";

const STATUS_LABEL = {
  ok: { emoji: "🟢", text: "Dentro do planejado", tone: "positive" as const },
  warning: { emoji: "🟡", text: "Atenção ao orçamento", tone: "warning" as const },
  over: { emoji: "🔴", text: "Acima do orçamento", tone: "negative" as const },
};

export default async function DashboardPage() {
  const { from, to } = currentMonthRange();
  const [transactions, profile] = await Promise.all([
    listTransactions({ from, to }),
    getProfile(),
  ]);

  const summary = buildSummary(transactions, profile);
  const breakdown = buildCategoryBreakdown(transactions).slice(0, 5);
  const biggest = biggestExpense(transactions);
  const recent = transactions.slice(0, 5);
  const status = STATUS_LABEL[summary.status];

  const greetingName = profile.name ? `, ${profile.name}` : "";

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-8 sm:pt-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Olá{greetingName} 👋</h1>
        <p className="text-[var(--muted)]">Veja como estão suas finanças hoje.</p>
      </header>

      <Card className="mb-4 p-6">
        <p className="text-sm text-[var(--muted)]">Saldo disponível</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">{formatCurrency(summary.balance)}</p>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span>{status.emoji}</span>
          <span className="text-[var(--muted)]">{status.text}</span>
        </div>
        <ProgressBar percent={summary.budgetUsedPercent} tone={status.tone} className="mt-3" />
        <p className="mt-1.5 text-xs text-[var(--muted)]">
          {summary.budgetUsedPercent}% da renda utilizada este mês
        </p>
      </Card>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-[var(--muted)]">Entradas</p>
          <p className="mt-1 text-lg font-semibold text-[var(--positive)]">
            {formatCurrency(summary.income)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--muted)]">Gastos</p>
          <p className="mt-1 text-lg font-semibold text-[var(--negative)]">
            {formatCurrency(summary.expenses)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--muted)]">Economia</p>
          <p className="mt-1 text-lg font-semibold">{formatCurrency(summary.savings)}</p>
        </Card>
      </div>

      <Card className="mb-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Resumo de {currentMonthLabel()}</h2>
          <span className="text-xs text-[var(--muted)]">{transactions.length} lançamentos</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-[var(--muted)]">Maior categoria</p>
            <p className="font-medium">{breakdown[0]?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-[var(--muted)]">Maior gasto</p>
            <p className="font-medium">{biggest ? formatCurrency(biggest.amount) : "—"}</p>
          </div>
          <div>
            <p className="text-[var(--muted)]">Renda cadastrada</p>
            <p className="font-medium">{formatCurrency(profile.income)}</p>
          </div>
          <div>
            <p className="text-[var(--muted)]">Meta de economia</p>
            <p className="font-medium">{profile.savingsGoalPercent ?? 0}%</p>
          </div>
        </div>
      </Card>

      <Card className="mb-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Gastos por categoria</h2>
        </div>
        {breakdown.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhum gasto registrado ainda este mês.</p>
        ) : (
          <div className="space-y-3">
            {breakdown.map((item) => (
              <Link
                key={item.categoryId}
                href={`/transacoes?categoria=${item.categoryId}`}
                className="block"
              >
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <CategoryIcon icon={item.icon} className="h-4 w-4 text-[var(--muted)]" />
                    {item.name}
                  </span>
                  <span className="font-medium">{formatCurrency(item.total)}</span>
                </div>
                <ProgressBar percent={item.percentOfExpenses} />
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card className="mb-8 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Últimos lançamentos</h2>
          <Link href="/transacoes" className="text-sm text-[var(--primary)]">
            Ver tudo
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Nenhuma movimentação ainda. Toque em &ldquo;+&rdquo; ou fale com a IA para começar.
          </p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {recent.map((t) => {
              const category = getCategoryById(t.categoryId);
              return (
                <div key={t.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-muted)]">
                      <CategoryIcon icon={category?.icon ?? "circle"} className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.description}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {category?.name} • {formatDateLabel(t.date)}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`text-sm font-medium ${
                      t.type === "income" ? "text-[var(--positive)]" : "text-[var(--foreground)]"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

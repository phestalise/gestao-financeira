import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, PiggyBank, PieChart, Receipt } from "lucide-react";
import { listTransactions } from "@/lib/firebase/transactions";
import { getProfile } from "@/lib/firebase/profile";
import { buildSummary, buildCategoryBreakdown, biggestExpense } from "@/lib/services/dashboard";
import { currentMonthRange, currentMonthLabel, formatDateLabel } from "@/lib/utils/date";
import { formatCurrency } from "@/lib/utils/currency";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { EmptyState } from "@/components/ui/EmptyState";
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

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-[max(env(safe-area-inset-top),1.25rem)] sm:px-8 sm:pt-8">
      <div className="lg:grid lg:grid-cols-5 lg:items-start lg:gap-6">
        <div className="lg:col-span-3">
          <Card
            bordered={false}
            className="mb-5 overflow-hidden p-6 text-white"
            style={{ background: "var(--hero-gradient)" }}
          >
            <p className="text-sm text-white/70">Saldo disponível</p>
            <p className="mt-1 text-[2.5rem] font-semibold leading-none tracking-tight tabular-nums">
              {formatCurrency(summary.balance)}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span>{status.emoji}</span>
              <span className="text-white/80">{status.text}</span>
            </div>
            <ProgressBar percent={summary.budgetUsedPercent} className="mt-3" tone="onGradient" />
            <p className="mt-1.5 text-xs text-white/60">
              {summary.budgetUsedPercent}% da renda utilizada este mês
            </p>
          </Card>

          <div className="mb-5 grid grid-cols-3 gap-3">
            <Card className="p-4">
              <ArrowDownLeft className="h-4 w-4 text-[var(--positive)]" />
              <p className="mt-2 text-xs text-[var(--muted)]">Entradas</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">
                {formatCurrency(summary.income)}
              </p>
            </Card>
            <Card className="p-4">
              <ArrowUpRight className="h-4 w-4 text-[var(--negative)]" />
              <p className="mt-2 text-xs text-[var(--muted)]">Gastos</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">
                {formatCurrency(summary.expenses)}
              </p>
            </Card>
            <Card className="p-4">
              <PiggyBank className="h-4 w-4 text-[var(--primary-strong)]" />
              <p className="mt-2 text-xs text-[var(--muted)]">Economia</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{formatCurrency(summary.savings)}</p>
            </Card>
          </div>

          <Card className="mb-5 p-5 lg:mb-0">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[0.95rem] font-semibold tracking-tight">
                Resumo de {currentMonthLabel()}
              </h2>
              <span className="text-xs text-[var(--muted)]">{transactions.length} lançamentos</span>
            </div>
            <div className="grid grid-cols-2 gap-5 text-sm sm:grid-cols-4 lg:grid-cols-2">
              <div>
                <p className="text-xs text-[var(--muted)]">Maior categoria</p>
                <p className="mt-1 font-medium">{breakdown[0]?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Maior gasto</p>
                <p className="mt-1 font-medium tabular-nums">
                  {biggest ? formatCurrency(biggest.amount) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Renda cadastrada</p>
                <p className="mt-1 font-medium tabular-nums">{formatCurrency(profile.income)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Meta de economia</p>
                <p className="mt-1 font-medium">{profile.savingsGoalPercent ?? 0}%</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="mb-5 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[0.95rem] font-semibold tracking-tight">Gastos por categoria</h2>
            </div>
            {breakdown.length === 0 ? (
              <EmptyState
                icon={PieChart}
                title="Nenhum gasto este mês"
                description="Assim que você registrar um gasto, ele aparece aqui distribuído por categoria."
              />
            ) : (
              <div className="space-y-4">
                {breakdown.map((item) => (
                  <Link
                    key={item.categoryId}
                    href={`/transacoes?categoria=${item.categoryId}`}
                    className="block"
                  >
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2.5">
                        <CategoryBadge categoryId={item.categoryId} icon={item.icon} size="sm" />
                        {item.name}
                      </span>
                      <span className="font-medium tabular-nums">{formatCurrency(item.total)}</span>
                    </div>
                    <ProgressBar percent={item.percentOfExpenses} />
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[0.95rem] font-semibold tracking-tight">Últimos lançamentos</h2>
              <Link href="/transacoes" className="text-sm font-medium text-[var(--primary-strong)]">
                Ver tudo
              </Link>
            </div>
            {recent.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="Nenhuma movimentação ainda"
                description='Toque em "+" ou fale com a IA para registrar seu primeiro gasto ou entrada.'
              />
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {recent.map((t) => {
                  const category = getCategoryById(t.categoryId);
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <CategoryBadge
                          categoryId={t.categoryId}
                          icon={category?.icon ?? "more-horizontal"}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{t.description}</p>
                          <p className="truncate text-xs text-[var(--muted)]">
                            {category?.name} • {formatDateLabel(t.date)}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`shrink-0 text-sm font-medium tabular-nums ${
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
      </div>
    </div>
  );
}

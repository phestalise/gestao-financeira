import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  PieChart,
  Receipt,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { listTransactions } from "@/lib/firebase/transactions";
import { getProfile } from "@/lib/firebase/profile";
import { ensureRecurringForMonth } from "@/lib/firebase/recurring";
import { listOpeningBalances } from "@/lib/firebase/months";
import { OpeningBalanceEditor } from "@/components/dashboard/OpeningBalanceEditor";
import {
  buildSummary,
  buildCategoryBreakdown,
  biggestExpense,
  buildMonthlyHistory,
} from "@/lib/services/dashboard";
import {
  currentMonthKey,
  formatDateLabel,
  isMonthKey,
  monthLabel,
  shiftMonth,
  shortMonthLabel,
  transactionMonth,
} from "@/lib/utils/date";
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

const HISTORY_MONTHS = 6;

interface Props {
  searchParams: Promise<{ mes?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const { mes } = await searchParams;
  const thisMonth = currentMonthKey();
  // O próximo mês fica liberado para planejamento.
  const lastMonth = shiftMonth(thisMonth, 1);

  await ensureRecurringForMonth(thisMonth);
  await ensureRecurringForMonth(lastMonth);
  if (isMonthKey(mes) && mes < thisMonth) await ensureRecurringForMonth(mes);

  const [allTransactions, profile, openingBalances] = await Promise.all([
    listTransactions(),
    getProfile(),
    listOpeningBalances(),
  ]);
  const monthsWithData = new Set([...allTransactions.map(transactionMonth), ...Object.keys(openingBalances)]);

  // Sem mês na URL, abre o mês atual; se ele estiver vazio e o próximo já tiver planejamento, abre o próximo.
  const defaultMonth = !monthsWithData.has(thisMonth) && monthsWithData.has(lastMonth) ? lastMonth : thisMonth;
  const month = isMonthKey(mes) && mes <= lastMonth ? mes : defaultMonth;
  const isPlanning = month > thisMonth;
  const transactions = allTransactions.filter((t) => transactionMonth(t) === month);

  // O histórico lista só meses com algum lançamento ou valor na conta.
  const historyMonths = Array.from({ length: HISTORY_MONTHS + 1 }, (_, i) => shiftMonth(lastMonth, -i)).filter(
    (m) => monthsWithData.has(m)
  );
  const history = buildMonthlyHistory(allTransactions, profile, historyMonths, openingBalances);
  const previousMonth = shiftMonth(month, -1);
  const nextMonth = month < lastMonth ? shiftMonth(month, 1) : null;

  const summary = buildSummary(transactions, profile, openingBalances[month] ?? 0);
  const breakdown = buildCategoryBreakdown(transactions).slice(0, 5);
  const biggest = biggestExpense(transactions);
  const recent = transactions.slice(0, 5);
  const status = STATUS_LABEL[summary.status];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-[max(env(safe-area-inset-top),1.25rem)] sm:px-8 sm:pt-8">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/painel?mes=${previousMonth}`}
          aria-label="Mês anterior"
          className="rounded-full p-2 hover:bg-[var(--surface-2)]"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="text-center">
          <h1 className="text-xl font-semibold capitalize tracking-tight">{monthLabel(month)}</h1>
          {isPlanning && <p className="text-xs text-[var(--muted)]">Planejamento</p>}
        </div>
        {nextMonth ? (
          <Link
            href={`/painel?mes=${nextMonth}`}
            aria-label="Próximo mês"
            className="rounded-full p-2 hover:bg-[var(--surface-2)]"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        ) : (
          <span className="p-2 opacity-30">
            <ChevronRight className="h-5 w-5" />
          </span>
        )}
      </div>

      <div className="lg:grid lg:grid-cols-5 lg:items-start lg:gap-6">
        <div className="lg:col-span-3">
          <Card
            bordered={false}
            className="app-hero mb-5 overflow-hidden p-6 text-white"
          >
            <p className="text-sm text-white/70">Resultado do mês</p>
            <p className="mt-1 text-[2.5rem] font-semibold leading-none tracking-tight tabular-nums">
              {formatCurrency(summary.balance)}
            </p>
            <p className="mt-2 text-xs text-white/60">
              {formatCurrency(summary.income)} de renda + {formatCurrency(summary.openingBalance)} na conta −{" "}
              {formatCurrency(summary.expenses)} de despesas
            </p>
            <OpeningBalanceEditor month={month} value={summary.openingBalance} />
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span>{status.emoji}</span>
              <span className="text-white/80">{status.text}</span>
            </div>
            <ProgressBar percent={summary.budgetUsedPercent} className="mt-3" tone="onGradient" />
            <p className="mt-1.5 text-xs text-white/60">
              {summary.budgetUsedPercent}% da renda utilizada no mês
            </p>
          </Card>

          <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
            <Card className="min-w-0 p-3 sm:p-4">
              <ArrowDownLeft className="h-4 w-4 text-[var(--positive)]" />
              <p className="mt-2 text-xs text-[var(--muted)]">
                {summary.incomeFromProfile ? "Renda (cadastrada)" : "Entradas"}
              </p>
              <p className="mt-0.5 text-[0.95rem] font-semibold tracking-tight tabular-nums sm:text-lg">
                {formatCurrency(summary.income)}
              </p>
            </Card>
            <Card className="min-w-0 p-3 sm:p-4">
              <ArrowUpRight className="h-4 w-4 text-[var(--negative)]" />
              <p className="mt-2 text-xs text-[var(--muted)]">Gastos</p>
              <p className="mt-0.5 text-[0.95rem] font-semibold tracking-tight tabular-nums sm:text-lg">
                {formatCurrency(summary.expenses)}
              </p>
            </Card>
            <Card className="min-w-0 p-3 sm:p-4">
              <PiggyBank className="h-4 w-4 text-[var(--primary-strong)]" />
              <p className="mt-2 text-xs text-[var(--muted)]">Economia</p>
              <p className="mt-0.5 text-[0.95rem] font-semibold tracking-tight tabular-nums sm:text-lg">{formatCurrency(summary.savings)}</p>
            </Card>
          </div>

          <Card className="mb-5 p-5 lg:mb-0">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[0.95rem] font-semibold tracking-tight">
                Resumo do mês
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

          <Card className="mb-5 p-5 lg:mb-0 lg:mt-5">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[var(--muted)]" />
              <h2 className="text-[0.95rem] font-semibold tracking-tight">Histórico mensal</h2>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {history.length === 0 && (
                <p className="py-2.5 text-sm text-[var(--muted)]">Nenhum mês com lançamentos ainda.</p>
              )}
              {history.map((h) => (
                <Link
                  key={h.month}
                  href={`/painel?mes=${h.month}`}
                  className={`-mx-2 grid grid-cols-4 items-center gap-2 rounded-lg px-2 py-2.5 text-sm hover:bg-[var(--surface-2)] ${
                    h.month === month ? "bg-[var(--surface-2)] font-medium" : ""
                  }`}
                >
                  <span className="capitalize">{shortMonthLabel(h.month)}</span>
                  <span className="text-right tabular-nums text-[var(--muted)]">
                    {formatCurrency(h.income + h.openingBalance)}
                  </span>
                  <span className="text-right tabular-nums">-{formatCurrency(h.expenses)}</span>
                  <span
                    className={`text-right tabular-nums ${
                      h.balance < 0 ? "text-[var(--negative)]" : "text-[var(--positive)]"
                    }`}
                  >
                    {formatCurrency(h.balance)}
                  </span>
                </Link>
              ))}
            </div>
            <p className="mt-2 grid grid-cols-4 gap-2 text-[10px] uppercase tracking-wide text-[var(--muted)]">
              <span>Mês</span>
              <span className="text-right">Renda + conta</span>
              <span className="text-right">Despesas</span>
              <span className="text-right">Resultado</span>
            </p>
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
                title="Nenhum gasto neste mês"
                description="Assim que você registrar um gasto, ele aparece aqui distribuído por categoria."
              />
            ) : (
              <div className="space-y-4">
                {breakdown.map((item) => (
                  <Link
                    key={item.categoryId}
                    href={`/transacoes?categoria=${item.categoryId}&mes=${month}`}
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
              <Link href={`/transacoes?mes=${month}`} className="text-sm font-medium text-[var(--primary-strong)]">
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

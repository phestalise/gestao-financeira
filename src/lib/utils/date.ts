import { format, parseISO, startOfMonth, endOfMonth, subDays, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function today(): string {
  return toISODate(new Date());
}

export function yesterday(): string {
  return toISODate(subDays(new Date(), 1));
}

export function currentMonthRange(): { from: string; to: string } {
  const now = new Date();
  return { from: toISODate(startOfMonth(now)), to: toISODate(endOfMonth(now)) };
}

export function formatDateLabel(isoDate: string): string {
  const date = parseISO(isoDate);
  const todayStr = today();
  const yesterdayStr = yesterday();

  if (isoDate === todayStr) return "Hoje";
  if (isoDate === yesterdayStr) return "Ontem";
  return format(date, "d 'de' MMMM", { locale: ptBR });
}

export function currentMonthLabel(): string {
  return format(new Date(), "MMMM", { locale: ptBR });
}

// Meses são identificados por uma chave "yyyy-MM" (ex: "2026-09"), usada na URL e nos gastos fixos.
export type MonthKey = string;

export function isMonthKey(value: unknown): value is MonthKey {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function currentMonthKey(): MonthKey {
  return format(new Date(), "yyyy-MM");
}

export function monthKeyOf(isoDate: string): MonthKey {
  return isoDate.slice(0, 7);
}

// Mês em que um lançamento conta no orçamento: o mês da fatura, quando houver, senão o mês da data.
export function transactionMonth(t: { date: string; referenceMonth?: string }): MonthKey {
  return t.referenceMonth ?? monthKeyOf(t.date);
}

export function shiftMonth(key: MonthKey, amount: number): MonthKey {
  return format(addMonths(parseISO(`${key}-01`), amount), "yyyy-MM");
}

export function monthRange(key: MonthKey): { from: string; to: string } {
  const first = parseISO(`${key}-01`);
  return { from: toISODate(first), to: toISODate(endOfMonth(first)) };
}

export function monthLabel(key: MonthKey): string {
  return format(parseISO(`${key}-01`), "MMMM 'de' yyyy", { locale: ptBR });
}

export function shortMonthLabel(key: MonthKey): string {
  return format(parseISO(`${key}-01`), "MMM/yy", { locale: ptBR });
}

// O controle começa em outubro de 2026: meses anteriores ficam fora do app (os dados continuam no banco).
export const FIRST_MONTH: MonthKey = "2026-10";

// O salário cai no fim do mês, então o que é pago na última semana já sai do dinheiro do mês seguinte.
const LAST_WEEK_DAYS = 7;

// Mês do orçamento para um lançamento feito nessa data (sem fatura de cartão definida).
export function budgetMonthOf(isoDate: string): MonthKey {
  const [year, month, day] = isoDate.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const key = day > lastDay - LAST_WEEK_DAYS ? shiftMonth(monthKeyOf(isoDate), 1) : monthKeyOf(isoDate);
  return key < FIRST_MONTH ? FIRST_MONTH : key;
}

// O mês que está "valendo" hoje: é nele que um gasto lançado agora entra.
export function currentBudgetMonth(): MonthKey {
  return budgetMonthOf(today());
}

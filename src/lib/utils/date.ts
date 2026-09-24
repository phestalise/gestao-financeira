import { format, parseISO, startOfMonth, endOfMonth, subDays } from "date-fns";
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

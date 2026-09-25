"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { brl, useTweenedNumber } from "./motion";

interface Entry {
  emoji: string;
  label: string;
  amount: number;
  tag?: string;
}

interface Chapter {
  day: number;
  kicker: string;
  title: string;
  body: string;
  balance: number;
  mood: { text: string; color: string };
  entries: Entry[];
  insight?: string;
}

const CHAPTERS: Chapter[] = [
  {
    day: 1,
    kicker: "Capítulo 1",
    title: "O salário cai.",
    body: "Todo mês começa igual: dinheiro entrando e a sensação de que dessa vez vai sobrar. O app soma o salário ao que já estava na conta e te mostra o mês inteiro de uma vez.",
    balance: 5540,
    mood: { text: "Tudo em paz", color: "var(--lp-green)" },
    entries: [
      { emoji: "💰", label: "Salário", amount: 5200 },
      { emoji: "🏦", label: "Já estava na conta", amount: 340 },
    ],
  },
  {
    day: 5,
    kicker: "Capítulo 2",
    title: "Os fixos chegam sozinhos.",
    body: "Aluguel, internet, academia. Você cadastra uma vez e eles aparecem todo mês, no dia certo, sem precisar lembrar de nada.",
    balance: 3731,
    mood: { text: "Previsível", color: "var(--lp-sky)" },
    entries: [
      { emoji: "🏠", label: "Aluguel", amount: -1600, tag: "fixo" },
      { emoji: "📶", label: "Internet", amount: -110, tag: "fixo" },
      { emoji: "🏋️", label: "Academia", amount: -99, tag: "fixo" },
    ],
  },
  {
    day: 12,
    kicker: "Capítulo 3",
    title: "A fatura, no mês certo.",
    body: "Compra no cartão não pesa no dia em que você passa, pesa quando a fatura vence. Aqui cada compra cai no mês em que você realmente paga.",
    balance: 2451,
    mood: { text: "Sob controle", color: "var(--lp-sky)" },
    entries: [{ emoji: "💳", label: "Fatura do cartão", amount: -1280, tag: "crédito" }],
  },
  {
    day: 19,
    kicker: "Capítulo 4",
    title: "O alerta que ninguém te dava.",
    body: "Aquele delivery de terça, de quinta, de sábado… Sozinho parece pouco. A IA junta os pontos e te avisa antes de virar problema.",
    balance: 2265,
    mood: { text: "Atenção", color: "var(--lp-amber)" },
    entries: [
      { emoji: "🍕", label: "iFood", amount: -52 },
      { emoji: "🍔", label: "iFood", amount: -61 },
      { emoji: "🍣", label: "iFood", amount: -73 },
    ],
    insight: "Delivery está 38% acima da sua média. Cortando 2 pedidos, você fecha a meta de 20%.",
  },
  {
    day: 30,
    kicker: "Capítulo 5",
    title: "Final feliz.",
    body: "Mês fechado, sem planilha e sem susto. Você sabe para onde foi cada real e quanto sobrou. No mês que vem, a história começa melhor.",
    balance: 1140,
    mood: { text: "Meta batida", color: "var(--lp-green)" },
    entries: [
      { emoji: "🛒", label: "Mercado do mês", amount: -890 },
      { emoji: "🚗", label: "Transporte", amount: -235 },
    ],
    insight: "Você guardou 21% da renda. Melhor mês do ano! 🎉",
  },
];

const INCOME = 5540;

export function MonthStory() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const chapter = CHAPTERS[active];
  const balance = useTweenedNumber(chapter.balance, 1100);
  const feed = CHAPTERS.slice(0, active + 1)
    .flatMap((c, ci) => c.entries.map((e, ei) => ({ ...e, key: `${ci}-${ei}` })))
    .reverse()
    .slice(0, 5);

  const monthProgress = chapter.day / 30;
  const circumference = 2 * Math.PI * 52;
  const spentPct = ((INCOME - chapter.balance) / INCOME) * 100;

  return (
    <section id="historia" className="relative mx-auto max-w-6xl px-4 py-24 sm:px-8 sm:py-32">
      <div className="mb-16 max-w-2xl" data-reveal>
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={{ color: "var(--lp-sky)" }}>
          Uma história em 30 dias
        </p>
        <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Um mês comum. <span className="lp-serif lp-gradient-text">Contado de outro jeito.</span>
        </h2>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        {/* painel fixo: acompanha o capítulo que está no meio da tela */}
        <div className="sticky top-16 z-10 self-start lg:top-28 lg:order-2">
          <div className="lp-glass rounded-[28px] p-5 max-lg:!bg-[#0a0e18] sm:p-7">
            <div className="flex items-center gap-5">
              <div className="relative h-[76px] w-[76px] shrink-0 sm:h-[120px] sm:w-[120px]">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                  <circle
                    className="lp-ring"
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke={chapter.mood.color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - monthProgress)}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase tracking-widest sm:text-xs" style={{ color: "var(--lp-faint)" }}>
                    dia
                  </span>
                  <span className="text-2xl font-semibold tabular-nums sm:text-4xl">{chapter.day}</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm" style={{ color: "var(--lp-dim)" }}>
                  Na conta agora
                </p>
                <p className="text-3xl font-semibold tracking-tight tabular-nums sm:text-5xl">{brl(balance)}</p>
                <span
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ background: "rgba(255,255,255,0.05)", color: chapter.mood.color }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: chapter.mood.color }} />
                  {chapter.mood.text}
                </span>
              </div>
            </div>

            <div className="mt-5 hidden sm:block">
              <div className="mb-1.5 flex justify-between text-xs" style={{ color: "var(--lp-faint)" }}>
                <span>Gasto do mês</span>
                <span className="tabular-nums">{Math.round(spentPct)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="lp-bar h-full rounded-full"
                  style={{
                    width: `${Math.max(2, spentPct)}%`,
                    background: `linear-gradient(90deg, #2f6fd6, ${chapter.mood.color})`,
                  }}
                />
              </div>
            </div>

            <div className="mt-5 hidden space-y-2 sm:block">
              {feed.map((e) => (
                <div
                  key={e.key}
                  className="lp-feed-item flex items-center gap-3 rounded-xl px-3 py-2"
                  style={{ background: "rgba(255,255,255,0.035)" }}
                >
                  <span className="text-lg">{e.emoji}</span>
                  <span className="flex-1 truncate text-sm">{e.label}</span>
                  {e.tag && (
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-wider"
                      style={{ background: "rgba(47,111,214,0.2)", color: "var(--lp-sky)" }}
                    >
                      {e.tag}
                    </span>
                  )}
                  <span
                    className="text-sm font-medium tabular-nums"
                    style={{ color: e.amount > 0 ? "var(--lp-green)" : "var(--lp-dim)" }}
                  >
                    {e.amount > 0 ? "+" : "−"}
                    {brl(Math.abs(e.amount))}
                  </span>
                </div>
              ))}
            </div>

            {chapter.insight && (
              <div
                key={active}
                className="lp-pop mt-4 flex gap-3 rounded-2xl p-3.5 text-sm"
                style={{ background: "rgba(47,111,214,0.14)", border: "1px solid rgba(142,210,245,0.2)" }}
              >
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--lp-sky)" }} />
                <p>{chapter.insight}</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:order-1">
          {CHAPTERS.map((c, i) => (
            <article
              key={c.day}
              ref={(el) => {
                refs.current[i] = el;
              }}
              data-index={i}
              data-active={active === i}
              className="lp-chapter relative flex min-h-[70vh] flex-col justify-center py-10"
            >
              <span
                aria-hidden
                className="lp-chapter-day pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 select-none text-[8rem] font-bold leading-none opacity-60 sm:text-[12rem]"
              >
                {String(c.day).padStart(2, "0")}
              </span>
              <div className="relative">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em]" style={{ color: "var(--lp-sky)" }}>
                  {c.kicker} · Dia {c.day}
                </p>
                <h3 className="mb-4 text-3xl font-semibold tracking-tight sm:text-5xl">{c.title}</h3>
                <p className="max-w-md text-lg leading-relaxed" style={{ color: "var(--lp-dim)" }}>
                  {c.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

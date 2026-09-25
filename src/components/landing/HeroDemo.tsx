"use client";

import { useEffect, useState } from "react";
import { Sparkles, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { brl, useTweenedNumber } from "./motion";

// Roteiro da demo: a pessoa escreve do jeito dela, a IA transforma em lançamento.
const SCRIPT = [
  { text: "gastei 38,90 no mercado", amount: -38.9, label: "Mercado", emoji: "🛒", method: "Débito" },
  { text: "recebi 450 do freela 🎉", amount: 450, label: "Renda extra", emoji: "💼", method: "Pix" },
  { text: "uber 23 ontem à noite", amount: -23, label: "Transporte", emoji: "🚗", method: "Crédito" },
  { text: "ifood 52 no sábado", amount: -52, label: "Delivery", emoji: "🍕", method: "Crédito" },
];

type Phase = "typing" | "thinking" | "done";

export function HeroDemo() {
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");
  const [balance, setBalance] = useState(2340);
  const [history, setHistory] = useState<typeof SCRIPT>([]);
  const shownBalance = useTweenedNumber(balance, 1200);

  const current = SCRIPT[step % SCRIPT.length];

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      if (typed.length < current.text.length) {
        timer = setTimeout(() => setTyped(current.text.slice(0, typed.length + 1)), 45 + Math.random() * 60);
      } else {
        timer = setTimeout(() => setPhase("thinking"), 500);
      }
    } else if (phase === "thinking") {
      timer = setTimeout(() => {
        setPhase("done");
        setBalance((b) => b + current.amount);
        setHistory((h) => [current, ...h].slice(0, 3));
      }, 900);
    } else {
      timer = setTimeout(() => {
        setTyped("");
        setPhase("typing");
        setStep((s) => s + 1);
        // fim do roteiro: volta ao saldo inicial para a demo não crescer para sempre
        if ((step + 1) % SCRIPT.length === 0) setBalance(2340);
      }, 2600);
    }
    return () => clearTimeout(timer);
  }, [phase, typed, current, step]);

  const spentPct = Math.min(100, Math.max(8, ((5200 - balance) / 5200) * 100));

  return (
    <div className="lp-halo lp-glass relative w-full max-w-[380px] rounded-[28px] p-5">
      <div className="mb-4 flex items-center justify-between text-xs" style={{ color: "var(--lp-faint)" }}>
        <span className="flex items-center gap-2">
          <span className="lp-pill-dot h-2 w-2 rounded-full" style={{ background: "var(--lp-green)" }} />
          Setembro · ao vivo
        </span>
        <span>Meu Dinheiro</span>
      </div>

      <p className="text-xs" style={{ color: "var(--lp-dim)" }}>
        Sobra prevista do mês
      </p>
      <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">{brl(shownBalance)}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="lp-bar h-full rounded-full"
          style={{ width: `${spentPct}%`, background: "linear-gradient(90deg, #2f6fd6, #8ed2f5)" }}
        />
      </div>

      <div className="mt-5 space-y-2 min-h-[148px]">
        {history.map((item, i) => (
          <div
            key={`${item.text}-${step - i}`}
            className="lp-pop flex items-center gap-3 rounded-2xl px-3 py-2.5"
            style={{ background: "rgba(255,255,255,0.04)", opacity: 1 - i * 0.28 }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl text-lg" style={{ background: "rgba(47,111,214,0.18)" }}>
              {item.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.label}</p>
              <p className="text-[11px]" style={{ color: "var(--lp-faint)" }}>
                {item.method} · categorizado pela IA
              </p>
            </div>
            <span
              className="flex items-center gap-0.5 text-sm font-semibold tabular-nums"
              style={{ color: item.amount > 0 ? "var(--lp-green)" : "var(--lp-ink)" }}
            >
              {item.amount > 0 ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5 opacity-50" />}
              {brl(Math.abs(item.amount))}
            </span>
          </div>
        ))}
      </div>

      <div
        className="mt-4 flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm"
        style={{ borderColor: "var(--lp-line)", background: "rgba(0,0,0,0.35)" }}
      >
        <Sparkles className="h-4 w-4 shrink-0" style={{ color: "var(--lp-sky)" }} />
        <span className="min-w-0 flex-1 truncate">
          {phase === "thinking" ? (
            <span style={{ color: "var(--lp-sky)" }}>Entendendo…</span>
          ) : (
            <>
              {typed}
              {phase === "typing" && <span className="lp-caret" />}
              {phase === "done" && <span style={{ color: "var(--lp-green)" }}> ✓</span>}
            </>
          )}
        </span>
      </div>
    </div>
  );
}

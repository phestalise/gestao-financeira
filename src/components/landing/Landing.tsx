"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Lock,
  Repeat,
  CreditCard,
  Smartphone,
  PieChart,
  MessageCircle,
  Heart,
  Send,
} from "lucide-react";
import { HeroDemo } from "./HeroDemo";
import { MonthStory } from "./MonthStory";
import { trackPointer, useRevealOnScroll } from "./motion";
import "./landing.css";

const TICKER = [
  ["☕", "Café da manhã", "−R$ 12,50"],
  ["💰", "Salário", "+R$ 5.200,00"],
  ["🛒", "Mercado", "−R$ 238,40"],
  ["🚗", "Uber", "−R$ 23,00"],
  ["💼", "Freela", "+R$ 450,00"],
  ["🎬", "Streaming", "−R$ 39,90"],
  ["💊", "Farmácia", "−R$ 64,20"],
  ["🍕", "iFood", "−R$ 52,00"],
  ["🏋️", "Academia", "−R$ 99,00"],
  ["🎁", "Presente da mãe", "−R$ 120,00"],
];

const HEADLINE = ["Todo", "mês,", "seu", "dinheiro", "conta", "uma"];

const CHAT = [
  { from: "me", text: "quanto eu gastei com delivery esse mês?" },
  { from: "ai", text: "R$ 412 em 9 pedidos, 38% acima da sua média. O mais caro foi sábado: R$ 73. 🍣" },
  { from: "me", text: "dá pra eu comprar um fone de 600 e ainda guardar 20%?" },
  { from: "ai", text: "Dá, se o delivery ficar em até R$ 250 até o dia 30. Quer que eu te avise quando chegar perto?" },
];

const PEOPLE = [
  { name: "Você", emoji: "🙋", angle: 0 },
  { name: "Irmã", emoji: "👩", angle: 72 },
  { name: "Amigo", emoji: "🧑‍💻", angle: 144 },
  { name: "Mãe", emoji: "👩‍🦳", angle: 216 },
  { name: "Primo", emoji: "🧑", angle: 288 },
];

export function Landing({ loggedIn }: { loggedIn: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  useRevealOnScroll(rootRef);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const primaryHref = loggedIn ? "/painel" : "/cadastro";
  const primaryLabel = loggedIn ? "Abrir meu painel" : "Começar minha história";

  return (
    <div ref={rootRef} className="lp min-h-screen">
      <div className="lp-progress" aria-hidden />

      {/* ---------- navegação ---------- */}
      <header className="lp-nav fixed inset-x-0 top-0 z-50" data-scrolled={scrolled}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "rgba(47,111,214,0.25)" }}>
              💰
            </span>
            <span>
              Meu <span className="lp-serif text-[1.15em]" style={{ color: "var(--lp-sky)" }}>Dinheiro</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm md:flex" style={{ color: "var(--lp-dim)" }}>
            <a href="#historia" className="transition-colors hover:text-white">A história</a>
            <a href="#ia" className="transition-colors hover:text-white">IA</a>
            <a href="#juntos" className="transition-colors hover:text-white">Compartilhar</a>
            <a href="#recursos" className="transition-colors hover:text-white">Recursos</a>
          </nav>
          <div className="flex items-center gap-2">
            {!loggedIn && (
              <Link href="/login" className="rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:text-white" style={{ color: "var(--lp-dim)" }}>
                Entrar
              </Link>
            )}
            <Link href={primaryHref} className="lp-cta flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-white">
              {loggedIn ? "Meu painel" : "Criar conta"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ---------- hero ---------- */}
      <section
        className="lp-hero flex min-h-[100svh] items-center pt-24 pb-16"
        onPointerMove={(e) => trackPointer(e, "--mx", "--my")}
      >
        <div className="lp-grid" aria-hidden />
        <div className="lp-orb" style={{ width: 520, height: 520, left: "-10%", top: "5%", background: "#0f52ba" }} aria-hidden />
        <div className="lp-orb" style={{ width: 420, height: 420, right: "-8%", top: "30%", background: "#1d7a8c", animationDelay: "-6s" }} aria-hidden />
        <div className="lp-orb" style={{ width: 300, height: 300, left: "40%", bottom: "-10%", background: "#2b3fa8", animationDelay: "-12s" }} aria-hidden />

        <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 sm:px-8 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <span className="lp-pill mb-7 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium sm:text-sm" style={{ color: "var(--lp-sky)" }}>
              <span className="lp-pill-dot h-2 w-2 rounded-full" style={{ background: "var(--lp-green)" }} />
              Finanças pessoais com IA · grátis
            </span>

            <h1 className="text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-7xl lg:text-[5.2rem]">
              {HEADLINE.map((word, i) => (
                <span key={i} className="lp-word mr-[0.22em]" style={{ animationDelay: `${120 + i * 90}ms` }}>
                  {word}
                </span>
              ))}
              <span className="lp-word lp-serif lp-gradient-text pr-2" style={{ animationDelay: `${120 + HEADLINE.length * 90}ms` }}>
                história.
              </span>
            </h1>

            <p
              className="lp-word mt-7 max-w-xl text-lg leading-relaxed sm:text-xl"
              style={{ color: "var(--lp-dim)", animationDelay: "900ms" }}
            >
              Você escreve do seu jeito, <em className="not-italic text-white">“gastei 40 no mercado”</em>, e a IA organiza,
              categoriza e te conta o que está acontecendo com o seu mês. Sem planilha. Sem culpa.
            </p>

            <div className="lp-word mt-10 flex flex-wrap items-center gap-3" style={{ animationDelay: "1050ms" }}>
              <Link href={primaryHref} className="lp-cta flex items-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold text-white">
                {primaryLabel}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a href="#historia" className="lp-ghost rounded-2xl px-6 py-4 text-base font-medium">
                Ver como funciona
              </a>
            </div>
            <p className="lp-word mt-5 text-sm" style={{ color: "var(--lp-faint)", animationDelay: "1150ms" }}>
              Sem cartão de crédito · Seus dados só seus · Funciona no celular como app
            </p>
          </div>

          <div className="lp-word flex justify-center lg:justify-end" style={{ animationDelay: "600ms" }}>
            <HeroDemo />
          </div>
        </div>
      </section>

      {/* ---------- faixa de lançamentos ---------- */}
      <div className="lp-marquee border-y py-5" style={{ borderColor: "var(--lp-line)" }} aria-hidden>
        <div className="lp-marquee-track gap-3">
          {[...TICKER, ...TICKER].map(([emoji, label, value], i) => (
            <span
              key={i}
              className="mx-1.5 flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm"
              style={{ borderColor: "var(--lp-line)", background: "rgba(255,255,255,0.02)" }}
            >
              <span>{emoji}</span>
              <span style={{ color: "var(--lp-dim)" }}>{label}</span>
              <span className="font-medium tabular-nums" style={{ color: value.startsWith("+") ? "var(--lp-green)" : "var(--lp-ink)" }}>
                {value}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ---------- frase de impacto ---------- */}
      <section className="mx-auto max-w-5xl px-4 py-28 text-center sm:px-8 sm:py-40">
        <p className="text-3xl font-medium leading-snug tracking-tight sm:text-5xl" data-reveal>
          A maioria das pessoas só descobre para onde foi o dinheiro{" "}
          <span className="lp-serif" style={{ color: "var(--lp-red)" }}>quando ele já foi.</span>
        </p>
        <p className="mt-8 text-lg sm:text-xl" style={{ color: "var(--lp-dim)", ["--delay" as string]: "150ms" }} data-reveal>
          A gente acha que dá para ser diferente. Role a página e veja um mês inteiro acontecer.
        </p>
      </section>

      <MonthStory />

      {/* ---------- IA ---------- */}
      <section id="ia" className="relative mx-auto max-w-6xl px-4 py-24 sm:px-8 sm:py-32">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div data-reveal>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={{ color: "var(--lp-sky)" }}>
              Assistente com IA
            </p>
            <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Pergunte como você <span className="lp-serif lp-gradient-text">perguntaria a um amigo.</span>
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed" style={{ color: "var(--lp-dim)" }}>
              Ele conhece seus números de verdade: renda, gastos fixos, faturas e metas. Responde em segundos, em português
              de gente, e sem julgamento.
            </p>
          </div>

          <div className="lp-glass space-y-3 rounded-[28px] p-5 sm:p-6">
            {CHAT.map((m, i) => (
              <div
                key={i}
                data-reveal
                style={{ ["--delay" as string]: `${i * 220}ms` }}
                className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:text-[15px] ${m.from === "me" ? "rounded-br-md" : "rounded-bl-md"}`}
                  style={
                    m.from === "me"
                      ? { background: "linear-gradient(135deg,#2f6fd6,#0f52ba)" }
                      : { background: "rgba(255,255,255,0.05)", border: "1px solid var(--lp-line)" }
                  }
                >
                  {m.from === "ai" && (
                    <span className="mb-1 flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--lp-sky)" }}>
                      <Sparkles className="h-3.5 w-3.5" /> Assistente
                    </span>
                  )}
                  {m.text}
                </div>
              </div>
            ))}
            <div className="mt-2 flex items-center gap-2 rounded-2xl border px-4 py-3" style={{ borderColor: "var(--lp-line)" }}>
              <span className="flex-1 text-sm" style={{ color: "var(--lp-faint)" }}>
                Pergunte qualquer coisa sobre seu dinheiro…
              </span>
              <Send className="h-4 w-4" style={{ color: "var(--lp-sky)" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- compartilhar ---------- */}
      <section id="juntos" className="relative overflow-hidden py-24 sm:py-32">
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-4 sm:px-8 lg:grid-cols-2">
          <div className="order-2 flex justify-center lg:order-1" data-reveal>
            <div className="relative h-[300px] w-[300px] [--r:130px] sm:h-[420px] sm:w-[420px] sm:[--r:190px]">
              <div className="lp-orbit-ring absolute inset-0 rounded-full" />
              <div className="lp-orbit-ring absolute inset-[18%] rounded-full" />
              <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2">
                <span className="lp-pulse-ring absolute inset-0 rounded-full" style={{ background: "rgba(47,111,214,0.35)" }} />
                <span className="lp-pulse-ring absolute inset-0 rounded-full" style={{ background: "rgba(47,111,214,0.25)", animationDelay: "1.5s" }} />
                <span className="lp-cta relative flex h-full w-full items-center justify-center rounded-full text-4xl">💰</span>
              </div>
              <div className="lp-orbit absolute inset-0">
                {PEOPLE.map((p) => (
                  <div
                    key={p.name}
                    className="absolute left-1/2 top-1/2"
                    style={{ transform: `rotate(${p.angle}deg) translateY(calc(-1 * var(--r))) rotate(-${p.angle}deg)` }}
                  >
                    <div className="lp-orbit-counter -translate-x-1/2 -translate-y-1/2">
                      <div className="lp-glass flex flex-col items-center gap-1 rounded-2xl px-3 py-2.5">
                        <span className="text-2xl">{p.emoji}</span>
                        <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "var(--lp-dim)" }}>
                          <Lock className="h-2.5 w-2.5" /> {p.name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2" data-reveal>
            <p className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em]" style={{ color: "var(--lp-sky)" }}>
              <Heart className="h-4 w-4" /> Para quem você gosta
            </p>
            <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Finanças são pessoais. <span className="lp-serif lp-gradient-text">O app não precisa ser.</span>
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed" style={{ color: "var(--lp-dim)" }}>
              Mande o convite para sua irmã, seus amigos, sua mãe. Cada pessoa cria a própria conta e tem um espaço só dela:
              ninguém vê os números de ninguém.
            </p>
            <ol className="mt-8 space-y-4">
              {[
                ["1", "Crie sua conta", "Leva menos de um minuto."],
                ["2", "Toque em “Convidar”", "Manda o link pelo WhatsApp ou onde quiser."],
                ["3", "Cada um no seu ritmo", "Todo mundo com seu painel, sua IA e seus dados protegidos."],
              ].map(([n, title, text], i) => (
                <li key={n} className="flex gap-4" data-reveal style={{ ["--delay" as string]: `${i * 120}ms` }}>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                    style={{ background: "rgba(47,111,214,0.2)", color: "var(--lp-sky)" }}
                  >
                    {n}
                  </span>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm" style={{ color: "var(--lp-dim)" }}>{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- recursos (bento) ---------- */}
      <section id="recursos" className="mx-auto max-w-6xl px-4 py-24 sm:px-8 sm:py-32">
        <div className="mb-14 max-w-2xl" data-reveal>
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={{ color: "var(--lp-sky)" }}>
            Nos bastidores
          </p>
          <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Pequenos detalhes que <span className="lp-serif lp-gradient-text">mudam o mês.</span>
          </h2>
        </div>

        <div className="grid auto-rows-[minmax(200px,auto)] gap-4 md:grid-cols-3">
          <Tile className="md:col-span-2" icon={MessageCircle} title="Lançar é conversar" delay={0}>
            <p>Digite ou fale “paguei 120 de luz” e pronto. A IA entende valor, data, categoria e forma de pagamento.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["“uber 23 ontem”", "“recebi 450 de freela”", "“parcelei a tv em 10x”"].map((t) => (
                <span key={t} className="rounded-full border px-3 py-1.5 text-xs" style={{ borderColor: "var(--lp-line)", color: "var(--lp-sky)" }}>
                  {t}
                </span>
              ))}
            </div>
          </Tile>
          <Tile icon={PieChart} title="Para onde vai cada real" delay={100}>
            <p>Categorias, histórico mês a mês e o seu maior gasto, sempre à vista.</p>
            <div className="lp-bars mt-5 flex h-16 items-end gap-1.5">
              {[40, 70, 55, 90, 35, 65, 80].map((h, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-t-md"
                  style={{ height: `${h}%`, background: "linear-gradient(180deg,#8ed2f5,#2f6fd6)", animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </Tile>
          <Tile icon={Repeat} title="Gastos fixos no automático" delay={0}>
            <p>Cadastre aluguel, internet e assinaturas uma vez. Eles aparecem todo mês sozinhos.</p>
          </Tile>
          <Tile icon={CreditCard} title="Cartão no mês da fatura" delay={100}>
            <p>Compra no crédito pesa no mês em que você paga, do jeito que o seu bolso sente.</p>
          </Tile>
          <Tile icon={Smartphone} title="Um app no seu celular" delay={200}>
            <p>Adicione à tela inicial e use como app, com tema claro ou escuro.</p>
          </Tile>
        </div>
      </section>

      {/* ---------- final ---------- */}
      <section className="relative overflow-hidden px-4 py-28 text-center sm:py-40">
        <div className="lp-orb" style={{ width: 600, height: 600, left: "50%", top: "50%", marginLeft: -300, marginTop: -300, background: "#0f52ba", opacity: 0.5 }} aria-hidden />
        <div className="relative mx-auto max-w-4xl" data-reveal>
          <h2 className="text-5xl font-semibold leading-[1] tracking-[-0.04em] sm:text-8xl">
            O próximo capítulo <br />
            <span className="lp-serif lp-gradient-text">é seu.</span>
          </h2>
          <p className="mx-auto mt-8 max-w-lg text-lg" style={{ color: "var(--lp-dim)" }}>
            Comece hoje, de graça. Em 30 dias você vai conhecer o seu dinheiro melhor do que nunca.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href={primaryHref} className="lp-cta flex items-center gap-2 rounded-2xl px-7 py-4 text-base font-semibold text-white">
              {primaryLabel}
              <ArrowRight className="h-5 w-5" />
            </Link>
            {!loggedIn && (
              <Link href="/login" className="lp-ghost rounded-2xl px-7 py-4 text-base font-medium">
                Já tenho conta
              </Link>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t px-4 py-10 text-sm sm:px-8" style={{ borderColor: "var(--lp-line)", color: "var(--lp-faint)" }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span>
            💰 Meu <span className="lp-serif">Dinheiro</span> · feito para a vida real
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" /> Seus dados ficam só na sua conta
          </span>
        </div>
      </footer>
    </div>
  );
}

function Tile({
  icon: Icon,
  title,
  children,
  className = "",
  delay,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  children: React.ReactNode;
  className?: string;
  delay: number;
}) {
  return (
    <div
      data-reveal
      onPointerMove={(e) => trackPointer(e)}
      className={`lp-tile lp-glass rounded-[24px] p-6 sm:p-7 ${className}`}
      style={{ ["--delay" as string]: `${delay}ms` }}
    >
      <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "rgba(47,111,214,0.18)" }}>
        <Icon className="h-5 w-5" style={{ color: "var(--lp-sky)" }} />
      </span>
      <h3 className="mb-2 text-xl font-semibold tracking-tight">{title}</h3>
      <div className="leading-relaxed" style={{ color: "var(--lp-dim)" }}>
        {children}
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import "@/components/landing/landing.css";

// Frases que se revezam no painel lateral, continuando a narrativa da home.
const STORY = [
  "Dia 1: o salário caiu. Dessa vez, você sabe para onde ele vai.",
  "Dia 19: a IA avisou do delivery antes de virar problema.",
  "Dia 30: sobrou. E você sabe exatamente por quê.",
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`lp grid min-h-screen lg:grid-cols-[1.1fr_1fr]`}>
      <aside className="lp-hero relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <div className="lp-grid" aria-hidden />
        <div className="lp-orb" style={{ width: 460, height: 460, left: "-15%", top: "10%", background: "#0f52ba" }} aria-hidden />
        <div className="lp-orb" style={{ width: 360, height: 360, right: "-10%", bottom: "5%", background: "#1d7a8c", animationDelay: "-8s" }} aria-hidden />

        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "rgba(47,111,214,0.25)" }}>
            💰
          </span>
          Meu <span className="lp-serif -ml-1 text-[1.15em]" style={{ color: "var(--lp-sky)" }}>Dinheiro</span>
        </Link>

        <div>
          <p className="mb-6 text-sm font-medium uppercase tracking-[0.2em]" style={{ color: "var(--lp-sky)" }}>
            Sua história começa aqui
          </p>
          <div className="lp-auth-story relative h-40 max-w-lg text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            {STORY.map((line, i) => (
              <span key={i} className="absolute inset-0" style={{ animationDelay: `${i * 4}s` }}>
                {line}
              </span>
            ))}
          </div>
        </div>

        <p className="flex items-center gap-2 text-sm" style={{ color: "var(--lp-faint)" }}>
          <Lock className="h-4 w-4" /> Cada conta tem um espaço privado. Ninguém vê os números de ninguém.
        </p>
      </aside>

      <main className="relative flex flex-col px-5 py-8 sm:px-10">
        <Link
          href="/"
          className="flex w-fit items-center gap-1.5 text-sm transition-colors hover:text-white"
          style={{ color: "var(--lp-dim)" }}
        >
          <ArrowLeft className="h-4 w-4" /> Início
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="lp-word w-full max-w-sm" style={{ animationDelay: "80ms" }}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export function AuthField({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium" style={{ color: "var(--lp-dim)" }}>
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-xl border px-4 py-3 text-base text-white outline-none transition-all focus:border-[#8ed2f5]/60 focus:ring-4 focus:ring-[#2f6fd6]/25"
        style={{ background: "rgba(255,255,255,0.04)", borderColor: "var(--lp-line)" }}
      />
    </label>
  );
}

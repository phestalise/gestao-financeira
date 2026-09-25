"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageCircle, List, Settings, Plus } from "lucide-react";
import { AddTransactionSheet } from "@/components/transactions/AddTransactionSheet";

const NAV_ITEMS = [
  { href: "/painel", label: "Início", icon: LayoutDashboard },
  { href: "/assistente", label: "IA", icon: MessageCircle },
  { href: "/transacoes", label: "Lançamentos", icon: List },
  { href: "/configuracoes", label: "Ajustes", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside
        className="hidden w-60 shrink-0 flex-col p-4 sm:flex"
        style={{ background: "var(--nav-bg)" }}
      >
        <Link href="/" className="mb-8 flex items-center gap-2 px-2 text-lg font-semibold text-white">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
            style={{ background: "var(--nav-accent-soft)" }}
          >
            💰
          </span>
          <span>
            Meu <span className="brand-serif text-[1.15em] text-[#8ed2f5]">Dinheiro</span>
          </span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
                style={{
                  background: active ? "var(--nav-accent-soft)" : "transparent",
                  color: active ? "#ffffff" : "var(--nav-fg)",
                }}
              >
                <item.icon className="h-4.5 w-4.5" style={{ color: active ? "var(--nav-accent)" : undefined }} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => setAddOpen(true)}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--nav-accent)" }}
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </button>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <main className="flex-1 pb-24 sm:pb-8">{children}</main>

        <nav
          className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 sm:hidden"
          style={{ background: "var(--nav-bg)", borderTop: "1px solid var(--nav-border)" }}
        >
          {NAV_ITEMS.slice(0, 2).map((item) => (
            <NavButton key={item.href} item={item} active={pathname === item.href} />
          ))}

          <button
            onClick={() => setAddOpen(true)}
            aria-label="Adicionar movimentação"
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg"
            style={{ background: "var(--nav-accent)" }}
          >
            <Plus className="h-6 w-6" />
          </button>

          {NAV_ITEMS.slice(2).map((item) => (
            <NavButton key={item.href} item={item} active={pathname === item.href} />
          ))}
        </nav>
      </div>

      <AddTransactionSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function NavButton({
  item,
  active,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className="flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-medium"
      style={{ color: active ? "var(--nav-accent)" : "var(--nav-fg)" }}
    >
      <item.icon className="h-5 w-5" />
      {item.label}
    </Link>
  );
}

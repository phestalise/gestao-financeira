"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageCircle, List, Settings, Plus } from "lucide-react";
import clsx from "clsx";
import { AddTransactionSheet } from "@/components/transactions/AddTransactionSheet";

const NAV_ITEMS = [
  { href: "/", label: "Início", icon: LayoutDashboard },
  { href: "/assistente", label: "IA", icon: MessageCircle },
  { href: "/transacoes", label: "Lançamentos", icon: List },
  { href: "/configuracoes", label: "Ajustes", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] p-4 sm:flex">
        <div className="mb-8 px-2 text-lg font-semibold">💰 Meu Dinheiro</div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-muted)]"
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => setAddOpen(true)}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-3 py-3 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </button>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <main className="flex-1 pb-24 sm:pb-8">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-[var(--border)] bg-[var(--surface)]/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur sm:hidden">
          {NAV_ITEMS.slice(0, 2).map((item) => (
            <NavButton key={item.href} item={item} active={pathname === item.href} />
          ))}

          <button
            onClick={() => setAddOpen(true)}
            aria-label="Adicionar movimentação"
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg"
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
      className={clsx(
        "flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-medium",
        active ? "text-[var(--primary)]" : "text-[var(--muted)]"
      )}
    >
      <item.icon className="h-5 w-5" />
      {item.label}
    </Link>
  );
}

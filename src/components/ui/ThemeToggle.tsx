"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import clsx from "clsx";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  if (theme === "light") {
    document.documentElement.dataset.theme = "light";
  } else {
    delete document.documentElement.dataset.theme;
  }
  localStorage.setItem("theme", theme);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#000000" : "#f6f7fb");
}

export function ThemeToggle({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  // Estado inicial "dark" casa com a renderização do servidor (evita mismatch de hidratação);
  // o valor real, definido pelo script inline antes da pintura, é lido aqui após montar.
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    if (document.documentElement.dataset.theme === "light") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com o atributo já aplicado pelo script anti-flash
      setTheme("light");
    }
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Alternar tema claro/escuro"
      className={clsx(
        "flex items-center gap-2 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-2)]",
        iconOnly ? "justify-center p-2.5" : "px-3 py-2.5",
        className
      )}
    >
      {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      {!iconOnly && (theme === "dark" ? "Tema escuro" : "Tema claro")}
    </button>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

export const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Número que desliza suavemente até o alvo sempre que o alvo muda.
export function useTweenedNumber(target: number, duration = 900): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    if (prefersReducedMotion()) {
      fromRef.current = target;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sem animação, pula direto para o alvo
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      const current = from + (target - from) * eased;
      fromRef.current = current;
      setValue(current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

// Marca com data-visible os elementos [data-reveal] quando entram na tela (uma vez só).
export function useRevealOnScroll(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-visible", "true");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    el.querySelectorAll("[data-reveal]").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [root]);
}

// Atualiza --tx/--ty (ou as variáveis pedidas) com a posição do ponteiro dentro do elemento.
export function trackPointer(e: React.PointerEvent<HTMLElement>, x = "--tx", y = "--ty") {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty(x, `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty(y, `${e.clientY - rect.top}px`);
}

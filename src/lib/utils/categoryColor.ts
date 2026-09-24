// 8 tons definidos em globals.css (--cat-0-bg/-fg ... --cat-7-bg/-fg), com variantes
// próprias para light/dark. Evita verde/vermelho, reservados para indicadores positivos/alertas.
const PALETTE_SIZE = 8;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) % 997;
  }
  return hash;
}

export function getCategoryColor(categoryId: string): { bg: string; fg: string } {
  const index = hashString(categoryId) % PALETTE_SIZE;
  return {
    bg: `var(--cat-${index}-bg)`,
    fg: `var(--cat-${index}-fg)`,
  };
}

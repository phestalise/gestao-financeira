import clsx from "clsx";

interface ProgressBarProps {
  percent: number;
  tone?: "primary" | "positive" | "warning" | "negative" | "onGradient";
  className?: string;
}

const toneClasses = {
  primary: "bg-[var(--primary)]",
  positive: "bg-[var(--positive)]",
  warning: "bg-[var(--warning)]",
  negative: "bg-[var(--negative)]",
  onGradient: "bg-white",
};

const TRACK_DEFAULT = "bg-[var(--surface-2)]";

export function ProgressBar({ percent, tone = "primary", className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const track = tone === "onGradient" ? "bg-white/15" : TRACK_DEFAULT;

  return (
    <div className={clsx("h-2 w-full overflow-hidden rounded-full", track, className)}>
      <div
        className={clsx("h-full rounded-full transition-all", toneClasses[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

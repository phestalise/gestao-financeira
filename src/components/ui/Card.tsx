import { HTMLAttributes } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

export function Card({ className, bordered = true, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-16px_hsl(var(--shadow-color)/0.35)]",
        bordered && "border border-[var(--border)]",
        className
      )}
      {...props}
    />
  );
}

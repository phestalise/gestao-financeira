import { HTMLAttributes } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

export function Card({ className, bordered = true, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "app-card rounded-2xl bg-[var(--surface)]",
        bordered && "border border-[var(--border)]",
        className
      )}
      {...props}
    />
  );
}

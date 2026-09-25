import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary: "app-cta",
  secondary:
    "bg-[var(--surface-2)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--border)]",
  ghost: "bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-2)]",
  danger: "bg-[var(--negative-soft)] text-[var(--negative)] hover:opacity-80",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

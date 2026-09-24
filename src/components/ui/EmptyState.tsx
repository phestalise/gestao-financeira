import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon, title, description }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--muted)]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-[22rem] text-xs text-[var(--muted)]">{description}</p>}
    </div>
  );
}

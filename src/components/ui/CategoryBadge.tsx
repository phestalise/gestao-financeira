import clsx from "clsx";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { getCategoryColor } from "@/lib/utils/categoryColor";

interface Props {
  categoryId: string;
  icon: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { box: "h-8 w-8", icon: "h-3.5 w-3.5" },
  md: { box: "h-10 w-10", icon: "h-4.5 w-4.5" },
  lg: { box: "h-12 w-12", icon: "h-5.5 w-5.5" },
};

export function CategoryBadge({ categoryId, icon, size = "md", className }: Props) {
  const { bg, fg } = getCategoryColor(categoryId);
  const s = SIZES[size];

  return (
    <div
      className={clsx("flex shrink-0 items-center justify-center rounded-full", s.box, className)}
      style={{ background: bg, color: fg }}
    >
      <CategoryIcon icon={icon} className={s.icon} />
    </div>
  );
}

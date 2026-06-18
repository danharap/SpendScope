import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  name: string;
  color?: string | null;
  className?: string;
}

export function CategoryBadge({ name, color, className }: CategoryBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "border-0 font-medium",
        className
      )}
      style={
        color
          ? {
              backgroundColor: `${color}18`,
              color: color,
            }
          : undefined
      }
    >
      {color && (
        <span
          className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
      )}
      {name}
    </Badge>
  );
}

export function StatusBadge({
  variant,
  children,
  className,
}: {
  variant: "review" | "subscription" | "transfer" | "income" | "neutral";
  children: React.ReactNode;
  className?: string;
}) {
  const styles = {
    review: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    subscription: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
    transfer: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    income: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    neutral: "bg-muted text-muted-foreground",
  };

  return (
    <Badge
      className={cn("border-0 font-medium", styles[variant], className)}
    >
      {children}
    </Badge>
  );
}

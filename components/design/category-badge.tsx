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
      className={cn("border-0 font-medium bg-secondary/80", className)}
      style={
        color
          ? {
              backgroundColor: `${color}22`,
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
  variant: "review" | "subscription" | "transfer" | "income" | "neutral" | "success";
  children: React.ReactNode;
  className?: string;
}) {
  const styles = {
    review: "status-warning border-0",
    subscription: "border-primary/20 bg-primary/15 text-primary border-0",
    transfer: "border-0 bg-muted text-muted-foreground",
    income: "status-success border-0",
    neutral: "border-0 bg-muted text-muted-foreground",
    success: "status-success border-0",
  };

  return (
    <Badge className={cn("font-medium", styles[variant], className)}>
      {children}
    </Badge>
  );
}

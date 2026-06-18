import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  empty?: boolean;
  emptyMessage?: string;
  height?: string;
}

export function ChartCard({
  title,
  description,
  children,
  className,
  action,
  empty,
  emptyMessage = "No data for this period",
  height = "h-[320px]",
}: ChartCardProps) {
  return (
    <Card className={cn("card-premium overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-semibold tracking-tight">
            {title}
          </CardTitle>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </CardHeader>
      <CardContent>
        {empty ? (
          <div
            className={cn(
              "flex items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 text-sm text-muted-foreground",
              height
            )}
          >
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

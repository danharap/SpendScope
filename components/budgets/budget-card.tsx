import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils/format";
import type { BudgetWithSpending } from "@/types/database";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetCardProps {
  budget: BudgetWithSpending;
}

export function BudgetCard({ budget }: BudgetCardProps) {
  const limit = Number(budget.limit_amount);
  const spent = budget.spent;
  const remaining = budget.remaining;
  const percent = Math.min(budget.percentUsed, 100);
  const isOver = spent > limit;
  const category = budget.categories;

  return (
    <Card className={cn("shadow-sm", isOver && "border-red-200")}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: category?.color ?? "#94a3b8" }}
          />
          {category?.name ?? "Category"}
        </CardTitle>
        {isOver && (
          <AlertTriangle className="h-4 w-4 text-red-500" />
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Spent</span>
          <span className={cn("font-medium", isOver && "text-red-600")}>
            {formatCurrency(spent)}
          </span>
        </div>
        <Progress
          value={percent}
          className={cn("h-2", isOver && "[&>div]:bg-red-500")}
        />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {formatCurrency(remaining)} remaining
          </span>
          <span className="text-muted-foreground">
            of {formatCurrency(limit)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {percent.toFixed(0)}% of budget used
        </p>
      </CardContent>
    </Card>
  );
}

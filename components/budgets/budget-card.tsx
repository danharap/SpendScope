"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";
import type { BudgetWithSpending } from "@/types/database";
import { AlertTriangle, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { HoverLift } from "@/components/design/animated";
import Link from "next/link";

interface BudgetCardProps {
  budget: BudgetWithSpending;
}

function getProgressColor(percent: number, isOver: boolean) {
  if (isOver) return "[&>div]:bg-rose-500";
  if (percent >= 70) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-emerald-500";
}

function getStatusLabel(percent: number, isOver: boolean) {
  if (isOver) return { label: "Over budget", className: "text-rose-600" };
  if (percent >= 99) return { label: "Almost full", className: "text-amber-600" };
  if (percent >= 70) return { label: "On track", className: "text-amber-600" };
  return { label: "Under budget", className: "text-emerald-600" };
}

export function BudgetCard({ budget }: BudgetCardProps) {
  const limit = Number(budget.limit_amount);
  const spent = budget.spent;
  const remaining = budget.remaining;
  const percent = budget.percentUsed;
  const isOver = spent > limit;
  const category = budget.categories;
  const status = getStatusLabel(percent, isOver);

  return (
    <HoverLift>
      <Card
        className={cn(
          "card-premium-hover",
          isOver && "border-rose-200/80 dark:border-rose-900/50"
        )}
      >
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
            <span
              className="h-3 w-3 rounded-full ring-2 ring-background"
              style={{ backgroundColor: category?.color ?? "#94a3b8" }}
              aria-hidden
            />
            {category?.name ?? "Category"}
          </CardTitle>
          <div className="flex items-center gap-1">
            {isOver && (
              <AlertTriangle className="h-4 w-4 text-rose-500" aria-label="Over budget" />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              render={<Link href="/dashboard/budgets" />}
              aria-label="Edit budget"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold tracking-tight">
                {formatCurrency(spent)}
              </p>
              <p className="text-xs text-muted-foreground">
                of {formatCurrency(limit)} budgeted
              </p>
            </div>
            <p className={cn("text-sm font-medium", status.className)}>
              {status.label}
            </p>
          </div>
          <Progress
            value={Math.min(percent, 100)}
            className={cn("h-2.5", getProgressColor(percent, isOver))}
          />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {formatCurrency(Math.max(0, remaining))} remaining
            </span>
            <span className="font-medium text-muted-foreground">
              {percent.toFixed(0)}% used
            </span>
          </div>
        </CardContent>
      </Card>
    </HoverLift>
  );
}

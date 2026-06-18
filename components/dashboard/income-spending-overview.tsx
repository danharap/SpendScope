"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/design/section-header";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import type { IncomeSpendingStats } from "@/lib/analytics/income-budget";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  Banknote,
  PiggyBank,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

interface IncomeSpendingOverviewProps {
  stats: IncomeSpendingStats;
  weekLabel: string;
}

function progressColor(percent: number, over: boolean) {
  if (over) return "[&>div]:bg-rose-500";
  if (percent >= 85) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-emerald-500";
}

export function IncomeSpendingOverview({
  stats,
  weekLabel,
}: IncomeSpendingOverviewProps) {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Income & weekly budget"
        description="Deposits from CSV vs your casual spending cap"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          className={cn(
            "card-premium lg:col-span-2",
            stats.weeklyOverBudget && "border-rose-200/80 dark:border-rose-900/40"
          )}
        >
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Wallet className="h-5 w-5 text-primary" aria-hidden />
                Weekly casual spending
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{weekLabel}</p>
            </div>
            <Badge
              variant={stats.weeklyOverBudget ? "destructive" : "secondary"}
              className="font-normal"
            >
              ${stats.weeklyLimit.toFixed(0)}/wk cap
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-bold tracking-tight">
                  {formatCurrency(stats.weeklySpent)}
                </p>
                <p className="text-sm text-muted-foreground">spent this week</p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "text-lg font-semibold",
                    stats.weeklyRemaining >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  )}
                >
                  {formatCurrency(Math.abs(stats.weeklyRemaining))}
                </p>
                <p className="text-sm text-muted-foreground">
                  {stats.weeklyRemaining >= 0 ? "remaining" : "over budget"}
                </p>
              </div>
            </div>
            <Progress
              value={Math.min(stats.weeklyPercentUsed, 100)}
              className={cn(
                "h-3",
                progressColor(stats.weeklyPercentUsed, stats.weeklyOverBudget)
              )}
            />
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {stats.prevWeekSpent > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                    stats.weekOverWeekChange <= 0
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-rose-500/10 text-rose-600"
                  )}
                >
                  {stats.weekOverWeekChange <= 0 ? (
                    <TrendingDown className="h-3 w-3" aria-hidden />
                  ) : (
                    <TrendingUp className="h-3 w-3" aria-hidden />
                  )}
                  {formatPercent(stats.weekOverWeekChange)} vs last week
                </span>
              )}
              <span>{stats.weeklyPercentUsed.toFixed(0)}% of weekly cap used</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-premium">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Banknote className="h-5 w-5 text-emerald-600" aria-hidden />
              Income this month
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {formatCurrency(stats.monthIncome)}
              </p>
              <p className="text-sm text-muted-foreground">
                from {stats.incomeDeposits.length} deposit
                {stats.incomeDeposits.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Est. take-home / pay period</p>
              <p className="mt-0.5 font-semibold">
                ~{formatCurrency(stats.estimatedPayPerPeriod)}
              </p>
            </div>
            {stats.incomeDeposits.length > 0 && (
              <div className="space-y-2">
                {stats.incomeDeposits.slice(0, 3).map((d, i) => (
                  <div
                    key={`${d.date}-${i}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate text-muted-foreground">
                      {d.merchant}
                    </span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(d.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="card-premium">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Monthly spending</p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(stats.monthSpending)}</p>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Net (income − spending)</p>
            <p
              className={cn(
                "mt-1 text-2xl font-bold",
                stats.monthNet >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              )}
            >
              {formatCurrency(stats.monthNet)}
            </p>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="flex h-full flex-col justify-between p-5">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-primary" aria-hidden />
              <p className="text-sm font-medium">Budget settings</p>
            </div>
            <Link
              href="/dashboard/settings"
              className={buttonVariants({ variant: "outline", size: "sm", className: "mt-3 w-full" })}
            >
              Edit $200/wk cap & pay rate
            </Link>
          </CardContent>
        </Card>
      </div>

      {stats.suggestions.length > 0 && (
        <Card className="card-premium border-primary/15 bg-primary/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Lightbulb className="h-5 w-5 text-primary" aria-hidden />
              Budget suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {stats.suggestions.map((s, i) => (
                <li key={i} className="text-sm leading-relaxed text-muted-foreground">
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

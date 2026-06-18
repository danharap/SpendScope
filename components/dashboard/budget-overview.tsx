import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetCard } from "@/components/budgets/budget-card";
import { buttonVariants } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import type { BudgetWithSpending } from "@/types/database";

interface BudgetOverviewProps {
  budgets: BudgetWithSpending[];
  month: string;
}

export function BudgetOverview({ budgets, month }: BudgetOverviewProps) {
  if (budgets.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-5 w-5 text-blue-600" />
            Budgets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Set monthly spending limits by category to track how you&apos;re doing
            against your goals.
          </p>
          <Link
            href="/dashboard/budgets"
            className={buttonVariants({ className: "mt-4 bg-blue-600 hover:bg-blue-700" })}
          >
            Set up budgets
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Budget progress</h2>
        <Link
          href={`/dashboard/budgets?month=${month}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Edit budgets
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {budgets.slice(0, 6).map((budget) => (
          <BudgetCard key={budget.id} budget={budget} />
        ))}
      </div>
    </div>
  );
}

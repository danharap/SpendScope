import { Suspense } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { BudgetCard } from "@/components/budgets/budget-card";
import { BudgetForm } from "@/components/budgets/budget-form";
import { getCategories } from "@/lib/actions/accounts";
import { getBudgets } from "@/lib/actions/budgets";
import { getCurrentMonth } from "@/lib/analytics/dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet } from "lucide-react";

interface BudgetsPageProps {
  searchParams: Promise<{ month?: string }>;
}

async function BudgetsContent({ month }: { month: string }) {
  const [categories, budgets] = await Promise.all([
    getCategories(),
    getBudgets(month),
  ]);

  const spendingCategories = categories.filter(
    (c) =>
      !["Income", "Refunds", "Transfers", "Needs Review"].includes(c.name)
  );

  return (
    <>
      <DashboardHeader
        title="Budgets"
        description="Monthly spending limits by category"
        months={[month]}
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <BudgetForm categories={spendingCategories} month={month} />

        {budgets.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Wallet className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No budgets created</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Set monthly limits above to track your spending goals
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {budgets.map((budget) => (
              <BudgetCard key={budget.id} budget={budget} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default async function BudgetsPage({ searchParams }: BudgetsPageProps) {
  const params = await searchParams;
  const month = params.month ?? getCurrentMonth();

  return (
    <Suspense
      fallback={
        <div className="p-6">
          <Skeleton className="h-16 w-full" />
        </div>
      }
    >
      <BudgetsContent month={month} />
    </Suspense>
  );
}

import { Suspense } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { BudgetCard } from "@/components/budgets/budget-card";
import { BudgetForm } from "@/components/budgets/budget-form";
import { PageContainer } from "@/components/design/page-container";
import { EmptyState } from "@/components/design/empty-state";
import { SectionHeader } from "@/components/design/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { getCategories } from "@/lib/actions/accounts";
import { getBudgets } from "@/lib/actions/budgets";
import { getCurrentMonth } from "@/lib/analytics/dashboard";
import { formatCurrency } from "@/lib/utils/format";
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

  const totalBudgeted = budgets.reduce(
    (s, b) => s + Number(b.limit_amount),
    0
  );
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = Math.max(0, totalBudgeted - totalSpent);
  const overBudget = budgets.filter((b) => b.spent > Number(b.limit_amount));
  const underBudget = budgets.filter(
    (b) => b.percentUsed < 70 && b.spent <= Number(b.limit_amount)
  );

  const months = [month];

  return (
    <>
      <DashboardHeader
        title="Budgets"
        description="Set monthly spending limits and track progress by category"
        months={months}
      />
      <PageContainer>
        <BudgetForm categories={spendingCategories} month={month} />

        {budgets.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total budgeted", value: formatCurrency(totalBudgeted) },
              { label: "Total spent", value: formatCurrency(totalSpent) },
              { label: "Remaining", value: formatCurrency(totalRemaining) },
              {
                label: "Categories over",
                value: String(overBudget.length),
              },
            ].map((stat) => (
              <Card key={stat.label} className="card-premium">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">
                    {stat.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {budgets.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No budgets created"
            description="Set monthly limits above to track your spending goals and see progress on your dashboard."
          />
        ) : (
          <>
            <SectionHeader
              title="Your budgets"
              description={
                underBudget.length > 0
                  ? `${underBudget.length} budget${underBudget.length === 1 ? "" : "s"} under 70% of limit`
                  : "Monitor spending against your monthly limits"
              }
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {budgets.map((budget) => (
                <BudgetCard key={budget.id} budget={budget} />
              ))}
            </div>
          </>
        )}
      </PageContainer>
    </>
  );
}

export default async function BudgetsPage({ searchParams }: BudgetsPageProps) {
  const params = await searchParams;
  const month = params.month ?? getCurrentMonth();

  return (
    <Suspense
      fallback={
        <PageContainer>
          <Skeleton className="h-24 w-full rounded-2xl" />
        </PageContainer>
      }
    >
      <BudgetsContent month={month} />
    </Suspense>
  );
}

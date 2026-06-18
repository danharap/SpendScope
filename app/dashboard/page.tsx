import { Suspense } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { NeedsReviewCard } from "@/components/dashboard/needs-review-card";
import { SpendingByCategoryChart } from "@/components/charts/spending-by-category-chart";
import { MonthlySpendingChart } from "@/components/charts/monthly-spending-chart";
import { FoodSpendingTrendChart } from "@/components/charts/food-spending-trend-chart";
import { TopMerchantsChart } from "@/components/charts/top-merchants-chart";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  DollarSign,
  Utensils,
  Wallet,
  AlertCircle,
  Upload,
} from "lucide-react";
import { getCategories } from "@/lib/actions/accounts";
import { getTransactions } from "@/lib/actions/transactions";
import { getBudgets } from "@/lib/actions/budgets";
import {
  computeDashboardStats,
  computeBudgetRemaining,
  getCurrentMonth,
} from "@/lib/analytics/dashboard";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import type { TransactionWithRelations } from "@/types/database";

interface DashboardPageProps {
  searchParams: Promise<{ month?: string }>;
}

async function DashboardContent({ month }: { month: string }) {
  const categories = await getCategories();
  const transactions = (await getTransactions()) as TransactionWithRelations[];
  const budgets = await getBudgets(month);
  const budgetRemaining = computeBudgetRemaining(budgets);
  const stats = computeDashboardStats(
    transactions,
    categories,
    month,
    budgetRemaining
  );

  const months = [
    ...new Set(transactions.map((t) => t.transaction_date.slice(0, 7))),
  ].sort();
  if (!months.includes(month)) months.push(month);
  months.sort();

  const hasData = transactions.length > 0;

  if (!hasData) {
    return (
      <>
        <DashboardHeader
          title="Dashboard"
          description="Your personal finance overview"
          showMonthSelector={false}
          months={[]}
        />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Upload className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold">No transactions yet</h2>
          <p className="max-w-md text-center text-muted-foreground">
            Upload your first RBC CSV export to start tracking spending,
            categories, and budgets.
          </p>
          <Link
            href="/dashboard/upload"
            className={buttonVariants({ className: "bg-blue-600 hover:bg-blue-700" })}
          >
            Upload CSV
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        title="Dashboard"
        description="Your personal finance overview"
        months={months}
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Spend"
            value={formatCurrency(stats.totalSpent)}
            icon={DollarSign}
            trend={{
              value: formatPercent(stats.monthOverMonthChange),
              positive: stats.monthOverMonthChange <= 0,
            }}
            subtitle="vs last month"
          />
          <StatCard
            title="Food Spend"
            value={formatCurrency(stats.foodSpent)}
            icon={Utensils}
            variant="warning"
            subtitle={`Groceries: ${formatCurrency(stats.groceriesSpent)}`}
          />
          <StatCard
            title="Budget Remaining"
            value={formatCurrency(stats.budgetRemaining)}
            icon={Wallet}
            variant="success"
          />
          <StatCard
            title="Needs Review"
            value={String(stats.needsReviewCount)}
            icon={AlertCircle}
            variant={stats.needsReviewCount > 0 ? "warning" : "default"}
          />
        </div>

        <NeedsReviewCard count={stats.needsReviewCount} />

        <div className="grid gap-6 lg:grid-cols-2">
          <SpendingByCategoryChart data={stats.spendingByCategory} />
          <MonthlySpendingChart data={stats.monthlySpending} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <FoodSpendingTrendChart data={stats.foodTrend} />
          <TopMerchantsChart data={stats.topMerchants} />
        </div>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Transactions</CardTitle>
            <Link
              href="/dashboard/transactions"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <TransactionsTable
              transactions={stats.recentTransactions}
              categories={categories}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const month = params.month ?? getCurrentMonth();

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col gap-6 p-6">
          <Skeleton className="h-16 w-full" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      }
    >
      <DashboardContent month={month} />
    </Suspense>
  );
}

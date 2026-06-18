import { Suspense } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { NeedsReviewCard } from "@/components/dashboard/needs-review-card";
import { SubscriptionsSummaryCard } from "@/components/dashboard/subscriptions-summary-card";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { SpendingByCategoryChart } from "@/components/charts/spending-by-category-chart";
import { MonthlySpendingChart } from "@/components/charts/monthly-spending-chart";
import { FoodSpendingTrendChart } from "@/components/charts/food-spending-trend-chart";
import { TopMerchantsChart } from "@/components/charts/top-merchants-chart";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { PageContainer } from "@/components/design/page-container";
import { EmptyState } from "@/components/design/empty-state";
import { SectionHeader } from "@/components/design/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  DollarSign,
  Utensils,
  Wallet,
  AlertCircle,
  Upload,
  Repeat,
  Store,
} from "lucide-react";
import { getCategories } from "@/lib/actions/accounts";
import { getTransactions } from "@/lib/actions/transactions";
import { getBudgets } from "@/lib/actions/budgets";
import { getBudgetPreferences } from "@/lib/actions/settings";
import {
  computeDashboardStats,
  computeBudgetRemaining,
  getCurrentMonth,
} from "@/lib/analytics/dashboard";
import {
  computeIncomeSpendingStats,
  getWeekRange,
} from "@/lib/analytics/income-budget";
import { IncomeSpendingOverview } from "@/components/dashboard/income-spending-overview";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import type { TransactionWithRelations } from "@/types/database";

interface DashboardPageProps {
  searchParams: Promise<{ month?: string }>;
}

async function DashboardContent({ month }: { month: string }) {
  const categories = await getCategories();
  const transactions = (await getTransactions()) as TransactionWithRelations[];
  const [budgets, budgetPrefs] = await Promise.all([
    getBudgets(month),
    getBudgetPreferences(),
  ]);
  const budgetRemaining = computeBudgetRemaining(budgets);
  const stats = computeDashboardStats(
    transactions,
    categories,
    month,
    budgetRemaining
  );
  const incomeStats = computeIncomeSpendingStats(
    transactions,
    month,
    budgetPrefs
  );
  const weekLabel = getWeekRange().label;

  const months = [
    ...new Set(transactions.map((t) => t.transaction_date.slice(0, 7))),
  ].sort();
  if (!months.includes(month)) months.push(month);
  months.sort();

  const hasData = transactions.length > 0;
  const topMerchant = stats.topMerchants[0];

  if (!hasData) {
    return (
      <>
        <DashboardHeader
          title="Spending Dashboard"
          description="Track your spending, budgets, and monthly habits from uploaded CSV transactions."
          showMonthSelector={false}
          months={[]}
          showCsvBadge
          showUploadButton
        />
        <PageContainer>
          <EmptyState
            icon={Upload}
            title="No transactions yet"
            description="Upload your first RBC CSV file to start tracking your spending, categories, and budgets."
            actionLabel="Upload CSV"
            actionHref="/dashboard/upload"
          />
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        title="Spending Dashboard"
        description="Track your spending, budgets, and monthly habits from uploaded CSV transactions."
        months={months}
        showCsvBadge
        showUploadButton
      />
      <PageContainer>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <StatCard
            title="Total Spent This Month"
            value={formatCurrency(stats.totalSpent)}
            icon={DollarSign}
            trend={{
              value: formatPercent(stats.monthOverMonthChange),
              positive: stats.monthOverMonthChange <= 0,
            }}
            subtitle="vs last month"
          />
          <StatCard
            title="Food & Dining"
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
            subtitle={stats.needsReviewCount > 0 ? "Uncategorized" : "All categorized"}
          />
          <StatCard
            title="Subscriptions"
            value={formatCurrency(stats.subscriptionsSpent)}
            icon={Repeat}
            subtitle={`${stats.subscriptionItems.length} active`}
          />
          <StatCard
            title="Top Merchant"
            value={topMerchant ? formatCurrency(topMerchant.total) : "—"}
            icon={Store}
            subtitle={topMerchant?.name ?? "No merchants yet"}
          />
        </div>

        <IncomeSpendingOverview stats={incomeStats} weekLabel={weekLabel} />

        <NeedsReviewCard count={stats.needsReviewCount} />

        <BudgetOverview budgets={budgets} month={month} />

        <SectionHeader
          title="Spending analytics"
          description="Visual breakdown of your monthly habits"
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <SpendingByCategoryChart data={stats.spendingByCategory} />
          <SubscriptionsSummaryCard
            items={stats.subscriptionItems}
            total={stats.subscriptionsSpent}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <MonthlySpendingChart data={stats.monthlySpending} />
          <FoodSpendingTrendChart data={stats.foodTrend} />
        </div>

        <TopMerchantsChart data={stats.topMerchants} />

        <Card className="card-premium overflow-hidden">
          <SectionHeader
            title="Recent transactions"
            description="Latest activity from your uploaded CSV files"
            className="border-b border-border/60 px-6 py-5"
            action={
              <Link
                href="/dashboard/transactions"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                View all
              </Link>
            }
          />
          <CardContent className="p-0">
            <TransactionsTable
              transactions={stats.recentTransactions}
              categories={categories}
              compact
            />
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const month = params.month ?? getCurrentMonth();

  return (
    <Suspense
      fallback={
        <PageContainer>
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        </PageContainer>
      }
    >
      <DashboardContent month={month} />
    </Suspense>
  );
}

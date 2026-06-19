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
import {
  getDashboardStats,
  getDashboardBudgets,
  getDashboardBudgetPrefs,
  getRecentTransactionsForDashboard,
  getDistinctMonthsForDashboard,
} from "@/lib/actions/dashboard";
import { computeBudgetRemaining, getCurrentMonth } from "@/lib/analytics/dashboard";
import { IncomeSpendingOverview } from "@/components/dashboard/income-spending-overview";
import { formatCurrency, formatPercent, parseDashboardMonth } from "@/lib/utils/format";
import { getWeekRange } from "@/lib/analytics/income-budget";
import type { IncomeSpendingStats } from "@/lib/analytics/income-budget";

export const maxDuration = 60;

interface DashboardPageProps {
  searchParams: Promise<{ month?: string }>;
}

async function DashboardContent({ month }: { month: string }) {
  const [categories, months, budgets, budgetPrefs, recentTransactions] =
    await Promise.all([
      getCategories().catch(() => [] as Awaited<ReturnType<typeof getCategories>>),
      getDistinctMonthsForDashboard().catch(() => [] as string[]),
      getDashboardBudgets(month).catch(() => [] as Awaited<ReturnType<typeof getDashboardBudgets>>),
      getDashboardBudgetPrefs().catch(() => ({
        weeklySpendingLimit: 200,
        hourlyRate: 30,
        hoursPerWeek: 40,
        payFrequency: "biweekly" as const,
      })),
      getRecentTransactionsForDashboard(month).catch(
        () => [] as Awaited<ReturnType<typeof getRecentTransactionsForDashboard>>
      ),
    ]);

  const stats = await getDashboardStats(month, categories).catch(() => ({
    totalSpent: 0,
    prevMonthSpent: 0,
    monthOverMonthChange: 0,
    foodSpent: 0,
    groceriesSpent: 0,
    subscriptionsSpent: 0,
    needsReviewCount: 0,
    topMerchants: [] as { name: string; total: number }[],
    spendingByCategory: [] as { name: string; total: number; color: string }[],
    monthlySpending: [] as { month: string; total: number }[],
    foodTrend: [] as { month: string; total: number }[],
    subscriptionItems: [] as { name: string; total: number; count: number }[],
    weeklySpent: 0,
    prevWeekSpent: 0,
    monthIncome: 0,
    incomeDeposits: [] as { date: string; amount: number; merchant: string }[],
  }));

  const budgetRemaining = computeBudgetRemaining(budgets);
  const weekLabel = getWeekRange().label;

  const allMonths = [...months];
  if (!allMonths.includes(month)) allMonths.push(month);
  allMonths.sort();

  const weeklyLimit = budgetPrefs.weeklySpendingLimit;
  const weeklyRemaining = weeklyLimit - stats.weeklySpent;
  const weekOverWeekChange =
    stats.prevWeekSpent > 0
      ? ((stats.weeklySpent - stats.prevWeekSpent) / stats.prevWeekSpent) * 100
      : 0;

  const estimatedPayPerPeriod = (() => {
    const gross = budgetPrefs.hourlyRate * budgetPrefs.hoursPerWeek;
    const net = gross * 0.75;
    if (budgetPrefs.payFrequency === "weekly") return net;
    if (budgetPrefs.payFrequency === "monthly") return net * (52 / 12);
    return net * 2;
  })();

  const incomeStats: IncomeSpendingStats = {
    weeklySpent: stats.weeklySpent,
    weeklyLimit,
    weeklyRemaining,
    weeklyPercentUsed: weeklyLimit > 0 ? (stats.weeklySpent / weeklyLimit) * 100 : 0,
    weeklyOverBudget: stats.weeklySpent > weeklyLimit,
    prevWeekSpent: stats.prevWeekSpent,
    weekOverWeekChange,
    monthIncome: stats.monthIncome,
    monthSpending: stats.totalSpent,
    monthNet: stats.monthIncome - stats.totalSpent,
    estimatedPayPerPeriod,
    estimatedMonthlyIncome: estimatedPayPerPeriod * (budgetPrefs.payFrequency === "biweekly" ? 26 / 12 : 1),
    incomeDeposits: stats.incomeDeposits,
    suggestions: [],
  };

  const topMerchant = stats.topMerchants[0];
  const hasData = allMonths.length > 1 || recentTransactions.length > 0 || stats.totalSpent > 0 || stats.needsReviewCount > 0;

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
        months={allMonths}
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
            value={formatCurrency(budgetRemaining)}
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
              transactions={recentTransactions}
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
  const month = parseDashboardMonth(params.month ?? getCurrentMonth());

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

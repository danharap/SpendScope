import { Suspense } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { InsightCard } from "@/components/insights/insight-card";
import { SpendingByCategoryChart } from "@/components/charts/spending-by-category-chart";
import { TopMerchantsChart } from "@/components/charts/top-merchants-chart";
import { PageContainer } from "@/components/design/page-container";
import { EmptyState } from "@/components/design/empty-state";
import { SectionHeader } from "@/components/design/section-header";
import { getCategories } from "@/lib/actions/accounts";
import { getTransactions } from "@/lib/actions/transactions";
import { getBudgetPreferences } from "@/lib/actions/settings";
import {
  computeDashboardStats,
  generateInsights,
  getCurrentMonth,
} from "@/lib/analytics/dashboard";
import {
  computeIncomeSpendingStats,
} from "@/lib/analytics/income-budget";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb } from "lucide-react";
import type { TransactionWithRelations } from "@/types/database";

interface InsightsPageProps {
  searchParams: Promise<{ month?: string }>;
}

async function InsightsContent({ month }: { month: string }) {
  const categories = await getCategories();
  const transactions = (await getTransactions()) as TransactionWithRelations[];
  const budgetPrefs = await getBudgetPreferences();
  const stats = computeDashboardStats(transactions, categories, month, 0);
  const insights = generateInsights(transactions, categories, month);
  const incomeStats = computeIncomeSpendingStats(
    transactions,
    month,
    budgetPrefs
  );

  const months = [
    ...new Set(transactions.map((t) => t.transaction_date.slice(0, 7))),
  ].sort();
  if (!months.includes(month)) months.push(month);
  months.sort();

  return (
    <>
      <DashboardHeader
        title="Insights"
        description="Personalized observations about your spending patterns"
        months={months}
      />
      <PageContainer>
        {insights.length === 0 ? (
          <EmptyState
            icon={Lightbulb}
            title="No insights available yet"
            description="Upload transactions to see personalized spending insights and trends."
            actionLabel="Upload CSV"
            actionHref="/dashboard/upload"
          />
        ) : (
          <>
            <SectionHeader
              title="This month's insights"
              description="Actionable observations based on your uploaded transactions"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </>
        )}

        {incomeStats.suggestions.length > 0 && (
          <>
            <SectionHeader
              title="Budget suggestions"
              description="Based on your income, spending cap, and uploaded deposits"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {incomeStats.suggestions.map((text, i) => (
                <InsightCard
                  key={`budget-${i}`}
                  insight={{ id: `budget-${i}`, text, type: "info" }}
                />
              ))}
            </div>
          </>
        )}

        <SectionHeader
          title="Supporting charts"
          description="Visual context for your spending habits"
          className="mt-4"
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <SpendingByCategoryChart data={stats.spendingByCategory} />
          <TopMerchantsChart data={stats.topMerchants} />
        </div>
      </PageContainer>
    </>
  );
}

export default async function InsightsPage({ searchParams }: InsightsPageProps) {
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
      <InsightsContent month={month} />
    </Suspense>
  );
}

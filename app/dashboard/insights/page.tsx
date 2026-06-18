import { Suspense } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { InsightCard } from "@/components/insights/insight-card";
import { SpendingByCategoryChart } from "@/components/charts/spending-by-category-chart";
import { TopMerchantsChart } from "@/components/charts/top-merchants-chart";
import { getCategories } from "@/lib/actions/accounts";
import { getTransactions } from "@/lib/actions/transactions";
import {
  computeDashboardStats,
  generateInsights,
  getCurrentMonth,
} from "@/lib/analytics/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import type { TransactionWithRelations } from "@/types/database";

interface InsightsPageProps {
  searchParams: Promise<{ month?: string }>;
}

async function InsightsContent({ month }: { month: string }) {
  const categories = await getCategories();
  const transactions = (await getTransactions()) as TransactionWithRelations[];
  const stats = computeDashboardStats(transactions, categories, month, 0);
  const insights = generateInsights(transactions, categories, month);

  const months = [
    ...new Set(transactions.map((t) => t.transaction_date.slice(0, 7))),
  ].sort();
  if (!months.includes(month)) months.push(month);
  months.sort();

  return (
    <>
      <DashboardHeader
        title="Insights"
        description="Spending patterns and trends"
        months={months}
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {insights.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            Upload transactions to see personalized insights
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <SpendingByCategoryChart data={stats.spendingByCategory} />
          <TopMerchantsChart data={stats.topMerchants} />
        </div>
      </div>
    </>
  );
}

export default async function InsightsPage({ searchParams }: InsightsPageProps) {
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
      <InsightsContent month={month} />
    </Suspense>
  );
}

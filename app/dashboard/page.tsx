import { Suspense } from "react";
import { format } from "date-fns";
import { createClient, getUser } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { CategoryDrilldown } from "@/components/dashboard/category-drilldown";
import { PageContainer } from "@/components/design/page-container";
import { EmptyState } from "@/components/design/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { DollarSign, Utensils, Wallet, AlertCircle, Upload } from "lucide-react";
import type { Category, BudgetWithSpending, TransactionWithRelations } from "@/types/database";

// ---------------------------------------------------------------------------
// Helpers (inlined so this page has no external analytics dependencies)
// ---------------------------------------------------------------------------

function getCurrentMonth(): string {
  return format(new Date(), "yyyy-MM");
}

function parseSafeMonth(month?: string | null): string {
  const cur = getCurrentMonth();
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return cur;
  const mo = Number(month.split("-")[1]);
  if (!mo || mo < 1 || mo > 12) return cur;
  return month;
}

function getMonthRange(month: string): { start: string; end: string } {
  const [year, m] = month.split("-").map(Number);
  const start = new Date(year, m - 1, 1);
  const end = new Date(year, m, 0);
  return {
    start: format(start, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
  };
}

function formatCAD(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface DashboardPageProps {
  searchParams: Promise<{ month?: string }>;
}

async function DashboardContent({ month }: { month: string }) {
  try {
    const user = await getUser();
    if (!user) {
      return (
        <PageContainer>
          <EmptyState
            icon={Upload}
            title="Not signed in"
            description="Please sign in to view your dashboard."
          />
        </PageContainer>
      );
    }

    const supabase = await createClient();
    const { start, end } = getMonthRange(month);

    // Fetch all data in parallel; use allSettled so one failure doesn't block others
    const [catRes, monthsRes, txRes, needsReviewRes, budgetsRes] =
      await Promise.allSettled([
        supabase
          .from("categories")
          .select("*")
          .or(`is_default.eq.true,user_id.eq.${user.id}`)
          .order("name"),

        supabase
          .from("transactions")
          .select("transaction_date")
          .eq("user_id", user.id)
          .order("transaction_date"),

        supabase
          .from("transactions")
          .select("amount, category_id, is_income, is_transfer")
          .eq("user_id", user.id)
          .gte("transaction_date", start)
          .lte("transaction_date", end),

        supabase
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("needs_review", true),

        supabase
          .from("budgets")
          .select("*, categories(*)")
          .eq("user_id", user.id)
          .eq("month", month),
      ]);

    const categories: Category[] =
      catRes.status === "fulfilled" ? ((catRes.value.data ?? []) as Category[]) : [];

    const allMonths: string[] =
      monthsRes.status === "fulfilled"
        ? [
            ...new Set(
              (monthsRes.value.data ?? []).map((t) => t.transaction_date.slice(0, 7))
            ),
          ].sort()
        : [];

    const txRows =
      txRes.status === "fulfilled" ? (txRes.value.data ?? []) : [];

    const needsReviewCount =
      needsReviewRes.status === "fulfilled"
        ? (needsReviewRes.value.count ?? 0)
        : 0;

    const rawBudgets =
      budgetsRes.status === "fulfilled" ? (budgetsRes.value.data ?? []) : [];

    // -------------------------------------------------------------------------
    // Compute spending stats
    // -------------------------------------------------------------------------
    const spending = txRows.filter(
      (t) => !t.is_income && !t.is_transfer && Number(t.amount) < 0
    );
    const totalSpent = spending.reduce(
      (s, t) => s + Math.abs(Number(t.amount)),
      0
    );

    const catMap = new Map(categories.map((c) => [c.id, c]));
    const foodNames = [
      "Restaurants",
      "Fast Food & Delivery",
      "Coffee",
      "Groceries",
      "Alcohol & Beverages",
    ];
    const foodCatIds = new Set(
      categories.filter((c) => foodNames.includes(c.name)).map((c) => c.id)
    );
    const foodSpent = spending
      .filter((t) => t.category_id && foodCatIds.has(t.category_id))
      .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

    // Category totals for chart
    const catTotals: Record<string, { total: number; color: string }> = {};
    for (const t of spending) {
      const cat = t.category_id ? catMap.get(t.category_id) : undefined;
      const name = cat?.name ?? "Other";
      const color = cat?.color ?? "#94a3b8";
      if (!catTotals[name]) catTotals[name] = { total: 0, color };
      catTotals[name].total += Math.abs(Number(t.amount));
    }
    const spendingByCategory = Object.entries(catTotals)
      .map(([name, { total, color }]) => ({ name, total, color }))
      .sort((a, b) => b.total - a.total);

    // -------------------------------------------------------------------------
    // Budget remaining
    // -------------------------------------------------------------------------
    let budgets: BudgetWithSpending[] = [];
    if (rawBudgets.length > 0) {
      const categoryBudgets = rawBudgets.filter((b) => b.category_id);
      const hasGeneralBudget = rawBudgets.some((b) => !b.category_id);

      // Fetch spending per category (for category-specific budgets)
      const spentByCat: Record<string, number> = {};
      if (categoryBudgets.length > 0) {
        const budgetCatIds = categoryBudgets.map((b) => b.category_id);
        const { data: budgetTx } = await supabase
          .from("transactions")
          .select("category_id, amount")
          .eq("user_id", user.id)
          .in("category_id", budgetCatIds)
          .gte("transaction_date", start)
          .lte("transaction_date", end)
          .eq("is_income", false)
          .eq("is_transfer", false);

        for (const tx of budgetTx ?? []) {
          if (!tx.category_id) continue;
          spentByCat[tx.category_id] =
            (spentByCat[tx.category_id] ?? 0) + Math.abs(Number(tx.amount));
        }
      }

      // For the general budget, total spending is already in `totalSpent`
      budgets = rawBudgets.map((b) => {
        const spent = b.category_id
          ? (spentByCat[b.category_id] ?? 0)
          : hasGeneralBudget
          ? totalSpent
          : 0;
        const limit = Number(b.limit_amount);
        return {
          ...b,
          spent,
          remaining: limit - spent,
          percentUsed: limit > 0 ? (spent / limit) * 100 : 0,
        };
      }) as BudgetWithSpending[];
    }

    const budgetRemaining = budgets.reduce(
      (s, b) => s + Math.max(0, b.remaining),
      0
    );

    // -------------------------------------------------------------------------
    // Transactions for this month (with full relations for chart drill-down)
    // Load up to 200 — enough for the monthly view without over-fetching
    // -------------------------------------------------------------------------
    const { data: recentData } = await supabase
      .from("transactions")
      .select("*, accounts(*), categories(*)")
      .eq("user_id", user.id)
      .gte("transaction_date", start)
      .lte("transaction_date", end)
      .order("transaction_date", { ascending: false })
      .limit(200);
    const recentTransactions = (recentData ?? []) as TransactionWithRelations[];

    // -------------------------------------------------------------------------
    // Month list for header selector
    // -------------------------------------------------------------------------
    const displayMonths = [...new Set([...allMonths, month])].sort();
    const hasData =
      displayMonths.length > 1 ||
      recentTransactions.length > 0 ||
      totalSpent > 0;

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
              description="Upload your first CSV file to start tracking your spending, categories, and budgets."
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
          months={displayMonths}
          showCsvBadge
          showUploadButton
        />
        <PageContainer>
          {/* Top stats */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Spent This Month"
              value={formatCAD(totalSpent)}
              icon={<DollarSign className="h-5 w-5" aria-hidden />}
            />
            <StatCard
              title="Food & Dining"
              value={formatCAD(foodSpent)}
              icon={<Utensils className="h-5 w-5" aria-hidden />}
              variant="warning"
              subtitle="Restaurants, fast food, groceries"
            />
            <StatCard
              title="Budget Remaining"
              value={formatCAD(budgetRemaining)}
              icon={<Wallet className="h-5 w-5" aria-hidden />}
              variant="success"
              subtitle={budgets.length > 0 ? `Across ${budgets.length} budget${budgets.length !== 1 ? "s" : ""}` : "No budgets set"}
            />
            <StatCard
              title="Needs Review"
              value={String(needsReviewCount)}
              icon={<AlertCircle className="h-5 w-5" aria-hidden />}
              variant={needsReviewCount > 0 ? "warning" : "default"}
              subtitle={needsReviewCount > 0 ? "Uncategorized transactions" : "All categorized"}
            />
          </div>

          {/* Budgets */}
          <BudgetOverview budgets={budgets} month={month} />

          {/* Pie chart + clickable transaction drill-down */}
          <CategoryDrilldown
            spendingByCategory={spendingByCategory}
            transactions={recentTransactions}
            categories={categories}
          />
        </PageContainer>
      </>
    );
  } catch (err) {
    console.error("[dashboard] fatal render error:", err);
    return (
      <PageContainer>
        <Card className="border-rose-500/30 bg-rose-500/10">
          <CardContent className="p-6">
            <p className="font-semibold text-rose-300">Dashboard error</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {err instanceof Error ? err.message : "An unknown error occurred."}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Your transactions and other pages are unaffected.{" "}
              <Link href="/dashboard/transactions" className="underline">
                View transactions →
              </Link>
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const month = parseSafeMonth(params.month);

  return (
    <Suspense
      fallback={
        <PageContainer>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </PageContainer>
      }
    >
      <DashboardContent month={month} />
    </Suspense>
  );
}

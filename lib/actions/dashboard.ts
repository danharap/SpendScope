"use server";

import { createClient, getUser } from "@/lib/supabase/server";
import { getMonthRange, getPreviousMonth } from "@/lib/utils/format";
import type { Category, TransactionWithRelations } from "@/types/database";
import type { BudgetWithSpending } from "@/types/database";

export interface DashboardStats {
  totalSpent: number;
  prevMonthSpent: number;
  monthOverMonthChange: number;
  foodSpent: number;
  groceriesSpent: number;
  subscriptionsSpent: number;
  needsReviewCount: number;
  topMerchants: { name: string; total: number }[];
  spendingByCategory: { name: string; total: number; color: string }[];
  monthlySpending: { month: string; total: number }[];
  foodTrend: { month: string; total: number }[];
  subscriptionItems: { name: string; total: number; count: number }[];
  weeklySpent: number;
  prevWeekSpent: number;
  monthIncome: number;
  incomeDeposits: { date: string; amount: number; merchant: string }[];
}

function sumSpending(rows: { amount: string | number }[]): number {
  return rows.reduce((s, r) => s + Math.abs(Number(r.amount)), 0);
}

function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function getSundayOfWeek(date: Date): string {
  const mon = new Date(getMondayOfWeek(date));
  mon.setDate(mon.getDate() + 6);
  return mon.toISOString().slice(0, 10);
}

export async function getDashboardStats(
  month: string,
  categories: Category[]
): Promise<DashboardStats> {
  const user = await getUser();
  if (!user) return emptyStats();

  const supabase = await createClient();
  const { start, end } = getMonthRange(month);
  const prevMonth = getPreviousMonth(month);
  const { start: prevStart, end: prevEnd } = getMonthRange(prevMonth);
  const today = new Date();
  const weekStart = getMondayOfWeek(today);
  const weekEnd = getSundayOfWeek(today);
  const prevWeekDate = new Date(today);
  prevWeekDate.setDate(today.getDate() - 7);
  const prevWeekStart = getMondayOfWeek(prevWeekDate);
  const prevWeekEnd = getSundayOfWeek(prevWeekDate);

  const catMap = new Map(categories.map((c) => [c.id, c]));
  const foodCatIds = new Set(
    categories
      .filter((c) =>
        ["Restaurants", "Fast Food & Delivery", "Coffee", "Groceries", "Alcohol & Beverages"].includes(c.name)
      )
      .map((c) => c.id)
  );
  const subCatIds = new Set(
    categories.filter((c) => c.name === "Subscriptions").map((c) => c.id)
  );
  const groceryCatIds = new Set(
    categories.filter((c) => c.name === "Groceries").map((c) => c.id)
  );

  const baseFilter = (q: ReturnType<typeof supabase.from>) =>
    q
      .select("amount, category_id, merchant_name, is_subscription, transaction_date")
      .eq("user_id", user.id)
      .eq("is_income", false)
      .eq("is_transfer", false)
      .lt("amount", 0);

  const [
    thisMonthRes,
    prevMonthRes,
    weekRes,
    prevWeekRes,
    needsReviewRes,
    incomeRes,
    recentSubRes,
    allMonthlyRes,
  ] = await Promise.all([
    baseFilter(supabase.from("transactions"))
      .gte("transaction_date", start)
      .lte("transaction_date", end),

    baseFilter(supabase.from("transactions"))
      .gte("transaction_date", prevStart)
      .lte("transaction_date", prevEnd),

    baseFilter(supabase.from("transactions"))
      .gte("transaction_date", weekStart)
      .lte("transaction_date", weekEnd),

    baseFilter(supabase.from("transactions"))
      .gte("transaction_date", prevWeekStart)
      .lte("transaction_date", prevWeekEnd),

    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("needs_review", true),

    supabase
      .from("transactions")
      .select("amount, merchant_name, transaction_date")
      .eq("user_id", user.id)
      .eq("is_income", true)
      .gt("amount", 0)
      .gte("transaction_date", start)
      .lte("transaction_date", end)
      .order("transaction_date", { ascending: false }),

    baseFilter(supabase.from("transactions"))
      .gte("transaction_date", start)
      .lte("transaction_date", end),

    supabase
      .from("transactions")
      .select("amount, category_id, transaction_date")
      .eq("user_id", user.id)
      .eq("is_income", false)
      .eq("is_transfer", false)
      .lt("amount", 0)
      .order("transaction_date", { ascending: false })
      .limit(2000),
  ]);

  const thisMonth = thisMonthRes.data ?? [];
  const prevMonthTx = prevMonthRes.data ?? [];
  const weekTx = weekRes.data ?? [];
  const prevWeekTx = prevWeekRes.data ?? [];
  const incomeTx = incomeRes.data ?? [];
  const allMonthly = allMonthlyRes.data ?? [];

  const totalSpent = sumSpending(thisMonth);
  const prevMonthSpent = sumSpending(prevMonthTx);
  const monthOverMonthChange =
    prevMonthSpent > 0 ? ((totalSpent - prevMonthSpent) / prevMonthSpent) * 100 : 0;

  const foodSpent = sumSpending(thisMonth.filter((t) => t.category_id && foodCatIds.has(t.category_id)));
  const groceriesSpent = sumSpending(thisMonth.filter((t) => t.category_id && groceryCatIds.has(t.category_id)));
  const subscriptionsSpent = sumSpending(
    thisMonth.filter((t) => t.is_subscription || (t.category_id && subCatIds.has(t.category_id)))
  );

  // Top merchants
  const merchantTotals: Record<string, number> = {};
  for (const t of thisMonth) {
    const name = (t as { merchant_name?: string }).merchant_name ?? "Unknown";
    merchantTotals[name] = (merchantTotals[name] ?? 0) + Math.abs(Number(t.amount));
  }
  const topMerchants = Object.entries(merchantTotals)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Spending by category (this month)
  const catTotals: Record<string, number> = {};
  for (const t of thisMonth) {
    const cat = t.category_id ? catMap.get(t.category_id) : undefined;
    const name = cat?.name ?? "Other";
    catTotals[name] = (catTotals[name] ?? 0) + Math.abs(Number(t.amount));
  }
  const spendingByCategory = Object.entries(catTotals)
    .map(([name, total]) => ({
      name,
      total,
      color: categories.find((c) => c.name === name)?.color ?? "#94a3b8",
    }))
    .sort((a, b) => b.total - a.total);

  // Monthly spending (last 12 months from allMonthly)
  const monthlyTotals: Record<string, number> = {};
  for (const t of allMonthly) {
    const m = t.transaction_date.slice(0, 7);
    monthlyTotals[m] = (monthlyTotals[m] ?? 0) + Math.abs(Number(t.amount));
  }
  const monthlySpending = Object.entries(monthlyTotals)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);

  // Food trend
  const foodTrendTotals: Record<string, number> = {};
  for (const t of allMonthly) {
    if (!t.category_id || !foodCatIds.has(t.category_id)) continue;
    const m = t.transaction_date.slice(0, 7);
    foodTrendTotals[m] = (foodTrendTotals[m] ?? 0) + Math.abs(Number(t.amount));
  }
  const foodTrend = Object.entries(foodTrendTotals)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);

  // Subscription items this month
  const subItemTotals: Record<string, { total: number; count: number }> = {};
  for (const t of recentSubRes.data ?? []) {
    if (!t.is_subscription && !(t.category_id && subCatIds.has(t.category_id))) continue;
    const name = (t as { merchant_name?: string }).merchant_name ?? "Unknown";
    if (!subItemTotals[name]) subItemTotals[name] = { total: 0, count: 0 };
    subItemTotals[name].total += Math.abs(Number(t.amount));
    subItemTotals[name].count += 1;
  }
  const subscriptionItems = Object.entries(subItemTotals)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total);

  return {
    totalSpent,
    prevMonthSpent,
    monthOverMonthChange,
    foodSpent,
    groceriesSpent,
    subscriptionsSpent,
    needsReviewCount: needsReviewRes.count ?? 0,
    topMerchants,
    spendingByCategory,
    monthlySpending,
    foodTrend,
    subscriptionItems,
    weeklySpent: sumSpending(weekTx),
    prevWeekSpent: sumSpending(prevWeekTx),
    monthIncome: incomeTx.reduce((s, t) => s + Number(t.amount), 0),
    incomeDeposits: incomeTx.slice(0, 5).map((t) => ({
      date: t.transaction_date,
      amount: Number(t.amount),
      merchant: (t as { merchant_name?: string }).merchant_name ?? "",
    })),
  };
}

export async function getRecentTransactionsForDashboard(
  month: string
): Promise<TransactionWithRelations[]> {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { start, end } = getMonthRange(month);

  const { data } = await supabase
    .from("transactions")
    .select("*, accounts(*), categories(*)")
    .eq("user_id", user.id)
    .gte("transaction_date", start)
    .lte("transaction_date", end)
    .order("transaction_date", { ascending: false })
    .limit(10);

  return (data ?? []) as TransactionWithRelations[];
}

export async function getDistinctMonthsForDashboard(): Promise<string[]> {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("transaction_date")
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: true });

  if (!data?.length) return [];
  const months = [...new Set(data.map((t) => t.transaction_date.slice(0, 7)))].sort();
  return months;
}

export async function getDashboardBudgetPrefs() {
  const user = await getUser();
  if (!user) return { weeklySpendingLimit: 200, hourlyRate: 30, hoursPerWeek: 40, payFrequency: "biweekly" as const };

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("weekly_spending_limit, hourly_rate, hours_per_week, pay_frequency")
      .eq("id", user.id)
      .maybeSingle();

    if (!data) return { weeklySpendingLimit: 200, hourlyRate: 30, hoursPerWeek: 40, payFrequency: "biweekly" as const };
    return {
      weeklySpendingLimit: Number(data.weekly_spending_limit ?? 200),
      hourlyRate: Number(data.hourly_rate ?? 30),
      hoursPerWeek: Number(data.hours_per_week ?? 40),
      payFrequency: (data.pay_frequency ?? "biweekly") as "weekly" | "biweekly" | "monthly",
    };
  } catch {
    return { weeklySpendingLimit: 200, hourlyRate: 30, hoursPerWeek: 40, payFrequency: "biweekly" as const };
  }
}

function emptyStats(): DashboardStats {
  return {
    totalSpent: 0,
    prevMonthSpent: 0,
    monthOverMonthChange: 0,
    foodSpent: 0,
    groceriesSpent: 0,
    subscriptionsSpent: 0,
    needsReviewCount: 0,
    topMerchants: [],
    spendingByCategory: [],
    monthlySpending: [],
    foodTrend: [],
    subscriptionItems: [],
    weeklySpent: 0,
    prevWeekSpent: 0,
    monthIncome: 0,
    incomeDeposits: [],
  };
}

export async function getDashboardBudgets(month: string): Promise<BudgetWithSpending[]> {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data: budgets } = await supabase
    .from("budgets")
    .select("*, categories(*)")
    .eq("user_id", user.id)
    .eq("month", month);

  if (!budgets?.length) return [];

  const categoryIds = budgets.map((b) => b.category_id);
  const { start, end } = getMonthRange(month);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("category_id, amount")
    .eq("user_id", user.id)
    .in("category_id", categoryIds)
    .gte("transaction_date", start)
    .lte("transaction_date", end)
    .eq("is_income", false)
    .eq("is_transfer", false);

  const spentByCategory: Record<string, number> = {};
  for (const tx of transactions ?? []) {
    if (!tx.category_id) continue;
    spentByCategory[tx.category_id] = (spentByCategory[tx.category_id] ?? 0) + Math.abs(Number(tx.amount));
  }

  return budgets.map((b) => {
    const spent = spentByCategory[b.category_id] ?? 0;
    const limit = Number(b.limit_amount);
    return { ...b, spent, remaining: limit - spent, percentUsed: limit > 0 ? (spent / limit) * 100 : 0 };
  }) as BudgetWithSpending[];
}

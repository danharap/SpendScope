import type {
  Category,
  TransactionAnalyticsRow,
} from "@/types/database";
import {
  getCurrentMonth,
  getMonthRange,
  getPreviousMonth,
  daysInMonth,
  dayOfMonth,
  monthFromDate,
} from "@/lib/utils/format";
import { FOOD_CATEGORIES } from "@/lib/constants";

export interface DashboardStats {
  totalSpent: number;
  foodSpent: number;
  groceriesSpent: number;
  subscriptionsSpent: number;
  shoppingSpent: number;
  budgetRemaining: number;
  monthOverMonthChange: number;
  needsReviewCount: number;
  topMerchants: { name: string; total: number }[];
  spendingByCategory: { name: string; total: number; color: string }[];
  monthlySpending: { month: string; total: number }[];
  foodTrend: { month: string; total: number }[];
  subscriptionItems: { name: string; total: number; count: number }[];
}

function isSpending(tx: TransactionAnalyticsRow): boolean {
  return !tx.is_income && !tx.is_transfer && Number(tx.amount) < 0;
}

function spendingAmount(tx: TransactionAnalyticsRow): number {
  return Math.abs(Number(tx.amount));
}

export function computeDashboardStats(
  transactions: TransactionAnalyticsRow[],
  categories: Category[],
  month: string,
  budgetRemaining: number
): DashboardStats {
  const { start, end } = getMonthRange(month);
  const prevMonth = getPreviousMonth(month);
  const { start: prevStart, end: prevEnd } = getMonthRange(prevMonth);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const foodCategoryIds = new Set(
    categories.filter((c) => FOOD_CATEGORIES.includes(c.name as typeof FOOD_CATEGORIES[number])).map((c) => c.id)
  );

  const thisMonth = transactions.filter(
    (t) => t.transaction_date >= start && t.transaction_date <= end
  );
  const prevMonthTx = transactions.filter(
    (t) => t.transaction_date >= prevStart && t.transaction_date <= prevEnd
  );

  const thisMonthSpending = thisMonth.filter(isSpending);
  const prevMonthSpending = prevMonthTx.filter(isSpending);

  const totalSpent = thisMonthSpending.reduce((s, t) => s + spendingAmount(t), 0);
  const prevTotal = prevMonthSpending.reduce((s, t) => s + spendingAmount(t), 0);
  const monthOverMonthChange =
    prevTotal > 0 ? ((totalSpent - prevTotal) / prevTotal) * 100 : 0;

  const foodSpent = thisMonthSpending
    .filter((t) => t.category_id && foodCategoryIds.has(t.category_id))
    .reduce((s, t) => s + spendingAmount(t), 0);

  const groceriesSpent = thisMonthSpending
    .filter((t) => categoryMap.get(t.category_id ?? "")?.name === "Groceries")
    .reduce((s, t) => s + spendingAmount(t), 0);

  const subscriptionsSpent = thisMonthSpending
    .filter(
      (t) =>
        categoryMap.get(t.category_id ?? "")?.name === "Subscriptions" ||
        t.is_subscription
    )
    .reduce((s, t) => s + spendingAmount(t), 0);

  const shoppingSpent = thisMonthSpending
    .filter((t) => categoryMap.get(t.category_id ?? "")?.name === "Shopping")
    .reduce((s, t) => s + spendingAmount(t), 0);

  const needsReviewCount = transactions.filter((t) => t.needs_review).length;

  const merchantTotals: Record<string, number> = {};
  for (const t of thisMonthSpending) {
    const name = t.merchant_name || "Unknown";
    merchantTotals[name] = (merchantTotals[name] ?? 0) + spendingAmount(t);
  }
  const topMerchants = Object.entries(merchantTotals)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const categoryTotals: Record<string, number> = {};
  for (const t of thisMonthSpending) {
    const cat = categoryMap.get(t.category_id ?? "");
    const name = cat?.name ?? "Other";
    categoryTotals[name] = (categoryTotals[name] ?? 0) + spendingAmount(t);
  }
  const spendingByCategory = Object.entries(categoryTotals)
    .map(([name, total]) => ({
      name,
      total,
      color: categories.find((c) => c.name === name)?.color ?? "#94a3b8",
    }))
    .sort((a, b) => b.total - a.total);

  const monthlyTotals: Record<string, number> = {};
  for (const t of transactions.filter(isSpending)) {
    const m = monthFromDate(t.transaction_date);
    monthlyTotals[m] = (monthlyTotals[m] ?? 0) + spendingAmount(t);
  }
  const monthlySpending = Object.entries(monthlyTotals)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);

  const foodTrend: Record<string, number> = {};
  for (const t of transactions.filter(isSpending)) {
    if (!t.category_id || !foodCategoryIds.has(t.category_id)) continue;
    const m = monthFromDate(t.transaction_date);
    foodTrend[m] = (foodTrend[m] ?? 0) + spendingAmount(t);
  }
  const foodTrendData = Object.entries(foodTrend)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);

  const subscriptionItems: { name: string; total: number; count: number }[] = [];
  const subTotals: Record<string, { total: number; count: number }> = {};
  for (const t of thisMonthSpending) {
    const isSub =
      t.is_subscription ||
      categoryMap.get(t.category_id ?? "")?.name === "Subscriptions";
    if (!isSub) continue;
    const name = t.merchant_name || "Unknown";
    if (!subTotals[name]) subTotals[name] = { total: 0, count: 0 };
    subTotals[name].total += spendingAmount(t);
    subTotals[name].count += 1;
  }
  for (const [name, data] of Object.entries(subTotals)) {
    subscriptionItems.push({ name, ...data });
  }
  subscriptionItems.sort((a, b) => b.total - a.total);

  return {
    totalSpent,
    foodSpent,
    groceriesSpent,
    subscriptionsSpent,
    shoppingSpent,
    budgetRemaining,
    monthOverMonthChange,
    needsReviewCount,
    topMerchants,
    spendingByCategory,
    monthlySpending: monthlySpending,
    foodTrend: foodTrendData,
    subscriptionItems,
  };
}

export function computeBudgetRemaining(
  budgets: { limit_amount: number; spent: number }[]
): number {
  return budgets.reduce(
    (sum, b) => sum + Math.max(0, Number(b.limit_amount) - b.spent),
    0
  );
}

export interface Insight {
  id: string;
  text: string;
  type: "info" | "warning" | "success";
}

export function generateInsights(
  transactions: TransactionAnalyticsRow[],
  categories: Category[],
  month: string
): Insight[] {
  const insights: Insight[] = [];
  const { start, end } = getMonthRange(month);
  const prevMonth = getPreviousMonth(month);
  const { start: prevStart, end: prevEnd } = getMonthRange(prevMonth);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const spending = transactions.filter(
    (t) =>
      !t.is_income &&
      !t.is_transfer &&
      Number(t.amount) < 0 &&
      t.transaction_date >= start &&
      t.transaction_date <= end
  );

  const prevSpending = transactions.filter(
    (t) =>
      !t.is_income &&
      !t.is_transfer &&
      Number(t.amount) < 0 &&
      t.transaction_date >= prevStart &&
      t.transaction_date <= prevEnd
  );

  const sumByCategory = (txs: TransactionAnalyticsRow[], catName: string) =>
    txs
      .filter((t) => categoryMap.get(t.category_id ?? "")?.name === catName)
      .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

  const restaurants = sumByCategory(spending, "Restaurants");
  if (restaurants > 0) {
    insights.push({
      id: "restaurants",
      text: `You spent $${restaurants.toFixed(2)} on restaurants this month.`,
      type: "info",
    });
  }

  const delivery = sumByCategory(spending, "Fast Food & Delivery");
  const prevDelivery = sumByCategory(prevSpending, "Fast Food & Delivery");
  if (delivery > 0 && prevDelivery > 0) {
    const change = ((delivery - prevDelivery) / prevDelivery) * 100;
    insights.push({
      id: "delivery",
      text: `Your fast food & delivery spending is ${change >= 0 ? "up" : "down"} ${Math.abs(change).toFixed(0)}% from last month.`,
      type: change > 20 ? "warning" : "info",
    });
  }

  const merchantTotals: Record<string, number> = {};
  for (const t of spending) {
    const name = t.merchant_name || "Unknown";
    merchantTotals[name] = (merchantTotals[name] ?? 0) + Math.abs(Number(t.amount));
  }
  const top = Object.entries(merchantTotals).sort((a, b) => b[1] - a[1])[0];
  if (top) {
    insights.push({
      id: "top-merchant",
      text: `Your top merchant this month is ${top[0]} ($${top[1].toFixed(2)}).`,
      type: "info",
    });
  }

  const uncategorized = transactions.filter((t) => t.needs_review).length;
  if (uncategorized > 0) {
    insights.push({
      id: "uncategorized",
      text: `You have ${uncategorized} transaction${uncategorized > 1 ? "s" : ""} needing review.`,
      type: "warning",
    });
  }

  const subs = sumByCategory(spending, "Subscriptions");
  if (subs > 0) {
    insights.push({
      id: "subscriptions",
      text: `You spent $${subs.toFixed(2)} on subscriptions this month.`,
      type: "info",
    });
  }

  const monthIncome = transactions
    .filter(
      (t) =>
        t.is_income &&
        Number(t.amount) > 0 &&
        t.transaction_date >= start &&
        t.transaction_date <= end
    )
    .reduce((s, t) => s + Number(t.amount), 0);

  if (monthIncome > 0) {
    insights.push({
      id: "income",
      text: `You received $${monthIncome.toFixed(2)} in deposits this month from your uploaded CSV.`,
      type: "success",
    });
  }

  const days = dayOfMonth();
  const totalSpent = spending.reduce(
    (s, t) => s + Math.abs(Number(t.amount)),
    0
  );
  const avgDaily = days > 0 ? totalSpent / days : 0;
  insights.push({
    id: "avg-daily",
    text: `Your average daily spend this month is $${avgDaily.toFixed(2)}.`,
    type: "info",
  });

  const dim = daysInMonth(month);
  const pace = days > 0 ? (totalSpent / days) * dim : 0;
  insights.push({
    id: "pace",
    text: `You are on pace to spend $${pace.toFixed(2)} this month.`,
    type: pace > totalSpent * 1.2 ? "warning" : "info",
  });

  const fastFood = sumByCategory(spending, "Fast Food & Delivery");
  const coffee = sumByCategory(spending, "Coffee");
  if (fastFood + coffee > 0) {
    insights.push({
      id: "junk",
      text: `You spent $${(fastFood + coffee).toFixed(2)} on fast food and coffee combined.`,
      type: fastFood + coffee > 150 ? "warning" : "info",
    });
  }

  return insights;
}

export { getCurrentMonth };

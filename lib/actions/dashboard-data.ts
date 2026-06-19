"use server";

import { getCategories } from "@/lib/actions/accounts";
import {
  getRecentTransactions,
  getTransactionsForAnalytics,
} from "@/lib/actions/transactions";
import { getBudgets } from "@/lib/actions/budgets";
import { getBudgetPreferences } from "@/lib/actions/settings";
import type { BudgetPreferences } from "@/lib/analytics/income-budget";
import type { BudgetWithSpending, Category, TransactionAnalyticsRow, TransactionWithRelations } from "@/types/database";

export interface DashboardPageData {
  month: string;
  categories: Category[];
  analyticsRows: TransactionAnalyticsRow[];
  budgets: BudgetWithSpending[];
  budgetPrefs: BudgetPreferences;
  recentTransactions: TransactionWithRelations[];
  loadErrors: string[];
}

async function safe<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T,
  errors: string[]
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`dashboard.${label}:`, message);
    errors.push(`${label}: ${message}`);
    return fallback;
  }
}

export async function loadDashboardPageData(month: string): Promise<DashboardPageData> {
  const loadErrors: string[] = [];

  const [categories, analyticsRows, budgets, budgetPrefs, recentTransactions] =
    await Promise.all([
      safe("categories", getCategories, [], loadErrors),
      safe("analytics", getTransactionsForAnalytics, [], loadErrors),
      safe("budgets", () => getBudgets(month), [], loadErrors),
      safe("budgetPrefs", getBudgetPreferences, {
        weeklySpendingLimit: 200,
        hourlyRate: 30,
        hoursPerWeek: 40,
        payFrequency: "biweekly" as const,
      }, loadErrors),
      safe("recentTransactions", () => getRecentTransactions(month, 10), [], loadErrors),
    ]);

  return {
    month,
    categories,
    analyticsRows,
    budgets,
    budgetPrefs,
    recentTransactions,
    loadErrors,
  };
}

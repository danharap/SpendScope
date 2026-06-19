"use server";

import { createClient, getUser } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getBudgets(month: string) {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data: budgets } = await supabase
    .from("budgets")
    .select("*, categories(*)")
    .eq("user_id", user.id)
    .eq("month", month);

  if (!budgets?.length) return [];

  const startDate = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const endDate = new Date(y, m, 0).toISOString().slice(0, 10);

  // Split into category-specific and general budgets
  const categoryBudgets = budgets.filter((b) => b.category_id);
  const generalBudgets = budgets.filter((b) => !b.category_id);

  // Spending per category (for category-specific budgets)
  const spentByCategory: Record<string, number> = {};
  if (categoryBudgets.length > 0) {
    const categoryIds = categoryBudgets.map((b) => b.category_id!);
    const { data: transactions } = await supabase
      .from("transactions")
      .select("category_id, amount")
      .eq("user_id", user.id)
      .in("category_id", categoryIds)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate)
      .eq("is_income", false)
      .eq("is_transfer", false);

    for (const tx of transactions ?? []) {
      if (!tx.category_id) continue;
      spentByCategory[tx.category_id] =
        (spentByCategory[tx.category_id] ?? 0) + Math.abs(Number(tx.amount));
    }
  }

  // Total spending for the month (for general budgets)
  let totalMonthSpent = 0;
  if (generalBudgets.length > 0) {
    const { data: allTx } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate)
      .eq("is_income", false)
      .eq("is_transfer", false);

    totalMonthSpent = (allTx ?? []).reduce(
      (s, t) => s + Math.abs(Number(t.amount)),
      0
    );
  }

  return budgets.map((b) => {
    const spent = b.category_id
      ? (spentByCategory[b.category_id] ?? 0)
      : totalMonthSpent;
    const limit = Number(b.limit_amount);
    return {
      ...b,
      spent,
      remaining: limit - spent,
      percentUsed: limit > 0 ? (spent / limit) * 100 : 0,
    };
  });
}

/**
 * Create or update a budget.
 * Pass `categoryId = null` for the general (all-spending) monthly budget.
 */
export async function upsertBudget(
  categoryId: string | null,
  month: string,
  limitAmount: number
) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();

  // Look up an existing budget for this user / category / month
  let existingQuery = supabase
    .from("budgets")
    .select("id")
    .eq("user_id", user.id)
    .eq("month", month);

  existingQuery = categoryId
    ? existingQuery.eq("category_id", categoryId)
    : existingQuery.is("category_id", null);

  const { data: existing } = await existingQuery.maybeSingle();

  let error;
  if (existing) {
    ({ error } = await supabase
      .from("budgets")
      .update({ limit_amount: limitAmount })
      .eq("id", existing.id)
      .eq("user_id", user.id));
  } else {
    ({ error } = await supabase.from("budgets").insert({
      user_id: user.id,
      category_id: categoryId,
      month,
      limit_amount: limitAmount,
    }));
  }

  if (error) return { error: error.message };

  revalidatePath("/dashboard/budgets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteBudget(id: string) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/budgets");
  revalidatePath("/dashboard");
  return { success: true };
}

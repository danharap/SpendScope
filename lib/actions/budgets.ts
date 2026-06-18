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

  const categoryIds = budgets.map((b) => b.category_id);
  const startDate = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const endDate = new Date(y, m, 0).toISOString().slice(0, 10);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("category_id, amount")
    .eq("user_id", user.id)
    .in("category_id", categoryIds)
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate)
    .eq("is_income", false)
    .eq("is_transfer", false);

  const spentByCategory: Record<string, number> = {};
  for (const tx of transactions ?? []) {
    if (!tx.category_id) continue;
    spentByCategory[tx.category_id] =
      (spentByCategory[tx.category_id] ?? 0) + Math.abs(Number(tx.amount));
  }

  return budgets.map((b) => {
    const spent = spentByCategory[b.category_id] ?? 0;
    const limit = Number(b.limit_amount);
    return {
      ...b,
      spent,
      remaining: limit - spent,
      percentUsed: limit > 0 ? (spent / limit) * 100 : 0,
    };
  });
}

export async function upsertBudget(
  categoryId: string,
  month: string,
  limitAmount: number
) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase.from("budgets").upsert(
    {
      user_id: user.id,
      category_id: categoryId,
      month,
      limit_amount: limitAmount,
    },
    { onConflict: "user_id,category_id,month" }
  );

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
  return { success: true };
}

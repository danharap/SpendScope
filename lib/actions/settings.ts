"use server";

import { createClient, getUser } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { BudgetPreferences, PayFrequency } from "@/lib/analytics/income-budget";

const DEFAULT_PREFS: BudgetPreferences = {
  weeklySpendingLimit: 200,
  hourlyRate: 30,
  hoursPerWeek: 40,
  payFrequency: "biweekly",
};

export async function getBudgetPreferences(): Promise<BudgetPreferences> {
  const user = await getUser();
  if (!user) return DEFAULT_PREFS;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "weekly_spending_limit, hourly_rate, hours_per_week, pay_frequency"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) return DEFAULT_PREFS;

    return {
      weeklySpendingLimit: Number(data.weekly_spending_limit ?? 200),
      hourlyRate: Number(data.hourly_rate ?? 30),
      hoursPerWeek: Number(data.hours_per_week ?? 40),
      payFrequency: (data.pay_frequency as PayFrequency) ?? "biweekly",
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function updateBudgetPreferences(prefs: BudgetPreferences) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      weekly_spending_limit: prefs.weeklySpendingLimit,
      hourly_rate: prefs.hourlyRate,
      hours_per_week: prefs.hoursPerWeek,
      pay_frequency: prefs.payFrequency,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/insights");
  return { success: true };
}

export async function deleteAllUserData() {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();

  await supabase.from("transactions").delete().eq("user_id", user.id);
  await supabase.from("imports").delete().eq("user_id", user.id);
  await supabase.from("merchant_rules").delete().eq("user_id", user.id);
  await supabase.from("budgets").delete().eq("user_id", user.id);
  await supabase.from("accounts").delete().eq("user_id", user.id);
  await supabase
    .from("categories")
    .delete()
    .eq("user_id", user.id)
    .eq("is_default", false);

  revalidatePath("/dashboard");
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

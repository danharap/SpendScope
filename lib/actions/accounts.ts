"use server";

import { createClient, getUser } from "@/lib/supabase/server";
import { DEFAULT_CATEGORIES } from "@/lib/constants";

export async function ensureProfile() {
  const user = await getUser();
  if (!user) return;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
    });
  }
}

/**
 * Default categories are seeded via Supabase migrations (service role).
 * Client requests must not bulk-update transactions on every page load.
 */
export async function ensureDefaultCategories() {
  return { success: true };
}

export async function getCategories() {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .or(`is_default.eq.true,user_id.eq.${user.id}`)
    .order("name");

  if (error) {
    console.error("getCategories failed:", error.message);
    return [];
  }

  return data ?? [];
}

/** Names from migrations; used to warn if catalog is stale. */
export async function getMissingDefaultCategoryNames(): Promise<string[]> {
  const categories = await getCategories();
  const names = new Set(categories.map((c) => c.name));
  return DEFAULT_CATEGORIES.map((c) => c.name).filter((name) => !names.has(name));
}

export async function getAccounts() {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  return data ?? [];
}

export async function createAccount(
  name: string,
  accountType: string,
  institution = "RBC"
) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .insert({
      user_id: user.id,
      name,
      account_type: accountType,
      institution,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function getOrCreateAccount(
  name: string,
  accountType: string,
  institution = "RBC"
) {
  const accounts = await getAccounts();
  const existing = accounts.find((a) => a.name === name);
  if (existing) return existing;

  const result = await createAccount(name, accountType, institution);
  if (result.error || !result.data) throw new Error(result.error ?? "Failed");
  return result.data;
}

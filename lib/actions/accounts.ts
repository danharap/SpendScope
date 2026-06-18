"use server";

import { createClient, getUser } from "@/lib/supabase/server";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { revalidatePath } from "next/cache";

export async function ensureDefaultCategories() {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { count } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("is_default", true);

  if ((count ?? 0) === 0) {
    await supabase.from("categories").insert(
      DEFAULT_CATEGORIES.map((c) => ({
        name: c.name,
        color: c.color,
        icon: c.icon,
        is_default: true,
        user_id: null,
      }))
    );
  }

  return { success: true };
}

export async function getCategories() {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  await ensureDefaultCategories();

  const { data } = await supabase
    .from("categories")
    .select("*")
    .or(`is_default.eq.true,user_id.eq.${user.id}`)
    .order("name");

  return data ?? [];
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
  revalidatePath("/dashboard");
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

"use server";

import { createClient, getUser } from "@/lib/supabase/server";
import {
  DEFAULT_CATEGORIES,
  MERGED_LEGACY_CATEGORIES,
} from "@/lib/constants";
import { revalidatePath } from "next/cache";

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

async function mergeLegacyDefaultCategories(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const { data: defaults } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_default", true);

  if (!defaults?.length) return;

  for (const [legacyName, targetName] of Object.entries(
    MERGED_LEGACY_CATEGORIES
  )) {
    const source = defaults.find((c) => c.name === legacyName);
    const target = defaults.find((c) => c.name === targetName);
    if (!source || !target || source.id === target.id) continue;

    await supabase
      .from("transactions")
      .update({ category_id: target.id })
      .eq("category_id", source.id);

    await supabase
      .from("budgets")
      .update({ category_id: target.id })
      .eq("category_id", source.id);

    await supabase
      .from("merchant_rules")
      .update({ category_id: target.id })
      .eq("category_id", source.id);
  }
}

export async function ensureDefaultCategories() {
  const supabase = await createClient();

  const { data: existingDefaults } = await supabase
    .from("categories")
    .select("name")
    .eq("is_default", true);

  const existingNames = new Set(existingDefaults?.map((c) => c.name) ?? []);

  if (existingNames.size === 0) {
    await supabase.from("categories").insert(
      DEFAULT_CATEGORIES.map((c) => ({
        name: c.name,
        color: c.color,
        icon: c.icon,
        is_default: true,
        user_id: null,
      }))
    );
  } else {
    const missing = DEFAULT_CATEGORIES.filter((c) => !existingNames.has(c.name));
    if (missing.length > 0) {
      await supabase.from("categories").insert(
        missing.map((c) => ({
          name: c.name,
          color: c.color,
          icon: c.icon,
          is_default: true,
          user_id: null,
        }))
      );
    }
  }

  await mergeLegacyDefaultCategories(supabase);

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

"use server";

import { createClient, getUser } from "@/lib/supabase/server";
import type { NormalizedTransaction } from "@/types/transaction";
import { revalidatePath } from "next/cache";
import { normalizeDescription } from "@/lib/csv/dedupe";

export async function getExistingDedupeKeys(): Promise<Set<string>> {
  const user = await getUser();
  if (!user) return new Set();

  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("dedupe_key")
    .eq("user_id", user.id);

  return new Set((data ?? []).map((t) => t.dedupe_key));
}

export async function getMerchantRules() {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("merchant_rules")
    .select("*, categories(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function importTransactions(params: {
  accountId: string;
  fileName: string;
  fileHash: string;
  transactions: NormalizedTransaction[];
}) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { accountId, fileName, fileHash, transactions } = params;

  const toImport = transactions.filter((t) => t);
  const duplicatesInBatch = new Set<string>();
  const unique: NormalizedTransaction[] = [];

  for (const tx of toImport) {
    if (duplicatesInBatch.has(tx.dedupe_key)) continue;
    duplicatesInBatch.add(tx.dedupe_key);
    unique.push(tx);
  }

  const { data: existing } = await supabase
    .from("transactions")
    .select("dedupe_key")
    .eq("user_id", user.id)
    .in(
      "dedupe_key",
      unique.map((t) => t.dedupe_key)
    );

  const existingKeys = new Set((existing ?? []).map((t) => t.dedupe_key));
  const newTransactions = unique.filter((t) => !existingKeys.has(t.dedupe_key));

  const { data: importRecord, error: importError } = await supabase
    .from("imports")
    .insert({
      user_id: user.id,
      account_id: accountId,
      file_name: fileName,
      file_hash: fileHash,
      rows_total: transactions.length,
      rows_imported: newTransactions.length,
      rows_skipped: transactions.length - newTransactions.length,
    })
    .select()
    .single();

  if (importError) return { error: importError.message };

  if (newTransactions.length > 0) {
    const { error: txError } = await supabase.from("transactions").insert(
      newTransactions.map((t) => ({
        user_id: user.id,
        account_id: accountId,
        import_id: importRecord.id,
        transaction_date: t.transaction_date,
        description_raw: t.description_raw,
        merchant_name: t.merchant_name,
        amount: t.amount,
        currency: t.currency,
        category_id: t.category_id,
        subcategory: t.subcategory,
        transaction_type: t.transaction_type,
        is_income: t.is_income,
        is_transfer: t.is_transfer,
        is_subscription: t.is_subscription,
        needs_review: t.needs_review,
        dedupe_key: t.dedupe_key,
      }))
    );

    if (txError) return { error: txError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/insights");

  return {
    success: true,
    summary: {
      totalRows: transactions.length,
      imported: newTransactions.length,
      duplicatesSkipped: transactions.length - newTransactions.length,
      needsReview: newTransactions.filter((t) => t.needs_review).length,
      errors: [] as string[],
    },
  };
}

export async function updateTransaction(
  id: string,
  updates: {
    category_id?: string | null;
    is_subscription?: boolean;
    is_transfer?: boolean;
    notes?: string | null;
    needs_review?: boolean;
  }
) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  return { success: true };
}

export async function deleteTransaction(id: string) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  return { success: true };
}

export async function createMerchantRuleFromTransaction(
  transactionId: string,
  categoryId: string
) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { data: tx } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", transactionId)
    .eq("user_id", user.id)
    .single();

  if (!tx) return { error: "Transaction not found" };

  const matchText = normalizeDescription(tx.merchant_name || tx.description_raw);

  const { error } = await supabase.from("merchant_rules").upsert(
    {
      user_id: user.id,
      match_text: matchText,
      merchant_name: tx.merchant_name,
      category_id: categoryId,
      is_subscription: tx.is_subscription,
    },
    { onConflict: "user_id,match_text", ignoreDuplicates: false }
  );

  // upsert may fail without unique constraint — use insert with check
  if (error) {
    const { data: existing } = await supabase
      .from("merchant_rules")
      .select("id")
      .eq("user_id", user.id)
      .eq("match_text", matchText)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("merchant_rules")
        .update({ category_id: categoryId, merchant_name: tx.merchant_name })
        .eq("id", existing.id);
    } else {
      await supabase.from("merchant_rules").insert({
        user_id: user.id,
        match_text: matchText,
        merchant_name: tx.merchant_name,
        category_id: categoryId,
        is_subscription: tx.is_subscription,
      });
    }
  }

  revalidatePath("/dashboard/merchants");
  return { success: true };
}

export async function getTransactions(filters?: {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  categoryId?: string;
  merchant?: string;
  minAmount?: number;
  maxAmount?: number;
  needsReview?: boolean;
  isIncome?: boolean;
  subscriptionsOnly?: boolean;
  limit?: number;
}) {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select("*, accounts(*), categories(*)")
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false });

  if (filters?.startDate) query = query.gte("transaction_date", filters.startDate);
  if (filters?.endDate) query = query.lte("transaction_date", filters.endDate);
  if (filters?.accountId) query = query.eq("account_id", filters.accountId);
  if (filters?.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters?.merchant)
    query = query.ilike("merchant_name", `%${filters.merchant}%`);
  if (filters?.minAmount !== undefined)
    query = query.gte("amount", filters.minAmount);
  if (filters?.maxAmount !== undefined)
    query = query.lte("amount", filters.maxAmount);
  if (filters?.needsReview) query = query.eq("needs_review", true);
  if (filters?.isIncome !== undefined)
    query = query.eq("is_income", filters.isIncome);
  if (filters?.subscriptionsOnly)
    query = query.eq("is_subscription", true);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data } = await query;
  return data ?? [];
}

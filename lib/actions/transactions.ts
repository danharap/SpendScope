"use server";

import { createClient, getUser } from "@/lib/supabase/server";
import { recategorizeStoredTransaction } from "@/lib/categorization/engine";
import { ensureDefaultCategories, getCategories } from "@/lib/actions/accounts";
import type { NormalizedTransaction } from "@/types/transaction";
import type { TransactionWithRelations, TransactionAnalyticsRow } from "@/types/database";
import { getMonthRange } from "@/lib/utils/format";
import { revalidatePath } from "next/cache";
import {
  extractMerchantName,
  generateDedupeKey,
  normalizeDescription,
} from "@/lib/csv/dedupe";
import { categorizeTransaction } from "@/lib/categorization/engine";

const DEDUPE_CHUNK_SIZE = 200;
const PAGE_SIZE = 1000;

const ANALYTICS_COLUMNS =
  "id, transaction_date, amount, category_id, merchant_name, description_raw, is_income, is_transfer, is_subscription, needs_review";

const RELATION_COLUMNS = "*, accounts(*), categories(*)";

type TransactionFilters = {
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
};

function applyTransactionFilters<T extends ReturnType<
  Awaited<ReturnType<typeof createClient>>["from"]
>>(
  query: T,
  userId: string,
  select: string,
  filters?: TransactionFilters
) {
  let q = query
    .select(select)
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false });

  if (filters?.startDate) q = q.gte("transaction_date", filters.startDate);
  if (filters?.endDate) q = q.lte("transaction_date", filters.endDate);
  if (filters?.accountId) q = q.eq("account_id", filters.accountId);
  if (filters?.categoryId) q = q.eq("category_id", filters.categoryId);
  if (filters?.merchant)
    q = q.ilike("merchant_name", `%${filters.merchant}%`);
  if (filters?.minAmount !== undefined)
    q = q.gte("amount", filters.minAmount);
  if (filters?.maxAmount !== undefined)
    q = q.lte("amount", filters.maxAmount);
  if (filters?.needsReview) q = q.eq("needs_review", true);
  if (filters?.isIncome !== undefined)
    q = q.eq("is_income", filters.isIncome);
  if (filters?.subscriptionsOnly) q = q.eq("is_subscription", true);
  return q;
}

async function fetchAllTransactionPages<T>(
  userId: string,
  select: string,
  filters?: TransactionFilters
): Promise<T[]> {
  try {
    const supabase = await createClient();

    if (filters?.limit) {
      const { data, error } = await applyTransactionFilters(
        supabase.from("transactions"),
        userId,
        select,
        filters
      ).limit(filters.limit);
      if (error) {
        console.error("fetchAllTransactionPages(limit):", error.message);
        return [];
      }
      return (data ?? []) as T[];
    }

    const { count, error: countError } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) {
      console.error("fetchAllTransactionPages(count):", countError.message);
      return [];
    }
    if (!count) return [];

    const pageCount = Math.ceil(count / PAGE_SIZE);
    const all: T[] = [];

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
      const from = pageIndex * PAGE_SIZE;
      const { data, error } = await applyTransactionFilters(
        supabase.from("transactions"),
        userId,
        select,
        filters
      ).range(from, from + PAGE_SIZE - 1);

      if (error) {
        console.error("fetchAllTransactionPages(page):", error.message);
        break;
      }
      if (data?.length) all.push(...(data as T[]));
      if (!data?.length || data.length < PAGE_SIZE) break;
    }

    return all;
  } catch (e) {
    console.error("fetchAllTransactionPages:", e);
    return [];
  }
}

export async function getTransactionsForAnalytics(): Promise<
  TransactionAnalyticsRow[]
> {
  const user = await getUser();
  if (!user) return [];

  return fetchAllTransactionPages<TransactionAnalyticsRow>(
    user.id,
    ANALYTICS_COLUMNS
  );
}

export async function getDistinctTransactionMonths(): Promise<string[]> {
  const rows = await getTransactionsForAnalytics();
  return [...new Set(rows.map((t) => t.transaction_date.slice(0, 7)))].sort();
}

async function fetchExistingDedupeKeys(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  keys: string[]
): Promise<Set<string>> {
  const existing = new Set<string>();
  if (keys.length === 0) return existing;

  for (let i = 0; i < keys.length; i += DEDUPE_CHUNK_SIZE) {
    const chunk = keys.slice(i, i + DEDUPE_CHUNK_SIZE);
    const { data, error } = await supabase
      .from("transactions")
      .select("dedupe_key")
      .eq("user_id", userId)
      .in("dedupe_key", chunk);

    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      existing.add(row.dedupe_key);
    }
  }

  return existing;
}

/** Match on date + signed amount + normalized description (any account). */
async function fetchExistingTransactionFingerprints(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("transactions")
    .select("transaction_date, amount, description_raw")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  return new Set(
    (data ?? []).map(
      (tx) =>
        `${tx.transaction_date}|${Number(tx.amount).toFixed(2)}|${normalizeDescription(tx.description_raw)}`
    )
  );
}

function transactionFingerprint(
  date: string,
  amount: number,
  description: string
): string {
  return `${date}|${amount.toFixed(2)}|${normalizeDescription(description)}`;
}

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
  try {
    const user = await getUser();
    if (!user) return { error: "Not authenticated" };

    const supabase = await createClient();
    const { accountId, fileName, fileHash, transactions } = params;

    const duplicatesInBatch = new Set<string>();
    const unique: NormalizedTransaction[] = [];

    for (const tx of transactions) {
      if (!tx?.dedupe_key) continue;
      if (duplicatesInBatch.has(tx.dedupe_key)) continue;
      duplicatesInBatch.add(tx.dedupe_key);
      unique.push(tx);
    }

    let existingKeys = new Set<string>();
    let existingFingerprints = new Set<string>();
    if (unique.length > 0) {
      [existingKeys, existingFingerprints] = await Promise.all([
        fetchExistingDedupeKeys(
          supabase,
          user.id,
          unique.map((t) => t.dedupe_key)
        ),
        fetchExistingTransactionFingerprints(supabase, user.id),
      ]);
    }

    const newTransactions = unique.filter((t) => {
      if (existingKeys.has(t.dedupe_key)) return false;
      const fingerprint = transactionFingerprint(
        t.transaction_date,
        t.amount,
        t.description_raw
      );
      if (existingFingerprints.has(fingerprint)) return false;
      existingFingerprints.add(fingerprint);
      return true;
    });

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
    if (!importRecord) return { error: "Failed to create import record" };

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
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Import failed unexpectedly",
    };
  }
}

export async function createManualTransaction(input: {
  accountId: string;
  transactionDate: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  categoryId: string | null;
}) {
  try {
    const user = await getUser();
    if (!user) return { error: "Not authenticated" };

    const description = input.description.trim();
    if (!description) return { error: "Description is required" };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.transactionDate)) {
      return { error: "Invalid date" };
    }
    if (!input.amount || input.amount <= 0) {
      return { error: "Amount must be greater than zero" };
    }

    const supabase = await createClient();

    const { data: account } = await supabase
      .from("accounts")
      .select("id")
      .eq("id", input.accountId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!account) return { error: "Account not found" };

    const isIncome = input.type === "credit";
    const signedAmount = isIncome
      ? Math.abs(input.amount)
      : -Math.abs(input.amount);

    await ensureDefaultCategories();
    const [categories, merchantRules] = await Promise.all([
      getCategories(),
      getMerchantRules(),
    ]);

    const merchantName = extractMerchantName(description);

    let categoryId = input.categoryId;
    let needsReview = false;

    if (!categoryId) {
      const result = categorizeTransaction(
        description,
        merchantName,
        signedAmount,
        categories,
        merchantRules
      );
      categoryId = result.categoryId;
      needsReview = result.needsReview;
    }

    const dedupeKey = generateDedupeKey(
      input.transactionDate,
      description,
      signedAmount,
      input.accountId
    );

    const existingKeys = await fetchExistingDedupeKeys(supabase, user.id, [
      dedupeKey,
    ]);
    if (existingKeys.has(dedupeKey)) {
      return {
        error: "duplicate",
        message:
          "This transaction is already recorded (same date, amount, and description).",
      };
    }

    const fingerprint = transactionFingerprint(
      input.transactionDate,
      signedAmount,
      description
    );
    const existingFingerprints = await fetchExistingTransactionFingerprints(
      supabase,
      user.id
    );
    if (existingFingerprints.has(fingerprint)) {
      return {
        error: "duplicate",
        message:
          "A transaction with the same date, amount, and description already exists.",
      };
    }

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      account_id: input.accountId,
      import_id: null,
      transaction_date: input.transactionDate,
      description_raw: description,
      merchant_name: merchantName,
      amount: signedAmount,
      currency: "CAD",
      category_id: categoryId,
      subcategory: null,
      transaction_type: isIncome ? "credit" : "debit",
      is_income: isIncome,
      is_transfer: false,
      is_subscription: false,
      needs_review: needsReview,
      dedupe_key: dedupeKey,
    });

    if (error) return { error: error.message };

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/insights");

    return { success: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to add transaction",
    };
  }
}

export async function updateTransaction(
  id: string,
  updates: {
    category_id?: string | null;
    is_subscription?: boolean;
    is_transfer?: boolean;
    is_income?: boolean;
    notes?: string | null;
    needs_review?: boolean;
  }
) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const payload = { ...updates };

  if (updates.is_subscription === true) {
    await ensureDefaultCategories();
    const categories = await getCategories();
    const subCat = categories.find((c) => c.name === "Subscriptions");
    if (subCat) {
      payload.category_id = subCat.id;
      payload.needs_review = false;
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/insights");
  return { success: true };
}

const RECATEGORIZE_BATCH = 50;

export async function recategorizeTransactions(options?: {
  needsReviewOnly?: boolean;
}) {
  try {
    const user = await getUser();
    if (!user) return { error: "Not authenticated" };

    await ensureDefaultCategories();
    const [categories, merchantRules] = await Promise.all([
      getCategories(),
      getMerchantRules(),
    ]);

    const subscriptionsCat = categories.find((c) => c.name === "Subscriptions");
    const supabase = await createClient();

    let updated = 0;
    const pageSize = 500;
    let from = 0;

    while (true) {
      let query = supabase
        .from("transactions")
        .select(
          "id, description_raw, merchant_name, amount, is_subscription, is_transfer, is_income, needs_review, category_id"
        )
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false })
        .range(from, from + pageSize - 1);

      if (options?.needsReviewOnly) {
        query = query.eq("needs_review", true);
      }

      const { data, error } = await query;
      if (error) return { error: error.message };
      if (!data?.length) break;

      const pending: {
        id: string;
        payload: Record<string, unknown>;
      }[] = [];

      for (const tx of data) {
        const result = recategorizeStoredTransaction(
          tx.description_raw,
          tx.merchant_name,
          Number(tx.amount),
          categories,
          merchantRules,
          {
            is_subscription: tx.is_subscription,
            is_transfer: tx.is_transfer,
            is_income: tx.is_income,
          }
        );

        const payload: Record<string, unknown> = {};

        if (tx.is_subscription && subscriptionsCat) {
          if (tx.category_id !== subscriptionsCat.id) {
            payload.category_id = subscriptionsCat.id;
          }
          if (tx.needs_review) payload.needs_review = false;
          if (!tx.is_subscription) payload.is_subscription = true;
        } else {
          if (result.categoryId && result.categoryId !== tx.category_id) {
            payload.category_id = result.categoryId;
          }
          if (result.needsReview !== tx.needs_review) {
            payload.needs_review = result.needsReview;
          }
          if (result.isSubscription !== tx.is_subscription) {
            payload.is_subscription = result.isSubscription;
          }
        }

        if (Object.keys(payload).length > 0) {
          pending.push({ id: tx.id, payload });
        }
      }

      for (let i = 0; i < pending.length; i += RECATEGORIZE_BATCH) {
        const batch = pending.slice(i, i + RECATEGORIZE_BATCH);
        await Promise.all(
          batch.map(({ id, payload }) =>
            supabase
              .from("transactions")
              .update(payload)
              .eq("id", id)
              .eq("user_id", user.id)
          )
        );
      }

      updated += pending.length;

      if (data.length < pageSize) break;
      from += pageSize;
    }

    const { count: remaining } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("needs_review", true);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/insights");

    return {
      success: true,
      updated,
      remaining: remaining ?? 0,
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Recategorization failed",
    };
  }
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

export async function getTransactions(
  filters?: TransactionFilters
): Promise<TransactionWithRelations[]> {
  const user = await getUser();
  if (!user) return [];

  return fetchAllTransactionPages<TransactionWithRelations>(
    user.id,
    RELATION_COLUMNS,
    filters
  );
}

export async function getRecentTransactions(
  month: string,
  limit = 10
): Promise<TransactionWithRelations[]> {
  const { start, end } = getMonthRange(month);
  return getTransactions({ startDate: start, endDate: end, limit });
}

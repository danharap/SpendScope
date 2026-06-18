import type { ColumnMapping, NormalizedTransaction, ParsedCsvRow } from "@/types/transaction";
import { parseFlexibleDate, parseAmount } from "@/lib/utils/format";
import {
  extractMerchantName,
  generateDedupeKeyClient,
  normalizeDescription,
} from "@/lib/csv/dedupe";
import { buildRbcDescription, isRbcExport } from "@/lib/csv/rbc-format";
import type { Category, MerchantRule } from "@/types/database";
import { categorizeTransaction } from "@/lib/categorization/engine";

function resolveAmount(
  row: ParsedCsvRow,
  mapping: ColumnMapping,
  headers: string[]
): { amount: number | null; currency: string } {
  if (mapping.amount && row[mapping.amount] !== undefined) {
    const val = String(row[mapping.amount] ?? "").trim();
    if (val) {
      const currency = /^USD/i.test(mapping.amount) ? "USD" : "CAD";
      return { amount: parseAmount(val), currency };
    }
  }

  // RBC fallback: try CAD$ then USD$ even if mapping missed
  if (isRbcExport(headers)) {
    const cad = parseAmount(String(row["CAD$"] ?? ""));
    if (cad !== null) return { amount: cad, currency: "CAD" };
    const usd = parseAmount(String(row["USD$"] ?? ""));
    if (usd !== null) return { amount: usd, currency: "USD" };
  }

  const debit = mapping.debit ? parseAmount(String(row[mapping.debit] ?? "")) : null;
  const credit = mapping.credit
    ? parseAmount(String(row[mapping.credit] ?? ""))
    : null;

  if (debit !== null && debit !== 0) {
    return { amount: -Math.abs(debit), currency: "CAD" };
  }
  if (credit !== null && credit !== 0) {
    return { amount: Math.abs(credit), currency: "CAD" };
  }

  return { amount: null, currency: "CAD" };
}

function resolveDescription(
  row: ParsedCsvRow,
  mapping: ColumnMapping,
  headers: string[]
): string {
  const descCol = mapping.description ?? mapping.merchant ?? "";
  if (isRbcExport(headers) && descCol) {
    return buildRbcDescription(row, descCol);
  }
  return (
    String(row[mapping.description ?? ""] ?? "").trim() ||
    String(row[mapping.merchant ?? ""] ?? "").trim()
  );
}

export async function normalizeRow(
  row: ParsedCsvRow,
  mapping: ColumnMapping,
  accountId: string,
  categories: Category[],
  merchantRules: MerchantRule[],
  headers: string[] = []
): Promise<NormalizedTransaction | null> {
  const dateCol = mapping.date;
  if (!dateCol) return null;

  const dateStr = parseFlexibleDate(String(row[dateCol] ?? ""));
  if (!dateStr) return null;

  const description = resolveDescription(row, mapping, headers);
  if (!description) return null;

  const { amount, currency } = resolveAmount(row, mapping, headers);
  if (amount === null) return null;

  const merchant =
    mapping.merchant && row[mapping.merchant]
      ? String(row[mapping.merchant]).trim()
      : extractMerchantName(description);

  const transactionType = mapping.transaction_type
    ? String(row[mapping.transaction_type] ?? "")
    : null;

  const categorization = categorizeTransaction(
    description,
    merchant,
    amount,
    categories,
    merchantRules
  );

  const dedupeKey = await generateDedupeKeyClient(
    dateStr,
    description,
    amount,
    accountId
  );

  return {
    transaction_date: dateStr,
    description_raw: description,
    merchant_name: categorization.merchantName,
    amount,
    currency,
    transaction_type: transactionType,
    is_income: categorization.isIncome,
    is_transfer: categorization.isTransfer,
    is_subscription: categorization.isSubscription,
    category_id: categorization.categoryId,
    subcategory: categorization.subcategory,
    needs_review: categorization.needsReview,
    dedupe_key: dedupeKey,
  };
}

export async function normalizeRows(
  rows: ParsedCsvRow[],
  mapping: ColumnMapping,
  accountId: string,
  categories: Category[],
  merchantRules: MerchantRule[],
  existingDedupeKeys: Set<string>,
  headers: string[] = []
): Promise<{
  normalized: (NormalizedTransaction & { isDuplicate: boolean; rowIndex: number })[];
  errors: string[];
}> {
  const normalized: (NormalizedTransaction & {
    isDuplicate: boolean;
    rowIndex: number;
  })[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    try {
      const tx = await normalizeRow(
        rows[i],
        mapping,
        accountId,
        categories,
        merchantRules,
        headers
      );
      if (!tx) {
        errors.push(`Row ${i + 1}: Could not parse transaction`);
        continue;
      }
      const isDuplicate = existingDedupeKeys.has(tx.dedupe_key);
      normalized.push({ ...tx, isDuplicate, rowIndex: i });
    } catch {
      errors.push(`Row ${i + 1}: Parse error`);
    }
  }

  return { normalized, errors };
}

export { normalizeDescription };

import type { ColumnMapping } from "@/types/transaction";
import { detectRbcColumnMapping, isRbcExport } from "@/lib/csv/rbc-format";

const FIELD_PATTERNS: Record<keyof ColumnMapping, RegExp[]> = {
  date: [/transaction.?date/i, /^date$/i, /posted/i, /posting/i],
  description: [
    /description\s*1/i,
    /^description$/i,
    /details/i,
    /memo/i,
    /narrative/i,
  ],
  merchant: [/merchant/i, /payee/i, /vendor/i],
  amount: [
    /^CAD\$?$/i,
    /^USD\$?$/i,
    /^amount$/i,
    /transaction.?amount/i,
    /^cad$/i,
  ],
  debit: [/debit/i, /withdrawal/i, /money.?out/i],
  credit: [/credit/i, /deposit/i, /money.?in/i],
  balance: [/balance/i, /running/i],
  // Avoid matching "Account Type" / "Account Number" — those are RBC metadata columns
  account: [/^account name$/i, /^account number$/i],
  transaction_type: [/transaction.?type/i, /^type$/i],
};

export function detectColumnMapping(headers: string[]): ColumnMapping {
  if (isRbcExport(headers)) {
    return detectRbcColumnMapping(headers);
  }

  const mapping: ColumnMapping = {};
  const used = new Set<string>();

  // Amount columns first (higher priority)
  const priorityOrder: (keyof ColumnMapping)[] = [
    "date",
    "description",
    "amount",
    "debit",
    "credit",
    "merchant",
    "balance",
    "account",
    "transaction_type",
  ];

  for (const field of priorityOrder) {
    const patterns = FIELD_PATTERNS[field];
    for (const header of headers) {
      if (used.has(header)) continue;
      if (patterns.some((p) => p.test(header.trim()))) {
        mapping[field] = header;
        used.add(header);
        break;
      }
    }
  }

  return mapping;
}

export function isMappingComplete(mapping: ColumnMapping): boolean {
  const hasDate = Boolean(mapping.date);
  const hasDescription = Boolean(mapping.description || mapping.merchant);
  const hasAmount =
    Boolean(mapping.amount) ||
    Boolean(mapping.debit) ||
    Boolean(mapping.credit);
  return hasDate && hasDescription && hasAmount;
}

export function getMappingConfidence(mapping: ColumnMapping): number {
  let score = 0;
  if (mapping.date) score += 30;
  if (mapping.description) score += 25;
  if (mapping.merchant) score += 10;
  if (mapping.amount) score += 25;
  if (mapping.debit || mapping.credit) score += 20;
  return Math.min(score, 100);
}

export { isRbcExport } from "@/lib/csv/rbc-format";

import type { ColumnMapping } from "@/types/transaction";

const FIELD_PATTERNS: Record<keyof ColumnMapping, RegExp[]> = {
  date: [/date/i, /transaction.?date/i, /posted/i, /posting/i],
  description: [/description/i, /details/i, /memo/i, /narrative/i],
  merchant: [/merchant/i, /payee/i, /vendor/i],
  amount: [/^amount$/i, /transaction.?amount/i],
  debit: [/debit/i, /withdrawal/i, /money.?out/i],
  credit: [/credit/i, /deposit/i, /money.?in/i],
  balance: [/balance/i, /running/i],
  account: [/account/i],
  transaction_type: [/type/i, /transaction.?type/i],
};

export function detectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<string>();

  for (const [field, patterns] of Object.entries(FIELD_PATTERNS) as [
    keyof ColumnMapping,
    RegExp[],
  ][]) {
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

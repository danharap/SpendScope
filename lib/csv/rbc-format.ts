import type { ColumnMapping, ParsedCsvRow } from "@/types/transaction";
import type { AccountType } from "@/types/database";

/** RBC export headers: Account Type, Account Number, Transaction Date, ..., Description 1, CAD$, USD$ */
export function isRbcExport(headers: string[]): boolean {
  const lower = headers.map((h) => h.trim().toLowerCase());
  const hasDate = lower.some((h) => h === "transaction date");
  const hasDescription = lower.some(
    (h) => h === "description 1" || h.startsWith("description")
  );
  const hasAmount = lower.some((h) => h === "cad$" || h === "usd$" || h === "cad");
  return hasDate && hasDescription && hasAmount;
}

export function detectRbcColumnMapping(headers: string[]): ColumnMapping {
  const find = (matcher: (header: string) => boolean) =>
    headers.find(matcher);

  const amountCol =
    find((h) => /^CAD\$?$/i.test(h.trim())) ??
    find((h) => /^USD\$?$/i.test(h.trim()));

  return {
    date: find((h) => /^transaction date$/i.test(h.trim())),
    description:
      find((h) => /^description 1$/i.test(h.trim())) ??
      find((h) => /^description$/i.test(h.trim())),
    amount: amountCol,
    account: find((h) => /^account type$/i.test(h.trim())),
    transaction_type: find((h) => /^account type$/i.test(h.trim())),
  };
}

export function inferRbcAccountType(rows: ParsedCsvRow[]): AccountType {
  const sample = rows.slice(0, 5);
  for (const row of sample) {
    const type = String(row["Account Type"] ?? "").toLowerCase();
    if (/visa|mastercard|credit card|amex|american express/.test(type)) {
      return "credit_card";
    }
    if (/savings/.test(type)) {
      return "savings";
    }
  }
  return "bank";
}

export function inferRbcAccountName(rows: ParsedCsvRow[]): string {
  const type = String(rows[0]?.["Account Type"] ?? "").toLowerCase();
  if (/visa|mastercard|credit|amex/.test(type)) return "RBC Credit Card";
  if (/savings/.test(type)) return "RBC Savings";
  if (/chequing|checking/.test(type)) return "RBC Chequing";
  return "RBC Chequing";
}

/** Strip RBC boilerplate prefixes to get a clean merchant name. */
export function extractRbcMerchantName(description: string): string {
  let text = description.trim();

  const prefixes = [
    /^VISA DEBIT PURCHASE\s*-\s*\d+\s+/i,
    /^CONTACTLESS INTERAC PURCHASE\s*-\s*\d+\s+/i,
    /^INTERAC PURCHASE\s*-\s*\d+\s+/i,
    /^ONLINE BANKING TRANSFER\s*-\s*\d+\s+/i,
    /^PREAUTHORIZED DEBIT\s+/i,
    /^POINT OF SALE\s*-\s*\d+\s+/i,
    /^ATM\s+/i,
  ];

  for (const prefix of prefixes) {
    text = text.replace(prefix, "");
  }

  // Credit card rows are usually "MERCHANT NAME CITY" — drop trailing city if long
  text = text.replace(/\s+(Q\d+|#\d+).*$/i, "").trim();

  return text.trim() || description.trim();
}

export function buildRbcDescription(row: ParsedCsvRow, descCol: string): string {
  const primary = String(row[descCol] ?? "").trim();
  const secondary = String(row["Description 2"] ?? "").trim();
  if (secondary && secondary !== primary) {
    return `${primary} ${secondary}`.trim();
  }
  return primary;
}

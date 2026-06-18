import type { AccountType } from "./database";

export type CsvField =
  | "date"
  | "description"
  | "merchant"
  | "amount"
  | "debit"
  | "credit"
  | "balance"
  | "account"
  | "transaction_type";

export interface ColumnMapping {
  date?: string;
  description?: string;
  merchant?: string;
  amount?: string;
  debit?: string;
  credit?: string;
  balance?: string;
  account?: string;
  transaction_type?: string;
}

export interface ParsedCsvRow {
  [key: string]: string;
}

export interface NormalizedTransaction {
  transaction_date: string;
  description_raw: string;
  merchant_name: string;
  amount: number;
  currency: string;
  transaction_type: string | null;
  is_income: boolean;
  is_transfer: boolean;
  is_subscription: boolean;
  category_id: string | null;
  subcategory: string | null;
  needs_review: boolean;
  dedupe_key: string;
}

export interface ImportPreviewRow extends NormalizedTransaction {
  rowIndex: number;
  isDuplicate: boolean;
  categoryName?: string;
}

export interface ImportSummary {
  totalRows: number;
  imported: number;
  duplicatesSkipped: number;
  needsReview: number;
  errors: string[];
}

export interface UploadFormState {
  accountId: string;
  accountName: string;
  accountType: AccountType;
  fileName: string;
  fileHash: string;
}

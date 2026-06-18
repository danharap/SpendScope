export type AccountType = "bank" | "credit_card" | "savings" | "other";

export interface Profile {
  id: string;
  email: string | null;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  account_type: AccountType;
  institution: string;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
}

export interface Import {
  id: string;
  user_id: string;
  account_id: string;
  file_name: string;
  file_hash: string;
  rows_total: number;
  rows_imported: number;
  rows_skipped: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  import_id: string | null;
  transaction_date: string;
  description_raw: string;
  merchant_name: string;
  amount: number;
  currency: string;
  category_id: string | null;
  subcategory: string | null;
  transaction_type: string | null;
  is_income: boolean;
  is_transfer: boolean;
  is_subscription: boolean;
  needs_review: boolean;
  notes: string | null;
  dedupe_key: string;
  created_at: string;
  updated_at: string;
}

export interface MerchantRule {
  id: string;
  user_id: string;
  match_text: string;
  merchant_name: string;
  category_id: string | null;
  subcategory: string | null;
  is_subscription: boolean;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: string;
  limit_amount: number;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithRelations extends Transaction {
  accounts?: Account | null;
  categories?: Category | null;
}

export interface BudgetWithSpending extends Budget {
  categories?: Category | null;
  spent: number;
  remaining: number;
  percentUsed: number;
}

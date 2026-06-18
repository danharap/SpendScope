import type { Category, MerchantRule } from "@/types/database";
import { normalizeDescription, extractMerchantName } from "@/lib/csv/dedupe";
import {
  MERCHANT_KEYWORD_RULES,
  SUBSCRIPTION_KEYWORDS,
  TRANSFER_KEYWORDS,
} from "@/lib/categorization/rules";

export interface CategorizationResult {
  categoryId: string | null;
  categoryName: string;
  subcategory: string | null;
  merchantName: string;
  isIncome: boolean;
  isTransfer: boolean;
  isSubscription: boolean;
  needsReview: boolean;
}

function findCategoryByName(
  categories: Category[],
  name: string
): Category | undefined {
  return categories.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
}

function matchKeywords(text: string, keywords: string[]): boolean {
  const upper = text.toUpperCase();
  return keywords.some((kw) => upper.includes(kw));
}

export function categorizeTransaction(
  description: string,
  merchant: string,
  amount: number,
  categories: Category[],
  merchantRules: MerchantRule[] = []
): CategorizationResult {
  const normalizedDesc = normalizeDescription(description);
  const merchantName = extractMerchantName(merchant || description);
  const searchText = `${normalizedDesc} ${normalizeDescription(merchantName)}`;

  // Income detection
  if (amount > 0) {
    const transferMatch = matchKeywords(searchText, TRANSFER_KEYWORDS);
    if (transferMatch) {
      const cat = findCategoryByName(categories, "Transfers");
      return {
        categoryId: cat?.id ?? null,
        categoryName: cat?.name ?? "Transfers",
        subcategory: null,
        merchantName,
        isIncome: false,
        isTransfer: true,
        isSubscription: false,
        needsReview: false,
      };
    }

    const refundCat = findCategoryByName(categories, "Refunds");
    const incomeCat = findCategoryByName(categories, "Income");
    const isRefund =
      searchText.includes("REFUND") || searchText.includes("REVERSAL");
    const cat = isRefund ? refundCat : incomeCat;
    return {
      categoryId: cat?.id ?? null,
      categoryName: cat?.name ?? "Income",
      subcategory: null,
      merchantName,
      isIncome: true,
      isTransfer: false,
      isSubscription: false,
      needsReview: false,
    };
  }

  // User merchant rules (highest priority)
  for (const rule of merchantRules) {
    if (searchText.includes(rule.match_text.toUpperCase())) {
      const cat = categories.find((c) => c.id === rule.category_id);
      return {
        categoryId: rule.category_id,
        categoryName: cat?.name ?? "Other",
        subcategory: rule.subcategory,
        merchantName: rule.merchant_name || merchantName,
        isIncome: false,
        isTransfer: cat?.name === "Transfers",
        isSubscription: rule.is_subscription,
        needsReview: false,
      };
    }
  }

  // Transfer detection
  if (matchKeywords(searchText, TRANSFER_KEYWORDS)) {
    const cat = findCategoryByName(categories, "Transfers");
    return {
      categoryId: cat?.id ?? null,
      categoryName: cat?.name ?? "Transfers",
      subcategory: null,
      merchantName,
      isIncome: false,
      isTransfer: true,
      isSubscription: false,
      needsReview: false,
    };
  }

  // Keyword rules
  for (const [categoryName, keywords] of Object.entries(MERCHANT_KEYWORD_RULES)) {
    if (matchKeywords(searchText, keywords)) {
      const cat = findCategoryByName(categories, categoryName);
      const isSubscription =
        categoryName === "Subscriptions" ||
        matchKeywords(searchText, SUBSCRIPTION_KEYWORDS);
      return {
        categoryId: cat?.id ?? null,
        categoryName,
        subcategory: null,
        merchantName,
        isIncome: false,
        isTransfer: categoryName === "Transfers",
        isSubscription,
        needsReview: false,
      };
    }
  }

  // Unknown — needs review
  const reviewCat = findCategoryByName(categories, "Needs Review");
  return {
    categoryId: reviewCat?.id ?? null,
    categoryName: reviewCat?.name ?? "Needs Review",
    subcategory: null,
    merchantName,
    isIncome: false,
    isTransfer: false,
    isSubscription: false,
    needsReview: true,
  };
}

export function getCategoryName(
  categoryId: string | null,
  categories: Category[]
): string {
  if (!categoryId) return "Uncategorized";
  return categories.find((c) => c.id === categoryId)?.name ?? "Uncategorized";
}

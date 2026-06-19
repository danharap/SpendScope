import type { Category, MerchantRule } from "@/types/database";
import { normalizeDescription, extractMerchantName } from "@/lib/csv/dedupe";
import {
  CATEGORY_KEYWORD_RULES,
  HEURISTIC_CATEGORY_PATTERNS,
  INCOME_KEYWORDS,
  LEGACY_CATEGORY_ALIASES,
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
  const resolved = LEGACY_CATEGORY_ALIASES[name] ?? name;
  return categories.find(
    (c) => c.name.toLowerCase() === resolved.toLowerCase()
  );
}

function buildSearchTexts(description: string, merchant: string): string[] {
  const combined = `${description} ${merchant}`.trim();
  const upper = combined.toUpperCase();
  const normalized = normalizeDescription(combined);
  const spaced = upper.replace(/[^A-Z0-9]/g, " ").replace(/\s+/g, " ").trim();
  const tight = upper.replace(/[^A-Z0-9]/g, "");
  return [...new Set([normalized, upper, spaced, tight])];
}

function keywordMatches(texts: string[], keyword: string): boolean {
  const kwUpper = keyword.toUpperCase();
  const kwNorm = normalizeDescription(keyword);
  const kwTight = kwUpper.replace(/[^A-Z0-9]/g, "");

  return texts.some((text) => {
    const textTight = text.replace(/\s/g, "");
    return (
      text.includes(kwNorm) ||
      text.includes(kwUpper) ||
      (kwTight.length >= 4 && textTight.includes(kwTight))
    );
  });
}

function matchKeywords(texts: string[], keywords: string[]): boolean {
  return keywords.some((kw) => keywordMatches(texts, kw));
}

function matchHeuristicCategory(
  texts: string[],
  categories: Category[]
): Category | undefined {
  const haystack = texts.join(" ");
  for (const { category, patterns } of HEURISTIC_CATEGORY_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(haystack))) {
      const cat = findCategoryByName(categories, category);
      if (cat) return cat;
    }
  }
  return undefined;
}

function buildResult(
  categories: Category[],
  categoryName: string,
  merchantName: string,
  overrides: Partial<CategorizationResult> = {}
): CategorizationResult {
  const cat = findCategoryByName(categories, categoryName);
  const isTransfer = categoryName === "Transfers";
  const isSubscription =
    overrides.isSubscription ??
    (categoryName === "Subscriptions" ||
      matchKeywords(
        buildSearchTexts("", merchantName),
        SUBSCRIPTION_KEYWORDS
      ));

  return {
    categoryId: cat?.id ?? null,
    categoryName: cat?.name ?? categoryName,
    subcategory: overrides.subcategory ?? null,
    merchantName,
    isIncome: overrides.isIncome ?? false,
    isTransfer: overrides.isTransfer ?? isTransfer,
    isSubscription,
    needsReview: overrides.needsReview ?? false,
  };
}

function applySubscriptionOverride(
  categories: Category[],
  result: CategorizationResult,
  searchTexts: string[]
): CategorizationResult {
  const isSub =
    result.isSubscription || matchKeywords(searchTexts, SUBSCRIPTION_KEYWORDS);
  if (!isSub) return result;

  const subCat = findCategoryByName(categories, "Subscriptions");
  return {
    ...result,
    categoryId: subCat?.id ?? result.categoryId,
    categoryName: subCat?.name ?? "Subscriptions",
    isSubscription: true,
    needsReview: false,
  };
}

export function categorizeTransaction(
  description: string,
  merchant: string,
  amount: number,
  categories: Category[],
  merchantRules: MerchantRule[] = [],
  options?: { forceSubscription?: boolean }
): CategorizationResult {
  const merchantName = extractMerchantName(merchant || description);
  const searchTexts = buildSearchTexts(description, merchantName);

  // Income & deposit detection (positive amounts)
  if (amount > 0) {
    const refundCat = findCategoryByName(categories, "Refunds");
    const incomeCat = findCategoryByName(categories, "Income");
    const isRefund =
      searchTexts.some(
        (t) => t.includes("REFUND") || t.includes("REVERSAL")
      );

    if (isRefund) {
      return buildResult(categories, "Refunds", merchantName, {
        isIncome: false,
        needsReview: false,
      });
    }

    if (matchKeywords(searchTexts, INCOME_KEYWORDS)) {
      return buildResult(categories, "Income", merchantName, {
        isIncome: true,
        subcategory: "Payroll / Deposit",
        needsReview: false,
      });
    }

    if (matchKeywords(searchTexts, TRANSFER_KEYWORDS)) {
      return buildResult(categories, "Transfers", merchantName, {
        isTransfer: true,
        needsReview: false,
      });
    }

    // Unrecognized deposit — assume income rather than flagging for review
    return buildResult(categories, "Income", merchantName, {
      isIncome: true,
      needsReview: false,
    });
  }

  // User merchant rules (highest priority for spending)
  for (const rule of merchantRules) {
    if (searchTexts.some((t) => t.includes(rule.match_text.toUpperCase()))) {
      const cat = categories.find((c) => c.id === rule.category_id);
      const categoryName = cat?.name ?? "Other";
      let result = buildResult(categories, categoryName, rule.merchant_name || merchantName, {
        subcategory: rule.subcategory,
        isTransfer: categoryName === "Transfers",
        isSubscription: rule.is_subscription,
        needsReview: false,
      });
      if (rule.is_subscription) {
        result = applySubscriptionOverride(categories, result, searchTexts);
      }
      return result;
    }
  }

  if (options?.forceSubscription) {
    return applySubscriptionOverride(
      categories,
      buildResult(categories, "Subscriptions", merchantName, {
        isSubscription: true,
        needsReview: false,
      }),
      searchTexts
    );
  }

  // Transfer detection
  if (matchKeywords(searchTexts, TRANSFER_KEYWORDS)) {
    return buildResult(categories, "Transfers", merchantName, {
      isTransfer: true,
      needsReview: false,
    });
  }

  // Ordered keyword rules
  for (const { category, keywords } of CATEGORY_KEYWORD_RULES) {
    if (matchKeywords(searchTexts, keywords)) {
      let result = buildResult(categories, category, merchantName, {
        isTransfer: category === "Transfers",
        isSubscription: category === "Subscriptions",
        needsReview: false,
      });
      result = applySubscriptionOverride(categories, result, searchTexts);
      return result;
    }
  }

  // Heuristic fallbacks (grill, subs, lcbo-style patterns, etc.)
  const heuristicCat = matchHeuristicCategory(searchTexts, categories);
  if (heuristicCat) {
    let result = buildResult(categories, heuristicCat.name, merchantName, {
      needsReview: false,
    });
    result = applySubscriptionOverride(categories, result, searchTexts);
    return result;
  }

  // Subscription keywords without a primary category match
  if (matchKeywords(searchTexts, SUBSCRIPTION_KEYWORDS)) {
    return applySubscriptionOverride(
      categories,
      buildResult(categories, "Subscriptions", merchantName, {
        isSubscription: true,
        needsReview: false,
      }),
      searchTexts
    );
  }

  // Amount-based food heuristic — last resort before "Other".
  // When nothing else matches, small-ticket transactions fall almost
  // exclusively into food/drink in practice. The user can always correct
  // individual items or re-run bulk recategorization.
  const absAmount = Math.abs(amount);
  if (absAmount >= 2 && absAmount < 7) {
    // Typical coffee / tea / small snack range
    return buildResult(categories, "Coffee", merchantName, { needsReview: false });
  }
  if (absAmount >= 7 && absAmount <= 60) {
    // Typical meal / takeout range — covers restaurants the keyword rules don't know
    return buildResult(categories, "Restaurants", merchantName, { needsReview: false });
  }

  // Unknown — default to Other
  return buildResult(categories, "Other", merchantName, {
    needsReview: false,
  });
}

export function getCategoryName(
  categoryId: string | null,
  categories: Category[]
): string {
  if (!categoryId) return "Uncategorized";
  return categories.find((c) => c.id === categoryId)?.name ?? "Uncategorized";
}

/** Re-run categorization for an existing stored transaction row. */
export function recategorizeStoredTransaction(
  description: string,
  merchant: string,
  amount: number,
  categories: Category[],
  merchantRules: MerchantRule[],
  existing: {
    is_subscription?: boolean;
    is_transfer?: boolean;
    is_income?: boolean;
  } = {}
): CategorizationResult {
  if (existing.is_transfer) {
    return buildResult(categories, "Transfers", merchant, {
      isTransfer: true,
      needsReview: false,
    });
  }

  if (existing.is_income) {
    return categorizeTransaction(
      description,
      merchant,
      Math.abs(amount),
      categories,
      merchantRules
    );
  }

  const result = categorizeTransaction(
    description,
    merchant,
    amount,
    categories,
    merchantRules,
    { forceSubscription: existing.is_subscription === true }
  );

  if (existing.is_subscription) {
    return applySubscriptionOverride(
      categories,
      { ...result, isSubscription: true },
      buildSearchTexts(description, merchant)
    );
  }

  return result;
}

export const DEFAULT_CATEGORIES = [
  { name: "Restaurants", color: "#f97316", icon: "utensils" },
  { name: "Fast Food & Delivery", color: "#ef4444", icon: "burger" },
  { name: "Coffee", color: "#a16207", icon: "coffee" },
  { name: "Groceries", color: "#22c55e", icon: "shopping-basket" },
  { name: "Alcohol & Beverages", color: "#9333ea", icon: "wine" },
  { name: "Shopping", color: "#8b5cf6", icon: "shopping-bag" },
  { name: "Subscriptions", color: "#3b82f6", icon: "repeat" },
  { name: "Tech & Apps", color: "#6366f1", icon: "smartphone" },
  { name: "Transportation", color: "#06b6d4", icon: "car" },
  { name: "Gas", color: "#64748b", icon: "fuel" },
  { name: "Travel", color: "#0ea5e9", icon: "plane" },
  { name: "Entertainment", color: "#ec4899", icon: "film" },
  { name: "Health", color: "#14b8a6", icon: "heart-pulse" },
  { name: "Fitness", color: "#10b981", icon: "dumbbell" },
  { name: "Pharmacy", color: "#059669", icon: "pill" },
  { name: "Personal Care", color: "#d946ef", icon: "sparkles" },
  { name: "Pets", color: "#f59e0b", icon: "paw-print" },
  { name: "Home & Garden", color: "#84cc16", icon: "home" },
  { name: "Education", color: "#2563eb", icon: "graduation-cap" },
  { name: "Bills", color: "#6b7280", icon: "receipt" },
  { name: "Rent / Housing", color: "#78716c", icon: "home" },
  { name: "Transfers", color: "#94a3b8", icon: "arrow-left-right" },
  { name: "Income", color: "#16a34a", icon: "trending-up" },
  { name: "Refunds", color: "#4ade80", icon: "rotate-ccw" },
  { name: "Other", color: "#cbd5e1", icon: "circle" },
  { name: "Needs Review", color: "#fb923c", icon: "alert-circle" },
] as const;

export const ACCOUNT_PRESETS = [
  { name: "RBC Chequing", account_type: "bank" as const, institution: "RBC" },
  { name: "RBC Savings", account_type: "savings" as const, institution: "RBC" },
  {
    name: "RBC Credit Card",
    account_type: "credit_card" as const,
    institution: "RBC",
  },
  { name: "Other", account_type: "other" as const, institution: "Other" },
];

export const FOOD_CATEGORIES = [
  "Restaurants",
  "Fast Food & Delivery",
  "Coffee",
  "Groceries",
  "Alcohol & Beverages",
];

export const SPENDING_CATEGORIES = [
  "Restaurants",
  "Fast Food & Delivery",
  "Coffee",
  "Groceries",
  "Alcohol & Beverages",
  "Shopping",
  "Subscriptions",
  "Tech & Apps",
  "Transportation",
  "Gas",
  "Travel",
  "Entertainment",
  "Health",
  "Fitness",
  "Pharmacy",
  "Personal Care",
  "Pets",
  "Home & Garden",
  "Education",
  "Bills",
  "Rent / Housing",
  "Other",
];

/** Legacy default categories merged into newer names. */
export const MERGED_LEGACY_CATEGORIES: Record<string, string> = {
  "Fast Food": "Fast Food & Delivery",
  "Food Delivery": "Fast Food & Delivery",
};

import type { TransactionAnalyticsRow } from "@/types/database";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";

export type PayFrequency = "weekly" | "biweekly" | "monthly";

export interface BudgetPreferences {
  weeklySpendingLimit: number;
  hourlyRate: number;
  hoursPerWeek: number;
  payFrequency: PayFrequency;
}

export interface IncomeSpendingStats {
  weeklySpent: number;
  weeklyLimit: number;
  weeklyRemaining: number;
  weeklyPercentUsed: number;
  weeklyOverBudget: boolean;
  prevWeekSpent: number;
  weekOverWeekChange: number;
  monthIncome: number;
  monthSpending: number;
  monthNet: number;
  estimatedPayPerPeriod: number;
  estimatedMonthlyIncome: number;
  incomeDeposits: { date: string; amount: number; merchant: string }[];
  suggestions: string[];
}

function isCasualSpending(tx: TransactionAnalyticsRow): boolean {
  return !tx.is_income && !tx.is_transfer && Number(tx.amount) < 0;
}

function spendingAmount(tx: TransactionAnalyticsRow): number {
  return Math.abs(Number(tx.amount));
}

export function getWeekRange(referenceDate = new Date()): {
  start: string;
  end: string;
  label: string;
} {
  const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const end = endOfWeek(referenceDate, { weekStartsOn: 1 });
  return {
    start: format(start, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
    label: `${format(start, "MMM d")} – ${format(end, "MMM d")}`,
  };
}

export function estimatePayPerPeriod(prefs: BudgetPreferences): number {
  const grossWeekly = prefs.hourlyRate * prefs.hoursPerWeek;
  switch (prefs.payFrequency) {
    case "weekly":
      return grossWeekly;
    case "biweekly":
      return grossWeekly * 2;
    case "monthly":
      return grossWeekly * (52 / 12);
    default:
      return grossWeekly * 2;
  }
}

/** Rough after-tax estimate (~75% of gross) for suggestions only */
export function estimateNetPayPerPeriod(prefs: BudgetPreferences): number {
  return estimatePayPerPeriod(prefs) * 0.75;
}

export function computeIncomeSpendingStats(
  transactions: TransactionAnalyticsRow[],
  month: string,
  prefs: BudgetPreferences
): IncomeSpendingStats {
  const monthStart = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const monthEnd = new Date(y, m, 0);
  const monthEndStr = format(monthEnd, "yyyy-MM-dd");

  const thisWeek = getWeekRange(new Date());
  const prevWeek = getWeekRange(subWeeks(new Date(), 1));

  const weekTx = transactions.filter(
    (t) =>
      t.transaction_date >= thisWeek.start &&
      t.transaction_date <= thisWeek.end
  );
  const prevWeekTx = transactions.filter(
    (t) =>
      t.transaction_date >= prevWeek.start &&
      t.transaction_date <= prevWeek.end
  );
  const monthTx = transactions.filter(
    (t) => t.transaction_date >= monthStart && t.transaction_date <= monthEndStr
  );

  const weeklySpent = weekTx
    .filter(isCasualSpending)
    .reduce((s, t) => s + spendingAmount(t), 0);

  const prevWeekSpent = prevWeekTx
    .filter(isCasualSpending)
    .reduce((s, t) => s + spendingAmount(t), 0);

  const weekOverWeekChange =
    prevWeekSpent > 0
      ? ((weeklySpent - prevWeekSpent) / prevWeekSpent) * 100
      : 0;

  const weeklyLimit = prefs.weeklySpendingLimit;
  const weeklyRemaining = weeklyLimit - weeklySpent;
  const weeklyPercentUsed =
    weeklyLimit > 0 ? (weeklySpent / weeklyLimit) * 100 : 0;

  const monthIncome = monthTx
    .filter((t) => t.is_income && Number(t.amount) > 0)
    .reduce((s, t) => s + Number(t.amount), 0);

  const monthSpending = monthTx
    .filter(isCasualSpending)
    .reduce((s, t) => s + spendingAmount(t), 0);

  const incomeDeposits = monthTx
    .filter((t) => t.is_income && Number(t.amount) > 0)
    .map((t) => ({
      date: t.transaction_date,
      amount: Number(t.amount),
      merchant: t.merchant_name || t.description_raw,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const estimatedPayPerPeriod = estimateNetPayPerPeriod(prefs);
  const estimatedMonthlyIncome =
    prefs.payFrequency === "weekly"
      ? estimatedPayPerPeriod * (52 / 12)
      : prefs.payFrequency === "biweekly"
        ? estimatedPayPerPeriod * (26 / 12)
        : estimatedPayPerPeriod;

  const suggestions: string[] = [];
  const casualMonthlyBudget = weeklyLimit * (52 / 12);

  if (monthIncome > 0 && monthSpending > 0) {
    const saved = monthIncome - monthSpending;
    suggestions.push(
      saved >= 0
        ? `After casual spending, you kept ${saved >= 1000 ? `$${(saved / 1000).toFixed(1)}k` : `$${saved.toFixed(0)}`} from deposits this month before investments.`
        : `Casual spending exceeded deposits by $${Math.abs(saved).toFixed(0)} this month — review non-essential purchases.`
    );
  }

  if (weeklySpent > weeklyLimit) {
    suggestions.push(
      `You're $${(weeklySpent - weeklyLimit).toFixed(0)} over your $${weeklyLimit.toFixed(0)}/week casual spending cap. Try pausing discretionary purchases until next week.`
    );
  } else if (weeklyRemaining > 0 && weeklyRemaining < 50) {
    suggestions.push(
      `Only $${weeklyRemaining.toFixed(0)} left in your weekly casual budget — you're close to your $${weeklyLimit.toFixed(0)} limit.`
    );
  } else if (weeklyRemaining >= weeklyLimit * 0.3) {
    suggestions.push(
      `You have $${weeklyRemaining.toFixed(0)} left this week — on track for your $${weeklyLimit.toFixed(0)} casual spending goal.`
    );
  }

  if (monthIncome === 0 && incomeDeposits.length === 0) {
    suggestions.push(
      `No payroll deposits detected yet. Upload your chequing account CSV — deposits are auto-detected as income.`
    );
  } else if (monthIncome > 0) {
    const investable = monthIncome - casualMonthlyBudget;
    if (investable > 0) {
      suggestions.push(
        `Based on ~$${estimatedPayPerPeriod.toFixed(0)} bi-weekly take-home and a $${weeklyLimit}/week spending cap, you could aim to invest roughly $${investable.toFixed(0)}/month from deposits.`
      );
    }
  }

  if (weekOverWeekChange > 15) {
    suggestions.push(
      `Casual spending is up ${weekOverWeekChange.toFixed(0)}% vs last week — check food delivery and shopping categories.`
    );
  }

  return {
    weeklySpent,
    weeklyLimit,
    weeklyRemaining,
    weeklyPercentUsed,
    weeklyOverBudget: weeklySpent > weeklyLimit,
    prevWeekSpent,
    weekOverWeekChange,
    monthIncome,
    monthSpending,
    monthNet: monthIncome - monthSpending,
    estimatedPayPerPeriod,
    estimatedMonthlyIncome,
    incomeDeposits,
    suggestions: suggestions.slice(0, 4),
  };
}

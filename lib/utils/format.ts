import { format, parse, parseISO, isValid } from "date-fns";

const DATE_FORMATS = [
  "yyyy-MM-dd",
  "MM/dd/yyyy",
  "dd/MM/yyyy",
  "M/d/yyyy",
  "d/M/yyyy",
  "yyyy/MM/dd",
  "MMM d, yyyy",
  "MMMM d, yyyy",
];

export function formatCurrency(amount: number, currency = "CAD"): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return format(date, "MMMM yyyy");
}

export function getCurrentMonth(): string {
  return format(new Date(), "yyyy-MM");
}

export function getMonthRange(month: string): { start: string; end: string } {
  const [year, m] = month.split("-").map(Number);
  const start = new Date(year, m - 1, 1);
  const end = new Date(year, m, 0);
  return {
    start: format(start, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
  };
}

export function parseFlexibleDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const d = parseISO(trimmed.slice(0, 10));
    if (isValid(d)) return format(d, "yyyy-MM-dd");
  }

  for (const fmt of DATE_FORMATS) {
    const d = parse(trimmed, fmt, new Date());
    if (isValid(d)) return format(d, "yyyy-MM-dd");
  }

  const fallback = new Date(trimmed);
  if (isValid(fallback)) return format(fallback, "yyyy-MM-dd");

  return null;
}

export function parseAmount(value: string): number | null {
  if (!value || !value.trim()) return null;
  const cleaned = value
    .replace(/[,$\s]/g, "")
    .replace(/[()]/g, "")
    .replace(/CR$/i, "")
    .trim();
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

export function monthFromDate(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function getPreviousMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m - 2, 1);
  return format(d, "yyyy-MM");
}

export function daysInMonth(month: string): number {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m, 0).getDate();
}

export function dayOfMonth(): number {
  return new Date().getDate();
}

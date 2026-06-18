import { createHash } from "crypto";

export function normalizeDescription(description: string): string {
  return description
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractMerchantName(description: string): string {
  const normalized = normalizeDescription(description);
  // Take first meaningful segment before common separators
  const parts = normalized.split(/\s{2,}|#|\*/);
  return parts[0]?.trim() || normalized;
}

export function generateDedupeKey(
  transactionDate: string,
  description: string,
  amount: number,
  accountId: string
): string {
  const normalized = normalizeDescription(description);
  const amountStr = amount.toFixed(2);
  const raw = `${transactionDate}|${normalized}|${amountStr}|${accountId}`;
  return createHash("sha256").update(raw).digest("hex");
}

// Client-side dedupe key (uses Web Crypto via subtle in browser)
export async function generateDedupeKeyClient(
  transactionDate: string,
  description: string,
  amount: number,
  accountId: string
): Promise<string> {
  const normalized = normalizeDescription(description);
  const amountStr = amount.toFixed(2);
  const raw = `${transactionDate}|${normalized}|${amountStr}|${accountId}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

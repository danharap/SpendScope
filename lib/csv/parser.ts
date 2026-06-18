import Papa from "papaparse";
import type { ParsedCsvRow } from "@/types/transaction";

export interface ParseResult {
  headers: string[];
  rows: ParsedCsvRow[];
  errors: string[];
}

export function parseCsvFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<ParsedCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const errors = results.errors.map(
          (e) => `Row ${e.row ?? "?"}: ${e.message}`
        );
        resolve({
          headers,
          rows: results.data.filter((row) =>
            Object.values(row).some((v) => v && String(v).trim())
          ),
          errors,
        });
      },
      error: (error) => {
        resolve({ headers: [], rows: [], errors: [error.message] });
      },
    });
  });
}

export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

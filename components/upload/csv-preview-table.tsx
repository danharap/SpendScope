"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/design/category-badge";
import { formatCurrency } from "@/lib/utils/format";
import type { ImportPreviewRow } from "@/types/transaction";

interface CSVPreviewTableProps {
  rows: ImportPreviewRow[];
}

export function CSVPreviewTable({ rows }: CSVPreviewTableProps) {
  const preview = rows.slice(0, 20);

  return (
    <div className="card-premium overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Date</TableHead>
            <TableHead>Merchant</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {preview.map((row) => (
            <TableRow key={row.rowIndex}>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {row.transaction_date}
              </TableCell>
              <TableCell className="max-w-[140px] truncate">{row.merchant_name}</TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                {row.description_raw}
              </TableCell>
              <TableCell>
                <StatusBadge variant="neutral">{row.categoryName ?? "—"}</StatusBadge>
              </TableCell>
              <TableCell
                className={`text-right font-medium tabular-nums ${row.amount < 0 ? "text-rose-400" : "text-emerald-400"}`}
              >
                {formatCurrency(row.amount)}
              </TableCell>
              <TableCell>
                {row.isDuplicate ? (
                  <StatusBadge variant="neutral">Duplicate</StatusBadge>
                ) : row.is_income ? (
                  <StatusBadge variant="income">Income</StatusBadge>
                ) : row.needs_review ? (
                  <StatusBadge variant="review">Review</StatusBadge>
                ) : (
                  <StatusBadge variant="success">Ready</StatusBadge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length > 20 && (
        <p className="border-t border-border/50 p-3 text-center text-sm text-muted-foreground">
          Showing 20 of {rows.length} rows
        </p>
      )}
    </div>
  );
}

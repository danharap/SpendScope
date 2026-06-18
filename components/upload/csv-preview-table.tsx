"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/format";
import type { ImportPreviewRow } from "@/types/transaction";

interface CSVPreviewTableProps {
  rows: ImportPreviewRow[];
}

export function CSVPreviewTable({ rows }: CSVPreviewTableProps) {
  const preview = rows.slice(0, 20);

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
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
              <TableCell className="whitespace-nowrap">{row.transaction_date}</TableCell>
              <TableCell className="max-w-[140px] truncate">{row.merchant_name}</TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                {row.description_raw}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{row.categoryName ?? "—"}</Badge>
              </TableCell>
              <TableCell
                className={`text-right font-medium ${row.amount < 0 ? "text-red-600" : "text-emerald-600"}`}
              >
                {formatCurrency(row.amount)}
              </TableCell>
              <TableCell>
                {row.isDuplicate ? (
                  <Badge variant="outline" className="text-muted-foreground">
                    Duplicate
                  </Badge>
                ) : row.is_income ? (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    Income
                  </Badge>
                ) : row.needs_review ? (
                  <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                    Review
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    Ready
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length > 20 && (
        <p className="border-t p-3 text-center text-sm text-muted-foreground">
          Showing 20 of {rows.length} rows
        </p>
      )}
    </div>
  );
}

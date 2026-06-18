"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ColumnMapping } from "@/types/transaction";

const FIELD_LABELS: Record<keyof ColumnMapping, string> = {
  date: "Date",
  description: "Description",
  merchant: "Merchant",
  amount: "Amount",
  debit: "Debit",
  credit: "Credit",
  balance: "Balance",
  account: "Account",
  transaction_type: "Transaction Type",
};

const REQUIRED_FIELDS: (keyof ColumnMapping)[] = ["date"];
const RECOMMENDED_FIELDS: (keyof ColumnMapping)[] = [
  "description",
  "amount",
  "debit",
  "credit",
];

interface ColumnMappingDialogProps {
  open: boolean;
  headers: string[];
  mapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ColumnMappingDialog({
  open,
  headers,
  mapping,
  onMappingChange,
  onConfirm,
  onCancel,
}: ColumnMappingDialogProps) {
  const fields = [
    ...REQUIRED_FIELDS,
    ...RECOMMENDED_FIELDS,
    ...Object.keys(FIELD_LABELS).filter(
      (f) =>
        !REQUIRED_FIELDS.includes(f as keyof ColumnMapping) &&
        !RECOMMENDED_FIELDS.includes(f as keyof ColumnMapping)
    ),
  ] as (keyof ColumnMapping)[];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Map CSV Columns</DialogTitle>
          <DialogDescription>
            We couldn&apos;t automatically detect all columns. Please map your CSV
            headers to transaction fields.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {fields.map((field) => (
            <div key={field} className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor={field} className="text-right">
                {FIELD_LABELS[field]}
                {REQUIRED_FIELDS.includes(field) && (
                  <span className="text-red-500"> *</span>
                )}
              </Label>
              <Select
                value={mapping[field] ?? "__none__"}
                onValueChange={(v) =>
                  onMappingChange({
                    ...mapping,
                    [field]: v === "__none__" ? undefined : v,
                  })
                }
              >
                <SelectTrigger id={field}>
                  <SelectValue placeholder="Select column">
                    {mapping[field] ?? "— Not mapped —"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" label="— Not mapped —">
                    — Not mapped —
                  </SelectItem>
                  {headers.map((h) => (
                    <SelectItem key={h} value={h} label={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!mapping.date}>
            Confirm Mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

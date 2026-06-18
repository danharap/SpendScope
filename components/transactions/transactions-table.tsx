"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategorySelect } from "@/components/transactions/category-select";
import { EmptyState } from "@/components/design/empty-state";
import { StatusBadge } from "@/components/design/category-badge";
import { formatCurrency } from "@/lib/utils/format";
import type { Category } from "@/types/database";
import type { TransactionWithRelations } from "@/types/database";
import {
  updateTransaction,
  deleteTransaction,
  createMerchantRuleFromTransaction,
} from "@/lib/actions/transactions";
import { MoreHorizontal, Repeat, ArrowLeftRight, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

interface TransactionsTableProps {
  transactions: TransactionWithRelations[];
  categories: Category[];
  compact?: boolean;
}

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export function TransactionsTable({
  transactions,
  categories,
  compact = false,
}: TransactionsTableProps) {
  const [pending, startTransition] = useTransition();
  const [noteDialog, setNoteDialog] = useState<{
    id: string;
    notes: string;
  } | null>(null);

  const handleCategoryChange = (id: string, categoryId: string) => {
    startTransition(async () => {
      const result = await updateTransaction(id, {
        category_id: categoryId,
        needs_review: false,
      });
      if (result.error) toast.error(result.error);
      else toast.success("Category updated");
    });
  };

  const handleFlag = (id: string, flag: "subscription" | "transfer") => {
    startTransition(async () => {
      const updates =
        flag === "subscription"
          ? { is_subscription: true }
          : { is_transfer: true };
      const result = await updateTransaction(id, updates);
      if (result.error) toast.error(result.error);
      else toast.success("Transaction updated");
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    startTransition(async () => {
      const result = await deleteTransaction(id);
      if (result.error) toast.error(result.error);
      else toast.success("Transaction deleted");
    });
  };

  const handleSaveRule = (id: string, categoryId: string) => {
    startTransition(async () => {
      const result = await createMerchantRuleFromTransaction(id, categoryId);
      if (result.error) toast.error(result.error);
      else toast.success("Merchant rule saved");
    });
  };

  const handleSaveNote = () => {
    if (!noteDialog) return;
    startTransition(async () => {
      const result = await updateTransaction(noteDialog.id, {
        notes: noteDialog.notes,
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Note saved");
        setNoteDialog(null);
      }
    });
  };

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Upload}
        title="No transactions found"
        description="Upload your first RBC CSV file to start tracking your spending."
        actionLabel="Upload CSV"
        actionHref="/dashboard/upload"
        className={compact ? "border-0 bg-transparent py-10" : undefined}
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky top-0 bg-card/95 backdrop-blur-sm">Date</TableHead>
              <TableHead className="sticky top-0 bg-card/95 backdrop-blur-sm">Merchant</TableHead>
              {!compact && (
                <TableHead className="sticky top-0 bg-card/95 backdrop-blur-sm hidden md:table-cell">
                  Description
                </TableHead>
              )}
              <TableHead className="sticky top-0 bg-card/95 backdrop-blur-sm">Category</TableHead>
              <TableHead className="sticky top-0 bg-card/95 backdrop-blur-sm text-right">
                Amount
              </TableHead>
              {!compact && (
                <TableHead className="sticky top-0 bg-card/95 backdrop-blur-sm hidden lg:table-cell">
                  Account
                </TableHead>
              )}
              <TableHead className="sticky top-0 bg-card/95 backdrop-blur-sm">Flags</TableHead>
              <TableHead className="sticky top-0 w-[50px] bg-card/95 backdrop-blur-sm" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => {
              const amount = Number(tx.amount);
              const isExpense = amount < 0;
              return (
                <TableRow
                  key={tx.id}
                  className={cn(
                    "group transition-colors",
                    tx.needs_review && "bg-amber-50/40 dark:bg-amber-950/10"
                  )}
                >
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(tx.transaction_date)}
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate font-medium">
                    {tx.merchant_name}
                  </TableCell>
                  {!compact && (
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground hidden md:table-cell">
                      {tx.description_raw}
                    </TableCell>
                  )}
                  <TableCell>
                    <CategorySelect
                      categories={categories}
                      value={tx.category_id}
                      onChange={(catId) => handleCategoryChange(tx.id, catId)}
                      disabled={pending}
                    />
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-semibold tabular-nums",
                      isExpense
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {formatCurrency(amount)}
                  </TableCell>
                  {!compact && (
                    <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                      {tx.accounts?.name ?? "—"}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {tx.needs_review && (
                        <StatusBadge variant="review">Review</StatusBadge>
                      )}
                      {tx.is_subscription && (
                        <StatusBadge variant="subscription">Sub</StatusBadge>
                      )}
                      {tx.is_transfer && (
                        <StatusBadge variant="transfer">Transfer</StatusBadge>
                      )}
                      {tx.is_income && (
                        <StatusBadge variant="income">Income</StatusBadge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-70 group-hover:opacity-100"
                            aria-label="Transaction actions"
                          />
                        }
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleFlag(tx.id, "subscription")}
                        >
                          <Repeat className="mr-2 h-4 w-4" />
                          Mark as subscription
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleFlag(tx.id, "transfer")}
                        >
                          <ArrowLeftRight className="mr-2 h-4 w-4" />
                          Mark as transfer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            setNoteDialog({
                              id: tx.id,
                              notes: tx.notes ?? "",
                            })
                          }
                        >
                          Add note
                        </DropdownMenuItem>
                        {tx.category_id && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleSaveRule(tx.id, tx.category_id!)
                            }
                          >
                            Create merchant rule
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(tx.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!noteDialog}
        onOpenChange={(o) => !o && setNoteDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={noteDialog?.notes ?? ""}
              onChange={(e) =>
                setNoteDialog((prev) =>
                  prev ? { ...prev, notes: e.target.value } : null
                )
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote} disabled={pending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

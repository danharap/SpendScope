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
import { Badge } from "@/components/ui/badge";
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
import { formatCurrency } from "@/lib/utils/format";
import type { Category } from "@/types/database";
import type { TransactionWithRelations } from "@/types/database";
import {
  updateTransaction,
  deleteTransaction,
  createMerchantRuleFromTransaction,
} from "@/lib/actions/transactions";
import { MoreHorizontal, Repeat, ArrowLeftRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface TransactionsTableProps {
  transactions: TransactionWithRelations[];
  categories: Category[];
}

export function TransactionsTable({
  transactions,
  categories,
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

  const handleFlag = (
    id: string,
    flag: "subscription" | "transfer"
  ) => {
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
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <p className="text-muted-foreground">No transactions found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a CSV to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="whitespace-nowrap">
                  {tx.transaction_date}
                </TableCell>
                <TableCell className="max-w-[140px] truncate font-medium">
                  {tx.merchant_name}
                </TableCell>
                <TableCell className="max-w-[180px] truncate text-muted-foreground">
                  {tx.description_raw}
                </TableCell>
                <TableCell>
                  <CategorySelect
                    categories={categories}
                    value={tx.category_id}
                    onChange={(catId) => handleCategoryChange(tx.id, catId)}
                    disabled={pending}
                  />
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${Number(tx.amount) < 0 ? "text-red-600" : "text-emerald-600"}`}
                >
                  {formatCurrency(Number(tx.amount))}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {tx.accounts?.name ?? "—"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {tx.needs_review && (
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                        Review
                      </Badge>
                    )}
                    {tx.is_subscription && (
                      <Badge variant="secondary">Sub</Badge>
                    )}
                    {tx.is_transfer && (
                      <Badge variant="outline">Transfer</Badge>
                    )}
                    {tx.is_income && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        Income
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="h-8 w-8" />
                      }
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          handleFlag(tx.id, "subscription")
                        }
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
                        className="text-red-600"
                        onClick={() => handleDelete(tx.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
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

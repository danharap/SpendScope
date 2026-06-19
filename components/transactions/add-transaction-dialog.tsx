"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormStepper } from "@/components/design/form-stepper";
import { CategorySelect } from "@/components/transactions/category-select";
import { createManualTransaction } from "@/lib/actions/transactions";
import { categorizeTransaction } from "@/lib/categorization/engine";
import { cn } from "@/lib/utils";
import type { Account, Category } from "@/types/database";

const STEPS = ["Type", "Date", "Description", "Amount", "Category"] as const;

type TransactionType = "debit" | "credit";

interface AddTransactionDialogProps {
  accounts: Account[];
  categories: Category[];
}

function pickDefaultAccount(accounts: Account[], type: TransactionType): string {
  if (accounts.length === 0) return "";
  const preferred =
    type === "debit"
      ? accounts.find((a) => a.account_type === "credit_card") ??
        accounts.find((a) => a.account_type === "bank")
      : accounts.find((a) => a.account_type === "bank") ??
        accounts.find((a) => a.account_type === "savings");
  return preferred?.id ?? accounts[0].id;
}

export function AddTransactionDialog({
  accounts,
  categories,
}: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();

  const [type, setType] = useState<TransactionType>("debit");
  const [accountId, setAccountId] = useState(() =>
    pickDefaultAccount(accounts, "debit")
  );
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === accountId),
    [accounts, accountId]
  );

  const spendingCategories = useMemo(
    () =>
      categories.filter(
        (c) =>
          !["Income", "Refunds", "Transfers", "Needs Review"].includes(c.name)
      ),
    [categories]
  );

  const categoryOptions =
    type === "credit"
      ? categories.filter((c) =>
          ["Income", "Refunds", "Other"].includes(c.name)
        )
      : spendingCategories;

  const resetForm = () => {
    setStep(1);
    setType("debit");
    setAccountId(pickDefaultAccount(accounts, "debit"));
    setDate(format(new Date(), "yyyy-MM-dd"));
    setDescription("");
    setAmount("");
    setCategoryId(null);
    setSuggestedCategory(null);
  };

  useEffect(() => {
    if (step !== 5 || categoryId) return;

    const parsed = parseFloat(amount);
    if (!description.trim() || !parsed || parsed <= 0) return;

    const signed = type === "credit" ? parsed : -parsed;
    const result = categorizeTransaction(
      description.trim(),
      description.trim(),
      signed,
      categories
    );
    setSuggestedCategory(result.categoryId);
    setCategoryId(result.categoryId);
  }, [step, description, amount, type, categories, categoryId]);

  const canContinue = () => {
    switch (step) {
      case 1:
        return !!type && !!accountId;
      case 2:
        return !!date;
      case 3:
        return description.trim().length >= 2;
      case 4: {
        const parsed = parseFloat(amount);
        return !!parsed && parsed > 0;
      }
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;

    startTransition(async () => {
      const result = await createManualTransaction({
        accountId,
        transactionDate: date,
        description: description.trim(),
        amount: parsed,
        type,
        categoryId,
      });

      if (result.error === "duplicate") {
        toast.error(result.message ?? "This transaction already exists.");
        return;
      }
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Transaction added");
      setOpen(false);
      resetForm();
    });
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetForm();
  };

  if (accounts.length === 0) {
    return (
      <Button disabled className="gap-2">
        <Plus className="h-4 w-4" aria-hidden />
        Add transaction
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Plus className="h-4 w-4" aria-hidden />
            Add transaction
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Add transaction</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Step {step} of {STEPS.length} — duplicates are skipped automatically
          </p>
        </DialogHeader>

        <FormStepper steps={STEPS} currentStep={step} />

        <div className="min-h-[180px] py-2">
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setType("debit");
                    setAccountId((current) =>
                      current || pickDefaultAccount(accounts, "debit")
                    );
                  }}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-colors",
                    type === "debit"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <ArrowDownLeft
                    className={cn(
                      "h-5 w-5",
                      type === "debit" ? "text-primary" : "text-muted-foreground"
                    )}
                    aria-hidden
                  />
                  <div>
                    <p className="font-semibold">Debit</p>
                    <p className="text-xs text-muted-foreground">
                      Money out — purchases &amp; payments
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType("credit");
                    setAccountId((current) =>
                      pickDefaultAccount(accounts, "credit") || current
                    );
                  }}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-colors",
                    type === "credit"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <ArrowUpRight
                    className={cn(
                      "h-5 w-5",
                      type === "credit" ? "text-primary" : "text-muted-foreground"
                    )}
                    aria-hidden
                  />
                  <div>
                    <p className="font-semibold">Credit</p>
                    <p className="text-xs text-muted-foreground">
                      Money in — deposits &amp; refunds
                    </p>
                  </div>
                </button>
              </div>

              <div className="space-y-2">
                <Label>Account</Label>
                <Select
                  value={accountId}
                  onValueChange={(v) => v && setAccountId(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account">
                      {selectedAccount?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id} label={a.name}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <Label htmlFor="tx-date">Date</Label>
              <Input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <Label htmlFor="tx-description">Description</Label>
              <Input
                id="tx-description"
                placeholder="e.g. Cora's Burlington"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Use the merchant name as it appears on your statement
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-2">
              <Label htmlFor="tx-amount">Amount (CAD)</Label>
              <Input
                id="tx-amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="59.90"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Enter the positive amount — we&apos;ll apply debit/credit for you
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
                <p className="font-medium">{description}</p>
                <p className="mt-1 text-muted-foreground">
                  {date} · {type === "debit" ? "−" : "+"}$
                  {parseFloat(amount || "0").toFixed(2)} ·{" "}
                  {selectedAccount?.name}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <CategorySelect
                  categories={categoryOptions}
                  value={categoryId}
                  onChange={setCategoryId}
                />
                {suggestedCategory && categoryId === suggestedCategory && (
                  <p className="text-xs text-muted-foreground">
                    Auto-suggested based on the description
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter showCloseButton={false}>
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={pending}
            >
              Back
            </Button>
          )}
          {step < STEPS.length ? (
            <Button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canContinue()}
            >
              Continue
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={pending}>
              {pending ? "Adding…" : "Add transaction"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

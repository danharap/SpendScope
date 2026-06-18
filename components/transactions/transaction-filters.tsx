"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X } from "lucide-react";
import type { Category, Account } from "@/types/database";

interface TransactionFiltersProps {
  categories: Category[];
  accounts: Account[];
}

export function TransactionFilters({
  categories,
  accounts,
}: TransactionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const accountId = searchParams.get("accountId");
  const categoryId = searchParams.get("categoryId");

  const accountLabel = useMemo(() => {
    if (!accountId) return "All accounts";
    return accounts.find((a) => a.id === accountId)?.name ?? "All accounts";
  }, [accountId, accounts]);

  const categoryLabel = useMemo(() => {
    if (!categoryId) return "All categories";
    return categories.find((c) => c.id === categoryId)?.name ?? "All categories";
  }, [categoryId, categories]);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const clearFilters = () => {
    startTransition(() => {
      router.push("/dashboard/transactions");
    });
  };

  const hasActiveFilters =
    searchParams.get("startDate") ||
    searchParams.get("endDate") ||
    accountId ||
    categoryId ||
    searchParams.get("merchant") ||
    searchParams.get("needsReview") === "true" ||
    searchParams.get("subscriptionsOnly") === "true" ||
    searchParams.get("isIncome") === "true";

  return (
    <Card className="card-premium">
      <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">From</Label>
          <Input
            type="date"
            className="bg-background"
            defaultValue={searchParams.get("startDate") ?? ""}
            onChange={(e) => updateParams({ startDate: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">To</Label>
          <Input
            type="date"
            className="bg-background"
            defaultValue={searchParams.get("endDate") ?? ""}
            onChange={(e) => updateParams({ endDate: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Account</Label>
          <Select
            value={accountId ?? "__all__"}
            onValueChange={(v) =>
              updateParams({
                accountId: !v || v === "__all__" ? undefined : v,
              })
            }
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All accounts">{accountLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__" label="All accounts">
                All accounts
              </SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id} label={a.name}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Category</Label>
          <Select
            value={categoryId ?? "__all__"}
            onValueChange={(v) =>
              updateParams({
                categoryId: !v || v === "__all__" ? undefined : v,
              })
            }
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All categories">{categoryLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__" label="All categories">
                All categories
              </SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id} label={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Merchant</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
            <Input
              placeholder="Search merchant"
              className="bg-background pl-9"
              defaultValue={searchParams.get("merchant") ?? ""}
              onChange={(e) =>
                updateParams({ merchant: e.target.value || undefined })
              }
            />
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Button
            variant={searchParams.get("needsReview") === "true" ? "default" : "outline"}
            size="sm"
            onClick={() =>
              updateParams({
                needsReview:
                  searchParams.get("needsReview") === "true" ? undefined : "true",
              })
            }
          >
            Needs review
          </Button>
          <Button
            variant={searchParams.get("subscriptionsOnly") === "true" ? "default" : "outline"}
            size="sm"
            onClick={() =>
              updateParams({
                subscriptionsOnly:
                  searchParams.get("subscriptionsOnly") === "true"
                    ? undefined
                    : "true",
              })
            }
          >
            Subscriptions
          </Button>
          <Button
            variant={searchParams.get("isIncome") === "true" ? "default" : "outline"}
            size="sm"
            onClick={() =>
              updateParams({
                isIncome:
                  searchParams.get("isIncome") === "true" ? undefined : "true",
              })
            }
          >
            Income
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} disabled={pending}>
              <X className="mr-1 h-3.5 w-3.5" aria-hidden />
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

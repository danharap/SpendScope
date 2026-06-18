"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
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

  return (
    <Card className="shadow-sm">
      <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <div className="space-y-1.5">
          <Label className="text-xs">From</Label>
          <Input
            type="date"
            defaultValue={searchParams.get("startDate") ?? ""}
            onChange={(e) => updateParams({ startDate: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">To</Label>
          <Input
            type="date"
            defaultValue={searchParams.get("endDate") ?? ""}
            onChange={(e) => updateParams({ endDate: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Account</Label>
          <Select
            value={searchParams.get("accountId") ?? "__all__"}
            onValueChange={(v) =>
              updateParams({
                accountId: !v || v === "__all__" ? undefined : v,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All accounts</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Category</Label>
          <Select
            value={searchParams.get("categoryId") ?? "__all__"}
            onValueChange={(v) =>
              updateParams({
                categoryId: !v || v === "__all__" ? undefined : v,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Merchant</Label>
          <Input
            placeholder="Search merchant"
            defaultValue={searchParams.get("merchant") ?? ""}
            onChange={(e) =>
              updateParams({ merchant: e.target.value || undefined })
            }
          />
        </div>
        <div className="flex items-end gap-2">
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
          <Button variant="ghost" size="sm" onClick={clearFilters} disabled={pending}>
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

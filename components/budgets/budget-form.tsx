"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { upsertBudget } from "@/lib/actions/budgets";
import type { Category } from "@/types/database";
import { toast } from "sonner";
import { Wallet } from "lucide-react";

// Sentinel used inside the Select component to represent the null "general" budget
const GENERAL_SENTINEL = "__general__";

interface BudgetFormProps {
  categories: Category[];
  month: string;
}

export function BudgetForm({ categories, month }: BudgetFormProps) {
  const [categoryValue, setCategoryValue] = useState(GENERAL_SENTINEL);
  const [limit, setLimit] = useState("");
  const [pending, startTransition] = useTransition();

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryValue),
    [categories, categoryValue]
  );

  const displayLabel =
    categoryValue === GENERAL_SENTINEL ? "Overall (all spending)" : selectedCategory?.name;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!limit) return;

    const categoryId = categoryValue === GENERAL_SENTINEL ? null : categoryValue;

    startTransition(async () => {
      const result = await upsertBudget(categoryId, month, parseFloat(limit));
      if (result.error) toast.error(result.error);
      else {
        toast.success("Budget saved");
        setCategoryValue(GENERAL_SENTINEL);
        setLimit("");
      }
    });
  };

  return (
    <Card className="card-premium">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Set monthly budget</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1 space-y-2">
            <Label>Category</Label>
            <Select
              value={categoryValue}
              onValueChange={(v) => setCategoryValue(v ?? GENERAL_SENTINEL)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select category">
                  {displayLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {/* General budget option — always first */}
                <SelectItem
                  value={GENERAL_SENTINEL}
                  label="Overall (all spending)"
                >
                  <span className="flex items-center gap-2">
                    <Wallet className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                    Overall (all spending)
                  </span>
                </SelectItem>

                {/* Category-specific budgets */}
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id} label={c.name}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: c.color }}
                        aria-hidden
                      />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full space-y-2 sm:w-40">
            <Label>Monthly limit (CAD)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="800.00"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={pending || !limit}>
            Save Budget
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

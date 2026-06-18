"use client";

import { useState, useTransition } from "react";
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

interface BudgetFormProps {
  categories: Category[];
  month: string;
}

export function BudgetForm({ categories, month }: BudgetFormProps) {
  const [categoryId, setCategoryId] = useState("");
  const [limit, setLimit] = useState("");
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !limit) return;

    startTransition(async () => {
      const result = await upsertBudget(categoryId, month, parseFloat(limit));
      if (result.error) toast.error(result.error);
      else {
        toast.success("Budget saved");
        setCategoryId("");
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
              value={categoryId}
              onValueChange={(v) => setCategoryId(v ?? "")}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full space-y-2 sm:w-40">
            <Label>Limit (CAD)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="200.00"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={pending || !categoryId || !limit}>
            Save Budget
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { SpendingByCategoryChart } from "@/components/charts/spending-by-category-chart";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { SectionHeader } from "@/components/design/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Category, TransactionWithRelations } from "@/types/database";

interface CategoryDrilldownProps {
  spendingByCategory: { name: string; total: number; color: string }[];
  transactions: TransactionWithRelations[];
  categories: Category[];
}

export function CategoryDrilldown({
  spendingByCategory,
  transactions,
  categories,
}: CategoryDrilldownProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategoryClick = (name: string | null) => {
    setSelectedCategory(name);
  };

  const filtered = selectedCategory
    ? transactions.filter((t) => t.categories?.name === selectedCategory)
    : transactions;

  const count = filtered.length;
  const total = transactions.length;

  const sectionTitle = selectedCategory
    ? `${selectedCategory}`
    : "Transactions this month";

  const sectionDesc = selectedCategory
    ? `${count} transaction${count !== 1 ? "s" : ""} — click the segment again or another to switch`
    : `${total} transaction${total !== 1 ? "s" : ""} for this month`;

  return (
    <>
      {spendingByCategory.length > 0 && (
        <SpendingByCategoryChart
          data={spendingByCategory}
          selectedCategory={selectedCategory}
          onCategoryClick={handleCategoryClick}
        />
      )}

      <Card className="card-premium overflow-hidden">
        <SectionHeader
          title={sectionTitle}
          description={sectionDesc}
          className="border-b border-border/60 px-6 py-5"
          action={
            <div className="flex items-center gap-2">
              {selectedCategory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear filter
                </Button>
              )}
              <Link
                href="/dashboard/transactions"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                View all
              </Link>
            </div>
          }
        />
        <CardContent className="p-0">
          <TransactionsTable
            transactions={filtered}
            categories={categories}
            compact
          />
        </CardContent>
      </Card>
    </>
  );
}

"use client";

import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ImportSummary } from "@/types/transaction";
import { CheckCircle2, Copy, AlertTriangle, FileWarning } from "lucide-react";

interface ImportSummaryCardProps {
  summary: ImportSummary;
}

export function ImportSummaryCard({ summary }: ImportSummaryCardProps) {
  const items = [
    {
      label: "Total rows found",
      value: summary.totalRows,
      icon: FileWarning,
      color: "text-primary bg-primary/10",
    },
    {
      label: "Rows imported",
      value: summary.imported,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-500/10",
    },
    {
      label: "Duplicates skipped",
      value: summary.duplicatesSkipped,
      icon: Copy,
      color: "text-muted-foreground bg-muted",
    },
    {
      label: "Needs review",
      value: summary.needsReview,
      icon: AlertTriangle,
      color: "text-amber-600 bg-amber-500/10",
    },
  ];

  return (
    <Card className="card-premium overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
          </motion.div>
          Import complete
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-4"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}
              >
                <item.icon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
        {summary.errors.length > 0 && (
          <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
            <p className="text-sm font-medium text-rose-400">Errors</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-rose-400/90">
              {summary.errors.slice(0, 5).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

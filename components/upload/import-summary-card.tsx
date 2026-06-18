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
      color: "text-blue-600",
    },
    {
      label: "Rows imported",
      value: summary.imported,
      icon: CheckCircle2,
      color: "text-emerald-600",
    },
    {
      label: "Duplicates skipped",
      value: summary.duplicatesSkipped,
      icon: Copy,
      color: "text-muted-foreground",
    },
    {
      label: "Needs review",
      value: summary.needsReview,
      icon: AlertTriangle,
      color: "text-orange-600",
    },
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Import Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4"
            >
              <item.icon className={`h-5 w-5 ${item.color}`} />
              <div>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
        {summary.errors.length > 0 && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">Errors</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-red-700">
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

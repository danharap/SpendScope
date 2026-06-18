import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

interface NeedsReviewCardProps {
  count: number;
}

export function NeedsReviewCard({ count }: NeedsReviewCardProps) {
  if (count === 0) return null;

  return (
    <Card className="border-amber-200/80 bg-amber-50/60 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-amber-800 dark:text-amber-300">
          <AlertCircle className="h-5 w-5" aria-hidden />
          Transactions need review
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-amber-700 dark:text-amber-400/90">
          {count} transaction{count !== 1 ? "s" : ""} could not be automatically
          categorized. Review and assign categories to keep your dashboard accurate.
        </p>
        <Link
          href="/dashboard/transactions?needsReview=true"
          className={buttonVariants({
            size: "sm",
            variant: "outline",
            className: "shrink-0 border-amber-300 bg-white/80 hover:bg-white dark:border-amber-800 dark:bg-transparent",
          })}
        >
          Review now
        </Link>
      </CardContent>
    </Card>
  );
}

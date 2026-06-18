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
    <Card className="status-warning border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <AlertCircle className="h-5 w-5" aria-hidden />
          Transactions need review
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed opacity-90">
          {count} transaction{count !== 1 ? "s" : ""} could not be automatically
          categorized. Review and assign categories to keep your dashboard accurate.
        </p>
        <Link
          href="/dashboard/transactions?needsReview=true"
          className={buttonVariants({
            size: "sm",
            variant: "outline",
            className: "shrink-0 border-current/30 bg-card/50 hover:bg-card",
          })}
        >
          Review now
        </Link>
      </CardContent>
    </Card>
  );
}

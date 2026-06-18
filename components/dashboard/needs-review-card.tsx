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
    <Card className="border-orange-200 bg-orange-50/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-orange-800">
          <AlertCircle className="h-5 w-5" />
          Transactions need review
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <p className="text-sm text-orange-700">
          {count} transaction{count !== 1 ? "s" : ""} could not be automatically
          categorized.
        </p>
        <Link
          href="/dashboard/transactions?needsReview=true"
          className={buttonVariants({
            size: "sm",
            variant: "outline",
            className: "border-orange-300",
          })}
        >
          Review now
        </Link>
      </CardContent>
    </Card>
  );
}

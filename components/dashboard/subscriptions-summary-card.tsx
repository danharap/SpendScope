import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Repeat } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

interface SubscriptionItem {
  name: string;
  total: number;
  count: number;
}

interface SubscriptionsSummaryCardProps {
  items: SubscriptionItem[];
  total: number;
}

export function SubscriptionsSummaryCard({
  items,
  total,
}: SubscriptionsSummaryCardProps) {
  if (items.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Repeat className="h-5 w-5 text-blue-600" />
            Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No subscription charges detected this month. Upload more CSV history
            or mark transactions as subscriptions.
          </p>
          <Link
            href="/dashboard/transactions?subscriptionsOnly=true"
            className={buttonVariants({ variant: "outline", size: "sm", className: "mt-3" })}
          >
            View all subscriptions
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Repeat className="h-5 w-5 text-blue-600" />
          Subscriptions
        </CardTitle>
        <Badge variant="secondary">{formatCurrency(total)}/mo</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.slice(0, 6).map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-lg border px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium">{item.name}</p>
              {item.count > 1 && (
                <p className="text-xs text-muted-foreground">
                  {item.count} charges
                </p>
              )}
            </div>
            <span className="text-sm font-semibold text-red-600">
              {formatCurrency(item.total)}
            </span>
          </div>
        ))}
        <Link
          href="/dashboard/transactions?subscriptionsOnly=true"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Manage subscriptions
        </Link>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { HoverLift } from "@/components/design/animated";
import type { Insight } from "@/lib/analytics/dashboard";

interface InsightCardProps {
  insight: Insight;
}

const icons = {
  info: Lightbulb,
  warning: AlertTriangle,
  success: TrendingUp,
};

const styles = {
  info: "border-primary/15 bg-primary/5",
  warning: "border-amber-200/80 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20",
  success: "border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20",
};

const iconStyles = {
  info: "text-primary",
  warning: "text-amber-600 dark:text-amber-400",
  success: "text-emerald-600 dark:text-emerald-400",
};

export function InsightCard({ insight }: InsightCardProps) {
  const Icon = icons[insight.type];
  return (
    <HoverLift>
      <Card className={cn("card-premium-hover", styles[insight.type])}>
        <CardContent className="flex items-start gap-4 p-5">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background/80",
              iconStyles[insight.type]
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <p className="text-sm leading-relaxed">{insight.text}</p>
        </CardContent>
      </Card>
    </HoverLift>
  );
}

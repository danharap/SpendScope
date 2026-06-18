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
  info: "status-info",
  warning: "status-warning",
  success: "status-success",
};

export function InsightCard({ insight }: InsightCardProps) {
  const Icon = icons[insight.type];
  return (
    <HoverLift>
      <Card className={cn("card-premium-hover border", styles[insight.type])}>
        <CardContent className="flex items-start gap-4 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background/40">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <p className="text-sm leading-relaxed opacity-90">{insight.text}</p>
        </CardContent>
      </Card>
    </HoverLift>
  );
}

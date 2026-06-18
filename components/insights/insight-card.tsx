import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
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
  info: "border-blue-100 bg-blue-50/50",
  warning: "border-orange-100 bg-orange-50/50",
  success: "border-emerald-100 bg-emerald-50/50",
};

const iconStyles = {
  info: "text-blue-600",
  warning: "text-orange-600",
  success: "text-emerald-600",
};

export function InsightCard({ insight }: InsightCardProps) {
  const Icon = icons[insight.type];
  return (
    <Card className={cn("shadow-sm", styles[insight.type])}>
      <CardContent className="flex items-start gap-3 p-4">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", iconStyles[insight.type])} />
        <p className="text-sm leading-relaxed">{insight.text}</p>
      </CardContent>
    </Card>
  );
}

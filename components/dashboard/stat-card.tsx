"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HoverLift } from "@/components/design/animated";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive?: boolean };
  variant?: "default" | "success" | "warning" | "danger";
  index?: number;
}

const variantStyles = {
  default: "bg-primary/15 text-primary",
  success: "bg-emerald-500/15 text-emerald-400",
  warning: "bg-amber-500/15 text-amber-400",
  danger: "bg-rose-500/15 text-rose-400",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) {
  return (
    <HoverLift>
      <Card className="card-premium-hover overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              variantStyles[variant]
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold tracking-tight sm:text-3xl">
            {value}
          </div>
          {(subtitle || trend) && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {trend && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium",
                    trend.positive
                      ? "status-success border-0"
                      : "status-danger border-0"
                  )}
                >
                  {trend.positive ? (
                    <TrendingDown className="h-3 w-3" aria-hidden />
                  ) : (
                    <TrendingUp className="h-3 w-3" aria-hidden />
                  )}
                  {trend.value}
                </span>
              )}
              {subtitle && <span>{subtitle}</span>}
            </div>
          )}
        </CardContent>
      </Card>
    </HoverLift>
  );
}

"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartCard } from "@/components/design/chart-card";
import { formatCurrency, formatMonthLabel } from "@/lib/utils/format";

interface MonthlySpendingChartProps {
  data: { month: string; total: number }[];
}

export function MonthlySpendingChart({ data }: MonthlySpendingChartProps) {
  const chartData = data.map((d) => ({
    month: formatMonthLabel(d.month).split(" ")[0],
    total: d.total,
  }));

  return (
    <ChartCard
      title="Monthly Spending"
      description="Your spending over the last 12 months"
      empty={data.length === 0}
      emptyMessage="Upload transactions to see monthly trends"
    >
      <ChartContainer
        config={{ total: { label: "Spending", color: "var(--chart-1)" } }}
        className="h-[320px] w-full"
      >
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v}`}
            className="text-xs"
          />
          <ChartTooltip
            content={
              <ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />
            }
          />
          <Bar
            dataKey="total"
            fill="var(--color-total)"
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}

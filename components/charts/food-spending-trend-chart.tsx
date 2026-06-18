"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartCard } from "@/components/design/chart-card";
import { formatCurrency, formatMonthLabel } from "@/lib/utils/format";

interface FoodSpendingTrendChartProps {
  data: { month: string; total: number }[];
}

export function FoodSpendingTrendChart({ data }: FoodSpendingTrendChartProps) {
  const chartData = data.map((d) => ({
    month: formatMonthLabel(d.month).split(" ")[0],
    total: d.total,
  }));

  return (
    <ChartCard
      title="Food Spending Trend"
      description="Restaurants, groceries, delivery & more"
      empty={data.length === 0}
      emptyMessage="No food spending data yet"
    >
      <ChartContainer
        config={{ total: { label: "Food", color: "var(--chart-3)" } }}
        className="h-[320px] w-full"
      >
        <LineChart data={chartData}>
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
          <Line
            type="monotone"
            dataKey="total"
            stroke="var(--color-total)"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "var(--color-total)", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  );
}

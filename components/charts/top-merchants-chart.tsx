"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartCard } from "@/components/design/chart-card";
import { formatCurrency } from "@/lib/utils/format";

interface TopMerchantsChartProps {
  data: { name: string; total: number }[];
}

export function TopMerchantsChart({ data }: TopMerchantsChartProps) {
  const chartData = data.map((d) => ({
    name: d.name.length > 20 ? d.name.slice(0, 20) + "…" : d.name,
    total: d.total,
  }));

  return (
    <ChartCard
      title="Top Merchants"
      description="Where you spend the most"
      empty={data.length === 0}
      emptyMessage="No merchant data for this period"
    >
      <ChartContainer
        config={{ total: { label: "Spent", color: "var(--chart-1)" } }}
        className="h-[320px] w-full"
      >
        <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/50" />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v}`}
            className="text-xs"
          />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            width={110}
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
            radius={[0, 6, 6, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}

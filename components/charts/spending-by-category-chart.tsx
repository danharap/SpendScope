"use client";

import { PieChart, Pie, Cell, Legend } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartCard } from "@/components/design/chart-card";
import { formatCurrency } from "@/lib/utils/format";

interface SpendingByCategoryChartProps {
  data: { name: string; total: number; color: string }[];
}

export function SpendingByCategoryChart({ data }: SpendingByCategoryChartProps) {
  const chartData = data.map((d) => ({
    name: d.name,
    value: d.total,
    fill: d.color,
  }));

  const config = Object.fromEntries(
    chartData.map((d) => [d.name, { label: d.name, color: d.fill }])
  );

  return (
    <ChartCard
      title="Spending by Category"
      description="Where your money went this month"
      empty={data.length === 0}
    >
      <ChartContainer config={config} className="mx-auto h-[320px] w-full">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value) => formatCurrency(Number(value))}
              />
            }
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="45%"
            innerRadius={70}
            outerRadius={105}
            paddingAngle={3}
            strokeWidth={2}
            stroke="var(--card)"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-xs text-muted-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ChartContainer>
    </ChartCard>
  );
}

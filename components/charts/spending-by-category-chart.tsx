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
  selectedCategory?: string | null;
  onCategoryClick?: (name: string | null) => void;
}

export function SpendingByCategoryChart({
  data,
  selectedCategory,
  onCategoryClick,
}: SpendingByCategoryChartProps) {
  const chartData = data.map((d) => ({
    name: d.name,
    value: d.total,
    fill: d.color,
  }));

  const config = Object.fromEntries(
    chartData.map((d) => [d.name, { label: d.name, color: d.fill }])
  );

  const handleClick = (entry: { name?: string }) => {
    if (!onCategoryClick || !entry.name) return;
    // Toggle: clicking the same segment again clears the filter
    onCategoryClick(selectedCategory === entry.name ? null : entry.name);
  };

  const description = selectedCategory
    ? `Showing ${selectedCategory} — click again or another segment to switch`
    : onCategoryClick
    ? "Click a segment to filter transactions below"
    : "Where your money went this month";

  return (
    <ChartCard
      title="Spending by Category"
      description={description}
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
            onClick={onCategoryClick ? handleClick : undefined}
            style={onCategoryClick ? { cursor: "pointer" } : undefined}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill}
                fillOpacity={
                  !selectedCategory || selectedCategory === entry.name
                    ? 1
                    : 0.25
                }
                strokeWidth={selectedCategory === entry.name ? 3 : 2}
                stroke={
                  selectedCategory === entry.name
                    ? "rgba(255,255,255,0.6)"
                    : "var(--card)"
                }
              />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => (
              <span
                style={{
                  opacity:
                    !selectedCategory || selectedCategory === value ? 1 : 0.35,
                }}
                className="text-xs text-muted-foreground transition-opacity"
              >
                {value}
              </span>
            )}
          />
        </PieChart>
      </ChartContainer>
    </ChartCard>
  );
}

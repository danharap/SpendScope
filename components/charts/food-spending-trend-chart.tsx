"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMonthLabel } from "@/lib/utils/format";

interface FoodSpendingTrendChartProps {
  data: { month: string; total: number }[];
}

export function FoodSpendingTrendChart({ data }: FoodSpendingTrendChartProps) {
  if (data.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Food Spending Trend</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
          No food spending data yet
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    month: formatMonthLabel(d.month).split(" ")[0],
    total: d.total,
  }));

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Food Spending Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ total: { label: "Food", color: "hsl(24 95% 53%)" } }}
          className="h-[300px] w-full"
        >
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="total"
              stroke="var(--color-total)"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

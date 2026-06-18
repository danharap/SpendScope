"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMonthLabel } from "@/lib/utils/format";

interface MonthlySpendingChartProps {
  data: { month: string; total: number }[];
}

export function MonthlySpendingChart({ data }: MonthlySpendingChartProps) {
  if (data.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Monthly Spending</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
          Upload transactions to see monthly trends
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
        <CardTitle className="text-base">Monthly Spending</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ total: { label: "Spending", color: "hsl(var(--chart-1))" } }}
          className="h-[300px] w-full"
        >
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

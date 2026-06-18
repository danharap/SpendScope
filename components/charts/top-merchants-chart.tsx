"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TopMerchantsChartProps {
  data: { name: string; total: number }[];
}

export function TopMerchantsChart({ data }: TopMerchantsChartProps) {
  if (data.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Top Merchants</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
          No merchant data for this period
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    name: d.name.length > 18 ? d.name.slice(0, 18) + "…" : d.name,
    total: d.total,
  }));

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Top Merchants</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ total: { label: "Spent", color: "hsl(221 83% 53%)" } }}
          className="h-[280px] w-full"
        >
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="total" fill="var(--color-total)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

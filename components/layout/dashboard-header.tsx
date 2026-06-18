"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMonthLabel } from "@/lib/utils/format";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  showMonthSelector?: boolean;
  months?: string[];
}

export function DashboardHeader({
  title,
  description,
  showMonthSelector = true,
  months = [],
}: DashboardHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMonth = searchParams.get("month") ?? months[months.length - 1] ?? "";

  const onMonthChange = useCallback(
    (month: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("month", month);
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-white/80 px-6 backdrop-blur-sm">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-5" />
      <div className="flex flex-1 items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {showMonthSelector && months.length > 0 && (
          <Select
            value={currentMonth}
            onValueChange={(v) => v && onMonthChange(v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {[...months].reverse().map((m) => (
                <SelectItem key={m} value={m}>
                  {formatMonthLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserNav } from "@/components/layout/user-nav";
import { formatMonthLabel } from "@/lib/utils/format";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Upload, ShieldCheck } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  showMonthSelector?: boolean;
  months?: string[];
  showUploadButton?: boolean;
  showCsvBadge?: boolean;
  badge?: string;
}

export function DashboardHeader({
  title,
  description,
  showMonthSelector = true,
  months = [],
  showUploadButton = false,
  showCsvBadge = false,
  badge,
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
    <header className="sticky top-0 z-20 flex shrink-0 flex-col gap-4 border-b border-border/60 bg-background/85 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-start gap-3">
        <SidebarTrigger className="-ml-1 mt-0.5" />
        <Separator orientation="vertical" className="hidden h-6 sm:block" />
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {title}
              </h1>
              {badge && (
                <Badge variant="secondary" className="font-normal">
                  {badge}
                </Badge>
              )}
              {showCsvBadge && (
                <Badge
                  variant="outline"
                  className="gap-1 border-primary/20 bg-primary/5 font-normal text-primary"
                >
                  <ShieldCheck className="h-3 w-3" aria-hidden />
                  CSV-only tracking
                </Badge>
              )}
            </div>
            {description && (
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {showMonthSelector && months.length > 0 && (
              <Select
                value={currentMonth}
                onValueChange={(v) => v && onMonthChange(v)}
              >
                <SelectTrigger className="w-[180px] bg-card">
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
            {showUploadButton && (
              <Button render={<Link href="/dashboard/upload" />} className="gap-2">
                <Upload className="h-4 w-4" aria-hidden />
                Upload CSV
              </Button>
            )}
            <UserNav />
          </div>
        </div>
      </div>
    </header>
  );
}

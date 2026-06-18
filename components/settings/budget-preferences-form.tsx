"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateBudgetPreferences } from "@/lib/actions/settings";
import type { BudgetPreferences, PayFrequency } from "@/lib/analytics/income-budget";
import { estimateNetPayPerPeriod } from "@/lib/analytics/income-budget";
import { formatCurrency } from "@/lib/utils/format";
import { toast } from "sonner";
import { Target } from "lucide-react";

const PAY_FREQUENCY_LABELS: Record<PayFrequency, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
};

interface BudgetPreferencesFormProps {
  initial: BudgetPreferences;
}

export function BudgetPreferencesForm({ initial }: BudgetPreferencesFormProps) {
  const [prefs, setPrefs] = useState(initial);
  const [pending, startTransition] = useTransition();

  const estimatedNet = estimateNetPayPerPeriod(prefs);
  const monthlyCasualCap = prefs.weeklySpendingLimit * (52 / 12);
  const investableEstimate = estimatedNet * (prefs.payFrequency === "biweekly" ? 2 : prefs.payFrequency === "weekly" ? 4.33 : 1) - monthlyCasualCap;

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateBudgetPreferences(prefs);
      if (result.error) toast.error(result.error);
      else toast.success("Budget preferences saved");
    });
  };

  return (
    <Card className="card-premium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Target className="h-5 w-5 text-primary" aria-hidden />
          Weekly spending & income
        </CardTitle>
        <CardDescription>
          Set your casual spending cap and pay details for budget suggestions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="weeklyLimit">Weekly casual spending cap (CAD)</Label>
            <Input
              id="weeklyLimit"
              type="number"
              min={0}
              step={10}
              value={prefs.weeklySpendingLimit}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  weeklySpendingLimit: Number(e.target.value) || 0,
                }))
              }
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">
              Your target: $150–$200/week for discretionary purchases
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly rate (CAD)</Label>
            <Input
              id="hourlyRate"
              type="number"
              min={0}
              step={0.5}
              value={prefs.hourlyRate}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  hourlyRate: Number(e.target.value) || 0,
                }))
              }
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hours">Hours per week</Label>
            <Input
              id="hours"
              type="number"
              min={0}
              max={80}
              value={prefs.hoursPerWeek}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  hoursPerWeek: Number(e.target.value) || 0,
                }))
              }
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label>Pay frequency</Label>
            <Select
              value={prefs.payFrequency}
              onValueChange={(v) =>
                setPrefs((p) => ({
                  ...p,
                  payFrequency: (v as PayFrequency) ?? "biweekly",
                }))
              }
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Pay frequency">
                  {PAY_FREQUENCY_LABELS[prefs.payFrequency]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly" label="Weekly">
                  Weekly
                </SelectItem>
                <SelectItem value="biweekly" label="Bi-weekly">
                  Bi-weekly
                </SelectItem>
                <SelectItem value="monthly" label="Monthly">
                  Monthly
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm">
          <p className="font-medium">Estimated take-home per pay period</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(estimatedNet)}</p>
          <p className="mt-2 text-muted-foreground">
            Monthly casual cap: {formatCurrency(monthlyCasualCap)} · Rough room for
            investments after spending:{" "}
            {investableEstimate > 0
              ? formatCurrency(investableEstimate)
              : "tight — lower spending or adjust cap"}
          </p>
        </div>

        <Button onClick={handleSave} disabled={pending}>
          Save budget preferences
        </Button>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { recategorizeTransactions } from "@/lib/actions/transactions";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

interface RecategorizeButtonProps {
  needsReviewOnly?: boolean;
  label?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function RecategorizeButton({
  needsReviewOnly = false,
  label,
  variant = "outline",
  size = "sm",
  className,
}: RecategorizeButtonProps) {
  const [pending, startTransition] = useTransition();
  const [lastResult, setLastResult] = useState<{
    updated: number;
    remaining: number;
  } | null>(null);

  const buttonLabel =
    label ??
    (needsReviewOnly ? "Auto-categorize needs review" : "Re-run auto-categorize");

  const handleClick = () => {
    startTransition(async () => {
      const result = await recategorizeTransactions({ needsReviewOnly });
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setLastResult({
        updated: result.updated ?? 0,
        remaining: result.remaining ?? 0,
      });

      if ((result.updated ?? 0) === 0) {
        toast.info(
          needsReviewOnly
            ? "No needs-review transactions could be auto-categorized."
            : "All transactions already have the best available categories."
        );
      } else {
        toast.success(
          `Updated ${result.updated} transaction${result.updated === 1 ? "" : "s"}.` +
            (result.remaining
              ? ` ${result.remaining} still need manual review.`
              : " Everything is categorized.")
        );
      }
    });
  };

  return (
    <div className={className}>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={pending}
      >
        <Sparkles className="mr-2 h-4 w-4" aria-hidden />
        {pending ? "Categorizing…" : buttonLabel}
      </Button>
      {lastResult && lastResult.remaining > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {lastResult.remaining} transaction
          {lastResult.remaining !== 1 ? "s" : ""} still need review.
        </p>
      )}
    </div>
  );
}

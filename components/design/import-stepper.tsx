"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Review" },
  { id: 3, label: "Categorize" },
  { id: 4, label: "Complete" },
] as const;

export type ImportStep = 1 | 2 | 3 | 4;

interface ImportStepperProps {
  currentStep: ImportStep;
}

export function ImportStepper({ currentStep }: ImportStepperProps) {
  return (
    <nav aria-label="Import progress" className="w-full">
      <ol className="flex items-center justify-between gap-2">
        {STEPS.map((step, index) => {
          const isComplete = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          return (
            <li key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    isComplete &&
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      "border-primary bg-primary/10 text-primary",
                    !isComplete &&
                      !isCurrent &&
                      "border-border bg-muted/50 text-muted-foreground"
                  )}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:block",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded-full",
                    currentStep > step.id ? "bg-primary" : "bg-border"
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

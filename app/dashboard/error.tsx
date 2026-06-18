"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="h-10 w-10 text-muted-foreground" aria-hidden />
      <div>
        <h2 className="text-lg font-semibold">This page couldn&apos;t load</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A server error occurred. Reload to try again.
        </p>
      </div>
      <Button onClick={reset}>Reload</Button>
      {error.digest && (
        <p className="text-xs text-muted-foreground/60">ERROR {error.digest}</p>
      )}
    </div>
  );
}

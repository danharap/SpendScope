"use client";

import { useCallback, useState } from "react";
import { motion } from "motion/react";
import { Upload, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CSVUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function CSVUploader({ onFileSelect, disabled }: CSVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
        onFileSelect(file);
      }
    },
    [onFileSelect, disabled]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <motion.div
      animate={{
        scale: isDragging ? 1.01 : 1,
        borderColor: isDragging ? "var(--primary)" : undefined,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 sm:p-14 transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border/80 bg-card hover:border-primary/40 hover:bg-primary/[0.02]",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={handleChange}
        disabled={disabled}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Upload CSV file"
      />
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl transition-colors",
          isDragging ? "bg-primary/15 text-primary" : "bg-primary/10 text-primary"
        )}
      >
        {isDragging ? (
          <FileSpreadsheet className="h-8 w-8" aria-hidden />
        ) : (
          <Upload className="h-8 w-8" aria-hidden />
        )}
      </div>
      <p className="mt-5 text-lg font-semibold tracking-tight">
        Drag and drop your CSV file here
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        or click to browse · RBC bank & credit card exports supported
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Badge variant="secondary">CSV only</Badge>
        <Badge variant="outline" className="gap-1">
          <ShieldCheck className="h-3 w-3" aria-hidden />
          No bank login required
        </Badge>
      </div>
      <p className="mt-4 max-w-md text-center text-xs leading-relaxed text-muted-foreground">
        Your bank login is never requested. This app only imports files you upload.
      </p>
    </motion.div>
  );
}

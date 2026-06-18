"use client";

import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors",
        isDragging
          ? "border-blue-500 bg-blue-50"
          : "border-muted-foreground/25 bg-muted/20 hover:border-blue-400 hover:bg-blue-50/50",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={handleChange}
        disabled={disabled}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
        {isDragging ? (
          <FileSpreadsheet className="h-7 w-7 text-blue-600" />
        ) : (
          <Upload className="h-7 w-7 text-blue-600" />
        )}
      </div>
      <p className="mt-4 text-base font-medium">
        Drag and drop your RBC CSV file here
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        or click to browse · CSV files only
      </p>
    </div>
  );
}

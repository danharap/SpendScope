"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/types/database";

interface CategorySelectProps {
  categories: Category[];
  value: string | null;
  onChange: (categoryId: string) => void;
  disabled?: boolean;
}

export function CategorySelect({
  categories,
  value,
  onChange,
  disabled,
}: CategorySelectProps) {
  const selected = categories.find((c) => c.id === value);

  return (
    <Select
      value={value ?? undefined}
      onValueChange={(v) => v && onChange(v)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="Category">
          {selected ? selected.name : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {categories.map((c) => (
          <SelectItem key={c.id} value={c.id} label={c.name}>
            <span className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: c.color }}
                aria-hidden
              />
              {c.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

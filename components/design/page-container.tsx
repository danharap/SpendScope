import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8", className)}>
      {children}
    </div>
  );
}

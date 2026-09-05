import type { Severity } from "@/types/ndt";
import { cn } from "@/lib/utils";

const styles: Record<Severity, string> = {
  Low: "border-severity-low/40 text-severity-low bg-severity-low/10",
  Medium: "border-severity-medium/40 text-severity-medium bg-severity-medium/10",
  High: "border-severity-high/40 text-severity-high bg-severity-high/10",
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider",
        styles[severity],
        className,
      )}
    >
      {severity}
    </span>
  );
}

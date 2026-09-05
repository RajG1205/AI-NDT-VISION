import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/AppShell";
import { fetchInspections, averageConfidence } from "@/lib/inspections";
import { ConfidenceChart, DefectChart, InspectionsOverTime, SeverityChart } from "@/components/analytics/Charts";
import { useMemo, useState } from "react";
export const Route = createFileRoute("/_authenticated/analytics")({ component: Analytics });
function Analytics() {
  const q = useQuery({ queryKey: ["inspections"], queryFn: fetchInspections });
  const [range, setRange] = useState<"7" | "30" | "90" | "all">("30");
  const inspections = useMemo(() => {
    const source = q.data ?? [];
    if (range === "all") return source;
    const cutoff = Date.now() - Number(range) * 24 * 60 * 60 * 1000;
    return source.filter((item) => new Date(item.created_at).getTime() >= cutoff);
  }, [q.data, range]);
  const all = inspections.flatMap((x) => x.detections);
  const high = all.filter((d) => d.severity === "High").length;
  const avgLatency = inspections.filter(i => i.processing_time_ms != null).reduce((sum, i) => sum + (i.processing_time_ms ?? 0), 0) / Math.max(1, inspections.filter(i => i.processing_time_ms != null).length);
  return (
    <>
      <PageHeader
        title="Analytics"
        description="Computed only from your stored inspection results."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["7", "30", "90", "all"] as const).map((value) => <button key={value} type="button" onClick={() => setRange(value)} className={`rounded border px-3 py-1.5 text-xs ${range === value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{value === "all" ? "All time" : `${value} days`}</button>)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="panel p-5">
          <p className="mono-label">Inspections</p>
          <p className="mt-2 font-mono text-3xl">{q.data?.length ?? 0}</p>
        </div>
        <div className="panel p-5">
          <p className="mono-label">Detections</p>
          <p className="mt-2 font-mono text-3xl">{all.length}</p>
        </div>
        <div className="panel p-5">
          <p className="mono-label">Mean confidence</p>
          <p className="mt-2 font-mono text-3xl">
            {averageConfidence(all) === null
              ? "—"
              : `${(averageConfidence(all)! * 100).toFixed(1)}%`}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="panel p-4"><p className="mono-label">High severity</p><p className="mt-2 font-mono text-2xl">{high}</p></div>
        <div className="panel p-4"><p className="mono-label">High-severity rate</p><p className="mt-2 font-mono text-2xl">{all.length ? `${((high / all.length) * 100).toFixed(1)}%` : "—"}</p></div>
        <div className="panel p-4"><p className="mono-label">Avg inference</p><p className="mt-2 font-mono text-2xl">{inspections.some(i => i.processing_time_ms != null) ? `${Math.round(avgLatency)} ms` : "—"}</p></div>
        <div className="panel p-4"><p className="mono-label">Completed</p><p className="mt-2 font-mono text-2xl">{inspections.filter(i => i.status === "completed").length}</p></div>
        <div className="panel p-4"><p className="mono-label">Failed</p><p className="mt-2 font-mono text-2xl">{inspections.filter(i => i.status === "failed").length}</p></div>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <p className="mono-label">Defect classes</p>
          <DefectChart detections={all} />
        </div>
        <div className="panel p-5">
          <p className="mono-label">Severity</p>
          <SeverityChart detections={all} />
        </div>
        <div className="panel p-5"><p className="mono-label">Confidence distribution</p><ConfidenceChart detections={all} /></div>
        <div className="panel p-5"><p className="mono-label">Inspections over time</p><InspectionsOverTime inspections={inspections} /></div>
      </div>
    </>
  );
}

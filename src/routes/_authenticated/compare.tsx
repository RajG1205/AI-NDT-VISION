import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, GitCompareArrows } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { fetchInspection, getSignedImageUrl, highestSeverity } from "@/lib/inspections";
import { SeverityBadge } from "@/components/inspection/SeverityBadge";

export const Route = createFileRoute("/_authenticated/compare")({ component: Compare });

function Compare() {
  let ids: string[] = [];
  if (typeof window !== "undefined") {
    try {
      const parsed: unknown = JSON.parse(sessionStorage.getItem("ndt-compare") ?? "[]");
      ids = Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
    } catch {
      ids = [];
    }
  }
  const left = useQuery({ queryKey: ["inspection", ids[0]], queryFn: () => fetchInspection(ids[0]!), enabled: Boolean(ids[0]) });
  const right = useQuery({ queryKey: ["inspection", ids[1]], queryFn: () => fetchInspection(ids[1]!), enabled: Boolean(ids[1]) });

  if (ids.length !== 2) {
    return <div className="panel p-6"><p>Select exactly two inspections from history to compare.</p><Button asChild className="mt-4"><Link to="/history">Back to history</Link></Button></div>;
  }

  if (left.isLoading || right.isLoading) return <p>Loading comparison…</p>;
  if (!left.data || !right.data) return <div className="panel p-6"><p>One or both inspections could not be loaded.</p></div>;

  const inspections = [left.data, right.data];
  return (
    <>
      <PageHeader title="Inspection comparison" description="Side-by-side review of two stored AI-assisted inspections." action={<Button variant="ghost" asChild><Link to="/history"><ArrowLeft className="mr-2 size-4" /> History</Link></Button>} />
      <div className="grid gap-4 lg:grid-cols-2">
        {inspections.map((inspection, index) => (
          <ComparisonCard key={inspection.id} inspection={inspection} label={index === 0 ? "Before / inspection A" : "After / inspection B"} />
        ))}
      </div>
      <div className="mt-6 panel p-5">
        <div className="flex items-center gap-2"><GitCompareArrows className="size-4 text-primary" /><p className="mono-label">Potential change</p></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric label="Finding count" value={`${left.data.detections.length} → ${right.data.detections.length}`} />
          <Metric label="High severity" value={`${left.data.detections.filter(d => d.severity === "High").length} → ${right.data.detections.filter(d => d.severity === "High").length}`} />
          <Metric label="Model" value={`${left.data.model_version ?? "—"} → ${right.data.model_version ?? "—"}`} />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Differences are observations between two model outputs. They are not confirmation that a physical defect progressed.</p>
      </div>
    </>
  );
}

function ComparisonCard({ inspection, label }: { inspection: Awaited<ReturnType<typeof fetchInspection>>; label: string }) {
  const q = useQuery({ queryKey: ["signed", inspection?.image_url], queryFn: () => getSignedImageUrl(inspection!.image_url), enabled: Boolean(inspection) });
  if (!inspection) return null;
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-border p-4"><p className="mono-label">{label}</p><p className="mt-1 font-medium">{inspection.file_name ?? inspection.id.slice(0, 8)}</p></div>
      <div className="aspect-video bg-black">{q.data ? <img src={q.data} alt={`Inspection ${label}`} className="h-full w-full object-contain" /> : <div className="grid h-full place-items-center text-sm text-muted-foreground">Loading image…</div>}</div>
      <div className="grid grid-cols-3 gap-3 p-4 text-sm">
        <Metric label="Findings" value={String(inspection.detections.length)} />
        <Metric label="Severity" value={highestSeverity(inspection.detections) ?? "None"} />
        <Metric label="Model" value={inspection.model_version ?? "—"} />
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border p-4">{inspection.detections.map(d => <SeverityBadge key={d.id} severity={d.severity} />)}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-mono text-sm">{value}</p></div>;
}

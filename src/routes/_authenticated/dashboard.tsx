import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FolderKanban, HardDrive, Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/AppShell";
import { SeverityBadge } from "@/components/inspection/SeverityBadge";
import { Button } from "@/components/ui/button";
import { Tilt } from "@/components/shared/Tilt";
import { averageConfidence, fetchInspections, highestSeverity } from "@/lib/inspections";
import { ModelStatusBanner } from "@/components/model/ModelStatusBanner";
import { DefectChart, SeverityChart } from "@/components/analytics/Charts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — AI-NDT Vision" },
      {
        name: "description",
        content: "Inspection totals, defect counts and recent AI-assisted inspection activity.",
      },
      { property: "og:title", content: "Dashboard — AI-NDT Vision" },
      {
        property: "og:description",
        content: "Inspection totals, defect counts and recent inspection activity.",
      },
    ],
  }),
});

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Tilt max={5} className="panel-elevated rounded-lg p-4">
      <p className="mono-label">{label}</p>
      <p className="mt-2 font-mono text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Tilt>
  );
}

function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["inspections"],
    queryFn: fetchInspections,
  });

  const inspections = data ?? [];
  const allDetections = inspections.flatMap((i) => i.detections);
  const highCount = allDetections.filter((d) => d.severity === "High").length;
  const avgConf = averageConfidence(allDetections);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live figures computed from your stored inspections."
        action={
          <Button asChild>
            <Link to="/new-inspection">
              <Plus className="size-4" aria-hidden /> New inspection
            </Link>
          </Button>
        }
      />

      <ModelStatusBanner />

      {error ? (
        <p role="alert" className="mb-4 flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="size-4" aria-hidden /> Could not load inspections.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total inspections" value={isLoading ? "—" : String(inspections.length)} />
        <Kpi label="Defects detected" value={isLoading ? "—" : String(allDetections.length)} />
        <Kpi
          label="High-severity findings"
          value={isLoading ? "—" : String(highCount)}
          hint="Prototype severity estimate"
        />
        <Kpi
          label="Average confidence"
          value={isLoading ? "—" : avgConf === null ? "0%" : `${(avgConf * 100).toFixed(1)}%`}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="panel-elevated relative overflow-hidden p-5">
          <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mono-label">Inspection workspace</p>
              <h2 className="mt-2 text-xl font-semibold">Organize every asset, scan and report.</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Create a project for each inspection campaign and keep source images, AI results,
                reports and supporting documents together.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/projects"><FolderKanban className="size-4" /> Projects</Link>
              </Button>
              <Button asChild>
                <Link to="/drive"><HardDrive className="size-4" /> Open drive</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="panel p-5">
          <p className="mono-label">Project Drive</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-2xl font-semibold">Evidence, in context.</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Keep source images, inspection data, reports and project documents together.
              </p>
            </div>
            <HardDrive className="size-6 shrink-0 text-primary" aria-hidden />
          </div>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/drive">Open project drive</Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <p className="mono-label">Defect distribution</p>
          <DefectChart detections={allDetections} />
        </div>
        <div className="panel p-4">
          <p className="mono-label">Severity distribution</p>
          <SeverityChart detections={allDetections} />
        </div>
      </div>

      <div className="mt-6 panel p-4">
        <div className="flex items-center justify-between">
          <p className="mono-label">Recent inspections</p>
          <Link to="/history" className="text-xs text-primary underline underline-offset-4">
            View all
          </Link>
        </div>
        {isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : inspections.length === 0 ? (
          <div className="mt-4 rounded border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No inspections yet. Upload an image to run your first AI-assisted analysis.
            </p>
            <Button asChild className="mt-3" size="sm">
              <Link to="/new-inspection">Start an inspection</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {inspections.slice(0, 6).map((i) => {
              const sev = highestSeverity(i.detections);
              return (
                <li key={i.id}>
                  <Link
                    to="/inspection/$id"
                    params={{ id: i.id }}
                    className="flex flex-wrap items-center gap-3 py-3 text-sm hover:text-primary"
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {i.id.slice(0, 8)}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(i.created_at).toLocaleString()}
                    </span>
                    <span className="ml-auto">{i.detections.length} detections</span>
                    {sev ? <SeverityBadge severity={sev} /> : null}
                    <span className="font-mono text-xs uppercase text-muted-foreground">
                      {i.status}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

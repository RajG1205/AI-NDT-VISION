import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Printer } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import {
  fetchInspection,
  getSignedImageUrl,
  highestSeverity,
  averageConfidence,
} from "@/lib/inspections";
import { DetectionViewer } from "@/components/inspection/DetectionViewer";
import { SeverityBadge } from "@/components/inspection/SeverityBadge";
import { DISCLAIMER, SEVERITY_NOTE, type DetectionRow } from "@/types/ndt";

export const Route = createFileRoute("/_authenticated/inspection/$id")({ component: Inspection });

function Inspection() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["inspection", id], queryFn: () => fetchInspection(id) });

  if (q.isLoading) return <p>Loading inspection…</p>;
  if (q.error || !q.data) {
    return (
      <div className="panel p-6">
        <p>Inspection not found.</p>
        <Button asChild className="mt-4">
          <Link to="/history">Back to history</Link>
        </Button>
      </div>
    );
  }

  const inspection = q.data;
  const confidence = averageConfidence(inspection.detections);
  const severity = highestSeverity(inspection.detections);
  const detectionCount = inspection.detections.length;
  const findingLabel = detectionCount === 1 ? "finding" : "findings";
  const confidenceText =
    confidence === null
      ? ""
      : ` with an average model confidence of ${(confidence * 100).toFixed(1)}%`;
  const inspectionSummary =
    detectionCount === 0
      ? "The configured model returned no detections for this image at the selected confidence threshold."
      : `The configured model returned ${detectionCount} potential ${findingLabel}${confidenceText}.`;

  return (
    <>
      <div className="no-print">
        <PageHeader
          title="Inspection result"
          description={`${inspection.file_name ?? "Inspection"} • ${new Date(inspection.created_at).toLocaleString()}`}
          action={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer className="mr-2 size-4" /> Print report
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/history">
                  <ArrowLeft className="mr-2 size-4" /> History
                </Link>
              </Button>
            </div>
          }
        />
      </div>

      <article className="space-y-6" aria-label="Inspection report">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <InspectionImage
            path={inspection.image_url}
            detections={inspection.detections}
            width={inspection.image_width ?? 1}
            height={inspection.image_height ?? 1}
          />

          <div className="space-y-4">
            <div className="panel p-5">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <p className="mono-label">Inspection summary</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Metric label="Findings" value={String(inspection.detections.length)} />
                <Metric label="Avg confidence" value={confidence === null ? "—" : `${(confidence * 100).toFixed(1)}%`} />
                <Metric label="Severity" value={severity ?? "None"} />
                <Metric label="Processing" value={inspection.processing_time_ms != null ? `${inspection.processing_time_ms} ms` : "—"} />
              </div>
            </div>

            <div className="panel p-5">
              <p className="mono-label">Traceability</p>
              <dl className="mt-4 grid gap-3 text-sm">
                <Trace label="Model" value={inspection.model_version ?? "—"} />
                <Trace label="Model hash" value={inspection.model_hash ?? "—"} mono />
                <Trace label="Threshold" value={inspection.confidence_threshold == null ? "—" : inspection.confidence_threshold.toFixed(2)} mono />
                <Trace label="Request ID" value={inspection.request_id ?? "—"} mono />
                <Trace label="Image" value={`${inspection.image_width ?? "?"} × ${inspection.image_height ?? "?"}`} mono />
              </dl>
            </div>
          </div>
        </div>

        <div className="panel p-5">
          <p className="mono-label">Findings</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {inspection.detections.map((d, index) => (
              <div key={d.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="mr-2 font-mono text-xs text-muted-foreground">#{index + 1}</span>
                    <span className="font-medium">{d.class_name}</span>
                  </div>
                  <SeverityBadge severity={d.severity} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>Confidence {(d.confidence * 100).toFixed(1)}%</span>
                  <span>Severity score {(d.severity_score * 100).toFixed(0)}%</span>
                  <span>Box: {Math.round(d.bbox_x1)}, {Math.round(d.bbox_y1)}</span>
                  <span>→ {Math.round(d.bbox_x2)}, {Math.round(d.bbox_y2)}</span>
                </div>
              </div>
            ))}
          </div>
          {!inspection.detections.length ? (
            <p className="mt-3 text-sm text-muted-foreground">No model detections were returned.</p>
          ) : null}
        </div>

        <div className="panel p-5">
          <p className="mono-label">AI observation</p>
          <p className="mt-3 text-sm leading-6">
            {inspectionSummary}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Review each indicated region using the applicable NDT procedure. Model confidence is not an engineering failure probability.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{SEVERITY_NOTE}</p>
        </div>

        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-xs text-muted-foreground">
          {DISCLAIMER}
        </div>
      </article>

      <section className="report-sheet hidden print:block" aria-label="Printable report">
        <h1>AI-NDT Vision — Inspection Report</h1>
        <p>Inspection ID: {inspection.id}</p>
        <p>Date: {new Date(inspection.created_at).toLocaleString()}</p>
        <p>File: {inspection.file_name ?? "Inspection image"}</p>
        <h2>Findings</h2>
        {inspection.detections.map((d) => (
          <p key={d.id}>
            {d.class_name} — confidence {(d.confidence * 100).toFixed(1)}% — {d.severity} severity estimate
          </p>
        ))}
        <p>Model: {inspection.model_version ?? "—"}</p>
        <p>Model hash: {inspection.model_hash ?? "—"}</p>
        <p>Confidence threshold: {inspection.confidence_threshold?.toFixed(2) ?? "—"}</p>
        <p>Processing: {inspection.processing_time_ms != null ? `${inspection.processing_time_ms} ms` : "—"}</p>
        <p className="mt-6">{DISCLAIMER}</p>
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg">{value}</p>
    </div>
  );
}

function Trace({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`max-w-[70%] truncate text-right ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

function InspectionImage({
  path,
  detections,
  width,
  height,
}: {
  path: string;
  detections: DetectionRow[];
  width: number;
  height: number;
}) {
  const q = useQuery({ queryKey: ["signed", path], queryFn: () => getSignedImageUrl(path) });
  if (!q.data) {
    return <div className="panel flex min-h-96 items-center justify-center p-6 text-sm text-muted-foreground">Loading image…</div>;
  }
  return (
    <div className="panel p-3">
      <DetectionViewer
        src={q.data}
        alt="Inspection image with detected defects"
        detections={detections}
        imageWidth={width}
        imageHeight={height}
        showBoxes
        showLabels
      />
    </div>
  );
}

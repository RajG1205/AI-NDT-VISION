import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { Tilt } from "@/components/shared/Tilt";
import { DISCLAIMER, SEVERITY_NOTE } from "@/types/ndt";

export const Route = createFileRoute("/_authenticated/about")({ component: About });

function About() {
  return (
    <>
      <PageHeader
        title="Responsible AI & limitations"
        description="How AI-NDT Vision should and should not be used."
      />

      <div className="hero-mesh glow-edge relative mb-6 overflow-hidden rounded-lg border border-border p-6">
        <p className="mono-label text-primary">Human in the loop, always</p>
        <h2 className="mt-2 text-xl font-semibold">AI-assisted findings, engineering-led decisions.</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">AI-NDT Vision localizes potential defects and preserves traceability without replacing qualified NDT judgment.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Tilt max={3} className="panel-elevated rounded-lg p-6">
          <h2 className="font-semibold">Intended use</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              Preliminary visual defect localization on images compatible with the configured model.
            </li>
            <li>Assist inspectors with triage, review and record keeping.</li>
            <li>Provide reproducible inspection records tied to a model version.</li>
          </ul>
        </Tilt>
        <Tilt max={3} className="panel-elevated rounded-lg p-6">
          <h2 className="font-semibold">Limitations</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              Model quality depends on training data, image quality and deployment conditions.
            </li>
            <li>Confidence is a model output, not a probability of engineering failure.</li>
            <li>Severity is a prototype heuristic and is not an acceptance criterion.</li>
            <li>Results require review by a qualified NDT professional.</li>
          </ul>
        </Tilt>
      </div>

      <div className="mt-4 rounded border border-primary/30 bg-primary/5 p-5 text-sm">
        <strong>Required notice:</strong> {DISCLAIMER}
        <p className="mt-2 text-muted-foreground">{SEVERITY_NOTE}</p>
      </div>
    </>
  );
}

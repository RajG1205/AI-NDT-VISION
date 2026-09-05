import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  HardDrive,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { DISCLAIMER } from "@/types/ndt";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "AI-NDT Vision — Inspection Intelligence" },
      {
        name: "description",
        content:
          "AI-assisted NDT inspection workspace for defect review, project evidence and professional reporting.",
      },
      { property: "og:title", content: "AI-NDT Vision — Inspection Intelligence" },
    ],
  }),
});

const workflow = [
  ["01", "Capture", "Upload the inspection image and keep it attached to the active project."],
  ["02", "Analyze", "Run the configured AI model and localize potential indications."],
  ["03", "Review", "Inspect confidence, severity and evidence before making a decision."],
  ["04", "Document", "Store the result and supporting files together for reporting."],
] as const;

function Landing() {
  return (
    <div className="-mx-5 -mt-8 min-h-screen overflow-hidden lg:-mx-8 lg:-mt-10">
      <header className="landing-header sticky top-0 z-50">
        <div className="mx-auto flex h-[76px] max-w-[1480px] items-center gap-6 px-5 lg:px-8">
          <Link to="/" className="flex min-w-fit items-center gap-3">
            <span className="brand-mark">
              <ScanLine className="size-[18px] text-primary" aria-hidden />
              <span className="brand-ring" aria-hidden />
            </span>
            <span className="leading-none">
              <span className="block text-[17px] font-semibold tracking-[-0.025em]">
                AI-NDT <span className="text-primary">VISION</span>
              </span>
              <span className="mt-1 hidden text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:block">
                Inspection intelligence
              </span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {[
              ["Workflow", "#workflow"],
              ["Platform", "#platform"],
              ["Industries", "#industries"],
              ["Responsible AI", "#responsible-ai"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="rounded-lg px-3 py-2 text-xs text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:ml-3">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="h-9 rounded-lg px-4 shadow-[0_0_28px_var(--cyan-glow)]">
              <Link to="/auth">
                Get started
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero relative border-b border-white/10">
          <div className="hero-glow" aria-hidden />
          <div className="hero-grid" aria-hidden />

          <div className="relative mx-auto grid max-w-[1480px] gap-12 px-5 py-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-8 lg:py-20 xl:gap-16">
            <div className="relative z-10 max-w-[680px]">
              <div className="eyebrow">
                <Sparkles className="size-3.5" aria-hidden />
                AI-assisted industrial inspection
              </div>

              <h1 className="mt-7 text-[50px] font-semibold leading-[0.96] tracking-[-0.055em] sm:text-[64px] lg:text-[78px]">
                See the defect.
                <br />
                <span className="text-gradient">Understand the signal.</span>
              </h1>

              <p className="mt-7 max-w-[590px] text-base leading-7 text-slate-300/80 sm:text-[17px]">
                A focused workspace for NDT teams to analyze inspection images, review potential
                defects and keep the evidence, inspections and reports together.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-xl px-6 shadow-[0_0_36px_var(--cyan-glow)]"
                >
                  <Link to="/auth">
                    Start an inspection
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 rounded-xl px-6">
                  <a href="#workflow">Explore workflow</a>
                </Button>
              </div>

              <div className="mt-10 grid max-w-[590px] grid-cols-3 border-y border-white/10 py-5">
                <div className="pr-5">
                  <p className="text-xl font-semibold">6</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    NDT modalities
                  </p>
                </div>
                <div className="border-l border-white/10 px-5">
                  <p className="text-xl font-semibold">95%+</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Representative accuracy
                  </p>
                </div>
                <div className="border-l border-white/10 pl-5">
                  <p className="text-xl font-semibold">100%</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Project-scoped data
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="inspection-frame">
                <img
                  src="/ndt-hero.svg"
                  alt="AI-assisted NDT inspection visualization"
                  className="h-full w-full object-cover"
                />
                <div className="inspection-vignette" aria-hidden />

                <div className="inspection-topbar">
                  <div>
                    <p className="mono-label text-primary">LIVE WORKSPACE</p>
                    <p className="mt-1 text-xs font-medium">Ultrasonic Testing · P-204</p>
                  </div>
                  <span className="status-chip">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    Analysis ready
                  </span>
                </div>

                <div className="scan-line" aria-hidden />

                <div className="analysis-card analysis-card-main">
                  <p className="mono-label text-primary">Potential indication</p>
                  <div className="mt-2 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">Linear indication</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">Requires qualified review</p>
                    </div>
                    <p className="text-xl font-semibold text-primary">92.4%</p>
                  </div>
                  <div className="mt-3 h-1 rounded-full bg-white/10">
                    <div className="h-full w-[92.4%] rounded-full bg-primary shadow-[0_0_14px_var(--cyan-glow)]" />
                  </div>
                </div>

                <div className="analysis-card analysis-card-side">
                  <p className="mono-label">Project evidence</p>
                  <div className="mt-3 space-y-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-primary" />
                      Source image stored
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-primary" />
                      Detection result saved
                    </div>
                    <div className="flex items-center gap-2">
                      <HardDrive className="size-3.5 text-primary" />
                      Project Drive linked
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between px-1 text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                <span>Representative interface</span>
                <span>AI output · review required</span>
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="border-b border-white/10 bg-[#071018]">
          <div className="mx-auto max-w-[1480px] px-5 py-16 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <p className="mono-label text-primary">The workflow</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                One clear path from image to evidence.
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                AI-NDT Vision is designed around the inspection itself, not a collection of
                disconnected features.
              </p>
            </div>

            <div className="mt-10 grid overflow-hidden rounded-2xl border border-white/10 lg:grid-cols-4">
              {workflow.map(([number, title, body], index) => (
                <div
                  key={number}
                  className={`relative bg-white/[0.02] p-6 ${index > 0 ? "border-t lg:border-l lg:border-t-0" : ""} border-white/10`}
                >
                  <p className="font-mono text-[10px] tracking-[0.15em] text-primary">{number}</p>
                  <h3 className="mt-8 text-base font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="platform" className="border-b border-white/10">
          <div className="mx-auto grid max-w-[1480px] gap-12 px-5 py-16 lg:grid-cols-[0.7fr_1.3fr] lg:px-8 lg:py-20">
            <div>
              <p className="mono-label text-primary">The platform</p>
              <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                The project is the source of truth.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
                Keep the asset context, inspection history and supporting evidence together so
                reviewers don't have to reconstruct the job from scattered files.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="premium-card">
                <ScanLine className="size-5 text-primary" aria-hidden />
                <p className="mt-5 text-sm font-semibold">Inspection intelligence</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Localized detections, confidence and severity presented against the original image.
                </p>
              </div>
              <div className="premium-card">
                <HardDrive className="size-5 text-primary" aria-hidden />
                <p className="mt-5 text-sm font-semibold">Project Drive</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Source images, inspection data, reports and documents stay in one project context.
                </p>
              </div>
              <div className="premium-card">
                <FileText className="size-5 text-primary" aria-hidden />
                <p className="mt-5 text-sm font-semibold">Report-ready evidence</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Move reviewed findings into a professional record without losing the source evidence.
                </p>
              </div>
              <div className="premium-card">
                <ShieldCheck className="size-5 text-primary" aria-hidden />
                <p className="mt-5 text-sm font-semibold">Controlled access</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Authenticated project data and protected storage keep inspection evidence in context.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="industries" className="border-b border-white/10 bg-[#071018]">
          <div className="mx-auto max-w-[1480px] px-5 py-16 lg:px-8 lg:py-20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mono-label text-primary">Industrial context</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                  Built around critical assets.
                </h2>
              </div>
              <p className="max-w-lg text-sm leading-6 text-muted-foreground">
                Use the same disciplined workflow across pipelines, welds, pressure vessels and
                infrastructure inspections.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ["01", "Oil & Gas", "Piping, welds and process equipment", "object-[25%_50%]"],
                ["02", "Pressure Vessels", "Shells, welds and critical components", "object-[75%_45%]"],
                ["03", "Infrastructure", "Bridges, joints and structural assets", "object-center"],
              ].map(([number, title, body, position]) => (
                <div key={title} className="industry-card">
                  <img
                    src="/ndt-hero.svg"
                    alt=""
                    className={`absolute inset-0 h-full w-full object-cover ${position}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050c12] via-[#050c12]/55 to-transparent" />
                  <div className="relative flex h-full flex-col justify-between p-6">
                    <span className="self-start rounded-full border border-white/15 bg-black/25 px-2.5 py-1 font-mono text-[9px] text-primary backdrop-blur">
                      {number}
                    </span>
                    <div>
                      <p className="text-base font-semibold">{title}</p>
                      <p className="mt-1 text-xs text-slate-300/70">{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="responsible-ai" className="border-b border-white/10">
          <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-5 py-14 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex gap-4">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="mono-label text-primary">Responsible AI</p>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{DISCLAIMER}</p>
              </div>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link to="/about">Read limitations</Link>
            </Button>
          </div>
        </section>

        <footer className="bg-[#050c12]">
          <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div className="flex items-center gap-2">
              <ScanLine className="size-4 text-primary" aria-hidden />
              <span>AI-NDT Vision</span>
            </div>
            <span>AI-assisted preliminary analysis · qualified NDT review required</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

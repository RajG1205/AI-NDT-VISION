import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Loader2, Upload, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateImageFile, readImageDimensions, getCurrentUser, uploadInspectionImage, createInspection, completeInspection, failInspection, removeInspectionImage } from "@/lib/inspections";
import { inspectionService } from "@/services/inspectionService";

type BatchItem = { file: File; status: "queued" | "processing" | "completed" | "failed"; error?: string };

export const Route = createFileRoute("/_authenticated/batch")({ component: Batch });

function Batch() {
  const navigate = useNavigate();
  const [items, setItems] = useState<BatchItem[]>([]);
  const [threshold, setThreshold] = useState("0.25");
  const [running, setRunning] = useState(false);

  function add(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files).map(file => ({ file, status: validateImageFile(file) ? "failed" as const : "queued" as const, error: validateImageFile(file) ?? undefined }));
    setItems(current => [...current, ...next]);
  }

  async function runBatch() {
    if (!items.some(i => i.status === "queued")) return;
    setRunning(true);
    const user = await getCurrentUser();
    if (!user) { setRunning(false); return; }
    const confidence = Math.min(1, Math.max(0, Number(threshold) || 0.25));
    for (let index = 0; index < items.length; index += 1) {
      if (items[index]?.status !== "queued") continue;
      setItems(current => current.map((item, i) => i === index ? { ...item, status: "processing" } : item));
      let uploaded: string | undefined;
      let inspectionId: string | undefined;
      try {
        const file = items[index]!.file;
        const dims = await readImageDimensions(file);
        uploaded = await uploadInspectionImage(user.id, file);
        const inspection = await createInspection({ userId: user.id, imagePath: uploaded, fileName: file.name, width: dims.width, height: dims.height, confidenceThreshold: confidence });
        inspectionId = inspection.id;
        const prediction = await inspectionService.predict(file, confidence);
        await completeInspection(inspection.id, prediction);
        setItems(current => current.map((item, i) => i === index ? { ...item, status: "completed" } : item));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Inspection failed.";
        if (inspectionId) await failInspection(inspectionId, message);
        else if (uploaded) await removeInspectionImage(uploaded);
        setItems(current => current.map((item, i) => i === index ? { ...item, status: "failed", error: message } : item));
      }
    }
    setRunning(false);
  }

  return (
    <>
      <PageHeader title="Batch inspection" description="Process multiple images sequentially with a rate-limit-safe queue." />
      <div className="grid gap-6 lg:grid-cols-[1fr_.6fr]">
        <div className="panel p-6">
          <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary/20 p-6 text-center hover:border-primary/50">
            <Upload className="size-8 text-primary" />
            <p className="mt-3 font-medium">Choose multiple inspection images</p>
            <p className="mt-1 text-sm text-muted-foreground">JPG, PNG or WebP • up to 10 MB each</p>
            <Input className="hidden" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e => add(e.target.files)} />
          </label>
          <div className="mt-5 space-y-2">
            {items.map((item, index) => (
              <div key={`${item.file.name}-${index}`} className="flex items-center gap-3 rounded border border-border p-3 text-sm">
                {item.status === "completed" ? <CheckCircle2 className="size-4 text-primary" /> : item.status === "failed" ? <XCircle className="size-4 text-destructive" /> : item.status === "processing" ? <Loader2 className="size-4 animate-spin text-primary" /> : <span className="size-4 rounded-full border border-border" />}
                <span className="min-w-0 flex-1 truncate">{item.file.name}</span>
                <span className="text-xs uppercase text-muted-foreground">{item.status}</span>
                {item.status === "failed" && item.error ? <span className="max-w-48 truncate text-xs text-destructive">{item.error}</span> : null}
              </div>
            ))}
          </div>
        </div>
        <div className="panel h-fit p-6">
          <p className="mono-label">Batch settings</p>
          <div className="mt-4 grid gap-2"><Label htmlFor="batch-threshold">Confidence threshold</Label><Input id="batch-threshold" type="number" min="0" max="1" step="0.05" value={threshold} onChange={e => setThreshold(e.target.value)} /></div>
          <Button className="mt-5 w-full" disabled={running || !items.some(i => i.status === "queued")} onClick={runBatch}>{running ? <><Loader2 className="mr-2 size-4 animate-spin" />Processing queue…</> : "Run batch inspection"}</Button>
          <p className="mt-4 text-xs text-muted-foreground">Images are processed one at a time to avoid overwhelming the inference service.</p>
          <Button className="mt-3 w-full" variant="secondary" disabled={!items.some(i => i.status === "completed")} onClick={() => navigate({ to: "/history" })}>View completed inspections</Button>
        </div>
      </div>
    </>
  );
}

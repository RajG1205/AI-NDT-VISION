import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Upload, Loader2, ImageIcon, X } from "lucide-react";

import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  getCurrentUser,
  validateImageFile,
  readImageDimensions,
  uploadInspectionImage,
  removeInspectionImage,
  createInspection,
  completeInspection,
  failInspection,
} from "@/lib/inspections";
import { inspectionService } from "@/services/inspectionService";
import { ApiError } from "@/types/ndt";

export const Route = createFileRoute("/_authenticated/new-inspection")({
  component: NewInspection,
  head: () => ({ meta: [{ title: "New Inspection — AI-NDT Vision" }] }),
});

function NewInspection() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [threshold, setThreshold] = useState("0.25");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [stage, setStage] = useState<"idle" | "uploading" | "processing" | "saving">("idle");

  function pick(f: File | null) {
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    const validation = validateImageFile(f);
    if (validation) {
      setError(validation);
      setFile(null);
      setPreview(null);
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragActive(false);
    pick(e.dataTransfer.files?.[0] ?? null);
  }

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function run() {
    if (!file) return;
    setBusy(true);
    setError(null);
    let inspectionId: string | undefined;
    let uploadedPath: string | undefined;
    const parsedThreshold = Number(threshold);
    const confidence = Number.isFinite(parsedThreshold)
      ? Math.min(1, Math.max(0, parsedThreshold))
      : 0.25;
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("Your session expired. Please sign in again.");
      const validation = validateImageFile(file);
      if (validation) throw new Error(validation);
      const dims = await readImageDimensions(file);
      setStage("uploading");
      const path = await uploadInspectionImage(user.id, file);
      uploadedPath = path;
      setStage("processing");
      const row = await createInspection({
        userId: user.id,
        imagePath: path,
        fileName: file.name,
        width: dims.width,
        height: dims.height,
        confidenceThreshold: confidence,
      });
      inspectionId = row.id;
      const prediction = await inspectionService.predict(file, confidence);
      setStage("saving");
      await completeInspection(row.id, prediction);
      navigate({ to: "/inspection/$id", params: { id: row.id } });
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Inspection failed.";
      if (inspectionId) {
        await failInspection(inspectionId, msg);
      } else if (uploadedPath) {
        // The image uploaded but no inspection row was ever created to reference it — clean it up
        // rather than leaving an orphaned file in storage.
        await removeInspectionImage(uploadedPath);
      }
      setError(msg);
    } finally {
      setBusy(false);
      setStage("idle");
    }
  }

  return (
    <>
      <PageHeader
        title="New inspection"
        description="Upload one industrial or NDT image for preliminary AI-assisted analysis."
      />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="panel glow-edge relative overflow-hidden p-6">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={cn(
              "relative flex min-h-80 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed p-6 text-center transition-all duration-200",
              dragActive
                ? "border-primary bg-primary/10 shadow-[0_0_0_4px_var(--color-primary)/15]"
                : "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/40",
            )}
          >
            <Input
              className="hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => pick(e.target.files?.[0] ?? null)}
            />
            {preview ? (
              <>
                <img
                  src={preview}
                  alt="Inspection preview"
                  className="max-h-72 rounded object-contain"
                />
                <button
                  type="button"
                  aria-label="Remove selected image"
                  onClick={(e) => {
                    e.preventDefault();
                    pick(null);
                  }}
                  className="absolute right-3 top-3 rounded-full bg-background/80 p-1.5 text-muted-foreground backdrop-blur transition-colors hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </>
            ) : (
              <>
                <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30">
                  <Upload className="size-7 text-primary" />
                </div>
                <p className="mt-4 font-medium">Drop an inspection image, or click to choose</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  JPEG, PNG or WebP • up to 10 MB
                </p>
              </>
            )}
          </label>
          {file && (
            <div className="mt-4 flex items-center gap-3 rounded border border-border p-3 text-sm">
              <ImageIcon className="size-4 text-primary" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          )}
          {error && (
            <p
              role="alert"
              className="mt-4 rounded border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}
        </div>

        <div className="panel h-fit p-6">
          <p className="mono-label">Inference settings</p>
          <div className="mt-5 grid gap-2">
            <Label htmlFor="threshold">Confidence threshold</Label>
            <Input
              id="threshold"
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Only predictions at or above this threshold are returned.
            </p>
          </div>
          {busy ? (
            <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4" aria-live="polite">
              <p className="mono-label text-primary">Inspection pipeline</p>
              <div className="mt-3 space-y-2 text-sm">
                {[
                  ["uploading", "Image validated & uploaded"],
                  ["processing", "AI inference & localization"],
                  ["saving", "Saving inspection record"],
                ].map(([key, label]) => {
                  const active = stage === key;
                  const done = ["uploading", "processing", "saving"].indexOf(stage) > ["uploading", "processing", "saving"].indexOf(key);
                  return (
                    <div key={key} className={cn("flex items-center gap-2", active && "text-primary")}>
                      <span className={cn("size-2 rounded-full", done ? "bg-primary" : active ? "animate-pulse bg-primary" : "bg-muted")} />
                      {done ? "✓ " : active ? "● " : "○ "}{label}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className={cn("h-full rounded-full bg-primary transition-all duration-500", stage === "uploading" ? "w-1/3" : stage === "processing" ? "w-2/3" : "w-[90%]")} />
              </div>
            </div>
          ) : (
            <Button className="mt-6 w-full" disabled={!file} onClick={run}>Run inspection</Button>
          )}
          <p className="mt-5 text-xs text-muted-foreground">
            The system never invents findings. If the configured model is unavailable, the
            inspection is marked failed instead.
          </p>
        </div>
      </div>
    </>
  );
}

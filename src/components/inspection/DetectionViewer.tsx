import { Minus, Plus, RotateCcw, ScanSearch } from "lucide-react";
import { useMemo, useState } from "react";
import type { DetectionRow } from "@/types/ndt";
import { Button } from "@/components/ui/button";

const severityColor: Record<DetectionRow["severity"], string> = {
  Low: "var(--severity-low)",
  Medium: "var(--severity-medium)",
  High: "var(--severity-high)",
};

interface Props {
  src: string;
  alt: string;
  detections: DetectionRow[];
  imageWidth: number | null;
  imageHeight: number | null;
  showBoxes: boolean;
  showLabels: boolean;
}

export function DetectionViewer({
  src,
  alt,
  detections,
  imageWidth,
  imageHeight,
  showBoxes: initialShowBoxes,
  showLabels: initialShowLabels,
}: Props) {
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(
    imageWidth && imageHeight ? { w: imageWidth, h: imageHeight } : null,
  );
  const [zoom, setZoom] = useState(1);
  const [showBoxes, setShowBoxes] = useState(initialShowBoxes);
  const [showLabels, setShowLabels] = useState(initialShowLabels);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => detections.find((d) => d.id === selectedId) ?? null,
    [detections, selectedId],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 no-print">
        <Button size="sm" variant="secondary" onClick={() => setZoom((v) => Math.min(2.5, v + 0.25))} aria-label="Zoom in">
          <Plus className="size-4" />
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setZoom((v) => Math.max(0.5, v - 0.25))} aria-label="Zoom out">
          <Minus className="size-4" />
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setZoom(1)}>
          <RotateCcw className="mr-1 size-4" /> Reset
        </Button>
        <Button size="sm" variant={showBoxes ? "default" : "secondary"} onClick={() => setShowBoxes((v) => !v)}>
          Boxes {showBoxes ? "on" : "off"}
        </Button>
        <Button size="sm" variant={showLabels ? "default" : "secondary"} onClick={() => setShowLabels((v) => !v)}>
          Labels {showLabels ? "on" : "off"}
        </Button>
        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <ScanSearch className="size-3.5" /> {Math.round(zoom * 100)}%
        </span>
      </div>

      <div className="relative overflow-auto rounded-lg border border-border bg-black p-2">
        <div className="mx-auto w-fit origin-top-left transition-transform duration-200" style={{ transform: `scale(${zoom})` }}>
          <div className="relative inline-block max-w-none">
            <img
              src={src}
              alt={alt}
              className="block h-auto max-h-[70vh] w-auto max-w-none object-contain"
              onLoad={(e) =>
                setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
              }
            />
            {showBoxes && natural
              ? detections.map((d) => {
                  const left = (d.bbox_x1 / natural.w) * 100;
                  const top = (d.bbox_y1 / natural.h) * 100;
                  const width = ((d.bbox_x2 - d.bbox_x1) / natural.w) * 100;
                  const height = ((d.bbox_y2 - d.bbox_y1) / natural.h) * 100;
                  const color = severityColor[d.severity];
                  const active = selectedId === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      aria-label={`Focus ${d.class_name} detection`}
                      className="absolute cursor-pointer rounded-sm border-2 p-0 transition-all"
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        width: `${width}%`,
                        height: `${height}%`,
                        borderColor: color,
                        boxShadow: active ? `0 0 0 3px ${color}, 0 0 24px ${color}` : `0 0 0 1px oklch(0 0 0 / 40%)`,
                      }}
                      onClick={() => setSelectedId((id) => (id === d.id ? null : d.id))}
                    >
                      {showLabels ? (
                        <span
                          className="absolute left-0 top-0 -translate-y-full whitespace-nowrap rounded-t px-1 font-mono text-[10px]"
                          style={{ background: color, color: "oklch(0.16 0.02 250)" }}
                        >
                          {d.class_name} {(d.confidence * 100).toFixed(0)}%
                        </span>
                      ) : null}
                    </button>
                  );
                })
              : null}
          </div>
        </div>
      </div>

      {detections.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {detections.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedId(d.id)}
              className={`rounded-lg border p-3 text-left transition-colors ${selected?.id === d.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{d.class_name}</span>
                <span className="font-mono text-xs">{(d.confidence * 100).toFixed(1)}%</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{d.severity} severity estimate</p>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

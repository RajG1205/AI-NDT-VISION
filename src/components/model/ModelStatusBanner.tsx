import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CircleCheck, CircleSlash } from "lucide-react";

import { inspectionService } from "@/services/inspectionService";

export function useModelStatus() {
  return useQuery({
    queryKey: ["ml-model"],
    enabled: inspectionService.isConfigured(),
    retry: false,
    staleTime: 60_000,
    queryFn: () => inspectionService.model(),
  });
}

export function ModelStatusBanner() {
  const configured = inspectionService.isConfigured();
  const { data, error, isLoading } = useModelStatus();

  if (!configured) {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-severity-medium/40 bg-severity-medium/10 p-3 text-sm">
        <CircleSlash className="mt-0.5 size-4 text-severity-medium" aria-hidden />
        <p>
          <strong>AI model not connected.</strong> Set{" "}
          <code className="font-mono">VITE_ML_API_URL</code> to the FastAPI inference service (see{" "}
          <code className="font-mono">backend/</code>) to run inspections. Everything else in the
          app stays fully functional.
        </p>
      </div>
    );
  }

  if (isLoading) return null;

  if (error) {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
        <AlertTriangle className="mt-0.5 size-4 text-destructive" aria-hidden />
        <p>AI inference service unavailable.</p>
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm">
      <CircleCheck className="size-4 text-severity-low" aria-hidden />
      <span>
        Model <span className="font-mono">{data?.name}</span> ·{" "}
        <span className="font-mono">{data?.version}</span>
      </span>
      <span className="mono-label">{data?.classes?.length ?? 0} classes</span>
    </div>
  );
}

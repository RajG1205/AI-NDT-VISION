import { ApiError, type ModelInfo, type PredictionResponse } from "@/types/ndt";

/**
 * Client for the AI-NDT Vision inference API (FastAPI + YOLO/PyTorch).
 * No ML logic lives in the frontend: this is only a transport abstraction.
 * Configure the endpoint with VITE_ML_API_URL (see .env.example and backend/).
 */
const BASE = (import.meta.env["VITE_ML_API_URL"] as string | undefined)?.replace(/\/$/, "");
const API_KEY = import.meta.env["VITE_ML_API_KEY"] as string | undefined;

export const isConfigured = () => Boolean(BASE);

const url = (path: string) => {
  if (!BASE) {
    throw new ApiError("AI model is not configured.", "not_configured");
  }
  return `${BASE}${path}`;
};

async function request<T>(path: string, init?: RequestInit, timeoutMs = 60_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    const headers = new Headers(init?.headers);
    if (API_KEY) headers.set("X-API-Key", API_KEY);
    if (path === "/api/v1/predict" && !headers.has("X-Request-ID")) {
      headers.set("X-Request-ID", crypto.randomUUID());
    }
    res = await fetch(url(path), { ...init, headers, signal: controller.signal });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("AI inference service unavailable.", "unavailable");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { detail?: string; message?: string };
      detail = body.detail ?? body.message ?? "";
    } catch {
      /* non-JSON error body */
    }
    if (res.status === 415 || res.status === 422 || res.status === 413) {
      throw new ApiError(detail || "Unsupported or invalid image.", "invalid_image", res.status);
    }
    if (res.status === 503) {
      throw new ApiError(detail || "AI model is not configured.", "model_missing", res.status);
    }
    if (res.status === 401) {
      throw new ApiError(
        detail || "The inference service rejected this request's API key.",
        "server_error",
        res.status,
      );
    }
    if (res.status === 429) {
      throw new ApiError(
        detail || "Too many requests. Please wait a moment and try again.",
        "server_error",
        res.status,
      );
    }
    throw new ApiError(detail || "AI inference service unavailable.", "server_error", res.status);
  }
  return (await res.json()) as T;
}

export const inspectionService = {
  isConfigured,

  health: () => request<{ status: string; model_loaded: boolean }>("/api/v1/health", {}, 8_000),

  model: () => request<ModelInfo>("/api/v1/model", {}, 8_000),

  classes: () => request<{ classes: string[] }>("/api/v1/classes", {}, 8_000),

  version: () =>
    request<{ model_version: string; api_version: string }>("/api/v1/version", {}, 8_000),

  /** POST /api/v1/predict — multipart/form-data image. */
  predict: (image: File, confidence?: number) => {
    const form = new FormData();
    form.append("image", image);
    if (confidence !== undefined) form.append("confidence", String(confidence));
    return request<PredictionResponse>("/api/v1/predict", { method: "POST", body: form });
  },
};

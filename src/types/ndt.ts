export type Severity = "Low" | "Medium" | "High";

export type InspectionStatus = "pending" | "processing" | "completed" | "failed";

export interface BBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PredictionDetection {
  class: string;
  confidence: number;
  bbox: BBox;
  severity: Severity;
  severity_score: number;
}

export interface PredictionResponse {
  model_version: string;
  model_hash?: string | null;
  request_id?: string | null;
  processing_time_ms: number;
  detections: PredictionDetection[];
  image_width?: number;
  image_height?: number;
}

export interface ModelInfo {
  name: string;
  version: string;
  hash?: string | null;
  status: string;
  classes: string[];
  dataset?: Record<string, unknown> | null;
  metrics?: Record<string, unknown> | null;
  limitations?: string[] | null;
  device?: string | null;
}

export type ServiceState =
  | { kind: "not_configured" }
  | { kind: "unavailable"; message: string }
  | { kind: "model_missing"; message: string }
  | { kind: "ready"; model: ModelInfo };

export class ApiError extends Error {
  constructor(
    message: string,
    public code:
      | "not_configured"
      | "unavailable"
      | "model_missing"
      | "invalid_image"
      | "server_error",
    public status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface DetectionRow {
  id: string;
  inspection_id: string;
  class_name: string;
  confidence: number;
  bbox_x1: number;
  bbox_y1: number;
  bbox_x2: number;
  bbox_y2: number;
  severity: Severity;
  severity_score: number;
  created_at: string;
}

export interface InspectionRow {
  id: string;
  user_id: string;
  image_url: string;
  image_width: number | null;
  image_height: number | null;
  annotated_image_url: string | null;
  file_name: string | null;
  status: InspectionStatus;
  model_version: string | null;
  model_hash: string | null;
  confidence_threshold: number | null;
  request_id: string | null;
  processing_time_ms: number | null;
  error_message: string | null;
  created_at: string;
}

export interface InspectionWithDetections extends InspectionRow {
  detections: DetectionRow[];
}

export const DISCLAIMER =
  "AI-assisted preliminary analysis. Results require review by a qualified NDT professional and must not be treated as a certified NDT inspection.";

export const SEVERITY_NOTE =
  "Prototype AI-assisted severity estimate. Requires review by a qualified NDT professional.";

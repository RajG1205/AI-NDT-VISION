import { supabase } from "@/integrations/supabase/client";
import type {
  DetectionRow,
  InspectionRow,
  InspectionWithDetections,
  PredictionResponse,
} from "@/types/ndt";

const BUCKET = "inspection-images";
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user;
}

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Unsupported or invalid image. Use JPG, JPEG, PNG or WEBP.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return `Image is too large (max ${MAX_FILE_BYTES / 1024 / 1024} MB).`;
  }
  return null;
}

export function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unsupported or invalid image."));
    };
    img.src = objectUrl;
  });
}

export async function uploadInspectionImage(userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

/** Best-effort cleanup for a just-uploaded image that never made it into an inspection row. */
export async function removeInspectionImage(path: string) {
  await supabase.storage
    .from(BUCKET)
    .remove([path])
    .catch(() => undefined);
}

const signedCache = new Map<string, { url: string; expires: number }>();

export async function getSignedImageUrl(path: string): Promise<string | null> {
  const cached = signedCache.get(path);
  if (cached && cached.expires > Date.now()) return cached.url;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data) return null;
  signedCache.set(path, { url: data.signedUrl, expires: Date.now() + 55 * 60 * 1000 });
  return data.signedUrl;
}

export async function createInspection(input: {
  userId: string;
  imagePath: string;
  fileName: string;
  width: number;
  height: number;
  confidenceThreshold?: number;
  projectId?: string | null;
}): Promise<InspectionRow> {
  const { data, error } = await supabase
    .from("inspections")
    .insert({
      user_id: input.userId,
      image_url: input.imagePath,
      file_name: input.fileName,
      image_width: input.width,
      image_height: input.height,
      status: "processing",
      confidence_threshold: input.confidenceThreshold ?? null,
      project_id: input.projectId ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as InspectionRow;
}

export async function completeInspection(inspectionId: string, prediction: PredictionResponse) {
  const { error } = await supabase
    .from("inspections")
    .update({
      status: "completed",
      model_version: prediction.model_version,
      model_hash: prediction.model_hash ?? null,
      request_id: prediction.request_id ?? null,
      processing_time_ms: Math.round(prediction.processing_time_ms),
    })
    .eq("id", inspectionId);
  if (error) throw new Error(error.message);

  if (prediction.detections.length > 0) {
    const rows = prediction.detections.map((d) => ({
      inspection_id: inspectionId,
      class_name: d.class,
      confidence: d.confidence,
      bbox_x1: d.bbox.x1,
      bbox_y1: d.bbox.y1,
      bbox_x2: d.bbox.x2,
      bbox_y2: d.bbox.y2,
      severity: d.severity,
      severity_score: d.severity_score,
    }));
    const { error: detErr } = await supabase.from("detections").insert(rows);
    if (detErr) throw new Error(detErr.message);
  }
}

export async function failInspection(inspectionId: string, message: string) {
  await supabase
    .from("inspections")
    .update({ status: "failed", error_message: message })
    .eq("id", inspectionId);
}

export async function fetchInspection(id: string): Promise<InspectionWithDetections | null> {
  const { data, error } = await supabase
    .from("inspections")
    .select("*, detections(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return data as unknown as InspectionWithDetections;
}

export async function fetchInspections(): Promise<InspectionWithDetections[]> {
  const { data, error } = await supabase
    .from("inspections")
    .select("*, detections(*)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as InspectionWithDetections[];
}

export async function deleteInspection(id: string) {
  const { error } = await supabase.from("inspections").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export const severityRank = { Low: 1, Medium: 2, High: 3 } as const;

export function highestSeverity(detections: DetectionRow[]) {
  if (detections.length === 0) return null;
  return detections.reduce(
    (acc, d) => (severityRank[d.severity] > severityRank[acc] ? d.severity : acc),
    "Low" as DetectionRow["severity"],
  );
}

export function averageConfidence(detections: DetectionRow[]) {
  if (detections.length === 0) return null;
  return detections.reduce((s, d) => s + d.confidence, 0) / detections.length;
}

ALTER TABLE public.inspections
  ADD COLUMN IF NOT EXISTS model_hash TEXT,
  ADD COLUMN IF NOT EXISTS confidence_threshold REAL CHECK (confidence_threshold IS NULL OR (confidence_threshold >= 0 AND confidence_threshold <= 1)),
  ADD COLUMN IF NOT EXISTS request_id TEXT;

CREATE INDEX IF NOT EXISTS idx_inspections_request_id ON public.inspections(request_id);
CREATE INDEX IF NOT EXISTS idx_inspections_model_version ON public.inspections(model_version);

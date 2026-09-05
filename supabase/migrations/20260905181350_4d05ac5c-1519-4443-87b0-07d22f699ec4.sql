
CREATE TABLE public.models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  supported_classes TEXT[] NOT NULL DEFAULT '{}',
  metrics JSONB,
  dataset JSONB,
  status TEXT NOT NULL DEFAULT 'not_connected' CHECK (status IN ('not_connected','available','deprecated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (model_id, version)
);
CREATE TABLE public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_width INTEGER,
  image_height INTEGER,
  annotated_image_url TEXT,
  file_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  model_version TEXT,
  processing_time_ms INTEGER CHECK (processing_time_ms IS NULL OR processing_time_ms >= 0),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  bbox_x1 REAL NOT NULL,
  bbox_y1 REAL NOT NULL,
  bbox_x2 REAL NOT NULL,
  bbox_y2 REAL NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Low','Medium','High')),
  severity_score REAL NOT NULL CHECK (severity_score >= 0 AND severity_score <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_inspections_user_created ON public.inspections(user_id, created_at DESC);
CREATE INDEX idx_inspections_status ON public.inspections(status);
CREATE INDEX idx_detections_inspection ON public.detections(inspection_id);
CREATE INDEX idx_detections_class ON public.detections(class_name);
CREATE INDEX idx_model_versions_model ON public.model_versions(model_id);

GRANT SELECT ON public.models TO authenticated;
GRANT ALL ON public.models TO service_role;
GRANT SELECT ON public.model_versions TO authenticated;
GRANT ALL ON public.model_versions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspections TO authenticated;
GRANT ALL ON public.inspections TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.detections TO authenticated;
GRANT ALL ON public.detections TO service_role;

ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "models readable by authenticated" ON public.models FOR SELECT TO authenticated USING (true);
CREATE POLICY "model_versions readable by authenticated" ON public.model_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "own inspections" ON public.inspections FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own detections" ON public.detections FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.inspections i WHERE i.id = inspection_id AND i.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.inspections i WHERE i.id = inspection_id AND i.user_id = auth.uid()));

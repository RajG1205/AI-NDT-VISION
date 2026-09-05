# AI-NDT Vision Architecture

## System boundary

- **Web application (`src/`)**: TanStack Start UI, authenticated workflows, inspection history, analytics, reporting, and domain services.
- **Inference API (`backend/`)**: FastAPI service that validates uploads, authenticates requests, performs model inference, and returns structured detections.
- **Supabase (`supabase/`)**: PostgreSQL schema, Row Level Security, and storage migrations.
- **Static assets (`public/`)**: self-hosted product assets with no runtime dependency on external hero images.

## Request flow

`Browser → inspectionService → FastAPI → model → structured detections → Supabase → result UI/report`

Keep the ML service independently deployable. The browser must never contain private model credentials or service-role secrets.

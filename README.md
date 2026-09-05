# AI-NDT Vision

Professional SaaS platform for Non-Destructive Testing (NDT) inspection intelligence.

## System Architecture

```text
Web Application
  ├─ Supabase Auth
  ├─ Projects & Organizations
  ├─ Project Drive
  ├─ Inspection Workspace
  └─ Analytics
          │
          ├── Supabase PostgreSQL
          └── Supabase Storage
                    │
                    └── FastAPI AI Inference
```

### Core modules

- Authentication and protected workspaces
- Project and project-member management
- Private project Drive
- NDT inspection workflow
- AI inference and detection results
- Inspection history and analytics
- Reports and project documents
- Secure API boundary between frontend and inference service

## Data ownership

Projects, inspections and file metadata are stored in PostgreSQL.
Binary project assets are stored in private Supabase Storage buckets.
Row Level Security is the access-control boundary for user/project data.

## Development

```bash
npm install
npm run dev
```

Create `.env` from `.env.example` and provide the Supabase publishable configuration.

## Production principles

- Never expose service-role/secret keys in browser code.
- Keep project storage private.
- Enforce authorization with Supabase RLS.
- Keep ML inference behind the FastAPI service.
- Keep secrets and privileged operations server-side.

# Project Structure

This repository intentionally keeps the deployable surfaces explicit:

1. `src/` — customer-facing SaaS web application
2. `backend/` — independently deployable computer-vision inference API
3. `supabase/` — database/storage/auth schema migrations
4. `public/` — self-hosted static assets
5. `docs/` — architecture and operational documentation

Domain UI is grouped by responsibility under `src/components/`. Shared primitives remain under `src/components/ui/`.


## Project Drive

The current Project Drive is a browser-local persistence layer designed as a cloud-storage-ready abstraction.
Project metadata is stored in localStorage and file blobs are stored in IndexedDB. This lets the UI and
project workflow be developed without requiring Supabase Storage to be online. The storage adapter can later
be replaced by Supabase Storage without changing the Projects/Drive UI contract.

Project files are organized into:
- `source-images`
- `inspection-data`
- `reports`
- `documents`

Cloud persistence, quotas, signed URLs, and server-side access control should be enabled when Supabase Storage
is connected. The browser-local drive is not a substitute for production cloud persistence.

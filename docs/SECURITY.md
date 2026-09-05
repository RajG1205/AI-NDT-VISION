# Security Baseline

The platform preserves API-key authentication, rate limiting, request logging, upload byte limits, pixel/decompression-bomb protection, `Image.verify()`, security headers, optional API docs, and guarded inference error handling.

Supabase Row Level Security is the authoritative ownership boundary for private inspection data. Never rely on frontend filtering as an authorization mechanism.

Do not log API keys, passwords, auth tokens, or raw private image content.

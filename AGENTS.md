# AI-NDT Vision Engineering Guide

This repository is an independent AI-assisted industrial inspection application.

## Principles
- Never fabricate model predictions, metrics, datasets, or inspection findings.
- Keep the frontend independent from the Python inference service through `VITE_ML_API_URL`.
- Treat all predictions as preliminary assistance requiring qualified NDT review.
- Keep secrets server-side; only Supabase publishable credentials belong in the browser.
- Prefer small, testable changes and preserve the existing TanStack Start architecture.

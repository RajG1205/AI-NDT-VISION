from __future__ import annotations

import io
import logging
import os
import time
import uuid
from collections import deque
from pathlib import Path
from typing import Annotated

from fastapi import Depends, FastAPI, File, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

from .model import detector

logger = logging.getLogger("ai_ndt_vision")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

app = FastAPI(
    title="AI-NDT Vision Inference API",
    version="1.1.0",
    docs_url="/docs" if os.getenv("ENABLE_DOCS", "true").lower() == "true" else None,
)
MAX_BYTES = int(os.getenv("MAX_IMAGE_BYTES", str(10 * 1024 * 1024)))
# Guards against decompression-bomb style uploads: a small file that decodes
# into an enormous pixel grid can exhaust memory/CPU even though it passes
# the byte-size check above.
MAX_PIXELS = int(os.getenv("MAX_IMAGE_PIXELS", "25000000"))

# --- CORS -------------------------------------------------------------
# The frontend is a separate origin (see VITE_ML_API_URL in AGENTS.md), so
# without this the browser rejects every request even when the server would
# have accepted it. Configure explicit origins in production; "*" is a
# reasonable dev default only when no API key is required.
_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS != ["*"] else ["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# --- Security headers --------------------------------------------------
# Defense-in-depth for a service that only ever returns JSON: these headers
# cost nothing and remove a few classes of browser-side attacks (MIME
# sniffing, framing, referrer leakage, caching of sensitive responses).
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = "no-store"
    return response


# --- Optional API key -------------------------------------------------
# Unset by default (matches the original open prototype). Set NDT_API_KEY to
# require an `X-API-Key` header on every request once this is deployed
# somewhere reachable by more than localhost, so the (potentially expensive)
# model can't be hit anonymously by anyone who finds the URL.
API_KEY = os.getenv("NDT_API_KEY")


def require_api_key(x_api_key: Annotated[str | None, Header()] = None) -> None:
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(401, "Missing or invalid API key.")


# --- Minimal in-memory rate limiting -----------------------------------
# Deliberately dependency-free: a fixed-window counter per client IP is
# enough to stop naive abuse of the inference endpoint without adding
# infrastructure. Swap for Redis-backed limiting behind a real deployment.
RATE_LIMIT = int(os.getenv("RATE_LIMIT_PER_MINUTE", "20"))
_hits: dict[str, deque[float]] = {}


def enforce_rate_limit(request: Request) -> None:
    if RATE_LIMIT <= 0:
        return
    client_ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    window = _hits.setdefault(client_ip, deque())
    while window and now - window[0] > 60:
        window.popleft()
    if len(window) >= RATE_LIMIT:
        raise HTTPException(429, "Too many requests. Please slow down.")
    window.append(now)


@app.get("/")
def root():
    return {
        "name": "AI-NDT Vision Inference API",
        "status": "ok",
        "docs": "/docs",
        "health": "/api/v1/health",
    }


@app.get("/api/v1/health")
def health():
    return {"status": "ok", "model_loaded": detector.loaded}

@app.get("/api/v1/version")
def version():
    return {"model_version": detector.version, "api_version": app.version}

@app.get("/api/v1/model")
def model_info():
    return detector.info()

@app.get("/api/v1/classes")
def classes():
    return {"classes": detector.classes}

@app.post("/api/v1/predict", dependencies=[Depends(require_api_key), Depends(enforce_rate_limit)])
async def predict(
    request: Request,
    image: Annotated[UploadFile, File(...)],
    confidence: float = 0.25,
):
    if not 0 <= confidence <= 1:
        raise HTTPException(422, "confidence must be between 0 and 1")
    if image.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(415, "Only JPEG, PNG and WebP images are supported.")
    # Read at most MAX_BYTES + 1: this lets us detect an oversized upload
    # without ever buffering more than one byte past the limit in memory.
    raw = await image.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise HTTPException(413, f"Image exceeds the {MAX_BYTES // (1024*1024)} MB limit.")
    try:
        with Image.open(io.BytesIO(raw)) as probe:
            width, height = probe.size
            if width * height > MAX_PIXELS:
                raise HTTPException(413, "Image dimensions are too large for safe processing.")
            probe.verify()
        pil = Image.open(io.BytesIO(raw)).convert("RGB")
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(422, "The uploaded file is not a valid image.")
    if not detector.loaded:
        raise HTTPException(503, "No YOLO model is configured. Set NDT_MODEL_PATH to a trained .pt file.")
    started = time.perf_counter()
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    try:
        detections = detector.predict(pil, confidence)
    except Exception:
        logger.exception("Inference failed request_id=%s", request_id)
        raise HTTPException(500, "Inference failed. See server logs for details.")
    elapsed = (time.perf_counter() - started) * 1000
    logger.info(
        "predict request_id=%s model=%s detections=%d latency_ms=%.1f",
        request_id,
        detector.version,
        len(detections),
        elapsed,
    )
    return {
        "model_version": detector.version,
        "model_hash": detector.model_hash,
        "request_id": request_id,
        "processing_time_ms": round(elapsed, 2),
        "detections": detections,
        "image_width": pil.width,
        "image_height": pil.height,
    }

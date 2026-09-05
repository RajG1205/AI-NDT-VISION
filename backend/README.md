# AI-NDT Vision inference service

FastAPI + Ultralytics YOLO service. Put a genuinely trained YOLO `.pt` model at `backend/models/best.pt` or set `NDT_MODEL_PATH`.

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The service intentionally returns HTTP 503 when no model is present. It never fabricates detections or benchmark metrics.

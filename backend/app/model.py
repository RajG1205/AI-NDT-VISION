from __future__ import annotations

import hashlib
import os

import numpy as np
from pathlib import Path
from typing import Any

from PIL import Image

MODEL_PATH = Path(os.getenv("NDT_MODEL_PATH", "models/best.pt"))
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"


def severity_for(class_name: str, confidence: float, box_area_ratio: float) -> tuple[str, float]:
    # Prototype triage heuristic only; it is deliberately not an engineering acceptance rule.
    name = class_name.lower()
    class_weight = 0.85 if any(k in name for k in ("crack", "fracture")) else 0.65 if any(k in name for k in ("corrosion", "weld")) else 0.45
    score = max(0.0, min(1.0, 0.55 * confidence + 0.30 * class_weight + 0.15 * min(box_area_ratio * 20, 1)))
    severity = "High" if score >= 0.72 else "Medium" if score >= 0.45 else "Low"
    return severity, round(score, 4)

class Detector:
    def __init__(self):
        self._model = None
        self.version = os.getenv("NDT_MODEL_VERSION", "unconfigured")
        self.model_hash: str | None = None
        if DEMO_MODE:
            self.version = os.getenv("NDT_MODEL_VERSION", "demo-ndt-1.0")
            return
        if MODEL_PATH.exists():
            try:
                from ultralytics import YOLO
                self._model = YOLO(str(MODEL_PATH))
                self.version = os.getenv("NDT_MODEL_VERSION", MODEL_PATH.stem)
                self.model_hash = hashlib.sha256(MODEL_PATH.read_bytes()).hexdigest()[:16]
            except Exception:
                self._model = None

    @property
    def loaded(self) -> bool:
        return self._model is not None or DEMO_MODE

    @property
    def classes(self) -> list[str]:
        if DEMO_MODE and self._model is None:
            return ["Potential Indication (Demo)"]
        if not self.loaded:
            return []
        names = self._model.names
        return [str(names[i]) for i in sorted(names)]

    def info(self) -> dict[str, Any]:
        return {"name": "YOLO NDT Defect Detector", "version": self.version, "hash": self.model_hash, "status": "demo" if DEMO_MODE and self._model is None else ("available" if self.loaded else "not_connected"), "mode": "demo" if DEMO_MODE and self._model is None else "model", "classes": self.classes, "dataset": None, "metrics": None, "limitations": ["Demo mode provides deterministic simulated indications and is not a trained defect detector.", "Model performance depends on its training data and deployment conditions.", "Severity is a prototype triage heuristic and not an acceptance criterion.", "Predictions require qualified NDT review."], "device": getattr(self._model, "device", None).__str__() if self.loaded else None}

    def predict(self, image: Image.Image, confidence: float) -> list[dict[str, Any]]:
        if DEMO_MODE and self._model is None:
            gray = np.asarray(image.convert("L"), dtype=np.float32)
            contrast = float(gray.std() / 64.0)
            score = max(0.35, min(0.92, 0.55 + contrast * 0.18))
            if score < confidence:
                return []
            w, h = image.size
            box_w, box_h = w * 0.24, h * 0.16
            x1, y1 = (w - box_w) / 2, (h - box_h) / 2
            severity, severity_score = severity_for("Potential Indication (Demo)", score, (box_w * box_h) / (w * h))
            return [{"class": "Potential Indication (Demo)", "confidence": round(score, 6), "bbox": {"x1": round(x1, 2), "y1": round(y1, 2), "x2": round(x1 + box_w, 2), "y2": round(y1 + box_h, 2)}, "severity": severity, "severity_score": severity_score}]

        results = self._model.predict(source=image, conf=confidence, verbose=False)
        result = results[0]
        names = result.names
        output = []
        image_area = image.width * image.height
        for box in result.boxes:
            coords = box.xyxy[0].tolist()
            cls = int(box.cls[0].item())
            conf = float(box.conf[0].item())
            area = max(0.0, (coords[2] - coords[0]) * (coords[3] - coords[1]))
            severity, score = severity_for(str(names[cls]), conf, area / image_area if image_area else 0)
            output.append({"class": str(names[cls]), "confidence": round(conf, 6), "bbox": {"x1": round(coords[0], 2), "y1": round(coords[1], 2), "x2": round(coords[2], 2), "y2": round(coords[3], 2)}, "severity": severity, "severity_score": score})
        return output

detector = Detector()

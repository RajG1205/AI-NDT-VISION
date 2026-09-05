from __future__ import annotations

import hashlib
import os
from pathlib import Path
from typing import Any

from PIL import Image

MODEL_PATH = Path(os.getenv("NDT_MODEL_PATH", "models/best.pt"))
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"
ALLOW_SIMULATION = os.getenv("ALLOW_SIMULATION", "false").lower() == "true"


def severity_for(class_name: str, confidence: float, box_area_ratio: float) -> tuple[str, float]:
    """Prototype triage score only; never an engineering acceptance criterion."""
    name = class_name.lower()
    class_weight = (
        0.85
        if any(k in name for k in ("crack", "fracture"))
        else 0.65
        if any(k in name for k in ("corrosion", "weld"))
        else 0.45
    )
    score = max(
        0.0,
        min(
            1.0,
            0.55 * confidence
            + 0.30 * class_weight
            + 0.15 * min(box_area_ratio * 20, 1),
        ),
    )
    severity = "High" if score >= 0.72 else "Medium" if score >= 0.45 else "Low"
    return severity, round(score, 4)


class Detector:
    def __init__(self) -> None:
        self._model = None
        self.version = os.getenv("NDT_MODEL_VERSION", "unconfigured")
        self.model_hash: str | None = None
        self.mode = "unconfigured"

        # Simulation is intentionally opt-in. Production must never manufacture
        # a defect, confidence value, or bounding box when no trained model exists.
        if DEMO_MODE and ALLOW_SIMULATION:
            self.version = os.getenv("NDT_MODEL_VERSION", "simulation-ndt-1.0")
            self.mode = "simulation"
            return

        if MODEL_PATH.exists():
            try:
                from ultralytics import YOLO

                self._model = YOLO(str(MODEL_PATH))
                self.version = os.getenv("NDT_MODEL_VERSION", MODEL_PATH.stem)
                self.model_hash = hashlib.sha256(MODEL_PATH.read_bytes()).hexdigest()[:16]
                self.mode = "model"
            except Exception:
                self._model = None
                self.mode = "model_error"

    @property
    def loaded(self) -> bool:
        return self._model is not None or self.mode == "simulation"

    @property
    def classes(self) -> list[str]:
        if self.mode == "simulation":
            return ["Simulated Indication"]
        if self._model is None:
            return []
        names = self._model.names
        return [str(names[i]) for i in sorted(names)]

    def info(self) -> dict[str, Any]:
        limitations = [
            "Predictions require qualified NDT review.",
            "Severity is a prototype triage heuristic and not an acceptance criterion.",
        ]

        if self.mode == "simulation":
            limitations.insert(
                0,
                "Simulation mode is for UI/workflow testing only and is not a trained defect detector.",
            )
        elif self.mode != "model":
            limitations.insert(
                0,
                "No trained NDT model is configured. Inference is intentionally disabled.",
            )

        return {
            "name": "YOLO NDT Defect Detector",
            "version": self.version,
            "hash": self.model_hash,
            "status": (
                "simulation"
                if self.mode == "simulation"
                else "available"
                if self.mode == "model"
                else "not_connected"
            ),
            "mode": self.mode,
            "classes": self.classes,
            "dataset": None,
            "metrics": None,
            "limitations": limitations,
            "device": str(getattr(self._model, "device", "")) if self._model else None,
        }

    def predict(self, image: Image.Image, confidence: float) -> list[dict[str, Any]]:
        if self.mode == "simulation":
            # Keep simulation deterministic and unmistakably labelled. It exists
            # only to exercise the frontend/report/storage workflow.
            w, h = image.size
            box_w, box_h = w * 0.20, h * 0.12
            x1, y1 = (w - box_w) / 2, (h - box_h) / 2
            simulated_confidence = 0.50

            if simulated_confidence < confidence:
                return []

            severity, severity_score = severity_for(
                "Simulated Indication",
                simulated_confidence,
                (box_w * box_h) / (w * h),
            )
            return [
                {
                    "class": "Simulated Indication",
                    "confidence": simulated_confidence,
                    "bbox": {
                        "x1": round(x1, 2),
                        "y1": round(y1, 2),
                        "x2": round(x1 + box_w, 2),
                        "y2": round(y1 + box_h, 2),
                    },
                    "severity": severity,
                    "severity_score": severity_score,
                }
            ]

        if self._model is None:
            raise RuntimeError("No trained NDT model is configured.")

        results = self._model.predict(source=image, conf=confidence, verbose=False)
        result = results[0]
        names = result.names
        output: list[dict[str, Any]] = []
        image_area = image.width * image.height

        for box in result.boxes:
            coords = box.xyxy[0].tolist()
            cls = int(box.cls[0].item())
            conf = float(box.conf[0].item())
            area = max(0.0, (coords[2] - coords[0]) * (coords[3] - coords[1]))
            severity, score = severity_for(
                str(names[cls]),
                conf,
                area / image_area if image_area else 0,
            )
            output.append(
                {
                    "class": str(names[cls]),
                    "confidence": round(conf, 6),
                    "bbox": {
                        "x1": round(coords[0], 2),
                        "y1": round(coords[1], 2),
                        "x2": round(coords[2], 2),
                        "y2": round(coords[3], 2),
                    },
                    "severity": severity,
                    "severity_score": score,
                }
            )

        return output


detector = Detector()

"""
URBANTRACK AI - ANPR Pipeline & License Plate Normalizer
Handles plate localization, multi-frame OCR aggregation, regex format validation
(e.g., standard Indian HSRP / State formats like MH12AB1234), and confidence scoring.
"""

import re
from typing import Dict, Any, List, Optional
from collections import Counter

class PlateValidator:
    """Validates and normalizes license plate strings."""
    # Standard format: 2 letters (state) + 2 digits (district) + 1-2 letters + 4 digits
    INDIAN_PLATE_REGEX = re.compile(r'^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$')
    GENERIC_PLATE_REGEX = re.compile(r'^[A-Z0-9]{5,10}$')

    @classmethod
    def clean_text(cls, raw_text: str) -> str:
        """Removes spaces, hyphens, and non-alphanumeric characters, converts to uppercase."""
        cleaned = re.sub(r'[^A-Za-z0-9]', '', raw_text).upper()
        # Common OCR character substitutions
        substitutions = {
            'O': '0', # In digit positions
            'I': '1',
            'Z': '2'
        }
        return cleaned

    @classmethod
    def validate(cls, plate_text: str) -> Dict[str, Any]:
        cleaned = cls.clean_text(plate_text)
        is_standard = bool(cls.INDIAN_PLATE_REGEX.match(cleaned))
        is_generic = bool(cls.GENERIC_PLATE_REGEX.match(cleaned))
        return {
            "cleaned": cleaned,
            "is_valid": is_standard or is_generic,
            "is_standard_format": is_standard,
            "format_type": "INDIAN_HSRP" if is_standard else ("GENERIC" if is_generic else "INVALID")
        }

class ANPRService:
    """
    ANPR multi-frame aggregation service.
    Aggregates noisy OCR readings over a track lifetime to arrive at the highest-confidence plate.
    """
    def __init__(self):
        # Maps track_id -> List of {plate: str, confidence: float}
        self.track_readings: Dict[str, List[Dict[str, Any]]] = {}

    def add_reading(self, track_id: str, raw_ocr: str, confidence: float) -> Dict[str, Any]:
        val = PlateValidator.validate(raw_ocr)
        cleaned = val["cleaned"]
        if not cleaned:
            return {"track_id": track_id, "consensus_plate": "UNKNOWN", "confidence": 0.0, "observations": 0}

        if track_id not in self.track_readings:
            self.track_readings[track_id] = []
        self.track_readings[track_id].append({
            "plate": cleaned,
            "confidence": confidence,
            "is_valid": val["is_valid"]
        })

        return self.get_consensus(track_id)

    def get_consensus(self, track_id: str) -> Dict[str, Any]:
        readings = self.track_readings.get(track_id, [])
        if not readings:
            return {"consensus_plate": "UNKNOWN", "confidence": 0.0, "observations": 0}

        # Weighted voting by confidence
        score_by_plate: Dict[str, float] = {}
        for r in readings:
            p = r["plate"]
            score_by_plate[p] = score_by_plate.get(p, 0.0) + r["confidence"]

        best_plate, total_score = max(score_by_plate.items(), key=lambda item: item[1])
        plate_count = sum(1 for r in readings if r["plate"] == best_plate)
        avg_conf = min(0.99, total_score / max(1, plate_count))

        return {
            "track_id": track_id,
            "consensus_plate": best_plate,
            "confidence": round(avg_conf, 3),
            "observations": len(readings)
        }

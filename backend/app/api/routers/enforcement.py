"""
Point-to-Point Section Speed Enforcement (ASOD) & E-Challan API Router
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any
from ai.enforcement.asod_engine import ASODEnforcementEngine, CORRIDOR_SEGMENTS

router = APIRouter(prefix="/enforcement", tags=["Section Speed Enforcement"])

_engine = ASODEnforcementEngine()

@router.get("/violations")
def get_violations():
    return _engine.get_all_violations()

@router.get("/challan/{citation_id}")
def get_challan(citation_id: str):
    citation = _engine.get_citation(citation_id)
    if not citation:
        raise HTTPException(status_code=404, detail="Citation ID not found")
    return citation

@router.get("/segments")
def get_segments():
    return list(CORRIDOR_SEGMENTS.values())

@router.post("/calculate-asod")
def calculate_asod(req: Dict[str, Any]):
    distance = float(req.get("distance_meters", 1200.0))
    time_delta = float(req.get("time_delta_seconds", 51.1))
    speed_limit = float(req.get("speed_limit_kmh", 50.0))
    res = _engine.calculate_asod(distance, time_delta, speed_limit)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res

"""
Emergency Vehicle Priority & Green Wave Preemption API Router
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any
import time
from ai.emergency.green_wave_engine import GreenWaveEngine

router = APIRouter(prefix="/emergency", tags=["Emergency Green Wave"])

_engine = GreenWaveEngine()

@router.get("/active")
def get_active_emergencies():
    return list(_engine.active_emergencies.values())

@router.get("/hospitals")
def get_trauma_centers():
    return _engine.get_trauma_centers()

@router.post("/step")
def update_preemption_step(req: Dict[str, Any]):
    emergency_id = req.get("emergency_id", "AMB_108_ALPHA")
    step_index = req.get("step_index", 0)
    res = _engine.update_preemption_step(emergency_id, step_index)
    if not res:
        raise HTTPException(status_code=404, detail="Emergency ID not found")
    return res

@router.post("/toggle-corridor")
def toggle_corridor(req: Dict[str, Any]):
    emergency_id = req.get("emergency_id", "AMB_108_ALPHA")
    active = req.get("active", True)
    em = _engine.active_emergencies.get(emergency_id)
    if not em:
        raise HTTPException(status_code=404, detail="Emergency ID not found")
    em["status"] = "GREEN_CORRIDOR_ACTIVE" if active else "CORRIDOR_SUSPENDED"
    return em

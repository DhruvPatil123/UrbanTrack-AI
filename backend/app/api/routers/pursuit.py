"""
Automated Intercept & Red Notice Pursuit Router
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any
import time
from backend.app.services.data_store import UrbanTrackDataStore
from ai.pursuit.intercept_engine import InterceptEngine

router = APIRouter(prefix="/pursuit", tags=["Pursuit & Intercept"])

# Singleton InterceptEngine instance
_engine = InterceptEngine()
# Pre-seed canonical showcase Red Notice on V000123
_engine.create_red_notice(
    global_vehicle_id="V000123",
    plate_number="MH12AB1234",
    vehicle_type="car",
    offense="Hit-and-Run Incident with Severe Injury at University Circle Junction",
    severity="CRITICAL",
    reporting_officer="Insp. R. Sharma (Badge #8841)"
)

@router.get("/red-notices")
def list_red_notices():
    return list(_engine.active_red_notices.values())

@router.post("/red-notice")
def create_red_notice(req: Dict[str, Any]):
    return _engine.create_red_notice(
        global_vehicle_id=req.get("global_vehicle_id", "V000123"),
        plate_number=req.get("plate_number", "MH12AB1234"),
        vehicle_type=req.get("vehicle_type", "car"),
        offense=req.get("offense", "Fleeing Law Enforcement"),
        severity=req.get("severity", "CRITICAL"),
        reporting_officer=req.get("reporting_officer", "Duty Officer")
    )

@router.get("/intercept-prediction/{vehicle_id}")
def get_intercept_prediction(vehicle_id: str):
    store = UrbanTrackDataStore.get_instance()
    v = store.vehicles.get(vehicle_id)
    last_cam = v["camera_sequence"][-1] if v and v.get("camera_sequence") else "CAM02"
    speed = v.get("avg_speed_kmh", 46.5) if v else 46.5
    return _engine.predict_downstream_intercept(vehicle_id, last_cam, speed)

@router.get("/geofences")
def get_geofences():
    return _engine.geofences

@router.get("/dossier/{vehicle_id}")
def get_investigation_dossier(vehicle_id: str):
    store = UrbanTrackDataStore.get_instance()
    traj = store.trajectories.get(vehicle_id, {})
    obs = [o for o in store.observations.values() if o.get("global_vehicle_id") == vehicle_id]
    if not obs:
        obs = [
            {"camera_id": "CAM01", "timestamp": time.time() - 370, "plate_text": "MH12AB1234"},
            {"camera_id": "CAM02", "timestamp": time.time() - 275, "plate_text": "MH12AB1234"},
            {"camera_id": "CAM05", "timestamp": time.time() - 150, "plate_text": "MH12AB1234"},
            {"camera_id": "CAM08", "timestamp": time.time() - 10, "plate_text": "MH12AB1234"}
        ]
    return _engine.generate_investigation_dossier(vehicle_id, obs, traj)

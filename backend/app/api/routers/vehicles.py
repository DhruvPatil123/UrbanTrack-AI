"""
Vehicles Router
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
import time
from backend.app.models.schemas import VehicleSchema
from backend.app.services.data_store import UrbanTrackDataStore

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

@router.get("", response_model=List[VehicleSchema])
def list_vehicles(limit: int = 50):
    store = UrbanTrackDataStore.get_instance()
    return list(store.vehicles.values())[:limit]

@router.get("/search", response_model=List[VehicleSchema])
def search_vehicles(
    query: Optional[str] = Query(None, description="Search by plate or global ID"),
    vehicle_type: Optional[str] = Query(None, description="Filter by vehicle type"),
    camera_id: Optional[str] = Query(None, description="Filter by camera traversed")
):
    store = UrbanTrackDataStore.get_instance()
    results = list(store.vehicles.values())

    # Log search in audit log
    store.audit_logs.append({
        "timestamp": time.time(),
        "action": "VEHICLE_SEARCH",
        "query": query,
        "type_filter": vehicle_type,
        "camera_filter": camera_id
    })

    if query:
        q = query.strip().upper()
        results = [v for v in results if q in v["global_vehicle_id"] or q in v["plate_number"]]

    if vehicle_type:
        results = [v for v in results if v["vehicle_type"].lower() == vehicle_type.lower()]

    if camera_id:
        results = [v for v in results if camera_id in v["camera_sequence"]]

    return results

@router.get("/{vehicle_id}", response_model=VehicleSchema)
def get_vehicle(vehicle_id: str):
    store = UrbanTrackDataStore.get_instance()
    v = store.vehicles.get(vehicle_id)
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return v

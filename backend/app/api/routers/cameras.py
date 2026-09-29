"""
Cameras Router
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from backend.app.models.schemas import CameraSchema
from backend.app.services.data_store import UrbanTrackDataStore

router = APIRouter(prefix="/cameras", tags=["Cameras"])

@router.get("", response_model=List[CameraSchema])
def list_cameras():
    store = UrbanTrackDataStore.get_instance()
    return list(store.cameras.values())

@router.get("/{camera_id}", response_model=CameraSchema)
def get_camera(camera_id: str):
    store = UrbanTrackDataStore.get_instance()
    cam = store.cameras.get(camera_id)
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    return cam

@router.get("/{camera_id}/topology")
def get_camera_topology(camera_id: str):
    store = UrbanTrackDataStore.get_instance()
    if camera_id not in store.cameras:
        raise HTTPException(status_code=404, detail="Camera not found")
    downstream = store.topology.get_downstream_cameras(camera_id)
    connections = [store.topology.get_connection(camera_id, dst) for dst in downstream]
    return {
        "camera_id": camera_id,
        "downstream_cameras": downstream,
        "connections": connections
    }

"""
Events Router
"""

from fastapi import APIRouter
from typing import List
from backend.app.models.schemas import EventSchema
from backend.app.services.data_store import UrbanTrackDataStore

router = APIRouter(prefix="/events", tags=["Anomaly Events"])

@router.get("", response_model=List[EventSchema])
def list_events():
    store = UrbanTrackDataStore.get_instance()
    return store.anomaly_detector.active_events

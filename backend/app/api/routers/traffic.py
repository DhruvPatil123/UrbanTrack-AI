"""
Traffic Analytics Router
"""

from fastapi import APIRouter
from typing import List
from backend.app.models.schemas import TrafficMetricSchema, RoadSchema
from backend.app.services.data_store import UrbanTrackDataStore

router = APIRouter(prefix="/traffic", tags=["Traffic Analytics"])

@router.get("/roads", response_model=List[TrafficMetricSchema])
def get_road_traffic_metrics():
    store = UrbanTrackDataStore.get_instance()
    return store.analytics_service.get_all_road_metrics()

@router.get("/network", response_model=List[RoadSchema])
def get_road_network():
    store = UrbanTrackDataStore.get_instance()
    return list(store.roads.values())

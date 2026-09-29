"""
Predictions Router
"""

from fastapi import APIRouter
from typing import List, Dict, Any
from backend.app.services.data_store import UrbanTrackDataStore

router = APIRouter(prefix="/predictions", tags=["Congestion Predictions"])

@router.get("")
def get_predictions() -> List[Dict[str, Any]]:
    store = UrbanTrackDataStore.get_instance()
    current_metrics = store.analytics_service.get_all_road_metrics()
    return store.predictor.predict_corridors(current_metrics)

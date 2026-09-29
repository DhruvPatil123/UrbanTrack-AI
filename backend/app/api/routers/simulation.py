"""
What-If Simulation Router
"""

from fastapi import APIRouter
from typing import Dict, Any
from backend.app.models.schemas import SimulationRequest
from backend.app.services.data_store import UrbanTrackDataStore

router = APIRouter(prefix="/simulation", tags=["Simulation"])

@router.post("/road-closure")
def simulate_road_closure(req: SimulationRequest) -> Dict[str, Any]:
    store = UrbanTrackDataStore.get_instance()
    return store.closure_simulator.simulate_closure(req.road_to_close)

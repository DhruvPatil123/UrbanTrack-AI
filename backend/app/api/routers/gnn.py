"""
GNN Matching Router
"""

from fastapi import APIRouter
from backend.app.models.schemas import GNNMatchRequest, GNNMatchResponse
from backend.app.services.data_store import UrbanTrackDataStore

router = APIRouter(prefix="/gnn", tags=["GNN Matching Engine"])

@router.post("/match", response_model=GNNMatchResponse)
def match_observations(req: GNNMatchRequest):
    store = UrbanTrackDataStore.get_instance()
    res = store.gnn_service.match_observations(req.obs_a, req.obs_b)
    return res

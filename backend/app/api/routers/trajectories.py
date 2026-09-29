"""
Trajectories Router
"""

from fastapi import APIRouter, HTTPException
from backend.app.models.schemas import TrajectorySchema
from backend.app.services.data_store import UrbanTrackDataStore

router = APIRouter(prefix="/trajectories", tags=["Trajectories"])

@router.get("/{vehicle_id}", response_model=TrajectorySchema)
def get_vehicle_trajectory(vehicle_id: str):
    store = UrbanTrackDataStore.get_instance()
    traj = store.trajectories.get(vehicle_id)
    if not traj:
        raise HTTPException(status_code=404, detail="Trajectory not found for vehicle")
    return traj

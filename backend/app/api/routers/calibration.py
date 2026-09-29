"""
Camera Perspective Calibration & Planar Homography API Router
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from ai.calibration.homography import HomographyEngine

router = APIRouter(prefix="/calibration", tags=["Camera Calibration"])

_engine = HomographyEngine()

@router.get("/camera/{camera_id}")
def get_camera_calibration(camera_id: str):
    return _engine.get_calibration(camera_id)

@router.post("/solve")
def solve_homography(payload: Dict[str, Any]):
    src_points = payload.get("src_points")
    road_width = float(payload.get("road_width_meters", 7.5))
    road_length = float(payload.get("corridor_length_meters", 30.0))
    camera_id = payload.get("camera_id", "CAM01")

    if not src_points or len(src_points) != 4:
        raise HTTPException(status_code=400, detail="Exactly 4 source coordinates required")

    return _engine.update_calibration(camera_id, src_points, road_width, road_length)

@router.post("/project-point")
def project_point(payload: Dict[str, Any]):
    x = float(payload.get("x", 0.0))
    y = float(payload.get("y", 0.0))
    H = payload.get("homography_matrix")
    if not H or len(H) != 3:
        raise HTTPException(status_code=400, detail="Valid 3x3 homography matrix required")
    proj = _engine.project_point(x, y, H)
    return {"ground_x_meters": proj[0], "ground_y_meters": proj[1]}

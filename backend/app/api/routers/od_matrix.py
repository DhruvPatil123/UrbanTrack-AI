"""
Origin-Destination (O-D) Matrix & Flow Analytics API Router
"""

from fastapi import APIRouter, Query
from typing import Dict, List, Any
from ai.analytics.od_matrix import ODMatrixEngine

router = APIRouter(prefix="/od", tags=["O-D Matrix & Flows"])

_engine = ODMatrixEngine()

@router.get("/matrix")
def get_od_matrix(time_period: str = Query("MORNING_PEAK", description="MORNING_PEAK | EVENING_PEAK | OFF_PEAK")):
    return _engine.get_od_matrix(time_period)

@router.get("/sankey")
def get_sankey_flow(time_period: str = Query("MORNING_PEAK", description="MORNING_PEAK | EVENING_PEAK | OFF_PEAK")):
    return _engine.get_sankey_flow(time_period)

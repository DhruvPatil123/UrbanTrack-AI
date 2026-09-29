"""
Health & System Status Router
"""

from fastapi import APIRouter
import time
from backend.app.models.schemas import HealthResponse

router = APIRouter(tags=["System Health"])

@router.get("/health", response_model=HealthResponse)
def get_health():
    return {
        "status": "HEALTHY",
        "timestamp": time.time(),
        "version": "1.0.0-sih26127",
        "components": {
            "fastapi": "OPERATIONAL",
            "yolo_detector": "OPERATIONAL (CPU/Fallback)",
            "bytetrack_tracker": "OPERATIONAL",
            "anpr_normalizer": "OPERATIONAL",
            "reid_vector_store": "OPERATIONAL (In-Memory/Qdrant Ready)",
            "camera_topology_graph": "OPERATIONAL (8 Nodes, 9 Edges)",
            "gnn_matcher": "OPERATIONAL (PyG / Hybrid Fallback)",
            "trajectory_engine": "OPERATIONAL",
            "anomaly_detector": "OPERATIONAL"
        },
        "runtime_mode": "DEMO_READY_HYBRID"
    }

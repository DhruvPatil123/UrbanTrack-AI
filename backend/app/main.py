"""
URBANTRACK AI - FastAPI Gateway
City-Wide AI Engine for Multi-Camera ANPR Trajectory Tracking and Urban Traffic Analytics
Smart India Hackathon (SIH26127) | Team AI007 (RepoRiders)
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import time

from backend.app.api.routers import (
    cameras,
    vehicles,
    trajectories,
    traffic,
    events,
    predictions,
    simulation,
    gnn,
    health,
    pursuit,
    emergency,
    od_matrix,
    enforcement,
    voice,
    calibration
)
from backend.app.services.data_store import UrbanTrackDataStore

app = FastAPI(
    title="URBANTRACK AI API",
    description="City-Wide Multi-Camera ANPR Trajectory Tracking & Urban Traffic Analytics Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api/v1
API_PREFIX = "/api/v1"
app.include_router(health.router, prefix=API_PREFIX)
app.include_router(cameras.router, prefix=API_PREFIX)
app.include_router(vehicles.router, prefix=API_PREFIX)
app.include_router(trajectories.router, prefix=API_PREFIX)
app.include_router(traffic.router, prefix=API_PREFIX)
app.include_router(events.router, prefix=API_PREFIX)
app.include_router(predictions.router, prefix=API_PREFIX)
app.include_router(simulation.router, prefix=API_PREFIX)
app.include_router(gnn.router, prefix=API_PREFIX)
app.include_router(pursuit.router, prefix=API_PREFIX)
app.include_router(emergency.router, prefix=API_PREFIX)
app.include_router(od_matrix.router, prefix=API_PREFIX)
app.include_router(enforcement.router, prefix=API_PREFIX)
app.include_router(voice.router, prefix=API_PREFIX)
app.include_router(calibration.router, prefix=API_PREFIX)

@app.get("/")
def root():
    return {
        "project": "URBANTRACK AI",
        "description": "City-Wide AI Engine for Multi-Camera ANPR Trajectory Tracking and Urban Traffic Analytics",
        "sih_id": "SIH26127",
        "team": "AI007 (RepoRiders)",
        "docs": "/docs",
        "api_v1": "/api/v1"
    }

# WebSocket Telemetry Hub
@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    store = UrbanTrackDataStore.get_instance()
    try:
        while True:
            # Emit live telemetry heartbeat with camera counts and recent metrics
            msg = {
                "type": "TELEMETRY_PULSE",
                "timestamp": time.time(),
                "active_cameras": len(store.cameras),
                "tracked_vehicles": len(store.vehicles),
                "active_alerts": len(store.anomaly_detector.active_events),
                "corridor_status": "MONITORING"
            }
            await websocket.send_text(json.dumps(msg))
            await asyncio.sleep(2.0)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass

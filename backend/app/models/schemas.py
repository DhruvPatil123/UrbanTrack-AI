"""
URBANTRACK AI - Pydantic Data Models & Schemas
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import time

class CameraSchema(BaseModel):
    camera_id: str
    name: str
    latitude: float
    longitude: float
    road_id: str
    junction_id: Optional[str] = None
    direction: str
    fps: int = 25
    source_uri: str
    status: str = "ONLINE"
    enabled: bool = True
    active_detections: int = 0

class RoadSchema(BaseModel):
    road_id: str
    name: str
    speed_limit_kmh: float
    lanes: int
    length_km: float
    road_type: str = "ARTERIAL"
    status: str = "OPEN"

class ObservationSchema(BaseModel):
    observation_id: str
    camera_id: str
    global_vehicle_id: Optional[str] = None
    local_track_id: str
    timestamp: float
    bbox: List[float]
    vehicle_type: str
    plate_text: Optional[str] = None
    plate_confidence: float = 0.0
    detection_confidence: float = 0.90
    reid_embedding_id: Optional[str] = None

class VehicleSchema(BaseModel):
    global_vehicle_id: str
    vehicle_type: str
    plate_number: str
    first_seen: float
    last_seen: float
    total_distance_km: float
    avg_speed_kmh: float
    observations_count: int
    camera_sequence: List[str]

class TrajectorySchema(BaseModel):
    trajectory_id: str
    global_vehicle_id: str
    status: str
    validation_flags: List[str]
    first_seen: float
    last_seen: float
    camera_sequence: List[str]
    road_sequence: List[str]
    segments: List[Dict[str, Any]]
    total_distance_km: float
    total_duration_sec: float
    avg_speed_kmh: float
    path_summary: str

class TrafficMetricSchema(BaseModel):
    road_id: str
    road_name: str
    timestamp: float
    vehicle_count: int
    density_vpk: float
    avg_speed_kmh: float
    free_flow_speed_kmh: float
    flow_vph: int
    travel_time_sec: float
    travel_time_index: float
    congestion_level: str
    status_color: str

class EventSchema(BaseModel):
    event_id: str
    event_type: str
    severity: str
    camera_id: str
    road_id: str
    global_vehicle_id: Optional[str] = None
    timestamp: float
    confidence: float
    description: str
    resolved: bool = False

class GNNMatchRequest(BaseModel):
    obs_a: Dict[str, Any]
    obs_b: Dict[str, Any]

class GNNMatchResponse(BaseModel):
    same_vehicle_probability: float
    decision: str
    confidence: float
    model_version: str
    rule_baseline_score: float
    features: Dict[str, Any]

class SimulationRequest(BaseModel):
    road_to_close: str

class HealthResponse(BaseModel):
    status: str
    timestamp: float
    version: str
    components: Dict[str, str]
    runtime_mode: str

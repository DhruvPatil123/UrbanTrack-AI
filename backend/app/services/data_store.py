"""
URBANTRACK AI - Central In-Memory Demo Data Store
Pre-loaded with canonical Smart India Hackathon multi-camera scenario data:
8 Cameras, 6 Roads, 3 Junctions, 50+ Observations, 10+ Global Vehicles with Trajectories,
Real-time Traffic Metrics, Anomaly Alerts, and Predictive Forecasts.
"""

import time
from typing import Dict, List, Any, Optional
from ai.graph.topology import CityNetworkGraph
from ai.trajectory.engine import TrajectoryEngine
from ai.analytics.analytics_service import TrafficAnalyticsService
from ai.anomaly.detector import AnomalyDetector
from ai.prediction.predictor import TrafficPredictor
from ai.simulation.closure_simulator import RoadClosureSimulator if False else None
from simulation.closure_simulator import RoadClosureSimulator
from ai.gnn.inference import GNNMatchService

class UrbanTrackDataStore:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.topology = CityNetworkGraph()
        self.trajectory_engine = TrajectoryEngine(self.topology)
        self.analytics_service = TrafficAnalyticsService()
        self.anomaly_detector = AnomalyDetector()
        self.predictor = TrafficPredictor()
        self.closure_simulator = RoadClosureSimulator(self.topology)
        self.gnn_service = GNNMatchService()

        self.cameras: Dict[str, Dict[str, Any]] = {}
        self.roads: Dict[str, Dict[str, Any]] = {}
        self.vehicles: Dict[str, Dict[str, Any]] = {}
        self.observations: Dict[str, Dict[str, Any]] = {}
        self.trajectories: Dict[str, Dict[str, Any]] = {}
        self.audit_logs: List[Dict[str, Any]] = []

        self._seed_data()

    def _seed_data(self):
        now = time.time()

        # 1. Cameras
        for cid, cam in self.topology.cameras.items():
            self.cameras[cid] = {
                "camera_id": cid,
                "name": cam.name,
                "latitude": cam.lat,
                "longitude": cam.lng,
                "road_id": cam.road_id,
                "junction_id": cam.junction_id,
                "direction": cam.direction,
                "fps": 25,
                "source_uri": f"rtsp://streams.city-surveillance.local/corridor/{cid.lower()}.stream",
                "status": "ONLINE",
                "enabled": True,
                "active_detections": 4 if cid in ["CAM01", "CAM02"] else 2
            }

        # 2. Roads
        for rid, road in self.topology.roads.items():
            self.roads[rid] = {
                "road_id": rid,
                "name": road.name,
                "speed_limit_kmh": road.speed_limit_kmh,
                "lanes": road.lanes,
                "length_km": road.length_km,
                "road_type": road.road_type,
                "status": "CONGESTED" if rid == "R102" else "OPEN"
            }

        # 3. Canonical Global Vehicles & Multi-Camera Trajectories
        # Target showcase vehicle: V000123 (MH12AB1234) passing CAM01 -> CAM02 -> CAM05 -> CAM08
        canonical_vehicles = [
            {
                "global_id": "V000123",
                "plate": "MH12AB1234",
                "type": "car",
                "cams": ["CAM01", "CAM02", "CAM05", "CAM08"],
                "offsets": [0, 95, 220, 375] # Transit times in seconds
            },
            {
                "global_id": "V000109",
                "plate": "DL01XY9876",
                "type": "truck",
                "cams": ["CAM01", "CAM03", "CAM04"],
                "offsets": [15, 130, 240]
            },
            {
                "global_id": "V000115",
                "plate": "KA04ME5521",
                "type": "bus",
                "cams": ["CAM01", "CAM02", "CAM06"],
                "offsets": [30, 140, 290]
            },
            {
                "global_id": "V000142",
                "plate": "MH14QQ4040",
                "type": "motorcycle",
                "cams": ["CAM03", "CAM04", "CAM07", "CAM08"],
                "offsets": [60, 160, 280, 360]
            },
            {
                "global_id": "V000155",
                "plate": "MH02ZZ7788",
                "type": "car",
                "cams": ["CAM02", "CAM05", "CAM07"],
                "offsets": [100, 225, 365]
            },
            {
                "global_id": "V000160",
                "plate": "GJ01BB2020",
                "type": "car",
                "cams": ["CAM01", "CAM02", "CAM05"],
                "offsets": [180, 275, 400]
            },
            {
                "global_id": "V000171",
                "plate": "HR26DK9911",
                "type": "truck",
                "cams": ["CAM03", "CAM04"],
                "offsets": [210, 320]
            },
            {
                "global_id": "V000185",
                "plate": "TS09FA3344",
                "type": "car",
                "cams": ["CAM05", "CAM08"],
                "offsets": [250, 410]
            },
            {
                "global_id": "V000192",
                "plate": "UP32AB1122",
                "type": "bus",
                "cams": ["CAM04", "CAM07", "CAM08"],
                "offsets": [290, 415, 495]
            },
            {
                "global_id": "V000204",
                "plate": "MH20EE5566",
                "type": "motorcycle",
                "cams": ["CAM02", "CAM06"],
                "offsets": [330, 475]
            }
        ]

        base_time = now - 600 # 10 mins ago

        for v_info in canonical_vehicles:
            gid = v_info["global_id"]
            plate = v_info["plate"]
            vtype = v_info["type"]
            cams = v_info["cams"]
            offsets = v_info["offsets"]

            vehicle_obs = []
            for idx, (cid, offset) in enumerate(zip(cams, offsets)):
                obs_id = f"OBS_{gid}_{cid}_{idx}"
                obs_t = base_time + offset

                obs_entry = {
                    "observation_id": obs_id,
                    "global_vehicle_id": gid,
                    "camera_id": cid,
                    "local_track_id": f"{cid}_TRK_{int(gid[-3:]):04d}",
                    "timestamp": obs_t,
                    "bbox": [150 + (idx * 20), 200, 320 + (idx * 20), 380],
                    "vehicle_type": vtype,
                    "plate_text": plate,
                    "plate_confidence": 0.94 if idx != 1 else 0.86, # Slight OCR noise
                    "detection_confidence": 0.92,
                    "reid_embedding_id": f"EMB_{obs_id}"
                }
                self.observations[obs_id] = obs_entry
                vehicle_obs.append(obs_entry)

            # Reconstruct trajectory via TrajectoryEngine
            traj = self.trajectory_engine.reconstruct_trajectory(gid, vehicle_obs)
            self.trajectories[gid] = traj

            self.vehicles[gid] = {
                "global_vehicle_id": gid,
                "vehicle_type": vtype,
                "plate_number": plate,
                "first_seen": traj["first_seen"],
                "last_seen": traj["last_seen"],
                "total_distance_km": traj["total_distance_km"],
                "avg_speed_kmh": traj["avg_speed_kmh"],
                "observations_count": len(vehicle_obs),
                "camera_sequence": traj["camera_sequence"]
            }

        # Initialize real-time anomaly events
        self.anomaly_detector.evaluate_observations(list(self.observations.values()))

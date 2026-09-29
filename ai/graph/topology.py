"""
URBANTRACK AI - City Camera & Road Network Topology Graph
Maintains road network connectivity, camera deployment positions,
junction connections, distance matrices, and expected transit times.
"""

from typing import Dict, List, Any, Optional, Tuple
import math

class CameraNode:
    def __init__(self, camera_id: str, name: str, lat: float, lng: float, road_id: str, junction_id: Optional[str], direction: str):
        self.camera_id = camera_id
        self.name = name
        self.lat = lat
        self.lng = lng
        self.road_id = road_id
        self.junction_id = junction_id
        self.direction = direction

class RoadEdge:
    def __init__(self, road_id: str, name: str, speed_limit_kmh: float, lanes: int, length_km: float, road_type: str = "ARTERIAL"):
        self.road_id = road_id
        self.name = name
        self.speed_limit_kmh = speed_limit_kmh
        self.lanes = lanes
        self.length_km = length_km
        self.road_type = road_type
        self.is_closed = False

class CityNetworkGraph:
    """
    Directed spatial-temporal graph of the city traffic network.
    """
    def __init__(self):
        self.cameras: Dict[str, CameraNode] = {}
        self.roads: Dict[str, RoadEdge] = {}
        # Adjacency: source_cam -> dict of target_cam -> {road_id, distance_m, min_sec, max_sec, exp_sec}
        self.camera_adj: Dict[str, Dict[str, Dict[str, Any]]] = {}
        # Road graph: road_id -> list of connected road_ids
        self.road_adj: Dict[str, List[str]] = {}

        self._initialize_canonical_city()

    def _initialize_canonical_city(self):
        """Initializes the standard 8-camera, 6-road, 3-junction urban network."""
        # 8 Cameras across central corridor
        cams = [
            ("CAM01", "North Gateway", 18.5312, 73.8445, "R101", "J01", "SB"),
            ("CAM02", "University Circle", 18.5280, 73.8500, "R102", "J02", "SE"),
            ("CAM03", "Tech Park Spur", 18.5350, 73.8550, "R103", "J01", "EB"),
            ("CAM04", "Innovation Hub Exit", 18.5385, 73.8620, "R104", "J03", "EB"),
            ("CAM05", "Metro Junction", 18.5220, 73.8560, "R102", "J02", "SB"),
            ("CAM06", "River Bridge South", 18.5170, 73.8490, "R105", "J02", "SW"),
            ("CAM07", "East Bypass", 18.5190, 73.8650, "R106", "J03", "SE"),
            ("CAM08", "South Outer Ring", 18.5120, 73.8600, "R106", "J03", "SB")
        ]
        for cid, name, lat, lng, rid, jid, direct in cams:
            self.cameras[cid] = CameraNode(cid, name, lat, lng, rid, jid, direct)
            self.camera_adj[cid] = {}

        # 6 Roads
        roads = [
            ("R101", "North Arterial Blvd", 50.0, 3, 1.2),
            ("R102", "Central Metro Corridor", 45.0, 3, 2.4),
            ("R103", "Tech Park Link Rd", 60.0, 2, 1.8),
            ("R104", "Innovation Expressway", 70.0, 4, 3.1),
            ("R105", "Riverfront Promenade", 40.0, 2, 1.5),
            ("R106", "South Ring Highway", 60.0, 3, 2.8)
        ]
        for rid, name, speed, lanes, length in roads:
            self.roads[rid] = RoadEdge(rid, name, speed, lanes, length)
            self.road_adj[rid] = []

        # Connect Roads
        self.road_adj["R101"] = ["R102", "R103"]
        self.road_adj["R102"] = ["R105", "R106"]
        self.road_adj["R103"] = ["R104"]
        self.road_adj["R104"] = ["R106"]
        self.road_adj["R105"] = ["R106"]
        self.road_adj["R106"] = []

        # Connect Cameras with realistic distance & travel-time distributions
        connections = [
            # CAM01 -> CAM02 (1.2 km along R101/R102, ~50 km/h: exp 90s, min 50s, max 240s)
            ("CAM01", "CAM02", "R101", 1200.0, 90.0, 50.0, 240.0),
            # CAM01 -> CAM03 (1.5 km along R103, exp 110s, min 60s, max 300s)
            ("CAM01", "CAM03", "R103", 1500.0, 110.0, 60.0, 300.0),
            # CAM02 -> CAM05 (1.4 km along R102, exp 120s, min 65s, max 320s)
            ("CAM02", "CAM05", "R102", 1400.0, 120.0, 65.0, 320.0),
            # CAM02 -> CAM06 (1.6 km along R105, exp 140s, min 80s, max 360s)
            ("CAM02", "CAM06", "R105", 1600.0, 140.0, 80.0, 360.0),
            # CAM03 -> CAM04 (1.8 km along R104, exp 100s, min 55s, max 250s)
            ("CAM03", "CAM04", "R104", 1800.0, 100.0, 55.0, 250.0),
            # CAM05 -> CAM07 (1.9 km along R106, exp 130s, min 70s, max 340s)
            ("CAM05", "CAM07", "R106", 1900.0, 130.0, 70.0, 340.0),
            # CAM05 -> CAM08 (2.2 km along R106, exp 150s, min 85s, max 390s)
            ("CAM05", "CAM08", "R106", 2200.0, 150.0, 85.0, 390.0),
            # CAM04 -> CAM07 (1.7 km, exp 115s, min 60s, max 300s)
            ("CAM04", "CAM07", "R106", 1700.0, 115.0, 60.0, 300.0),
            # CAM07 -> CAM08 (1.1 km, exp 75s, min 40s, max 180s)
            ("CAM07", "CAM08", "R106", 1100.0, 75.0, 40.0, 180.0)
        ]
        for src, dst, rid, dist, exp_t, min_t, max_t in connections:
            self.camera_adj[src][dst] = {
                "road_id": rid,
                "distance_meters": dist,
                "expected_sec": exp_t,
                "min_sec": min_t,
                "max_sec": max_t
            }

    def get_downstream_cameras(self, camera_id: str) -> List[str]:
        return list(self.camera_adj.get(camera_id, {}).keys())

    def get_connection(self, src: str, dst: str) -> Optional[Dict[str, Any]]:
        return self.camera_adj.get(src, {}).get(dst)

    def is_spatiotemporally_feasible(self, src_cam: str, dst_cam: str, time_delta_sec: float) -> Tuple[bool, float]:
        """
        Validates if time_delta_sec fits within physical travel bounds.
        Returns (is_feasible, temporal_score 0.0 to 1.0).
        """
        conn = self.get_connection(src_cam, dst_cam)
        if not conn:
            # Check 2-hop reachability
            for mid_cam in self.get_downstream_cameras(src_cam):
                c1 = self.get_connection(src_cam, mid_cam)
                c2 = self.get_connection(mid_cam, dst_cam)
                if c1 and c2:
                    min_t = c1["min_sec"] + c2["min_sec"]
                    max_t = c1["max_sec"] + c2["max_sec"]
                    exp_t = c1["expected_sec"] + c2["expected_sec"]
                    if min_t <= time_delta_sec <= max_t:
                        diff = abs(time_delta_sec - exp_t)
                        score = max(0.1, 1.0 - (diff / (max_t - min_t)))
                        return True, round(score, 3)
            return False, 0.0

        if conn["min_sec"] <= time_delta_sec <= conn["max_sec"]:
            diff = abs(time_delta_sec - conn["expected_sec"])
            range_t = conn["max_sec"] - conn["min_sec"]
            score = max(0.1, 1.0 - (diff / range_t))
            return True, round(score, 3)
        return False, 0.0

"""
URBANTRACK AI - Multi-Camera Trajectory Reconstruction Engine
Assembles chronological multi-camera observations into validated global journeys,
calculating transit distances, segment durations, and average corridor speeds.
"""

from typing import List, Dict, Any, Optional
import datetime

class TrajectorySegment:
    def __init__(self, from_cam: str, to_cam: str, road_id: str, distance_m: float, duration_sec: float, speed_kmh: float):
        self.from_cam = from_cam
        self.to_cam = to_cam
        self.road_id = road_id
        self.distance_m = distance_m
        self.duration_sec = duration_sec
        self.speed_kmh = speed_kmh

class TrajectoryEngine:
    def __init__(self, topology=None):
        from ai.graph.topology import CityNetworkGraph
        self.topology = topology or CityNetworkGraph()

    def reconstruct_trajectory(self, global_vehicle_id: str, observations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Takes raw observations for a vehicle and sorts by timestamp,
        validating temporal-spatial transitions.
        """
        if not observations:
            return {
                "trajectory_id": f"TRJ_EMPTY_{global_vehicle_id}",
                "global_vehicle_id": global_vehicle_id,
                "status": "NO_OBSERVATIONS",
                "segments": [],
                "total_distance_km": 0.0,
                "total_duration_sec": 0.0,
                "avg_speed_kmh": 0.0
            }

        # Sort chronologically
        sorted_obs = sorted(observations, key=lambda x: x["timestamp"])

        segments = []
        total_distance_m = 0.0
        total_duration_sec = 0.0
        validation_flags = []

        for i in range(len(sorted_obs) - 1):
            curr_obs = sorted_obs[i]
            next_obs = sorted_obs[i + 1]

            src_cam = curr_obs["camera_id"]
            dst_cam = next_obs["camera_id"]
            dt = next_obs["timestamp"] - curr_obs["timestamp"]

            if dt <= 0:
                validation_flags.append(f"NEGATIVE_OR_ZERO_TRANSIT_TIME({src_cam}->{dst_cam})")
                continue

            conn = self.topology.get_connection(src_cam, dst_cam)
            if conn:
                dist_m = conn["distance_meters"]
                road_id = conn["road_id"]
            else:
                # Estimate from coordinate distance
                cam_a = self.topology.cameras.get(src_cam)
                cam_b = self.topology.cameras.get(dst_cam)
                if cam_a and cam_b:
                    # rough Euclidean to meters
                    dx = (cam_b.lng - cam_a.lng) * 90000
                    dy = (cam_b.lat - cam_a.lat) * 111000
                    dist_m = max(500.0, (dx*dx + dy*dy)**0.5)
                else:
                    dist_m = 1000.0
                road_id = "R_INTERCONNECT"
                validation_flags.append(f"UNMAPPED_DIRECT_CONNECTION({src_cam}->{dst_cam})")

            speed_kmh = (dist_m / dt) * 3.6
            if speed_kmh > 150.0:
                validation_flags.append(f"HIGH_SPEED_TRANSIT({src_cam}->{dst_cam}:{speed_kmh:.1f}km/h)")

            segments.append({
                "from_camera_id": src_cam,
                "to_camera_id": dst_cam,
                "road_id": road_id,
                "departure_time": curr_obs["timestamp"],
                "arrival_time": next_obs["timestamp"],
                "duration_sec": round(dt, 1),
                "distance_meters": round(dist_m, 1),
                "speed_kmh": round(speed_kmh, 1)
            })

            total_distance_m += dist_m
            total_duration_sec += dt

        total_distance_km = round(total_distance_m / 1000.0, 2)
        avg_speed_kmh = round((total_distance_m / max(1.0, total_duration_sec)) * 3.6, 1)

        camera_sequence = [obs["camera_id"] for obs in sorted_obs]
        road_sequence = list(dict.fromkeys([s["road_id"] for s in segments]))

        return {
            "trajectory_id": f"TRJ_{global_vehicle_id}",
            "global_vehicle_id": global_vehicle_id,
            "status": "VALID" if not validation_flags else "FLAGGED",
            "validation_flags": validation_flags,
            "first_seen": sorted_obs[0]["timestamp"],
            "last_seen": sorted_obs[-1]["timestamp"],
            "camera_sequence": camera_sequence,
            "road_sequence": road_sequence,
            "segments": segments,
            "total_distance_km": total_distance_km,
            "total_duration_sec": round(total_duration_sec, 1),
            "avg_speed_kmh": avg_speed_kmh,
            "path_summary": " → ".join(camera_sequence)
        }

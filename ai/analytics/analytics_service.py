"""
URBANTRACK AI - Traffic Analytics Engine
Computes road segment flow, vehicle density, average speed,
travel-time index (TTI), and classifies road congestion status.
"""

from typing import Dict, List, Any
import time

class TrafficAnalyticsService:
    def __init__(self):
        # Road baseline configurations
        self.road_configs = {
            "R101": {"name": "North Arterial Blvd", "capacity_vph": 2400, "free_speed_kmh": 50.0, "length_km": 1.2},
            "R102": {"name": "Central Metro Corridor", "capacity_vph": 2200, "free_speed_kmh": 45.0, "length_km": 2.4},
            "R103": {"name": "Tech Park Link Rd", "capacity_vph": 1800, "free_speed_kmh": 60.0, "length_km": 1.8},
            "R104": {"name": "Innovation Expressway", "capacity_vph": 3600, "free_speed_kmh": 70.0, "length_km": 3.1},
            "R105": {"name": "Riverfront Promenade", "capacity_vph": 1600, "free_speed_kmh": 40.0, "length_km": 1.5},
            "R106": {"name": "South Ring Highway", "capacity_vph": 2800, "free_speed_kmh": 60.0, "length_km": 2.8},
        }

    def compute_road_metric(self, road_id: str, vehicle_count: int, observed_avg_speed: float) -> Dict[str, Any]:
        cfg = self.road_configs.get(road_id, {"name": road_id, "capacity_vph": 2000, "free_speed_kmh": 50.0, "length_km": 2.0})
        length_km = cfg["length_km"]
        free_speed = cfg["free_speed_kmh"]

        # Density = vehicles / length
        density_vpk = round(vehicle_count / length_km, 1)

        # Flow = Density * Speed (veh/hr)
        flow_vph = int(density_vpk * max(5.0, observed_avg_speed))

        # Travel Time Index = Free Flow Travel Time / Actual Travel Time
        free_time_sec = (length_km / free_speed) * 3600.0
        actual_time_sec = (length_km / max(5.0, observed_avg_speed)) * 3600.0
        tti = round(actual_time_sec / max(1.0, free_time_sec), 2)

        # Congestion classification
        speed_ratio = observed_avg_speed / free_speed
        if speed_ratio >= 0.85:
            congestion_level = "FREE_FLOW"
            status_color = "emerald"
        elif speed_ratio >= 0.60:
            congestion_level = "MODERATE"
            status_color = "amber"
        elif speed_ratio >= 0.35:
            congestion_level = "HEAVY"
            status_color = "orange"
        else:
            congestion_level = "SEVERE"
            status_color = "rose"

        return {
            "road_id": road_id,
            "road_name": cfg["name"],
            "timestamp": time.time(),
            "vehicle_count": vehicle_count,
            "density_vpk": density_vpk,
            "avg_speed_kmh": round(observed_avg_speed, 1),
            "free_flow_speed_kmh": free_speed,
            "flow_vph": flow_vph,
            "travel_time_sec": round(actual_time_sec, 0),
            "travel_time_index": tti,
            "congestion_level": congestion_level,
            "status_color": status_color
        }

    def get_all_road_metrics(self) -> List[Dict[str, Any]]:
        # Canonical dynamic state for city roads
        metrics = [
            self.compute_road_metric("R101", 38, 44.0),
            self.compute_road_metric("R102", 78, 16.5), # Congested Metro Corridor
            self.compute_road_metric("R103", 22, 54.0),
            self.compute_road_metric("R104", 45, 62.0),
            self.compute_road_metric("R105", 26, 36.0),
            self.compute_road_metric("R106", 52, 48.0)
        ]
        return metrics

"""
URBANTRACK AI - Point-to-Point Section Speed Enforcement (ASOD) & E-Challan Generator
Computes exact average vehicular speed over calibrated camera baselines:
    v_avg = (Delta d / Delta t) * 3.6  [km/h]
Eliminates single-point radar detector evasion and automatically generates
legally binding digital E-Challan citations under the Motor Vehicles Act.
"""

from typing import Dict, List, Any, Optional
import time
import math

CORRIDOR_SEGMENTS = {
    "CAM01_CAM02": {
        "segment_id": "SEG_01_02",
        "entry_camera": "CAM01",
        "entry_name": "North Gateway Entry Portal",
        "exit_camera": "CAM02",
        "exit_name": "University Circle Exit Portal",
        "distance_meters": 1200.0,
        "speed_limit_kmh": 50.0,
        "zone_classification": "URBAN_ARTERIAL_CORRIDOR",
        "jurisdiction": "Smart City Traffic Police, Cyber Enforcement Division"
    },
    "CAM02_CAM05": {
        "segment_id": "SEG_02_05",
        "entry_camera": "CAM02",
        "entry_name": "University Circle Entry Portal",
        "exit_camera": "CAM05",
        "exit_name": "Metro South Underpass Exit Portal",
        "distance_meters": 1400.0,
        "speed_limit_kmh": 50.0,
        "zone_classification": "METRO_COMMERCIAL_CORRIDOR",
        "jurisdiction": "Smart City Traffic Police, Cyber Enforcement Division"
    },
    "CAM05_CAM08": {
        "segment_id": "SEG_05_08",
        "entry_camera": "CAM05",
        "entry_name": "Metro South Underpass Entry",
        "exit_camera": "CAM08",
        "exit_name": "South Outer Ring Toll Portal",
        "distance_meters": 2200.0,
        "speed_limit_kmh": 70.0,
        "zone_classification": "EXPRESSWAY_OUTER_LINK",
        "jurisdiction": "Highway Traffic Police Patrol Wing"
    }
}

class ASODEnforcementEngine:
    def __init__(self):
        self.segments = CORRIDOR_SEGMENTS
        self.violations: Dict[str, Dict[str, Any]] = {}
        self._init_default_violations()

    def calculate_asod(self, distance_meters: float, time_delta_seconds: float, speed_limit_kmh: float = 50.0) -> Dict[str, Any]:
        """
        Calculates average speed over distance:
            v_avg (km/h) = (distance_meters / time_delta_seconds) * 3.6
        """
        if time_delta_seconds <= 0:
            return {"error": "Time delta must be greater than zero"}

        speed_kmh = round((distance_meters / time_delta_seconds) * 3.6, 1)
        excess_kmh = round(max(0.0, speed_kmh - speed_limit_kmh), 1)
        is_violation = excess_kmh > 0.0

        fine_amount = 0
        legal_section = "N/A - Compliant Speed"
        severity = "NORMAL"

        if is_violation:
            if excess_kmh <= 15.0:
                fine_amount = 1000
                legal_section = "Section 183(1) MV Act 1988 (Amended 2019) - Light Motor Vehicle Over-speeding"
                severity = "MODERATE"
            elif excess_kmh <= 30.0:
                fine_amount = 2000
                legal_section = "Section 183(2) MV Act 1988 (Amended 2019) - Aggravated Dangerous Over-speeding"
                severity = "HIGH"
            else:
                fine_amount = 4000
                legal_section = "Section 183(2) & 184 MV Act 1988 - Dangerous & Reckless Driving at Extreme Speed"
                severity = "CRITICAL"

        return {
            "distance_meters": distance_meters,
            "time_delta_seconds": round(time_delta_seconds, 2),
            "speed_limit_kmh": speed_limit_kmh,
            "measured_speed_kmh": speed_kmh,
            "excess_speed_kmh": excess_kmh,
            "is_violation": is_violation,
            "fine_amount_inr": fine_amount,
            "legal_section": legal_section,
            "severity": severity
        }

    def _init_default_violations(self):
        # 1. High Speed Hit-and-Run Suspect
        c1 = "ECH-2026-0929-8812"
        self.violations[c1] = {
            "citation_id": c1,
            "vehicle_id": "V000123",
            "plate_number": "MH12AB1234",
            "vehicle_type": "Sedan (Silver Metallic)",
            "owner_name": "Rajesh Kumar Verma",
            "segment_id": "SEG_01_02",
            "entry_camera": "CAM01",
            "entry_name": "North Gateway Entry Portal",
            "entry_timestamp_utc": "2026-09-29 08:02:12.140",
            "exit_camera": "CAM02",
            "exit_name": "University Circle Exit Portal",
            "exit_timestamp_utc": "2026-09-29 08:03:03.250",
            "distance_meters": 1200.0,
            "time_delta_seconds": 51.11,
            "speed_limit_kmh": 50.0,
            "measured_speed_kmh": 84.5,
            "excess_speed_kmh": 34.5,
            "fine_amount_inr": 4000,
            "legal_section": "Section 183(2) & 184 MV Act 1988 (Amended 2019) - Extreme Reckless Over-speeding (>30 km/h over limit)",
            "severity": "CRITICAL",
            "status": "ISSUED_PENDING_PAYMENT",
            "payment_deadline": "2026-10-14",
            "plate_crop_url": "/assets/crops/plate_mh12ab1234.png",
            "anpr_ocr_confidence": 0.965,
            "radar_mode": "POINT_TO_POINT_AVERAGE_SPEED",
            "jurisdiction": "Cyber Traffic Enforcement Headquarters, Core Urban Zone"
        }

        # 2. Black Luxury SUV
        c2 = "ECH-2026-0929-8815"
        self.violations[c2] = {
            "citation_id": c2,
            "vehicle_id": "V000456",
            "plate_number": "MH14CD5678",
            "vehicle_type": "SUV (Obsidian Black)",
            "owner_name": "Vikramaditya Shinde",
            "segment_id": "SEG_01_02",
            "entry_camera": "CAM01",
            "entry_name": "North Gateway Entry Portal",
            "entry_timestamp_utc": "2026-09-29 08:06:10.020",
            "exit_camera": "CAM02",
            "exit_name": "University Circle Exit Portal",
            "exit_timestamp_utc": "2026-09-29 08:07:12.630",
            "distance_meters": 1200.0,
            "time_delta_seconds": 62.61,
            "speed_limit_kmh": 50.0,
            "measured_speed_kmh": 69.0,
            "excess_speed_kmh": 19.0,
            "fine_amount_inr": 2000,
            "legal_section": "Section 183(2) MV Act 1988 - Dangerous Over-speeding (+19 km/h over limit)",
            "severity": "HIGH",
            "status": "SENT_TO_VAHAN_DATABASE",
            "payment_deadline": "2026-10-14",
            "plate_crop_url": "/assets/crops/plate_mh14cd5678.png",
            "anpr_ocr_confidence": 0.942,
            "radar_mode": "POINT_TO_POINT_AVERAGE_SPEED",
            "jurisdiction": "Cyber Traffic Enforcement Headquarters, Core Urban Zone"
        }

        # 3. High Speed Motorcycle
        c3 = "ECH-2026-0929-8819"
        self.violations[c3] = {
            "citation_id": c3,
            "vehicle_id": "V000789",
            "plate_number": "KA03MN4412",
            "vehicle_type": "Motorcycle (Sports 350cc)",
            "owner_name": "Aditya Rao",
            "segment_id": "SEG_01_02",
            "entry_camera": "CAM01",
            "entry_name": "North Gateway Entry Portal",
            "entry_timestamp_utc": "2026-09-29 08:09:40.100",
            "exit_camera": "CAM02",
            "exit_name": "University Circle Exit Portal",
            "exit_timestamp_utc": "2026-09-29 08:10:26.200",
            "distance_meters": 1200.0,
            "time_delta_seconds": 46.10,
            "speed_limit_kmh": 50.0,
            "measured_speed_kmh": 93.7,
            "excess_speed_kmh": 43.7,
            "fine_amount_inr": 4000,
            "legal_section": "Section 183(2) & 184 MV Act 1988 - Extreme Speeding & Two-Wheeler Endangerment",
            "severity": "CRITICAL",
            "status": "ISSUED_PENDING_PAYMENT",
            "payment_deadline": "2026-10-14",
            "plate_crop_url": "/assets/crops/plate_ka03mn4412.png",
            "anpr_ocr_confidence": 0.918,
            "radar_mode": "POINT_TO_POINT_AVERAGE_SPEED",
            "jurisdiction": "Cyber Traffic Enforcement Headquarters, Core Urban Zone"
        }

        # 4. White Commercial Hatchback
        c4 = "ECH-2026-0929-8824"
        self.violations[c4] = {
            "citation_id": c4,
            "vehicle_id": "V000912",
            "plate_number": "DL01XY9876",
            "vehicle_type": "Hatchback (White Fleet)",
            "owner_name": "Prime Cabs Logistics Ltd",
            "segment_id": "SEG_02_05",
            "entry_camera": "CAM02",
            "entry_name": "University Circle Entry Portal",
            "entry_timestamp_utc": "2026-09-29 08:12:05.400",
            "exit_camera": "CAM05",
            "exit_name": "Metro South Underpass Exit Portal",
            "distance_meters": 1400.0,
            "time_delta_seconds": 82.35,
            "speed_limit_kmh": 50.0,
            "measured_speed_kmh": 61.2,
            "excess_speed_kmh": 11.2,
            "fine_amount_inr": 1000,
            "legal_section": "Section 183(1) MV Act 1988 - Moderate Over-speeding (+11.2 km/h over limit)",
            "severity": "MODERATE",
            "status": "PAID_ONLINE_VERIFIED",
            "payment_deadline": "2026-10-14",
            "plate_crop_url": "/assets/crops/plate_dl01xy9876.png",
            "anpr_ocr_confidence": 0.955,
            "radar_mode": "POINT_TO_POINT_AVERAGE_SPEED",
            "jurisdiction": "Cyber Traffic Enforcement Headquarters, Core Urban Zone"
        }

    def get_all_violations(self) -> List[Dict[str, Any]]:
        return list(self.violations.values())

    def get_citation(self, citation_id: str) -> Optional[Dict[str, Any]]:
        return self.violations.get(citation_id)

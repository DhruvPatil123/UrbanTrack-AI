"""
URBANTRACK AI - Emergency Vehicle Priority & Green Wave Preemption Engine
Detects emergency beacons/sirens, coordinates traffic signal preemption,
and tracks hospital transit corridors with Google Maps Grounding.
"""

from typing import Dict, List, Any, Optional
import time
import math
from ai.graph.topology import CityNetworkGraph

class GreenWaveEngine:
    def __init__(self, topology: Optional[CityNetworkGraph] = None):
        self.topology = topology or CityNetworkGraph()
        self.active_emergencies: Dict[str, Dict[str, Any]] = {}
        self._init_default_emergency()

    def _init_default_emergency(self):
        # Default active emergency ambulance mission
        amb_id = "AMB_108_ALPHA"
        self.active_emergencies[amb_id] = {
            "emergency_id": amb_id,
            "vehicle_type": "AMBULANCE",
            "plate_number": "MH12EE9911",
            "call_sign": "MEDIC-108 ADVANCED LIFE SUPPORT",
            "priority": "CRITICAL_TIER_1",
            "patient_condition": "Severe Polytrauma & Cardiac Distress (Golden Hour Priority)",
            "beacon_detection": {
                "detected": True,
                "confidence": 0.974,
                "beacon_type": "HIGH_INTENSITY_RED_BLUE_STROBE",
                "sensor_source": "CAM01_OPTICAL_FEED"
            },
            "siren_acoustic_detection": {
                "detected": True,
                "confidence": 0.942,
                "frequency_profile": "WAIL_YELP_DUAL_SWEEP_750HZ_1200HZ",
                "decibel_estimate": "104 dB @ 35m"
            },
            "status": "GREEN_CORRIDOR_ACTIVE",
            "speed_kmh": 68.0,
            "current_camera": "CAM01",
            "target_hospital": "Sassoon General Hospital & Level-1 Trauma Center",
            "route_junctions": [
                {"junction_id": "J1", "camera_id": "CAM01", "name": "North Gateway Crossway", "distance_meters": 0, "eta_seconds": 0, "signal_state": "FORCE_GREEN_PREEMPTED"},
                {"junction_id": "J2", "camera_id": "CAM02", "name": "University Circle Intersection", "distance_meters": 1200, "eta_seconds": 63, "signal_state": "PREEMPTION_ARMED_30S"},
                {"junction_id": "J3", "camera_id": "CAM05", "name": "Central Metro South Underpass", "distance_meters": 2600, "eta_seconds": 137, "signal_state": "SCHEDULED_GREEN_HOLD"},
                {"junction_id": "J4", "camera_id": "CAM08", "name": "South Medical Expressway Junction", "distance_meters": 4800, "eta_seconds": 254, "signal_state": "STANDBY"}
            ],
            "metrics": {
                "baseline_transit_minutes": 11.4,
                "green_wave_transit_minutes": 6.2,
                "time_saved_minutes": 5.2,
                "response_time_reduction_pct": 45.6
            }
        }

    def get_trauma_centers(self) -> List[Dict[str, Any]]:
        """
        Returns list of regional trauma hospitals with coordinates and live capacity.
        """
        return [
            {
                "hospital_id": "HOSP_SASSOON",
                "name": "Sassoon General Hospital & Trauma Center",
                "type": "Government Level-1 Apex Trauma ICU",
                "coordinates": {"lat": 18.5285, "lng": 73.8744},
                "distance_km": 2.8,
                "eta_green_wave_minutes": 4.1,
                "icu_beds_available": 6,
                "ot_status": "READY_IMMEDIATE_ADMISSION",
                "emergency_gate": "Gate 2 (Station Road Ambulance Bay)",
                "contact": "+91 20 2612 8000"
            },
            {
                "hospital_id": "HOSP_RUBY",
                "name": "Ruby Hall Clinic Trauma & Critical Care",
                "type": "Level-1 Super-Specialty Neuro/Cardiac Trauma",
                "coordinates": {"lat": 18.5320, "lng": 73.8780},
                "distance_km": 3.4,
                "eta_green_wave_minutes": 5.2,
                "icu_beds_available": 4,
                "ot_status": "STANDBY_CALL",
                "emergency_gate": "East Wing Casualty Entrance",
                "contact": "+91 20 6645 5100"
            },
            {
                "hospital_id": "HOSP_JEHANGIR",
                "name": "Jehangir Hospital Emergency Ward",
                "type": "Level-2 Multi-Specialty Acute Care",
                "coordinates": {"lat": 18.5305, "lng": 73.8765},
                "distance_km": 4.1,
                "eta_green_wave_minutes": 6.8,
                "icu_beds_available": 3,
                "ot_status": "OCCUPIED_EXPEDITE_REQUIRED",
                "emergency_gate": "Sassoon Road Emergency Ramp",
                "contact": "+91 20 6681 9999"
            }
        ]

    def update_preemption_step(self, emergency_id: str, step_index: int) -> Dict[str, Any]:
        """
        Advances the green corridor progression step along the junctions.
        """
        em = self.active_emergencies.get(emergency_id)
        if not em:
            return {}

        junctions = em["route_junctions"]
        for i, junc in enumerate(junctions):
            if i < step_index:
                junc["signal_state"] = "RESTORED_NORMAL_CYCLE"
            elif i == step_index:
                junc["signal_state"] = "FORCE_GREEN_PREEMPTED"
            elif i == step_index + 1:
                junc["signal_state"] = "PREEMPTION_ARMED_30S"
            else:
                junc["signal_state"] = "SCHEDULED_GREEN_HOLD"

        em["current_camera"] = junctions[min(step_index, len(junctions) - 1)]["camera_id"]
        return em

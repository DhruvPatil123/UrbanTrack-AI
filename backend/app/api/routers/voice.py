"""
URBANTRACK AI - Gemini Voice Dispatcher & Incident Alert Router
Processes voice-activated command intents and generates tactical control room voice scripts.
"""

from fastapi import APIRouter
from typing import Dict, Any, Optional
import os
import re

router = APIRouter(prefix="/voice", tags=["Voice Dispatcher"])

DEFAULT_DISPATCH_SCRIPTS = [
    {
        "id": "DISP-01",
        "timestamp": "08:02:14",
        "severity": "CRITICAL",
        "text": "Alert: Wrong-way motorcycle detected at Tech Park Spur CAM03 heading westbound. All sector units exercise caution.",
        "category": "WRONG_WAY_INCIDENT"
    },
    {
        "id": "DISP-02",
        "timestamp": "08:03:05",
        "severity": "CRITICAL",
        "text": "Red Notice Pursuit active: Target vehicle MH12AB1234 clocked at 84.5 km/h in 50 km/h zone. Intercept cordon armed at University Circle.",
        "category": "SPEED_ENFORCEMENT"
    },
    {
        "id": "DISP-03",
        "timestamp": "08:05:22",
        "severity": "HIGH",
        "text": "Priority Preemption engaged: Emergency ambulance MEDIC-108 green wave corridor active along North-South arterial.",
        "category": "EMERGENCY_GREEN_WAVE"
    },
    {
        "id": "DISP-04",
        "timestamp": "08:08:40",
        "severity": "WARNING",
        "text": "Traffic congestion alert: University Circle junction exceeding 94% saturation. Adaptive signal cycle extended by 18 seconds.",
        "category": "CONGESTION_ADVISORY"
    }
]

@router.get("/dispatches")
def get_dispatches():
    return DEFAULT_DISPATCH_SCRIPTS

@router.post("/parse-intent")
def parse_voice_intent(payload: Dict[str, Any]):
    transcript = (payload.get("transcript") or "").strip().lower()
    
    # 1. Track plate command: e.g., "track plate mh12ab1234" or "find vehicle mh14cd5678"
    plate_match = re.search(r'(?:track|find|locate|search|pursue)?\s*(?:plate|vehicle|car)?\s*([a-z]{2}\d{1,2}[a-z]{1,2}\d{1,4})', transcript)
    if plate_match:
        plate = plate_match.group(1).upper()
        return {
            "intent": "TRACK_VEHICLE",
            "target": plate,
            "target_type": "plate_number",
            "reply": f"Acknowledged. Tracking vehicle plate {plate} across urban camera grid.",
            "navigate_to": "vehicles"
        }
    
    # 2. Simulate closure: e.g., "simulate closing university circle" or "close r102"
    if "simulate" in transcript or "close" in transcript or "block" in transcript:
        road_id = "R102" if ("university" in transcript or "circle" in transcript or "r102" in transcript) else "R101"
        road_name = "University Circle (R102)" if road_id == "R102" else "North Arterial Gateway (R101)"
        return {
            "intent": "SIMULATE_CLOSURE",
            "target": road_id,
            "target_name": road_name,
            "reply": f"Initiating what-if simulation: simulating closure of {road_name}. Rerouting traffic flow.",
            "navigate_to": "simulation"
        }
        
    # 3. Emergency / Green Wave
    if "green wave" in transcript or "ambulance" in transcript or "emergency" in transcript or "trauma" in transcript:
        return {
            "intent": "SHOW_GREEN_WAVE",
            "target": "greenwave",
            "reply": "Switching to Emergency Vehicle Green Wave Preemption and trauma transit monitoring.",
            "navigate_to": "greenwave"
        }

    # 4. Red Notice / Pursuit
    if "pursuit" in transcript or "red notice" in transcript or "suspect" in transcript or "intercept" in transcript:
        return {
            "intent": "SHOW_PURSUIT",
            "target": "pursuit",
            "reply": "Accessing Red Notice Pursuit Headquarters and tactical cordon intercepts.",
            "navigate_to": "pursuit"
        }

    # 5. Speed Enforcement / E-Challan
    if "speed" in transcript or "challan" in transcript or "radar" in transcript or "violation" in transcript:
        return {
            "intent": "SHOW_ENFORCEMENT",
            "target": "enforcement",
            "reply": "Displaying Point-to-Point Section Speed Enforcement and E-Challan citations.",
            "navigate_to": "enforcement"
        }

    # 6. O-D Matrix / Flows / Sankey
    if "od" in transcript or "matrix" in transcript or "sankey" in transcript or "commuter" in transcript or "flow" in transcript:
        return {
            "intent": "SHOW_OD_MATRIX",
            "target": "odmatrix",
            "reply": "Displaying City-Scale Origin-Destination Matrix and Commuter Sankey Flows.",
            "navigate_to": "odmatrix"
        }

    # 7. Knowledge Graph / GNN
    if "graph" in transcript or "gnn" in transcript or "spatial" in transcript:
        return {
            "intent": "SHOW_GRAPH",
            "target": "graph",
            "reply": "Opening Spatial-Temporal Knowledge Graph and camera network topology.",
            "navigate_to": "graph"
        }

    # 8. CCTV Vision Streams
    if "cctv" in transcript or "camera" in transcript or "stream" in transcript or "vision" in transcript:
        return {
            "intent": "SHOW_STREAMS",
            "target": "streams",
            "reply": "Switching to 8-channel CCTV multi-camera ANPR vision grid.",
            "navigate_to": "streams"
        }

    # 9. City Map
    if "map" in transcript or "overview" in transcript or "corridor" in transcript:
        return {
            "intent": "SHOW_MAP",
            "target": "map",
            "reply": "Showing live municipal road corridor map.",
            "navigate_to": "map"
        }

    # Default fallback
    return {
        "intent": "GENERAL_QUERY",
        "target": None,
        "reply": f"Received command: '{transcript}'. Directing to Gemini Traffic Copilot.",
        "navigate_to": "chat"
    }

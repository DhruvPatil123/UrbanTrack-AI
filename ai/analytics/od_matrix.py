"""
URBANTRACK AI - Origin-Destination (O-D) Matrix & Flow Analytics Engine
Calculates aggregate trip exchanges between city zones, peak commuter directional splits,
and Sankey influx/egress flows for urban transportation planning.
"""

from typing import Dict, List, Any, Optional

CITY_ZONES = [
    {
        "zone_id": "ZONE_NORTH",
        "name": "North Gateway & Outer Ring",
        "cameras": ["CAM01", "CAM03"],
        "type": "RESIDENTIAL_COMMUTER_ORIGIN",
        "color": "#38bdf8"
    },
    {
        "zone_id": "ZONE_CENTRAL",
        "name": "University Circle & Central Metro",
        "cameras": ["CAM02", "CAM05"],
        "type": "MIXED_COMMERCIAL_EDUCATION",
        "color": "#a855f7"
    },
    {
        "zone_id": "ZONE_TECH",
        "name": "Tech Park Innovation Hub",
        "cameras": ["CAM04"],
        "type": "EMPLOYMENT_EMPLOYEE_DESTINATION",
        "color": "#10b981"
    },
    {
        "zone_id": "ZONE_RIVER",
        "name": "Riverfront Promenade & Historic District",
        "cameras": ["CAM06"],
        "type": "CIVIC_COMMERCIAL_TOURISM",
        "color": "#f59e0b"
    },
    {
        "zone_id": "ZONE_SOUTH",
        "name": "South Expressway & Logistics Terminal",
        "cameras": ["CAM07", "CAM08"],
        "type": "FREIGHT_HIGHWAY_TERMINUS",
        "color": "#f43f5e"
    }
]

class ODMatrixEngine:
    def __init__(self):
        self.zones = CITY_ZONES

    def get_od_matrix(self, time_period: str = "MORNING_PEAK") -> Dict[str, Any]:
        """
        Generates 5x5 zone-to-zone vehicular trip matrix.
        time_period: 'MORNING_PEAK' (08:00-10:30) | 'EVENING_PEAK' (17:30-20:00) | 'OFF_PEAK'
        """
        # Multipliers based on time period
        mult = 1.0 if time_period == "MORNING_PEAK" else (0.88 if time_period == "EVENING_PEAK" else 0.45)

        # Baseline morning peak trips between zones (Origin -> Destination)
        # Order: NORTH, CENTRAL, TECH, RIVER, SOUTH
        matrix_data = [
            # NORTH as origin
            [int(120 * mult), int(1420 * mult), int(2180 * mult), int(480 * mult), int(960 * mult)],
            # CENTRAL as origin
            [int(380 * mult), int(240 * mult), int(1640 * mult), int(620 * mult), int(1120 * mult)],
            # TECH as origin
            [int(410 * mult), int(520 * mult), int(180 * mult), int(310 * mult), int(740 * mult)],
            # RIVER as origin
            [int(290 * mult), int(680 * mult), int(790 * mult), int(90 * mult), int(510 * mult)],
            # SOUTH as origin
            [int(640 * mult), int(1080 * mult), int(1350 * mult), int(420 * mult), int(150 * mult)]
        ]

        # Calculate marginal sums
        zone_ids = [z["zone_id"] for z in self.zones]
        origins_sum = [sum(row) for row in matrix_data]
        destinations_sum = [sum(matrix_data[i][j] for i in range(5)) for j in range(5)]
        total_trips = sum(origins_sum)

        rows = []
        for i, origin in enumerate(self.zones):
            row_cells = []
            for j, dest in enumerate(self.zones):
                vol = matrix_data[i][j]
                avg_travel_time = round(4.5 + (vol / 350.0) + (abs(i - j) * 2.2), 1)
                congestion_level = "HIGH" if vol > 1200 else ("MODERATE" if vol > 500 else "LOW")
                row_cells.append({
                    "origin_id": origin["zone_id"],
                    "destination_id": dest["zone_id"],
                    "volume_veh_hr": vol,
                    "avg_travel_time_min": avg_travel_time,
                    "congestion_level": congestion_level,
                    "transit_mode_split": {
                        "cars": int(vol * 0.52),
                        "two_wheelers": int(vol * 0.34),
                        "buses_and_paratransit": int(vol * 0.14)
                    }
                })
            rows.append({
                "origin_zone": origin,
                "total_departures": origins_sum[i],
                "cells": row_cells
            })

        return {
            "time_period": time_period,
            "total_trips_sampled": total_trips,
            "zones": self.zones,
            "matrix": rows,
            "destinations_total": destinations_sum,
            "dominant_corridor": {
                "origin": "North Gateway & Outer Ring",
                "destination": "Tech Park Innovation Hub",
                "hourly_volume": matrix_data[0][2],
                "design_capacity_pct": 118.4,
                "recommendation": "High O-D demand North -> Tech Park exceeds R102 design capacity by +18.4%. Deploy BRTS corridor or ramp metering."
            }
        }

    def get_sankey_flow(self, time_period: str = "MORNING_PEAK") -> Dict[str, Any]:
        """
        Returns structured nodes and weighted links for Sankey flow diagram
        representing commuter influx, arterial bifurcation, and final egress.
        """
        mult = 1.0 if time_period == "MORNING_PEAK" else 0.85

        nodes = [
            # Influx Stage (Stage 0)
            {"id": "IN_NORTH", "name": "North Suburb Inflow", "stage": 0, "color": "#38bdf8", "value": int(4200 * mult)},
            {"id": "IN_SOUTH", "name": "South Bypass Inflow", "stage": 0, "color": "#f43f5e", "value": int(2600 * mult)},
            {"id": "IN_EAST", "name": "Eastern Feeder Inflow", "stage": 0, "color": "#f59e0b", "value": int(1800 * mult)},

            # Intermediary Arterial Distribution Stage (Stage 1)
            {"id": "ART_UNIV_CIRCLE", "name": "University Circle Hub (CAM02)", "stage": 1, "color": "#a855f7", "value": int(4600 * mult)},
            {"id": "ART_METRO_CORRIDOR", "name": "Central Metro Spine (CAM05)", "stage": 1, "color": "#06b6d4", "value": int(4000 * mult)},

            # Terminal Destination Egress Stage (Stage 2)
            {"id": "OUT_TECH_PARK", "name": "Tech Park Innovation IT Zone", "stage": 2, "color": "#10b981", "value": int(4100 * mult)},
            {"id": "OUT_OLD_CITY", "name": "Central Business & Historic Old City", "stage": 2, "color": "#8b5cf6", "value": int(2300 * mult)},
            {"id": "OUT_SOUTH_EXPRESS", "name": "South Expressway Ring Road Egress", "stage": 2, "color": "#e11d48", "value": int(2200 * mult)}
        ]

        links = [
            # Stage 0 -> Stage 1
            {"source": "IN_NORTH", "target": "ART_UNIV_CIRCLE", "value": int(2800 * mult), "percentage": 66.7},
            {"source": "IN_NORTH", "target": "ART_METRO_CORRIDOR", "value": int(1400 * mult), "percentage": 33.3},
            {"source": "IN_SOUTH", "target": "ART_METRO_CORRIDOR", "value": int(1900 * mult), "percentage": 73.1},
            {"source": "IN_SOUTH", "target": "ART_UNIV_CIRCLE", "value": int(700 * mult), "percentage": 26.9},
            {"source": "IN_EAST", "target": "ART_UNIV_CIRCLE", "value": int(1100 * mult), "percentage": 61.1},
            {"source": "IN_EAST", "target": "ART_METRO_CORRIDOR", "value": int(700 * mult), "percentage": 38.9},

            # Stage 1 -> Stage 2
            {"source": "ART_UNIV_CIRCLE", "target": "OUT_TECH_PARK", "value": int(2600 * mult), "percentage": 56.5},
            {"source": "ART_UNIV_CIRCLE", "target": "OUT_OLD_CITY", "value": int(1400 * mult), "percentage": 30.4},
            {"source": "ART_UNIV_CIRCLE", "target": "OUT_SOUTH_EXPRESS", "value": int(600 * mult), "percentage": 13.1},

            {"source": "ART_METRO_CORRIDOR", "target": "OUT_TECH_PARK", "value": int(1500 * mult), "percentage": 37.5},
            {"source": "ART_METRO_CORRIDOR", "target": "OUT_OLD_CITY", "value": int(900 * mult), "percentage": 22.5},
            {"source": "ART_METRO_CORRIDOR", "target": "OUT_SOUTH_EXPRESS", "value": int(1600 * mult), "percentage": 40.0}
        ]

        return {
            "time_period": time_period,
            "nodes": nodes,
            "links": links,
            "total_influx_vph": int(8600 * mult),
            "transit_efficiency_index": 0.81,
            "planning_insights": [
                "47.6% of entire city morning influx terminates at Tech Park IT Zone.",
                "University Circle Hub handles 53.5% of cross-boundary corridor volume, creating a severe morning bottleneck between 08:30-09:45.",
                "Optimizing signal split at University Circle in favor of North-to-Tech Park flow can reduce city-wide commuter delay by 22%."
            ]
        }

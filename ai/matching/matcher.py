"""
URBANTRACK AI - Candidate Generation & Multi-Signal Vehicle Matcher
Fuses License Plate string similarity, Re-ID visual embedding cosine similarity,
vehicle classification, spatial-temporal feasibility window, and road network topology.
"""

from typing import Dict, List, Any, Optional, Tuple
import math
from ai.graph.topology import CityNetworkGraph

class RuleBasedMatcher:
    """
    Deterministic baseline matcher fusing multiple weak signals:
    MatchScore = w_p*S_plate + w_a*S_reid + w_t*S_type + w_s*S_spatiotemporal + w_topo*S_topo
    """
    def __init__(
        self,
        topology: Optional[CityNetworkGraph] = None,
        w_plate: float = 0.35,
        w_reid: float = 0.30,
        w_type: float = 0.10,
        w_spatiotemporal: float = 0.15,
        w_topology: float = 0.10,
        decision_threshold: float = 0.65
    ):
        self.topology = topology or CityNetworkGraph()
        self.w_plate = w_plate
        self.w_reid = w_reid
        self.w_type = w_type
        self.w_spatiotemporal = w_spatiotemporal
        self.w_topology = w_topology
        self.decision_threshold = decision_threshold

    @staticmethod
    def calculate_plate_similarity(p1: str, p2: str) -> float:
        if not p1 or not p2 or p1 == "UNKNOWN" or p2 == "UNKNOWN":
            return 0.0
        if p1 == p2:
            return 1.0
        # Levenshtein distance similarity
        n, m = len(p1), len(p2)
        dp = [[0] * (m + 1) for _ in range(n + 1)]
        for i in range(n + 1):
            dp[i][0] = i
        for j in range(m + 1):
            dp[0][j] = j
        for i in range(1, n + 1):
            for j in range(1, m + 1):
                if p1[i - 1] == p2[j - 1]:
                    dp[i][j] = dp[i - 1][j - 1]
                else:
                    dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
        lev = dp[n][m]
        max_l = max(n, m)
        return max(0.0, 1.0 - (lev / max_l))

    @staticmethod
    def calculate_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        if not vec1 or not vec2:
            return 0.0
        dot = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = math.sqrt(sum(a * a for a in vec1))
        norm2 = math.sqrt(sum(b * b for b in vec2))
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return max(0.0, dot / (norm1 * norm2))

    def evaluate_pair(self, obs_a: Dict[str, Any], obs_b: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates two observations (obs_a earlier in time than obs_b).
        """
        time_a = obs_a["timestamp"]
        time_b = obs_b["timestamp"]
        time_delta = time_b - time_a

        cam_a = obs_a["camera_id"]
        cam_b = obs_b["camera_id"]

        # 1. Topological & Spatiotemporal feasibility gating
        if cam_a == cam_b:
            # Same camera cannot be matched across long times without a new track
            return {
                "same_vehicle_probability": 0.0,
                "decision": "different_vehicle",
                "reason": "SAME_CAMERA_COLLISION",
                "features": {}
            }

        if time_delta <= 0:
            return {
                "same_vehicle_probability": 0.0,
                "decision": "different_vehicle",
                "reason": "NEGATIVE_TIME_DELTA",
                "features": {}
            }

        is_feasible, time_score = self.topology.is_spatiotemporally_feasible(cam_a, cam_b, time_delta)
        if not is_feasible:
            return {
                "same_vehicle_probability": 0.05,
                "decision": "different_vehicle",
                "reason": "PHYSICALLY_INFEASIBLE_TRANSIT",
                "features": {"time_delta_sec": time_delta, "time_score": 0.0}
            }

        # 2. Plate similarity
        plate_sim = self.calculate_plate_similarity(obs_a.get("plate_text", ""), obs_b.get("plate_text", ""))

        # 3. Appearance Re-ID similarity
        reid_sim = self.calculate_cosine_similarity(obs_a.get("reid_embedding", []), obs_b.get("reid_embedding", []))

        # 4. Vehicle Class match
        type_score = 1.0 if obs_a.get("vehicle_type") == obs_b.get("vehicle_type") else 0.0

        # 5. Topology connection score
        conn = self.topology.get_connection(cam_a, cam_b)
        topo_score = 1.0 if conn else 0.7

        # Weighted combination
        # If plate matches with very high similarity (>= 0.9), give strong priority
        if plate_sim >= 0.90:
            total_prob = 0.50 * plate_sim + 0.30 * reid_sim + 0.10 * time_score + 0.10 * topo_score
            total_prob = max(total_prob, 0.92)
        else:
            total_prob = (
                self.w_plate * plate_sim +
                self.w_reid * reid_sim +
                self.w_type * type_score +
                self.w_spatiotemporal * time_score +
                self.w_topology * topo_score
            )

        total_prob = min(0.99, max(0.0, total_prob))
        decision = "same_vehicle" if total_prob >= self.decision_threshold else "different_vehicle"

        return {
            "same_vehicle_probability": round(total_prob, 4),
            "decision": decision,
            "confidence": round(total_prob, 3),
            "features": {
                "plate_similarity": round(plate_sim, 3),
                "reid_similarity": round(reid_sim, 3),
                "type_match": type_score,
                "time_score": round(time_score, 3),
                "topology_score": round(topo_score, 3),
                "time_delta_sec": round(time_delta, 1)
            }
        }

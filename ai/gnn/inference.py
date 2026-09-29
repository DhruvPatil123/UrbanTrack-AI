"""
URBANTRACK AI - GNN Production Inference Service
Exposes link prediction matching between two vehicle observations.
Gracefully handles fallback to RuleBasedMatcher when PyG / GPU are not present.
"""

from typing import Dict, Any, Optional
from ai.gnn.model import VehicleMatchGNN
from ai.gnn.dataset import GNNDatasetBuilder
from ai.matching.matcher import RuleBasedMatcher

try:
    import numpy as np
    HAVE_NUMPY = True
except ImportError:
    HAVE_NUMPY = False

class GNNMatchService:
    def __init__(self, threshold: float = 0.65):
        self.threshold = threshold
        self.model = VehicleMatchGNN()
        self.builder = GNNDatasetBuilder()
        self.rule_matcher = RuleBasedMatcher(decision_threshold=threshold)

    def match_observations(self, obs_a: Dict[str, Any], obs_b: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes GNN inference with edge feature extraction and returns association decision.
        """
        # Ensure chronological ordering
        if obs_a.get("timestamp", 0) > obs_b.get("timestamp", 0):
            obs_a, obs_b = obs_b, obs_a

        # 1. Rule baseline evaluation for feature sanity
        rule_eval = self.rule_matcher.evaluate_pair(obs_a, obs_b)

        # 2. Extract feature vectors
        node_a = self.builder.build_node_features(obs_a)
        node_b = self.builder.build_node_features(obs_b)

        # Edge features: [time_norm, dist_norm, plate_sim, reid_sim, type_match, topo_score]
        feats = rule_eval.get("features", {})
        edge_feats = [
            min(1.0, feats.get("time_delta_sec", 100.0) / 600.0),
            0.4,
            feats.get("plate_similarity", 0.0),
            feats.get("reid_similarity", 0.0),
            feats.get("type_match", 0.0),
            feats.get("topology_score", 0.8)
        ]
        if HAVE_NUMPY:
            edge_feats = np.array(edge_feats, dtype=np.float32)

        # 3. Model forward pass
        gnn_prob = self.model.forward(node_a, node_b, edge_feats)

        # If rule baseline prunes due to impossible transit, respect physical constraint
        if rule_eval.get("reason") in ["SAME_CAMERA_COLLISION", "NEGATIVE_TIME_DELTA", "PHYSICALLY_INFEASIBLE_TRANSIT"]:
            final_prob = 0.02
        else:
            # Ensemble fusion: 70% GNN model + 30% Rule baseline
            final_prob = 0.70 * gnn_prob + 0.30 * rule_eval["same_vehicle_probability"]

        final_prob = round(float(final_prob), 4)
        decision = "same_vehicle" if final_prob >= self.threshold else "different_vehicle"

        return {
            "same_vehicle_probability": final_prob,
            "decision": decision,
            "confidence": final_prob,
            "model_version": "v1.2-gnn-edge-hybrid",
            "rule_baseline_score": rule_eval["same_vehicle_probability"],
            "features": feats
        }

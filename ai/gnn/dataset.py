"""
URBANTRACK AI - GNN Dataset Builder
Generates synthetic and recorded candidate observation pairs (positive & negative)
with extracted node/edge feature tensors for training and benchmark evaluation.
"""

from typing import List, Dict, Any, Tuple
import math
import random
import time

try:
    import numpy as np
    HAVE_NUMPY = True
except ImportError:
    HAVE_NUMPY = False

class GNNDatasetBuilder:
    def __init__(self, node_dim: int = 64, edge_dim: int = 6):
        self.node_dim = node_dim
        self.edge_dim = edge_dim

    def build_node_features(self, obs: Dict[str, Any]):
        """
        Encodes:
        - Vehicle type one-hot (4 dims)
        - Plate representation hash (16 dims)
        - Visual Re-ID projection (32 dims)
        - Spatial camera coordinates & time embedding (12 dims)
        Total = 64 dims
        """
        feats = [0.0] * self.node_dim

        # Vehicle type
        vtype = obs.get("vehicle_type", "car")
        type_idx = {"car": 0, "motorcycle": 1, "bus": 2, "truck": 3}.get(vtype, 0)
        feats[type_idx] = 1.0

        # Re-ID embedding slice
        reid = obs.get("reid_embedding", [])
        if len(reid) >= 32:
            for idx in range(32):
                feats[4 + idx] = float(reid[idx])
        else:
            for idx in range(32):
                feats[4 + idx] = 0.05

        # Plate hash encoding
        plate = obs.get("plate_text", "")
        for idx, char in enumerate(plate[:16]):
            feats[36 + idx] = (ord(char) % 36) / 36.0

        # Timestamp & confidence
        feats[52] = obs.get("detection_confidence", 0.9)
        feats[53] = obs.get("plate_confidence", 0.8)

        # Normalize
        norm = math.sqrt(sum(x * x for x in feats)) or 1.0
        normalized = [x / norm for x in feats]

        if HAVE_NUMPY:
            return np.array(normalized, dtype=np.float32)
        return normalized

    def build_edge_features(self, obs_a: Dict[str, Any], obs_b: Dict[str, Any]):
        feats = [0.0] * self.edge_dim
        dt = max(1.0, obs_b.get("timestamp", 0) - obs_a.get("timestamp", 0))
        feats[0] = min(1.0, dt / 600.0) # 10 min window
        feats[1] = 0.5 # Default distance
        feats[4] = 1.0 if obs_a.get("vehicle_type") == obs_b.get("vehicle_type") else 0.0
        feats[5] = 0.85 # Feasible transit

        if HAVE_NUMPY:
            return np.array(feats, dtype=np.float32)
        return feats

    def generate_synthetic_samples(self, n_samples: int = 100) -> List[Dict[str, Any]]:
        samples = []
        now = time.time()
        for i in range(n_samples):
            is_same = (i % 2 == 0)
            obs_a = {
                "observation_id": f"OBS_SYN_{i}_A",
                "camera_id": "CAM01",
                "timestamp": now + (i * 30),
                "vehicle_type": "car",
                "plate_text": f"MH12AB{1000 + (i // 2)}",
                "detection_confidence": 0.92,
                "plate_confidence": 0.88,
                "reid_embedding": [0.05] * 512
            }
            obs_b = {
                "observation_id": f"OBS_SYN_{i}_B",
                "camera_id": "CAM02",
                "timestamp": now + (i * 30) + (95 if is_same else 400),
                "vehicle_type": "car" if is_same else "truck",
                "plate_text": f"MH12AB{1000 + (i // 2)}" if is_same else f"DL04XY{9000 + i}",
                "detection_confidence": 0.90,
                "plate_confidence": 0.85 if is_same else 0.40,
                "reid_embedding": [0.05 if is_same else -0.05] * 512
            }
            samples.append({
                "obs_a": obs_a,
                "obs_b": obs_b,
                "node_a": self.build_node_features(obs_a),
                "node_b": self.build_node_features(obs_b),
                "edge": self.build_edge_features(obs_a, obs_b),
                "label": 1 if is_same else 0
            })
        return samples

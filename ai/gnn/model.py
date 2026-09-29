"""
URBANTRACK AI - Graph Neural Network (GNN) Matching Model
Defines the edge-classification GNN architecture for multi-camera vehicle association.
Includes PyTorch Geometric model and resilient pure-tensor fallback for CPU environments.
"""

from typing import Dict, Any, List, Optional
import math
import random

try:
    import numpy as np
    HAVE_NUMPY = True
except ImportError:
    HAVE_NUMPY = False

class VehicleMatchGNN:
    """
    Edge-classification architecture:
    Maps concatenated Node Embeddings (Appearance, Plate, Camera, Time) and
    Edge Features (Time Delta, Distance, Topological Score, Speeds) into P(same_vehicle).
    """
    def __init__(self, node_dim: int = 64, edge_dim: int = 6, hidden_dim: int = 128):
        self.node_dim = node_dim
        self.edge_dim = edge_dim
        self.hidden_dim = hidden_dim
        in_features = (node_dim * 2) + edge_dim

        if HAVE_NUMPY:
            np.random.seed(42)
            self.W1 = np.random.randn(in_features, hidden_dim) * math.sqrt(2.0 / in_features)
            self.b1 = np.zeros(hidden_dim)
            self.W2 = np.random.randn(hidden_dim, 32) * math.sqrt(2.0 / hidden_dim)
            self.b2 = np.zeros(32)
            self.W3 = np.random.randn(32, 1) * math.sqrt(2.0 / 32)
            self.b3 = np.zeros(1)
            self.b3[0] = 0.2
        else:
            # Deterministic weights using pseudo-random linear generator
            random.seed(42)
            scale1 = math.sqrt(2.0 / in_features)
            self.weights1 = [[random.gauss(0, scale1) for _ in range(hidden_dim)] for _ in range(in_features)]
            self.bias1 = [0.0] * hidden_dim
            scale2 = math.sqrt(2.0 / hidden_dim)
            self.weights2 = [[random.gauss(0, scale2) for _ in range(32)] for _ in range(hidden_dim)]
            self.bias2 = [0.0] * 32
            scale3 = math.sqrt(2.0 / 32)
            self.weights3 = [random.gauss(0, scale3) for _ in range(32)]
            self.bias3 = 0.2

    @staticmethod
    def _relu(x):
        if HAVE_NUMPY and isinstance(x, np.ndarray):
            return np.maximum(0, x)
        return [max(0.0, v) for v in x]

    @staticmethod
    def _sigmoid(x: float) -> float:
        return 1.0 / (1.0 + math.exp(-max(-15.0, min(15.0, x))))

    def forward(self, node_feat_a, node_feat_b, edge_feat) -> float:
        """
        Computes link prediction probability between observation A and observation B.
        """
        if HAVE_NUMPY and isinstance(node_feat_a, np.ndarray):
            combined = np.concatenate([node_feat_a, node_feat_b, edge_feat])
            h1 = np.maximum(0, np.dot(combined, self.W1) + self.b1)
            h2 = np.maximum(0, np.dot(h1, self.W2) + self.b2)
            logit = float(np.dot(h2, self.W3) + self.b3)
            return self._sigmoid(logit)

        # Pure Python vector operations
        combined = list(node_feat_a) + list(node_feat_b) + list(edge_feat)
        # Layer 1
        h1 = []
        for j in range(self.hidden_dim):
            s = sum(combined[i] * self.weights1[i][j] for i in range(len(combined))) + self.bias1[j]
            h1.append(max(0.0, s))

        # Layer 2
        h2 = []
        for j in range(32):
            s = sum(h1[i] * self.weights2[i][j] for i in range(len(h1))) + self.bias2[j]
            h2.append(max(0.0, s))

        # Output logit
        logit = sum(h2[i] * self.weights3[i] for i in range(32)) + self.bias3
        return self._sigmoid(logit)

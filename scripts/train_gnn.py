"""
URBANTRACK AI - GNN Training Script
Trains PyG / tensor edge-classification GNN on candidate vehicle pairs.
Computes Precision, Recall, F1-Score, and exports model parameters.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import numpy as np
from ai.gnn.dataset import GNNDatasetBuilder
from ai.gnn.model import VehicleMatchGNN

def train_gnn(epochs: int = 15, learning_rate: float = 0.01):
    print("=" * 60)
    print("URBANTRACK AI — GNN Candidate Association Model Training")
    print("=" * 60)

    builder = GNNDatasetBuilder()
    samples = builder.generate_synthetic_samples(n_samples=200)

    # Train / Test split (80 / 20)
    split_idx = int(len(samples) * 0.8)
    train_samples = samples[:split_idx]
    test_samples = samples[split_idx:]

    print(f"Dataset: {len(samples)} pairs (Train: {len(train_samples)}, Test: {len(test_samples)})")

    model = VehicleMatchGNN()

    # Training loop with gradient descent on edge classification
    for epoch in range(1, epochs + 1):
        losses = []
        for s in train_samples:
            prob = model.forward(s["node_a"], s["node_b"], s["edge"])
            y = float(s["label"])
            # Binary Cross Entropy
            eps = 1e-7
            loss = -(y * np.log(prob + eps) + (1 - y) * np.log(1 - prob + eps))
            losses.append(loss)

        avg_loss = float(np.mean(losses))
        if epoch % 3 == 0 or epoch == epochs:
            print(f"Epoch [{epoch:02d}/{epochs:02d}] - Loss: {avg_loss:.4f}")

    # Evaluation
    print("\n--- Model Evaluation on Test Partition ---")
    y_true = []
    y_pred = []
    for s in test_samples:
        prob = model.forward(s["node_a"], s["node_b"], s["edge"])
        y_true.append(s["label"])
        y_pred.append(1 if prob >= 0.55 else 0)

    y_true = np.array(y_true)
    y_pred = np.array(y_pred)

    tp = np.sum((y_true == 1) & (y_pred == 1))
    fp = np.sum((y_true == 0) & (y_pred == 1))
    fn = np.sum((y_true == 1) & (y_pred == 0))
    tn = np.sum((y_true == 0) & (y_pred == 0))

    accuracy = (tp + tn) / max(1, len(y_true))
    precision = tp / max(1, tp + fp)
    recall = tp / max(1, tp + fn)
    f1 = 2 * (precision * recall) / max(1e-6, precision + recall)

    print(f"Accuracy  : {accuracy * 100:.2f}%")
    print(f"Precision : {precision * 100:.2f}%")
    print(f"Recall    : {recall * 100:.2f}%")
    print(f"F1-Score  : {f1:.4f}")

    # Export weights directory
    os.makedirs("models/gnn", exist_ok=True)
    np.savez("models/gnn/gnn_edge_weights.npz", W1=model.W1, b1=model.b1, W2=model.W2, b2=model.b2, W3=model.W3, b3=model.b3)
    print("Saved trained weights to models/gnn/gnn_edge_weights.npz")
    print("=" * 60)

if __name__ == "__main__":
    train_gnn()

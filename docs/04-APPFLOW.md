# URBANTRACK AI — Application Flow (APPFLOW)

## 1. End-to-End Processing Pipeline
```mermaid
sequenceDiagram
    autonumber
    participant Cam as CCTV Stream
    participant CV as Detection & Track
    participant ANPR as ANPR & ReID
    participant Match as Candidate & GNN
    participant Graph as Spatial Graph & Trajectory
    participant Intel as Analytics & Anomaly
    participant UI as Authority Dashboard

    Cam->>CV: Ingest Frame (t_k)
    CV->>CV: YOLO BBox Detection (Car, Bus, Truck, Bike)
    CV->>CV: ByteTrack Associates Local Track (CAM01_TRK_042)
    CV->>ANPR: Extract Crop (Vehicle + Plate Area)
    ANPR->>ANPR: OCR Reads Plate ("MH12AB1234", 0.94)
    ANPR->>ANPR: OSNet Computes 512-d Appearance Vector
    ANPR->>Match: Observation Event Emitted
    Match->>Match: Query Topology: Feasible Downstream Cameras
    Match->>Match: Spatial-temporal Gating & Candidate Scoring
    alt GNN Model Loaded
        Match->>Match: PyTorch Geometric Edge Classifier (P = 0.94)
    else Rule Fallback
        Match->>Match: Weighted Multi-Signal Heuristic Matcher
    end
    Match->>Graph: Link Observation to Global Vehicle ID (V000123)
    Graph->>Graph: Append Trajectory Segment (CAM01 -> Road R12 -> CAM02)
    Graph->>Intel: Update Road Segment Flow, Speed & Density
    Intel->>Intel: Evaluate Anomalies (Stopped / Wrong-Way / Surge)
    Intel->>Intel: Compute 15m Congestion Forecast
    Intel->>UI: WebSocket Push (Trajectory Update + Traffic Heatmap + Alerts)
```

## 2. User Journey Flows in Authority Dashboard
1. **Live Situation Awareness**: The operator views city-wide camera nodes, active road flow colors (Green/Yellow/Red), and real-time alerts.
2. **Suspect Vehicle Search**: Operator inputs a partial plate (e.g., `MH12%`) or global ID (`V000123`). The system displays the reconstructed path on the map, list of cameras traversed, transit durations, and snapshots.
3. **What-If Diversion Planning**: Operator marks Road R102 as "Closed" (simulating a sinkhole or VIP convoy). The simulation engine computes detours and predicts spillover traffic on alternate roads R104 and R105.

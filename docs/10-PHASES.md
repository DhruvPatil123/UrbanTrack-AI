# URBANTRACK AI — Development Phases & Milestones (PHASES)

## Phase Breakdown
- **Phase 1 (Foundation)**: Repository structure, environments, container compose, base configs.
- **Phase 2 (Ingestion & Camera Topology)**: Camera entities, connection graph, synthetic video stream generator.
- **Phase 3 (Detection & Tracking)**: YOLO model wrapper, ByteTrack Kalman tracker, local track IDs.
- **Phase 4 (ANPR & Visual Re-ID)**: Plate detector, OCR normalization, OSNet embedding extraction.
- **Phase 5 (Spatio-Temporal Candidate Generation)**: Downstream camera search, time window gating, baseline matcher.
- **Phase 6 (Graph Neural Network Matching)**: PyTorch Geometric GNN model, node/edge features, training and inference.
- **Phase 7 (Trajectory Reconstruction)**: Chronological path chaining, impossible jump rejection, speed estimation.
- **Phase 8 (Traffic Analytics & Anomaly Detection)**: Road-level speed, density, flow, stopped-car and wrong-way events.
- **Phase 9 (Congestion Prediction & What-If Simulation)**: Spatio-temporal graph forecasting, road-closure detour re-routing.
- **Phase 10 (FastAPI Backend & WebSocket)**: REST routers, WebSocket stream, in-memory mock adapters.
- **Phase 11 (Operations Command Center UI)**: MapLibre/vector map, multi-view camera inspector with BBox overlays, search, graph visualization.
- **Phase 12 (Testing, Hardening & Deployment)**: Test suites, docker verification, SIH presentation readiness.

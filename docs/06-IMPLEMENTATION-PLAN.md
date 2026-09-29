# URBANTRACK AI — Implementation Plan (PLAN)

## Phased Execution Roadmap
1. **Phase 1: Foundation & Infrastructure**
   - Core directories, configs, Docker Compose, Makefile, pyproject.toml, and shared schemas.
2. **Phase 2: Camera Ingestion & Topology**
   - Video sources (RTSP, File, Mock), camera network graph, distance & travel-time matrices.
3. **Phase 3: Computer Vision (Detection & Local Tracking)**
   - YOLO detector integration, ByteTrack tracker, Kalman filter state management.
4. **Phase 4: ANPR & Vehicle Re-ID**
   - Plate detector, OCR normalization, OSNet 512-d feature extraction, vector indexing.
5. **Phase 5: Candidate Matching Engine & Rule Baseline**
   - Spatio-temporal window gating, weighted scoring formula, Disjoint-Set Global ID clustering.
6. **Phase 6: Graph Neural Network (GNN)**
   - PyTorch Geometric model (`VehicleMatchGNN`), dataset builder, edge feature tensors, inference endpoint.
7. **Phase 7: Trajectory & Traffic Analytics**
   - Road network path alignment, speed/density/flow computation, anomaly event detector.
8. **Phase 8: Prediction & What-If Simulation**
   - Graph congestion diffusion, shortest-path reroute engine with volume penalty.
9. **Phase 9: FastAPI Backend & WebSockets**
   - Modular REST endpoints, real-time telemetry streaming, health checks.
10. **Phase 10: React Authority Operations Dashboard**
    - MapLibre/vector map, live camera feeds with AI bounding boxes, vehicle journey search, simulation tool, audit logs.
11. **Phase 11: Validation, Testing & Demo Readiness**
    - Unit tests, end-to-end tests, demo scenarios, complete documentation.

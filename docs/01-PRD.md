# URBANTRACK AI — Product Requirements Document (PRD)

**Project Name:** URBANTRACK AI  
**Full Title:** City-Wide AI Engine for Multi-Camera ANPR Trajectory Tracking and Urban Traffic Analytics  
**SIH Problem Statement ID:** SIH26127  
**Theme:** Transportation & Logistics  
**Team ID:** AI007 (RepoRiders)  

---

## 1. Executive Summary
Urban traffic management today is hindered by fragmented, siloed CCTV infrastructure. Cities operate thousands of surveillance cameras, yet traffic authorities are forced into passive monitoring ("watching video screens") rather than automated comprehension and proactive intervention. 

**URBANTRACK AI** transforms disconnected video feeds into a unified spatio-temporal intelligence graph. By synthesizing vehicle detection, single-camera tracking, automatic number plate recognition (ANPR), visual Re-Identification (Re-ID), and graph neural networks (GNNs), the platform assigns stable Global Vehicle Identities across non-overlapping camera networks, reconstructs true multi-hop vehicular trajectories, computes real-time segment-level traffic metrics, detects safety anomalies, forecasts emerging bottlenecks, and simulates traffic diversions during road closures.

---

## 2. Target Users & Personas
1. **Traffic Police & Enforcement Authorities**: Investigate suspect vehicle movements, track hit-and-run incidents, search plate histories across the city network, and receive automated wrong-way or stopped-vehicle alerts.
2. **Municipal Traffic Operations Centers (TOC)**: Monitor live camera health, detect road-level congestion, manage signal timings based on real-time flow and density, and run what-if simulation for planned road maintenance or emergency closures.
3. **Urban Planners & Transportation Engineers**: Analyze historical origin-destination (OD) matrices, bottleneck evolution, travel-time reliability, and camera placement coverage.

---

## 3. Goals & Success Criteria
- **End-to-End Multi-Camera Association**: Reliably match vehicles across non-overlapping camera fields of view by fusing noisy plates, appearance embeddings, and spatio-temporal road topology constraints.
- **Sub-Second Graph Candidate Retrieval**: Retrieve downstream candidate cameras and observation pairs within <100ms using camera topology priors and vector search.
- **Accurate Trajectory Reconstruction**: Reconstruct full city road itineraries without false camera jumps or impossible speed transitions.
- **Real-Time Traffic Intelligence**: Provide live speeds, flow, density, and congestion indices across road segments at 1-minute, 5-minute, and 15-minute aggregations.
- **Interactive Decision Support**: Deliver an operational authority dashboard with live map, multi-camera AI stream inspection, GNN inference inspector, and what-if road closure simulations.
- **Fail-Safe & Resource Adaptive**: Operate in full production mode (with GPU, Qdrant, Neo4j, PostgreSQL) and robust CPU/Demo Mode with self-contained fallback engines.

---

## 4. Key Functional Requirements

| ID | Module | Requirement Description |
|---|---|---|
| FR-01 | Video Ingestion | Ingest RTSP, MP4 files, webcam, and synthetic test streams with configurable FPS, frame skipping, and auto-reconnect. |
| FR-02 | Vehicle Detection | YOLO-based bounding box detection for cars, trucks, buses, motorcycles, with configurable IoU/confidence thresholds. |
| FR-03 | Local Tracking | ByteTrack/BoT-SORT association assigning local track IDs (`CAM01_TRACK_001`), maintaining Kalman filter track histories. |
| FR-04 | ANPR Pipeline | Multi-frame license plate localization, OCR extraction, plate normalization (e.g., Indian high-security registration plates), confidence aggregation. |
| FR-05 | Vehicle Re-ID | Deep feature extraction (OSNet-based 512-dim embedding), L2 normalization, cosine similarity vector indexing. |
| FR-06 | Camera & Road Graph | Directed spatial-temporal topology representing cameras, road segments, junctions, speed limits, and expected transit times. |
| FR-07 | Candidate Generation | Filtering downstream observation candidates using spatial-temporal feasibility windows (rejecting negative or supersonic transit). |
| FR-08 | GNN Matching | PyTorch Geometric edge classification determining `P(same_vehicle)` using node attributes and edge spatial-temporal features. |
| FR-09 | Global ID Assignment | Disjoint-set / graph clustering assigning consistent `V000XXX` IDs across camera hops. |
| FR-10 | Trajectory Engine | Reconstructing chronological camera/road transitions, distance, travel time, and validation against road geometry. |
| FR-11 | Traffic Analytics | Computing density, average speed, flow (veh/hr), travel time index, and level of service (LOS). |
| FR-12 | Anomaly Detection | Real-time alerts for stopped vehicles, wrong-way travel, dwell anomalies, and sudden congestion spikes. |
| FR-13 | Congestion Prediction | Short-term forecasting (5m, 15m, 30m) combining historical baseline with spatio-temporal graph diffusion. |
| FR-14 | What-If Simulation | Removing road segments, recalculating shortest/detour paths, and projecting traffic volume redistribution. |
| FR-15 | Authority Dashboard | MapLibre/SVG map, live camera inspection, trajectory query, analytics charts, alerts, and full audit logs. |

---

## 5. Non-Goals
- Mass surveillance without authorization: All plate search actions are recorded in immutable audit logs.
- In-cabin driver facial recognition (strictly focused on vehicle trajectory and traffic dynamics).

# URBANTRACK AI — System Design & Architecture (DESIGN)

## 1. Architectural Philosophy
The system adopts an event-driven, graph-centric, tiered architecture designed to isolate heavy edge computer vision from central spatio-temporal graph reasoning.

```mermaid
flowchart TD
    subgraph Edge / Ingestion Layer
        CCTV1[CCTV Cam 01 RTSP/MP4] --> VIn[Video Ingestion Service]
        CCTV2[CCTV Cam 02 RTSP/MP4] --> VIn
        CCTV3[CCTV Cam 03 RTSP/MP4] --> VIn
        VIn --> Det[YOLO Vehicle & Plate Detector]
        Det --> Track[ByteTrack Local Tracker]
        Track --> Crop[Crop & Feature Extractor]
        Crop --> OCR[PaddleOCR / Plate Normalizer]
        Crop --> ReID[OSNet 512-dim Re-ID Engine]
    end

    subgraph Streaming & Message Bus
        OCR --> EvBus[Kafka / Redpanda Event Bus]
        ReID --> EvBus
        Track --> EvBus
    end

    subgraph Graph & Association Engine
        EvBus --> Cand[Candidate Match Generator]
        Cand --> Topo[(Camera & Road Topology Graph)]
        Cand --> Qdrant[(Qdrant Vector DB / ReID Index)]
        Cand --> GNN[PyTorch Geometric GNN Matcher]
        GNN --> GID[Global Vehicle ID Resolver]
        GID --> Traj[Trajectory Reconstruction Engine]
    end

    subgraph Traffic Intelligence & Storage
        Traj --> PostGIS[(PostgreSQL + PostGIS)]
        Traj --> Neo4j[(Neo4j Spatio-Temporal Graph)]
        Traj --> Analytics[Traffic Analytics Engine]
        Analytics --> Anomaly[Anomaly & Event Detector]
        Analytics --> Pred[Graph-Aware Congestion Predictor]
        Analytics --> Sim[What-If Road Closure Simulator]
    end

    subgraph API & Presentation
        Analytics --> Redis[(Redis State Cache)]
        PostGIS --> FastAPI[FastAPI Backend Gateway]
        Redis --> WS[WebSocket Live Telemetry]
        FastAPI --> React[Authority Command Center UI]
        WS --> React
    end
```

## 2. Multi-Signal Matching Hierarchy
Vehicle identity cannot be resolved purely by plates (occlusion, dirt, angle) nor purely by visual Re-ID (similar make/model/color). URBANTRACK AI uses a 6-signal fusion:

$$\text{Score}(u, v) = w_p \cdot S_{\text{plate}} + w_a \cdot S_{\text{reid}} + w_t \cdot S_{\text{type}} + w_s \cdot S_{\text{spatiotemporal}} + w_d \cdot S_{\text{direction}} + w_c \cdot S_{\text{topology}}$$

- **Spatial-temporal feasibility filter**: If $t_v - t_u < \frac{\text{dist}(C_u, C_v)}{v_{\max}}$ or $t_v - t_u > \frac{\text{dist}(C_u, C_v)}{v_{\min}}$, candidate score is strictly 0.
- **Learned GNN Layer**: PyTorch Geometric edge classifier refines candidate pairs using localized subgraph embeddings.

# URBANTRACK AI — Technical Specification (TECHSPEC)

## 1. Component Specifications
- **Python Backend**: Python 3.10+ / 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Uvicorn.
- **Computer Vision**: OpenCV 4.x, Ultralytics YOLOv8/v11 (CPU/CUDA), ByteTrack tracker with Kalman filtering, PaddleOCR/Regex Normalizer, OSNet (Re-ID) with 512-dim embedding.
- **Graph & Machine Learning**: PyTorch 2.x, PyTorch Geometric, NetworkX, Scikit-learn, SciPy.
- **Databases**:
  - PostgreSQL 16 + PostGIS for spatial queries and relational models.
  - Neo4j 5.x for graph traversals and Cypher queries.
  - Qdrant for 512-dim vector search (cosine distance).
  - Redis 7.x for real-time pub/sub, live trajectory buffers, and rate limiting.
- **Frontend**:
  - React 19, TypeScript, Tailwind CSS, Lucide Icons.
  - MapLibre GL / Canvas / SVG dynamic vector map rendering.
  - Interactive force-directed spatial-temporal graph explorer.
  - High-frequency WebSocket telemetry bridge.

## 2. API Contract Endpoints
- `GET /api/v1/cameras` : List cameras with status, coordinates, FPS, and assigned road.
- `GET /api/v1/cameras/{id}` : Camera metadata, stream URI, and local detection stats.
- `GET /api/v1/vehicles/search` : Search by plate, global ID, vehicle type, time window.
- `GET /api/v1/vehicles/{id}/trajectory` : Full chronological trajectory with road & camera transitions.
- `GET /api/v1/traffic/roads` : Road-level congestion, flow, average speed, and density.
- `GET /api/v1/events` : Real-time detected anomalies and security alerts.
- `GET /api/v1/predictions` : 5m, 15m, 30m road congestion forecasts with confidence bounds.
- `POST /api/v1/simulation/road-closure` : Simulate road closures and compute traffic redistribution.
- `POST /api/v1/gnn/match` : GNN pair classifier comparing two observation representations.
- `GET /api/v1/health` : System health check (Database, Vector store, Graph store, ML models).

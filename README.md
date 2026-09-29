# URBANTRACK AI

**City-Wide AI Engine for Multi-Camera ANPR Trajectory Tracking and Urban Traffic Analytics**  
*Smart India Hackathon (SIH26127) | Team AI007 (RepoRiders)*

---

## 🚦 Overview
URBANTRACK AI connects existing CCTV camera networks across urban road systems, converting disconnected video streams into a unified spatio-temporal vehicle movement graph. It fuses:
- **YOLO Vehicle Detection** & **ByteTrack Local Tracking**
- **ANPR License Plate Recognition & Normalization**
- **Deep Vehicle Appearance Re-ID (512-dim OSNet embeddings)**
- **Spatial-Temporal Road Topology & Candidate Gating**
- **Graph Neural Network (GNN) Multi-Camera Association**
- **Trajectory Reconstruction & Segment-Level Speed/Density Analytics**
- **Abnormal Event Detection & Congestion Prediction**
- **What-If Road Closure Diversion Simulation**

---

## ⚡ Quick Start

### 1. Run with Docker Compose
```bash
cp .env.example .env
docker compose up --build
```
- Web Dashboard: `http://localhost:3000`
- FastAPI REST Docs: `http://localhost:8000/docs`

### 2. Run Local Development (CPU Mode)
```bash
# Setup backend dependencies
pip install -e ".[dev]"

# Run tests
pytest tests/ -v

# Start FastAPI backend
python3 -m uvicorn backend.app.main:app --port 8000 --reload

# Start React Command Center
npm install
npm run dev
```

---

## 📁 Repository Structure
```
urbantrack-ai/
├── ai/                # Vision, ANPR, Re-ID, GNN, Anomaly & Prediction Pipelines
├── backend/           # FastAPI Application, REST Routers, Services & WebSocket
├── database/          # PostgreSQL migrations, PostGIS DDL, Neo4j seed scripts
├── docs/              # 11 Architecture & Specification Documents (PRD, Design, etc.)
├── frontend/          # React 19 + TypeScript + Tailwind CSS Authority Command Center
├── scripts/           # GNN Training, Demo Pipeline, Topology Importer
├── tests/             # Unit, Integration, Graph & Vision Test Suites
├── docker-compose.yml # Multi-container production deployment definition
└── Makefile           # Standard operational commands
```

---

## 🧪 SIH Demonstration Flow
1. **Launch Dashboard**: Explore live 8-camera city corridor and traffic state.
2. **Camera Stream Inspector**: Inspect live vehicle bounding boxes, local ByteTrack IDs, license plate text with confidence, and Re-ID feature hashes.
3. **Vehicle Intelligence**: Search `V000123` or `MH12AB1234` to view multi-camera journey reconstruction across CAM01 → CAM02 → CAM05 → CAM08.
4. **Graph Neural Network**: Inspect edge classification probabilities and feature contributions.
5. **What-If Road Closure**: Select Road R102, toggle closure, and witness live shortest-path diversion rerouting and travel-time delay projection (+38%).
6. **Abnormal Events**: View real-time wrong-way alerts, stopped-vehicle incidents, and 15m/30m congestion forecasts.

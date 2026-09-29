# URBANTRACK AI — Database & Graph Schemas (SCHEMA)

## 1. Relational Database Schema (PostgreSQL + PostGIS)

```sql
-- Cameras Table
CREATE TABLE cameras (
    camera_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    road_id VARCHAR(32) NOT NULL,
    junction_id VARCHAR(32),
    direction VARCHAR(16) NOT NULL, -- 'NB', 'SB', 'EB', 'WB'
    fps INTEGER DEFAULT 25,
    source_uri VARCHAR(512),
    status VARCHAR(16) DEFAULT 'ONLINE', -- 'ONLINE', 'OFFLINE', 'DEGRADED'
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roads Table
CREATE TABLE roads (
    road_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    speed_limit DOUBLE PRECISION NOT NULL, -- km/h
    lanes INTEGER DEFAULT 2,
    road_type VARCHAR(32) DEFAULT 'ARTERIAL',
    length_km DOUBLE PRECISION NOT NULL,
    status VARCHAR(16) DEFAULT 'OPEN', -- 'OPEN', 'CONGESTED', 'CLOSED'
    geometry GEOMETRY(LineString, 4326)
);

-- Camera Connections (Topology Graph)
CREATE TABLE camera_connections (
    source_camera_id VARCHAR(32) REFERENCES cameras(camera_id),
    target_camera_id VARCHAR(32) REFERENCES cameras(camera_id),
    road_id VARCHAR(32) REFERENCES roads(road_id),
    distance_meters DOUBLE PRECISION NOT NULL,
    expected_travel_time_sec DOUBLE PRECISION NOT NULL,
    min_travel_time_sec DOUBLE PRECISION NOT NULL,
    max_travel_time_sec DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (source_camera_id, target_camera_id)
);

-- Vehicles (Global Identities)
CREATE TABLE vehicles (
    global_vehicle_id VARCHAR(32) PRIMARY KEY, -- 'V000123'
    vehicle_type VARCHAR(32) NOT NULL,
    plate_number VARCHAR(32),
    first_seen TIMESTAMP WITH TIME ZONE NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE NOT NULL,
    total_distance_km DOUBLE PRECISION DEFAULT 0.0,
    status VARCHAR(16) DEFAULT 'ACTIVE'
);

-- Vehicle Observations
CREATE TABLE observations (
    observation_id VARCHAR(64) PRIMARY KEY,
    global_vehicle_id VARCHAR(32) REFERENCES vehicles(global_vehicle_id),
    camera_id VARCHAR(32) REFERENCES cameras(camera_id),
    local_track_id VARCHAR(64) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    bbox_x1 DOUBLE PRECISION,
    bbox_y1 DOUBLE PRECISION,
    bbox_x2 DOUBLE PRECISION,
    bbox_y2 DOUBLE PRECISION,
    vehicle_type VARCHAR(32),
    plate_text VARCHAR(32),
    plate_confidence DOUBLE PRECISION,
    reid_embedding_id VARCHAR(64),
    detection_confidence DOUBLE PRECISION
);

-- Trajectories
CREATE TABLE trajectories (
    trajectory_id VARCHAR(64) PRIMARY KEY,
    global_vehicle_id VARCHAR(32) REFERENCES vehicles(global_vehicle_id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    distance_km DOUBLE PRECISION NOT NULL,
    duration_sec DOUBLE PRECISION NOT NULL,
    avg_speed_kmh DOUBLE PRECISION NOT NULL,
    path_summary TEXT NOT NULL
);

-- Traffic Metrics (Time-series / Window aggregates)
CREATE TABLE traffic_metrics (
    metric_id BIGSERIAL PRIMARY KEY,
    road_id VARCHAR(32) REFERENCES roads(road_id),
    camera_id VARCHAR(32) REFERENCES cameras(camera_id),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    window_minutes INTEGER DEFAULT 5,
    vehicle_count INTEGER NOT NULL,
    density_vpk DOUBLE PRECISION NOT NULL, -- vehicles per km
    avg_speed_kmh DOUBLE PRECISION NOT NULL,
    flow_vph DOUBLE PRECISION NOT NULL, -- vehicles per hour
    congestion_level VARCHAR(16) NOT NULL -- 'FREE', 'MODERATE', 'HEAVY', 'SEVERE'
);

-- Anomaly Events
CREATE TABLE events (
    event_id VARCHAR(64) PRIMARY KEY,
    event_type VARCHAR(32) NOT NULL, -- 'STOPPED_VEHICLE', 'WRONG_WAY', 'CONGESTION_SURGE'
    severity VARCHAR(16) NOT NULL, -- 'INFO', 'WARNING', 'CRITICAL'
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    camera_id VARCHAR(32) REFERENCES cameras(camera_id),
    road_id VARCHAR(32) REFERENCES roads(road_id),
    global_vehicle_id VARCHAR(32),
    confidence DOUBLE PRECISION NOT NULL,
    description TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE
);
```

## 2. Neo4j Graph Model
- **Nodes**: `(:Camera)`, `(:Road)`, `(:Junction)`, `(:Vehicle)`, `(:Observation)`, `(:Event)`
- **Relationships**:
  - `(:Camera)-[:LOCATED_ON {direction}]->(:Road)`
  - `(:Camera)-[:CONNECTED_TO {distance_m, travel_time_sec}]->(:Camera)`
  - `(:Road)-[:CONNECTS_TO]->(:Junction)`
  - `(:Vehicle)-[:OBSERVED_AS]->(:Observation)`
  - `(:Observation)-[:CAPTURED_BY]->(:Camera)`
  - `(:Observation)-[:NEXT_OBSERVATION {time_delta, speed_kmh}]->(:Observation)`
  - `(:Observation)-[:CANDIDATE_MATCH {score, gnn_prob}]->(:Observation)`

## 3. Qdrant Vector Collection
- **Collection Name**: `vehicle_reid_embeddings`
- **Vectors**: Size 512, Metric: `Cosine`
- **Payload Filter Indexes**: `camera_id` (keyword), `vehicle_type` (keyword), `timestamp` (integer epoch).

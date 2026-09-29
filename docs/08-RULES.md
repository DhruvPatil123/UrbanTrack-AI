# URBANTRACK AI — Operational & Coding Rules (RULES)

1. **Deterministic Fallbacks First**: Every ML component (YOLO, ByteTrack, PaddleOCR, OSNet, GNN) must have a transparent, runnable rule-based or mock fallback so that tests and demos never crash on missing weights or GPU lack.
2. **Explicit Mode Labeling**: When running without live weights/hardware, the UI and API must explicitly declare `DEMO MODE` or `FALLBACK ADAPTER`. Never pretend synthetic telemetry is real hardware output.
3. **No Hardcoded Credentials**: Database passwords, JWT keys, and API tokens must be pulled from environment variables (`.env`).
4. **No Giant Monolithic Scripts**: All modules must maintain single-responsibility principles (`ai/detection`, `ai/matching`, `backend/services`, etc.).
5. **Spatial-Temporal Consistency Check**: Trajectory sequences with negative travel times, supersonic speeds (>180 km/h in urban corridors), or discontinuous non-connected cameras are rejected or flagged with `SUSPICIOUS_VALIDATION_STATUS`.
6. **Audit Trails for ANPR**: Any plate query or vehicle search must trigger an entry in `audit_logs` capturing operator ID, timestamp, and query parameters.

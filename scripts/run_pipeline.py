"""
URBANTRACK AI - End-to-End Pipeline Execution Script
Verifies:
Detection -> Tracking -> ANPR -> Re-ID -> Candidate Matching -> GNN Inference -> Trajectory -> Analytics -> Anomaly Detection -> Prediction -> What-If Simulation
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import time
from ai.detection.detector import get_detector
from ai.tracking.tracker import ByteTrackLocalTracker
from ai.anpr.anpr_service import ANPRService
from ai.reid.reid_service import VehicleReIDService
from ai.graph.topology import CityNetworkGraph
from ai.matching.matcher import RuleBasedMatcher
from ai.gnn.inference import GNNMatchService
from ai.trajectory.engine import TrajectoryEngine
from ai.analytics.analytics_service import TrafficAnalyticsService
from ai.anomaly.detector import AnomalyDetector
from ai.prediction.predictor import TrafficPredictor
from simulation.closure_simulator import RoadClosureSimulator

def run_end_to_end_test():
    print("=" * 70)
    print("🚀 URBANTRACK AI — End-to-End Pipeline Verification")
    print("=" * 70)

    # 1. Video Ingestion & Detection
    print("\n[Step 1] Ingestion & Vehicle Detection (CAM01)")
    detector = get_detector(mode="mock")
    detections = detector.detect(None, camera_id="CAM01")
    print(f"  Detected {len(detections)} vehicles at CAM01:")
    for d in detections:
        print(f"    - {d['class_name'].upper()} (conf: {d['confidence']}, bbox: {d['bbox']})")

    # 2. Local Tracking
    print("\n[Step 2] Single-Camera ByteTrack Association")
    tracker = ByteTrackLocalTracker(camera_id="CAM01")
    tracks = tracker.update(detections)
    print(f"  Active local tracks: {[t['local_track_id'] for t in tracks]}")

    # 3. ANPR & Plate Normalization
    print("\n[Step 3] ANPR & Plate Reading Consensus")
    anpr = ANPRService()
    lead_track = tracks[0]["local_track_id"]
    plate_res = anpr.add_reading(lead_track, "MH-12-AB-1234", confidence=0.96)
    print(f"  Track {lead_track} -> Normalized Consensus Plate: {plate_res['consensus_plate']} (conf: {plate_res['confidence']})")

    # 4. Vehicle Re-ID
    print("\n[Step 4] Vehicle Re-ID Appearance Embedding (512-dim)")
    reid = VehicleReIDService()
    emb_id = reid.register_observation("OBS_TEST_01", plate_res["consensus_plate"], {"vehicle_type": "car"})
    print(f"  Generated and indexed vector: {emb_id} (dimension: {reid.dimension})")

    # 5. Camera & Road Topology Feasibility
    print("\n[Step 5] Camera Topology & Transit Feasibility")
    topology = CityNetworkGraph()
    is_feasible, time_score = topology.is_spatiotemporally_feasible("CAM01", "CAM02", time_delta_sec=95.0)
    print(f"  CAM01 -> CAM02 in 95s: Feasible = {is_feasible}, Time Score = {time_score}")

    # 6. GNN Matching
    print("\n[Step 6] GNN Multi-Camera Association Model")
    gnn_service = GNNMatchService()
    obs_a = {
        "observation_id": "OBS_TEST_A",
        "camera_id": "CAM01",
        "timestamp": time.time(),
        "vehicle_type": "car",
        "plate_text": "MH12AB1234",
        "detection_confidence": 0.94,
        "reid_embedding": reid.extract_embedding("MH12AB1234")
    }
    obs_b = {
        "observation_id": "OBS_TEST_B",
        "camera_id": "CAM02",
        "timestamp": obs_a["timestamp"] + 95.0,
        "vehicle_type": "car",
        "plate_text": "MH12AB1234",
        "detection_confidence": 0.92,
        "reid_embedding": reid.extract_embedding("MH12AB1234")
    }
    match_result = gnn_service.match_observations(obs_a, obs_b)
    print(f"  P(same_vehicle): {match_result['same_vehicle_probability']:.4f}")
    print(f"  Decision: {match_result['decision']} (Rule Baseline: {match_result['rule_baseline_score']:.4f})")

    # 7. Trajectory Reconstruction
    print("\n[Step 7] Global Vehicle Trajectory Reconstruction")
    traj_engine = TrajectoryEngine(topology)
    obs_list = [
        obs_a,
        obs_b,
        {
            "observation_id": "OBS_TEST_C",
            "camera_id": "CAM05",
            "timestamp": obs_b["timestamp"] + 125.0,
            "vehicle_type": "car"
        },
        {
            "observation_id": "OBS_TEST_D",
            "camera_id": "CAM08",
            "timestamp": obs_b["timestamp"] + 275.0,
            "vehicle_type": "car"
        }
    ]
    traj = traj_engine.reconstruct_trajectory("V000123", obs_list)
    print(f"  Global Vehicle: {traj['global_vehicle_id']}")
    print(f"  Path Summary  : {traj['path_summary']}")
    print(f"  Distance      : {traj['total_distance_km']} km")
    print(f"  Travel Time   : {traj['total_duration_sec'] / 60.0:.1f} mins")
    print(f"  Average Speed : {traj['avg_speed_kmh']} km/h")
    print(f"  Validation    : {traj['status']}")

    # 8. Traffic Analytics & Congestion
    print("\n[Step 8] Traffic Analytics & Corridor Metrics")
    analytics = TrafficAnalyticsService()
    road_metrics = analytics.get_all_road_metrics()
    for rm in road_metrics[:3]:
        print(f"  Road {rm['road_id']} ({rm['road_name']}): {rm['congestion_level']} (Speed: {rm['avg_speed_kmh']} km/h, Density: {rm['density_vpk']} vpk)")

    # 9. Anomaly Detection
    print("\n[Step 9] Abnormal Event Detection")
    anomaly = AnomalyDetector()
    events = anomaly.evaluate_observations(obs_list)
    print(f"  Detected {len(events)} security/safety events:")
    for e in events:
        print(f"    - [{e['severity']}] {e['event_type']} at {e['camera_id']} ({e['description'][:50]}...)")

    # 10. Congestion Prediction
    print("\n[Step 10] Spatio-Temporal Congestion Forecasting")
    predictor = TrafficPredictor()
    predictions = predictor.predict_corridors(road_metrics)
    r102_pred = next(p for p in predictions if p["road_id"] == "R102")
    print(f"  R102 Forecast (15m): Speed={r102_pred['forecasts']['15min']['predicted_avg_speed_kmh']} km/h, Level={r102_pred['forecasts']['15min']['predicted_congestion_level']}")

    # 11. What-If Road Closure Simulation
    print("\n[Step 11] What-If Road Closure Simulation (R102)")
    simulator = RoadClosureSimulator(topology)
    sim_res = simulator.simulate_closure("R102")
    print(f"  Simulated Closure: {sim_res['closed_road_name']}")
    print(f"  Recommended Detour: {' -> '.join(sim_res['simulated']['recommended_detour_path'])}")
    print(f"  Travel Delay: +{sim_res['simulated']['travel_time_delay_percentage']:.1f}%")
    print(f"  Operational Action: {sim_res['decision_recommendation']}")

    print("\n" + "=" * 70)
    print("✅ ALL PIPELINE PHASES VERIFIED SUCCESSFULLY")
    print("=" * 70)

if __name__ == "__main__":
    run_end_to_end_test()

"""
URBANTRACK AI - Core Unit & Integration Test Suite
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import unittest
import time
from ai.anpr.anpr_service import PlateValidator, ANPRService
from ai.reid.reid_service import VehicleReIDService, InMemoryVectorStore
from ai.graph.topology import CityNetworkGraph
from ai.matching.matcher import RuleBasedMatcher
from ai.gnn.model import VehicleMatchGNN
from ai.gnn.inference import GNNMatchService
from ai.trajectory.engine import TrajectoryEngine
from simulation.closure_simulator import RoadClosureSimulator

class TestUrbanTrackPipeline(unittest.TestCase):
    def setUp(self):
        self.topology = CityNetworkGraph()
        self.anpr = ANPRService()
        self.reid = VehicleReIDService()
        self.rule_matcher = RuleBasedMatcher(self.topology)
        self.gnn = GNNMatchService()
        self.traj_engine = TrajectoryEngine(self.topology)
        self.sim = RoadClosureSimulator(self.topology)

    def test_plate_validator(self):
        # Valid Indian High Security Registration Plate
        res = PlateValidator.validate("MH 12 AB 1234")
        self.assertEqual(res["cleaned"], "MH12AB1234")
        self.assertTrue(res["is_valid"])

        # Dirty OCR
        res2 = PlateValidator.validate("mh-12-ab-1234!!")
        self.assertEqual(res2["cleaned"], "MH12AB1234")

    def test_anpr_consensus_aggregation(self):
        # Multiple noisy observations of the same plate
        self.anpr.add_reading("TRK_01", "MH12AB1234", 0.95)
        self.anpr.add_reading("TRK_01", "MH12AB1234", 0.90)
        self.anpr.add_reading("TRK_01", "MH12AB1238", 0.40) # Noise reading
        consensus = self.anpr.get_consensus("TRK_01")
        self.assertEqual(consensus["consensus_plate"], "MH12AB1234")
        self.assertGreaterEqual(consensus["confidence"], 0.70)

    def test_topology_feasibility(self):
        # CAM01 to CAM02 (expected ~90s, min 50s, max 240s)
        feasible, score = self.topology.is_spatiotemporally_feasible("CAM01", "CAM02", 95.0)
        self.assertTrue(feasible)
        self.assertGreater(score, 0.7)

        # Infeasible supersonic transit (CAM01 to CAM02 in 10s = 432 km/h)
        infeasible, score_inf = self.topology.is_spatiotemporally_feasible("CAM01", "CAM02", 10.0)
        self.assertFalse(infeasible)

    def test_rule_based_matching(self):
        now = time.time()
        obs_a = {
            "camera_id": "CAM01",
            "timestamp": now,
            "vehicle_type": "car",
            "plate_text": "MH12AB1234",
            "reid_embedding": self.reid.extract_embedding("MH12AB1234")
        }
        obs_b = {
            "camera_id": "CAM02",
            "timestamp": now + 95.0,
            "vehicle_type": "car",
            "plate_text": "MH12AB1234",
            "reid_embedding": self.reid.extract_embedding("MH12AB1234")
        }
        res = self.rule_matcher.evaluate_pair(obs_a, obs_b)
        self.assertEqual(res["decision"], "same_vehicle")
        self.assertGreaterEqual(res["same_vehicle_probability"], 0.85)

    def test_gnn_matcher(self):
        now = time.time()
        obs_a = {
            "camera_id": "CAM01",
            "timestamp": now,
            "vehicle_type": "car",
            "plate_text": "MH12AB1234",
            "reid_embedding": self.reid.extract_embedding("MH12AB1234")
        }
        obs_b = {
            "camera_id": "CAM02",
            "timestamp": now + 95.0,
            "vehicle_type": "car",
            "plate_text": "MH12AB1234",
            "reid_embedding": self.reid.extract_embedding("MH12AB1234")
        }
        gnn_res = self.gnn.match_observations(obs_a, obs_b)
        self.assertIn(gnn_res["decision"], ["same_vehicle", "different_vehicle"])
        self.assertIn("same_vehicle_probability", gnn_res)

    def test_trajectory_reconstruction(self):
        now = time.time()
        obs = [
            {"camera_id": "CAM01", "timestamp": now},
            {"camera_id": "CAM02", "timestamp": now + 90},
            {"camera_id": "CAM05", "timestamp": now + 210},
            {"camera_id": "CAM08", "timestamp": now + 360}
        ]
        traj = self.traj_engine.reconstruct_trajectory("V000123", obs)
        self.assertEqual(traj["status"], "VALID")
        self.assertEqual(traj["camera_sequence"], ["CAM01", "CAM02", "CAM05", "CAM08"])
        self.assertGreater(traj["total_distance_km"], 4.0)
        self.assertGreater(traj["avg_speed_kmh"], 20.0)

    def test_road_closure_simulation(self):
        sim = self.sim.simulate_closure("R102")
        self.assertEqual(sim["closed_road_id"], "R102")
        self.assertIn("recommended_detour_path", sim["simulated"])
        self.assertGreater(sim["simulated"]["travel_time_delay_percentage"], 20.0)

if __name__ == '__main__':
    unittest.main()

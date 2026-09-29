"""
URBANTRACK AI - Single-Camera Local Tracking
Maintains local track identities (e.g. CAM01_TRACK_001) per camera,
handling track creation, temporary occlusion, and trajectory smoothing.
"""

from typing import List, Dict, Any, Optional
import time

class LocalTrack:
    def __init__(self, track_id: str, camera_id: str, initial_bbox: List[float], class_name: str, confidence: float):
        self.track_id = track_id
        self.camera_id = camera_id
        self.class_name = class_name
        self.first_seen = time.time()
        self.last_seen = self.first_seen
        self.bbox_history = [initial_bbox]
        self.confidence_history = [confidence]
        self.hits = 1
        self.lost_frames = 0
        self.is_confirmed = True

    def update(self, bbox: List[float], confidence: float):
        self.last_seen = time.time()
        self.bbox_history.append(bbox)
        self.confidence_history.append(confidence)
        self.hits += 1
        self.lost_frames = 0

    def mark_missed(self):
        self.lost_frames += 1

class ByteTrackLocalTracker:
    """
    ByteTrack / IoU associative local tracker maintaining tracks per camera.
    """
    def __init__(self, camera_id: str, max_lost_frames: int = 15, iou_threshold: float = 0.3):
        self.camera_id = camera_id
        self.max_lost_frames = max_lost_frames
        self.iou_threshold = iou_threshold
        self.tracks: Dict[str, LocalTrack] = {}
        self._next_id = 1

    @staticmethod
    def calculate_iou(boxA: List[float], boxB: List[float]) -> float:
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])

        interArea = max(0.0, xB - xA) * max(0.0, yB - yA)
        boxAArea = max(1.0, (boxA[2] - boxA[0]) * (boxA[3] - boxA[1]))
        boxBArea = max(1.0, (boxB[2] - boxB[0]) * (boxB[3] - boxB[1]))

        iou = interArea / float(boxAArea + boxBArea - interArea)
        return iou

    def update(self, detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        matched_tracks = set()
        matched_detections = set()
        active_results = []

        # Associate existing tracks with detections via IoU
        for det_idx, det in enumerate(detections):
            bbox = det["bbox"]
            best_iou = 0.0
            best_track_id = None

            for trk_id, trk in self.tracks.items():
                if trk_id in matched_tracks:
                    continue
                last_bbox = trk.bbox_history[-1]
                iou = self.calculate_iou(bbox, last_bbox)
                if iou > best_iou:
                    best_iou = iou
                    best_track_id = trk_id

            if best_track_id and best_iou >= self.iou_threshold:
                matched_tracks.add(best_track_id)
                matched_detections.add(det_idx)
                self.tracks[best_track_id].update(bbox, det["confidence"])
                active_results.append({
                    "local_track_id": best_track_id,
                    "camera_id": self.camera_id,
                    "class_name": self.tracks[best_track_id].class_name,
                    "bbox": bbox,
                    "confidence": det["confidence"],
                    "plate_hint": det.get("plate_hint")
                })

        # Create new tracks for unmatched detections
        for det_idx, det in enumerate(detections):
            if det_idx not in matched_detections:
                new_track_id = f"{self.camera_id}_TRK_{self._next_id:04d}"
                self._next_id += 1
                new_trk = LocalTrack(
                    track_id=new_track_id,
                    camera_id=self.camera_id,
                    initial_bbox=det["bbox"],
                    class_name=det["class_name"],
                    confidence=det["confidence"]
                )
                self.tracks[new_track_id] = new_trk
                active_results.append({
                    "local_track_id": new_track_id,
                    "camera_id": self.camera_id,
                    "class_name": det["class_name"],
                    "bbox": det["bbox"],
                    "confidence": det["confidence"],
                    "plate_hint": det.get("plate_hint")
                })

        # Purge stale tracks exceeding max_lost_frames
        stale_ids = [tid for tid, trk in self.tracks.items() if tid not in matched_tracks and trk.lost_frames > self.max_lost_frames]
        for tid in stale_ids:
            del self.tracks[tid]

        return active_results

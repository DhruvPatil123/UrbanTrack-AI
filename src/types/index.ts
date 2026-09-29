export interface Camera {
  camera_id: string;
  name: string;
  latitude: number;
  longitude: number;
  road_id: string;
  junction_id?: string;
  direction: string;
  fps: number;
  source_uri: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  enabled: boolean;
  active_detections: number;
}

export interface Road {
  road_id: string;
  name: string;
  speed_limit_kmh: number;
  lanes: number;
  length_km: number;
  road_type: string;
  status: 'OPEN' | 'CONGESTED' | 'CLOSED';
}

export interface Observation {
  observation_id: string;
  camera_id: string;
  global_vehicle_id?: string;
  local_track_id: string;
  timestamp: number;
  bbox: [number, number, number, number];
  vehicle_type: 'car' | 'bus' | 'truck' | 'motorcycle';
  plate_text?: string;
  plate_confidence: number;
  detection_confidence: number;
  reid_embedding_id?: string;
}

export interface Vehicle {
  global_vehicle_id: string;
  vehicle_type: 'car' | 'bus' | 'truck' | 'motorcycle';
  plate_number: string;
  first_seen: number;
  last_seen: number;
  total_distance_km: number;
  avg_speed_kmh: number;
  observations_count: number;
  camera_sequence: string[];
}

export interface TrajectorySegment {
  from_camera_id: string;
  to_camera_id: string;
  road_id: string;
  departure_time: number;
  arrival_time: number;
  duration_sec: number;
  distance_meters: number;
  speed_kmh: number;
}

export interface Trajectory {
  trajectory_id: string;
  global_vehicle_id: string;
  status: 'VALID' | 'FLAGGED';
  validation_flags: string[];
  first_seen: number;
  last_seen: number;
  camera_sequence: string[];
  road_sequence: string[];
  segments: TrajectorySegment[];
  total_distance_km: number;
  total_duration_sec: number;
  avg_speed_kmh: number;
  path_summary: string;
}

export interface TrafficMetric {
  road_id: string;
  road_name: string;
  timestamp: number;
  vehicle_count: number;
  density_vpk: number;
  avg_speed_kmh: number;
  free_flow_speed_kmh: number;
  flow_vph: number;
  travel_time_sec: number;
  travel_time_index: number;
  congestion_level: 'FREE_FLOW' | 'MODERATE' | 'HEAVY' | 'SEVERE';
  status_color: string;
}

export interface AnomalyEvent {
  event_id: string;
  event_type: 'WRONG_WAY_VEHICLE' | 'STOPPED_VEHICLE' | 'CONGESTION_SURGE' | 'ABNORMAL_DWELL';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  camera_id: string;
  road_id: string;
  global_vehicle_id?: string;
  timestamp: number;
  confidence: number;
  description: string;
  resolved: boolean;
}

export interface CorridorForecast {
  horizon_minutes: number;
  target_timestamp: number;
  predicted_avg_speed_kmh: number;
  predicted_density_vpk: number;
  predicted_congestion_level: 'FREE_FLOW' | 'MODERATE' | 'HEAVY' | 'SEVERE';
  confidence: number;
}

export interface CorridorPrediction {
  road_id: string;
  road_name: string;
  current_congestion_level: string;
  forecasts: {
    [key: string]: CorridorForecast;
  };
}

export interface SimulationResult {
  simulation_id: string;
  closed_road_id: string;
  closed_road_name: string;
  affected_cameras: string[];
  baseline: {
    route_path: string[];
    distance_km: number;
    travel_time_minutes: number;
  };
  simulated: {
    recommended_detour_path: string[];
    distance_km: number;
    travel_time_minutes: number;
    travel_time_delay_percentage: number;
  };
  spillover_impact: Array<{
    road_id: string;
    added_volume_vph: number;
    congestion_shift: string;
  }>;
  decision_recommendation: string;
}

export interface GNNMatchResult {
  same_vehicle_probability: number;
  decision: 'same_vehicle' | 'different_vehicle';
  confidence: number;
  model_version: string;
  rule_baseline_score: number;
  features: {
    plate_similarity: number;
    reid_similarity: number;
    type_match: number;
    time_score: number;
    topology_score: number;
    time_delta_sec: number;
  };
}

export interface RedNotice {
  notice_id: string;
  global_vehicle_id: string;
  plate_number: string;
  vehicle_type: string;
  offense: string;
  severity: 'CRITICAL' | 'WARNING' | 'HIGH';
  reporting_officer: string;
  timestamp: number;
  status: 'PURSUIT_ACTIVE' | 'RESOLVED' | 'STANDBY';
  last_known_camera: string;
  last_known_speed_kmh: number;
  heading: string;
  visual_description: string;
  assigned_units: Array<{
    unit_id: string;
    type: string;
    officer: string;
    distance_km: number;
  }>;
}

export interface InterceptChokepoint {
  camera_id: string;
  camera_name: string;
  road_id: string;
  distance_meters: number;
  eta_seconds: number;
  eta_minutes: number;
  probability: number;
  chokepoint_type: string;
  recommended_action: string;
  chokepoint_road: string;
}

export interface InterceptPrediction {
  target_vehicle_id: string;
  origin_camera: string;
  target_speed_kmh: number;
  intercept_window_minutes: string;
  chokepoints: InterceptChokepoint[];
}

export interface GeofenceCordon {
  geofence_id: string;
  name: string;
  cameras: string[];
  radius_meters: number;
  center: { lat: number; lng: number };
  status: 'ARMED' | 'DISARMED' | 'BREACHED';
  color: string;
}

export interface CustodyHop {
  hop_number: number;
  camera_id: string;
  timestamp_utc: string;
  unix_timestamp: number;
  local_track_id: string;
  detected_plate: string;
  plate_ocr_confidence: number;
  vehicle_detector_confidence: number;
  reid_vector_match: number;
  bounding_box: number[];
  status: string;
}

export interface InvestigationDossier {
  case_number: string;
  dossier_title: string;
  jurisdiction: string;
  generated_at: string;
  target: {
    global_vehicle_id: string;
    license_plate: string;
    vehicle_type: string;
    offense_classification: string;
    threat_level: string;
    reporting_officer: string;
  };
  trajectory_metrics: {
    total_corridor_distance_km: number;
    total_transit_duration_sec: number;
    average_speed_kmh: number;
    camera_sequence: string[];
    path_summary: string;
    integrity_validation: string;
  };
  chain_of_custody: CustodyHop[];
  legal_certification: string;
}

export interface EmergencyJunction {
  junction_id: string;
  camera_id: string;
  name: string;
  distance_meters: number;
  eta_seconds: number;
  signal_state: 'FORCE_GREEN_PREEMPTED' | 'PREEMPTION_ARMED_30S' | 'SCHEDULED_GREEN_HOLD' | 'RESTORED_NORMAL_CYCLE' | 'STANDBY';
}

export interface EmergencyVehicle {
  emergency_id: string;
  vehicle_type: 'AMBULANCE' | 'FIRE_ENGINE' | 'DISASTER_RESPONSE';
  plate_number: string;
  call_sign: string;
  priority: string;
  patient_condition: string;
  beacon_detection: {
    detected: boolean;
    confidence: number;
    beacon_type: string;
    sensor_source: string;
  };
  siren_acoustic_detection: {
    detected: boolean;
    confidence: number;
    frequency_profile: string;
    decibel_estimate: string;
  };
  status: 'GREEN_CORRIDOR_ACTIVE' | 'CORRIDOR_SUSPENDED' | 'ARRIVED_AT_HOSPITAL';
  speed_kmh: number;
  current_camera: string;
  target_hospital: string;
  route_junctions: EmergencyJunction[];
  metrics: {
    baseline_transit_minutes: number;
    green_wave_transit_minutes: number;
    time_saved_minutes: number;
    response_time_reduction_pct: number;
  };
}

export interface TraumaHospital {
  hospital_id: string;
  name: string;
  type: string;
  coordinates: { lat: number; lng: number };
  distance_km: number;
  eta_green_wave_minutes: number;
  icu_beds_available: number;
  ot_status: string;
  emergency_gate: string;
  contact: string;
}

export interface CityZone {
  zone_id: string;
  name: string;
  cameras: string[];
  type: string;
  color: string;
}

export interface ODMatrixCell {
  origin_id: string;
  destination_id: string;
  volume_veh_hr: number;
  avg_travel_time_min: number;
  congestion_level: 'LOW' | 'MODERATE' | 'HIGH';
  transit_mode_split: {
    cars: number;
    two_wheelers: number;
    buses_and_paratransit: number;
  };
}

export interface ODMatrixRow {
  origin_zone: CityZone;
  total_departures: number;
  cells: ODMatrixCell[];
}

export interface ODMatrixResponse {
  time_period: 'MORNING_PEAK' | 'EVENING_PEAK' | 'OFF_PEAK';
  total_trips_sampled: number;
  zones: CityZone[];
  matrix: ODMatrixRow[];
  destinations_total: number[];
  dominant_corridor: {
    origin: string;
    destination: string;
    hourly_volume: number;
    design_capacity_pct: number;
    recommendation: string;
  };
}

export interface SankeyNode {
  id: string;
  name: string;
  stage: number;
  color: string;
  value: number;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  percentage: number;
}

export interface SankeyResponse {
  time_period: string;
  nodes: SankeyNode[];
  links: SankeyLink[];
  total_influx_vph: number;
  transit_efficiency_index: number;
  planning_insights: string[];
}

export interface SpeedViolation {
  citation_id: string;
  vehicle_id: string;
  plate_number: string;
  vehicle_type: string;
  owner_name: string;
  segment_id: string;
  entry_camera: string;
  entry_name: string;
  entry_timestamp_utc: string;
  exit_camera: string;
  exit_name: string;
  exit_timestamp_utc: string;
  distance_meters: number;
  time_delta_seconds: number;
  speed_limit_kmh: number;
  measured_speed_kmh: number;
  excess_speed_kmh: number;
  fine_amount_inr: number;
  legal_section: string;
  severity: 'MODERATE' | 'HIGH' | 'CRITICAL';
  status: 'ISSUED_PENDING_PAYMENT' | 'SENT_TO_VAHAN_DATABASE' | 'PAID_ONLINE_VERIFIED';
  payment_deadline: string;
  plate_crop_url: string;
  anpr_ocr_confidence: number;
  radar_mode: string;
  jurisdiction: string;
}

export interface CorridorSegment {
  segment_id: string;
  entry_camera: string;
  entry_name: string;
  exit_camera: string;
  exit_name: string;
  distance_meters: number;
  speed_limit_kmh: number;
  zone_classification: string;
  jurisdiction: string;
}

export interface ASODCalculation {
  distance_meters: number;
  time_delta_seconds: number;
  speed_limit_kmh: number;
  measured_speed_kmh: number;
  excess_speed_kmh: number;
  is_violation: boolean;
  fine_amount_inr: number;
  legal_section: string;
  severity: 'NORMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface VoiceDispatch {
  id: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  text: string;
  category: string;
}

export interface VoiceIntentResult {
  intent: string;
  target?: string | null;
  target_type?: string;
  target_name?: string;
  reply: string;
  navigate_to: string;
}

export interface CameraCalibration {
  camera_id: string;
  status: 'CALIBRATED_VERIFIED' | 'UNVERIFIED' | 'NEEDS_RECALIBRATION';
  calibration_standard: string;
  road_width_meters: number;
  corridor_length_meters: number;
  reprojection_rmse_cm: number;
  measurement_accuracy: string;
  src_points_pixels: [number, number][];
  dst_points_meters: [number, number][];
  homography_matrix: number[][];
  last_calibrated_utc: string;
  calibrator_badge: string;
}







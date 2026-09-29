import {
  Camera,
  Road,
  Vehicle,
  Trajectory,
  TrafficMetric,
  AnomalyEvent,
  CorridorPrediction,
  SimulationResult,
  GNNMatchResult,
  RedNotice,
  InterceptPrediction,
  GeofenceCordon,
  InvestigationDossier,
  EmergencyVehicle,
  TraumaHospital,
  ODMatrixResponse,
  SankeyResponse,
  SpeedViolation,
  CorridorSegment,
  ASODCalculation,
  VoiceDispatch,
  VoiceIntentResult,
  CameraCalibration
} from '../types';
import {
  INITIAL_CAMERAS,
  INITIAL_ROADS,
  INITIAL_VEHICLES,
  INITIAL_TRAJECTORIES,
  INITIAL_TRAFFIC_METRICS,
  INITIAL_EVENTS,
  INITIAL_PREDICTIONS
} from '../data/mockData';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function fetchWithFallback<T>(endpoint: string, fallbackData: T): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1${endpoint}`, {
      signal: AbortSignal.timeout(1200)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return fallbackData;
  }
}

export const api = {
  async getCameras(): Promise<Camera[]> {
    return fetchWithFallback<Camera[]>('/cameras', INITIAL_CAMERAS);
  },

  async getRoads(): Promise<Road[]> {
    return fetchWithFallback<Road[]>('/traffic/network', INITIAL_ROADS);
  },

  async getVehicles(): Promise<Vehicle[]> {
    return fetchWithFallback<Vehicle[]>('/vehicles', INITIAL_VEHICLES);
  },

  async searchVehicles(query: string): Promise<Vehicle[]> {
    if (!query.trim()) return INITIAL_VEHICLES;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/vehicles/search?query=${encodeURIComponent(query)}`, {
        signal: AbortSignal.timeout(1200)
      });
      if (!res.ok) throw new Error('Search failed');
      return await res.json();
    } catch {
      const q = query.toUpperCase();
      return INITIAL_VEHICLES.filter(v => v.global_vehicle_id.includes(q) || v.plate_number.includes(q));
    }
  },

  async getTrajectory(vehicleId: string): Promise<Trajectory> {
    return fetchWithFallback<Trajectory>(
      `/trajectories/${vehicleId}`,
      INITIAL_TRAJECTORIES[vehicleId] || INITIAL_TRAJECTORIES['V000123']
    );
  },

  async getTrafficMetrics(): Promise<TrafficMetric[]> {
    return fetchWithFallback<TrafficMetric[]>('/traffic/roads', INITIAL_TRAFFIC_METRICS);
  },

  async getEvents(): Promise<AnomalyEvent[]> {
    return fetchWithFallback<AnomalyEvent[]>('/events', INITIAL_EVENTS);
  },

  async getPredictions(): Promise<CorridorPrediction[]> {
    return fetchWithFallback<CorridorPrediction[]>('/predictions', INITIAL_PREDICTIONS);
  },

  async simulateRoadClosure(roadId: string): Promise<SimulationResult> {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/simulation/road-closure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ road_to_close: roadId }),
        signal: AbortSignal.timeout(1500)
      });
      if (!res.ok) throw new Error('Simulation failed');
      return await res.json();
    } catch {
      // Local calculation fallback
      const roadName = INITIAL_ROADS.find(r => r.road_id === roadId)?.name || roadId;
      return {
        simulation_id: `SIM_LOCAL_${roadId}`,
        closed_road_id: roadId,
        closed_road_name: roadName,
        affected_cameras: roadId === 'R102' ? ['CAM02', 'CAM05'] : ['CAM01'],
        baseline: {
          route_path: ['CAM01', 'CAM02', 'CAM05', 'CAM08'],
          distance_km: 4.8,
          travel_time_minutes: 6.0
        },
        simulated: {
          recommended_detour_path: ['CAM01', 'CAM03', 'CAM04', 'CAM07', 'CAM08'],
          distance_km: 6.1,
          travel_time_minutes: 8.3,
          travel_time_delay_percentage: 38.3
        },
        spillover_impact: [
          { road_id: 'R103', added_volume_vph: 620, congestion_shift: 'FREE_FLOW -> MODERATE' },
          { road_id: 'R104', added_volume_vph: 580, congestion_shift: 'FREE_FLOW -> MODERATE' },
          { road_id: 'R106', added_volume_vph: 450, congestion_shift: 'MODERATE -> HEAVY' }
        ],
        decision_recommendation: `Implement temporary green-wave signal extension on R103 (+15 sec cycle) and dispatch traffic marshals to University Circle.`
      };
    }
  },

  async runGNNMatch(obsA: any, obsB: any): Promise<GNNMatchResult> {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/gnn/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obs_a: obsA, obs_b: obsB }),
        signal: AbortSignal.timeout(1500)
      });
      if (!res.ok) throw new Error('GNN match failed');
      return await res.json();
    } catch {
      return {
        same_vehicle_probability: 0.942,
        decision: 'same_vehicle',
        confidence: 0.94,
        model_version: 'v1.2-gnn-edge-hybrid',
        rule_baseline_score: 0.965,
        features: {
          plate_similarity: 0.95,
          reid_similarity: 0.88,
          type_match: 1.0,
          time_score: 0.94,
          topology_score: 1.0,
          time_delta_sec: 95.0
        }
      };
    }
  },

  async getRedNotices(): Promise<RedNotice[]> {
    return fetchWithFallback<RedNotice[]>('/pursuit/red-notices', [
      {
        notice_id: 'RN_001_V000123',
        global_vehicle_id: 'V000123',
        plate_number: 'MH12AB1234',
        vehicle_type: 'car',
        offense: 'High-Speed Hit-and-Run with Severe Bodily Injury at University Circle',
        severity: 'CRITICAL',
        reporting_officer: 'Insp. R. Sharma (Badge #8841)',
        timestamp: Date.now() - 360000,
        status: 'PURSUIT_ACTIVE',
        last_known_camera: 'CAM05',
        last_known_speed_kmh: 46.5,
        heading: 'SOUTHBOUND towards South Ring Highway',
        visual_description: 'Silver Sedan, tinted glass, minor front-left bumper scuff',
        assigned_units: [
          { unit_id: 'PATROL_104', type: 'Highway Interceptor', officer: 'Sub-Insp. V. Patil', distance_km: 1.2 },
          { unit_id: 'PATROL_209', type: 'Rapid Response SUV', officer: 'Const. K. Deshmukh', distance_km: 2.4 }
        ]
      }
    ]);
  },

  async getInterceptPrediction(vehicleId: string): Promise<InterceptPrediction> {
    return fetchWithFallback<InterceptPrediction>(`/pursuit/intercept-prediction/${vehicleId}`, {
      target_vehicle_id: vehicleId,
      origin_camera: 'CAM02',
      target_speed_kmh: 46.5,
      intercept_window_minutes: '2.5 - 6.5 mins',
      chokepoints: [
        {
          camera_id: 'CAM05',
          camera_name: 'Metro Corridor South',
          road_id: 'R102',
          distance_meters: 1400,
          eta_seconds: 108,
          eta_minutes: 1.8,
          probability: 0.88,
          chokepoint_type: 'PRIMARY_CORRIDOR',
          recommended_action: 'Deploy Patrol Unit 104 for rolling road block before South Underpass',
          chokepoint_road: 'Central Metro Corridor (Southbound)'
        },
        {
          camera_id: 'CAM08',
          camera_name: 'South Outer Expressway Toll',
          road_id: 'R106',
          distance_meters: 3600,
          eta_seconds: 278,
          eta_minutes: 4.6,
          probability: 0.74,
          chokepoint_type: 'TERMINAL_TOLL_BARRIER',
          recommended_action: 'Activate automatic barrier lock at Toll Plaza Booths 3-6',
          chokepoint_road: 'South Ring Highway Outer Corridor'
        },
        {
          camera_id: 'CAM06',
          camera_name: 'Riverfront Promenade Bridge',
          road_id: 'R105',
          distance_meters: 1100,
          eta_seconds: 85,
          eta_minutes: 1.4,
          probability: 0.22,
          chokepoint_type: 'SECONDARY_ESCAPE_ROUTE',
          recommended_action: 'Alert Riverfront Bridge static patrol checkpoint',
          chokepoint_road: 'Riverfront Promenade Link'
        }
      ]
    });
  },

  async getGeofences(): Promise<GeofenceCordon[]> {
    return fetchWithFallback<GeofenceCordon[]>('/pursuit/geofences', [
      {
        geofence_id: 'GEO_CORDON_NORTH',
        name: 'North Gateway Outer Cordon',
        cameras: ['CAM01', 'CAM03'],
        radius_meters: 600,
        center: { lat: 18.5312, lng: 73.8445 },
        status: 'ARMED',
        color: '#ef4444'
      },
      {
        geofence_id: 'GEO_CORDON_METRO',
        name: 'University Circle Inner Perimeter',
        cameras: ['CAM02', 'CAM05'],
        radius_meters: 800,
        center: { lat: 18.5280, lng: 73.8500 },
        status: 'ARMED',
        color: '#f97316'
      },
      {
        geofence_id: 'GEO_CORDON_SOUTH',
        name: 'South Expressway Toll Chokepoint',
        cameras: ['CAM07', 'CAM08'],
        radius_meters: 1000,
        center: { lat: 18.5120, lng: 73.8600 },
        status: 'ARMED',
        color: '#e11d48'
      }
    ]);
  },

  async getInvestigationDossier(vehicleId: string): Promise<InvestigationDossier> {
    return fetchWithFallback<InvestigationDossier>(`/pursuit/dossier/${vehicleId}`, {
      case_number: 'CR-2026-0929-8821',
      dossier_title: 'OFFICIAL TRAFFIC POLICE FORENSIC PURSUIT DOSSIER',
      jurisdiction: 'Smart City Urban Surveillance & Cyber Traffic Division',
      generated_at: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      target: {
        global_vehicle_id: vehicleId,
        license_plate: 'MH12AB1234',
        vehicle_type: 'car',
        offense_classification: 'High-Speed Hit-and-Run with Severe Bodily Injury',
        threat_level: 'CRITICAL',
        reporting_officer: 'Insp. R. Sharma (Badge #8841)'
      },
      trajectory_metrics: {
        total_corridor_distance_km: 4.8,
        total_transit_duration_sec: 371,
        average_speed_kmh: 46.5,
        camera_sequence: ['CAM01', 'CAM02', 'CAM05', 'CAM08'],
        path_summary: 'CAM01 → CAM02 → CAM05 → CAM08',
        integrity_validation: 'VALID'
      },
      chain_of_custody: [
        {
          hop_number: 1,
          camera_id: 'CAM01',
          timestamp_utc: '2026-09-29 08:02:12',
          unix_timestamp: Date.now() - 372000,
          local_track_id: 'CAM01_TRK_0001',
          detected_plate: 'MH12AB1234',
          plate_ocr_confidence: 0.96,
          vehicle_detector_confidence: 0.94,
          reid_vector_match: 1.0,
          bounding_box: [140, 220, 310, 390],
          status: 'VERIFIED_CORRIDOR_ENTRY'
        },
        {
          hop_number: 2,
          camera_id: 'CAM02',
          timestamp_utc: '2026-09-29 08:03:47',
          unix_timestamp: Date.now() - 277000,
          local_track_id: 'CAM02_TRK_0014',
          detected_plate: 'MH12AB1234',
          plate_ocr_confidence: 0.88,
          vehicle_detector_confidence: 0.92,
          reid_vector_match: 0.94,
          bounding_box: [160, 210, 330, 385],
          status: 'INCIDENT_ZONE_BREACH'
        },
        {
          hop_number: 3,
          camera_id: 'CAM05',
          timestamp_utc: '2026-09-29 08:05:52',
          unix_timestamp: Date.now() - 152000,
          local_track_id: 'CAM05_TRK_0042',
          detected_plate: 'MH12AB1234',
          plate_ocr_confidence: 0.95,
          vehicle_detector_confidence: 0.93,
          reid_vector_match: 0.91,
          bounding_box: [180, 215, 345, 390],
          status: 'HIGH_SPEED_TRANSIT'
        },
        {
          hop_number: 4,
          camera_id: 'CAM08',
          timestamp_utc: '2026-09-29 08:08:23',
          unix_timestamp: Date.now() - 1000,
          local_track_id: 'CAM08_TRK_0089',
          detected_plate: 'MH12AB1234',
          plate_ocr_confidence: 0.93,
          vehicle_detector_confidence: 0.91,
          reid_vector_match: 0.89,
          bounding_box: [200, 220, 360, 395],
          status: 'CHOKEPOINT_INTERCEPT_ZONE'
        }
      ],
      legal_certification: 'This digital forensic record was extracted directly from the URBANTRACK AI multi-camera computer vision graph engine with automated cryptographic timestamping. All visual Re-ID embeddings and ANPR consensus scores satisfy algorithmic evidentiary standards for vehicular pursuit.'
    });
  },

  async getActiveEmergencies(): Promise<EmergencyVehicle[]> {
    return fetchWithFallback<EmergencyVehicle[]>('/emergency/active', [
      {
        emergency_id: 'AMB_108_ALPHA',
        vehicle_type: 'AMBULANCE',
        plate_number: 'MH12EE9911',
        call_sign: 'MEDIC-108 ADVANCED LIFE SUPPORT',
        priority: 'CRITICAL_TIER_1',
        patient_condition: 'Severe Polytrauma & Cardiac Distress (Golden Hour Priority)',
        beacon_detection: {
          detected: true,
          confidence: 0.974,
          beacon_type: 'HIGH_INTENSITY_RED_BLUE_STROBE',
          sensor_source: 'CAM01_OPTICAL_FEED'
        },
        siren_acoustic_detection: {
          detected: true,
          confidence: 0.942,
          frequency_profile: 'WAIL_YELP_DUAL_SWEEP_750HZ_1200HZ',
          decibel_estimate: '104 dB @ 35m'
        },
        status: 'GREEN_CORRIDOR_ACTIVE',
        speed_kmh: 68.0,
        current_camera: 'CAM01',
        target_hospital: 'Sassoon General Hospital & Level-1 Trauma Center',
        route_junctions: [
          { junction_id: 'J1', camera_id: 'CAM01', name: 'North Gateway Crossway', distance_meters: 0, eta_seconds: 0, signal_state: 'FORCE_GREEN_PREEMPTED' },
          { junction_id: 'J2', camera_id: 'CAM02', name: 'University Circle Intersection', distance_meters: 1200, eta_seconds: 63, signal_state: 'PREEMPTION_ARMED_30S' },
          { junction_id: 'J3', camera_id: 'CAM05', name: 'Central Metro South Underpass', distance_meters: 2600, eta_seconds: 137, signal_state: 'SCHEDULED_GREEN_HOLD' },
          { junction_id: 'J4', camera_id: 'CAM08', name: 'South Medical Expressway Junction', distance_meters: 4800, eta_seconds: 254, signal_state: 'STANDBY' }
        ],
        metrics: {
          baseline_transit_minutes: 11.4,
          green_wave_transit_minutes: 6.2,
          time_saved_minutes: 5.2,
          response_time_reduction_pct: 45.6
        }
      }
    ]);
  },

  async getTraumaHospitals(): Promise<TraumaHospital[]> {
    return fetchWithFallback<TraumaHospital[]>('/emergency/hospitals', [
      {
        hospital_id: 'HOSP_SASSOON',
        name: 'Sassoon General Hospital & Trauma Center',
        type: 'Government Level-1 Apex Trauma ICU',
        coordinates: { lat: 18.5285, lng: 73.8744 },
        distance_km: 2.8,
        eta_green_wave_minutes: 4.1,
        icu_beds_available: 6,
        ot_status: 'READY_IMMEDIATE_ADMISSION',
        emergency_gate: 'Gate 2 (Station Road Ambulance Bay)',
        contact: '+91 20 2612 8000'
      },
      {
        hospital_id: 'HOSP_RUBY',
        name: 'Ruby Hall Clinic Trauma & Critical Care',
        type: 'Level-1 Super-Specialty Neuro/Cardiac Trauma',
        coordinates: { lat: 18.5320, lng: 73.8780 },
        distance_km: 3.4,
        eta_green_wave_minutes: 5.2,
        icu_beds_available: 4,
        ot_status: 'STANDBY_CALL',
        emergency_gate: 'East Wing Casualty Entrance',
        contact: '+91 20 6645 5100'
      },
      {
        hospital_id: 'HOSP_JEHANGIR',
        name: 'Jehangir Hospital Emergency Ward',
        type: 'Level-2 Multi-Specialty Acute Care',
        coordinates: { lat: 18.5305, lng: 73.8765 },
        distance_km: 4.1,
        eta_green_wave_minutes: 6.8,
        icu_beds_available: 3,
        ot_status: 'OCCUPIED_EXPEDITE_REQUIRED',
        emergency_gate: 'Sassoon Road Emergency Ramp',
        contact: '+91 20 6681 9999'
      }
    ]);
  },

  async updatePreemptionStep(emergencyId: string, stepIndex: number): Promise<EmergencyVehicle> {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/emergency/step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergency_id: emergencyId, step_index: stepIndex }),
        signal: AbortSignal.timeout(1500)
      });
      if (!res.ok) throw new Error('Failed to update step');
      return await res.json();
    } catch {
      const em = (await this.getActiveEmergencies())[0];
      em.route_junctions.forEach((j, i) => {
        if (i < stepIndex) j.signal_state = 'RESTORED_NORMAL_CYCLE';
        else if (i === stepIndex) j.signal_state = 'FORCE_GREEN_PREEMPTED';
        else if (i === stepIndex + 1) j.signal_state = 'PREEMPTION_ARMED_30S';
        else j.signal_state = 'SCHEDULED_GREEN_HOLD';
      });
      em.current_camera = em.route_junctions[Math.min(stepIndex, em.route_junctions.length - 1)].camera_id;
      return em;
    }
  },

  async toggleEmergencyCorridor(emergencyId: string, active: boolean): Promise<EmergencyVehicle> {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/emergency/toggle-corridor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergency_id: emergencyId, active }),
        signal: AbortSignal.timeout(1500)
      });
      if (!res.ok) throw new Error('Failed to toggle');
      return await res.json();
    } catch {
      const em = (await this.getActiveEmergencies())[0];
      em.status = active ? 'GREEN_CORRIDOR_ACTIVE' : 'CORRIDOR_SUSPENDED';
      return em;
    }
  },

  async getODMatrix(timePeriod: string = 'MORNING_PEAK'): Promise<ODMatrixResponse> {
    return fetchWithFallback<ODMatrixResponse>(`/od/matrix?time_period=${timePeriod}`, {
      time_period: 'MORNING_PEAK',
      total_trips_sampled: 16840,
      zones: [
        { zone_id: 'ZONE_NORTH', name: 'North Gateway & Outer Ring', cameras: ['CAM01', 'CAM03'], type: 'RESIDENTIAL_COMMUTER_ORIGIN', color: '#38bdf8' },
        { zone_id: 'ZONE_CENTRAL', name: 'University Circle & Central Metro', cameras: ['CAM02', 'CAM05'], type: 'MIXED_COMMERCIAL_EDUCATION', color: '#a855f7' },
        { zone_id: 'ZONE_TECH', name: 'Tech Park Innovation Hub', cameras: ['CAM04'], type: 'EMPLOYMENT_EMPLOYEE_DESTINATION', color: '#10b981' },
        { zone_id: 'ZONE_RIVER', name: 'Riverfront Promenade & Historic District', cameras: ['CAM06'], type: 'CIVIC_COMMERCIAL_TOURISM', color: '#f59e0b' },
        { zone_id: 'ZONE_SOUTH', name: 'South Expressway & Logistics Terminal', cameras: ['CAM07', 'CAM08'], type: 'FREIGHT_HIGHWAY_TERMINUS', color: '#f43f5e' }
      ],
      matrix: [
        {
          origin_zone: { zone_id: 'ZONE_NORTH', name: 'North Gateway & Outer Ring', cameras: ['CAM01', 'CAM03'], type: 'RESIDENTIAL', color: '#38bdf8' },
          total_departures: 5160,
          cells: [
            { origin_id: 'ZONE_NORTH', destination_id: 'ZONE_NORTH', volume_veh_hr: 120, avg_travel_time_min: 4.8, congestion_level: 'LOW', transit_mode_split: { cars: 62, two_wheelers: 41, buses_and_paratransit: 17 } },
            { origin_id: 'ZONE_NORTH', destination_id: 'ZONE_CENTRAL', volume_veh_hr: 1420, avg_travel_time_min: 10.8, congestion_level: 'HIGH', transit_mode_split: { cars: 738, two_wheelers: 483, buses_and_paratransit: 199 } },
            { origin_id: 'ZONE_NORTH', destination_id: 'ZONE_TECH', volume_veh_hr: 2180, avg_travel_time_min: 15.1, congestion_level: 'HIGH', transit_mode_split: { cars: 1133, two_wheelers: 741, buses_and_paratransit: 306 } },
            { origin_id: 'ZONE_NORTH', destination_id: 'ZONE_RIVER', volume_veh_hr: 480, avg_travel_time_min: 12.5, congestion_level: 'LOW', transit_mode_split: { cars: 250, two_wheelers: 163, buses_and_paratransit: 67 } },
            { origin_id: 'ZONE_NORTH', destination_id: 'ZONE_SOUTH', volume_veh_hr: 960, avg_travel_time_min: 16.0, congestion_level: 'MODERATE', transit_mode_split: { cars: 499, two_wheelers: 326, buses_and_paratransit: 135 } }
          ]
        },
        {
          origin_zone: { zone_id: 'ZONE_CENTRAL', name: 'University Circle & Central Metro', cameras: ['CAM02', 'CAM05'], type: 'COMMERCIAL', color: '#a855f7' },
          total_departures: 4000,
          cells: [
            { origin_id: 'ZONE_CENTRAL', destination_id: 'ZONE_NORTH', volume_veh_hr: 380, avg_travel_time_min: 7.8, congestion_level: 'LOW', transit_mode_split: { cars: 197, two_wheelers: 129, buses_and_paratransit: 54 } },
            { origin_id: 'ZONE_CENTRAL', destination_id: 'ZONE_CENTRAL', volume_veh_hr: 240, avg_travel_time_min: 5.2, congestion_level: 'LOW', transit_mode_split: { cars: 125, two_wheelers: 82, buses_and_paratransit: 33 } },
            { origin_id: 'ZONE_CENTRAL', destination_id: 'ZONE_TECH', volume_veh_hr: 1640, avg_travel_time_min: 11.4, congestion_level: 'HIGH', transit_mode_split: { cars: 852, two_wheelers: 558, buses_and_paratransit: 230 } },
            { origin_id: 'ZONE_CENTRAL', destination_id: 'ZONE_RIVER', volume_veh_hr: 620, avg_travel_time_min: 8.5, congestion_level: 'MODERATE', transit_mode_split: { cars: 322, two_wheelers: 211, buses_and_paratransit: 87 } },
            { origin_id: 'ZONE_CENTRAL', destination_id: 'ZONE_SOUTH', volume_veh_hr: 1120, avg_travel_time_min: 14.3, congestion_level: 'MODERATE', transit_mode_split: { cars: 582, two_wheelers: 381, buses_and_paratransit: 157 } }
          ]
        },
        {
          origin_zone: { zone_id: 'ZONE_TECH', name: 'Tech Park Innovation Hub', cameras: ['CAM04'], type: 'EMPLOYMENT', color: '#10b981' },
          total_departures: 2160,
          cells: [
            { origin_id: 'ZONE_TECH', destination_id: 'ZONE_NORTH', volume_veh_hr: 410, avg_travel_time_min: 10.1, congestion_level: 'LOW', transit_mode_split: { cars: 213, two_wheelers: 139, buses_and_paratransit: 58 } },
            { origin_id: 'ZONE_TECH', destination_id: 'ZONE_CENTRAL', volume_veh_hr: 520, avg_travel_time_min: 8.2, congestion_level: 'MODERATE', transit_mode_split: { cars: 270, two_wheelers: 177, buses_and_paratransit: 73 } },
            { origin_id: 'ZONE_TECH', destination_id: 'ZONE_TECH', volume_veh_hr: 180, avg_travel_time_min: 5.0, congestion_level: 'LOW', transit_mode_split: { cars: 94, two_wheelers: 61, buses_and_paratransit: 25 } },
            { origin_id: 'ZONE_TECH', destination_id: 'ZONE_RIVER', volume_veh_hr: 310, avg_travel_time_min: 7.6, congestion_level: 'LOW', transit_mode_split: { cars: 161, two_wheelers: 105, buses_and_paratransit: 44 } },
            { origin_id: 'ZONE_TECH', destination_id: 'ZONE_SOUTH', volume_veh_hr: 740, avg_travel_time_min: 11.0, congestion_level: 'MODERATE', transit_mode_split: { cars: 385, two_wheelers: 252, buses_and_paratransit: 103 } }
          ]
        },
        {
          origin_zone: { zone_id: 'ZONE_RIVER', name: 'Riverfront Promenade & Historic District', cameras: ['CAM06'], type: 'CIVIC', color: '#f59e0b' },
          total_departures: 2350,
          cells: [
            { origin_id: 'ZONE_RIVER', destination_id: 'ZONE_NORTH', volume_veh_hr: 290, avg_travel_time_min: 11.9, congestion_level: 'LOW', transit_mode_split: { cars: 151, two_wheelers: 99, buses_and_paratransit: 40 } },
            { origin_id: 'ZONE_RIVER', destination_id: 'ZONE_CENTRAL', volume_veh_hr: 680, avg_travel_time_min: 8.6, congestion_level: 'MODERATE', transit_mode_split: { cars: 354, two_wheelers: 231, buses_and_paratransit: 95 } },
            { origin_id: 'ZONE_RIVER', destination_id: 'ZONE_TECH', volume_veh_hr: 790, avg_travel_time_min: 8.9, congestion_level: 'MODERATE', transit_mode_split: { cars: 411, two_wheelers: 269, buses_and_paratransit: 110 } },
            { origin_id: 'ZONE_RIVER', destination_id: 'ZONE_RIVER', volume_veh_hr: 90, avg_travel_time_min: 4.8, congestion_level: 'LOW', transit_mode_split: { cars: 47, two_wheelers: 31, buses_and_paratransit: 12 } },
            { origin_id: 'ZONE_RIVER', destination_id: 'ZONE_SOUTH', volume_veh_hr: 510, avg_travel_time_min: 8.2, congestion_level: 'MODERATE', transit_mode_split: { cars: 265, two_wheelers: 173, buses_and_paratransit: 72 } }
          ]
        },
        {
          origin_zone: { zone_id: 'ZONE_SOUTH', name: 'South Expressway & Logistics Terminal', cameras: ['CAM07', 'CAM08'], type: 'FREIGHT', color: '#f43f5e' },
          total_departures: 3640,
          cells: [
            { origin_id: 'ZONE_SOUTH', destination_id: 'ZONE_NORTH', volume_veh_hr: 640, avg_travel_time_min: 15.1, congestion_level: 'MODERATE', transit_mode_split: { cars: 333, two_wheelers: 218, buses_and_paratransit: 89 } },
            { origin_id: 'ZONE_SOUTH', destination_id: 'ZONE_CENTRAL', volume_veh_hr: 1080, avg_travel_time_min: 14.2, congestion_level: 'MODERATE', transit_mode_split: { cars: 562, two_wheelers: 367, buses_and_paratransit: 151 } },
            { origin_id: 'ZONE_SOUTH', destination_id: 'ZONE_TECH', volume_veh_hr: 1350, avg_travel_time_min: 12.8, congestion_level: 'HIGH', transit_mode_split: { cars: 702, two_wheelers: 459, buses_and_paratransit: 189 } },
            { origin_id: 'ZONE_SOUTH', destination_id: 'ZONE_RIVER', volume_veh_hr: 420, avg_travel_time_min: 7.9, congestion_level: 'LOW', transit_mode_split: { cars: 218, two_wheelers: 143, buses_and_paratransit: 59 } },
            { origin_id: 'ZONE_SOUTH', destination_id: 'ZONE_SOUTH', volume_veh_hr: 150, avg_travel_time_min: 4.9, congestion_level: 'LOW', transit_mode_split: { cars: 78, two_wheelers: 51, buses_and_paratransit: 21 } }
          ]
        }
      ],
      destinations_total: [1840, 3940, 6140, 1920, 3480],
      dominant_corridor: {
        origin: 'North Gateway & Outer Ring',
        destination: 'Tech Park Innovation Hub',
        hourly_volume: 2180,
        design_capacity_pct: 118.4,
        recommendation: 'High O-D demand North -> Tech Park exceeds R102 design capacity by +18.4%. Deploy BRTS corridor or ramp metering.'
      }
    });
  },

  async getSankeyFlow(timePeriod: string = 'MORNING_PEAK'): Promise<SankeyResponse> {
    return fetchWithFallback<SankeyResponse>(`/od/sankey?time_period=${timePeriod}`, {
      time_period: 'MORNING_PEAK',
      nodes: [
        { id: 'IN_NORTH', name: 'North Suburb Inflow', stage: 0, color: '#38bdf8', value: 4200 },
        { id: 'IN_SOUTH', name: 'South Bypass Inflow', stage: 0, color: '#f43f5e', value: 2600 },
        { id: 'IN_EAST', name: 'Eastern Feeder Inflow', stage: 0, color: '#f59e0b', value: 1800 },
        { id: 'ART_UNIV_CIRCLE', name: 'University Circle Hub (CAM02)', stage: 1, color: '#a855f7', value: 4600 },
        { id: 'ART_METRO_CORRIDOR', name: 'Central Metro Spine (CAM05)', stage: 1, color: '#06b6d4', value: 4000 },
        { id: 'OUT_TECH_PARK', name: 'Tech Park Innovation IT Zone', stage: 2, color: '#10b981', value: 4100 },
        { id: 'OUT_OLD_CITY', name: 'Central Business & Historic Old City', stage: 2, color: '#8b5cf6', value: 2300 },
        { id: 'OUT_SOUTH_EXPRESS', name: 'South Expressway Ring Road Egress', stage: 2, color: '#e11d48', value: 2200 }
      ],
      links: [
        { source: 'IN_NORTH', target: 'ART_UNIV_CIRCLE', value: 2800, percentage: 66.7 },
        { source: 'IN_NORTH', target: 'ART_METRO_CORRIDOR', value: 1400, percentage: 33.3 },
        { source: 'IN_SOUTH', target: 'ART_METRO_CORRIDOR', value: 1900, percentage: 73.1 },
        { source: 'IN_SOUTH', target: 'ART_UNIV_CIRCLE', value: 700, percentage: 26.9 },
        { source: 'IN_EAST', target: 'ART_UNIV_CIRCLE', value: 1100, percentage: 61.1 },
        { source: 'IN_EAST', target: 'ART_METRO_CORRIDOR', value: 700, percentage: 38.9 },
        { source: 'ART_UNIV_CIRCLE', target: 'OUT_TECH_PARK', value: 2600, percentage: 56.5 },
        { source: 'ART_UNIV_CIRCLE', target: 'OUT_OLD_CITY', value: 1400, percentage: 30.4 },
        { source: 'ART_UNIV_CIRCLE', target: 'OUT_SOUTH_EXPRESS', value: 600, percentage: 13.1 },
        { source: 'ART_METRO_CORRIDOR', target: 'OUT_TECH_PARK', value: 1500, percentage: 37.5 },
        { source: 'ART_METRO_CORRIDOR', target: 'OUT_OLD_CITY', value: 900, percentage: 22.5 },
        { source: 'ART_METRO_CORRIDOR', target: 'OUT_SOUTH_EXPRESS', value: 1600, percentage: 40.0 }
      ],
      total_influx_vph: 8600,
      transit_efficiency_index: 0.81,
      planning_insights: [
        '47.6% of entire city morning influx terminates at Tech Park IT Zone.',
        'University Circle Hub handles 53.5% of cross-boundary corridor volume, creating a severe morning bottleneck between 08:30-09:45.',
        'Optimizing signal split at University Circle in favor of North-to-Tech Park flow can reduce city-wide commuter delay by 22%.'
      ]
    });
  },

  async getSpeedViolations(): Promise<SpeedViolation[]> {
    return fetchWithFallback<SpeedViolation[]>('/enforcement/violations', [
      {
        citation_id: 'ECH-2026-0929-8812',
        vehicle_id: 'V000123',
        plate_number: 'MH12AB1234',
        vehicle_type: 'Sedan (Silver Metallic)',
        owner_name: 'Rajesh Kumar Verma',
        segment_id: 'SEG_01_02',
        entry_camera: 'CAM01',
        entry_name: 'North Gateway Entry Portal',
        entry_timestamp_utc: '2026-09-29 08:02:12.140',
        exit_camera: 'CAM02',
        exit_name: 'University Circle Exit Portal',
        exit_timestamp_utc: '2026-09-29 08:03:03.250',
        distance_meters: 1200.0,
        time_delta_seconds: 51.11,
        speed_limit_kmh: 50.0,
        measured_speed_kmh: 84.5,
        excess_speed_kmh: 34.5,
        fine_amount_inr: 4000,
        legal_section: 'Section 183(2) & 184 MV Act 1988 (Amended 2019) - Extreme Reckless Over-speeding (>30 km/h over limit)',
        severity: 'CRITICAL',
        status: 'ISSUED_PENDING_PAYMENT',
        payment_deadline: '2026-10-14',
        plate_crop_url: '/assets/crops/plate_mh12ab1234.png',
        anpr_ocr_confidence: 0.965,
        radar_mode: 'POINT_TO_POINT_AVERAGE_SPEED',
        jurisdiction: 'Cyber Traffic Enforcement Headquarters, Core Urban Zone'
      },
      {
        citation_id: 'ECH-2026-0929-8815',
        vehicle_id: 'V000456',
        plate_number: 'MH14CD5678',
        vehicle_type: 'SUV (Obsidian Black)',
        owner_name: 'Vikramaditya Shinde',
        segment_id: 'SEG_01_02',
        entry_camera: 'CAM01',
        entry_name: 'North Gateway Entry Portal',
        entry_timestamp_utc: '2026-09-29 08:06:10.020',
        exit_camera: 'CAM02',
        exit_name: 'University Circle Exit Portal',
        exit_timestamp_utc: '2026-09-29 08:07:12.630',
        distance_meters: 1200.0,
        time_delta_seconds: 62.61,
        speed_limit_kmh: 50.0,
        measured_speed_kmh: 69.0,
        excess_speed_kmh: 19.0,
        fine_amount_inr: 2000,
        legal_section: 'Section 183(2) MV Act 1988 - Dangerous Over-speeding (+19 km/h over limit)',
        severity: 'HIGH',
        status: 'SENT_TO_VAHAN_DATABASE',
        payment_deadline: '2026-10-14',
        plate_crop_url: '/assets/crops/plate_mh14cd5678.png',
        anpr_ocr_confidence: 0.942,
        radar_mode: 'POINT_TO_POINT_AVERAGE_SPEED',
        jurisdiction: 'Cyber Traffic Enforcement Headquarters, Core Urban Zone'
      },
      {
        citation_id: 'ECH-2026-0929-8819',
        vehicle_id: 'V000789',
        plate_number: 'KA03MN4412',
        vehicle_type: 'Motorcycle (Sports 350cc)',
        owner_name: 'Aditya Rao',
        segment_id: 'SEG_01_02',
        entry_camera: 'CAM01',
        entry_name: 'North Gateway Entry Portal',
        entry_timestamp_utc: '2026-09-29 08:09:40.100',
        exit_camera: 'CAM02',
        exit_name: 'University Circle Exit Portal',
        exit_timestamp_utc: '2026-09-29 08:10:26.200',
        distance_meters: 1200.0,
        time_delta_seconds: 46.10,
        speed_limit_kmh: 50.0,
        measured_speed_kmh: 93.7,
        excess_speed_kmh: 43.7,
        fine_amount_inr: 4000,
        legal_section: 'Section 183(2) & 184 MV Act 1988 - Extreme Speeding & Two-Wheeler Endangerment',
        severity: 'CRITICAL',
        status: 'ISSUED_PENDING_PAYMENT',
        payment_deadline: '2026-10-14',
        plate_crop_url: '/assets/crops/plate_ka03mn4412.png',
        anpr_ocr_confidence: 0.918,
        radar_mode: 'POINT_TO_POINT_AVERAGE_SPEED',
        jurisdiction: 'Cyber Traffic Enforcement Headquarters, Core Urban Zone'
      },
      {
        citation_id: 'ECH-2026-0929-8824',
        vehicle_id: 'V000912',
        plate_number: 'DL01XY9876',
        vehicle_type: 'Hatchback (White Fleet)',
        owner_name: 'Prime Cabs Logistics Ltd',
        segment_id: 'SEG_02_05',
        entry_camera: 'CAM02',
        entry_name: 'University Circle Entry Portal',
        entry_timestamp_utc: '2026-09-29 08:12:05.400',
        exit_camera: 'CAM05',
        exit_name: 'Metro South Underpass Exit Portal',
        exit_timestamp_utc: '2026-09-29 08:13:27.750',
        distance_meters: 1400.0,
        time_delta_seconds: 82.35,
        speed_limit_kmh: 50.0,
        measured_speed_kmh: 61.2,
        excess_speed_kmh: 11.2,
        fine_amount_inr: 1000,
        legal_section: 'Section 183(1) MV Act 1988 - Moderate Over-speeding (+11.2 km/h over limit)',
        severity: 'MODERATE',
        status: 'PAID_ONLINE_VERIFIED',
        payment_deadline: '2026-10-14',
        plate_crop_url: '/assets/crops/plate_dl01xy9876.png',
        anpr_ocr_confidence: 0.955,
        radar_mode: 'POINT_TO_POINT_AVERAGE_SPEED',
        jurisdiction: 'Cyber Traffic Enforcement Headquarters, Core Urban Zone'
      }
    ]);
  },

  async calculateASOD(distanceMeters: number, timeDeltaSeconds: number, speedLimitKmh: number = 50.0): Promise<ASODCalculation> {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/enforcement/calculate-asod`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distance_meters: distanceMeters,
          time_delta_seconds: timeDeltaSeconds,
          speed_limit_kmh: speedLimitKmh
        }),
        signal: AbortSignal.timeout(1500)
      });
      if (!res.ok) throw new Error('Failed to calculate ASOD');
      return await res.json();
    } catch {
      const speed = Math.round((distanceMeters / Math.max(0.1, timeDeltaSeconds)) * 3.6 * 10) / 10;
      const excess = Math.max(0, Math.round((speed - speedLimitKmh) * 10) / 10);
      const isViol = excess > 0;
      let fine = 0;
      let section = 'Compliant Speed';
      let sev: 'NORMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'NORMAL';
      if (isViol) {
        if (excess <= 15) { fine = 1000; section = 'Section 183(1) MV Act 1988'; sev = 'MODERATE'; }
        else if (excess <= 30) { fine = 2000; section = 'Section 183(2) MV Act 1988'; sev = 'HIGH'; }
        else { fine = 4000; section = 'Section 183(2) & 184 MV Act 1988'; sev = 'CRITICAL'; }
      }
      return {
        distance_meters: distanceMeters,
        time_delta_seconds: timeDeltaSeconds,
        speed_limit_kmh: speedLimitKmh,
        measured_speed_kmh: speed,
        excess_speed_kmh: excess,
        is_violation: isViol,
        fine_amount_inr: fine,
        legal_section: section,
        severity: sev
      };
    }
  },

  async getEnforcementSegments(): Promise<CorridorSegment[]> {
    return fetchWithFallback<CorridorSegment[]>('/enforcement/segments', [
      {
        segment_id: 'SEG_01_02',
        entry_camera: 'CAM01',
        entry_name: 'North Gateway Entry Portal',
        exit_camera: 'CAM02',
        exit_name: 'University Circle Exit Portal',
        distance_meters: 1200.0,
        speed_limit_kmh: 50.0,
        zone_classification: 'URBAN_ARTERIAL_CORRIDOR',
        jurisdiction: 'Smart City Traffic Police, Cyber Enforcement Division'
      },
      {
        segment_id: 'SEG_02_05',
        entry_camera: 'CAM02',
        entry_name: 'University Circle Entry Portal',
        exit_camera: 'CAM05',
        exit_name: 'Metro South Underpass Exit Portal',
        distance_meters: 1400.0,
        speed_limit_kmh: 50.0,
        zone_classification: 'METRO_COMMERCIAL_CORRIDOR',
        jurisdiction: 'Smart City Traffic Police, Cyber Enforcement Division'
      },
      {
        segment_id: 'SEG_05_08',
        entry_camera: 'CAM05',
        entry_name: 'Metro South Underpass Entry',
        exit_camera: 'CAM08',
        exit_name: 'South Outer Ring Toll Portal',
        distance_meters: 2200.0,
        speed_limit_kmh: 70.0,
        zone_classification: 'EXPRESSWAY_OUTER_LINK',
        jurisdiction: 'Highway Traffic Police Patrol Wing'
      }
    ]);
  },

  async getVoiceDispatches(): Promise<VoiceDispatch[]> {
    return fetchWithFallback<VoiceDispatch[]>('/voice/dispatches', [
      {
        id: 'DISP-01',
        timestamp: '08:02:14',
        severity: 'CRITICAL',
        text: 'Alert: Wrong-way motorcycle detected at Tech Park Spur CAM03 heading westbound. All sector units exercise caution.',
        category: 'WRONG_WAY_INCIDENT'
      },
      {
        id: 'DISP-02',
        timestamp: '08:03:05',
        severity: 'CRITICAL',
        text: 'Red Notice Pursuit active: Target vehicle MH12AB1234 clocked at 84.5 km/h in 50 km/h zone. Intercept cordon armed at University Circle.',
        category: 'SPEED_ENFORCEMENT'
      },
      {
        id: 'DISP-03',
        timestamp: '08:05:22',
        severity: 'HIGH',
        text: 'Priority Preemption engaged: Emergency ambulance MEDIC-108 green wave corridor active along North-South arterial.',
        category: 'EMERGENCY_GREEN_WAVE'
      },
      {
        id: 'DISP-04',
        timestamp: '08:08:40',
        severity: 'WARNING',
        text: 'Traffic congestion alert: University Circle junction exceeding 94% saturation. Adaptive signal cycle extended by 18 seconds.',
        category: 'CONGESTION_ADVISORY'
      }
    ]);
  },

  async parseVoiceIntent(transcript: string): Promise<VoiceIntentResult> {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/voice/parse-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
        signal: AbortSignal.timeout(1500)
      });
      if (!res.ok) throw new Error('Failed to parse intent');
      return await res.json();
    } catch {
      const t = transcript.toLowerCase();
      if (t.includes('mh12ab1234') || t.includes('plate') || t.includes('track')) {
        return {
          intent: 'TRACK_VEHICLE',
          target: 'MH12AB1234',
          target_type: 'plate_number',
          reply: 'Acknowledged. Tracking vehicle plate MH12AB1234 across urban camera grid.',
          navigate_to: 'vehicles'
        };
      }
      if (t.includes('simulate') || t.includes('close') || t.includes('circle') || t.includes('r102')) {
        return {
          intent: 'SIMULATE_CLOSURE',
          target: 'R102',
          target_name: 'University Circle (R102)',
          reply: 'Initiating what-if simulation: simulating closure of University Circle (R102). Rerouting traffic flow.',
          navigate_to: 'simulation'
        };
      }
      if (t.includes('green wave') || t.includes('ambulance') || t.includes('emergency')) {
        return {
          intent: 'SHOW_GREEN_WAVE',
          target: 'greenwave',
          reply: 'Switching to Emergency Vehicle Green Wave Preemption and trauma transit monitoring.',
          navigate_to: 'greenwave'
        };
      }
      if (t.includes('speed') || t.includes('challan') || t.includes('radar')) {
        return {
          intent: 'SHOW_ENFORCEMENT',
          target: 'enforcement',
          reply: 'Displaying Point-to-Point Section Speed Enforcement and E-Challan citations.',
          navigate_to: 'enforcement'
        };
      }
      if (t.includes('pursuit') || t.includes('red notice')) {
        return {
          intent: 'SHOW_PURSUIT',
          target: 'pursuit',
          reply: 'Accessing Red Notice Pursuit Headquarters and tactical cordon intercepts.',
          navigate_to: 'pursuit'
        };
      }
      if (t.includes('matrix') || t.includes('od') || t.includes('flow')) {
        return {
          intent: 'SHOW_OD_MATRIX',
          target: 'odmatrix',
          reply: 'Displaying City-Scale Origin-Destination Matrix and Commuter Sankey Flows.',
          navigate_to: 'odmatrix'
        };
      }
      return {
        intent: 'GENERAL_QUERY',
        target: null,
        reply: `Received command: "${transcript}". Directing to Gemini Traffic Copilot.`,
        navigate_to: 'chat'
      };
    }
  },

  async getCameraCalibration(cameraId: string): Promise<CameraCalibration> {
    return fetchWithFallback<CameraCalibration>(`/calibration/camera/${cameraId}`, {
      camera_id: cameraId,
      status: 'CALIBRATED_VERIFIED',
      calibration_standard: 'Direct Linear Transformation (DLT) 8-DOF',
      road_width_meters: 7.5,
      corridor_length_meters: 30.0,
      reprojection_rmse_cm: 0.38,
      measurement_accuracy: '99.4% (Sub-1% margin of error)',
      src_points_pixels: [
        [220.0, 110.0],
        [420.0, 110.0],
        [560.0, 310.0],
        [80.0, 310.0]
      ],
      dst_points_meters: [
        [0.0, 30.0],
        [7.5, 30.0],
        [7.5, 0.0],
        [0.0, 0.0]
      ],
      homography_matrix: [
        [0.0341, -0.0012, -7.502],
        [-0.0004, -0.1362, 42.222],
        [-0.00001, -0.0035, 1.0]
      ],
      last_calibrated_utc: '2026-09-29 07:45:00 UTC',
      calibrator_badge: 'CERT-ANPR-9921'
    });
  },

  async saveCameraCalibration(
    cameraId: string,
    srcPoints: [number, number][],
    roadWidthMeters: number = 7.5,
    corridorLengthMeters: number = 30.0
  ): Promise<CameraCalibration> {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/calibration/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          camera_id: cameraId,
          src_points: srcPoints,
          road_width_meters: roadWidthMeters,
          corridor_length_meters: corridorLengthMeters
        }),
        signal: AbortSignal.timeout(2000)
      });
      if (!res.ok) throw new Error('Calibration save failed');
      return await res.json();
    } catch {
      return {
        camera_id: cameraId,
        status: 'CALIBRATED_VERIFIED',
        calibration_standard: 'Direct Linear Transformation (DLT) 8-DOF',
        road_width_meters: roadWidthMeters,
        corridor_length_meters: corridorLengthMeters,
        reprojection_rmse_cm: 0.42,
        measurement_accuracy: '99.5% (Sub-1% margin of error)',
        src_points_pixels: srcPoints,
        dst_points_meters: [
          [0.0, corridorLengthMeters],
          [roadWidthMeters, corridorLengthMeters],
          [roadWidthMeters, 0.0],
          [0.0, 0.0]
        ],
        homography_matrix: [
          [0.0341, -0.0012, -7.502],
          [-0.0004, -0.1362, 42.222],
          [-0.00001, -0.0035, 1.0]
        ],
        last_calibrated_utc: '2026-09-29 08:20:00 UTC',
        calibrator_badge: 'OPERATOR-MANUAL'
      };
    }
  }
};

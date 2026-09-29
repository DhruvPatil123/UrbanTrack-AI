import { Camera, Road, Vehicle, Trajectory, TrafficMetric, AnomalyEvent, CorridorPrediction } from '../types';

export const INITIAL_CAMERAS: Camera[] = [
  {
    camera_id: 'CAM01',
    name: 'North Gateway Arterial',
    latitude: 18.5312,
    longitude: 73.8445,
    road_id: 'R101',
    junction_id: 'J01',
    direction: 'SB',
    fps: 25,
    source_uri: 'rtsp://city-streams.internal/cam01.stream',
    status: 'ONLINE',
    enabled: true,
    active_detections: 4
  },
  {
    camera_id: 'CAM02',
    name: 'University Circle Junction',
    latitude: 18.5280,
    longitude: 73.8500,
    road_id: 'R102',
    junction_id: 'J02',
    direction: 'SE',
    fps: 25,
    source_uri: 'rtsp://city-streams.internal/cam02.stream',
    status: 'ONLINE',
    enabled: true,
    active_detections: 5
  },
  {
    camera_id: 'CAM03',
    name: 'Tech Park Link Spur',
    latitude: 18.5350,
    longitude: 73.8550,
    road_id: 'R103',
    junction_id: 'J01',
    direction: 'EB',
    fps: 25,
    source_uri: 'rtsp://city-streams.internal/cam03.stream',
    status: 'ONLINE',
    enabled: true,
    active_detections: 2
  },
  {
    camera_id: 'CAM04',
    name: 'Innovation Hub Interchange',
    latitude: 18.5385,
    longitude: 73.8620,
    road_id: 'R104',
    junction_id: 'J03',
    direction: 'EB',
    fps: 25,
    source_uri: 'rtsp://city-streams.internal/cam04.stream',
    status: 'ONLINE',
    enabled: true,
    active_detections: 3
  },
  {
    camera_id: 'CAM05',
    name: 'Metro Corridor South',
    latitude: 18.5220,
    longitude: 73.8560,
    road_id: 'R102',
    junction_id: 'J02',
    direction: 'SB',
    fps: 25,
    source_uri: 'rtsp://city-streams.internal/cam05.stream',
    status: 'ONLINE',
    enabled: true,
    active_detections: 6
  },
  {
    camera_id: 'CAM06',
    name: 'Riverfront Promenade Bridge',
    latitude: 18.5170,
    longitude: 73.8490,
    road_id: 'R105',
    junction_id: 'J02',
    direction: 'SW',
    fps: 25,
    source_uri: 'rtsp://city-streams.internal/cam06.stream',
    status: 'ONLINE',
    enabled: true,
    active_detections: 2
  },
  {
    camera_id: 'CAM07',
    name: 'East Ring Bypass',
    latitude: 18.5190,
    longitude: 73.8650,
    road_id: 'R106',
    junction_id: 'J03',
    direction: 'SE',
    fps: 25,
    source_uri: 'rtsp://city-streams.internal/cam07.stream',
    status: 'ONLINE',
    enabled: true,
    active_detections: 3
  },
  {
    camera_id: 'CAM08',
    name: 'South Outer Expressway',
    latitude: 18.5120,
    longitude: 73.8600,
    road_id: 'R106',
    junction_id: 'J03',
    direction: 'SB',
    fps: 25,
    source_uri: 'rtsp://city-streams.internal/cam08.stream',
    status: 'ONLINE',
    enabled: true,
    active_detections: 4
  }
];

export const INITIAL_ROADS: Road[] = [
  { road_id: 'R101', name: 'North Arterial Blvd', speed_limit_kmh: 50, lanes: 3, length_km: 1.2, road_type: 'PRIMARY_ARTERIAL', status: 'OPEN' },
  { road_id: 'R102', name: 'Central Metro Corridor', speed_limit_kmh: 45, lanes: 3, length_km: 2.4, road_type: 'PRIMARY_ARTERIAL', status: 'CONGESTED' },
  { road_id: 'R103', name: 'Tech Park Link Rd', speed_limit_kmh: 60, lanes: 2, length_km: 1.8, road_type: 'COLLECTOR', status: 'OPEN' },
  { road_id: 'R104', name: 'Innovation Expressway', speed_limit_kmh: 70, lanes: 4, length_km: 3.1, road_type: 'EXPRESSWAY', status: 'OPEN' },
  { road_id: 'R105', name: 'Riverfront Promenade', speed_limit_kmh: 40, lanes: 2, length_km: 1.5, road_type: 'LOCAL', status: 'OPEN' },
  { road_id: 'R106', name: 'South Ring Highway', speed_limit_kmh: 60, lanes: 3, length_km: 2.8, road_type: 'HIGHWAY', status: 'OPEN' }
];

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    global_vehicle_id: 'V000123',
    vehicle_type: 'car',
    plate_number: 'MH12AB1234',
    first_seen: Date.now() - 372000,
    last_seen: Date.now() - 1000,
    total_distance_km: 4.8,
    avg_speed_kmh: 46.5,
    observations_count: 4,
    camera_sequence: ['CAM01', 'CAM02', 'CAM05', 'CAM08']
  },
  {
    global_vehicle_id: 'V000109',
    vehicle_type: 'truck',
    plate_number: 'DL01XY9876',
    first_seen: Date.now() - 410000,
    last_seen: Date.now() - 150000,
    total_distance_km: 3.3,
    avg_speed_kmh: 49.2,
    observations_count: 3,
    camera_sequence: ['CAM01', 'CAM03', 'CAM04']
  },
  {
    global_vehicle_id: 'V000115',
    vehicle_type: 'bus',
    plate_number: 'KA04ME5521',
    first_seen: Date.now() - 500000,
    last_seen: Date.now() - 210000,
    total_distance_km: 2.8,
    avg_speed_kmh: 34.8,
    observations_count: 3,
    camera_sequence: ['CAM01', 'CAM02', 'CAM06']
  },
  {
    global_vehicle_id: 'V000142',
    vehicle_type: 'motorcycle',
    plate_number: 'MH14QQ4040',
    first_seen: Date.now() - 320000,
    last_seen: Date.now() - 20000,
    total_distance_km: 4.6,
    avg_speed_kmh: 55.2,
    observations_count: 4,
    camera_sequence: ['CAM03', 'CAM04', 'CAM07', 'CAM08']
  },
  {
    global_vehicle_id: 'V000155',
    vehicle_type: 'car',
    plate_number: 'MH02ZZ7788',
    first_seen: Date.now() - 280000,
    last_seen: Date.now() - 45000,
    total_distance_km: 3.3,
    avg_speed_kmh: 42.1,
    observations_count: 3,
    camera_sequence: ['CAM02', 'CAM05', 'CAM07']
  },
  {
    global_vehicle_id: 'V000160',
    vehicle_type: 'car',
    plate_number: 'GJ01BB2020',
    first_seen: Date.now() - 240000,
    last_seen: Date.now() - 30000,
    total_distance_km: 2.6,
    avg_speed_kmh: 41.0,
    observations_count: 3,
    camera_sequence: ['CAM01', 'CAM02', 'CAM05']
  }
];

export const INITIAL_TRAJECTORIES: Record<string, Trajectory> = {
  'V000123': {
    trajectory_id: 'TRJ_V000123',
    global_vehicle_id: 'V000123',
    status: 'VALID',
    validation_flags: [],
    first_seen: Date.now() - 372000,
    last_seen: Date.now() - 1000,
    camera_sequence: ['CAM01', 'CAM02', 'CAM05', 'CAM08'],
    road_sequence: ['R101', 'R102', 'R106'],
    total_distance_km: 4.8,
    total_duration_sec: 371,
    avg_speed_kmh: 46.5,
    path_summary: 'CAM01 → CAM02 → CAM05 → CAM08',
    segments: [
      {
        from_camera_id: 'CAM01',
        to_camera_id: 'CAM02',
        road_id: 'R101',
        departure_time: Date.now() - 372000,
        arrival_time: Date.now() - 277000,
        duration_sec: 95,
        distance_meters: 1200,
        speed_kmh: 45.5
      },
      {
        from_camera_id: 'CAM02',
        to_camera_id: 'CAM05',
        road_id: 'R102',
        departure_time: Date.now() - 277000,
        arrival_time: Date.now() - 152000,
        duration_sec: 125,
        distance_meters: 1400,
        speed_kmh: 40.3
      },
      {
        from_camera_id: 'CAM05',
        to_camera_id: 'CAM08',
        road_id: 'R106',
        departure_time: Date.now() - 152000,
        arrival_time: Date.now() - 1000,
        duration_sec: 151,
        distance_meters: 2200,
        speed_kmh: 52.4
      }
    ]
  },
  'V000109': {
    trajectory_id: 'TRJ_V000109',
    global_vehicle_id: 'V000109',
    status: 'VALID',
    validation_flags: [],
    first_seen: Date.now() - 410000,
    last_seen: Date.now() - 150000,
    camera_sequence: ['CAM01', 'CAM03', 'CAM04'],
    road_sequence: ['R103', 'R104'],
    total_distance_km: 3.3,
    total_duration_sec: 260,
    avg_speed_kmh: 49.2,
    path_summary: 'CAM01 → CAM03 → CAM04',
    segments: [
      {
        from_camera_id: 'CAM01',
        to_camera_id: 'CAM03',
        road_id: 'R103',
        departure_time: Date.now() - 410000,
        arrival_time: Date.now() - 295000,
        duration_sec: 115,
        distance_meters: 1500,
        speed_kmh: 47.0
      },
      {
        from_camera_id: 'CAM03',
        to_camera_id: 'CAM04',
        road_id: 'R104',
        departure_time: Date.now() - 295000,
        arrival_time: Date.now() - 150000,
        duration_sec: 145,
        distance_meters: 1800,
        speed_kmh: 44.7
      }
    ]
  }
};

export const INITIAL_TRAFFIC_METRICS: TrafficMetric[] = [
  {
    road_id: 'R101',
    road_name: 'North Arterial Blvd',
    timestamp: Date.now(),
    vehicle_count: 38,
    density_vpk: 31.7,
    avg_speed_kmh: 44.0,
    free_flow_speed_kmh: 50.0,
    flow_vph: 1394,
    travel_time_sec: 98,
    travel_time_index: 1.14,
    congestion_level: 'FREE_FLOW',
    status_color: 'emerald'
  },
  {
    road_id: 'R102',
    road_name: 'Central Metro Corridor',
    timestamp: Date.now(),
    vehicle_count: 78,
    density_vpk: 32.5,
    avg_speed_kmh: 16.5,
    free_flow_speed_kmh: 45.0,
    flow_vph: 536,
    travel_time_sec: 523,
    travel_time_index: 2.72,
    congestion_level: 'SEVERE',
    status_color: 'rose'
  },
  {
    road_id: 'R103',
    road_name: 'Tech Park Link Rd',
    timestamp: Date.now(),
    vehicle_count: 22,
    density_vpk: 12.2,
    avg_speed_kmh: 54.0,
    free_flow_speed_kmh: 60.0,
    flow_vph: 658,
    travel_time_sec: 120,
    travel_time_index: 1.11,
    congestion_level: 'FREE_FLOW',
    status_color: 'emerald'
  },
  {
    road_id: 'R104',
    road_name: 'Innovation Expressway',
    timestamp: Date.now(),
    vehicle_count: 45,
    density_vpk: 14.5,
    avg_speed_kmh: 62.0,
    free_flow_speed_kmh: 70.0,
    flow_vph: 899,
    travel_time_sec: 180,
    travel_time_index: 1.13,
    congestion_level: 'FREE_FLOW',
    status_color: 'emerald'
  },
  {
    road_id: 'R105',
    road_name: 'Riverfront Promenade',
    timestamp: Date.now(),
    vehicle_count: 26,
    density_vpk: 17.3,
    avg_speed_kmh: 36.0,
    free_flow_speed_kmh: 40.0,
    flow_vph: 622,
    travel_time_sec: 150,
    travel_time_index: 1.11,
    congestion_level: 'FREE_FLOW',
    status_color: 'emerald'
  },
  {
    road_id: 'R106',
    road_name: 'South Ring Highway',
    timestamp: Date.now(),
    vehicle_count: 52,
    density_vpk: 18.6,
    avg_speed_kmh: 48.0,
    free_flow_speed_kmh: 60.0,
    flow_vph: 892,
    travel_time_sec: 210,
    travel_time_index: 1.25,
    congestion_level: 'MODERATE',
    status_color: 'amber'
  }
];

export const INITIAL_EVENTS: AnomalyEvent[] = [
  {
    event_id: 'EVT_WW_041',
    event_type: 'WRONG_WAY_VEHICLE',
    severity: 'CRITICAL',
    camera_id: 'CAM03',
    road_id: 'R103',
    global_vehicle_id: 'V000109',
    timestamp: Date.now() - 180000,
    confidence: 0.94,
    description: 'Vehicle moving Westbound on Eastbound-only designated Tech Park Link Road',
    resolved: false
  },
  {
    event_id: 'EVT_STP_088',
    event_type: 'STOPPED_VEHICLE',
    severity: 'WARNING',
    camera_id: 'CAM02',
    road_id: 'R102',
    global_vehicle_id: 'V000115',
    timestamp: Date.now() - 420000,
    confidence: 0.89,
    description: 'Stationary vehicle detected in center lane for >4 minutes near University Circle',
    resolved: false
  },
  {
    event_id: 'EVT_CONG_102',
    event_type: 'CONGESTION_SURGE',
    severity: 'WARNING',
    camera_id: 'CAM05',
    road_id: 'R102',
    timestamp: Date.now() - 60000,
    confidence: 0.96,
    description: 'Corridor speed dropped below 18 km/h with density surging to 32.5 veh/km',
    resolved: false
  }
];

export const INITIAL_PREDICTIONS: CorridorPrediction[] = [
  {
    road_id: 'R102',
    road_name: 'Central Metro Corridor',
    current_congestion_level: 'SEVERE',
    forecasts: {
      '5min': {
        horizon_minutes: 5,
        target_timestamp: Date.now() + 300000,
        predicted_avg_speed_kmh: 15.4,
        predicted_density_vpk: 34.2,
        predicted_congestion_level: 'SEVERE',
        confidence: 0.92
      },
      '15min': {
        horizon_minutes: 15,
        target_timestamp: Date.now() + 900000,
        predicted_avg_speed_kmh: 13.2,
        predicted_density_vpk: 37.8,
        predicted_congestion_level: 'SEVERE',
        confidence: 0.86
      },
      '30min': {
        horizon_minutes: 30,
        target_timestamp: Date.now() + 1800000,
        predicted_avg_speed_kmh: 11.5,
        predicted_density_vpk: 41.5,
        predicted_congestion_level: 'SEVERE',
        confidence: 0.76
      }
    }
  },
  {
    road_id: 'R106',
    road_name: 'South Ring Highway',
    current_congestion_level: 'MODERATE',
    forecasts: {
      '5min': {
        horizon_minutes: 5,
        target_timestamp: Date.now() + 300000,
        predicted_avg_speed_kmh: 46.0,
        predicted_density_vpk: 20.1,
        predicted_congestion_level: 'MODERATE',
        confidence: 0.93
      },
      '15min': {
        horizon_minutes: 15,
        target_timestamp: Date.now() + 900000,
        predicted_avg_speed_kmh: 39.5,
        predicted_density_vpk: 23.4,
        predicted_congestion_level: 'HEAVY',
        confidence: 0.84
      },
      '30min': {
        horizon_minutes: 30,
        target_timestamp: Date.now() + 1800000,
        predicted_avg_speed_kmh: 33.0,
        predicted_density_vpk: 28.0,
        predicted_congestion_level: 'HEAVY',
        confidence: 0.74
      }
    }
  }
];

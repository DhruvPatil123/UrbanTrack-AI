import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CorridorMap } from './components/CorridorMap';
import { CCTVStreamGrid } from './components/CCTVStreamGrid';
import { VehicleSearch } from './components/VehicleSearch';
import { SpatialGraphView } from './components/SpatialGraphView';
import { TrafficAnalyticsView } from './components/TrafficAnalyticsView';
import { AlertsPredictionView } from './components/AlertsPredictionView';
import { WhatIfSimulationView } from './components/WhatIfSimulationView';
import { GNNInspectorView } from './components/GNNInspectorView';
import { ArchitectureDocsView } from './components/ArchitectureDocsView';
import { GeminiChatbotView } from './components/GeminiChatbotView';
import { PursuitModeView } from './components/PursuitModeView';
import { GreenWaveView } from './components/GreenWaveView';
import { ODMatrixView } from './components/ODMatrixView';
import { SectionSpeedEnforcementView } from './components/SectionSpeedEnforcementView';
import { VoiceDispatcherModal } from './components/VoiceDispatcherModal';

import { Camera, Road, Vehicle, Trajectory, TrafficMetric, AnomalyEvent, CorridorPrediction, VoiceIntentResult } from './types';
import { api } from './services/api';
import {
  INITIAL_CAMERAS,
  INITIAL_ROADS,
  INITIAL_VEHICLES,
  INITIAL_TRAJECTORIES,
  INITIAL_TRAFFIC_METRICS,
  INITIAL_EVENTS,
  INITIAL_PREDICTIONS
} from './data/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('map');
  const [cameras, setCameras] = useState<Camera[]>(INITIAL_CAMERAS);
  const [roads, setRoads] = useState<Road[]>(INITIAL_ROADS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(INITIAL_VEHICLES[0]);
  const [selectedTrajectory, setSelectedTrajectory] = useState<Trajectory | null>(INITIAL_TRAJECTORIES['V000123']);
  const [trafficMetrics, setTrafficMetrics] = useState<TrafficMetric[]>(INITIAL_TRAFFIC_METRICS);
  const [events, setEvents] = useState<AnomalyEvent[]>(INITIAL_EVENTS);
  const [predictions, setPredictions] = useState<CorridorPrediction[]>(INITIAL_PREDICTIONS);
  const [closedRoadId, setClosedRoadId] = useState<string | null>(null);
  const [isGreenWaveActive, setIsGreenWaveActive] = useState<boolean>(true);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  // Load telemetry data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const handleExecuteVoiceIntent = (intent: VoiceIntentResult) => {
    if (intent.intent === 'TRACK_VEHICLE' && intent.target) {
      const found = vehicles.find((v) => v.plate_number.toUpperCase().includes(intent.target!.toUpperCase()));
      if (found) {
        handleSelectVehicle(found);
      }
      setActiveTab('vehicles');
    } else if (intent.intent === 'SIMULATE_CLOSURE') {
      setClosedRoadId('R102');
      setActiveTab('simulation');
    } else if (intent.navigate_to) {
      setActiveTab(intent.navigate_to);
    }
  };

  const loadAllData = async () => {
    try {
      const [cams, rds, vehs, metrics, evts, preds] = await Promise.all([
        api.getCameras(),
        api.getRoads(),
        api.getVehicles(),
        api.getTrafficMetrics(),
        api.getEvents(),
        api.getPredictions()
      ]);
      setCameras(cams);
      setRoads(rds);
      setVehicles(vehs);
      setTrafficMetrics(metrics);
      setEvents(evts);
      setPredictions(preds);
    } catch {
      // Fallback data already loaded
    }
  };

  const handleSelectVehicle = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    try {
      const traj = await api.getTrajectory(vehicle.global_vehicle_id);
      setSelectedTrajectory(traj);
    } catch {
      setSelectedTrajectory(INITIAL_TRAJECTORIES[vehicle.global_vehicle_id] || INITIAL_TRAJECTORIES['V000123']);
    }
  };

  const handleScenarioChange = (scenario: string) => {
    if (scenario === 'standard') {
      setClosedRoadId(null);
      setSelectedVehicle(null);
      setSelectedTrajectory(null);
      setActiveTab('map');
    } else if (scenario === 'pursuit') {
      const v = INITIAL_VEHICLES[0];
      setSelectedVehicle(v);
      setSelectedTrajectory(INITIAL_TRAJECTORIES['V000123']);
      setClosedRoadId(null);
      setActiveTab('pursuit');
    } else if (scenario === 'closure') {
      setClosedRoadId('R102');
      setActiveTab('simulation');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Operations Navbar */}
      <Navbar
        activeTab={activeTab}
        onScenarioChange={handleScenarioChange}
        onOpenCopilot={() => setActiveTab('chat')}
        onOpenVoice={() => setIsVoiceModalOpen(true)}
        onRefresh={loadAllData}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          alertCount={events.filter((e) => !e.resolved).length}
        />

        {/* Main Operational View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950">
          {activeTab === 'map' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold font-mono text-slate-200">
                    URBAN CORRIDOR MULTI-CAMERA SITUATION MAP
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Live camera fields, road link congestion states, and moving target telemetry.
                  </p>
                </div>
                {selectedVehicle && (
                  <button
                    onClick={() => {
                      setSelectedVehicle(null);
                      setSelectedTrajectory(null);
                    }}
                    className="text-xs font-mono text-slate-400 hover:text-slate-200 underline"
                  >
                    Clear Target Vehicle Highlight
                  </button>
                )}
              </div>

              <CorridorMap
                cameras={cameras}
                roads={roads}
                selectedVehicle={selectedVehicle}
                trajectory={selectedTrajectory}
                closedRoadId={closedRoadId}
                isPursuitMode={selectedVehicle?.global_vehicle_id === 'V000123'}
                isGreenWaveMode={isGreenWaveActive}
                onSelectCamera={(cam) => {
                  setActiveTab('streams');
                }}
              />
            </div>
          )}

          {activeTab === 'streams' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold font-mono text-slate-200">
                  REAL-TIME CCTV VISION & FEATURE EXTRACTION GRID
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Live vehicle detection, ByteTrack tracking, ANPR OCR reading, and 512-d Re-ID hashes.
                </p>
              </div>

              <CCTVStreamGrid cameras={cameras} />
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold font-mono text-slate-200">
                  VEHICLE INTELLIGENCE & JOURNEY RECONSTRUCTION
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Search by license plate or global ID to view multi-hop camera trajectory and speed metrics.
                </p>
              </div>

              <VehicleSearch
                vehicles={vehicles}
                selectedVehicle={selectedVehicle}
                trajectory={selectedTrajectory}
                onSelectVehicle={handleSelectVehicle}
                onShowOnMap={() => setActiveTab('map')}
              />
            </div>
          )}

          {activeTab === 'enforcement' && (
            <div className="space-y-4">
              <SectionSpeedEnforcementView onShowOnMap={() => setActiveTab('map')} />
            </div>
          )}

          {activeTab === 'pursuit' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold font-mono text-rose-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
                  AUTOMATED INTERCEPT & RED NOTICE PURSUIT HEADQUARTERS
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Downstream intercept predictions, virtual geofence cordon alarms, and official police forensic dossiers.
                </p>
              </div>

              <PursuitModeView
                onShowOnMap={() => setActiveTab('map')}
                selectedVehicle={selectedVehicle}
                trajectory={selectedTrajectory}
              />
            </div>
          )}

          {activeTab === 'greenwave' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold font-mono text-emerald-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  EMERGENCY VEHICLE "GREEN WAVE" PREEMPTION & TRAUMA TRANSIT
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Optical beacon/siren acoustic AI detection, 30s advance signal preemption chain, and Google Maps Grounded trauma tracking.
                </p>
              </div>

              <GreenWaveView
                onShowOnMap={() => {
                  setIsGreenWaveActive(true);
                  setActiveTab('map');
                }}
              />
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold font-mono text-slate-200">
                  GEMINI MULTI-TURN TRAFFIC INTELLIGENCE COPILOT
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Multi-turn conversation thread, role-based system instruction, Google Maps & Search grounding tools.
                </p>
              </div>

              <GeminiChatbotView
                onHighlightVehicle={(vid) => {
                  const v = vehicles.find((x) => x.global_vehicle_id === vid);
                  if (v) handleSelectVehicle(v);
                  setActiveTab('map');
                }}
                onSimulateRoad={(rid) => {
                  setClosedRoadId(rid);
                  setActiveTab('simulation');
                }}
              />
            </div>
          )}

          {activeTab === 'graph' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold font-mono text-slate-200">
                  SPATIAL-TEMPORAL KNOWLEDGE GRAPH
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Interactive node-link representation of Vehicles, Observations, Cameras, and Road corridors.
                </p>
              </div>

              <SpatialGraphView />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold font-mono text-slate-200">
                  CITY TRAFFIC ANALYTICS & SPEED-FLOW METRICS
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Segment-level speed, density (veh/km), flow rate (veh/h), and travel time index.
                </p>
              </div>

              <TrafficAnalyticsView metrics={trafficMetrics} />
            </div>
          )}

          {activeTab === 'odmatrix' && (
            <div className="space-y-4">
              <ODMatrixView onShowOnMap={() => setActiveTab('map')} />
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold font-mono text-slate-200">
                  ABNORMAL TRAFFIC EVENTS & CONGESTION FORECASTS
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Automated wrong-way/stopped vehicle alerts and 5m/15m/30m predictive bottleneck forecasts.
                </p>
              </div>

              <AlertsPredictionView events={events} predictions={predictions} />
            </div>
          )}

          {activeTab === 'simulation' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold font-mono text-slate-200">
                  WHAT-IF ROAD CLOSURE & DETOUR SIMULATION
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Simulate emergency road closures, recalculate network routing costs, and project traffic spillover.
                </p>
              </div>

              <WhatIfSimulationView
                roads={roads}
                onApplyClosureToMap={(roadId) => {
                  setClosedRoadId(roadId);
                  setActiveTab('map');
                }}
              />
            </div>
          )}

          {activeTab === 'gnn' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold font-mono text-slate-200">
                  GNN MULTI-CAMERA ASSOCIATION MODEL DIAGNOSTIC
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Evaluate edge classification probabilities and multi-signal feature contributions.
                </p>
              </div>

              <GNNInspectorView />
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold font-mono text-slate-200">
                  SYSTEM ARCHITECTURE & SIH SPECIFICATION
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Project documentation, research grounding, pipeline design, and physical limitations.
                </p>
              </div>

              <ArchitectureDocsView />
            </div>
          )}
        </main>
      </div>

      {/* Gemini Live Voice Dispatcher & Incident Audio Modal */}
      <VoiceDispatcherModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onExecuteIntent={handleExecuteVoiceIntent}
      />
    </div>
  );
}

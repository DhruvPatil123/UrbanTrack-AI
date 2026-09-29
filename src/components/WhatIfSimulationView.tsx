import React, { useState } from 'react';
import { SimulationResult, Road } from '../types';
import { api } from '../services/api';
import { GitFork, AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck, Clock, Navigation } from 'lucide-react';

interface WhatIfSimulationViewProps {
  roads: Road[];
  onApplyClosureToMap?: (roadId: string | null) => void;
}

export const WhatIfSimulationView: React.FC<WhatIfSimulationViewProps> = ({
  roads,
  onApplyClosureToMap
}) => {
  const [selectedRoadId, setSelectedRoadId] = useState<string>('R102');
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isAppliedToMap, setIsAppliedToMap] = useState<boolean>(false);

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.simulateRoadClosure(selectedRoadId);
      setSimulationResult(res);
      setIsAppliedToMap(false);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMapOverlay = () => {
    if (isAppliedToMap) {
      setIsAppliedToMap(false);
      onApplyClosureToMap?.(null);
    } else {
      setIsAppliedToMap(true);
      onApplyClosureToMap?.(selectedRoadId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Setup Control Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs font-mono text-slate-300">
          <GitFork className="w-4 h-4 text-rose-400" />
          <span className="font-bold uppercase tracking-wider">
            What-If Road Closure & Dynamic Detour Simulation Engine
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              Select Road Segment to Simulate Closure:
            </label>
            <select
              value={selectedRoadId}
              onChange={(e) => setSelectedRoadId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
            >
              {roads.map((r) => (
                <option key={r.road_id} value={r.road_id}>
                  {r.road_id} — {r.name} ({r.speed_limit_kmh} km/h, {r.lanes} lanes)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={loading}
            className="mt-5 bg-rose-600 hover:bg-rose-500 text-slate-950 font-mono font-bold text-xs px-5 py-2.5 rounded transition shadow-lg shadow-rose-950/40 disabled:opacity-50"
          >
            {loading ? 'Recalculating Paths...' : 'Execute What-If Simulation'}
          </button>
        </div>

        <p className="text-[11px] font-mono text-slate-400 italic">
          *Decision-support module: prunes graph edges, recalculates Dijkstra shortest routes, and projects volume redistribution.
        </p>
      </div>

      {/* Simulation Results Comparison */}
      {simulationResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Baseline Route Card */}
            <div className="bg-slate-950 border border-slate-800 rounded p-5 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-slate-200 uppercase">Baseline Route (Corridor Open)</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                  STANDARD
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Path Sequence:</span>
                  <span className="text-slate-200 font-bold">{simulationResult.baseline.route_path.join(' → ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transit Distance:</span>
                  <span className="text-slate-200">{simulationResult.baseline.distance_km} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Expected Travel Time:</span>
                  <span className="text-emerald-400 font-bold">{simulationResult.baseline.travel_time_minutes} mins</span>
                </div>
              </div>
            </div>

            {/* Simulated Detour Route Card */}
            <div className="bg-slate-950 border border-rose-900/60 rounded p-5 space-y-4 font-mono text-xs shadow-lg shadow-rose-950/20">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-rose-300 uppercase">Simulated Detour ({simulationResult.closed_road_id} Closed)</span>
                <span className="text-[10px] bg-rose-950 text-rose-400 px-2 py-0.5 rounded border border-rose-800">
                  +{simulationResult.simulated.travel_time_delay_percentage.toFixed(1)}% DELAY
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Recommended Detour:</span>
                  <span className="text-cyan-300 font-bold">
                    {simulationResult.simulated.recommended_detour_path.join(' → ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Detour Distance:</span>
                  <span className="text-slate-200">{simulationResult.simulated.distance_km} km (+1.3 km)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Projected Travel Time:</span>
                  <span className="text-rose-400 font-bold">{simulationResult.simulated.travel_time_minutes} mins</span>
                </div>
              </div>
            </div>
          </div>

          {/* Spillover Impact on Alternate Roads */}
          <div className="bg-slate-900/90 border border-slate-800 rounded p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-bold text-slate-200 uppercase">
                Secondary Spillover Congestion Redistribution
              </span>
              <button
                onClick={handleToggleMapOverlay}
                className={`text-xs font-mono px-3 py-1 rounded transition border ${
                  isAppliedToMap
                    ? 'bg-rose-950 text-rose-300 border-rose-700'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                {isAppliedToMap ? 'Closure Shown on Map (Click to Revert)' : 'Project Closure on Live City Map'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {simulationResult.spillover_impact.map((sp, idx) => (
                <div key={idx} className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                  <span className="font-bold text-cyan-400 block">{sp.road_id}</span>
                  <div className="text-[11px] text-slate-400">
                    Added Volume: <strong className="text-slate-200">+{sp.added_volume_vph} veh/h</strong>
                  </div>
                  <div className="text-[10px] text-amber-400">
                    Shift: {sp.congestion_shift}
                  </div>
                </div>
              ))}
            </div>

            {/* Decision Recommendation Banner */}
            <div className="p-4 rounded bg-cyan-950/40 border border-cyan-800 text-slate-300 text-xs flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-cyan-200 block mb-0.5">Automated Traffic Authority Recommendation:</strong>
                <span>{simulationResult.decision_recommendation}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

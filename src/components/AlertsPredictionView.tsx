import React, { useState } from 'react';
import { AnomalyEvent, CorridorPrediction } from '../types';
import { AlertOctagon, TrendingDown, Clock, ShieldAlert, ArrowRight, CheckCircle, Bell } from 'lucide-react';

interface AlertsPredictionViewProps {
  events: AnomalyEvent[];
  predictions: CorridorPrediction[];
}

export const AlertsPredictionView: React.FC<AlertsPredictionViewProps> = ({ events, predictions }) => {
  const [resolvedEvents, setResolvedEvents] = useState<string[]>([]);

  const handleResolve = (eventId: string) => {
    setResolvedEvents((prev) => [...prev, eventId]);
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Active Anomaly Alerts */}
      <div className="bg-slate-900/90 border border-slate-800 rounded p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span className="font-bold uppercase tracking-wider">Real-Time Abnormal Event Alerts</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Active: <strong className="text-rose-400">{events.filter(e => !resolvedEvents.includes(e.event_id)).length} Critical/Warning</strong>
          </span>
        </div>

        <div className="space-y-3">
          {events.map((evt) => {
            const isResolved = resolvedEvents.includes(evt.event_id);
            const isCritical = evt.severity === 'CRITICAL';

            return (
              <div
                key={evt.event_id}
                className={`p-4 rounded border font-mono text-xs transition-all ${
                  isResolved
                    ? 'bg-slate-950/40 border-slate-900 opacity-50'
                    : isCritical
                    ? 'bg-rose-950/30 border-rose-800/80 shadow-lg shadow-rose-950/30'
                    : 'bg-amber-950/30 border-amber-800/80 shadow-lg shadow-amber-950/20'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        isCritical
                          ? 'bg-rose-950 text-rose-300 border-rose-700'
                          : 'bg-amber-950 text-amber-300 border-amber-700'
                      }`}
                    >
                      {evt.severity}
                    </span>
                    <span className="font-bold text-slate-100">{evt.event_type}</span>
                    <span className="text-slate-400">at {evt.camera_id} ({evt.road_id})</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-cyan-400">Confidence: {(evt.confidence * 100).toFixed(0)}%</span>
                    {!isResolved ? (
                      <button
                        onClick={() => handleResolve(evt.event_id)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded text-[11px] font-mono transition flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        Dispatch / Resolve
                      </button>
                    ) : (
                      <span className="text-emerald-400 text-[11px] font-mono flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Resolved
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-slate-300 text-xs font-sans mb-2">{evt.description}</p>

                {evt.global_vehicle_id && (
                  <div className="text-[11px] text-cyan-300 font-mono">
                    Associated Global ID: <strong>{evt.global_vehicle_id}</strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Spatio-Temporal Congestion Forecasting */}
      <div className="bg-slate-900/90 border border-slate-800 rounded p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <TrendingDown className="w-4 h-4 text-cyan-400" />
            <span className="font-bold uppercase tracking-wider">
              Spatio-Temporal Congestion Horizon Forecasting (5m / 15m / 30m)
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">Graph Diffusion Model: v1.4-stgnn</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {predictions.map((p) => (
            <div key={p.road_id} className="bg-slate-950 p-4 rounded border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-slate-100">{p.road_id}</span>
                  <p className="text-slate-400 text-[11px]">{p.road_name}</p>
                </div>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                  Current: {p.current_congestion_level}
                </span>
              </div>

              {/* 3 Horizon Forecast Cards */}
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(p.forecasts).map(([hKey, f]) => {
                  const isSevere = f.predicted_congestion_level === 'SEVERE';
                  const isHeavy = f.predicted_congestion_level === 'HEAVY';

                  return (
                    <div
                      key={hKey}
                      className={`p-2.5 rounded border text-center space-y-1 ${
                        isSevere
                          ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                          : isHeavy
                          ? 'bg-amber-950/40 border-amber-800/80 text-amber-300'
                          : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                      }`}
                    >
                      <span className="text-[10px] font-bold block opacity-75">{f.horizon_minutes} MIN FORWARD</span>
                      <div className="text-sm font-bold">{f.predicted_avg_speed_kmh} km/h</div>
                      <div className="text-[9px] uppercase font-bold">{f.predicted_congestion_level}</div>
                      <div className="text-[9px] text-slate-400 opacity-90">Conf: {(f.confidence * 100).toFixed(0)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

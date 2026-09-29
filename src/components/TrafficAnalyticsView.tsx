import React, { useState } from 'react';
import { TrafficMetric } from '../types';
import { BarChart3, TrendingUp, Gauge, Activity, Clock } from 'lucide-react';

interface TrafficAnalyticsViewProps {
  metrics: TrafficMetric[];
}

export const TrafficAnalyticsView: React.FC<TrafficAnalyticsViewProps> = ({ metrics }) => {
  const [selectedRoad, setSelectedRoad] = useState<string>('R102');

  // Synthetic 24-hour volume trend for selected corridor
  const hourlyTrend = [
    { hour: '00:00', vol: 180 }, { hour: '02:00', vol: 110 }, { hour: '04:00', vol: 95 },
    { hour: '06:00', vol: 450 }, { hour: '08:00', vol: 1820 }, { hour: '10:00', vol: 1450 },
    { hour: '12:00', vol: 1200 }, { hour: '14:00', vol: 1380 }, { hour: '16:00', vol: 1650 },
    { hour: '18:00', vol: 2150 }, { hour: '20:00', vol: 1720 }, { hour: '22:00', vol: 890 }
  ];

  const maxVol = Math.max(...hourlyTrend.map((d) => d.vol));

  return (
    <div className="space-y-6">
      {/* Top Corridor Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m) => {
          const isSelected = selectedRoad === m.road_id;
          const isSevere = m.congestion_level === 'SEVERE';
          const isModerate = m.congestion_level === 'MODERATE';

          return (
            <div
              key={m.road_id}
              onClick={() => setSelectedRoad(m.road_id)}
              className={`p-4 rounded border font-mono cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950/40'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-100">{m.road_id}</span>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                    isSevere
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : isModerate
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  }`}
                >
                  {m.congestion_level}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mb-3 truncate">{m.road_name}</p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">AVG SPEED</span>
                  <span className={`font-bold ${isSevere ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {m.avg_speed_kmh} km/h
                  </span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">DENSITY</span>
                  <span className="font-bold text-slate-200">{m.density_vpk} vpk</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">EST. FLOW</span>
                  <span className="font-bold text-cyan-300">{m.flow_vph} veh/h</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">TRAVEL TIME INDEX</span>
                  <span className={`font-bold ${m.travel_time_index > 1.8 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {m.travel_time_index}x
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hourly Flow Chart Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="font-bold uppercase tracking-wider">
              24-Hour Traffic Volume Distribution ({selectedRoad})
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Peak Window: <strong className="text-rose-400">18:00 - 19:30 (2,150 veh/h)</strong>
          </span>
        </div>

        {/* CSS/SVG Bar Chart */}
        <div className="pt-4 pb-2">
          <div className="h-48 flex items-end gap-3 px-2">
            {hourlyTrend.map((d, i) => {
              const heightPct = (d.vol / maxVol) * 100;
              const isPeak = d.vol > 1800;

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div
                    className={`w-full rounded-t transition-all duration-300 relative group-hover:opacity-90 ${
                      isPeak ? 'bg-rose-500' : 'bg-cyan-500/80'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  >
                    {/* Hover Tooltip */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-950 text-slate-200 text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-800 opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
                      {d.vol} vph
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{d.hour}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Aggregated Intelligence Notes */}
        <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Bottleneck Probability Index: <strong className="text-rose-400">0.88 (High Risk on R102)</strong></span>
          </div>
          <span>Signal Plan: Adaptive Transmit Phase Active</span>
        </div>
      </div>
    </div>
  );
};

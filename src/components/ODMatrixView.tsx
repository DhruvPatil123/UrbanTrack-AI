import React, { useState, useEffect } from 'react';
import {
  ODMatrixResponse,
  SankeyResponse,
  ODMatrixCell,
  CityZone
} from '../types';
import { api } from '../services/api';
import {
  GitMerge,
  BarChart3,
  TrendingUp,
  Download,
  Clock,
  Car,
  Bus,
  Layers,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Info,
  CheckCircle2,
  RefreshCw,
  Compass
} from 'lucide-react';

interface ODMatrixViewProps {
  onShowOnMap: () => void;
}

export const ODMatrixView: React.FC<ODMatrixViewProps> = ({ onShowOnMap }) => {
  const [timePeriod, setTimePeriod] = useState<string>('MORNING_PEAK');
  const [odData, setODData] = useState<ODMatrixResponse | null>(null);
  const [sankeyData, setSankeyData] = useState<SankeyResponse | null>(null);
  const [selectedCell, setSelectedCell] = useState<{
    origin: CityZone;
    dest: CityZone;
    cell: ODMatrixCell;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'sankey'>('matrix');
  const [hoveredLink, setHoveredLink] = useState<any | null>(null);

  useEffect(() => {
    loadData(timePeriod);
  }, [timePeriod]);

  const loadData = async (period: string) => {
    try {
      const [matrix, sankey] = await Promise.all([
        api.getODMatrix(period),
        api.getSankeyFlow(period)
      ]);
      setODData(matrix);
      setSankeyData(sankey);
      if (matrix.matrix.length > 0 && matrix.matrix[0].cells.length > 2) {
        setSelectedCell({
          origin: matrix.zones[0],
          dest: matrix.zones[2],
          cell: matrix.matrix[0].cells[2]
        });
      }
    } catch {
      // Fallback in api.ts
    }
  };

  const getHeatmapColor = (vol: number) => {
    if (vol > 1600) return 'bg-rose-950 text-rose-200 border-rose-600 font-bold';
    if (vol > 1100) return 'bg-orange-950 text-orange-200 border-orange-600 font-semibold';
    if (vol > 600) return 'bg-amber-950/80 text-amber-200 border-amber-700';
    if (vol > 250) return 'bg-emerald-950/70 text-emerald-200 border-emerald-800';
    return 'bg-slate-950/80 text-slate-400 border-slate-800';
  };

  const handleExportCSV = () => {
    if (!odData) return;
    const header = ['Origin', ...odData.zones.map((z) => z.name), 'Total Departures'].join(',');
    const rows = odData.matrix.map((r) => {
      const vals = r.cells.map((c) => c.volume_veh_hr);
      return [r.origin_zone.name, ...vals, r.total_departures].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `URBANTRACK_OD_MATRIX_${timePeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!odData || !sankeyData) return null;

  return (
    <div className="space-y-6 select-none font-mono text-xs">
      {/* 1. Header & Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-cyan-950 border border-cyan-700 flex items-center justify-center">
            <Compass className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              City-Scale Origin-Destination (O-D) Matrix & Commuter Flows
            </h3>
            <p className="text-[11px] text-slate-400">
              Aggregated trip distribution across 5 metropolitan traffic analysis zones (TAZ)
            </p>
          </div>
        </div>

        {/* Filters and View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time period switcher */}
          <div className="bg-slate-950 p-1 rounded border border-slate-800 flex gap-1">
            {[
              { id: 'MORNING_PEAK', label: 'Morning Peak (08:00 - 10:30)' },
              { id: 'EVENING_PEAK', label: 'Evening Peak (17:30 - 20:00)' },
              { id: 'OFF_PEAK', label: 'Off-Peak Flow' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setTimePeriod(p.id)}
                className={`px-2.5 py-1 rounded text-[11px] transition ${
                  timePeriod === p.id
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Sub-tab view toggle */}
          <div className="bg-slate-950 p-1 rounded border border-slate-800 flex gap-1">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1 rounded text-[11px] flex items-center gap-1.5 transition ${
                activeTab === 'matrix'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>O-D Matrix Table</span>
            </button>
            <button
              onClick={() => setActiveTab('sankey')}
              className={`px-3 py-1 rounded text-[11px] flex items-center gap-1.5 transition ${
                activeTab === 'sankey'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>Commuter Sankey Flow</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded transition flex items-center gap-1.5 font-bold"
            title="Export CSV for Urban Transport Modelling"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Dominant Bottleneck & Urban Planning Advisory Banner */}
      <div className="bg-gradient-to-r from-rose-950/60 via-slate-950 to-cyan-950/60 border border-rose-800/80 rounded p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
          <div>
            <span className="text-xs font-bold text-rose-200 block uppercase">
              Dominant Congestion Axis: {odData.dominant_corridor.origin} → {odData.dominant_corridor.destination}
            </span>
            <p className="text-[11px] text-slate-300">
              Peak Volume: <strong className="text-rose-400">{odData.dominant_corridor.hourly_volume} veh/hr</strong> ({odData.dominant_corridor.design_capacity_pct}% of road design capacity)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded text-[11px] text-slate-300">
            <span className="text-emerald-400 font-bold">Planner Recommendation: </span>
            {odData.dominant_corridor.recommendation}
          </div>
        </div>
      </div>

      {/* 3. Main Display: O-D Matrix Grid or Commuter Sankey */}
      {activeTab === 'matrix' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: 5x5 Matrix Table */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-bold text-slate-200 uppercase tracking-wider">
                5x5 Traffic Analysis Zone (TAZ) Origin-Destination Grid (Vehicles / Hour)
              </span>
              <span className="text-[11px] text-slate-400">
                Click any cell to inspect modal split & delay
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                    <th className="p-2 text-left font-bold">Origin \ Destination</th>
                    {odData.zones.map((z) => (
                      <th key={z.zone_id} className="p-2 font-bold" style={{ color: z.color }}>
                        {z.name.split('&')[0]}
                      </th>
                    ))}
                    <th className="p-2 text-right font-bold text-slate-300">Total Outflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {odData.matrix.map((row, i) => (
                    <tr key={row.origin_zone.zone_id} className="hover:bg-slate-800/30">
                      <td
                        className="p-2.5 text-left font-bold text-[11px] whitespace-nowrap"
                        style={{ color: row.origin_zone.color }}
                      >
                        {row.origin_zone.name.split('&')[0]}
                      </td>
                      {row.cells.map((cell, j) => {
                        const isSelected =
                          selectedCell?.cell.origin_id === cell.origin_id &&
                          selectedCell?.cell.destination_id === cell.destination_id;
                        return (
                          <td key={j} className="p-1.5">
                            <button
                              onClick={() =>
                                setSelectedCell({
                                  origin: row.origin_zone,
                                  dest: odData.zones[j],
                                  cell
                                })
                              }
                              className={`w-full py-2 px-1 rounded border transition text-[11px] ${getHeatmapColor(
                                cell.volume_veh_hr
                              )} ${isSelected ? 'ring-2 ring-cyan-400 shadow-md scale-105' : ''}`}
                            >
                              <span className="block">{cell.volume_veh_hr}</span>
                              <span className="text-[9px] opacity-70 block">{cell.avg_travel_time_min}m</span>
                            </button>
                          </td>
                        );
                      })}
                      <td className="p-2.5 text-right font-bold text-cyan-300">
                        {row.total_departures}
                      </td>
                    </tr>
                  ))}
                  {/* Summary Bottom Row: Inflows */}
                  <tr className="bg-slate-950 font-bold border-t-2 border-slate-700 text-[11px]">
                    <td className="p-2.5 text-left text-slate-300">Total Inflow</td>
                    {odData.destinations_total.map((tot, idx) => (
                      <td key={idx} className="p-2 text-cyan-400">
                        {tot}
                      </td>
                    ))}
                    <td className="p-2 text-right text-emerald-400">
                      {odData.total_trips_sampled} veh/h
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Heatmap Legend */}
            <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span>Volume Legend:</span>
                <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                  &lt; 250 (Light)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-300">
                  250 - 600 (Moderate)
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700 text-amber-300">
                  600 - 1100 (Dense)
                </span>
                <span className="px-2 py-0.5 rounded bg-orange-950 border border-orange-600 text-orange-200">
                  1100 - 1600 (Heavy)
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-600 text-rose-200 font-bold">
                  &gt; 1600 (Saturated)
                </span>
              </div>
              <span>Total Corridor Trips Sampled: {odData.total_trips_sampled.toLocaleString()}</span>
            </div>
          </div>

          {/* Right Col: Selected Corridor Deep-Dive */}
          <div className="bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-bold text-slate-200 uppercase">Selected O-D Pair Diagnostics</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
                LIVE TRAJECTORY
              </span>
            </div>

            {selectedCell ? (
              <div className="space-y-4">
                <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">ORIGIN TAZ</span>
                      <strong style={{ color: selectedCell.origin.color }}>
                        {selectedCell.origin.name}
                      </strong>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">DESTINATION TAZ</span>
                      <strong style={{ color: selectedCell.dest.color }}>
                        {selectedCell.dest.name}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">HOURLY VOLUME</span>
                    <span className="text-lg font-bold text-cyan-300">
                      {selectedCell.cell.volume_veh_hr} veh/hr
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {((selectedCell.cell.volume_veh_hr / odData.total_trips_sampled) * 100).toFixed(1)}% of city total
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">MEAN TRANSIT TIME</span>
                    <span className="text-lg font-bold text-amber-300">
                      {selectedCell.cell.avg_travel_time_min} mins
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Level: <strong className="text-rose-400">{selectedCell.cell.congestion_level}</strong>
                    </span>
                  </div>
                </div>

                {/* Modal Split Breakdown */}
                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 block uppercase">
                    Vehicle Class / Modal Split Distribution
                  </span>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-cyan-400" /> Private Passenger Cars:
                      </span>
                      <strong>{selectedCell.cell.transit_mode_split.cars} (52%)</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Two-Wheelers / Mopeds:
                      </span>
                      <strong>{selectedCell.cell.transit_mode_split.two_wheelers} (34%)</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Bus className="w-3.5 h-3.5 text-emerald-400" /> City Buses & Paratransit:
                      </span>
                      <strong>{selectedCell.cell.transit_mode_split.buses_and_paratransit} (14%)</strong>
                    </div>
                  </div>
                </div>

                {/* Corridor Action Button */}
                <button
                  onClick={onShowOnMap}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 py-2 rounded font-bold transition flex items-center justify-center gap-2"
                >
                  <Layers className="w-4 h-4" />
                  <span>Inspect Trajectory on City Map</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500">
                Click any cell in the 5x5 grid to inspect its travel metrics
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Sankey Commuter Flow Visualization */
        <div className="bg-slate-900 border border-slate-800 rounded p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="font-bold text-slate-200 uppercase tracking-wider block">
                Commuter Influx vs. Egress Sankey Flow Diagram
              </span>
              <p className="text-[11px] text-slate-400">
                Visualizing corridor bifurcation from Inbound Entry Points → Arterial Hubs → Egress Employment Centers
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase">TOTAL COMMUTER INFLUX</span>
              <span className="text-base font-bold text-emerald-400">{sankeyData.total_influx_vph.toLocaleString()} veh/hr</span>
            </div>
          </div>

          {/* Custom Interactive SVG Sankey Diagram */}
          <div className="relative bg-slate-950 border border-slate-800 rounded-lg p-6 overflow-hidden">
            <svg viewBox="0 0 900 420" className="w-full h-auto">
              <defs>
                <linearGradient id="grad-north-univ" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="grad-north-metro" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="grad-south-metro" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="grad-univ-tech" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="grad-metro-tech" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="grad-metro-south" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity="0.7" />
                </linearGradient>
              </defs>

              {/* Stage Column Labels */}
              <text x="80" y="25" fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">
                STAGE 0: SUBURBAN INFLOW
              </text>
              <text x="450" y="25" fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">
                STAGE 1: ARTERIAL DISTRIBUTION
              </text>
              <text x="820" y="25" fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">
                STAGE 2: TERMINAL EGRESS
              </text>

              {/* Flow Ribbons (Bezier Curves) */}
              <g>
                {/* IN_NORTH -> ART_UNIV_CIRCLE */}
                <path
                  d="M 140 70 C 270 70, 270 120, 390 120"
                  fill="none"
                  stroke="url(#grad-north-univ)"
                  strokeWidth="38"
                  strokeLinecap="round"
                  className="hover:stroke-cyan-300 cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredLink({ label: 'North Suburb → University Circle', val: '2,800 veh/hr (66.7%)' })}
                  onMouseLeave={() => setHoveredLink(null)}
                />
                {/* IN_NORTH -> ART_METRO_CORRIDOR */}
                <path
                  d="M 140 100 C 270 100, 270 290, 390 290"
                  fill="none"
                  stroke="url(#grad-north-metro)"
                  strokeWidth="20"
                  strokeLinecap="round"
                  className="hover:stroke-cyan-300 cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredLink({ label: 'North Suburb → Metro Corridor Spine', val: '1,400 veh/hr (33.3%)' })}
                  onMouseLeave={() => setHoveredLink(null)}
                />

                {/* IN_SOUTH -> ART_METRO_CORRIDOR */}
                <path
                  d="M 140 230 C 270 230, 270 310, 390 310"
                  fill="none"
                  stroke="url(#grad-south-metro)"
                  strokeWidth="28"
                  strokeLinecap="round"
                  className="hover:stroke-rose-300 cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredLink({ label: 'South Bypass → Metro Corridor Spine', val: '1,900 veh/hr (73.1%)' })}
                  onMouseLeave={() => setHoveredLink(null)}
                />

                {/* IN_EAST -> ART_UNIV_CIRCLE */}
                <path
                  d="M 140 350 C 270 350, 270 160, 390 160"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="18"
                  strokeOpacity="0.6"
                  strokeLinecap="round"
                  className="hover:stroke-amber-300 cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredLink({ label: 'Eastern Feeder → University Circle', val: '1,100 veh/hr (61.1%)' })}
                  onMouseLeave={() => setHoveredLink(null)}
                />

                {/* ART_UNIV_CIRCLE -> OUT_TECH_PARK */}
                <path
                  d="M 510 130 C 640 130, 640 90, 750 90"
                  fill="none"
                  stroke="url(#grad-univ-tech)"
                  strokeWidth="36"
                  strokeLinecap="round"
                  className="hover:stroke-emerald-300 cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredLink({ label: 'University Circle → Tech Park IT Zone', val: '2,600 veh/hr (56.5%)' })}
                  onMouseLeave={() => setHoveredLink(null)}
                />

                {/* ART_UNIV_CIRCLE -> OUT_OLD_CITY */}
                <path
                  d="M 510 160 C 640 160, 640 220, 750 220"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="20"
                  strokeOpacity="0.6"
                  strokeLinecap="round"
                  className="hover:stroke-purple-300 cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredLink({ label: 'University Circle → Central Old City', val: '1,400 veh/hr (30.4%)' })}
                  onMouseLeave={() => setHoveredLink(null)}
                />

                {/* ART_METRO_CORRIDOR -> OUT_TECH_PARK */}
                <path
                  d="M 510 290 C 640 290, 640 120, 750 120"
                  fill="none"
                  stroke="url(#grad-metro-tech)"
                  strokeWidth="22"
                  strokeLinecap="round"
                  className="hover:stroke-emerald-300 cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredLink({ label: 'Metro Corridor Spine → Tech Park IT Zone', val: '1,500 veh/hr (37.5%)' })}
                  onMouseLeave={() => setHoveredLink(null)}
                />

                {/* ART_METRO_CORRIDOR -> OUT_SOUTH_EXPRESS */}
                <path
                  d="M 510 330 C 640 330, 640 340, 750 340"
                  fill="none"
                  stroke="url(#grad-metro-south)"
                  strokeWidth="24"
                  strokeLinecap="round"
                  className="hover:stroke-rose-300 cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredLink({ label: 'Metro Corridor Spine → South Expressway Egress', val: '1,600 veh/hr (40.0%)' })}
                  onMouseLeave={() => setHoveredLink(null)}
                />
              </g>

              {/* Stage 0 Node Rectangles (Left) */}
              <g>
                <rect x="30" y="55" width="110" height="60" rx="4" fill="#020617" stroke="#38bdf8" strokeWidth="2" />
                <text x="85" y="80" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">NORTH INFLOW</text>
                <text x="85" y="98" fill="#e2e8f0" fontSize="9" textAnchor="middle">4,200 veh/hr</text>

                <rect x="30" y="195" width="110" height="55" rx="4" fill="#020617" stroke="#f43f5e" strokeWidth="2" />
                <text x="85" y="220" fill="#f43f5e" fontSize="10" fontWeight="bold" textAnchor="middle">SOUTH INFLOW</text>
                <text x="85" y="238" fill="#e2e8f0" fontSize="9" textAnchor="middle">2,600 veh/hr</text>

                <rect x="30" y="325" width="110" height="50" rx="4" fill="#020617" stroke="#f59e0b" strokeWidth="2" />
                <text x="85" y="348" fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle">EAST FEEDER</text>
                <text x="85" y="364" fill="#e2e8f0" fontSize="9" textAnchor="middle">1,800 veh/hr</text>
              </g>

              {/* Stage 1 Node Rectangles (Middle) */}
              <g>
                <rect x="390" y="100" width="120" height="80" rx="4" fill="#020617" stroke="#a855f7" strokeWidth="2" />
                <text x="450" y="130" fill="#a855f7" fontSize="10" fontWeight="bold" textAnchor="middle">UNIV. CIRCLE (CAM02)</text>
                <text x="450" y="150" fill="#e2e8f0" fontSize="9" textAnchor="middle">4,600 veh/hr (53.5%)</text>
                <text x="450" y="165" fill="#f43f5e" fontSize="8" textAnchor="middle">⚠️ MAJOR CHOKEPOINT</text>

                <rect x="390" y="270" width="120" height="75" rx="4" fill="#020617" stroke="#06b6d4" strokeWidth="2" />
                <text x="450" y="300" fill="#06b6d4" fontSize="10" fontWeight="bold" textAnchor="middle">METRO SPINE (CAM05)</text>
                <text x="450" y="320" fill="#e2e8f0" fontSize="9" textAnchor="middle">4,000 veh/hr</text>
              </g>

              {/* Stage 2 Node Rectangles (Right) */}
              <g>
                <rect x="750" y="65" width="125" height="75" rx="4" fill="#020617" stroke="#10b981" strokeWidth="2" />
                <text x="812" y="95" fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="middle">TECH PARK IT HUB</text>
                <text x="812" y="115" fill="#e2e8f0" fontSize="9" textAnchor="middle">4,100 veh/hr (47.6%)</text>
                <text x="812" y="130" fill="#34d399" fontSize="8" textAnchor="middle">TOP DESTINATION</text>

                <rect x="750" y="195" width="125" height="55" rx="4" fill="#020617" stroke="#8b5cf6" strokeWidth="2" />
                <text x="812" y="220" fill="#8b5cf6" fontSize="10" fontWeight="bold" textAnchor="middle">OLD CITY COMMERCIAL</text>
                <text x="812" y="238" fill="#e2e8f0" fontSize="9" textAnchor="middle">2,300 veh/hr</text>

                <rect x="750" y="310" width="125" height="55" rx="4" fill="#020617" stroke="#e11d48" strokeWidth="2" />
                <text x="812" y="335" fill="#e11d48" fontSize="10" fontWeight="bold" textAnchor="middle">SOUTH EXPRESS EGRESS</text>
                <text x="812" y="352" fill="#e2e8f0" fontSize="9" textAnchor="middle">2,200 veh/hr</text>
              </g>
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredLink && (
              <div className="absolute bottom-4 left-6 bg-slate-900 border border-cyan-500/80 p-2.5 rounded shadow-xl pointer-events-none text-slate-200">
                <div className="text-[10px] text-cyan-400 uppercase font-bold">LINK FLOW STATS</div>
                <div className="font-bold text-xs">{hoveredLink.label}</div>
                <div className="text-emerald-300 font-bold">{hoveredLink.val}</div>
              </div>
            )}
          </div>

          {/* Urban Planning Strategic Takeaways */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sankeyData.planning_insights.map((insight, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Key Policy Insight #{idx + 1}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

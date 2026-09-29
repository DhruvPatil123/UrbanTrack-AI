import React, { useState, useEffect } from 'react';
import { Camera, Road, Vehicle, Trajectory } from '../types';
import { Video, AlertTriangle, ShieldCheck, ZoomIn, ZoomOut, Layers } from 'lucide-react';

interface CorridorMapProps {
  cameras: Camera[];
  roads: Road[];
  selectedVehicle?: Vehicle | null;
  trajectory?: Trajectory | null;
  onSelectCamera?: (camera: Camera) => void;
  closedRoadId?: string | null;
  isPursuitMode?: boolean;
  isGreenWaveMode?: boolean;
}

export const CorridorMap: React.FC<CorridorMapProps> = ({
  cameras,
  roads,
  selectedVehicle,
  trajectory,
  onSelectCamera,
  closedRoadId,
  isPursuitMode,
  isGreenWaveMode
}) => {
  const [zoom, setZoom] = useState(1);
  const [activeCam, setActiveCam] = useState<Camera | null>(null);
  const [simStep, setSimStep] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Geographic bounds for canonical corridor
  // Lat: 18.5100 to 18.5400, Lng: 73.8400 to 73.8700
  const minLat = 18.5100;
  const maxLat = 18.5410;
  const minLng = 73.8420;
  const maxLng = 73.8680;

  const project = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 800 + 50;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 520 + 40;
    return { x, y };
  };

  // Continuous animation loop for moving vehicles
  useEffect(() => {
    const timer = setInterval(() => {
      setSimStep((prev) => (prev + 1) % 100);
    }, 150);
    return () => clearInterval(timer);
  }, []);

  const getRoadColor = (roadId: string) => {
    if (closedRoadId === roadId) return '#ef4444'; // Red closed
    if (roadId === 'R102') return '#f43f5e'; // Severe congestion (Rose)
    if (roadId === 'R106') return '#f59e0b'; // Moderate congestion (Amber)
    return '#10b981'; // Free flow (Emerald)
  };

  // Camera coordinates map
  const camPosMap = new Map<string, { x: number; y: number }>();
  cameras.forEach((cam) => {
    camPosMap.set(cam.camera_id, project(cam.latitude, cam.longitude));
  });

  // Canonical road line coordinates
  const roadLines = [
    { id: 'R101', name: 'North Arterial Blvd', from: 'CAM01', to: 'CAM02' },
    { id: 'R102', name: 'Central Metro Corridor', from: 'CAM02', to: 'CAM05' },
    { id: 'R103', name: 'Tech Park Link Rd', from: 'CAM01', to: 'CAM03' },
    { id: 'R104', name: 'Innovation Expressway', from: 'CAM03', to: 'CAM04' },
    { id: 'R105', name: 'Riverfront Promenade', from: 'CAM02', to: 'CAM06' },
    { id: 'R106', name: 'South Ring Highway', from: 'CAM05', to: 'CAM08' },
    { id: 'R106_B', name: 'South Ring Spur', from: 'CAM04', to: 'CAM07' },
    { id: 'R106_C', name: 'East Ring Connector', from: 'CAM07', to: 'CAM08' }
  ];

  return (
    <div className="relative w-full h-[640px] bg-slate-950 rounded border border-slate-800/90 overflow-hidden select-none">
      {/* Map Control Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/95 border border-slate-800 px-3 py-1.5 rounded shadow-lg backdrop-blur">
        <span className="text-xs font-mono text-slate-300 font-semibold flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          Map Layers
        </span>
        <span className="text-slate-700">|</span>
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`text-xs font-mono px-2 py-0.5 rounded transition ${
            showHeatmap ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {showHeatmap ? 'Heatmap: ON' : 'Heatmap: OFF'}
        </button>
      </div>

      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-slate-900/95 border border-slate-800 p-1 rounded shadow-lg">
        <button
          onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.8, z - 0.1))}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* SVG Vector Map Container */}
      <div className="w-full h-full flex items-center justify-center p-4">
        <svg
          viewBox="0 0 900 600"
          className="w-full h-full transition-transform duration-300"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Subtle Grid Backdrop */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.7" opacity="0.35" />
            </pattern>
            {/* Pulsing Glow Filters */}
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-green" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="900" height="600" fill="url(#grid)" />

          {/* Green Wave Preemption Corridor Layer if active */}
          {isGreenWaveMode && (
            <g>
              {/* Highlighted Green Wave path: CAM01 -> CAM02 -> CAM05 -> CAM08 */}
              <polyline
                points="150,140 340,270 510,380 720,510"
                fill="none"
                stroke="#10b981"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.4"
                filter="url(#glow-green)"
              />
              <polyline
                points="150,140 340,270 510,380 720,510"
                fill="none"
                stroke="#34d399"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="10 5"
                opacity="0.9"
                className="animate-pulse"
              />

              {/* Moving Emergency Ambulance Particle with dual red-blue flashing beacons */}
              {(() => {
                const points = [
                  { x: 150, y: 140 },
                  { x: 340, y: 270 },
                  { x: 510, y: 380 },
                  { x: 720, y: 510 }
                ];
                // Progress through segments
                const totalSegments = 3;
                const progress = (simStep % 100) / 100;
                const currentSegment = Math.floor(progress * totalSegments);
                const segFraction = (progress * totalSegments) - currentSegment;

                const pStart = points[currentSegment];
                const pEnd = points[Math.min(currentSegment + 1, points.length - 1)];
                const ax = pStart.x + (pEnd.x - pStart.x) * segFraction;
                const ay = pStart.y + (pEnd.y - pStart.y) * segFraction;

                return (
                  <g transform={`translate(${ax}, ${ay})`}>
                    {/* Outer Emergency Warning Halo */}
                    <circle cx="0" cy="0" r="16" fill="#10b981" opacity="0.3" className="animate-ping" />
                    {/* Vehicle Body */}
                    <rect x="-14" y="-8" width="28" height="16" rx="3" fill="#ffffff" stroke="#047857" strokeWidth="2" />
                    {/* Ambulance Cross */}
                    <path d="M-2,-5 L2,-5 L2,-2 L5,-2 L5,2 L2,2 L2,5 L-2,5 L-2,2 L-5,2 L-5,-2 L-2,-2 Z" fill="#ef4444" />
                    {/* Red / Blue Dual Flashing Beacons */}
                    <circle cx="-8" cy="-8" r="3" fill="#ef4444" className="animate-pulse" />
                    <circle cx="8" cy="-8" r="3" fill="#38bdf8" className="animate-pulse" />
                    {/* Label */}
                    <text x="0" y="18" fill="#10b981" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      🚑 MEDIC-108
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* Heatmap Layer if toggled */}
          {showHeatmap && (
            <g opacity="0.25">
              <circle cx="340" cy="270" r="140" fill="#f43f5e" filter="blur(25px)" />
              <circle cx="560" cy="460" r="90" fill="#f59e0b" filter="blur(20px)" />
            </g>
          )}

          {/* Road Network Segments */}
          {roadLines.map((line, idx) => {
            const p1 = camPosMap.get(line.from);
            const p2 = camPosMap.get(line.to);
            if (!p1 || !p2) return null;
            const color = getRoadColor(line.id.split('_')[0]);
            const isClosed = closedRoadId === line.id.split('_')[0];

            return (
              <g key={`road-${idx}`}>
                {/* Road Casing */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#090d16"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                {/* Road Centerline with Status Color */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={color}
                  strokeWidth="5"
                  strokeDasharray={isClosed ? '6 4' : 'none'}
                  strokeLinecap="round"
                  opacity={isClosed ? 0.9 : 0.85}
                />
                {/* Road Label */}
                <text
                  x={(p1.x + p2.x) / 2}
                  y={(p1.y + p2.y) / 2 - 8}
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  {line.name} {isClosed ? '[CLOSED]' : ''}
                </text>
              </g>
            );
          })}

          {/* Trajectory Path Overlay if vehicle selected */}
          {trajectory && trajectory.camera_sequence.length > 1 && (
            <g filter="url(#glow-cyan)">
              {trajectory.camera_sequence.map((camId, i) => {
                if (i === trajectory.camera_sequence.length - 1) return null;
                const nextCamId = trajectory.camera_sequence[i + 1];
                const p1 = camPosMap.get(camId);
                const p2 = camPosMap.get(nextCamId);
                if (!p1 || !p2) return null;
                return (
                  <line
                    key={`traj-seg-${i}`}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#22d3ee"
                    strokeWidth="3.5"
                    strokeDasharray="8 5"
                    strokeLinecap="round"
                    className="animate-pulse"
                  />
                );
              })}
            </g>
          )}

          {/* Simulated Moving Vehicle Particles */}
          <g>
            {/* Vehicle 1 moving on CAM01 -> CAM02 */}
            {(() => {
              const p1 = camPosMap.get('CAM01');
              const p2 = camPosMap.get('CAM02');
              if (p1 && p2) {
                const frac = (simStep % 100) / 100;
                const vx = p1.x + (p2.x - p1.x) * frac;
                const vy = p1.y + (p2.y - p1.y) * frac;
                return (
                  <circle cx={vx} cy={vy} r="4.5" fill="#38bdf8" filter="url(#glow-cyan)">
                    <title>Vehicle: MH12AB1234 (46 km/h)</title>
                  </circle>
                );
              }
              return null;
            })()}

            {/* Vehicle 2 moving on CAM02 -> CAM05 */}
            {(() => {
              const p1 = camPosMap.get('CAM02');
              const p2 = camPosMap.get('CAM05');
              if (p1 && p2 && closedRoadId !== 'R102') {
                const frac = ((simStep + 45) % 100) / 100;
                const vx = p1.x + (p2.x - p1.x) * frac;
                const vy = p1.y + (p2.y - p1.y) * frac;
                return <circle cx={vx} cy={vy} r="4" fill="#f43f5e" />;
              }
              return null;
            })()}

            {/* Vehicle 3 moving on CAM03 -> CAM04 */}
            {(() => {
              const p1 = camPosMap.get('CAM03');
              const p2 = camPosMap.get('CAM04');
              if (p1 && p2) {
                const frac = ((simStep + 20) % 100) / 100;
                const vx = p1.x + (p2.x - p1.x) * frac;
                const vy = p1.y + (p2.y - p1.y) * frac;
                return <circle cx={vx} cy={vy} r="4" fill="#a78bfa" />;
              }
              return null;
            })()}
          </g>

          {/* Virtual Geofence Cordons & Police Interceptor Units in Pursuit Mode */}
          {(isPursuitMode || selectedVehicle?.global_vehicle_id === 'V000123') && (
            <g>
              {/* Geofence 1: North Cordon */}
              <circle cx="200" cy="180" r="70" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" className="animate-pulse" />
              <text x="200" y="105" fill="#ef4444" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                [GEOFENCE CORDON 1 - ARMED]
              </text>

              {/* Geofence 2: Metro Cordon */}
              <circle cx="340" cy="270" r="85" fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" className="animate-pulse" />
              <text x="340" y="180" fill="#f97316" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                [GEOFENCE CORDON 2 - ARMED]
              </text>

              {/* Geofence 3: South Toll Chokepoint */}
              <circle cx="620" cy="460" r="95" fill="none" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.7" className="animate-pulse" />
              <text x="620" y="360" fill="#e11d48" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                [TERMINAL CHOKEPOINT GEOFENCE 3]
              </text>

              {/* Police Interceptor Unit Badges */}
              <g transform="translate(430, 310)">
                <rect x="-40" y="-11" width="80" height="22" rx="3" fill="#020617" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="0" y="4" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  🚔 UNIT 104
                </text>
              </g>

              <g transform="translate(680, 480)">
                <rect x="-40" y="-11" width="80" height="22" rx="3" fill="#020617" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="0" y="4" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  🚔 UNIT 209
                </text>
              </g>
            </g>
          )}

          {/* Camera Node Markers */}
          {cameras.map((cam) => {
            const pos = camPosMap.get(cam.camera_id);
            if (!pos) return null;
            const isSelected = activeCam?.camera_id === cam.camera_id;
            const isTrajNode = trajectory?.camera_sequence.includes(cam.camera_id);

            return (
              <g
                key={cam.camera_id}
                onClick={() => {
                  setActiveCam(cam);
                  onSelectCamera?.(cam);
                }}
                className="cursor-pointer group"
              >
                {/* Outer Status Ring */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isTrajNode ? 14 : 11}
                  fill="#020617"
                  stroke={isTrajNode ? '#22d3ee' : '#334155'}
                  strokeWidth={isTrajNode ? '2.5' : '1.5'}
                  className="transition-all duration-200 group-hover:stroke-cyan-400"
                />
                {/* Center Core */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="5"
                  fill={cam.status === 'ONLINE' ? '#10b981' : '#f43f5e'}
                />

                {/* Camera Label */}
                <text
                  x={pos.x}
                  y={pos.y + 20}
                  fill={isTrajNode ? '#67e8f9' : '#cbd5e1'}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {cam.camera_id}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + 31}
                  fill="#64748b"
                  fontSize="8"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {cam.name.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Camera Inspector Drawer / Modal */}
      {activeCam && (
        <div className="absolute bottom-4 left-4 z-30 w-80 bg-slate-900/95 border border-slate-800 p-4 rounded shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-400" />
              <span className="font-mono font-bold text-sm text-slate-100">{activeCam.camera_id}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                {activeCam.status}
              </span>
            </div>
            <button
              onClick={() => setActiveCam(null)}
              className="text-xs text-slate-500 hover:text-slate-300 font-mono"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-300 font-medium mb-3">{activeCam.name}</p>
          <div className="space-y-1.5 text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
            <div className="flex justify-between">
              <span>Road Link:</span>
              <span className="text-slate-200">{activeCam.road_id}</span>
            </div>
            <div className="flex justify-between">
              <span>GPS:</span>
              <span className="text-slate-200">{activeCam.latitude.toFixed(4)}, {activeCam.longitude.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span>Frame Rate:</span>
              <span className="text-emerald-400">{activeCam.fps} FPS</span>
            </div>
            <div className="flex justify-between">
              <span>Active Tracks:</span>
              <span className="text-cyan-300 font-semibold">{activeCam.active_detections} Vehicles</span>
            </div>
            <div className="flex justify-between">
              <span>RTSP Stream:</span>
              <span className="text-slate-400 truncate max-w-[150px]">{activeCam.source_uri}</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend Box */}
      <div className="absolute bottom-4 right-4 z-20 bg-slate-900/90 border border-slate-800 p-3 rounded text-[11px] font-mono text-slate-400 space-y-1.5 shadow-lg backdrop-blur">
        <div className="font-bold text-slate-200 mb-1">Corridor Status</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Free Flow (&gt;40 km/h)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Moderate (25-40 km/h)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Heavy / Severe (&lt;20 km/h)</span>
        </div>
        {selectedVehicle && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-cyan-300">
            <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
            <span>Target: {selectedVehicle.global_vehicle_id}</span>
          </div>
        )}
      </div>
    </div>
  );
};

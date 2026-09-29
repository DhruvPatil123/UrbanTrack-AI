import React, { useState } from 'react';
import { Network, Info, CheckCircle, ArrowRight, Layers, Cpu, Shield } from 'lucide-react';

export const SpatialGraphView: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  // Canonical graph representation:
  // Node types: VEHICLE, OBSERVATION, CAMERA, ROAD
  const nodes = [
    { id: 'V000123', label: 'V000123', type: 'VEHICLE', meta: { plate: 'MH12AB1234', type: 'car', confidence: 0.96 } },
    { id: 'OBS_01', label: 'OBS_01 (CAM01)', type: 'OBSERVATION', meta: { track: 'TRK_0001', time: '10:02:12', plate: 'MH12AB1234' } },
    { id: 'OBS_02', label: 'OBS_02 (CAM02)', type: 'OBSERVATION', meta: { track: 'TRK_0014', time: '10:03:47', plate: 'MH12AB1234' } },
    { id: 'OBS_05', label: 'OBS_05 (CAM05)', type: 'OBSERVATION', meta: { track: 'TRK_0042', time: '10:05:52', plate: 'MH12AB1234' } },
    { id: 'OBS_08', label: 'OBS_08 (CAM08)', type: 'OBSERVATION', meta: { track: 'TRK_0089', time: '10:08:23', plate: 'MH12AB1234' } },
    { id: 'CAM01', label: 'CAM01: North Gate', type: 'CAMERA', meta: { lat: 18.5312, lng: 73.8445, road: 'R101' } },
    { id: 'CAM02', label: 'CAM02: Univ Circle', type: 'CAMERA', meta: { lat: 18.5280, lng: 73.8500, road: 'R102' } },
    { id: 'CAM05', label: 'CAM05: Metro South', type: 'CAMERA', meta: { lat: 18.5220, lng: 73.8560, road: 'R102' } },
    { id: 'CAM08', label: 'CAM08: South Ring', type: 'CAMERA', meta: { lat: 18.5120, lng: 73.8600, road: 'R106' } },
    { id: 'R101', label: 'Road R101', type: 'ROAD', meta: { name: 'North Arterial', speed: '50 km/h' } },
    { id: 'R102', label: 'Road R102', type: 'ROAD', meta: { name: 'Metro Corridor', speed: '45 km/h' } },
    { id: 'R106', label: 'Road R106', type: 'ROAD', meta: { name: 'South Ring', speed: '60 km/h' } }
  ];

  const edges = [
    { from: 'V000123', to: 'OBS_01', rel: 'OBSERVED_AS', weight: 1.0 },
    { from: 'V000123', to: 'OBS_02', rel: 'OBSERVED_AS', weight: 1.0 },
    { from: 'V000123', to: 'OBS_05', rel: 'OBSERVED_AS', weight: 1.0 },
    { from: 'V000123', to: 'OBS_08', rel: 'OBSERVED_AS', weight: 1.0 },
    { from: 'OBS_01', to: 'CAM01', rel: 'CAPTURED_BY', weight: 1.0 },
    { from: 'OBS_02', to: 'CAM02', rel: 'CAPTURED_BY', weight: 1.0 },
    { from: 'OBS_05', to: 'CAM05', rel: 'CAPTURED_BY', weight: 1.0 },
    { from: 'OBS_08', to: 'CAM08', rel: 'CAPTURED_BY', weight: 1.0 },
    { from: 'OBS_01', to: 'OBS_02', rel: 'CANDIDATE_MATCH', weight: 0.942, gnnScore: 0.942 },
    { from: 'OBS_02', to: 'OBS_05', rel: 'CANDIDATE_MATCH', weight: 0.915, gnnScore: 0.915 },
    { from: 'OBS_05', to: 'OBS_08', rel: 'CANDIDATE_MATCH', weight: 0.887, gnnScore: 0.887 },
    { from: 'CAM01', to: 'CAM02', rel: 'TOPOLOGY_CONNECTED', weight: 1.0 },
    { from: 'CAM02', to: 'CAM05', rel: 'TOPOLOGY_CONNECTED', weight: 1.0 },
    { from: 'CAM05', to: 'CAM08', rel: 'TOPOLOGY_CONNECTED', weight: 1.0 }
  ];

  // Visual coordinates for SVG layout
  const coords: Record<string, { x: number; y: number }> = {
    'V000123': { x: 420, y: 70 },
    'OBS_01': { x: 160, y: 190 },
    'OBS_02': { x: 330, y: 190 },
    'OBS_05': { x: 520, y: 190 },
    'OBS_08': { x: 690, y: 190 },
    'CAM01': { x: 160, y: 340 },
    'CAM02': { x: 330, y: 340 },
    'CAM05': { x: 520, y: 340 },
    'CAM08': { x: 690, y: 340 },
    'R101': { x: 245, y: 460 },
    'R102': { x: 425, y: 460 },
    'R106': { x: 605, y: 460 }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'VEHICLE':
        return '#38bdf8'; // Cyan
      case 'OBSERVATION':
        return '#10b981'; // Emerald
      case 'CAMERA':
        return '#a78bfa'; // Purple
      case 'ROAD':
        return '#f59e0b'; // Amber
      default:
        return '#94a3b8';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Graph Canvas */}
      <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded p-4 relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Network className="w-4 h-4 text-cyan-400" />
            <span className="font-bold">Dynamic Spatial-Temporal Graph View</span>
          </div>

          <div className="flex items-center gap-1.5">
            {['ALL', 'VEHICLE', 'OBSERVATION', 'CAMERA', 'ROAD'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded transition ${
                  filterType === type
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Graph View */}
        <div className="w-full h-[520px] flex items-center justify-center select-none">
          <svg viewBox="0 0 850 520" className="w-full h-full">
            {/* Edges */}
            {edges.map((e, idx) => {
              const p1 = coords[e.from];
              const p2 = coords[e.to];
              if (!p1 || !p2) return null;
              const isCandidate = e.rel === 'CANDIDATE_MATCH';
              const isObserved = e.rel === 'OBSERVED_AS';

              return (
                <g key={`edge-${idx}`}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={isCandidate ? '#22d3ee' : isObserved ? '#38bdf8' : '#334155'}
                    strokeWidth={isCandidate ? 2.5 : 1.5}
                    strokeDasharray={isCandidate ? '5 3' : 'none'}
                    opacity={isCandidate ? 0.9 : 0.6}
                  />
                  {/* Candidate Match Score Badge */}
                  {isCandidate && e.gnnScore && (
                    <text
                      x={(p1.x + p2.x) / 2}
                      y={(p1.y + p2.y) / 2 - 6}
                      fill="#22d3ee"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="font-bold"
                    >
                      P={e.gnnScore.toFixed(3)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const pos = coords[node.id];
              if (!pos) return null;
              const isSelected = selectedNode?.id === node.id;
              const color = getNodeColor(node.type);

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer group"
                >
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={node.type === 'VEHICLE' ? 18 : 14}
                    fill="#020617"
                    stroke={color}
                    strokeWidth={isSelected ? 3.5 : 2}
                    className="transition-all group-hover:scale-110"
                  />
                  <text
                    x={pos.x}
                    y={pos.y + (node.type === 'VEHICLE' ? 32 : 26)}
                    fill="#cbd5e1"
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>Vehicle Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Observation Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <span>Camera Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Road Node</span>
          </div>
        </div>
      </div>

      {/* Right Column: Node & Edge Inspector Panel */}
      <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded p-4 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs font-mono text-slate-300">
          <Info className="w-4 h-4 text-cyan-400" />
          <span className="font-bold">Graph Entity Inspector</span>
        </div>

        {selectedNode ? (
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">NODE IDENTITY</span>
              <div className="text-sm font-bold text-slate-100">{selectedNode.id}</div>
              <span className="text-[10px] uppercase bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.2 rounded inline-block">
                {selectedNode.type}
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 uppercase block">NODE ATTRIBUTES</span>
              {Object.entries(selectedNode.meta).map(([k, v]) => (
                <div key={k} className="flex justify-between text-[11px]">
                  <span className="text-slate-400 uppercase">{k}:</span>
                  <span className="text-slate-200 font-semibold">{String(v)}</span>
                </div>
              ))}
            </div>

            {selectedNode.type === 'OBSERVATION' && (
              <div className="p-3 bg-cyan-950/40 rounded border border-cyan-800/80 space-y-1.5 text-[11px]">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  GNN Candidate Association
                </div>
                <p className="text-slate-300">
                  Associated to Global ID <strong className="text-white">V000123</strong> via edge classifier with probability <strong className="text-emerald-400">0.942</strong>.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 font-mono text-xs space-y-2 border border-dashed border-slate-800 rounded">
            <p>Click any graph node to inspect spatio-temporal connectivity and attributes.</p>
          </div>
        )}
      </div>
    </div>
  );
};

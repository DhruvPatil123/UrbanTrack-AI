import React from 'react';
import {
  MapPin,
  Video,
  Car,
  Network,
  BarChart3,
  AlertOctagon,
  GitFork,
  Cpu,
  FileText,
  Bot,
  Sparkles,
  Siren,
  Activity,
  Compass,
  Gauge
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  alertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, alertCount }) => {
  const menuItems = [
    { id: 'map', label: 'Live City Map', icon: MapPin },
    { id: 'streams', label: 'CCTV Vision Grid', icon: Video },
    { id: 'vehicles', label: 'Vehicle Intelligence', icon: Car },
    { id: 'enforcement', label: 'Speed Enforcement (ASOD)', icon: Gauge },
    { id: 'pursuit', label: 'Red Notice Pursuit', icon: Siren, isPursuit: true },
    { id: 'greenwave', label: 'Green Wave Corridor', icon: Activity, isGreenWave: true },
    { id: 'chat', label: 'Gemini AI Copilot', icon: Bot, isAi: true },
    { id: 'graph', label: 'Spatial-Temporal Graph', icon: Network },
    { id: 'analytics', label: 'Traffic Analytics', icon: BarChart3 },
    { id: 'odmatrix', label: 'O-D Matrix & Flows', icon: Compass },
    { id: 'alerts', label: 'Alerts & Prediction', icon: AlertOctagon, badge: alertCount },
    { id: 'simulation', label: 'What-If Simulation', icon: GitFork },
    { id: 'gnn', label: 'GNN Match Diagnostics', icon: Cpu },
    { id: 'docs', label: 'System Architecture', icon: FileText }
  ];

  return (
    <aside className="w-64 bg-slate-950/95 border-r border-slate-800/80 flex flex-col justify-between select-none">
      <div className="py-4">
        <div className="px-4 mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Control Center Navigation
          </span>
        </div>
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-mono transition-all text-left ${
                  isActive
                    ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-semibold shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : (item as any).isPursuit ? 'text-rose-400 animate-pulse' : (item as any).isGreenWave ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                  <span className={(item as any).isPursuit ? 'text-rose-300 font-bold' : (item as any).isGreenWave ? 'text-emerald-300 font-bold' : ''}>{item.label}</span>
                </div>
                {(item as any).isPursuit && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
                {(item as any).isGreenWave && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                )}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800/80 px-1.5 py-0.2 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Telemetry Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/30">
        <div className="text-[11px] font-mono text-slate-400 space-y-1.5">
          <div className="flex justify-between items-center">
            <span>Inference Device:</span>
            <span className="text-cyan-400 font-semibold">CPU Fallback</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Stream FPS:</span>
            <span className="text-emerald-400 font-semibold">25.0 fps</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Graph Nodes:</span>
            <span className="text-slate-200">8 Cam / 6 Road</span>
          </div>
          <div className="flex justify-between items-center">
            <span>GNN Latency:</span>
            <span className="text-cyan-300">4.8 ms</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

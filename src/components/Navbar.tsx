import React, { useState, useEffect } from 'react';
import {
  Radio,
  Clock,
  Car,
  AlertTriangle,
  Layers,
  Sparkles,
  RefreshCw,
  Video,
  Mic
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onScenarioChange?: (scenario: string) => void;
  onOpenCopilot?: () => void;
  onOpenVoice?: () => void;
  onRefresh?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onScenarioChange, onOpenCopilot, onOpenVoice, onRefresh }) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between z-30 select-none">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded bg-gradient-to-tr from-cyan-600 via-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-950/40">
          <Radio className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wider text-base text-slate-100 font-mono">URBANTRACK AI</span>
            <span className="text-[10px] font-mono uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 px-1.5 py-0.5 rounded">
              SIH26127
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Multi-Camera ANPR Trajectory & Traffic Intelligence · Team AI007
          </p>
        </div>
      </div>

      {/* Center Operational Presets */}
      <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded">
        <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          Preset Scenarios:
        </span>
        <button
          onClick={() => onScenarioChange?.('standard')}
          className="text-xs font-mono text-slate-300 hover:text-cyan-400 hover:bg-slate-800 px-2 py-1 rounded transition"
        >
          Corridor Normal
        </button>
        <span className="text-slate-700">·</span>
        <button
          onClick={() => onScenarioChange?.('pursuit')}
          className="text-xs font-mono text-slate-300 hover:text-amber-400 hover:bg-slate-800 px-2 py-1 rounded transition flex items-center gap-1"
        >
          <Car className="w-3 h-3 text-amber-400" />
          Target V000123
        </button>
        <span className="text-slate-700">·</span>
        <button
          onClick={() => onScenarioChange?.('closure')}
          className="text-xs font-mono text-slate-300 hover:text-rose-400 hover:bg-slate-800 px-2 py-1 rounded transition flex items-center gap-1"
        >
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          R102 Closure Detour
        </button>
      </div>

      {/* Right Telemetry & Badges */}
      <div className="flex items-center gap-3">
        {/* Gemini Voice Dispatcher Launch Button */}
        <button
          onClick={onOpenVoice}
          title="Open Voice-Activated Dispatcher & Audio Console"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition border bg-gradient-to-r from-amber-950 via-slate-900 to-rose-950/80 text-amber-300 border-amber-600/80 hover:border-amber-400 hover:text-amber-200 font-bold shadow-md shadow-amber-950/40"
        >
          <Mic className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Voice Dispatch</span>
        </button>

        {/* Gemini Copilot Launch Button */}
        <button
          onClick={onOpenCopilot}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition border ${
            activeTab === 'chat'
              ? 'bg-gradient-to-r from-cyan-900 to-indigo-900 text-cyan-300 border-cyan-600 font-bold'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-cyan-700 hover:text-cyan-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Gemini Copilot</span>
        </button>

        {/* Demo Mode Badge */}
        <div className="hidden sm:flex items-center gap-1.5 bg-amber-950/40 border border-amber-800/50 px-2.5 py-1 rounded">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="text-[11px] font-mono text-amber-300 tracking-wide font-semibold">
            DEMO MODE
          </span>
        </div>

        {/* Live Clock */}
        <div className="flex items-center gap-1.5 text-slate-300 font-mono text-xs bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{timeStr || '00:00:00'}</span>
        </div>

        {/* Manual Refresh */}
        <button
          onClick={onRefresh}
          title="Refresh Telemetry"
          className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

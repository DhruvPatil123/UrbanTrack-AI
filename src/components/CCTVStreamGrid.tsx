import React, { useState, useEffect, useRef } from 'react';
import { Camera } from '../types';
import { Video, Maximize2, Shield, Eye, Settings, RefreshCw, Sliders } from 'lucide-react';
import { CameraCalibrationModal } from './CameraCalibrationModal';

interface CCTVStreamGridProps {
  cameras: Camera[];
  selectedCameraId?: string;
  onSelectCamera?: (camera: Camera) => void;
}

export const CCTVStreamGrid: React.FC<CCTVStreamGridProps> = ({
  cameras,
  selectedCameraId,
  onSelectCamera
}) => {
  const [activeCamId, setActiveCamId] = useState<string>(selectedCameraId || 'CAM01');
  const [showBBoxes, setShowBBoxes] = useState(true);
  const [showPlates, setShowPlates] = useState(true);
  const [showReID, setShowReID] = useState(true);
  const [gridMode, setGridMode] = useState<'single' | 'quad'>('quad');
  const [calibratingCamera, setCalibratingCamera] = useState<Camera | null>(null);
  const [tick, setTick] = useState(0);

  // Animation ticker for moving bounding boxes in stream canvas
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => (t + 1) % 200);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const displayCameras = gridMode === 'single'
    ? cameras.filter((c) => c.camera_id === activeCamId)
    : cameras.slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Top Stream Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
            <Video className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">AI Stream Inspector</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setGridMode('quad')}
              className={`text-xs font-mono px-2 py-1 rounded transition ${
                gridMode === 'quad' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2x2 Quad Grid
            </button>
            <button
              onClick={() => setGridMode('single')}
              className={`text-xs font-mono px-2 py-1 rounded transition ${
                gridMode === 'single' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Focus View
            </button>
          </div>
        </div>

        {/* AI Overlay Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBBoxes(!showBBoxes)}
            className={`text-xs font-mono px-2.5 py-1 rounded border transition ${
              showBBoxes ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700' : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            YOLO Tracks
          </button>
          <button
            onClick={() => setShowPlates(!showPlates)}
            className={`text-xs font-mono px-2.5 py-1 rounded border transition ${
              showPlates ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700' : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            ANPR Plates
          </button>
          <button
            onClick={() => setShowReID(!showReID)}
            className={`text-xs font-mono px-2.5 py-1 rounded border transition ${
              showReID ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700' : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            Re-ID Hash
          </button>
          <span className="text-slate-700">|</span>
          <button
            onClick={() => setCalibratingCamera(cameras.find((c) => c.camera_id === activeCamId) || cameras[0])}
            className="text-xs font-mono px-2.5 py-1 rounded border border-indigo-700 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 transition flex items-center gap-1.5 font-bold shadow"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Calibrate (H)</span>
          </button>
        </div>
      </div>

      {/* Camera Streams Grid */}
      <div className={`grid gap-4 ${gridMode === 'single' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {displayCameras.map((cam) => {
          const isLead = cam.camera_id === 'CAM01';
          const isTargetCam = cam.camera_id === 'CAM02' || cam.camera_id === 'CAM05';

          // Animate simulated bounding box position
          const xOffset = (tick * 2) % 360;

          return (
            <div
              key={cam.camera_id}
              className="bg-slate-950 rounded border border-slate-800/90 overflow-hidden shadow-xl"
            >
              {/* Stream Header */}
              <div className="bg-slate-900/80 px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-slate-200">{cam.camera_id}</span>
                  <span className="text-slate-400">· {cam.name}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="text-emerald-400 font-semibold">{cam.fps}.0 FPS</span>
                  <span>14ms Latency</span>
                  <span className="text-cyan-400">{cam.active_detections} Tracks</span>
                </div>
              </div>

              {/* Video Stream Canvas Simulation */}
              <div className="relative aspect-video bg-gradient-to-b from-slate-900 via-slate-950 to-zinc-950 overflow-hidden flex items-center justify-center">
                {/* Synthetic Road Markings & Background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  {/* Road perspective lines */}
                  <svg className="w-full h-full" viewBox="0 0 640 360">
                    <line x1="200" y1="80" x2="40" y2="360" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8 6" />
                    <line x1="440" y1="80" x2="600" y2="360" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8 6" />
                    <line x1="320" y1="80" x2="320" y2="360" stroke="#facc15" strokeWidth="2" strokeDasharray="14 10" />
                  </svg>
                </div>

                {/* Live AI Overlay Bounding Box 1 (Vehicle) */}
                {showBBoxes && (
                  <div
                    className="absolute border-2 border-cyan-400/90 rounded transition-all duration-100 shadow-lg shadow-cyan-950/50"
                    style={{
                      left: `${18 + (xOffset * 0.16)}%`,
                      top: `${36 + (Math.sin(tick * 0.05) * 4)}%`,
                      width: '28%',
                      height: '38%'
                    }}
                  >
                    {/* Track ID & Class Tag */}
                    <div className="absolute -top-6 left-0 bg-cyan-950/95 text-cyan-300 border border-cyan-800 text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1.5 whitespace-nowrap">
                      <span>{cam.camera_id}_TRK_0001</span>
                      <span className="text-white font-bold">CAR 0.94</span>
                    </div>

                    {/* License Plate Tag */}
                    {showPlates && (
                      <div className="absolute -bottom-6 left-0 bg-emerald-950/95 text-emerald-300 border border-emerald-800 text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 whitespace-nowrap">
                        <Shield className="w-3 h-3 text-emerald-400" />
                        <span className="font-bold">MH12AB1234</span>
                        <span className="text-slate-400">(0.96)</span>
                      </div>
                    )}

                    {/* Re-ID Feature Hash Tag */}
                    {showReID && (
                      <div className="absolute top-1 right-1 bg-slate-900/90 text-cyan-400 text-[9px] font-mono px-1 rounded border border-slate-700">
                        #512d:a4f89b
                      </div>
                    )}
                  </div>
                )}

                {/* Live AI Overlay Bounding Box 2 (Secondary Vehicle) */}
                {showBBoxes && (
                  <div
                    className="absolute border border-indigo-400/70 rounded transition-all duration-100"
                    style={{
                      right: `${15 + ((xOffset * 0.12) % 30)}%`,
                      top: '25%',
                      width: '20%',
                      height: '32%'
                    }}
                  >
                    <div className="absolute -top-5 left-0 bg-indigo-950/90 text-indigo-300 border border-indigo-800 text-[9px] font-mono px-1.5 py-0.2 rounded">
                      TRK_0002 · TRUCK 0.88
                    </div>
                  </div>
                )}

                {/* Telemetry Timestamp Stamp on Frame */}
                <div className="absolute bottom-2 right-2 font-mono text-[10px] text-slate-500 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                  {new Date().toISOString().replace('T', ' ').slice(0, 19)} · 1080p
                </div>
              </div>

              {/* Stream Footer Control */}
              <div className="bg-slate-900/40 p-2.5 px-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Stream: <span className="text-slate-200">{cam.source_uri}</span></span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCalibratingCamera(cam)}
                    className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 font-bold"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Calibrate (H)</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveCamId(cam.camera_id);
                      onSelectCamera?.(cam);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Camera Homography Perspective Calibration Modal */}
      <CameraCalibrationModal
        camera={calibratingCamera}
        isOpen={!!calibratingCamera}
        onClose={() => setCalibratingCamera(null)}
      />
    </div>
  );
};

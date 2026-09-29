import React, { useState, useEffect, useRef } from 'react';
import {
  RedNotice,
  InterceptPrediction,
  GeofenceCordon,
  InvestigationDossier,
  Vehicle,
  Trajectory
} from '../types';
import { api } from '../services/api';
import {
  ShieldAlert,
  Radio,
  Clock,
  Navigation,
  MapPin,
  Volume2,
  VolumeX,
  FileText,
  Printer,
  X,
  AlertTriangle,
  CheckCircle2,
  Car,
  Target,
  Siren,
  Sliders,
  ExternalLink
} from 'lucide-react';

interface PursuitModeViewProps {
  onShowOnMap: () => void;
  selectedVehicle?: Vehicle | null;
  trajectory?: Trajectory | null;
}

export const PursuitModeView: React.FC<PursuitModeViewProps> = ({
  onShowOnMap,
  selectedVehicle,
  trajectory
}) => {
  const [redNotice, setRedNotice] = useState<RedNotice | null>(null);
  const [prediction, setPrediction] = useState<InterceptPrediction | null>(null);
  const [geofences, setGeofences] = useState<GeofenceCordon[]>([]);
  const [dossier, setDossier] = useState<InvestigationDossier | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [sirenMuted, setSirenMuted] = useState(true);
  const [breachAlert, setBreachAlert] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(108); // 1m 48s to next chokepoint

  const audioContextRef = useRef<AudioContext | null>(null);
  const sirenOscRef = useRef<OscillatorNode | null>(null);
  const sirenIntervalRef = useRef<any>(null);

  useEffect(() => {
    loadPursuitData();
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 120));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadPursuitData = async () => {
    try {
      const notices = await api.getRedNotices();
      if (notices.length > 0) setRedNotice(notices[0]);
      const pred = await api.getInterceptPrediction('V000123');
      setPrediction(pred);
      const fences = await api.getGeofences();
      setGeofences(fences);
      const dos = await api.getInvestigationDossier('V000123');
      setDossier(dos);
    } catch {
      // Data pre-seeded in fallback
    }
  };

  // Sound synthesis for law-enforcement siren alarm using Web Audio API
  const playSirenSound = () => {
    if (sirenMuted) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      // Two-tone European/American wail (600Hz to 900Hz)
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(950, ctx.currentTime + 0.35);
      osc.frequency.linearRampToValueAtTime(650, ctx.currentTime + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.75);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  const toggleSiren = () => {
    const nextMuted = !sirenMuted;
    setSirenMuted(nextMuted);
    if (!nextMuted) {
      playSirenSound();
    }
  };

  const handleTriggerBreachTest = (geofenceId: string) => {
    setBreachAlert(`ALERT: Geofence ${geofenceId} breached by target MH12AB1234!`);
    playSirenSound();
    setTimeout(() => {
      setBreachAlert(null);
    }, 6000);
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Red Notice Warrant Emergency Beacon Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-red-950 to-slate-950 border-2 border-rose-600/90 rounded p-5 shadow-2xl shadow-rose-950/50 space-y-4 font-mono select-none">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-800/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-rose-600 flex items-center justify-center animate-pulse text-white shadow-lg shadow-rose-600/50">
              <Siren className="w-6 h-6 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-rose-200 tracking-wider">
                  RED NOTICE WARRANT ACTIVATED
                </span>
                <span className="bg-rose-900/90 text-rose-100 border border-rose-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  LEVEL 1 ESCALATION
                </span>
              </div>
              <p className="text-xs text-rose-300">
                Suspect Target: <strong>{redNotice?.plate_number || 'MH12AB1234'}</strong> ({redNotice?.global_vehicle_id || 'V000123'}) · High-Speed Hit-and-Run Investigation
              </p>
            </div>
          </div>

          {/* Audio Alert Toggle & Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSiren}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition border font-bold ${
                sirenMuted
                  ? 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                  : 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/50 animate-pulse'
              }`}
            >
              {sirenMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{sirenMuted ? 'Unmute Siren Alarm' : 'Siren Alarm Armed'}</span>
            </button>

            <button
              onClick={() => setIsDossierOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-700/80 px-3 py-1.5 rounded text-xs transition flex items-center gap-1.5 font-bold"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Generate Police Dossier</span>
            </button>

            <button
              onClick={onShowOnMap}
              className="bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-1.5 rounded text-xs transition font-bold shadow-md shadow-rose-600/40 flex items-center gap-1.5"
            >
              <Navigation className="w-4 h-4" />
              <span>Live Intercept Map</span>
            </button>
          </div>
        </div>

        {/* Breach Alert Broadcast Banner */}
        {breachAlert && (
          <div className="p-3 bg-red-600 text-white font-bold text-xs rounded border border-white flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>{breachAlert}</span>
            </div>
            <span className="text-[10px] bg-red-900 px-2 py-0.5 rounded">HIGH PRIORITY DISPATCH</span>
          </div>
        )}

        {/* Live Target Telemetry Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950/80 p-3 rounded border border-rose-900/60">
            <span className="text-slate-400 block text-[10px]">LAST CONFIRMED CAMERA</span>
            <span className="text-base font-bold text-rose-300">CAM05 (Metro South)</span>
            <span className="text-[10px] text-slate-500 block">Transit Verified</span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded border border-rose-900/60">
            <span className="text-slate-400 block text-[10px]">PURSUIT SPEED</span>
            <span className="text-base font-bold text-amber-400">46.5 km/h</span>
            <span className="text-[10px] text-slate-500 block">Slowing into chokepoint</span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded border border-rose-900/60">
            <span className="text-slate-400 block text-[10px]">ETA TO NEXT CHOKEPOINT</span>
            <span className="text-base font-bold text-cyan-400">{formatCountdown(countdown)}</span>
            <span className="text-[10px] text-slate-500 block">CAM08 South Toll Plaza</span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded border border-rose-900/60">
            <span className="text-slate-400 block text-[10px]">PRIMARY INTERCEPT CONFIDENCE</span>
            <span className="text-base font-bold text-emerald-400">88% (Graph Prior)</span>
            <span className="text-[10px] text-slate-500 block">Single egress corridor</span>
          </div>
        </div>
      </div>

      {/* 2. Downstream Intercept Prediction Matrix */}
      <div className="bg-slate-900/90 border border-slate-800 rounded p-5 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-200">
            <Target className="w-4 h-4 text-cyan-400" />
            <span className="font-bold uppercase tracking-wider">
              Downstream Intercept Chokepoint Predictions (3 to 7 Minutes Forward)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Algorithmic Branching Model: Spatio-Temporal Graph Reachability
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {prediction?.chokepoints.map((chk, idx) => {
            const isPrimary = chk.chokepoint_type === 'PRIMARY_CORRIDOR' || chk.chokepoint_type === 'TERMINAL_TOLL_BARRIER';
            return (
              <div
                key={idx}
                className={`p-4 rounded border space-y-3 transition-all ${
                  isPrimary
                    ? 'bg-slate-950 border-cyan-800/80 shadow-md shadow-cyan-950/30'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-cyan-300">{chk.camera_id}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      isPrimary
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                        : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    {(chk.probability * 100).toFixed(0)}% Probability
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-200 font-bold">{chk.camera_name}</div>
                  <div className="text-[11px] text-slate-400">{chk.chokepoint_road}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block">DISTANCE</span>
                    <span className="text-slate-300 font-bold">{chk.distance_meters}m</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">PROJECTED ETA</span>
                    <span className="text-cyan-400 font-bold">~{chk.eta_minutes} mins</span>
                  </div>
                </div>

                {/* Tactical Recommendation */}
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <span className="text-[10px] text-rose-400 uppercase font-bold block">TACTICAL BLOCKADE:</span>
                  <p>{chk.recommended_action}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Interactive Virtual Geofence Cordons */}
      <div className="bg-slate-900/90 border border-slate-800 rounded p-5 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-200">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span className="font-bold uppercase tracking-wider">
              Virtual Geofence Perimeter Chokepoints
            </span>
          </div>
          <span className="text-slate-400 text-[11px]">
            Audible lock-on & barrier alerts armed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {geofences.map((geo) => (
            <div
              key={geo.geofence_id}
              className="bg-slate-950 p-4 rounded border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">{geo.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {geo.status}
                </span>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1">
                <div>Guarded Nodes: <strong className="text-slate-300">{geo.cameras.join(' · ')}</strong></div>
                <div>Perimeter Radius: <strong className="text-slate-300">{geo.radius_meters} meters</strong></div>
                <div>Coordinates: <strong className="text-slate-300">{geo.center.lat.toFixed(4)}, {geo.center.lng.toFixed(4)}</strong></div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleTriggerBreachTest(geo.name)}
                  className="bg-slate-900 hover:bg-slate-800 text-rose-400 hover:text-rose-300 border border-rose-900/80 px-2.5 py-1 rounded text-[10px] transition"
                >
                  Simulate Target Breach
                </button>
                <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Auto Lock-on
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Investigation Dossier Printable Modal */}
      {isDossierOpen && dossier && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-4xl rounded-lg shadow-2xl p-6 space-y-5 font-mono text-xs text-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-700 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-cyan-900 border border-cyan-700 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wider">
                    {dossier.dossier_title}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Case File: <strong className="text-cyan-400">{dossier.case_number}</strong> · {dossier.jurisdiction}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 px-3 py-1.5 rounded font-bold transition shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Official PDF</span>
                </button>
                <button
                  onClick={() => setIsDossierOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Target & Offense Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 block">TARGET VEHICLE ID</span>
                <span className="text-sm font-bold text-cyan-300">{dossier.target.global_vehicle_id}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">LICENSE PLATE NUMBER</span>
                <span className="text-sm font-bold text-emerald-400">{dossier.target.license_plate}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">OFFENSE CLASSIFICATION</span>
                <span className="text-xs font-bold text-rose-400">{dossier.target.offense_classification}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">INVESTIGATING OFFICER</span>
                <span className="text-xs font-bold text-slate-200">{dossier.target.reporting_officer}</span>
              </div>
            </div>

            {/* Forensic Chain of Custody Table */}
            <div className="space-y-2">
              <span className="font-bold text-sm text-cyan-400 block uppercase">
                Chronological Chain of Forensic Custody (Multi-Camera Hops)
              </span>

              <div className="border border-slate-800 rounded overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Hop</th>
                      <th className="p-2.5">Camera ID</th>
                      <th className="p-2.5">Timestamp (UTC)</th>
                      <th className="p-2.5">Track ID</th>
                      <th className="p-2.5">ANPR Plate</th>
                      <th className="p-2.5">Plate Conf</th>
                      <th className="p-2.5">Re-ID Sim</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                    {dossier.chain_of_custody.map((hop) => (
                      <tr key={hop.hop_number} className="hover:bg-slate-800/50">
                        <td className="p-2.5 font-bold text-cyan-400">#{hop.hop_number}</td>
                        <td className="p-2.5 font-bold text-slate-200">{hop.camera_id}</td>
                        <td className="p-2.5 text-slate-400">{hop.timestamp_utc}</td>
                        <td className="p-2.5 text-slate-400">{hop.local_track_id}</td>
                        <td className="p-2.5 font-bold text-emerald-400">{hop.detected_plate}</td>
                        <td className="p-2.5 text-slate-300">{(hop.plate_ocr_confidence * 100).toFixed(0)}%</td>
                        <td className="p-2.5 text-cyan-300">{(hop.reid_vector_match * 100).toFixed(0)}%</td>
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[9px] border border-emerald-800">
                            {hop.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Trajectory Verification Metrics */}
            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1 text-slate-300 text-[11px]">
              <div className="flex justify-between">
                <span>Verified Corridor Route:</span>
                <strong className="text-cyan-300">{dossier.trajectory_metrics.path_summary}</strong>
              </div>
              <div className="flex justify-between">
                <span>Cumulative Distance & Duration:</span>
                <span>{dossier.trajectory_metrics.total_corridor_distance_km} km in {(dossier.trajectory_metrics.total_transit_duration_sec / 60).toFixed(1)} mins</span>
              </div>
              <div className="flex justify-between">
                <span>Mean Corridor Transit Speed:</span>
                <strong className="text-amber-400">{dossier.trajectory_metrics.average_speed_kmh} km/h</strong>
              </div>
            </div>

            {/* Legal Evidentiary Certification Statement */}
            <div className="p-4 bg-slate-950 rounded border border-cyan-900/60 text-[10px] text-slate-400 space-y-2">
              <span className="font-bold text-slate-300 block uppercase">Algorithmic Evidentiary Attestation</span>
              <p className="leading-relaxed">{dossier.legal_certification}</p>
              <div className="flex justify-between pt-2 border-t border-slate-800 text-slate-500">
                <span>Cryptographic Digest: SHA256:8f9a2b7c4d1e0078...</span>
                <span>System Time: {dossier.generated_at}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

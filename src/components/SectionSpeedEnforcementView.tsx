import React, { useState, useEffect } from 'react';
import {
  SpeedViolation,
  CorridorSegment,
  ASODCalculation
} from '../types';
import { api } from '../services/api';
import {
  Gauge,
  Zap,
  Printer,
  X,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Sliders,
  Camera,
  Car,
  Clock,
  ArrowRight,
  ShieldAlert,
  QrCode,
  DollarSign,
  Download,
  Info
} from 'lucide-react';

interface SectionSpeedEnforcementViewProps {
  onShowOnMap: () => void;
}

export const SectionSpeedEnforcementView: React.FC<SectionSpeedEnforcementViewProps> = ({ onShowOnMap }) => {
  const [violations, setViolations] = useState<SpeedViolation[]>([]);
  const [segments, setSegments] = useState<CorridorSegment[]>([]);
  const [selectedCitation, setSelectedCitation] = useState<SpeedViolation | null>(null);

  // ASOD Sandbox state
  const [calcDistance, setCalcDistance] = useState<number>(1200);
  const [calcTime, setCalcTime] = useState<number>(51.1);
  const [calcLimit, setCalcLimit] = useState<number>(50);
  const [calcResult, setCalcResult] = useState<ASODCalculation | null>(null);

  useEffect(() => {
    loadData();
    recalculate(calcDistance, calcTime, calcLimit);
  }, []);

  const loadData = async () => {
    try {
      const [viols, segs] = await Promise.all([
        api.getSpeedViolations(),
        api.getEnforcementSegments()
      ]);
      setViolations(viols);
      setSegments(segs);
    } catch {
      // Data pre-seeded in fallback
    }
  };

  const recalculate = async (dist: number, timeSec: number, limit: number) => {
    const res = await api.calculateASOD(dist, timeSec, limit);
    setCalcResult(res);
  };

  const handleDistanceChange = (val: number) => {
    setCalcDistance(val);
    recalculate(val, calcTime, calcLimit);
  };

  const handleTimeChange = (val: number) => {
    setCalcTime(val);
    recalculate(calcDistance, val, calcLimit);
  };

  const handleLimitChange = (val: number) => {
    setCalcLimit(val);
    recalculate(calcDistance, calcTime, val);
  };

  return (
    <div className="space-y-6 select-none font-mono text-xs">
      {/* 1. Header Banner & Radar Principle */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-950 to-rose-950/60 border border-amber-500/80 rounded p-5 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-amber-950 border border-amber-600 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/60 animate-pulse">
              <Gauge className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-100 uppercase tracking-wider">
                  Section Speed Enforcement & Point-to-Point Radar (ASOD)
                </span>
                <span className="bg-amber-950 text-amber-300 border border-amber-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  LEGAL MOTOR VEHICLES ACT COMPLIANT
                </span>
              </div>
              <p className="text-xs text-amber-300">
                Average Speed Over Distance (ASOD): <strong>v_avg = (Δd / Δt) × 3.6</strong> across synchronized ANPR portals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onShowOnMap}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 px-3.5 py-1.5 rounded font-bold transition shadow-md flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              <span>Inspect Radar Gates on Map</span>
            </button>
          </div>
        </div>

        {/* Comparison: Point-to-Point vs Single Radar Gun */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
          <div className="bg-slate-950/80 p-3 rounded border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">ANTI-EVASION ARCHITECTURE</span>
            <p className="text-slate-300">
              Unlike single radar guns where drivers brake abruptly before the camera and accelerate afterwards, ASOD measures sustained transit velocity over 1,200+ meters.
            </p>
          </div>
          <div className="bg-slate-950/80 p-3 rounded border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">SUB-MILLISECOND SYNCHRONIZATION</span>
            <p className="text-slate-300">
              Optical gates CAM01 and CAM02 utilize PTP IEEE 1588 microsecond NTP time stamps, satisfying forensic courtroom verification standards.
            </p>
          </div>
          <div className="bg-slate-950/80 p-3 rounded border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">AUTOMATED E-CHALLAN DISPATCH</span>
            <p className="text-slate-300">
              Violations are directly formatted into digital citation slips, linked with Ministry of Transport VAHAN records, and dispatched via SMS/WhatsApp within 4 seconds.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Interactive ASOD Radar Speed Calculator / Sandbox */}
      <div className="bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-200">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="font-bold uppercase tracking-wider">
              Interactive ASOD Speed Verification Sandbox
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Simulate custom camera portal distances and elapsed transit intervals
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="lg:col-span-2 space-y-4">
            {/* Slider 1: Distance */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Calibrated Gate Distance (Δd):</span>
                <strong className="text-cyan-400">{calcDistance} meters ({(calcDistance / 1000).toFixed(2)} km)</strong>
              </div>
              <input
                type="range"
                min="500"
                max="3000"
                step="50"
                value={calcDistance}
                onChange={(e) => handleDistanceChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>500m (Short Trap)</span>
                <span>1,200m (CAM01-CAM02)</span>
                <span>3,000m (Expressway)</span>
              </div>
            </div>

            {/* Slider 2: Transit Time */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Elapsed Transit Delta (Δt):</span>
                <strong className="text-amber-400">{calcTime.toFixed(1)} seconds</strong>
              </div>
              <input
                type="range"
                min="25"
                max="180"
                step="0.5"
                value={calcTime}
                onChange={(e) => handleTimeChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>25.0s (Extreme Speed)</span>
                <span>51.1s (Hit-and-Run)</span>
                <span>180.0s (Congested Flow)</span>
              </div>
            </div>

            {/* Slider 3: Speed Limit */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Statutory Speed Limit:</span>
                <strong className="text-emerald-400">{calcLimit} km/h</strong>
              </div>
              <div className="flex gap-3">
                {[40, 50, 60, 70, 80].map((lim) => (
                  <button
                    key={lim}
                    onClick={() => handleLimitChange(lim)}
                    className={`flex-1 py-1 rounded text-[11px] border transition ${
                      calcLimit === lim
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-600 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {lim} km/h
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real-Time Speed & Penalty Gauge Card */}
          {calcResult && (
            <div className="bg-slate-950 p-4 rounded border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">MEASURED AVERAGE SPEED</span>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-3xl font-extrabold ${
                      calcResult.is_violation ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {calcResult.measured_speed_kmh}
                  </span>
                  <span className="text-xs text-slate-400">km/h</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] border-t border-slate-800 pt-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Speed Limit:</span>
                  <span className="text-slate-200">{calcResult.speed_limit_kmh} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Excess Speed:</span>
                  <strong className={calcResult.excess_speed_kmh > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    +{calcResult.excess_speed_kmh} km/h
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Statutory Fine:</span>
                  <strong className="text-amber-400 font-bold">
                    {calcResult.fine_amount_inr > 0 ? `₹${calcResult.fine_amount_inr}` : '₹0 (Compliant)'}
                  </strong>
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 space-y-0.5">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">APPLICABLE MV ACT SECTION:</span>
                <p>{calcResult.legal_section}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Live Speed Violations & E-Challan Feed Table */}
      <div className="bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-200">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span className="font-bold uppercase tracking-wider">
              Enforcement Portal: Active Speeding Citations Feed
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Auto-generated from CAM01 → CAM02 & CAM02 → CAM05 point-to-point traps
          </span>
        </div>

        <div className="border border-slate-800 rounded overflow-hidden">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-2.5">Citation ID</th>
                <th className="p-2.5">Plate Number</th>
                <th className="p-2.5">Vehicle Type</th>
                <th className="p-2.5">Section Trap</th>
                <th className="p-2.5">Transit Δt</th>
                <th className="p-2.5">Speed / Limit</th>
                <th className="p-2.5">Penalty Fine</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
              {violations.map((viol) => (
                <tr key={viol.citation_id} className="hover:bg-slate-800/50">
                  <td className="p-2.5 font-bold text-cyan-400">{viol.citation_id}</td>
                  <td className="p-2.5 font-bold text-emerald-400">{viol.plate_number}</td>
                  <td className="p-2.5 text-slate-300">{viol.vehicle_type}</td>
                  <td className="p-2.5 text-slate-300">
                    {viol.entry_camera} → {viol.exit_camera} ({viol.distance_meters}m)
                  </td>
                  <td className="p-2.5 text-amber-300">{viol.time_delta_seconds}s</td>
                  <td className="p-2.5">
                    <span className="text-rose-400 font-bold">{viol.measured_speed_kmh} km/h</span>
                    <span className="text-slate-500 text-[10px]"> / {viol.speed_limit_kmh}</span>
                  </td>
                  <td className="p-2.5 font-bold text-amber-400">₹{viol.fine_amount_inr}</td>
                  <td className="p-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                        viol.status === 'PAID_ONLINE_VERIFIED'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : viol.status === 'SENT_TO_VAHAN_DATABASE'
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                          : 'bg-rose-950 text-rose-300 border-rose-800'
                      }`}
                    >
                      {viol.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-2.5 text-right">
                    <button
                      onClick={() => setSelectedCitation(viol)}
                      className="bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-800/80 px-2.5 py-1 rounded text-[10px] transition font-bold"
                    >
                      View E-Challan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Digital E-Challan Citation Official Preview Modal */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 border-4 border-slate-900 w-full max-w-3xl rounded shadow-2xl p-6 space-y-5 font-mono text-xs max-h-[92vh] overflow-y-auto">
            {/* Official Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-slate-900 text-white flex items-center justify-center font-serif text-lg font-bold">
                  🇮🇳
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wider text-slate-950 uppercase">
                    GOVERNMENT OF MAHARASHTRA · TRAFFIC POLICE CYBER CELL
                  </h3>
                  <p className="text-[11px] text-slate-600 font-sans">
                    AUTOMATED E-CHALLAN CITATION SLIP (MOTOR VEHICLES ACT 1988)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded font-bold transition text-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Official Notice</span>
                </button>
                <button
                  onClick={() => setSelectedCitation(null)}
                  className="text-slate-600 hover:text-slate-950 p-1 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Citation Details Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-3 rounded border border-slate-300 text-[11px]">
              <div>
                <span className="text-[9px] text-slate-500 block uppercase">CITATION NUMBER</span>
                <strong className="text-slate-900">{selectedCitation.citation_id}</strong>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase">VEHICLE PLATE NO.</span>
                <strong className="text-slate-900 text-xs">{selectedCitation.plate_number}</strong>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase">REGISTERED OWNER</span>
                <strong className="text-slate-900">{selectedCitation.owner_name}</strong>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase">PAYMENT DEADLINE</span>
                <strong className="text-rose-700">{selectedCitation.payment_deadline}</strong>
              </div>
            </div>

            {/* Point-to-Point Speed Proof Graphic */}
            <div className="p-4 bg-slate-50 rounded border border-slate-300 space-y-3">
              <span className="font-bold text-xs text-slate-900 uppercase block">
                Forensic Section Speed Verification & Camera Evidence
              </span>

              <div className="grid grid-cols-2 gap-4">
                {/* Entry Camera Card */}
                <div className="bg-white p-3 rounded border border-slate-300 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-600">
                    <span>ENTRY PORTAL: {selectedCitation.entry_camera}</span>
                    <span className="text-emerald-700 font-bold">TIMESTAMP T1</span>
                  </div>
                  <div className="h-28 bg-slate-200 rounded flex items-center justify-center text-slate-500 text-[10px] border border-dashed border-slate-400">
                    [CCTV ENTRY SNAPSHOT: {selectedCitation.entry_camera}]
                  </div>
                  <div className="text-[10px] text-slate-700">Time: {selectedCitation.entry_timestamp_utc}</div>
                </div>

                {/* Exit Camera Card */}
                <div className="bg-white p-3 rounded border border-slate-300 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-600">
                    <span>EXIT PORTAL: {selectedCitation.exit_camera}</span>
                    <span className="text-rose-700 font-bold">TIMESTAMP T2</span>
                  </div>
                  <div className="h-28 bg-slate-200 rounded flex items-center justify-center text-slate-500 text-[10px] border border-dashed border-slate-400">
                    [CCTV EXIT SNAPSHOT: {selectedCitation.exit_camera}]
                  </div>
                  <div className="text-[10px] text-slate-700">Time: {selectedCitation.exit_timestamp_utc}</div>
                </div>
              </div>

              {/* Mathematical ASOD Calculation Proof */}
              <div className="bg-white p-3 rounded border border-slate-300 space-y-1 text-[11px] font-sans">
                <div className="flex justify-between">
                  <span>Corridor Baseline Distance (Δd):</span>
                  <strong>{selectedCitation.distance_meters} meters</strong>
                </div>
                <div className="flex justify-between">
                  <span>Elapsed Time Interval (Δt = t₂ - t₁):</span>
                  <strong>{selectedCitation.time_delta_seconds} seconds</strong>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 text-slate-900 font-mono">
                  <span>Calculated Average Speed:</span>
                  <strong className="text-rose-700 text-sm">
                    ({selectedCitation.distance_meters}m / {selectedCitation.time_delta_seconds}s) × 3.6 = {selectedCitation.measured_speed_kmh} km/h
                  </strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Permissible Speed Limit:</span>
                  <span>{selectedCitation.speed_limit_kmh} km/h</span>
                </div>
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>Excess Speed Violation:</span>
                  <span>+{selectedCitation.excess_speed_kmh} km/h over limit</span>
                </div>
              </div>
            </div>

            {/* Fine & Payment QR Section */}
            <div className="grid grid-cols-3 gap-4 items-center bg-slate-100 p-4 rounded border border-slate-300">
              <div className="col-span-2 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">STATUTORY PENALTY AMOUNT</span>
                <span className="text-2xl font-bold text-slate-950">₹{selectedCitation.fine_amount_inr}</span>
                <p className="text-[10px] text-slate-700">{selectedCitation.legal_section}</p>
                <span className="text-[9px] text-slate-500 block">
                  Payable online via Parivahan e-Challan Portal or City Traffic Cyber Cell
                </span>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-2 bg-white rounded border border-slate-300 space-y-1">
                <QrCode className="w-16 h-16 text-slate-900" />
                <span className="text-[8px] text-slate-600 uppercase font-bold">Scan with UPI / Parivahan</span>
              </div>
            </div>

            {/* Legal Disclaimer & Jurisdiction */}
            <div className="text-[9px] text-slate-500 border-t border-slate-300 pt-2 space-y-1">
              <p>
                This is an electronically generated statutory notice under Section 133 of the Motor Vehicles Act 1988. Failure to compound or settle this notice within 15 calendar days will result in automated escalation to the Virtual Traffic Court and temporary suspension of vehicle registration.
              </p>
              <div className="flex justify-between text-slate-400">
                <span>Jurisdiction: {selectedCitation.jurisdiction}</span>
                <span>ANPR Verification Hash: SHA256:7f4a...901e</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

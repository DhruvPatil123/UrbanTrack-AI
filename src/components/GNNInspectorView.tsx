import React, { useState } from 'react';
import { GNNMatchResult } from '../types';
import { api } from '../services/api';
import { Cpu, CheckCircle2, XCircle, Sliders, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export const GNNInspectorView: React.FC = () => {
  const [plateA, setPlateA] = useState('MH12AB1234');
  const [plateB, setPlateB] = useState('MH12AB1234');
  const [camA, setCamA] = useState('CAM01');
  const [camB, setCamB] = useState('CAM02');
  const [timeDeltaSec, setTimeDeltaSec] = useState(95);
  const [matchResult, setMatchResult] = useState<GNNMatchResult | null>({
    same_vehicle_probability: 0.942,
    decision: 'same_vehicle',
    confidence: 0.94,
    model_version: 'v1.2-gnn-edge-hybrid',
    rule_baseline_score: 0.965,
    features: {
      plate_similarity: 1.0,
      reid_similarity: 0.88,
      type_match: 1.0,
      time_score: 0.97,
      topology_score: 1.0,
      time_delta_sec: 95.0
    }
  });
  const [loading, setLoading] = useState(false);

  const handleRunInference = async () => {
    setLoading(true);
    try {
      const now = Date.now() / 1000;
      const obsA = {
        observation_id: 'OBS_TEST_A',
        camera_id: camA,
        timestamp: now,
        vehicle_type: 'car',
        plate_text: plateA,
        detection_confidence: 0.94,
        reid_embedding: Array(512).fill(0.05)
      };
      const obsB = {
        observation_id: 'OBS_TEST_B',
        camera_id: camB,
        timestamp: now + timeDeltaSec,
        vehicle_type: 'car',
        plate_text: plateB,
        detection_confidence: 0.92,
        reid_embedding: Array(512).fill(0.05)
      };
      const res = await api.runGNNMatch(obsA, obsB);
      setMatchResult(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900/90 border border-slate-800 rounded p-5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="font-bold uppercase tracking-wider">
            Graph Neural Network (PyTorch Geometric) Multi-Camera Association Diagnostic
          </span>
        </div>
        <p className="text-xs text-slate-400 font-sans">
          The GNN determines whether two disparate observations across non-overlapping cameras represent the identical physical vehicle by fusing 6 distinct modalities: Plate text, Re-ID embedding, Spatial-Temporal window feasibility, and Road network topology.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Observation Pair Tester */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded p-5 space-y-4 font-mono text-xs">
          <span className="font-bold text-slate-200 uppercase block pb-2 border-b border-slate-800">
            Observation Pair Test Bench
          </span>

          {/* Observation A */}
          <div className="p-3 bg-slate-900/70 rounded border border-slate-800 space-y-2">
            <span className="text-[10px] text-cyan-400 font-bold uppercase">Observation A (Source)</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Camera:</label>
                <select
                  value={camA}
                  onChange={(e) => setCamA(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                >
                  <option value="CAM01">CAM01 (North Gate)</option>
                  <option value="CAM02">CAM02 (Univ Circle)</option>
                  <option value="CAM03">CAM03 (Tech Park)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Plate String:</label>
                <input
                  type="text"
                  value={plateA}
                  onChange={(e) => setPlateA(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Observation B */}
          <div className="p-3 bg-slate-900/70 rounded border border-slate-800 space-y-2">
            <span className="text-[10px] text-indigo-400 font-bold uppercase">Observation B (Downstream)</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Camera:</label>
                <select
                  value={camB}
                  onChange={(e) => setCamB(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                >
                  <option value="CAM02">CAM02 (Univ Circle)</option>
                  <option value="CAM05">CAM05 (Metro South)</option>
                  <option value="CAM08">CAM08 (South Ring)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Plate String:</label>
                <input
                  type="text"
                  value={plateB}
                  onChange={(e) => setPlateB(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Transit Time Slider */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Transit Time Delta:</span>
              <span className="text-cyan-300 font-bold">{timeDeltaSec} seconds</span>
            </div>
            <input
              type="range"
              min={10}
              max={400}
              value={timeDeltaSec}
              onChange={(e) => setTimeDeltaSec(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-1">
              <span>10s (Supersonic)</span>
              <span>90s (Expected)</span>
              <span>400s (Stale)</span>
            </div>
          </div>

          <button
            onClick={handleRunInference}
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold py-2 rounded transition shadow-md shadow-cyan-950/40 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            {loading ? 'Evaluating Graph Edge...' : 'Execute GNN Link Inference'}
          </button>
        </div>

        {/* Right: GNN Inference Output & Modality Breakdown */}
        <div className="lg:col-span-7 space-y-4">
          {matchResult && (
            <div className="bg-slate-950 border border-slate-800 rounded p-5 space-y-5 font-mono text-xs">
              {/* Decision Score Banner */}
              <div className="flex items-center justify-between p-4 rounded bg-slate-900 border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">GNN LINK PREDICTION</span>
                  <div className="text-2xl font-bold text-cyan-300">
                    P(same_vehicle) = {(matchResult.same_vehicle_probability * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded border uppercase ${
                      matchResult.decision === 'same_vehicle'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : 'bg-rose-950 text-rose-300 border-rose-700'
                    }`}
                  >
                    {matchResult.decision === 'same_vehicle' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    {matchResult.decision}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-1">
                    Rule Baseline: {(matchResult.rule_baseline_score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Multi-Signal Feature Breakdown Bars */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase block">
                  Modality Feature Contributions
                </span>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>License Plate Levenshtein String Match:</span>
                      <span className="text-slate-200">{(matchResult.features.plate_similarity * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded"
                        style={{ width: `${matchResult.features.plate_similarity * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Vehicle Appearance (512-d Re-ID Cosine Sim):</span>
                      <span className="text-slate-200">{(matchResult.features.reid_similarity * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 rounded"
                        style={{ width: `${matchResult.features.reid_similarity * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Spatial-Temporal Feasibility Window Score:</span>
                      <span className="text-slate-200">{(matchResult.features.time_score * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded"
                        style={{ width: `${matchResult.features.time_score * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Camera Network Road Topology Priors:</span>
                      <span className="text-slate-200">{(matchResult.features.topology_score * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded"
                        style={{ width: `${matchResult.features.topology_score * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Architecture Model Summary */}
              <div className="p-3 bg-slate-900/60 rounded border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Model Architecture: EdgeConv + MLP Classifier</span>
                <span>Active Model: <strong className="text-slate-200">{matchResult.model_version}</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { FileText, BookOpen, Layers, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';

export const ArchitectureDocsView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* SIH Identity Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded p-6 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h1 className="text-base font-bold text-slate-100">URBANTRACK AI</h1>
            <p className="text-slate-400 mt-0.5">
              City-Wide AI Engine for Multi-Camera ANPR Trajectory Tracking and Urban Traffic Analytics
            </p>
          </div>
          <div className="text-right">
            <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded text-[11px] font-bold">
              SIH26127
            </span>
            <span className="block text-[11px] text-slate-400 mt-1">Team AI007 · RepoRiders</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3 bg-slate-950 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">CORE GOAL</span>
            <span className="text-slate-300">
              Transforming "Watching CCTV cameras" into "Understanding and predicting city traffic."
            </span>
          </div>
          <div className="p-3 bg-slate-950 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">PRIMARY INNOVATION</span>
            <span className="text-slate-300">
              6-Signal Association (Plate + Re-ID + Time + Distance + Camera Topology + GNN).
            </span>
          </div>
          <div className="p-3 bg-slate-950 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">DEPLOYMENT RESILIENCE</span>
            <span className="text-slate-300">
              Full Docker stack + Deterministic-to-Learned CPU Fallback Engine.
            </span>
          </div>
        </div>
      </div>

      {/* End-to-End Pipeline Overview */}
      <div className="bg-slate-950 border border-slate-800 rounded p-6 space-y-4 font-mono text-xs">
        <span className="font-bold text-slate-200 uppercase block text-sm pb-2 border-b border-slate-800">
          1. System Pipeline Architecture
        </span>

        <div className="p-4 bg-slate-900/60 rounded border border-slate-800 text-slate-300 space-y-2 leading-relaxed">
          <p>
            1. <strong>Video Ingestion</strong>: Connects RTSP feeds / file streams with adaptive frame skipping and timestamp stamping.
          </p>
          <p>
            2. <strong>Computer Vision Edge</strong>: YOLO detects vehicle bounding boxes and plate crops; ByteTrack assigns local track IDs with Kalman smoothing.
          </p>
          <p>
            3. <strong>Feature Extraction</strong>: ANPR service normalizes plate strings (Indian HSRP formats); OSNet extracts 512-dim visual appearance embeddings.
          </p>
          <p>
            4. <strong>Candidate Filtering</strong>: Prunes downstream cameras based on physical road distance and transit time feasibility windows.
          </p>
          <p>
            5. <strong>GNN Link Matching</strong>: PyTorch Geometric Edge Classifier predicts <code className="text-cyan-400">P(same_vehicle)</code> with RuleBasedMatcher fallback.
          </p>
          <p>
            6. <strong>Global Trajectory Engine</strong>: Connects multi-camera hops into a unified <code className="text-cyan-400">V000XXX</code> journey, computing transit speeds and verifying path integrity.
          </p>
          <p>
            7. <strong>Traffic Intelligence</strong>: Computes segment density, flow (veh/h), travel-time index, detects wrong-way/stopped vehicles, and forecasts emerging bottlenecks.
          </p>
        </div>
      </div>

      {/* Research References */}
      <div className="bg-slate-950 border border-slate-800 rounded p-6 space-y-3 font-mono text-xs">
        <span className="font-bold text-slate-200 uppercase block text-sm pb-2 border-b border-slate-800">
          2. Research Grounding & Academic References
        </span>

        <ul className="space-y-2 text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold">[1]</span>
            <span>
              <strong>Tang et al.</strong>, <em>"CityFlow: A City-Scale Benchmark for Multi-Target Multi-Camera Vehicle Tracking and Re-Identification"</em>, CVPR 2019.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold">[2]</span>
            <span>
              <strong>Tran et al.</strong>, <em>"A Robust Traffic-Aware City-Scale Multi-Camera Vehicle Tracking of Vehicles"</em>, CVPR Workshops 2022.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold">[3]</span>
            <span>
              <strong>Zapletal & Herout</strong>, <em>"Vehicle Re-Identification for Automatic Video Traffic Surveillance"</em>, CVPR Workshops 2016.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold">[4]</span>
            <span>
              <strong>Wu et al.</strong>, <em>"A Multi-Camera Vehicle Tracking System Based on City-Scale Vehicle Re-ID and Spatial-Temporal Information"</em>, CVPR Workshops 2021.
            </span>
          </li>
        </ul>
      </div>

      {/* Operational Limitations & Disclosures */}
      <div className="bg-slate-950 border border-slate-800 rounded p-6 space-y-3 font-mono text-xs">
        <span className="font-bold text-amber-400 uppercase block text-sm pb-2 border-b border-slate-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          3. Real-World Physical Constraints & Disclosures
        </span>

        <p className="text-slate-300 leading-relaxed">
          URBANTRACK AI explicitly reports confidence scores on all detection, OCR, and association decisions. Known real-world operational challenges include:
        </p>

        <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
          <li>Low-resolution license plates under heavy rain, high speed, or severe oblique viewing angles.</li>
          <li>Night headlight glare and backscattering affecting visual Re-ID color accuracy.</li>
          <li>Non-overlapping camera blind spots where unmonitored arterial alleys permit vehicles to leave the corridor.</li>
          <li>Similar-looking commercial fleet vehicles (e.g. identical white delivery vans or municipal buses).</li>
        </ul>
      </div>
    </div>
  );
};

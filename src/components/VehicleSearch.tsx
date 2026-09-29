import React, { useState } from 'react';
import { Vehicle, Trajectory } from '../types';
import { Search, Car, Navigation, Shield, CheckCircle2, Clock, MapPin, ArrowRight } from 'lucide-react';

interface VehicleSearchProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  trajectory: Trajectory | null;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onShowOnMap: () => void;
}

export const VehicleSearch: React.FC<VehicleSearchProps> = ({
  vehicles,
  selectedVehicle,
  trajectory,
  onSelectVehicle,
  onShowOnMap
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filteredVehicles = vehicles.filter((v) => {
    const matchesQuery =
      v.global_vehicle_id.toUpperCase().includes(searchQuery.toUpperCase()) ||
      v.plate_number.toUpperCase().includes(searchQuery.toUpperCase());
    const matchesType = typeFilter === 'ALL' || v.vehicle_type.toUpperCase() === typeFilter;
    return matchesQuery && matchesType;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Search & Vehicle List */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Search className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold uppercase tracking-wider">Multi-Camera Vehicle Search</span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Plate (e.g. MH12AB1234) or Global ID (V000123)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 pt-1">
            {['ALL', 'CAR', 'TRUCK', 'BUS', 'MOTORCYCLE'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`text-[11px] font-mono px-2 py-0.5 rounded transition ${
                  typeFilter === t
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle Results List */}
        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {filteredVehicles.map((v) => {
            const isSelected = selectedVehicle?.global_vehicle_id === v.global_vehicle_id;
            return (
              <div
                key={v.global_vehicle_id}
                onClick={() => onSelectVehicle(v)}
                className={`p-3 rounded border font-mono text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-700 shadow-md shadow-cyan-950/40 text-slate-100'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Car className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span className="font-bold text-slate-100">{v.global_vehicle_id}</span>
                    <span className="text-[10px] uppercase bg-slate-800 text-slate-300 px-1 rounded">
                      {v.vehicle_type}
                    </span>
                  </div>
                  <span className="font-bold tracking-wider text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-1.5 py-0.5 rounded">
                    {v.plate_number}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span>Traversed: {v.camera_sequence.join(' → ')}</span>
                  <span className="text-slate-300">{v.total_distance_km} km</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Reconstructed Trajectory & Journey Details */}
      <div className="lg:col-span-7">
        {selectedVehicle && trajectory ? (
          <div className="bg-slate-900/90 border border-slate-800 rounded p-5 space-y-5">
            {/* Header Badge & Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-cyan-300">
                    {selectedVehicle.global_vehicle_id}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {selectedVehicle.plate_number}
                  </span>
                  <span className="text-xs font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    {selectedVehicle.vehicle_type}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400 mt-1">
                  Validated Cross-Camera Trajectory Profile
                </p>
              </div>

              <button
                onClick={onShowOnMap}
                className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs px-3 py-1.5 rounded transition shadow-md shadow-cyan-950/40"
              >
                <Navigation className="w-3.5 h-3.5" />
                Highlight on City Map
              </button>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">TOTAL DISTANCE</span>
                <span className="text-base font-bold text-slate-100">{trajectory.total_distance_km} km</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">TOTAL DURATION</span>
                <span className="text-base font-bold text-cyan-400">
                  {(trajectory.total_duration_sec / 60).toFixed(1)} mins
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">AVERAGE SPEED</span>
                <span className="text-base font-bold text-emerald-400">{trajectory.avg_speed_kmh} km/h</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">INTEGRITY STATUS</span>
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {trajectory.status}
                </span>
              </div>
            </div>

            {/* Multi-Hop Timeline */}
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Chronological Multi-Camera Transit Hops
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {trajectory.segments.map((seg, idx) => (
                  <div key={idx} className="relative">
                    {/* Node Dot */}
                    <span className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-cyan-400 border-2 border-slate-950 ring-2 ring-cyan-900" />

                    <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-slate-200">
                          <span>{seg.from_camera_id}</span>
                          <ArrowRight className="w-3 h-3 text-cyan-400" />
                          <span>{seg.to_camera_id}</span>
                        </div>
                        <span className="text-emerald-400 font-semibold">{seg.speed_kmh} km/h</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Road Corridor: <span className="text-slate-300">{seg.road_id}</span></span>
                        <span>Transit Time: <span className="text-cyan-300">{seg.duration_sec}s</span> ({seg.distance_meters}m)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Path Summary */}
            <div className="p-3 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>Full Topology Corridor:</span>
              <span className="text-cyan-300 font-bold">{trajectory.path_summary}</span>
            </div>
          </div>
        ) : (
          <div className="h-[460px] bg-slate-900/40 border border-dashed border-slate-800 rounded flex flex-col items-center justify-center p-6 text-center text-slate-500 font-mono text-xs space-y-2">
            <Car className="w-8 h-8 text-slate-600" />
            <p>Select a vehicle from the search list to inspect its reconstructed trajectory.</p>
          </div>
        )}
      </div>
    </div>
  );
};

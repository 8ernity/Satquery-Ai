"use client";

import React, { useState } from "react";
import { assessDisasterRisk, calculateEvacuationCorridor } from "../../lib/api";

const DISASTER_PRESETS = [
  {
    id: "brahmaputra_flood",
    name: "Brahmaputra Flood Plain, Assam",
    type: "flood",
    lat: 26.2006,
    lon: 92.9376,
    safeLat: 26.2800,
    safeLon: 93.0100,
    weather: "Monsoon Inundation > 150mm / 24h",
    imgPast: "/assets/demo-construction-before.png",
    imgLive: "/assets/demo-flood-post-sar.png",
  },
  {
    id: "kedarnath_landslide",
    name: "Kedarnath Valley, Uttarakhand",
    type: "landslide",
    lat: 30.7346,
    lon: 79.0669,
    safeLat: 30.6800,
    safeLon: 79.1300,
    weather: "Glacial Melting & Continuous Cloudburst",
    imgPast: "/assets/demo-construction-before.png",
    imgLive: "/assets/demo-construction-after.png",
  },
  {
    id: "coastal_cyclone",
    name: "Odisha Coastal Corridor (Puri - Paradip)",
    type: "cyclone",
    lat: 19.8135,
    lon: 85.8312,
    safeLat: 20.1500,
    safeLon: 85.6500,
    weather: "Very Severe Cyclonic Storm (140 km/h wind)",
    imgPast: "/assets/demo-flood-post-sar.png",
    imgLive: "/assets/demo-flood-post-sar.png",
  },
];

export function DisasterRoutingView() {
  const [selectedPreset, setSelectedPreset] = useState(DISASTER_PRESETS[0]);
  const [originLat, setOriginLat] = useState<number>(DISASTER_PRESETS[0].lat);
  const [originLon, setOriginLon] = useState<number>(DISASTER_PRESETS[0].lon);
  const [destLat, setDestLat] = useState<number>(DISASTER_PRESETS[0].safeLat);
  const [destLon, setDestLon] = useState<number>(DISASTER_PRESETS[0].safeLon);
  const [disasterType, setDisasterType] = useState<string>("flood");
  const [weatherCondition, setWeatherCondition] = useState<string>(DISASTER_PRESETS[0].weather);

  const [imgPast, setImgPast] = useState<string>(DISASTER_PRESETS[0].imgPast);
  const [imgLive, setImgLive] = useState<string>(DISASTER_PRESETS[0].imgLive);

  const [isAssessing, setIsAssessing] = useState<boolean>(false);
  const [isCalculatingEvac, setIsCalculatingEvac] = useState<boolean>(false);
  const [assessmentResult, setAssessmentResult] = useState<any | null>(null);
  const [evacuationResult, setEvacuationResult] = useState<any | null>(null);

  const handleSelectPreset = (preset: typeof DISASTER_PRESETS[0]) => {
    setSelectedPreset(preset);
    setOriginLat(preset.lat);
    setOriginLon(preset.lon);
    setDestLat(preset.safeLat);
    setDestLon(preset.safeLon);
    setDisasterType(preset.type);
    setWeatherCondition(preset.weather);
    setImgPast(preset.imgPast);
    setImgLive(preset.imgLive);
    setAssessmentResult(null);
    setEvacuationResult(null);
  };

  const handleAssessDisaster = async () => {
    setIsAssessing(true);
    try {
      const payload = {
        location_name: selectedPreset.name,
        lat: originLat,
        lon: originLon,
        disaster_type: disasterType,
        past_image_url: imgPast,
        current_image_url: imgLive,
        weather_condition: weatherCondition,
      };
      const res = await assessDisasterRisk(payload);
      setAssessmentResult(res);
      // Auto populate connected evacuation result if returned
      if (res.evacuation_corridor) {
        setEvacuationResult(res.evacuation_corridor);
      }
    } catch (err) {
      console.error("Disaster assessment failed:", err);
    } finally {
      setIsAssessing(false);
    }
  };

  const handleCalculateEvacuationCorridor = async () => {
    setIsCalculatingEvac(true);
    try {
      const payload = {
        origin_lat: originLat,
        origin_lon: originLon,
        dest_lat: destLat,
        dest_lon: destLon,
        disaster_type: disasterType,
      };
      const res = await calculateEvacuationCorridor(payload);
      setEvacuationResult(res);
    } catch (err) {
      console.error("Evacuation corridor calculation failed:", err);
    } finally {
      setIsCalculatingEvac(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 text-white select-none">
      {/* Header Strip */}
      <div className="bg-[#090E1A] border border-amber-500/40 p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold uppercase tracking-wider">
              Emergency Logistics Command
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold uppercase tracking-wider">
              NDRF // DISASTER RESILIENCE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight">
            Disaster Probability &amp; Evacuation Corridor Console
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 font-mono">
            Compare previous baseline vs live weather/satellite images to calculate empirical disaster probability and dispatch safe evacuation routes.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#050811] px-4 py-3 rounded-xl border border-[#1F2937] font-mono text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-gray-300">OSRM Geodesic Bypass: ACTIVE</span>
        </div>
      </div>

      {/* Preset Zone Cards */}
      <div>
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 mb-2">
          Target Disaster Scenarios
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DISASTER_PRESETS.map((p) => (
            <div
              key={p.id}
              onClick={() => handleSelectPreset(p)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                selectedPreset.id === p.id
                  ? "bg-[#181106] border-amber-400 shadow-lg shadow-amber-950/60"
                  : "bg-[#090E1A] border-[#1F2937] hover:border-gray-600"
              }`}
            >
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-amber-400">{p.type}</span>
                <h3 className="text-xs font-bold text-white mt-1">{p.name}</h3>
                <p className="text-[11px] text-gray-400 font-mono mt-1">{p.weather}</p>
              </div>
              <div className="mt-3 text-[10px] font-mono text-amber-300 flex items-center justify-between border-t border-[#1F2937] pt-2">
                <span>Select Scenario</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Imagery & Parameter Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Dual Satellite Image Inspection */}
        <div className="bg-[#090E1A] border border-[#1F2937] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
              1. Multi-Temporal Image Verification
            </span>
            <span className="text-[10px] font-mono text-gray-400">Past Baseline vs Live Weather</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-gray-400">T0: Previous Image (Dry/Baseline)</span>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-[#1F2937]">
                <img src={imgPast} alt="Past" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-gray-400">T1: Live Weather/Radar Raster</span>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-amber-500/50">
                <img src={imgLive} alt="Live" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-gray-400 mb-1">Live Meteorological Condition</label>
            <input
              type="text"
              value={weatherCondition}
              onChange={(e) => setWeatherCondition(e.target.value)}
              className="w-full bg-[#111827] border border-[#1F2937] text-white px-3 py-2 rounded-lg text-xs font-mono outline-none"
            />
          </div>

          <button
            onClick={handleAssessDisaster}
            disabled={isAssessing}
            className={`w-full py-3 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
              isAssessing
                ? "bg-amber-950 text-amber-400 border border-amber-500/50 animate-pulse cursor-wait"
                : "bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white shadow-amber-600/30"
            }`}
          >
            {isAssessing ? (
              <>
                <svg className="w-4 h-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Evaluating Image Differences &amp; Disaster Risk...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>Calculate Disaster Risk Probability</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Coordinates & Evacuation Routing Form */}
        <div className="bg-[#090E1A] border border-[#1F2937] rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3 mb-4">
              <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
                2. Evacuation Corridor Routing
              </span>
              <span className="text-[10px] font-mono text-gray-400">OSRM Geodesic Bypass</span>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Evac Origin Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={originLat}
                  onChange={(e) => setOriginLat(parseFloat(e.target.value))}
                  className="w-full bg-[#111827] border border-[#1F2937] text-white px-3 py-2 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Evac Origin Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={originLon}
                  onChange={(e) => setOriginLon(parseFloat(e.target.value))}
                  className="w-full bg-[#111827] border border-[#1F2937] text-white px-3 py-2 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Safe Destination Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={destLat}
                  onChange={(e) => setDestLat(parseFloat(e.target.value))}
                  className="w-full bg-[#111827] border border-[#1F2937] text-white px-3 py-2 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Safe Destination Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={destLon}
                  onChange={(e) => setDestLon(parseFloat(e.target.value))}
                  className="w-full bg-[#111827] border border-[#1F2937] text-white px-3 py-2 rounded-lg outline-none"
                />
              </div>
            </div>
          </div>

          {/* THE REQUESTED FULLY FUNCTIONAL BUTTON */}
          <button
            onClick={handleCalculateEvacuationCorridor}
            disabled={isCalculatingEvac}
            className={`w-full py-3 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
              isCalculatingEvac
                ? "bg-emerald-950 text-emerald-400 border border-emerald-500/50 animate-pulse cursor-wait"
                : "bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-emerald-600/30"
            }`}
          >
            {isCalculatingEvac ? (
              <>
                <svg className="w-4 h-4 animate-spin text-emerald-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Calculating Flood-Clear Bypass Route...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="3 11 22 2 13 21 11 13 3 11" />
                </svg>
                <span>Calculate Evacuation Corridor</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Disaster Assessment Output Card */}
      {assessmentResult && (
        <div className="bg-[#0B1528] border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-xl font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1F2937] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h2 className="font-bold text-sm text-white">
                DISASTER IMPACT ASSESSMENT: {assessmentResult.location_name}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-500/40 font-bold">
                SEVERITY: {assessmentResult.hazard_severity}
              </span>
              <span className="px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-500/40 font-bold">
                DISASTER CHANCE: {assessmentResult.disaster_probability_pct}%
              </span>
            </div>
          </div>

          <p className="text-gray-200 leading-relaxed bg-[#070B14] p-4 rounded-xl border border-[#1F2937] text-[11px]">
            {assessmentResult.impact_summary}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#070B14] p-3 rounded-lg border border-[#1F2937]">
              <div className="text-[10px] text-gray-400 uppercase">Affected Area</div>
              <div className="text-sm font-bold text-cyan-300 mt-1">{assessmentResult.affected_area_sqkm} km²</div>
            </div>
            <div className="bg-[#070B14] p-3 rounded-lg border border-[#1F2937]">
              <div className="text-[10px] text-gray-400 uppercase">Population at Risk</div>
              <div className="text-sm font-bold text-amber-300 mt-1">
                {assessmentResult.estimated_population_at_risk?.toLocaleString()} Citizens
              </div>
            </div>
            <div className="bg-[#070B14] p-3 rounded-lg border border-[#1F2937]">
              <div className="text-[10px] text-gray-400 uppercase">Threat Profile</div>
              <div className="text-sm font-bold text-rose-300 mt-1">{assessmentResult.disaster_type}</div>
            </div>
            <div className="bg-[#070B14] p-3 rounded-lg border border-[#1F2937]">
              <div className="text-[10px] text-gray-400 uppercase">Radar Evidence</div>
              <div className="text-[11px] font-bold text-emerald-400 mt-1">Specular SAR Verified</div>
            </div>
          </div>

          <div className="bg-[#070B14] p-3 rounded-lg border border-[#1F2937] text-[11px]">
            <span className="text-amber-400 font-bold">Threatened Critical Infrastructure: </span>
            <span className="text-gray-300">{assessmentResult.critical_infrastructure_threatened?.join(" • ")}</span>
          </div>
        </div>
      )}

      {/* Evacuation Corridor Output Card */}
      {evacuationResult && (
        <div className="bg-[#091522] border border-emerald-500/40 rounded-2xl p-6 space-y-4 shadow-xl font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1F2937] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="font-bold text-sm text-white">
                TACTICAL EVACUATION CORRIDOR: {evacuationResult.corridor_name}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-500/40">
                Primary: {evacuationResult.primary_route_status.toUpperCase()}
              </span>
              <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                EST TRANSIT: {evacuationResult.estimated_transit_minutes} MINS
              </span>
            </div>
          </div>

          {/* Hazard Warnings */}
          <div className="space-y-1.5">
            {evacuationResult.hazard_warnings?.map((w: string, idx: number) => (
              <div key={idx} className="p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-lg text-rose-200 text-[11px]">
                ⚠ {w}
              </div>
            ))}
          </div>

          {/* Traffic Segments Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2">
              Evacuation Logistics Arterials
            </h3>
            <div className="space-y-2">
              {evacuationResult.traffic_segments?.map((seg: any) => (
                <div
                  key={seg.segment_id}
                  className="p-3 bg-[#070B14] border border-[#1F2937] rounded-xl flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-white text-xs">{seg.road_name}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      Status: <span className={seg.congestion_level === "blocked" ? "text-rose-400" : "text-emerald-400"}>{seg.status}</span> | Speed: {seg.speed_kmh} km/h (Free: {seg.free_flow_speed_kmh} km/h)
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border ${
                      seg.congestion_level === "blocked"
                        ? "bg-rose-950 text-rose-400 border-rose-500/40"
                        : "bg-emerald-950 text-emerald-400 border-emerald-500/40"
                    }`}
                  >
                    {seg.congestion_level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

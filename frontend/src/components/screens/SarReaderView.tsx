"use client";

import React, { useState, useEffect } from "react";
import { fetchSarPresets, processSarRadar } from "../../lib/api";

export function SarReaderView() {
  const [presets, setPresets] = useState<any[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("brahmaputra_flood");
  const [polarization, setPolarization] = useState<string>("VV");
  const [applyLeeFilter, setApplyLeeFilter] = useState<boolean>(true);
  const [windowSize, setWindowSize] = useState<number>(5);
  const [waterThreshold, setWaterThreshold] = useState<number>(-15.0);
  const [urbanThreshold, setUrbanThreshold] = useState<number>(-6.0);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [sarData, setSarData] = useState<any | null>(null);

  useEffect(() => {
    fetchSarPresets().then((data) => {
      setPresets(data);
      if (data.length > 0) {
        handleExecuteProcessing(data[0].id);
      }
    });
  }, []);

  const handleExecuteProcessing = async (presetId: string = selectedPresetId) => {
    setIsProcessing(true);
    try {
      const payload = {
        preset_id: presetId,
        polarization,
        apply_lee_filter: applyLeeFilter,
        filter_window_size: windowSize,
        water_threshold_db: waterThreshold,
        urban_threshold_db: urbanThreshold,
      };
      const res = await processSarRadar(payload);
      setSarData(res);
    } catch (err) {
      console.error("SAR processing error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePresetSelect = (id: string) => {
    setSelectedPresetId(id);
    handleExecuteProcessing(id);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 text-white select-none font-sans">
      {/* Header Banner */}
      <div className="bg-[#090E1A] border border-cyan-500/30 p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold uppercase tracking-wider">
              Synthetic Aperture Radar (SAR)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold uppercase tracking-wider">
              Copernicus Sentinel-1 &bull; RISAT-1A
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight">
            SAR Reader &amp; Radar Physics Intelligence Console
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 font-mono">
            Calibrated microwave backscatter (σ° dB), Lee filter speckle reduction, dual-pol decomposition, and InSAR millimeter subsidence.
          </p>
        </div>

        {/* Live Radar Physics Status */}
        <div className="bg-[#050811] border border-cyan-500/40 px-4 py-3 rounded-xl font-mono text-xs flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <div>
            <div className="text-[10px] text-gray-400 uppercase">C-Band Frequency</div>
            <div className="font-bold text-cyan-300">5.405 GHz (λ = 5.547 cm)</div>
          </div>
        </div>
      </div>

      {/* Preset Selector */}
      <div>
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 mb-2">
          Target Radar Acquisitions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.map((p) => (
            <div
              key={p.id}
              onClick={() => handlePresetSelect(p.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                selectedPresetId === p.id
                  ? "bg-[#0C1C36] border-cyan-400 shadow-lg shadow-cyan-950/60"
                  : "bg-[#090E1A] border-[#1F2937] hover:border-gray-600"
              }`}
            >
              <div>
                <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase">SAR Preset</span>
                <h3 className="text-xs font-bold text-white mt-1">{p.name}</h3>
                <p className="text-[10px] text-gray-400 font-mono mt-1">{p.sensor}</p>
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-gray-400 border-t border-[#1F2937] pt-2">
                <span>Coordinates</span>
                <span className="text-cyan-400">[{p.lat.toFixed(2)}, {p.lon.toFixed(2)}]</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Control Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Polarimetry & Filter Controls */}
        <div className="bg-[#090E1A] border border-[#1F2937] rounded-xl p-5 space-y-4 font-mono text-xs">
          <div className="border-b border-[#1F2937] pb-3 flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-cyan-400">
              Polarimetry &amp; Filtering
            </span>
            <span className="text-[10px] text-gray-400">Physics Controls</span>
          </div>

          <div>
            <label className="block text-gray-400 mb-1">Polarization Channel</label>
            <div className="grid grid-cols-3 gap-2">
              {["VV", "VH", "VV_VH_RATIO"].map((pol) => (
                <button
                  key={pol}
                  onClick={() => setPolarization(pol)}
                  className={`py-2 rounded-lg transition-all cursor-pointer border ${
                    polarization === pol
                      ? "bg-cyan-600 border-cyan-400 text-white font-bold"
                      : "bg-[#111827] border-[#1F2937] text-gray-400 hover:text-white"
                  }`}
                >
                  {pol === "VV_VH_RATIO" ? "VV / VH Ratio" : pol}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between bg-[#111827] p-3 rounded-lg border border-[#1F2937]">
            <div>
              <div className="font-bold text-white">Enhanced Lee Filter</div>
              <div className="text-[10px] text-gray-400">Multiplicative speckle reduction</div>
            </div>
            <input
              type="checkbox"
              checked={applyLeeFilter}
              onChange={(e) => setApplyLeeFilter(e.target.checked)}
              className="w-4 h-4 accent-cyan-400 cursor-pointer"
            />
          </div>

          {applyLeeFilter && (
            <div>
              <label className="block text-gray-400 mb-1">Filter Kernel Window: {windowSize}x{windowSize}</label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 5, 7].map((s) => (
                  <button
                    key={s}
                    onClick={() => setWindowSize(s)}
                    className={`py-1.5 rounded-lg border ${
                      windowSize === s
                        ? "bg-purple-600 border-purple-400 text-white font-bold"
                        : "bg-[#111827] border-[#1F2937] text-gray-400"
                    }`}
                  >
                    {s}x{s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-gray-400">Water Specular Threshold</span>
              <span className="text-cyan-300 font-bold">{waterThreshold} dB</span>
            </div>
            <input
              type="range"
              min="-25.0"
              max="-10.0"
              step="0.5"
              value={waterThreshold}
              onChange={(e) => setWaterThreshold(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-gray-400">Urban Double-Bounce Threshold</span>
              <span className="text-amber-300 font-bold">{urbanThreshold} dB</span>
            </div>
            <input
              type="range"
              min="-10.0"
              max="0.0"
              step="0.5"
              value={urbanThreshold}
              onChange={(e) => setUrbanThreshold(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          <button
            onClick={() => handleExecuteProcessing()}
            disabled={isProcessing}
            className={`w-full py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              isProcessing
                ? "bg-cyan-950 text-cyan-400 border border-cyan-500/40 animate-pulse cursor-wait"
                : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30"
            }`}
          >
            {isProcessing ? "Recalibrating SAR Raster..." : "Recalibrate SAR Analysis"}
          </button>
        </div>

        {/* Right 2 Cols: Backscatter Histogram & Coverage */}
        <div className="lg:col-span-2 bg-[#090E1A] border border-[#1F2937] rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-[#1F2937] pb-3 flex items-center justify-between font-mono text-xs">
              <span className="font-bold uppercase tracking-wider text-cyan-300">
                Calibrated Backscatter (σ° dB) Distribution Histogram
              </span>
              <span className="text-[10px] text-gray-400">30 Physical Bins</span>
            </div>

            {/* Backscatter Histogram Bars */}
            {sarData?.histogram && (
              <div className="mt-4 space-y-2">
                <div className="h-40 flex items-end gap-1.5 bg-[#050811] p-3 rounded-xl border border-[#1F2937]">
                  {sarData.histogram.map((bin: any, idx: number) => {
                    const maxFreq = Math.max(...sarData.histogram.map((b: any) => b.frequency), 1);
                    const heightPct = Math.max(8, (bin.frequency / maxFreq) * 100);
                    const isWater = bin.bin_center_db < waterThreshold;
                    const isUrban = bin.bin_center_db > urbanThreshold;

                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center group relative cursor-pointer"
                      >
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full rounded-t-sm transition-all ${
                            isWater
                              ? "bg-cyan-500 hover:bg-cyan-300"
                              : isUrban
                              ? "bg-amber-500 hover:bg-amber-300"
                              : "bg-emerald-500 hover:bg-emerald-300"
                          }`}
                        />
                        {/* Hover Tooltip */}
                        <div className="hidden group-hover:block absolute bottom-full mb-1 bg-black/90 text-[9px] font-mono text-white px-2 py-1 rounded shadow-lg border border-gray-700 whitespace-nowrap z-20">
                          {bin.bin_center_db} dB &bull; {bin.label}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Histogram Legend */}
                <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 pt-1">
                  <span>-35 dB (Dark Returns)</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-cyan-400" /> Specular Water
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-emerald-400" /> Rough Soil/Veg
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-amber-400" /> Urban/Metallic
                    </span>
                  </div>
                  <span>+15 dB (Double Bounce)</span>
                </div>
              </div>
            )}
          </div>

          {/* Calibrated Metrics Chips */}
          {sarData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="bg-[#070B14] p-3 rounded-lg border border-[#1F2937]">
                <div className="text-[10px] text-gray-400 uppercase">Mean Backscatter</div>
                <div className="text-sm font-bold text-cyan-300 mt-0.5">{sarData.mean_backscatter_db} dB</div>
              </div>
              <div className="bg-[#070B14] p-3 rounded-lg border border-[#1F2937]">
                <div className="text-[10px] text-gray-400 uppercase">Water Coverage</div>
                <div className="text-sm font-bold text-blue-400 mt-0.5">{sarData.water_coverage_pct}%</div>
              </div>
              <div className="bg-[#070B14] p-3 rounded-lg border border-[#1F2937]">
                <div className="text-[10px] text-gray-400 uppercase">Urban Structure</div>
                <div className="text-sm font-bold text-amber-400 mt-0.5">{sarData.urban_structural_pct}%</div>
              </div>
              <div className="bg-[#070B14] p-3 rounded-lg border border-[#1F2937]">
                <div className="text-[10px] text-gray-400 uppercase">Vegetation/Rough</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">{sarData.vegetation_rough_pct}%</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* InSAR Millimeter Subsidence & Physical Interpretation */}
      {sarData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: InSAR Subsidence */}
          <div className="bg-[#090E1A] border border-cyan-500/30 rounded-xl p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <span className="font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                InSAR Interferometric Subsidence Profile
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40 text-[10px]">
                {sarData.insar_subsidence_profile?.risk_level}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#070B14] p-3 rounded-lg border border-[#1F2937]">
                <div className="text-[10px] text-gray-400 uppercase">Interferometric Coherence (γ)</div>
                <div className="text-sm font-bold text-emerald-400 mt-1">
                  {sarData.insar_subsidence_profile?.coherence_mean}
                </div>
              </div>
              <div className="bg-[#070B14] p-3 rounded-lg border border-[#1F2937]">
                <div className="text-[10px] text-gray-400 uppercase">Max Deformation Velocity</div>
                <div className="text-sm font-bold text-rose-400 mt-1">
                  {sarData.insar_subsidence_profile?.max_subsidence_mm_year} mm/year
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] text-gray-400 uppercase block">Monitored Ground Control Points</span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {sarData.insar_subsidence_profile?.sample_points?.map((pt: any) => (
                  <div
                    key={pt.point_id}
                    className="flex items-center justify-between p-2 bg-[#070B14] border border-[#1F2937] rounded-lg text-[10px]"
                  >
                    <span className="font-bold text-gray-300">{pt.point_id}</span>
                    <span className="text-gray-400">[{pt.lat.toFixed(4)}, {pt.lon.toFixed(4)}]</span>
                    <span className={pt.displacement_mm_year < -10 ? "text-rose-400 font-bold" : "text-gray-300"}>
                      {pt.displacement_mm_year} mm/yr
                    </span>
                    <span className="text-cyan-400">γ = {pt.coherence}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Radar Interpretation & Operational Directives */}
          <div className="bg-[#090E1A] border border-[#1F2937] rounded-xl p-5 space-y-4 font-mono text-xs flex flex-col justify-between">
            <div>
              <div className="border-b border-[#1F2937] pb-3 mb-3">
                <span className="font-bold uppercase tracking-wider text-cyan-300">
                  Physical Radar Interpretation
                </span>
              </div>
              <p className="text-gray-200 leading-relaxed text-[11px] bg-[#070B14] p-4 rounded-xl border border-[#1F2937]">
                {sarData.physical_interpretation}
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-2">
                Operational Directives
              </span>
              <div className="space-y-1.5">
                {sarData.operational_recommendations?.map((rec: string, idx: number) => (
                  <div key={idx} className="p-2.5 bg-[#070B14] border border-[#1F2937] rounded-lg text-cyan-200 text-[10px]">
                    ✓ {rec}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

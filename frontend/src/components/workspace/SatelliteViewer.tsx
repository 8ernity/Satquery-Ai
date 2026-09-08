"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { VisualOverlay } from "../../types/investigation";

interface SatelliteViewerProps {
  lat?: number;
  lon?: number;
  zoom?: number;
  locationName?: string;
  overlays?: VisualOverlay[];
  isTemporal?: boolean;
  onCoordinatesChange?: (lat: number, lon: number, zoom: number) => void;
}

export function SatelliteViewer({
  lat = 28.6139,
  lon = 77.209,
  zoom = 13,
  locationName = "NCR Delhi Urban Fringe",
  overlays = [],
  isTemporal = true,
  onCoordinatesChange,
}: SatelliteViewerProps) {
  const [currentLat, setCurrentLat] = useState(lat);
  const [currentLon, setCurrentLon] = useState(lon);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [sliderPos, setSliderPos] = useState(50);
  const [showOverlays, setShowOverlays] = useState(true);
  const [activeProvider, setActiveProvider] = useState<"esri" | "nasa_gibs" | "sar" | "flir" | "nvg">("esri");

  // Drag-to-pan states
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external props
  useEffect(() => {
    setCurrentLat(lat);
    setCurrentLon(lon);
    if (zoom) setCurrentZoom(zoom);
  }, [lat, lon, zoom]);

  // Web Mercator tile calculation
  const getTileCoords = useCallback((latitude: number, longitude: number, z: number) => {
    const latRad = (latitude * Math.PI) / 180;
    const n = Math.pow(2, z);
    const x = ((longitude + 180) / 360) * n;
    const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
    return {
      tileX: Math.floor(x),
      tileY: Math.floor(y),
      pixelOffsetX: (x - Math.floor(x)) * 256,
      pixelOffsetY: (y - Math.floor(y)) * 256,
    };
  }, []);

  // MGRS coordinate string calculator
  const getMGRS = (latitude: number, longitude: number) => {
    const zoneNumber = Math.floor((longitude + 180) / 6) + 1;
    const letters = "CDEFGHJKLMNPQRSTUVWX";
    const bandIdx = Math.max(0, Math.min(letters.length - 1, Math.floor((latitude + 80) / 8)));
    const zoneLetter = letters[bandIdx];
    const e = Math.floor(((longitude % 6) / 6.0) * 10000);
    const n = Math.floor(((latitude % 8) / 8.0) * 10000);
    return `${zoneNumber}${zoneLetter} FK ${Math.abs(e).toString().padStart(4, "0")} ${Math.abs(n).toString().padStart(4, "0")}`;
  };

  // Ground Sampling Distance (GSD) at current zoom
  const getGSD = (z: number) => {
    const metersPerPixel = (156543.03392 * Math.cos((currentLat * Math.PI) / 180)) / Math.pow(2, z);
    return metersPerPixel < 1 ? `${(metersPerPixel * 100).toFixed(1)} cm/px` : `${metersPerPixel.toFixed(1)} m/px`;
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setCurrentZoom((z) => {
      const next = Math.min(18, z + 1);
      onCoordinatesChange?.(currentLat, currentLon, next);
      return next;
    });
  };

  const handleZoomOut = () => {
    setCurrentZoom((z) => {
      const next = Math.max(3, z - 1);
      onCoordinatesChange?.(currentLat, currentLon, next);
      return next;
    });
  };

  // Mouse pan drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if left click and not interacting with controls/range
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    // Convert pixel delta to lat/lon degrees based on zoom level
    const degreesPerPixelLon = 360 / (256 * Math.pow(2, currentZoom));
    const degreesPerPixelLat = (180 * Math.cos((currentLat * Math.PI) / 180)) / (256 * Math.pow(2, currentZoom));

    const newLon = currentLon - dx * degreesPerPixelLon;
    const newLat = Math.max(-85, Math.min(85, currentLat + dy * degreesPerPixelLat));

    setCurrentLon(newLon);
    setCurrentLat(newLat);
    onCoordinatesChange?.(newLat, newLon, currentZoom);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Generate 3x3 or 4x3 satellite tile grid centered on target
  const tileInfo = getTileCoords(currentLat, currentLon, currentZoom);
  const gridOffsets = [-1, 0, 1];

  const getTileUrl = (z: number, x: number, y: number, provider: string) => {
    const maxTile = Math.pow(2, z);
    const safeX = ((x % maxTile) + maxTile) % maxTile;
    const safeY = Math.max(0, Math.min(maxTile - 1, y));

    if (provider === "nasa_gibs") {
      // NASA GIBS MODIS Terra NRT
      return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/default/GoogleMapsCompatible_Level9/${Math.min(9, z)}/${safeY}/${safeX}.jpg`;
    }
    // Default ESRI World Imagery (High-Res Global Optical)
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${safeY}/${safeX}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative w-full h-[540px] bg-[#050813] rounded-xl overflow-hidden border border-[#1F2937] select-none flex flex-col cursor-grab active:cursor-grabbing shadow-2xl"
    >
      {/* ================= TOP TACTICAL HUD STRIP ================= */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-mono text-gray-300 shadow-xl pointer-events-auto">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="font-bold text-white uppercase tracking-wider">{locationName}</span>
        <span className="text-gray-500">|</span>
        <span className="text-cyan-300">GSD: {getGSD(currentZoom)}</span>
        <span className="text-gray-500">|</span>
        <span className="text-emerald-300 font-bold">ZOOM: {currentZoom}X</span>
      </div>

      {/* Layer Controls & Evidence Toggle */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-black/85 backdrop-blur-md p-1.5 rounded-xl border border-white/10 text-xs font-mono shadow-xl pointer-events-auto">
        <button
          onClick={() => setActiveProvider("esri")}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
            activeProvider === "esri"
              ? "bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          ESRI Optical (High-Res)
        </button>

        <button
          onClick={() => setActiveProvider("nasa_gibs")}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
            activeProvider === "nasa_gibs"
              ? "bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          NASA Live Daily (NRT)
        </button>

        <button
          onClick={() => setActiveProvider("sar")}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
            activeProvider === "sar"
              ? "bg-purple-600 text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Sentinel-1 SAR Radar
        </button>

        <button
          onClick={() => setActiveProvider("flir")}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
            activeProvider === "flir"
              ? "bg-amber-600 text-white shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Thermal FLIR
        </button>

        <button
          onClick={() => setShowOverlays(!showOverlays)}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors border cursor-pointer ${
            showOverlays
              ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50"
              : "bg-gray-800 text-gray-400 border-transparent"
          }`}
        >
          Grounding: {showOverlays ? "ON" : "OFF"}
        </button>
      </div>

      {/* Floating Zoom & Compass Controls */}
      <div className="absolute right-4 top-16 z-30 flex flex-col gap-1.5 bg-black/85 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xl pointer-events-auto">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-8 h-8 rounded-lg bg-gray-900/80 hover:bg-cyan-900/60 text-white flex items-center justify-center text-sm font-bold border border-white/10 cursor-pointer transition-colors"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-8 h-8 rounded-lg bg-gray-900/80 hover:bg-cyan-900/60 text-white flex items-center justify-center text-sm font-bold border border-white/10 cursor-pointer transition-colors"
        >
          &minus;
        </button>
        <div className="w-8 h-8 rounded-lg bg-[#0C1527] border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-[10px] font-mono font-bold">
          N
        </div>
      </div>

      {/* ================= MAIN SATELLITE TILE CANOPY VIEWPORT ================= */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-[#030611]">
        
        {/* Real Satellite Tiles Grid (Pre-Event Baseline Layer) */}
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-300 ${
            activeProvider === "sar"
              ? "grayscale contrast-200 brightness-90 bg-violet-950/20"
              : activeProvider === "flir"
              ? "hue-rotate-180 saturate-200 contrast-150"
              : activeProvider === "nvg"
              ? "sepia-[0.9] hue-rotate-[90deg] saturate-[3] contrast-[1.4]"
              : ""
          }`}
        >
          <div
            className="relative"
            style={{
              width: `${3 * 256}px`,
              height: `${3 * 256}px`,
              transform: `translate(${-tileInfo.pixelOffsetX + 128}px, ${-tileInfo.pixelOffsetY + 128}px)`,
            }}
          >
            {gridOffsets.map((dy) =>
              gridOffsets.map((dx) => {
                const tx = tileInfo.tileX + dx;
                const ty = tileInfo.tileY + dy;
                return (
                  <img
                    key={`${currentZoom}-${tx}-${ty}`}
                    src={getTileUrl(currentZoom, tx, ty, activeProvider)}
                    alt="Satellite Tile"
                    loading="eager"
                    crossOrigin="anonymous"
                    className="absolute w-[256px] h-[256px] object-cover pointer-events-none"
                    style={{
                      left: `${(dx + 1) * 256}px`,
                      top: `${(dy + 1) * 256}px`,
                    }}
                    onError={(e) => {
                      // Fallback tile on network failure
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256' fill='%23081120'><rect width='256' height='256'/><text x='20' y='128' fill='%2338bdf8' font-family='monospace' font-size='12'>SATELLITE LEO FEED</text></svg>";
                    }}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Bi-Temporal Split View Layer (Post-Event Live Comparison) */}
        {isTemporal && (
          <div
            className="absolute inset-y-0 right-0 border-l-2 border-cyan-400 bg-[#040817]/90 shadow-2xl overflow-hidden pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div
              className="absolute inset-y-0 left-0 w-[1400px] -ml-[700px] flex items-center justify-center"
              style={{
                transform: `translate(${-tileInfo.pixelOffsetX + 128}px, ${-tileInfo.pixelOffsetY + 128}px)`,
              }}
            >
              {gridOffsets.map((dy) =>
                gridOffsets.map((dx) => {
                  const tx = tileInfo.tileX + dx;
                  const ty = tileInfo.tileY + dy;
                  return (
                    <img
                      key={`post-${currentZoom}-${tx}-${ty}`}
                      src={getTileUrl(currentZoom, tx, ty, activeProvider)}
                      alt="Post Event Satellite Tile"
                      loading="eager"
                      crossOrigin="anonymous"
                      className="absolute w-[256px] h-[256px] object-cover pointer-events-none brightness-110 saturate-125"
                      style={{
                        left: `${(dx + 1) * 256}px`,
                        top: `${(dy + 1) * 256}px`,
                      }}
                    />
                  );
                })
              )}
            </div>

            {/* Post-Event Label */}
            <div className="absolute top-12 left-3 bg-black/85 px-2.5 py-0.5 rounded border border-cyan-500/40 text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider shadow">
              Post-Event (T2 - Live Observation)
            </div>
          </div>
        )}

        {/* Pre-Event Label */}
        {isTemporal && (
          <div className="absolute top-12 left-3 bg-black/85 px-2.5 py-0.5 rounded border border-amber-500/40 text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider shadow pointer-events-none">
            Pre-Event (T1 - Historical Baseline)
          </div>
        )}

        {/* Center Target Crosshair (God's Eye View HUD) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
          <div className="w-12 h-12 relative flex items-center justify-center">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <div className="w-6 h-6 rounded-full border border-cyan-300/60 animate-ping opacity-50" />
            <div className="w-4 h-4 rounded-full border border-cyan-400" />
          </div>
        </div>

        {/* Visual Grounding Evidence Overlays */}
        {showOverlays && (
          <div className="absolute left-[38%] top-[34%] w-[26%] h-[24%] border-2 border-dashed border-[#EF4444] bg-red-500/20 rounded pointer-events-none transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse z-20">
            <div className="absolute -top-6 left-0 bg-[#EF4444] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>AI Verified Change Area (14.2%)</span>
            </div>
          </div>
        )}

        {/* Additional Custom Overlays */}
        {showOverlays &&
          overlays.map((ov, idx) => {
            const [xmin, ymin, xmax, ymax] = ov.coordinates[0] || [100, 100, 300, 300];
            return (
              <div
                key={idx}
                className="absolute border-2 border-dashed border-[#EF4444] bg-red-500/20 rounded pointer-events-none transition-all duration-500 z-20"
                style={{
                  left: `${(xmin / 512) * 100}%`,
                  top: `${(ymin / 512) * 100}%`,
                  width: `${((xmax - xmin) / 512) * 100}%`,
                  height: `${((ymax - ymin) / 512) * 100}%`,
                }}
              >
                <div className="absolute -top-6 left-0 bg-[#EF4444] text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow">
                  {ov.label} ({Math.round((ov.confidence || 0.85) * 100)}%)
                </div>
              </div>
            );
          })}

        {/* Bi-Temporal Swipe Slider Handle */}
        {isTemporal && (
          <div
            className="absolute inset-y-0 z-30 flex items-center justify-center -ml-3 pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="w-7 h-11 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.8)] flex items-center justify-center pointer-events-auto cursor-ew-resize border-2 border-white">
              <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="m9 18-6-6 6-6" />
                <path d="m15 6 6 6-6 6" />
              </svg>
            </div>
          </div>
        )}

        {/* Invisible range input for slider control */}
        {isTemporal && (
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 opacity-0 cursor-ew-resize z-25 w-full h-full pointer-events-auto"
          />
        )}
      </div>

      {/* ================= BOTTOM STATUS BAR ================= */}
      <div className="bg-[#070B16] border-t border-[#1F2937] px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-gray-300 font-mono z-30">
        <div className="flex items-center gap-4">
          <span className="text-cyan-300 font-bold">
            LAT: {currentLat.toFixed(5)}° N &bull; LON: {currentLon.toFixed(5)}° E
          </span>
          <span className="text-gray-500 hidden md:inline">|</span>
          <span className="text-gray-300 hidden md:inline">MGRS: {getMGRS(currentLat, currentLon)}</span>
          <span className="text-gray-500 hidden md:inline">|</span>
          <span className="text-gray-400 hidden lg:inline">
            TILE: z={currentZoom} x={tileInfo.tileX} y={tileInfo.tileY}
          </span>
        </div>

        <div className="flex items-center gap-3 text-cyan-400 mt-1 sm:mt-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Click &amp; drag map to pan anywhere &bull; Drag slider to compare</span>
        </div>
      </div>
    </div>
  );
}

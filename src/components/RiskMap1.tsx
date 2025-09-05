"use client";

import React, { JSX, useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  ImageOverlay,
  Rectangle,
  CircleMarker,
  Tooltip as LeafletTooltip,
  LayersControl,
  LayerGroup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

/** ---------- Types ---------- **/
interface SensorData {
  id: string;
  type: "temperature" | "humidity" | "gas" | "pressure" | "vibration";
  value: number;
  unit: string;
  status: "online" | "offline" | "warning";
  lastUpdate: string;
  coordinates: { lat: number; lng: number };
}

interface ZoneData {
  id: string;
  coordinateId: string;
  risk: "Low" | "Medium" | "High" | "Critical";
  riskLevel: number; // 0-100
  riskColor: string;
  status: "Active" | "Restricted" | "Monitoring" | "Maintenance";
  lastUpdated: string;
  sensors: SensorData[];
  coordinates: { lat: number; lng: number; coordinateId?: string };
  bounds: [[number, number], [number, number]];
  trend24h: { t: string; v: number }[]; // for charts
}

/** ---------- Config ---------- **/
const BASE_COORDINATES = { lat: 23.7644, lng: 86.4131 };
const GRID_SIZE = { rows: 15, columns: 20 };
const INITIAL_LAT_SPAN = 0.018; // vertical geographic span
const DRONE_IMAGE_URL = "/images/map.svg";
const DEM_IMAGE_URL = "/images/dem.svg"; // if missing, fallback to map.svg

/** ---------- Helpers ---------- **/
const RISK_COLORS = {
  Low: "#10B981",
  Medium: "#F59E0B",
  High: "#EF4444",
  Critical: "#DC2626",
};

const SENSOR_COLORS = {
  online: "#10B981",
  offline: "#6B7280",
  warning: "#F59E0B",
};

const STATUS_COLORS = {
  Active: "#10B981",
  Restricted: "#EF4444",
  Monitoring: "#3B82F6",
  Maintenance: "#F59E0B",
};

const SENSOR_ICON = (type: SensorData["type"]) => {
  switch (type) {
    case "pressure":
      return "💧";
    case "vibration":
      return "🛰️";
    case "temperature":
      return "🌡️";
    case "humidity":
      return "💦";
    case "gas":
      return "🧪";
    default:
      return "📟";
  }
};

function riskToBand(value: number): ZoneData["risk"] {
  if (value <= 30) return "Low";
  if (value <= 60) return "Medium";
  if (value <= 90) return "High";
  return "Critical";
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// Loading skeleton component
const SkeletonLoader = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-700/30 ${className}`} />
);

/** ---------- Component ---------- **/
export default function RiskMap1(): JSX.Element {
  /** Image bounds + alignment **/
  const [imageBounds, setImageBounds] = useState<[[number, number], [number, number]] | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // UI selections + controls
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showSensors, setShowSensors] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [activeBase, setActiveBase] = useState<"drone" | "dem">("drone");

  // Filters
  const [riskThreshold, setRiskThreshold] = useState(0); // min %
  const [sensorFilter, setSensorFilter] = useState<
    Array<SensorData["type"]>
  >(["temperature", "humidity", "gas", "pressure", "vibration"]);

  // Time slider (0-23 hours)
  const [hourIndex, setHourIndex] = useState(12);

  // Real-time update simulation
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdateTime(new Date());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Load image & compute bounds with aspect + cosine correction
  useEffect(() => {
    const img = new Image();
    img.src = DRONE_IMAGE_URL;

    const onLoad = () => {
      const w = img.naturalWidth || img.width || 1;
      const h = img.naturalHeight || img.height || 1;
      const aspect = w / h;
      const meanLatRad = (BASE_COORDINATES.lat * Math.PI) / 180;
      const lngSpan = (INITIAL_LAT_SPAN * aspect) / Math.cos(meanLatRad);

      const b: [[number, number], [number, number]] = [
        [BASE_COORDINATES.lat - INITIAL_LAT_SPAN / 2, BASE_COORDINATES.lng - lngSpan / 2],
        [BASE_COORDINATES.lat + INITIAL_LAT_SPAN / 2, BASE_COORDINATES.lng + lngSpan / 2],
      ];
      setImageBounds(b);
      setTimeout(() => {
        setImageLoaded(true);
        setIsLoading(false);
      }, 1000);
    };

    const onError = () => {
      const fallbackLngSpan = 0.024;
      const b: [[number, number], [number, number]] = [
        [BASE_COORDINATES.lat - INITIAL_LAT_SPAN / 2, BASE_COORDINATES.lng - fallbackLngSpan / 2],
        [BASE_COORDINATES.lat + INITIAL_LAT_SPAN / 2, BASE_COORDINATES.lng + fallbackLngSpan / 2],
      ];
      setImageBounds(b);
      setTimeout(() => {
        setImageLoaded(true);
        setIsLoading(false);
      }, 1000);
    };

    img.onload = onLoad;
    img.onerror = onError;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, []);

  /** Dataset (memoized) **/
  const dataset: Record<string, ZoneData> = useMemo(() => {
    if (!imageBounds) return {};

    const latSpan = imageBounds[1][0] - imageBounds[0][0];
    const lngSpan = imageBounds[1][1] - imageBounds[0][1];
    const cellLat = latSpan / GRID_SIZE.rows;
    const cellLng = lngSpan / GRID_SIZE.columns;

    const coordFor = (row: number, col: number) => {
      const lat = imageBounds[0][0] + row * cellLat + cellLat / 2;
      const lng = imageBounds[0][1] + col * cellLng + cellLng / 2;
      const slat = lat.toFixed(6);
      const slng = lng.toFixed(6);
      return { lat: parseFloat(slat), lng: parseFloat(slng), coordinateId: `${slat}, ${slng}` };
    };
    const boundsFor = (row: number, col: number): [[number, number], [number, number]] => {
      const slat = imageBounds[0][0] + row * cellLat;
      const slng = imageBounds[0][1] + col * cellLng;
      return [
        [slat, slng],
        [slat + cellLat, slng + cellLng],
      ];
    };

    const activeCells = [
      { row: 2, col: 4, base: 15 },
      { row: 6, col: 8, base: 85 },
      { row: 4, col: 12, base: 60 },
      { row: 8, col: 15, base: 95 },
      { row: 1, col: 18, base: 25 },
      { row: 10, col: 3, base: 45 },
      { row: 5, col: 16, base: 78 },
      { row: 12, col: 9, base: 18 },
      { row: 3, col: 6, base: 55 },
      { row: 7, col: 11, base: 82 },
      { row: 9, col: 5, base: 65 },
      { row: 0, col: 14, base: 30 },
      { row: 11, col: 1, base: 92 },
      { row: 13, col: 17, base: 50 },
      { row: 14, col: 7, base: 22 },
      { row: 6, col: 2, base: 75 },
    ];

    const hourT = hourIndex / 24;
    const zones: Record<string, ZoneData> = {};

    for (const cell of activeCells) {
      const zoneId = `ZONE_${cell.row.toString().padStart(2, "0")}_${cell.col.toString().padStart(2, "0")}`;
      const coord = coordFor(cell.row, cell.col);
      const b = boundsFor(cell.row, cell.col);

      const seed = (cell.row * 100 + cell.col) % 17;
      const noise = (seed * 13) % 7;
      const diurnal = Math.sin((hourT + seed * 0.01) * Math.PI * 2) * 8;
      const riskLevel = Math.max(0, Math.min(100, Math.round(cell.base + diurnal + noise - 3)));

      const riskBand = riskToBand(riskLevel);
      const riskColor = RISK_COLORS[riskBand];

      const sensorTypes: SensorData["type"][] = ["temperature", "humidity", "gas", "pressure", "vibration"];
      const count = 2 + (seed % 3);
      const sensors: SensorData[] = Array.from({ length: count }).map((_, i) => {
        const t = sensorTypes[i % sensorTypes.length];
        const sLat = coord.lat + (Math.random() - 0.5) * (cellLat * 0.6);
        const sLng = coord.lng + (Math.random() - 0.5) * (cellLng * 0.6);

        const valueBase =
          t === "temperature" ? 20 + (seed % 6) * 2 :
          t === "humidity" ? 50 + (seed % 20) :
          t === "gas" ? 120 + (seed % 80) :
          t === "pressure" ? 990 + (seed % 25) :
          8 + (seed % 10);
        const value = Math.round(lerp(valueBase - 3, valueBase + 3, (Math.sin(hourT * Math.PI * 2 + i) + 1) / 2));

        const unit =
          t === "temperature" ? "°C" :
          t === "humidity" ? "%" :
          t === "gas" ? "ppm" :
          t === "pressure" ? "hPa" : "Hz";

        const status: SensorData["status"] =
          Math.random() > 0.9 ? "offline" : value > (t === "pressure" ? 1015 : 80) ? "warning" : "online";

        return {
          id: `${zoneId}_${t.toUpperCase()}_${i + 1}`,
          type: t,
          value,
          unit,
          status,
          lastUpdate: `${(seed % 5) + 1}m ago`,
          coordinates: { lat: sLat, lng: sLng },
        };
      });

      const trend24h = Array.from({ length: 24 }).map((_, h) => {
        const ht = h / 24;
        const v = Math.max(
          0,
          Math.min(
            100,
            Math.round(cell.base + Math.sin((ht + seed * 0.01) * Math.PI * 2) * 10 + ((seed * h) % 5) - 2)
          )
        );
        return { t: `${h}:00`, v };
      });

      zones[zoneId] = {
        id: zoneId,
        coordinateId: coord.coordinateId,
        risk: riskBand,
        riskLevel,
        riskColor,
        status: (["Active", "Restricted", "Monitoring", "Maintenance"] as ZoneData["status"][])[seed % 4],
        lastUpdated: `${(seed % 5) + 1}m ago`,
        sensors,
        coordinates: coord,
        bounds: b,
        trend24h,
      };
    }

    return zones;
  }, [imageBounds, hourIndex]);

  // Derived helpers
  const latSpan = imageBounds ? imageBounds[1][0] - imageBounds[0][0] : 0;
  const lngSpan = imageBounds ? imageBounds[1][1] - imageBounds[0][1] : 0;
  const cellLat = imageBounds ? latSpan / GRID_SIZE.rows : 0;
  const cellLng = imageBounds ? lngSpan / GRID_SIZE.columns : 0;

  const zonesArray = useMemo(() => Object.values(dataset).sort((a, b) => b.riskLevel - a.riskLevel), [dataset]);

  const filteredZones = useMemo(
    () => zonesArray.filter((z) => z.riskLevel >= riskThreshold),
    [zonesArray, riskThreshold]
  );

  const allSensors = useMemo(
    () =>
      Object.values(dataset).flatMap((z) =>
        z.sensors.filter((s) => sensorFilter.includes(s.type))
      ),
    [dataset, sensorFilter]
  );

  const selectedZone = selectedZoneId ? dataset[selectedZoneId] : null;
  const selectedSensor = selectedSensorId
    ? allSensors.find((s) => s.id === selectedSensorId) || null
    : null;

  /** ---------- UI ---------- **/
  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-gray-900 text-gray-200">
        {/* Loading skeleton */}
        <div className="absolute top-0 left-0 right-0 bg-gray-800 border-b border-gray-700 z-[1002]">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-3">
              <SkeletonLoader className="w-16 h-8" />
              <SkeletonLoader className="w-12 h-6" />
              <SkeletonLoader className="w-48 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <SkeletonLoader className="w-32 h-6" />
              <SkeletonLoader className="w-2 h-2 rounded-full" />
            </div>
          </div>
        </div>
        
        <div className="absolute top-10 bottom-12 left-0 w-80 bg-gray-800 border-r border-gray-700">
          <div className="p-4 space-y-4">
            <SkeletonLoader className="h-6 w-32" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-3 border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <SkeletonLoader className="h-4 w-24" />
                    <SkeletonLoader className="h-4 w-12" />
                  </div>
                  <SkeletonLoader className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="absolute top-10 bottom-12 left-80 right-96 bg-gray-700">
          <SkeletonLoader className="w-full h-full" />
        </div>
        
        <div className="absolute top-10 bottom-12 right-0 w-96 bg-gray-800 border-l border-gray-700">
          <div className="p-4">
            <SkeletonLoader className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              <SkeletonLoader className="h-32 w-full" />
              <SkeletonLoader className="h-24 w-full" />
              <SkeletonLoader className="h-16 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!imageLoaded || !imageBounds) {
    return null;
  }

  return (
    <div className="h-screen w-screen relative bg-gray-900 text-gray-200 overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700 z-[1002] transition-all duration-300">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              className="px-4 py-2 bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600 transition-all duration-200 font-medium"
              onClick={() => history.back()}
            >
              ← Back
            </button>
            <div className="px-3 py-1 bg-red-600 text-white font-bold text-sm tracking-wide animate-pulse">
              LIVE
            </div>
            <span className="text-lg font-bold tracking-wide">Risk Map — Detailed Analysis</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 text-sm bg-gray-700 text-gray-300 border border-gray-600 font-medium">
              Last Update: {lastUpdateTime.toLocaleTimeString()}
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
          </div>
        </div>
      </div>

      {/* Left Panel (Collapsible) */}
      <div className={`absolute top-16 bottom-16 left-0 z-[1001] transition-all duration-300 ease-out
        ${panelOpen ? "w-80" : "w-12"} bg-gray-800/95 backdrop-blur-sm border-r border-gray-700 shadow-xl`}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-3 py-3 border-b border-gray-700">
            <span className={`font-bold text-lg transition-opacity duration-200 ${panelOpen ? "opacity-100" : "opacity-0"}`}>
              Control Panel
            </span>
            <button
              className="text-gray-300 hover:text-white p-2 hover:bg-gray-700/50 transition-all duration-200 rounded"
              onClick={() => setPanelOpen(!panelOpen)}
              title={panelOpen ? "Collapse" : "Expand"}
            >
              {panelOpen ? "⟨" : "⟩"}
            </button>
          </div>

          {/* Filters */}
          <div className={`p-4 space-y-6 transition-all duration-300 ${panelOpen ? "block opacity-100" : "hidden opacity-0"}`}>
            {/* Risk Filter Card */}
            <div className="bg-gray-900/50 border border-gray-700 p-4 transition-all duration-200 hover:border-gray-600">
              <div className="text-sm font-semibold text-gray-300 mb-3">Risk Threshold</div>
              <input
                type="range"
                min={0}
                max={100}
                value={riskThreshold}
                onChange={(e) => setRiskThreshold(parseInt(e.target.value))}
                className="w-full accent-blue-500 transition-all duration-200"
              />
              <div className="text-base font-bold mt-2">
                ≥ <span className="text-white text-xl">{riskThreshold}%</span>
              </div>
            </div>

            {/* Sensor Filter Card */}
            <div className="bg-gray-900/50 border border-gray-700 p-4 transition-all duration-200 hover:border-gray-600">
              <div className="text-sm font-semibold text-gray-300 mb-3">Sensor Types</div>
              <div className="grid grid-cols-1 gap-3">
                {(["temperature", "humidity", "gas", "pressure", "vibration"] as const).map((t) => {
                  const checked = sensorFilter.includes(t);
                  return (
                    <label key={t} className="flex items-center gap-3 text-sm hover:bg-gray-700/30 p-2 transition-all duration-200 cursor-pointer rounded">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSensorFilter((prev) =>
                            checked ? prev.filter((x) => x !== t) : [...prev, t]
                          )
                        }
                        className="accent-blue-500"
                      />
                      <span className="capitalize font-medium">{SENSOR_ICON(t)} {t}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Layer Controls Card */}
            <div className="bg-gray-900/50 border border-gray-700 p-4 transition-all duration-200 hover:border-gray-600">
              <div className="text-sm font-semibold text-gray-300 mb-3">Map Layers</div>
              <div className="space-y-3 text-sm">
                <div className="space-y-2">
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Base Layer</div>
                  <label className="flex items-center gap-3 hover:bg-gray-700/30 p-2 transition-all duration-200 cursor-pointer rounded">
                    <input
                      type="radio"
                      name="base"
                      checked={activeBase === "drone"}
                      onChange={() => setActiveBase("drone")}
                      className="accent-blue-500"
                    />
                    <span className="font-medium">📡 Drone Imagery</span>
                  </label>
                  <label className="flex items-center gap-3 hover:bg-gray-700/30 p-2 transition-all duration-200 cursor-pointer rounded">
                    <input
                      type="radio"
                      name="base"
                      checked={activeBase === "dem"}
                      onChange={() => setActiveBase("dem")}
                      className="accent-blue-500"
                    />
                    <span className="font-medium">🏔️ DEM (simulated)</span>
                  </label>
                </div>
                <div className="border-t border-gray-700 pt-3 space-y-2">
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Overlays</div>
                  {[
                    { key: 'grid', label: '📐 Grid overlay', state: showGrid, setter: setShowGrid },
                    { key: 'heatmap', label: '🔥 Risk Heatmap', state: showHeatmap, setter: setShowHeatmap },
                    { key: 'zones', label: '🔲 Zone Boundaries', state: showZones, setter: setShowZones },
                    { key: 'sensors', label: '📟 Sensor Points', state: showSensors, setter: setShowSensors }
                  ].map(({ key, label, state, setter }) => (
                    <label key={key} className="flex items-center gap-3 hover:bg-gray-700/30 p-2 transition-all duration-200 cursor-pointer rounded">
                      <input 
                        type="checkbox" 
                        checked={state} 
                        onChange={() => setter((s: boolean) => !s)}
                        className="accent-blue-500"
                      />
                      <span className="font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Zones List */}
          <div className={`flex-1 overflow-auto border-t border-gray-700 transition-all duration-300 ${panelOpen ? "block" : "hidden"}`}>
            <div className="p-3 border-b border-gray-700 bg-gray-800/50">
              <div className="text-sm font-bold text-gray-200">Risk Zones ({filteredZones.length})</div>
            </div>
            <div className="space-y-1">
              {filteredZones.map((z, index) => (
                <button
                  key={z.id}
                  className={`w-full text-left p-4 border-b border-gray-700/50 hover:bg-gray-700/40 transition-all duration-200 transform hover:scale-[1.02]
                    ${selectedZoneId === z.id ? "bg-gray-700/50 border-l-4 border-l-blue-500" : ""}`}
                  onClick={() => {
                    setSelectedZoneId(z.id);
                    setSelectedSensorId(null);
                  }}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-base">{z.id}</div>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded shadow-lg" 
                        style={{ 
                          backgroundColor: z.riskColor,
                          boxShadow: `0 0 8px ${z.riskColor}40`
                        }} 
                      />
                      <div className="text-white font-bold text-lg">{z.riskLevel}%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div 
                      className="px-2 py-1 text-xs font-bold rounded"
                      style={{ 
                        backgroundColor: `${STATUS_COLORS[z.status]}20`,
                        color: STATUS_COLORS[z.status]
                      }}
                    >
                      {z.status}
                    </div>
                    <div className="text-xs text-gray-400 font-medium">{z.lastUpdated}</div>
                  </div>
                  <div className="mt-3 h-12">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={z.trend24h}>
                        <CartesianGrid strokeDasharray="2 2" opacity={0.1} />
                        <XAxis dataKey="t" hide />
                        <YAxis domain={[0, 100]} hide />
                        <RechartsTooltip 
                          contentStyle={{ 
                            background: "#1F2937", 
                            border: "1px solid #374151",
                            borderRadius: "4px",
                            fontSize: "12px"
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="v" 
                          stroke={z.riskColor} 
                          fill={z.riskColor} 
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute top-20 right-4 z-[1003] space-y-3">
        <button
          className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 flex items-center justify-center font-bold"
          title="Refresh Data"
          onClick={() => setLastUpdateTime(new Date())}
        >
          🔄
        </button>
        <button
          className="w-12 h-12 bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 flex items-center justify-center font-bold"
          title="Export Data"
          onClick={() => console.log('Export data')}
        >
          📊
        </button>
        <button
          className="w-12 h-12 bg-purple-600 hover:bg-purple-500 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 flex items-center justify-center font-bold"
          title="Settings"
          onClick={() => console.log('Open settings')}
        >
          ⚙️
        </button>
      </div>

      {/* Main Map */}
      <div className="absolute top-16 bottom-16 left-80 right-96 z-0">
        <MapContainer
          center={[BASE_COORDINATES.lat, BASE_COORDINATES.lng]}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          attributionControl={false}
        >
          <ImageOverlay
            url={activeBase === "drone" ? DRONE_IMAGE_URL : DEM_IMAGE_URL}
            bounds={imageBounds}
            opacity={0.8}
          />

          {/* Grid Overlay */}
          {showGrid && (
            <LayerGroup>
              {Array.from({ length: GRID_SIZE.rows }).map((_, row) =>
                Array.from({ length: GRID_SIZE.columns }).map((_, col) => {
                  const bounds: [[number, number], [number, number]] = [
                    [
                      imageBounds[0][0] + row * cellLat,
                      imageBounds[0][1] + col * cellLng,
                    ],
                    [
                      imageBounds[0][0] + (row + 1) * cellLat,
                      imageBounds[0][1] + (col + 1) * cellLng,
                    ],
                  ];
                  return (
                    <Rectangle
                      key={`${row}-${col}`}
                      bounds={bounds}
                      pathOptions={{
                        color: "#374151",
                        weight: 0.5,
                        fillOpacity: 0,
                        dashArray: "2,4",
                      }}
                    />
                  );
                })
              )}
            </LayerGroup>
          )}

          {/* Risk Zones */}
          {showZones && (
            <LayerGroup>
              {Object.values(dataset).map((zone) => (
                <Rectangle
                  key={zone.id}
                  bounds={zone.bounds}
                  pathOptions={{
                    fillColor: zone.riskColor,
                    color: zone.riskColor,
                    weight: selectedZoneId === zone.id ? 3 : 1,
                    opacity: selectedZoneId === zone.id ? 1 : 0.7,
                    fillOpacity: showHeatmap ? 0.4 : 0.1,
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedZoneId(zone.id);
                      setSelectedSensorId(null);
                    },
                  }}
                >
                  <LeafletTooltip permanent={false} direction="top">
                    <div className="font-bold">{zone.id}</div>
                    <div>Risk: {zone.riskLevel}%</div>
                  </LeafletTooltip>
                </Rectangle>
              ))}
            </LayerGroup>
          )}

          {/* Sensors */}
          {showSensors && (
            <LayerGroup>
              {allSensors.map((sensor) => (
                <CircleMarker
                  key={sensor.id}
                  center={[sensor.coordinates.lat, sensor.coordinates.lng]}
                  radius={6}
                  pathOptions={{
                    color: SENSOR_COLORS[sensor.status],
                    fillColor: SENSOR_COLORS[sensor.status],
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8,
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedSensorId(sensor.id);
                      setSelectedZoneId(null);
                    },
                  }}
                >
                  <LeafletTooltip permanent={false} direction="top">
                    <div className="font-bold">{sensor.type}</div>
                    <div>
                      {sensor.value} {sensor.unit}
                    </div>
                    <div>Status: {sensor.status}</div>
                  </LeafletTooltip>
                </CircleMarker>
              ))}
            </LayerGroup>
          )}
        </MapContainer>
      </div>

      {/* Right Panel */}
      <div className="absolute top-16 bottom-16 right-0 w-96 bg-gray-800/95 backdrop-blur-sm border-l border-gray-700 z-[1001] overflow-y-auto">
        <div className="p-6 space-y-6">
          {selectedZone ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{selectedZone.id}</h2>
                <div
                  className="w-6 h-6 rounded shadow-lg"
                  style={{ backgroundColor: selectedZone.riskColor }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-900/50 rounded border border-gray-700">
                  <div className="text-sm text-gray-400">Risk Level</div>
                  <div className="text-2xl font-bold" style={{ color: selectedZone.riskColor }}>
                    {selectedZone.riskLevel}%
                  </div>
                </div>
                <div className="p-4 bg-gray-900/50 rounded border border-gray-700">
                  <div className="text-sm text-gray-400">Status</div>
                  <div
                    className="text-lg font-bold"
                    style={{ color: STATUS_COLORS[selectedZone.status] }}
                  >
                    {selectedZone.status}
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                <h3 className="text-lg font-bold mb-4">24h Risk Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={selectedZone.trend24h}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="t" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <RechartsTooltip
                      contentStyle={{
                        background: "#1F2937",
                        border: "1px solid #374151",
                        borderRadius: "4px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke={selectedZone.riskColor}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                <h3 className="text-lg font-bold mb-4">Sensors ({selectedZone.sensors.length})</h3>
                <div className="space-y-3">
                  {selectedZone.sensors.map((sensor) => (
                    <div
                      key={sensor.id}
                      className={`p-3 rounded border transition-all duration-200 cursor-pointer ${
                        selectedSensorId === sensor.id
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                      onClick={() => setSelectedSensorId(sensor.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{SENSOR_ICON(sensor.type)} {sensor.type}</div>
                        <div
                          className="text-sm px-2 py-1 rounded"
                          style={{
                            color: SENSOR_COLORS[sensor.status],
                            backgroundColor: `${SENSOR_COLORS[sensor.status]}20`,
                          }}
                        >
                          {sensor.status}
                        </div>
                      </div>
                      <div className="text-2xl font-bold mt-2">
                        {sensor.value} {sensor.unit}
                      </div>
                      <div className="text-sm text-gray-400">Updated {sensor.lastUpdate}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : selectedSensor ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{selectedSensor.type.toUpperCase()}</h2>
                <div
                  className="w-6 h-6 rounded shadow-lg"
                  style={{ backgroundColor: SENSOR_COLORS[selectedSensor.status] }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-900/50 rounded border border-gray-700">
                  <div className="text-sm text-gray-400">Value</div>
                  <div className="text-2xl font-bold">
                    {selectedSensor.value} {selectedSensor.unit}
                  </div>
                </div>
                <div className="p-4 bg-gray-900/50 rounded border border-gray-700">
                  <div className="text-sm text-gray-400">Status</div>
                  <div
                    className="text-lg font-bold"
                    style={{ color: SENSOR_COLORS[selectedSensor.status] }}
                  >
                    {selectedSensor.status}
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                <h3 className="text-lg font-bold mb-4">Location</h3>
                <div className="text-sm">
                  Lat: {selectedSensor.coordinates.lat.toFixed(6)}
                  <br />
                  Lng: {selectedSensor.coordinates.lng.toFixed(6)}
                </div>
              </div>

              <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                <h3 className="text-lg font-bold mb-4">Recent Readings</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[...Array(12)].map((_, i) => ({ 
                    name: `${i * 2}h`, 
                    value: selectedSensor.value + (Math.random() * 10 - 5) 
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <RechartsTooltip
                      contentStyle={{
                        background: "#1F2937",
                        border: "1px solid #374151",
                        borderRadius: "4px",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill={SENSOR_COLORS[selectedSensor.status]}
                      opacity={0.8}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-xl font-bold mb-2">No Selection</h2>
              <p>Select a zone or sensor to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Time Slider */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-800/95 backdrop-blur-sm border-t border-gray-700 z-[1002] p-4">
        <div className="flex items-center gap-4 max-w-2xl mx-auto">
          <span className="text-sm font-medium text-gray-300">Time Analysis:</span>
          <input
            type="range"
            min={0}
            max={23}
            value={hourIndex}
            onChange={(e) => setHourIndex(parseInt(e.target.value))}
            className="flex-1 accent-blue-500"
          />
          <span className="text-sm font-medium text-gray-300">
            {hourIndex.toString().padStart(2, "0")}:00
          </span>
        </div>
      </div>
    </div>
  );
}
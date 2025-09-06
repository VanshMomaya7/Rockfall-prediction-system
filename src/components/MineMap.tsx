"use client";

import React, { JSX, useEffect, useMemo, useState } from "react";
import { MapContainer, ImageOverlay, Rectangle, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LeafletMouseEvent } from "leaflet";

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
  riskLevel: number;
  riskColor: string;
  status: "Active" | "Restricted" | "Monitoring" | "Maintenance";
  lastUpdated: string;
  sensors: SensorData[];
  coordinates: { lat: number; lng: number; coordinateId?: string };
  bounds: [[number, number], [number, number]];
}

/** ---------- Config ---------- **/
const BASE_COORDINATES = { lat: 23.7644, lng: 86.4131 };
const GRID_SIZE = { rows: 15, columns: 20 };
const INITIAL_LAT_SPAN = 0.018; // vertical geographic span you expect (tweakable)

interface MineMapProps {
  selectedZone: string | null;
  setSelectedZone: (id: string | null) => void;
}

/** ---------- Component ---------- **/
export default function MineZoneMap({
  selectedZone,
  setSelectedZone,
}: MineMapProps): JSX.Element {
  const [imageBounds, setImageBounds] = useState<
    [[number, number], [number, number]] | null
  >(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // UI selection state
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);

  // Load the SVG to get its pixel aspect ratio and calculate lng span
  useEffect(() => {
    const img = new Image();
    img.src = "/images/map.svg";

    const onLoad = () => {
      const imgW = img.naturalWidth || img.width || 1;
      const imgH = img.naturalHeight || img.height || 1;
      const aspect = imgW / imgH;

      // Cosine correction at mean latitude so degrees longitude scale with latitude
      const meanLatRad = (BASE_COORDINATES.lat * Math.PI) / 180;
      const lngSpan = (INITIAL_LAT_SPAN * aspect) / Math.cos(meanLatRad);

      const bounds: [[number, number], [number, number]] = [
        [
          BASE_COORDINATES.lat - INITIAL_LAT_SPAN / 2,
          BASE_COORDINATES.lng - lngSpan / 2,
        ],
        [
          BASE_COORDINATES.lat + INITIAL_LAT_SPAN / 2,
          BASE_COORDINATES.lng + lngSpan / 2,
        ],
      ];

      setImageBounds(bounds);
      setImageLoaded(true);
    };

    const onError = () => {
      const fallbackLngSpan = 0.024;
      const bounds: [[number, number], [number, number]] = [
        [
          BASE_COORDINATES.lat - INITIAL_LAT_SPAN / 2,
          BASE_COORDINATES.lng - fallbackLngSpan / 2,
        ],
        [
          BASE_COORDINATES.lat + INITIAL_LAT_SPAN / 2,
          BASE_COORDINATES.lng + fallbackLngSpan / 2,
        ],
      ];
      setImageBounds(bounds);
      setImageLoaded(true);
    };

    img.onload = onLoad;
    img.onerror = onError;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, []);

  /**
   * IMPORTANT: useMemo must be called unconditionally (before the early return).
   * If imageBounds is null, return an empty dataset. When imageBounds becomes
   * available useMemo will compute the actual dataset.
   */
  const dataset: Record<string, ZoneData> = useMemo(() => {
    if (!imageBounds) return {};

    const zones: Record<string, ZoneData> = {};

    // compute spans & cell sizes from imageBounds
    const latSpan = imageBounds[1][0] - imageBounds[0][0];
    const lngSpan = imageBounds[1][1] - imageBounds[0][1];
    const cellLatSize = latSpan / GRID_SIZE.rows;
    const cellLngSize = lngSpan / GRID_SIZE.columns;

    // helpers scoped inside useMemo so they use the computed cell sizes
    const generateCellCoordinates = (row: number, col: number) => {
      const lat = imageBounds[0][0] + row * cellLatSize + cellLatSize / 2;
      const lng = imageBounds[0][1] + col * cellLngSize + cellLngSize / 2;
      const formattedLat = lat.toFixed(6);
      const formattedLng = lng.toFixed(6);
      return {
        lat: parseFloat(formattedLat),
        lng: parseFloat(formattedLng),
        coordinateId: `${formattedLat}, ${formattedLng}`,
      };
    };

    const getCellBounds = (
      row: number,
      col: number
    ): [[number, number], [number, number]] => {
      const startLat = imageBounds[0][0] + row * cellLatSize;
      const startLng = imageBounds[0][1] + col * cellLngSize;
      return [
        [startLat, startLng],
        [startLat + cellLatSize, startLng + cellLngSize],
      ];
    };

    // Predefined active zones (same as before)
    const activeZones = [
      { row: 2, col: 4, risk: "Low" as const, riskLevel: 15 },
      { row: 6, col: 8, risk: "High" as const, riskLevel: 85 },
      { row: 4, col: 12, risk: "Medium" as const, riskLevel: 60 },
      { row: 8, col: 15, risk: "High" as const, riskLevel: 95 },
      { row: 1, col: 18, risk: "Low" as const, riskLevel: 25 },
      { row: 10, col: 3, risk: "Medium" as const, riskLevel: 45 },
      { row: 5, col: 16, risk: "High" as const, riskLevel: 78 },
      { row: 12, col: 9, risk: "Low" as const, riskLevel: 18 },
      { row: 3, col: 6, risk: "Medium" as const, riskLevel: 55 },
      { row: 7, col: 11, risk: "High" as const, riskLevel: 82 },
      { row: 9, col: 5, risk: "Medium" as const, riskLevel: 65 },
      { row: 0, col: 14, risk: "Low" as const, riskLevel: 30 },
      { row: 11, col: 1, risk: "High" as const, riskLevel: 92 },
      { row: 13, col: 17, risk: "Medium" as const, riskLevel: 50 },
      { row: 14, col: 7, risk: "Low" as const, riskLevel: 22 },
      { row: 6, col: 2, risk: "High" as const, riskLevel: 75 },
    ];

    const riskColors = {
      Low: "#34D399", // mint green
      Medium: "#FCD34D", // soft amber
      High: "#FB923C", // warm orange
      Critical: "#7C3AED", // deep indigo/purple
    };

    const statusOptions: ZoneData["status"][] = [
      "Active",
      "Restricted",
      "Monitoring",
      "Maintenance",
    ];
    const sensorTypes: SensorData["type"][] = [
      "temperature",
      "humidity",
      "gas",
      "pressure",
      "vibration",
    ];

    activeZones.forEach(({ row, col, risk, riskLevel }) => {
      const cellData = generateCellCoordinates(row, col);
      const cellBounds = getCellBounds(row, col);
      const zoneId = `ZONE_${row.toString().padStart(2, "0")}_${col
        .toString()
        .padStart(2, "0")}`;

      const numSensors = Math.floor(Math.random() * 3) + 2; // 2-4 sensors
      const sensors: SensorData[] = [];

      for (let i = 0; i < numSensors; i++) {
        const sensorType = sensorTypes[i % sensorTypes.length];
        const sensorCoords = {
          lat: cellData.lat + (Math.random() - 0.5) * (cellLatSize * 0.6),
          lng: cellData.lng + (Math.random() - 0.5) * (cellLngSize * 0.6),
        };

        const getValueAndUnit = (type: SensorData["type"]) => {
          switch (type) {
            case "temperature":
              return { value: Math.round(Math.random() * 25 + 20), unit: "°C" };
            case "humidity":
              return { value: Math.round(Math.random() * 40 + 40), unit: "%" };
            case "gas":
              return {
                value: Math.round(Math.random() * 200 + 100),
                unit: "ppm",
              };
            case "pressure":
              return {
                value: Math.round(Math.random() * 50 + 980),
                unit: "hPa",
              };
            case "vibration":
              return { value: Math.round(Math.random() * 15 + 5), unit: "Hz" };
          }
        };

        const { value, unit } = getValueAndUnit(sensorType);
        const sensorStatus: SensorData["status"] =
          Math.random() > 0.85
            ? "offline"
            : value > 80 && sensorType !== "pressure"
            ? "warning"
            : "online";

        sensors.push({
          id: `${zoneId}_${sensorType.toUpperCase()}_${i + 1}`,
          type: sensorType,
          value,
          unit,
          status: sensorStatus,
          lastUpdate: `${Math.floor(Math.random() * 8) + 1}m ago`,
          coordinates: sensorCoords,
        });
      }

      zones[zoneId] = {
        id: zoneId,
        coordinateId: cellData.coordinateId,
        risk,
        riskLevel,
        riskColor: riskColors[risk],
        status: statusOptions[Math.floor(Math.random() * statusOptions.length)],
        lastUpdated: `${Math.floor(Math.random() * 5) + 1}m ago`,
        sensors,
        coordinates: cellData,
        bounds: cellBounds,
      };
    });

    return zones;
  }, [imageBounds]);

  console.log(Object.values(dataset));

  // If image not ready, show loading — but hooks order is stable because useMemo ran above.
  if (!imageLoaded || !imageBounds) {
    return (
      <div className="h-full w-full grid place-items-center bg-gray-900 text-gray-200">
        Loading map...
      </div>
    );
  }

  // Build rectangles ONLY for zones with data (active zones) - no empty grid cells
  const rectangles: JSX.Element[] = Object.values(dataset).map((zoneData) => (
    <Rectangle
      key={zoneData.id}
      bounds={zoneData.bounds}
      pathOptions={{
        color: zoneData.riskColor,
        weight: 2,
        fillOpacity: 0.4,
        fillColor: zoneData.riskColor,
      }}
      eventHandlers={{
        click: () => {
          setSelectedZone(zoneData.id);
          setSelectedSensor(null);
        },
        mouseover: (e: LeafletMouseEvent) => {
          e.target.setStyle({
            weight: 3,
            fillOpacity: 0.6,
          });
        },
        mouseout: (e: LeafletMouseEvent) => {
          e.target.setStyle({
            weight: 2,
            fillOpacity: 0.4,
          });
        },
      }}
    >
      <Tooltip sticky className="zone-tooltip" direction="top" offset={[0, -8]}>
        <div className="bg-gray-900 text-white p-2 text-sm border border-gray-600">
          <div className="font-semibold">{zoneData.coordinateId}</div>
          <div className="flex items-center gap-2 mt-1">
            <div
              className="w-3 h-3"
              style={{ backgroundColor: zoneData.riskColor }}
            />
            <span>
              {zoneData.risk} Risk ({zoneData.riskLevel}%)
            </span>
          </div>
          <div className="text-gray-300 text-sm mt-1">
            {zoneData.sensors.length} sensors • {zoneData.status}
          </div>
        </div>
      </Tooltip>
    </Rectangle>
  ));

  // Generate sensor markers

  const selectedZoneData = selectedZone ? dataset[selectedZone] : null;
  const selectedSensorData = selectedSensor
    ? Object.values(dataset)
        .flatMap((z) => z.sensors)
        .find((s) => s.id === selectedSensor) || null
    : null;

  /** ---------- UI ---------- **/
  return (
    <div className="h-full w-full relative bg-gray-900 overflow-hidden">
      {/* Compact Header */}
      <div className="absolute top-0 left-0 right-0 bg-gray-800/95 backdrop-blur-sm p-2 z-[1001] border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-gray-300 text-sm font-medium">
              Mine Zone Heat Map
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 text-xs bg-gray-700 text-gray-300 border border-gray-600">
              Last Update: 2m ago
            </div>
            <div className="w-2 h-2 bg-green-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="pt-10 h-full">
        <MapContainer
          center={[BASE_COORDINATES.lat, BASE_COORDINATES.lng]}
          zoom={14}
          minZoom={13}
          maxZoom={17}
          style={{ height: "100%", width: "100%", backgroundColor: "#111827" }}
          zoomControl={false}
        >
          <ImageOverlay
            url="/images/map.svg"
            bounds={imageBounds}
            opacity={0.75}
          />
          {rectangles}
          {/* {sensorMarkers} */}
        </MapContainer>
      </div>

      {/* Risk Legend */}
      <div className="absolute top-12 right-2 bg-gray-800/95 backdrop-blur-sm border border-gray-600 p-3 text-sm z-[1000]">
        <div className="text-white font-semibold mb-2">Risk Levels</div>
        <div className="space-y-1.5">
          {[
            {
              risk: "Low",
              color: "#34D399",
              count: Object.values(dataset).filter((z) => z.risk === "Low")
                .length,
            },
            {
              risk: "Medium",
              color: "#FCD34D",
              count: Object.values(dataset).filter((z) => z.risk === "Medium")
                .length,
            },
            {
              risk: "High",
              color: "#FB923C",
              count: Object.values(dataset).filter((z) => z.risk === "High")
                .length,
            },
          ].map(({ risk, color, count }) => (
            <div key={risk} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3" style={{ backgroundColor: color }} />
                <span className="text-gray-300">{risk}</span>
              </div>
              <span className="text-white font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Zone Details */}
      {selectedZoneData && (
        <div className="absolute bottom-2 right-2 bg-gray-800/95 backdrop-blur-sm border border-gray-600 p-4 text-sm z-[1000] max-w-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white text-base">Zone Details</h3>
            <button
              className="text-gray-400 hover:text-white text-lg font-bold w-6 h-6 flex items-center justify-center"
              onClick={() => setSelectedZone(null)}
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-gray-400">Coordinates:</span>
              <div className="text-white font-mono text-sm">
                {selectedZoneData.coordinateId}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4"
                  style={{ backgroundColor: selectedZoneData.riskColor }}
                />
                <span className="text-gray-300">
                  {selectedZoneData.risk} Risk
                </span>
              </div>
              <span className="text-white font-bold text-lg">
                {selectedZoneData.riskLevel}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="text-white font-medium">
                {selectedZoneData.status}
              </span>
            </div>

            <div className="border-t border-gray-700 pt-3">
              <div className="text-gray-300 font-semibold mb-2">
                Active Sensors ({selectedZoneData.sensors.length})
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedZoneData.sensors.map((sensor) => (
                  <div
                    key={sensor.id}
                    className="flex items-center justify-between p-2 bg-gray-700/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300 capitalize text-sm">
                        {sensor.type}
                      </span>
                    </div>
                    <span className="text-white font-medium">
                      {sensor.value}
                      {sensor.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">
              Last updated: {selectedZoneData.lastUpdated}
            </div>
          </div>
        </div>
      )}

      {/* Sensor Details */}
      {selectedSensorData && (
        <div className="absolute bottom-2 left-2 bg-gray-800/95 backdrop-blur-sm border border-gray-600 p-4 text-sm z-[1000] min-w-64">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white text-base capitalize">
              {selectedSensorData.type} Sensor
            </h3>
            <button
              className="text-gray-400 hover:text-white text-lg font-bold w-6 h-6 flex items-center justify-center"
              onClick={() => setSelectedSensor(null)}
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            <div className="text-center p-4 bg-gray-700/50">
              <div className="text-2xl font-bold text-white">
                {selectedSensorData.value}
                {selectedSensorData.unit}
              </div>
              <div className="text-gray-300 capitalize mt-1">
                {selectedSensorData.status}
              </div>
            </div>

            <div>
              <span className="text-gray-400">Sensor ID:</span>
              <div className="text-white font-mono text-xs">
                {selectedSensorData.id}
              </div>
            </div>

            <div>
              <span className="text-gray-400">Location:</span>
              <div className="text-white font-mono text-xs">
                {selectedSensorData.coordinates.lat.toFixed(6)},{" "}
                {selectedSensorData.coordinates.lng.toFixed(6)}
              </div>
            </div>

            <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">
              Last reading: {selectedSensorData.lastUpdate}
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx global>{`
        .zone-tooltip,
        .sensor-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        .leaflet-tooltip-top:before,
        .leaflet-tooltip-bottom:before {
          display: none !important;
        }
        .leaflet-container {
          background: #111827 !important;
        }
        .leaflet-control-zoom {
          display: none !important;
        }
        * {
          border-radius: 0 !important;
        }
      `}</style>
    </div>
  );
}

// "use client";

// import React, { JSX, useEffect, useMemo, useState } from "react";
// import { MapContainer, ImageOverlay, Rectangle, Tooltip } from "react-leaflet";
// import "leaflet/dist/leaflet.css";

// /** ---------- Types ---------- **/
// interface ZoneReading {
//   type: "temperature" | "humidity" | "gas" | "pressure" | "vibration";
//   value: number;
//   unit: string;
// }

// interface ZoneData {
//   id: string;
//   coordinateId: string;
//   risk: "Low" | "Medium" | "High" | "Critical";
//   riskLevel: number;
//   riskColor: string;
//   status: "Active" | "Restricted" | "Monitoring" | "Maintenance";
//   lastUpdated: string;
//   readings: ZoneReading[];
//   coordinates: { lat: number; lng: number; coordinateId?: string };
//   bounds: [[number, number], [number, number]];
// }

// /** ---------- Config ---------- **/
// const BASE_COORDINATES = { lat: 23.7644, lng: 86.4131 };
// const GRID_SIZE = { rows: 15, columns: 20 };
// const INITIAL_LAT_SPAN = 0.018; // vertical span

// /** ---------- Component ---------- **/
// export default function MineZoneMap(): JSX.Element {
//   const [imageBounds, setImageBounds] = useState<[[number, number], [number, number]] | null>(null);
//   const [imageLoaded, setImageLoaded] = useState(false);
//   const [selectedZone, setSelectedZone] = useState<string | null>(null);

//   // Load map image and calculate bounds
//   useEffect(() => {
//     const img = new Image();
//     img.src = "/images/map.svg";

//     const onLoad = () => {
//       const imgW = img.naturalWidth || img.width || 1;
//       const imgH = img.naturalHeight || img.height || 1;
//       const aspect = imgW / imgH;
//       const meanLatRad = (BASE_COORDINATES.lat * Math.PI) / 180;
//       const lngSpan = (INITIAL_LAT_SPAN * aspect) / Math.cos(meanLatRad);

//       const bounds: [[number, number], [number, number]] = [
//         [BASE_COORDINATES.lat - INITIAL_LAT_SPAN / 2, BASE_COORDINATES.lng - lngSpan / 2],
//         [BASE_COORDINATES.lat + INITIAL_LAT_SPAN / 2, BASE_COORDINATES.lng + lngSpan / 2]
//       ];

//       setImageBounds(bounds);
//       setImageLoaded(true);
//     };

//     const onError = () => {
//       const fallbackLngSpan = 0.024;
//       const bounds: [[number, number], [number, number]] = [
//         [BASE_COORDINATES.lat - INITIAL_LAT_SPAN / 2, BASE_COORDINATES.lng - fallbackLngSpan / 2],
//         [BASE_COORDINATES.lat + INITIAL_LAT_SPAN / 2, BASE_COORDINATES.lng + fallbackLngSpan / 2]
//       ];
//       setImageBounds(bounds);
//       setImageLoaded(true);
//     };

//     img.onload = onLoad;
//     img.onerror = onError;

//     return () => {
//       img.onload = null;
//       img.onerror = null;
//     };
//   }, []);

//   /** Dataset Generation **/
//   const dataset: Record<string, ZoneData> = useMemo(() => {
//     if (!imageBounds) return {};

//     const zones: Record<string, ZoneData> = {};
//     const latSpan = imageBounds[1][0] - imageBounds[0][0];
//     const lngSpan = imageBounds[1][1] - imageBounds[0][1];
//     const cellLatSize = latSpan / GRID_SIZE.rows;
//     const cellLngSize = lngSpan / GRID_SIZE.columns;

//     const generateCellCoordinates = (row: number, col: number) => {
//       const lat = imageBounds[0][0] + row * cellLatSize + cellLatSize / 2;
//       const lng = imageBounds[0][1] + col * cellLngSize + cellLngSize / 2;
//       const formattedLat = lat.toFixed(6);
//       const formattedLng = lng.toFixed(6);
//       return { lat: parseFloat(formattedLat), lng: parseFloat(formattedLng), coordinateId: `${formattedLat}, ${formattedLng}` };
//     };

//     const getCellBounds = (row: number, col: number): [[number, number], [number, number]] => {
//       const startLat = imageBounds[0][0] + row * cellLatSize;
//       const startLng = imageBounds[0][1] + col * cellLngSize;
//       return [[startLat, startLng], [startLat + cellLatSize, startLng + cellLngSize]];
//     };

//     // Fixed 16 zones
//     const activeZones = [
//       { row: 2, col: 4, risk: "Low" as const, riskLevel: 15 },
//       { row: 6, col: 8, risk: "High" as const, riskLevel: 85 },
//       { row: 4, col: 12, risk: "Medium" as const, riskLevel: 60 },
//       { row: 8, col: 15, risk: "Critical" as const, riskLevel: 95 },
//       { row: 1, col: 18, risk: "Low" as const, riskLevel: 25 },
//       { row: 10, col: 3, risk: "Medium" as const, riskLevel: 45 },
//       { row: 12, col: 7, risk: "High" as const, riskLevel: 75 },
//       { row: 14, col: 11, risk: "Critical" as const, riskLevel: 90 },
//       { row: 3, col: 16, risk: "Low" as const, riskLevel: 30 },
//       { row: 7, col: 2, risk: "Medium" as const, riskLevel: 55 },
//       { row: 9, col: 19, risk: "High" as const, riskLevel: 80 },
//       { row: 5, col: 5, risk: "Critical" as const, riskLevel: 92 },
//       { row: 11, col: 14, risk: "Low" as const, riskLevel: 20 },
//       { row: 13, col: 9, risk: "Medium" as const, riskLevel: 65 },
//       { row: 6, col: 13, risk: "Critical" as const, riskLevel: 96 }
//     ];

//     const riskColors = {
//       Low: "#10B981",
//       Medium: "#F59E0B",
//       High: "#EF4444",
//       Critical: "#DC2626"
//     };

//     const statusOptions: ZoneData["status"][] = ["Active", "Restricted", "Monitoring", "Maintenance"];

//     activeZones.forEach(({ row, col, risk, riskLevel }) => {
//       const cellData = generateCellCoordinates(row, col);
//       const cellBounds = getCellBounds(row, col);
//       const zoneId = `ZONE_${row.toString().padStart(2, "0")}_${col.toString().padStart(2, "0")}`;

//       const readings: ZoneReading[] = [
//         { type: "temperature", value: Math.round(Math.random() * 25 + 20), unit: "°C" },
//         { type: "humidity", value: Math.round(Math.random() * 40 + 40), unit: "%" },
//         { type: "gas", value: Math.round(Math.random() * 200 + 100), unit: "ppm" },
//         { type: "pressure", value: Math.round(Math.random() * 50 + 980), unit: "hPa" },
//         { type: "vibration", value: Math.round(Math.random() * 15 + 5), unit: "Hz" }
//       ];

//       zones[zoneId] = {
//         id: zoneId,
//         coordinateId: cellData.coordinateId,
//         risk,
//         riskLevel,
//         riskColor: riskColors[risk],
//         status: statusOptions[Math.floor(Math.random() * statusOptions.length)],
//         lastUpdated: `${Math.floor(Math.random() * 5) + 1}m ago`,
//         readings,
//         coordinates: cellData,
//         bounds: cellBounds
//       };
//     });

//     return zones;
//   }, [imageBounds]);

//   if (!imageLoaded || !imageBounds) {
//     return <div className="h-full w-full grid place-items-center bg-gray-900 text-gray-200">Loading map...</div>;
//   }

//   /** ---------- UI ---------- **/
//   const rectangles: JSX.Element[] = [];
//   for (let row = 0; row < GRID_SIZE.rows; row++) {
//     for (let col = 0; col < GRID_SIZE.columns; col++) {
//       const zoneId = `ZONE_${row.toString().padStart(2, "0")}_${col.toString().padStart(2, "0")}`;
//       const zoneData = dataset[zoneId];
//       const hasData = Boolean(zoneData);

//       rectangles.push(
//         <Rectangle
//           key={zoneId}
//           bounds={zoneData ? zoneData.bounds : [[0, 0], [0, 0]]}
//           pathOptions={{
//             color: hasData ? zoneData!.riskColor : "#4B5563",
//             weight: hasData ? 2 : 1,
//             dashArray: hasData ? undefined : "3, 6",
//             fillOpacity: hasData ? 0.4 : 0.05,
//             fillColor: hasData ? zoneData!.riskColor : "transparent"
//           }}
//           eventHandlers={{
//             click: () => {
//               if (hasData) setSelectedZone(zoneId);
//             },
//             mouseover: (e: any) => {
//               e.target.setStyle({ weight: hasData ? 3 : 1.5, fillOpacity: hasData ? 0.6 : 0.1 });
//             },
//             mouseout: (e: any) => {
//               e.target.setStyle({ weight: hasData ? 2 : 1, fillOpacity: hasData ? 0.4 : 0.05 });
//             }
//           }}
//         >
//           {hasData && (
//             <Tooltip sticky direction="top" offset={[0, -8]}>
//               <div className="bg-gray-900 text-white p-2 text-sm border border-gray-600">
//                 <div className="font-semibold">{zoneData!.coordinateId}</div>
//                 <div className="flex items-center gap-2 mt-1">
//                   <div className="w-3 h-3" style={{ backgroundColor: zoneData!.riskColor }} />
//                   <span>{zoneData!.risk} Risk ({zoneData!.riskLevel}%)</span>
//                 </div>
//                 <div className="text-gray-300 text-sm mt-1">{zoneData!.status}</div>
//               </div>
//             </Tooltip>
//           )}
//         </Rectangle>
//       );
//     }
//   }

//   const selectedZoneData = selectedZone ? dataset[selectedZone] : null;

//   return (
//     <div className="h-full w-full relative bg-gray-900 overflow-hidden">
//       {/* Header */}
//       <div className="absolute top-0 left-0 right-0 bg-gray-800/95 backdrop-blur-sm p-2 z-[1001] border-b border-gray-700">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <div className="px-2 py-1 text-xs bg-red-700 text-white font-semibold">LIVE</div>
//             <span className="text-gray-300 text-sm font-medium">Mine Zone Monitoring</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="px-2 py-1 text-xs bg-gray-700 text-gray-300 border border-gray-600">Last Update: 2m ago</div>
//             <div className="w-2 h-2 bg-green-500 animate-pulse" />
//           </div>
//         </div>
//       </div>

//       {/* Map */}
//       <div className="pt-10 h-full">
//         <MapContainer
//           center={[BASE_COORDINATES.lat, BASE_COORDINATES.lng]}
//           zoom={14}
//           minZoom={13}
//           maxZoom={17}
//           style={{ height: "100%", width: "100%", backgroundColor: "#111827" }}
//           zoomControl={false}
//         >
//           <ImageOverlay url="/images/map.svg" bounds={imageBounds} opacity={0.75} />
//           {rectangles}
//         </MapContainer>
//       </div>

//       {/* Zone Details */}
//       {selectedZoneData && (
//         <div className="absolute bottom-2 right-2 bg-gray-800/95 backdrop-blur-sm border border-gray-600 p-4 text-sm z-[1000] max-w-80">
//           <div className="flex items-center justify-between mb-3">
//             <h3 className="font-bold text-white text-base">Zone Details</h3>
//             <button className="text-gray-400 hover:text-white text-lg font-bold w-6 h-6 flex items-center justify-center" onClick={() => setSelectedZone(null)}>×</button>
//           </div>

//           <div className="space-y-3">
//             <div>
//               <span className="text-gray-400">Coordinates:</span>
//               <div className="text-white font-mono text-sm">{selectedZoneData.coordinateId}</div>
//             </div>

//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <div className="w-4 h-4" style={{ backgroundColor: selectedZoneData.riskColor }} />
//                 <span className="text-gray-300">{selectedZoneData.risk} Risk</span>
//               </div>
//               <span className="text-white font-bold text-lg">{selectedZoneData.riskLevel}%</span>
//             </div>

//             <div className="flex items-center justify-between">
//               <span className="text-gray-400">Status:</span>
//               <span className="text-white font-medium">{selectedZoneData.status}</span>
//             </div>

//             <div className="border-t border-gray-700 pt-3">
//               <div className="text-gray-300 font-semibold mb-2">Readings</div>
//               <div className="space-y-2 max-h-32 overflow-y-auto">
//                 {selectedZoneData.readings.map((r, idx) => (
//                   <div key={idx} className="flex items-center justify-between p-2 bg-gray-700/50">
//                     <span className="text-gray-300 capitalize text-sm">{r.type}</span>
//                     <span className="text-white font-medium">{r.value}{r.unit}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">Last updated: {selectedZoneData.lastUpdated}</div>
//           </div>
//         </div>
//       )}

//       {/* Risk Legend */}
//       <div className="absolute top-12 right-2 bg-gray-800/95 backdrop-blur-sm border border-gray-600 p-3 text-xs text-gray-300 space-y-2 z-[90]">
//         <div className="text-white font-semibold mb-2">Risk Levels</div>
//         <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500" /> Low</div>
//         <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-500" /> Medium</div>
//         <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500" /> High</div>
//         {/* <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-700" /> Critical</div> */}
//       </div>

//       {/* Styles */}
//       <style jsx global>{`
//         .leaflet-container { background: #111827 !important; }
//         .leaflet-control-zoom { display: none !important; }
//         * { border-radius: 0 !important; }
//       `}</style>
//     </div>
//   );
// }

// "use client";

// import React, { JSX, useEffect, useMemo, useState } from "react";
// import { MapContainer, ImageOverlay, Rectangle, Tooltip } from "react-leaflet";
// import "leaflet/dist/leaflet.css";

// /** ---------- Types ---------- **/
// interface ZoneReading {
//   type: "temperature" | "humidity" | "gas" | "pressure" | "vibration";
//   value: number;
//   unit: string;
// }

// interface ZoneData {
//   id: string;
//   coordinateId: string;
//   risk: "Low" | "Medium" | "High" | "Critical";
//   riskLevel: number;
//   riskColor: string;
//   status: "Active" | "Restricted" | "Monitoring" | "Maintenance";
//   lastUpdated: string;
//   readings: ZoneReading[];
//   coordinates: { lat: number; lng: number; coordinateId?: string };
//   bounds: [[number, number], [number, number]];
// }

// /** ---------- Config ---------- **/
// const BASE_COORDINATES = { lat: 23.7644, lng: 86.4131 };
// const GRID_SIZE = { rows: 15, columns: 20 };
// const INITIAL_LAT_SPAN = 0.018; // vertical span

// /** ---------- Component ---------- **/
// export default function MineZoneMap(): JSX.Element {
//   const [imageBounds, setImageBounds] = useState<[[number, number], [number, number]] | null>(null);
//   const [imageLoaded, setImageLoaded] = useState(false);
//   const [selectedZone, setSelectedZone] = useState<string | null>(null);

//   // Load map image and calculate bounds
//   useEffect(() => {
//     const img = new Image();
//     img.src = "/images/map.svg";

//     const onLoad = () => {
//       const imgW = img.naturalWidth || img.width || 1;
//       const imgH = img.naturalHeight || img.height || 1;
//       const aspect = imgW / imgH;
//       const meanLatRad = (BASE_COORDINATES.lat * Math.PI) / 180;
//       const lngSpan = (INITIAL_LAT_SPAN * aspect) / Math.cos(meanLatRad);

//       const bounds: [[number, number], [number, number]] = [
//         [BASE_COORDINATES.lat - INITIAL_LAT_SPAN / 2, BASE_COORDINATES.lng - lngSpan / 2],
//         [BASE_COORDINATES.lat + INITIAL_LAT_SPAN / 2, BASE_COORDINATES.lng + lngSpan / 2]
//       ];

//       setImageBounds(bounds);
//       setImageLoaded(true);
//     };

//     const onError = () => {
//       const fallbackLngSpan = 0.024;
//       const bounds: [[number, number], [number, number]] = [
//         [BASE_COORDINATES.lat - INITIAL_LAT_SPAN / 2, BASE_COORDINATES.lng - fallbackLngSpan / 2],
//         [BASE_COORDINATES.lat + INITIAL_LAT_SPAN / 2, BASE_COORDINATES.lng + fallbackLngSpan / 2]
//       ];
//       setImageBounds(bounds);
//       setImageLoaded(true);
//     };

//     img.onload = onLoad;
//     img.onerror = onError;

//     return () => {
//       img.onload = null;
//       img.onerror = null;
//     };
//   }, []);

//   /** Dataset Generation **/
//   const dataset: Record<string, ZoneData> = useMemo(() => {
//     if (!imageBounds) return {};

//     const zones: Record<string, ZoneData> = {};
//     const latSpan = imageBounds[1][0] - imageBounds[0][0];
//     const lngSpan = imageBounds[1][1] - imageBounds[0][1];
//     const cellLatSize = latSpan / GRID_SIZE.rows;
//     const cellLngSize = lngSpan / GRID_SIZE.columns;

//     const generateCellCoordinates = (row: number, col: number) => {
//       const lat = imageBounds[0][0] + row * cellLatSize + cellLatSize / 2;
//       const lng = imageBounds[0][1] + col * cellLngSize + cellLngSize / 2;
//       const formattedLat = lat.toFixed(6);
//       const formattedLng = lng.toFixed(6);
//       return { lat: parseFloat(formattedLat), lng: parseFloat(formattedLng), coordinateId: `${formattedLat}, ${formattedLng}` };
//     };

//     const getCellBounds = (row: number, col: number): [[number, number], [number, number]] => {
//       const startLat = imageBounds[0][0] + row * cellLatSize;
//       const startLng = imageBounds[0][1] + col * cellLngSize;
//       return [[startLat, startLng], [startLat + cellLatSize, startLng + cellLngSize]];
//     };

//     const activeZones = [
//       { row: 2, col: 4, risk: "Low" as const, riskLevel: 15 },
//       { row: 6, col: 8, risk: "High" as const, riskLevel: 85 },
//       { row: 4, col: 12, risk: "Medium" as const, riskLevel: 60 },
//       { row: 8, col: 15, risk: "Critical" as const, riskLevel: 95 },
//       { row: 1, col: 18, risk: "Low" as const, riskLevel: 25 },
//       { row: 10, col: 3, risk: "Medium" as const, riskLevel: 45 }
//     ];

//     const riskColors = {
//       Low: "#10B981",
//       Medium: "#F59E0B",
//       High: "#EF4444",
//       Critical: "#DC2626"
//     };

//     const statusOptions: ZoneData["status"][] = ["Active", "Restricted", "Monitoring", "Maintenance"];

//     activeZones.forEach(({ row, col, risk, riskLevel }) => {
//       const cellData = generateCellCoordinates(row, col);
//       const cellBounds = getCellBounds(row, col);
//       const zoneId = `ZONE_${row.toString().padStart(2, "0")}_${col.toString().padStart(2, "0")}`;

//       const readings: ZoneReading[] = [
//         { type: "temperature", value: Math.round(Math.random() * 25 + 20), unit: "°C" },
//         { type: "humidity", value: Math.round(Math.random() * 40 + 40), unit: "%" },
//         { type: "gas", value: Math.round(Math.random() * 200 + 100), unit: "ppm" },
//         { type: "pressure", value: Math.round(Math.random() * 50 + 980), unit: "hPa" },
//         { type: "vibration", value: Math.round(Math.random() * 15 + 5), unit: "Hz" }
//       ];

//       zones[zoneId] = {
//         id: zoneId,
//         coordinateId: cellData.coordinateId,
//         risk,
//         riskLevel,
//         riskColor: riskColors[risk],
//         status: statusOptions[Math.floor(Math.random() * statusOptions.length)],
//         lastUpdated: `${Math.floor(Math.random() * 5) + 1}m ago`,
//         readings,
//         coordinates: cellData,
//         bounds: cellBounds
//       };
//     });

//     return zones;
//   }, [imageBounds]);

//   if (!imageLoaded || !imageBounds) {
//     return <div className="h-full w-full grid place-items-center bg-gray-900 text-gray-200">Loading map...</div>;
//   }

//   /** ---------- UI ---------- **/
//   const rectangles: JSX.Element[] = [];
//   for (let row = 0; row < GRID_SIZE.rows; row++) {
//     for (let col = 0; col < GRID_SIZE.columns; col++) {
//       const zoneId = `ZONE_${row.toString().padStart(2, "0")}_${col.toString().padStart(2, "0")}`;
//       const zoneData = dataset[zoneId];
//       const hasData = Boolean(zoneData);

//       rectangles.push(
//         <Rectangle
//           key={zoneId}
//           bounds={zoneData ? zoneData.bounds : [[0, 0], [0, 0]]}
//           pathOptions={{
//             color: hasData ? zoneData!.riskColor : "#4B5563",
//             weight: hasData ? 2 : 1,
//             dashArray: hasData ? undefined : "3, 6",
//             fillOpacity: hasData ? 0.4 : 0.05,
//             fillColor: hasData ? zoneData!.riskColor : "transparent"
//           }}
//           eventHandlers={{
//             click: () => {
//               if (hasData) setSelectedZone(zoneId);
//             },
//             mouseover: (e: any) => {
//               e.target.setStyle({ weight: hasData ? 3 : 1.5, fillOpacity: hasData ? 0.6 : 0.1 });
//             },
//             mouseout: (e: any) => {
//               e.target.setStyle({ weight: hasData ? 2 : 1, fillOpacity: hasData ? 0.4 : 0.05 });
//             }
//           }}
//         >
//           {hasData && (
//             <Tooltip sticky direction="top" offset={[0, -8]}>
//               <div className="bg-gray-900 text-white p-2 text-sm border border-gray-600">
//                 <div className="font-semibold">{zoneData!.coordinateId}</div>
//                 <div className="flex items-center gap-2 mt-1">
//                   <div className="w-3 h-3" style={{ backgroundColor: zoneData!.riskColor }} />
//                   <span>{zoneData!.risk} Risk ({zoneData!.riskLevel}%)</span>
//                 </div>
//                 <div className="text-gray-300 text-sm mt-1">{zoneData!.status}</div>
//               </div>
//             </Tooltip>
//           )}
//         </Rectangle>
//       );
//     }
//   }

//   const selectedZoneData = selectedZone ? dataset[selectedZone] : null;

//   return (
//     <div className="h-full w-full relative bg-gray-900 overflow-hidden">
//       {/* Header */}
//       <div className="absolute top-0 left-0 right-0 bg-gray-800/95 backdrop-blur-sm p-2 z-[1001] border-b border-gray-700">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <div className="px-2 py-1 text-xs bg-red-700 text-white font-semibold">LIVE</div>
//             <span className="text-gray-300 text-sm font-medium">Mine Zone Monitoring</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="px-2 py-1 text-xs bg-gray-700 text-gray-300 border border-gray-600">Last Update: 2m ago</div>
//             <div className="w-2 h-2 bg-green-500 animate-pulse" />
//           </div>
//         </div>
//       </div>

//       {/* Map */}
//       <div className="pt-10 h-full">
//         <MapContainer
//           center={[BASE_COORDINATES.lat, BASE_COORDINATES.lng]}
//           zoom={14}
//           minZoom={13}
//           maxZoom={17}
//           style={{ height: "100%", width: "100%", backgroundColor: "#111827" }}
//           zoomControl={false}
//         >
//           <ImageOverlay url="/images/map.svg" bounds={imageBounds} opacity={0.75} />
//           {rectangles}
//         </MapContainer>
//       </div>

//       {/* Zone Details */}
//       {selectedZoneData && (
//         <div className="absolute bottom-2 right-2 bg-gray-800/95 backdrop-blur-sm border border-gray-600 p-4 text-sm z-[1000] max-w-80">
//           <div className="flex items-center justify-between mb-3">
//             <h3 className="font-bold text-white text-base">Zone Details</h3>
//             <button className="text-gray-400 hover:text-white text-lg font-bold w-6 h-6 flex items-center justify-center" onClick={() => setSelectedZone(null)}>×</button>
//           </div>

//           <div className="space-y-3">
//             <div>
//               <span className="text-gray-400">Coordinates:</span>
//               <div className="text-white font-mono text-sm">{selectedZoneData.coordinateId}</div>
//             </div>

//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <div className="w-4 h-4" style={{ backgroundColor: selectedZoneData.riskColor }} />
//                 <span className="text-gray-300">{selectedZoneData.risk} Risk</span>
//               </div>
//               <span className="text-white font-bold text-lg">{selectedZoneData.riskLevel}%</span>
//             </div>

//             <div className="flex items-center justify-between">
//               <span className="text-gray-400">Status:</span>
//               <span className="text-white font-medium">{selectedZoneData.status}</span>
//             </div>

//             <div className="border-t border-gray-700 pt-3">
//               <div className="text-gray-300 font-semibold mb-2">Readings</div>
//               <div className="space-y-2 max-h-32 overflow-y-auto">
//                 {selectedZoneData.readings.map((r, idx) => (
//                   <div key={idx} className="flex items-center justify-between p-2 bg-gray-700/50">
//                     <span className="text-gray-300 capitalize text-sm">{r.type}</span>
//                     <span className="text-white font-medium">{r.value}{r.unit}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">Last updated: {selectedZoneData.lastUpdated}</div>
//           </div>
//         </div>
//       )}

//       {/* Styles */}
//       <style jsx global>{`
//         .leaflet-container { background: #111827 !important; }
//         .leaflet-control-zoom { display: none !important; }
//         * { border-radius: 0 !important; }
//       `}</style>
//     </div>
//   );
// }

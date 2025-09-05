// // AlertsPanel.tsx
// "use client";

// import React, { JSX, useEffect, useMemo, useRef, useState } from "react";

// /** ---------------- Types ---------------- **/
// type SensorType = "temperature" | "humidity" | "gas" | "pressure" | "vibration";
// type SensorStatus = "online" | "offline" | "warning";
// type ZoneRisk = "Low" | "Medium" | "High" | "Critical";
// type ZoneStatus = "Active" | "Restricted" | "Monitoring" | "Maintenance";

// interface SensorData {
//   id: string;
//   type: SensorType;
//   value: number;
//   unit: string;
//   status: SensorStatus;
//   lastUpdate: string;
//   coordinates: { lat: number; lng: number };
// }

// interface ZoneData {
//   id: string;
//   name?: string;
//   coordinateId: string;
//   risk: ZoneRisk;
//   riskLevel: number; // 0..100
//   riskColor: string;
//   status: ZoneStatus;
//   lastUpdated: string;
//   sensors: SensorData[];
//   coordinates: { lat: number; lng: number };
//   bounds?: [[number, number], [number, number]];
//   trend24h?: { t: string; v: number }[];
// }

// type Severity = "Low" | "Medium" | "High" | "Critical";

// interface Alert {
//   id: string;
//   zoneId?: string | null;
//   time: string; // display
//   isoTime: string; // machine time
//   riskLevel: number; // 0..100
//   severity: Severity;
//   probability: number; // 0..100
//   trigger: string;
//   triggerType: "geotechnical" | "environmental" | "system" | "other";
//   sensorsAffected?: string[];
//   droneId?: string | null;
//   location?: { lat: number; lng: number } | null;
//   acknowledged?: boolean;
//   acknowledgedAt?: string | null;
// }

// /** ---------------- Config ---------------- **/
// const SIM_INTERVAL_MS = 120000; // default 2 minutes; change to 20000 for fast dev
// const MAX_ACTIVE = 60;

// /** ---------------- Helpers ---------------- **/
// const uid = (prefix = "") => `${prefix}${Math.random().toString(36).slice(2, 9)}`;
// const nowDisplay = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
// const isoNow = () => new Date().toISOString();

// const severityRank = (s: Severity) => (s === "Critical" ? 4 : s === "High" ? 3 : s === "Medium" ? 2 : 1);

// const riskToBand = (v: number): ZoneRisk => (v <= 30 ? "Low" : v <= 60 ? "Medium" : v <= 90 ? "High" : "Critical");

// const riskColors: Record<ZoneRisk, string> = {
//   Low: "#10B981",
//   Medium: "#F59E0B",
//   High: "#EF4444",
//   Critical: "#7f1d1d",
// };

// /** ---------------- Mock dataset generator (self-contained) ---------------- **/
// function createMockDataset(): Record<string, ZoneData> {
//   const zones: Record<string, ZoneData> = {};
//   // small set of themed zones for demo
//   const baseLat = 23.7644;
//   const baseLng = 86.4131;
//   const activeCells = [
//     { r: 2, c: 4, base: 15, name: "North Slope" },
//     { r: 6, c: 8, base: 85, name: "West Cut" },
//     { r: 4, c: 12, base: 60, name: "East Bench" },
//     { r: 8, c: 15, base: 95, name: "Main Pit" },
//     { r: 1, c: 18, base: 25, name: "South Ridge" },
//     { r: 10, c: 3, base: 45, name: "Access Road" },
//     { r: 5, c: 16, base: 78, name: "Processing Yard" },
//     { r: 11, c: 1, base: 92, name: "Tailings Dam" },
//   ];

//   activeCells.forEach((c, i) => {
//     const id = `ZONE_${String(i + 1).padStart(2, "0")}_${c.r}`;
//     const riskLevel = Math.max(0, Math.min(100, Math.round(c.base + (Math.random() - 0.5) * 10)));
//     const risk = riskToBand(riskLevel);
//     const sensors: SensorData[] = [];
//     const types: SensorType[] = ["temperature", "humidity", "gas", "pressure", "vibration"];
//     const count = 2 + (i % 3); // 2-4 sensors
//     for (let s = 0; s < count; s++) {
//       const t = types[s % types.length];
//       const unit = t === "temperature" ? "°C" : t === "humidity" ? "%" : t === "gas" ? "ppm" : t === "pressure" ? "hPa" : "Hz";
//       const valueBase = t === "temperature" ? 25 + (i % 6) : t === "humidity" ? 50 + (i % 30) : t === "gas" ? 120 + (i % 200) : t === "pressure" ? 990 + (i % 30) : 8 + (i % 10);
//       const value = Math.round(valueBase + (Math.random() - 0.5) * 6);
//       const status: SensorStatus = Math.random() > 0.9 ? "offline" : value > (t === "pressure" ? 1015 : 80) ? "warning" : "online";
//       sensors.push({
//         id: `${id}_${t.toUpperCase()}_${s + 1}`,
//         type: t,
//         value,
//         unit,
//         status,
//         lastUpdate: `${Math.floor(Math.random() * 5) + 1}m ago`,
//         coordinates: { lat: baseLat + Math.random() * 0.01, lng: baseLng + Math.random() * 0.01 },
//       });
//     }

//     zones[id] = {
//       id,
//       name: c.name,
//       coordinateId: `${(baseLat + i * 0.001).toFixed(6)}, ${(baseLng + i * 0.001).toFixed(6)}`,
//       risk,
//       riskLevel,
//       riskColor: riskColors[risk],
//       status: ["Active", "Monitoring", "Maintenance", "Restricted"][i % 4] as ZoneStatus,
//       lastUpdated: `${Math.floor(Math.random() * 6) + 1}m ago`,
//       sensors,
//       coordinates: { lat: baseLat + i * 0.001, lng: baseLng + i * 0.001 },
//       trend24h: Array.from({ length: 24 }).map((_, h) => ({ t: `${h}:00`, v: Math.max(0, Math.min(100, Math.round(riskLevel + Math.sin((h / 24) * Math.PI * 2) * 8))) })),
//     };
//   });

//   return zones;
// }

// /** ---------------- Alerts generator ---------------- **/
// function generateAlertsFromDataset(dataset: Record<string, ZoneData>): Alert[] {
//   const out: Alert[] = [];
//   Object.values(dataset).forEach((z) => {
//     // zone level alert if risk >= 50
//     if (z.riskLevel >= 50) {
//       const sev: Severity = z.riskLevel >= 95 ? "Critical" : z.riskLevel >= 75 ? "High" : "Medium";
//       out.push({
//         id: `ALRT_ZONE_${z.id}_${Date.now()}_${uid()}`,
//         zoneId: z.id,
//         time: nowDisplay(),
//         isoTime: isoNow(),
//         riskLevel: z.riskLevel,
//         severity: sev,
//         probability: z.riskLevel,
//         trigger: sev === "Critical" ? "High displacement detected" : `${sev} risk detected`,
//         triggerType: "geotechnical",
//         sensorsAffected: z.sensors.filter((s) => s.status !== "online").map((s) => s.id),
//         location: z.coordinates,
//         acknowledged: false,
//         acknowledgedAt: null,
//       });
//     }

//     // sensor specific alerts
//     z.sensors.forEach((s) => {
//       if (s.status === "offline" || s.status === "warning") {
//         out.push({
//           id: `ALRT_SENSOR_${s.id}_${Date.now()}_${uid()}`,
//           zoneId: z.id,
//           time: nowDisplay(),
//           isoTime: isoNow(),
//           riskLevel: z.riskLevel,
//           severity: s.status === "offline" ? "High" : "Medium",
//           probability: Math.min(100, z.riskLevel + (s.status === "offline" ? 20 : 10)),
//           trigger: s.status === "offline" ? "Sensor offline" : `${s.type} sensor warning`,
//           triggerType: "system",
//           sensorsAffected: [s.id],
//           location: s.coordinates,
//           acknowledged: false,
//           acknowledgedAt: null,
//         });
//       }
//     });
//   });

//   out.sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || b.probability - a.probability || (b.isoTime > a.isoTime ? 1 : -1));
//   return out;
// }

// /** ---------------- Component ---------------- **/
// export default function AlertsPanelStandalone(): JSX.Element {
//   // self-contained dataset
//   const dataset = useMemo(() => createMockDataset(), []);

//   // alerts state + history
//   const [alerts, setAlerts] = useState<Alert[]>(() => generateAlertsFromDataset(dataset).slice(0, 4));
//   const [history, setHistory] = useState<Alert[]>(() => {
//     try {
//       const raw = localStorage.getItem("alerts_demo_history_v1");
//       return raw ? JSON.parse(raw) : [];
//     } catch {
//       return [];
//     }
//   });

//   const dedupe = useRef<Set<string>>(new Set());
//   const intervalRef = useRef<number | null>(null);

//   // persist history
//   useEffect(() => {
//     try {
//       localStorage.setItem("alerts_demo_history_v1", JSON.stringify(history.slice(0, 200)));
//     } catch {}
//   }, [history]);

//   // highlight selection (internal only — because no external map here)
//   const [highlightedZone, setHighlightedZone] = useState<string | null>(null);

//   // append utility
//   const appendAlerts = (incoming: Alert[]) => {
//     setAlerts((prev) => {
//       // dedupe fingerprint zone|trigger|prob
//       const combined = [...incoming, ...prev];
//       const seen = new Set<string>();
//       const out: Alert[] = [];
//       for (const a of combined) {
//         const k = `${a.zoneId}|${a.trigger}|${a.probability}`;
//         if (seen.has(k)) continue;
//         seen.add(k);
//         out.push(a);
//       }
//       out.sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || b.probability - a.probability || (b.isoTime > a.isoTime ? 1 : -1));
//       return out.slice(0, MAX_ACTIVE);
//     });
//   };

//   // simulate periodic alerts (append, not modal). We'll bias one to high severity sometimes.
//   useEffect(() => {
//     // tick function picks 1-3 generated alerts not recently appended
//     const tick = () => {
//       const candidates = generateAlertsFromDataset(dataset);
//       if (!candidates.length) return;

//       const out: Alert[] = [];

//       // Try to pick at least one critical/high if present and not recently used
//       const critical = candidates.find((c) => c.severity === "Critical") || candidates.find((c) => c.severity === "High");
//       if (critical) {
//         const fp = `${critical.zoneId}|${critical.trigger}|${critical.probability}`;
//         if (!dedupe.current.has(fp)) {
//           const clone: Alert = { ...critical, id: `SIM_${critical.id}_${Date.now()}_${uid()}`, time: nowDisplay(), isoTime: isoNow() };
//           out.push(clone);
//           dedupe.current.add(fp);
//         }
//       }

//       // pick 0..2 random others
//       const others = candidates.filter((c) => c !== critical);
//       const pickCount = Math.floor(Math.random() * 3); // 0,1,2
//       for (let i = 0; i < pickCount; i++) {
//         const r = others[Math.floor(Math.random() * others.length)];
//         if (!r) break;
//         const fp = `${r.zoneId}|${r.trigger}|${r.probability}`;
//         if (dedupe.current.has(fp)) continue;
//         const clone: Alert = { ...r, id: `SIM_${r.id}_${Date.now()}_${uid()}`, time: nowDisplay(), isoTime: isoNow() };
//         out.push(clone);
//         dedupe.current.add(fp);
//       }

//       if (out.length) appendAlerts(out);
//     };

//     // initial seed (immediate)
//     tick();

//     // set interval
//     intervalRef.current = window.setInterval(tick, SIM_INTERVAL_MS);
//     return () => {
//       if (intervalRef.current) {
//         window.clearInterval(intervalRef.current);
//         intervalRef.current = null;
//       }
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [dataset]);

//   // actions
//   const acknowledge = (id: string) => {
//     setAlerts((prev) => {
//       const found = prev.find((a) => a.id === id);
//       if (found) {
//         found.acknowledged = true;
//         found.acknowledgedAt = new Date().toISOString();
//         setHistory((h) => [found, ...h].slice(0, 500));
//       }
//       return prev.filter((a) => a.id !== id);
//     });
//   };

//   const alertOthers = (a: Alert) => {
//     // placeholder — integrate with real API
//     console.log("Alert others (simulate):", a);
//     // small toast-like UI could be added; for now we'll just console log
//   };

//   const onHighlight = (zoneId?: string | null) => {
//     setHighlightedZone(zoneId || null);
//     // if a zoneId is passed, also show that zone details briefly
//     if (zoneId) {
//       // clear highlight after 4s for demo
//       window.setTimeout(() => setHighlightedZone(null), 4000);
//     }
//   };

//   // small UI helpers
//   const badgeClass = (s: Severity) =>
//     s === "Critical" ? "bg-red-800 text-red-100" : s === "High" ? "bg-red-600 text-white" : s === "Medium" ? "bg-amber-600 text-white" : "bg-emerald-700 text-white";

// return (
//     <div className="h-full flex flex-col bg-gray-900 border-r border-gray-700">
//       {/* Header */}
//       <div className="bg-gray-800/95 px-4 py-3 flex items-center justify-between border-b border-gray-700">
//         <div>
//           <div className="text-sm font-semibold text-gray-200">Alerts</div>
//           {/* <div className="text-xs text-gray-400">Live stream — appending (demo)</div> */}
//         </div>

//         <div className="flex items-center gap-3">
//           <div className="text-xs text-gray-300">{alerts.length} active</div>
//           <button
//             onClick={() => {
//               // acknowledge all visible alerts
//               setAlerts((prev) => {
//                 const now = new Date().toISOString();
//                 const toHist = prev.map((a) => ({ ...a, acknowledged: true, acknowledgedAt: now }));
//                 setHistory((h) => [...toHist, ...h].slice(0, 500));
//                 return [];
//               });
//             }}
//             className="text-xs px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 hover:bg-gray-700"
//           >
//             Acknowledge All
//           </button>
//         </div>
//       </div>

//       {/* Highlight box (because we don't have external map to highlight) */}
//       <div className="p-3 border-b border-gray-800">
//         {highlightedZone ? (
//           <div className="text-sm text-gray-100">
//             Highlighting <span className="font-semibold">{highlightedZone}</span> — (demo highlight)
//           </div>
//         ) : (
//           // <div className="text-sm text-gray-400">Click "📍 Highlight" to preview zone</div>
//           null
//         )}
//       </div>

//       {/* Alerts list */}
//       <div className="p-3 overflow-auto space-y-3 flex-1">
//         {alerts.length === 0 ? (
//           <div className="text-sm text-gray-500">No active alerts</div>
//         ) : (
//           alerts.map((a) => (
//             <div key={a.id} className="bg-gray-800 p-3 rounded-md border border-gray-700">
//               <div className="flex justify-between items-start">
//                 <div className="text-xs text-gray-400">#{a.id.split("_").slice(-1)[0]} • {a.time}</div>
//                 <div className={`text-xs font-semibold px-2 py-0.5 rounded-md ${badgeClass(a.severity)}`}>
//                   {a.severity} • {a.probability}%
//                 </div>
//               </div>

//               <div className="mt-2 flex items-center justify-between">
//                 <div>
//                   <div className="text-sm font-semibold text-white">{a.trigger}</div>
//                   <div className="text-xs text-gray-400">
//                     {a.zoneId ?? "Unknown Zone"} • {a.sensorsAffected?.length ?? 0} sensors • {a.location ? `${a.location.lat.toFixed(4)}, ${a.location.lng.toFixed(4)}` : ""}
//                   </div>
//                 </div>

//                 <div className="flex flex-col gap-2">
//                   <button
//                     onClick={() => onHighlight(a.zoneId)}
//                     className="text-xs px-2 py-1 bg-gray-700 border border-gray-600 rounded"
//                   >
//                     📍 Highlight
//                   </button>

//                   <button onClick={() => alertOthers(a)} className="text-xs px-2 py-1 bg-rose-600 text-white rounded">
//                     Alert Others
//                   </button>

//                   <button onClick={() => acknowledge(a.id)} className="text-xs px-2 py-1 bg-gray-700 text-gray-200 rounded">
//                     Acknowledge
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))
//         )}
//       </div>

//       {/* History */}
//       <div className="p-3 border-t border-gray-800">
//         <div className="flex items-center justify-between mb-2">
//           <div className="text-xs text-gray-300 font-medium">History</div>
//           <div className="text-xs text-gray-400">{history.length}</div>
//         </div>

//         <div className="max-h-36 overflow-auto space-y-1">
//           {history.length === 0 ? (
//             <div className="text-xs text-gray-500">No acknowledged alerts</div>
//           ) : (
//             history.slice(0, 8).map((h) => (
//               <div key={h.id} className="text-xs text-gray-300 flex justify-between">
//                 <div>{h.trigger}</div>
//                 <div className="text-gray-500">{new Date(h.acknowledgedAt || h.isoTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//     </div>
//   );

// }

//  <div className="h-full flex flex-col bg-[#1E1E2F] border-r border-[#3A3A55]">
//   {/* Header */}
//   <div className="bg-[#2B2B40] px-4 py-3 flex items-center justify-between border-b border-[#3A3A55]">
//     <div>
//       <div className="text-sm font-semibold text-[#EAEAEA]">Alerts</div>
//       <div className="text-xs text-[#A0A0B3]">Live stream — appending (demo)</div>
//     </div>

//     <div className="flex items-center gap-3">
//       <div className="text-xs text-[#EAEAEA]">{alerts.length} active</div>
//       <button
//         onClick={() => {
//           setAlerts((prev) => {
//             const now = new Date().toISOString();
//             const toHist = prev.map((a) => ({ ...a, acknowledged: true, acknowledgedAt: now }));
//             setHistory((h) => [...toHist, ...h].slice(0, 500));
//             return [];
//           });
//         }}
//         className="text-xs px-2 py-1 bg-[#3A86FF] rounded text-white hover:opacity-90"
//       >
//         Acknowledge All
//       </button>
//     </div>
//   </div>

//   {/* Highlight box */}
//   <div className="p-3 border-b border-[#3A3A55]">
//     {highlightedZone ? (
//       <div className="text-sm text-[#EAEAEA]">
//         Highlighting <span className="font-semibold">{highlightedZone}</span> — (demo highlight)
//       </div>
//     ) : (
//       <div className="text-sm text-[#A0A0B3]">Click "📍 Highlight" to preview zone</div>
//     )}
//   </div>

//   {/* Alerts list */}
//   <div className="p-3 overflow-auto space-y-3 flex-1">
//     {alerts.length === 0 ? (
//       <div className="text-sm text-[#A0A0B3]">No active alerts</div>
//     ) : (
//       alerts.map((a) => {
//         // background based on severity
//         let panelBg = "bg-[#2B2B40]";
//         if (a.severity === "Critical") panelBg = "bg-[#2C0A0A]";
//         if (a.severity === "Warning") panelBg = "bg-[#3A2A00]";
//         if (a.severity === "Success") panelBg = "bg-[#0A3320]";

//         return (
//           <div key={a.id} className={`${panelBg} p-3 rounded-md border border-[#3A3A55]`}>
//             <div className="flex justify-between items-start">
//               <div className="text-xs text-[#A0A0B3]">
//                 #{a.id.split("_").slice(-1)[0]} • {a.time}
//               </div>
//               <div
//                 className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
//                   a.severity === "Critical"
//                     ? "text-red-400"
//                     : a.severity === "Warning"
//                     ? "text-yellow-400"
//                     : a.severity === "Success"
//                     ? "text-green-400"
//                     : "text-[#EAEAEA]"
//                 }`}
//               >
//                 {a.severity} • {a.probability}%
//               </div>
//             </div>

//             <div className="mt-2 flex items-center justify-between">
//               <div>
//                 <div className="text-sm font-semibold text-[#EAEAEA]">{a.trigger}</div>
//                 <div className="text-xs text-[#A0A0B3]">
//                   {a.zoneId ?? "Unknown Zone"} • {a.sensorsAffected?.length ?? 0} sensors •{" "}
//                   {a.location ? `${a.location.lat.toFixed(4)}, ${a.location.lng.toFixed(4)}` : ""}
//                 </div>
//               </div>

//               <div className="flex flex-col gap-2">
//                 <button
//                   onClick={() => onHighlight(a.zoneId)}
//                   className="text-xs px-2 py-1 bg-[#3A86FF] rounded text-white hover:opacity-90"
//                 >
//                   📍 Highlight
//                 </button>

//                 <button
//                   onClick={() => alertOthers(a)}
//                   className="text-xs px-2 py-1 bg-rose-600 text-white rounded hover:opacity-90"
//                 >
//                   Alert Others
//                 </button>

//                 <button
//                   onClick={() => acknowledge(a.id)}
//                   className="text-xs px-2 py-1 bg-[#3A86FF] rounded text-white hover:opacity-90"
//                 >
//                   Acknowledge
//                 </button>
//               </div>
//             </div>
//           </div>
//         );
//       })
//     )}
//   </div>

//   {/* History */}
//   <div className="p-3 border-t border-[#3A3A55]">
//     <div className="flex items-center justify-between mb-2">
//       <div className="text-xs text-[#EAEAEA] font-medium">History</div>
//       <div className="text-xs text-[#A0A0B3]">{history.length}</div>
//     </div>

//     <div className="max-h-36 overflow-auto space-y-1">
//       {history.length === 0 ? (
//         <div className="text-xs text-[#A0A0B3]">No acknowledged alerts</div>
//       ) : (
//         history.slice(0, 8).map((h) => (
//           <div key={h.id} className="text-xs text-[#EAEAEA] flex justify-between">
//             <div>{h.trigger}</div>
//             <div className="text-[#A0A0B3]">
//               {new Date(h.acknowledgedAt || h.isoTime).toLocaleTimeString([], {
//                 hour: "2-digit",
//                 minute: "2-digit",
//               })}
//             </div>
//           </div>
//         ))
//       )}
//     </div>
//   </div>
// </div>

// AlertsPanelLite.tsx
"use client";

// import React, { JSX, useState } from "react";

// type Severity = "Low" | "Medium" | "High" | "Critical";

// interface Alert {
//   id: string;
//   message: string;
//   zone: string;
//   severity: Severity;
//   probability: number; // 0-100
//   sensorsAffected: number;
//   time: string;
// }

// const badgeClass = (s: Severity) =>
//   s === "Critical"
//     ? "bg-red-800 text-red-100"
//     : s === "High"
//     ? "bg-red-600 text-white"
//     : s === "Medium"
//     ? "bg-amber-600 text-white"
//     : "bg-emerald-700 text-white";

// export default function AlertsPanelLite(): JSX.Element {
//   const [alerts, setAlerts] = useState<Alert[]>([
//     {
//       id: "1",
//       message: "High vibration detected",
//       zone: "Zone A",
//       severity: "High",
//       probability: 85,
//       sensorsAffected: 3,
//       time: "09:42",
//     },
//     {
//       id: "2",
//       message: "Temperature warning",
//       zone: "Zone C",
//       severity: "Medium",
//       probability: 65,
//       sensorsAffected: 1,
//       time: "09:37",
//     },
//     {
//       id: "3",
//       message: "Tailings Dam at critical level",
//       zone: "Zone D",
//       severity: "Critical",
//       probability: 98,
//       sensorsAffected: 5,
//       time: "09:35",
//     },
//   ]);

//   const [history, setHistory] = useState<Alert[]>([]);

//   const acknowledge = (id: string) => {
//   setAlerts((prev) => {
//     const found = prev.find((a) => a.id === id);
//     if (found) {
//       setHistory((h) => {
//         const key = `${found.message}-${found.time}`;
//         // only add if not already in history
//         if (h.some((x) => `${x.message}-${x.time}` === key)) return h;
//         return [found, ...h].slice(0, 10);
//       });
//     }
//     return prev.filter((a) => a.id !== id);
//   });
// };

//   return (
//     <div className="h-full flex flex-col bg-gray-900 border-r border-gray-700">
//       {/* Header */}
//       <div className="bg-gray-800/95 px-4 py-3 flex items-center justify-between border-b border-gray-700">
//         <div className="text-sm font-semibold text-gray-200">Alerts</div>
//         <div className="text-xs text-gray-400">{alerts.length} active</div>
//       </div>

//       {/* Alerts list */}
//       <div className="p-4 space-y-3 overflow-auto flex-1">
//         {alerts.length === 0 ? (
//           <div className="text-sm text-gray-500">No active alerts</div>
//         ) : (
//           alerts.map((a) => (
//             <div
//               key={a.id}
//               className="bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-sm"
//             >
//               <div className="flex items-center justify-between">
//                 <span className="text-xs text-gray-400">{a.time}</span>
//                 <span
//                   className={`text-xs font-semibold px-2 py-0.5 rounded-md ${badgeClass(
//                     a.severity
//                   )}`}
//                 >
//                   {a.severity} • {a.probability}%
//                 </span>
//               </div>

//               <div className="mt-2 text-sm text-white font-medium">
//                 {a.message}
//               </div>
//               <div className="text-xs text-gray-400">
//                 {a.zone} • {a.sensorsAffected} sensors affected
//               </div>

//               <button
//                 onClick={() => acknowledge(a.id)}
//                 className="mt-3 text-xs px-2 py-1 bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
//               >
//                 Acknowledge
//               </button>
//             </div>
//           ))
//         )}
//       </div>

//       {/* History */}
//       <div className="p-3 border-t border-gray-800">
//         <div className="flex items-center justify-between mb-2">
//           <div className="text-xs text-gray-300 font-medium">History</div>
//           <div className="text-xs text-gray-400">{history.length}</div>
//         </div>

//         <div className="max-h-32 overflow-auto space-y-1">
//           {history.length === 0 ? (
//             <div className="text-xs text-gray-500">
//               No acknowledged alerts yet
//             </div>
//           ) : (
//             history.map((h) => (
//               <div
//                 key={h.id}
//                 className="text-xs text-gray-300 flex justify-between"
//               >
//                 <div>{h.message}</div>
//                 <div className="text-gray-500">{h.time}</div>
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// AlertsPanelLite.tsx
"use client";

import React, { JSX, useState } from "react";

interface ZoneAlert {
  id: string; // zoneId
  coordinateId: string;
  risk: string;
  riskLevel: number;
  riskColor: string;
  status: string;
  lastUpdated: string;
}

const badgeClass = (s: string) => {
  switch (s.toLowerCase()) {
    case "low":
      return "bg-green-800";
    case "medium":
      return "bg-yellow-800";
    case "high":
      return "bg-orange-800";
    case "critical":
      return "bg-red-600";
    default:
      return "bg-gray-400"; // fallback
  }
};

interface AlertsPanelLiteProps {
  onHighlight: (id: string) => void; // 🔹 highlight callback
}

export default function AlertsPanelLite({
  onHighlight,
}: AlertsPanelLiteProps): JSX.Element {
  const data = [
    {
      id: "ZONE_02_04",
      coordinateId: "23.758400, 86.405925",
      risk: "Low",
      riskLevel: 15,
      riskColor: "#34D399",
      status: "Maintenance",
      lastUpdated: "5m ago",
    },
    {
      id: "ZONE_06_08",
      coordinateId: "23.763200, 86.411143",
      risk: "High",
      riskLevel: 85,
      riskColor: "#FB923C",
      status: "Active",
      lastUpdated: "4m ago",
    },
    {
      id: "ZONE_04_12",
      coordinateId: "23.760800, 86.416362",
      risk: "Medium",
      riskLevel: 60,
      riskColor: "#FCD34D",
      status: "Active",
      lastUpdated: "5m ago",
    },
    {
      id: "ZONE_08_15",
      coordinateId: "23.765600, 86.420275",
      risk: "High",
      riskLevel: 95,
      riskColor: "#FB923C",
      status: "Maintenance",
      lastUpdated: "4m ago",
    },
    {
      id: "ZONE_01_18",
      coordinateId: "23.757200, 86.424189",
      risk: "Low",
      riskLevel: 25,
      riskColor: "#34D399",
      status: "Active",
      lastUpdated: "1m ago",
    },
    {
      id: "ZONE_10_03",
      coordinateId: "23.768000, 86.404620",
      risk: "Medium",
      riskLevel: 45,
      riskColor: "#FCD34D",
      status: "Maintenance",
      lastUpdated: "1m ago",
    },
    {
      id: "ZONE_05_16",
      coordinateId: "23.762000, 86.421580",
      risk: "High",
      riskLevel: 78,
      riskColor: "#FB923C",
      status: "Restricted",
      lastUpdated: "2m ago",
    },
    {
      id: "ZONE_12_09",
      coordinateId: "23.770400, 86.412448",
      risk: "Low",
      riskLevel: 18,
      riskColor: "#34D399",
      status: "Maintenance",
      lastUpdated: "5m ago",
    },
    {
      id: "ZONE_03_06",
      coordinateId: "23.759600, 86.408534",
      risk: "Medium",
      riskLevel: 55,
      riskColor: "#FCD34D",
      status: "Restricted",
      lastUpdated: "1m ago",
    },
    {
      id: "ZONE_07_11",
      coordinateId: "23.764400, 86.415057",
      risk: "High",
      riskLevel: 82,
      riskColor: "#FB923C",
      status: "Restricted",
      lastUpdated: "5m ago",
    },
    {
      id: "ZONE_09_05",
      coordinateId: "23.766800, 86.407229",
      risk: "Medium",
      riskLevel: 65,
      riskColor: "#FCD34D",
      status: "Restricted",
      lastUpdated: "5m ago",
    },
    {
      id: "ZONE_00_14",
      coordinateId: "23.756000, 86.418971",
      risk: "Low",
      riskLevel: 30,
      riskColor: "#34D399",
      status: "Monitoring",
      lastUpdated: "5m ago",
    },
    {
      id: "ZONE_11_01",
      coordinateId: "23.769200, 86.402011",
      risk: "High",
      riskLevel: 92,
      riskColor: "#FB923C",
      status: "Active",
      lastUpdated: "4m ago",
    },
    {
      id: "ZONE_13_17",
      coordinateId: "23.771600, 86.422885",
      risk: "Medium",
      riskLevel: 50,
      riskColor: "#FCD34D",
      status: "Monitoring",
      lastUpdated: "3m ago",
    },
    {
      id: "ZONE_14_07",
      coordinateId: "23.772800, 86.409838",
      risk: "Low",
      riskLevel: 22,
      riskColor: "#34D399",
      status: "Restricted",
      lastUpdated: "3m ago",
    },
    {
      id: "ZONE_06_02",
      coordinateId: "23.763200, 86.403315",
      risk: "High",
      riskLevel: 75,
      riskColor: "#FB923C",
      status: "Monitoring",
      lastUpdated: "5m ago",
    },
  ];

  const [alerts, setAlerts] = useState<ZoneAlert[]>(data);
  const [history, setHistory] = useState<ZoneAlert[]>([]);

  const acknowledge = (id: string) => {
    setAlerts((prev) => {
      const found = prev.find((a) => a.id === id);
      if (found) {
        setHistory((h) => {
          const key = `${found.id}-${found.lastUpdated}`;
          if (h.some((x) => `${x.id}-${x.lastUpdated}` === key)) return h;
          return [found, ...h].slice(0, 10);
        });
      }
      return prev.filter((a) => a.id !== id);
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 border-r border-gray-700">
      {/* Header */}
      <div className="bg-gray-800/95 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="text-sm font-semibold text-gray-200">Alerts</div>
        <div className="text-xs text-gray-400">{alerts.length} active</div>
      </div>

      {/* Alerts list */}
      <div className="p-4 space-y-3 overflow-auto flex-1">
        {alerts.length === 0 ? (
          <div className="text-sm text-gray-500">No active alerts</div>
        ) : (
          alerts.map((a) => (
            <div
              key={a.id}
              className="bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{a.lastUpdated}</span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-md ${badgeClass(
                    a.risk
                  )}`}
                >
                  {a.risk} • {a.riskLevel}%
                </span>
              </div>

              <div className="mt-2 text-sm text-white font-medium">{a.id}</div>
              <div className="text-xs text-gray-400">
                {a.status} • {a.coordinateId}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => acknowledge(a.id)}
                  className="text-xs px-2 py-1 bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
                >
                  Acknowledge
                </button>
                <button
                  onClick={() => onHighlight(a.id)} // 🔹 highlight callback
                  className="text-xs px-2 py-1 bg-blue-700 text-white rounded hover:bg-blue-600"
                >
                  Highlight
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* History */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-300 font-medium">History</div>
          <div className="text-xs text-gray-400">{history.length}</div>
        </div>

        <div className="max-h-32 overflow-auto space-y-1">
          {history.length === 0 ? (
            <div className="text-xs text-gray-500">
              No acknowledged alerts yet
            </div>
          ) : (
            history.map((h) => (
              <div
                key={h.id}
                className="text-xs text-gray-300 flex justify-between"
              >
                <div>{h.id}</div>
                <div className="text-gray-500">{h.lastUpdated}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

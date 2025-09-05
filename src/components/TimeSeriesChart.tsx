// "use client";

// import { useState, useMemo } from "react";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip as RechartsTooltip,
//   ResponsiveContainer,
// } from "recharts";

// type RiskPoint = { t: string; v: number };

// export default function RiskChart() {
//   // 🔹 Threshold (user can later expose as slider/UI)
//   const [threshold] = useState<number>(60);

//   // 🔹 Interval in minutes (5, 10, 20, 30)
//   const [interval, setInterval] = useState<number>(10);

//   // 🔹 Generate random risk data for one day
//   const generateDayData = (step: number): RiskPoint[] => {
//     const points: RiskPoint[] = [];
//     for (let h = 0; h < 24; h++) {
//       for (let m = 0; m < 60; m += step) {
//         const label = `${h.toString().padStart(2, "0")}:${m
//           .toString()
//           .padStart(2, "0")}`;
//         const value = Math.floor(Math.random() * 101); // 0–100%
//         points.push({ t: label, v: value });
//       }
//     }
//     return points;
//   };

//   // 🔹 Generate monthly data (average per day from 1-day dataset)
//   const generateMonthData = (step: number): RiskPoint[] => {
//     const daysInMonth = 30;
//     const monthPoints: RiskPoint[] = [];

//     for (let d = 1; d <= daysInMonth; d++) {
//       let sum = 0;
//       const samples = (24 * 60) / step;
//       for (let i = 0; i < samples; i++) {
//         sum += Math.floor(Math.random() * 101);
//       }
//       const avg = Math.round(sum / samples);
//       monthPoints.push({ t: `Day ${d}`, v: avg });
//     }
//     return monthPoints;
//   };

//   // 🔹 Generate overall average for "all"
//   const generateAllData = (day: RiskPoint[], month: RiskPoint[]): RiskPoint[] => {
//     const avgDay =
//       day.reduce((acc, p) => acc + p.v, 0) / (day.length || 1);
//     const avgMonth =
//       month.reduce((acc, p) => acc + p.v, 0) / (month.length || 1);

//     return [
//       { t: "Day Avg", v: Math.round(avgDay) },
//       { t: "Month Avg", v: Math.round(avgMonth) },
//     ];
//   };

//   // 🔹 Memoized datasets
//   const dayData = useMemo(() => generateDayData(interval), [interval]);
//   const monthData = useMemo(() => generateMonthData(interval), [interval]);
//   const allData = useMemo(() => generateAllData(dayData, monthData), [dayData, monthData]);

//   // 🔹 View toggle
//   const [view, setView] = useState<"day" | "month" | "all">("day");

//   const getData = () => {
//     switch (view) {
//       case "day":
//         return dayData;
//       case "month":
//         return monthData;
//       case "all":
//         return allData;
//       default:
//         return [];
//     }
//   };

//   return (
//         <div className="bg-gray-900 border border-gray-700 rounded-lg h-full flex flex-col p-1">
//       {/* Header + toggle */}
//       <div className="flex items-center justify-between mb-2 flex-shrink-0">
//         <div className="text-sm font-medium text-gray-300">
//           Risk (
//           {view === "day"
//             ? `Last 24h (interval ${interval}m)`
//             : view === "month"
//             ? "This Month (daily avg)"
//             : "Overall Avg"}
//           )
//         </div>

//         <div className="flex gap-1 text-xs">
//           {["day", "month", "all"].map((opt) => (
//             <button
//               key={opt}
//               onClick={() => setView(opt as typeof view)}
//               className={`px-2 py-1 rounded ${
//                 view === opt
//                   ? "bg-gray-700 text-white"
//                   : "bg-gray-800 text-gray-400 hover:text-white"
//               }`}
//             >
//               {opt}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Interval selector (only for day view) */}
//       {view === "day" && (
//          <div className="flex gap-2 mb-2 text-xs flex-shrink-0">
//           {[5, 10, 20, 30].map((i) => (
//             <button
//               key={i}
//               onClick={() => setInterval(i)}
//               className={`px-2 py-1 rounded ${
//                 interval === i
//                   ? "bg-gray-600 text-white"
//                   : "bg-gray-800 text-gray-400 hover:text-white"
//               }`}
//             >
//               {i}m
//             </button>
//           ))}
//         </div>
//       )}

//       {/* Chart */}
//       <div className="flex-grow h-[400px]">
//         <ResponsiveContainer width="100%" height="100%">
//           <LineChart data={getData()}>
//             <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
//             <XAxis dataKey="t" tick={{ fill: "#9ca3af", fontSize: 10 }} />
//             <YAxis domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 10 }} />
//             <RechartsTooltip
//               contentStyle={{
//                 background: "#111827",
//                 border: "1px solid #374151",
//               }}
//               formatter={(value: any) => [
//                 `${value}%`,
//                 "Risk",
//               ]}
//               // 🔹 Red tooltip if above threshold
//               labelStyle={{ color: "#f87171" }}
//               itemStyle={{ color: "#f87171" }}
//             />
//             <Line
//               type="linear"
//               dataKey="v"
//               dot={false}
//               strokeWidth={2}
//               isAnimationActive={false}
//               stroke="#22c55e"
//               // 🔹 Make line red if point > threshold
//               strokeDasharray={getData().some((p) => p.v > threshold) ? "0" : undefined}
//               strokeOpacity={1}
//             />
//           </LineChart>
//         </ResponsiveContainer>
//       </div>

//       {/* Threshold note */}
//        <div className="text-xs text-gray-500 mt-2 flex-shrink-0">
//         Threshold = {threshold}% (values above threshold show alert color)
//       </div>
//     </div>
//   );
// }


"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

type DataPoint = { t: string; v: number };

// 🔹 Helper to generate forecast data
const generateData = (type: "wind" | "rain", step = 3): DataPoint[] => {
  const points: DataPoint[] = [];
  for (let h = 0; h < 24; h += step) {
    const label = `${h.toString().padStart(2, "0")}:00`;
    let value = 0;
    if (type === "wind") {
      value = Math.floor(Math.random() * 61); // 0–60 km/h
    } else {
      value = Math.floor(Math.random() * 101); // 0–100 mm
    }
    points.push({ t: label, v: value });
  }
  return points;
};

// 🔹 Merge two datasets for "all" view
const mergeData = (wind: DataPoint[], rain: DataPoint[]) => {
  return wind.map((w, i) => ({
    t: w.t,
    wind: w.v,
    rain: rain[i]?.v ?? 0,
  }));
};

export default function ForecastChart() {
  // View toggle
  const [view, setView] = useState<"wind" | "rain" | "all">("wind");

  // Forecast datasets
  const windData = useMemo(() => generateData("wind"), []);
  const rainData = useMemo(() => generateData("rain"), []);
  const allData = useMemo(() => mergeData(windData, rainData), [windData, rainData]);

  // Get proper dataset for current view
  const getData = () => {
    if (view === "wind") return windData.map((d) => ({ ...d, wind: d.v }));
    if (view === "rain") return rainData.map((d) => ({ ...d, rain: d.v }));
    if (view === "all") return allData;
    return [];
  };

  // Header text
  const getHeader = () => {
    if (view === "wind") return "Wind Forecast (km/h)";
    if (view === "rain") return "Rainfall Forecast (mm)";
    return "Wind + Rainfall Forecast";
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg h-full flex flex-col p-1">
      {/* Header + toggle */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="text-sm font-medium text-gray-300">{getHeader()}</div>

        <div className="flex gap-1 text-xs">
          {["wind", "rain", "all"].map((opt) => (
            <button
              key={opt}
              onClick={() => setView(opt as typeof view)}
              className={`px-2 py-1 rounded ${
                view === opt
                  ? "bg-gray-700 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-grow h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={getData()}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="t" tick={{ fill: "#9ca3af", fontSize: 10 }} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
            <RechartsTooltip
              contentStyle={{
                background: "#111827",
                border: "1px solid #374151",
              }}
              formatter={(value: any, name: any) => {
                if (name === "wind") return [`${value} km/h`, "Wind"];
                if (name === "rain") return [`${value} mm`, "Rainfall"];
                return value;
              }}
            />

            {/* Wind only */}
            {view === "wind" && (
              <Line type="linear" dataKey="wind" stroke="#3A86FF" strokeWidth={2} dot={false} />
            )}

            {/* Rain only */}
            {view === "rain" && (
              <Line type="linear" dataKey="rain" stroke="#14b8a6" strokeWidth={2} dot={false} />
            )}

            {/* Both together */}
            {view === "all" && (
              <>
                <Line
                  type="linear"
                  dataKey="wind"
                  stroke="#3A86FF"
                  strokeWidth={2}
                  dot={false}
                  name="wind"
                />
                <Line
                  type="linear"
                  dataKey="rain"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  dot={false}
                  name="rain"
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Note */}
      <div className="text-xs text-gray-500 mt-2 flex-shrink-0">
        Forecast values are simulated at IMD-like 3-hour intervals.
      </div>
    </div>
  );
}


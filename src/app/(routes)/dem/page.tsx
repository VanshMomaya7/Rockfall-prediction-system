// "use client";

// import { useEffect, useState } from "react";
// import Plot from "react-plotly.js";

// export default function DemPage() {
//   const [dem, setDem] = useState<number[][] | null>(null);
//   const [slope, setSlope] = useState<number[][] | null>(null);

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         const [demRes, slopeRes] = await Promise.all([
//           fetch("/dem.json"),
//           fetch("/slope.json"),
//         ]);

//         const demData = await demRes.json();
//         const slopeData = await slopeRes.json();

//         setDem(demData);
//         setSlope(slopeData);
//       } catch (err) {
//         console.error("Error loading DEM or slope:", err);
//       }
//     };

//     loadData();
//   }, []);

//   if (!dem || !slope) {
//     return <p className="p-4">Loading DEM & Slope…</p>;
//   }

//   return (
//     <div className="w-full h-screen">
//       <Plot
//         data={
//           [
//             {
//               z: dem,
//               surfacecolor: slope,
//               type: "surface",
//               colorscale: "YlGnBu",
//               contours: {
//                 z: {
//                   show: true,
//                   usecolormap: true,
//                   highlightcolor: "#42f462",
//                   project: { z: true },
//                 },
//               },
//             } as any, // 👈 cast to any
//           ]
//         }
//         layout={{
//           title: { text: "3D DEM with Slope Overlay" },
//           autosize: true,
//           scene: {
//             xaxis: { title: { text: "X" } },
//             yaxis: { title: { text: "Y" } },
//             zaxis: { title: { text: "Elevation (m)" } },
//           },
//         }}
//         style={{ width: "100%", height: "100%" }}
//       />
//     </div>
//   );
// }

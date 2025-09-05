// import SafetyChart from "@/components/Barchart";
// import MineMap from "@/components/MineMap";
// import TimeSeriesChart from "@/components/TimeSeriesChart";
// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="grid grid-cols-4 grid-rows-3  h-screen border-e-red-300 border-2">
//       <div className="col-span-1 row-span-3 border-e-red-300 border-2"></div>
//       <div className="col-span-3 row-span-2 border-e-red-300 border-2"><MineMap /></div>
//       <div className="col-span-3 row-span-1 border-e-red-300 border-2">
//         <TimeSeriesChart />
//       </div>
//     </div>
//   );
// }

"use client"
import AlertsPanel from "@/components/AlertsPanel";
import SafetyChart from "@/components/Barchart";
import MineMap from "@/components/MineMap";
import RiskChart from "@/components/TimeSeriesChart";
import { useState } from "react";

// export default function Home() {
//   return (
//     <div className="grid grid-cols-4 grid-rows-3 h-[calc(100vh-56px)] border border-gray-700">
//       <div className="col-span-1 row-span-3 border-r border-gray-700 p-4">
//         {/* Sidebar content */}
//         <SafetyChart />
//       </div>
//       <div className="col-span-3 row-span-2 border-b border-gray-700">
//         <MineMap />
//       </div>
//       <div className="col-span-3 row-span-1"> {/* Added padding */}
//         <RiskChart />
//       </div>
//     </div>
//   );
// }

export default function Dashboard() {

  const [selectedZone, setSelectedZone] =useState<string | null>('');
  
  return (
    <div className="grid grid-cols-4 grid-rows-[2fr_1fr] h-[calc(100vh-56px)] border border-gray-700">
      <div className="col-span-1 row-span-2 border-r border-gray-700">
        <AlertsPanel onHighlight={setSelectedZone}/>
      </div>
      <div className="col-span-3 row-span-1 border-b border-gray-700">
        <MineMap selectedZone={selectedZone} setSelectedZone={setSelectedZone}/>
      </div>
      <div className="col-span-3 row-span-1 overflow-hidden">
        <RiskChart />
      </div>
    </div>
  );
}

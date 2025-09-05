"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

// Dynamically import components that use browser APIs
const AlertsPanel = dynamic(() => import("@/components/AlertsPanel"), {
  ssr: false,
});
const MineMap = dynamic(() => import("@/components/MineMap"), { ssr: false });
const RiskChart = dynamic(() => import("@/components/TimeSeriesChart"), {
  ssr: false,
});

export default function Dashboard() {
  const [selectedZone, setSelectedZone] = useState<string | null>("");

  return (
    <div className="grid grid-cols-4 grid-rows-[2fr_1fr] h-[calc(100vh-56px)] border border-gray-700">
      <div className="col-span-1 row-span-2 border-r border-gray-700">
        <AlertsPanel onHighlight={setSelectedZone} />
      </div>
      <div className="col-span-3 row-span-1 border-b border-gray-700">
        <MineMap
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
        />
      </div>
      <div className="col-span-3 row-span-1 overflow-hidden">
        <RiskChart />
      </div>
    </div>
  );
}

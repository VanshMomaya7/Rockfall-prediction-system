"use client"; // optional if you want this page entirely client-side

import dynamic from "next/dynamic";

// Dynamically import RiskMap with SSR disabled
const RiskMap = dynamic(() => import("@/components/RiskMap"), { ssr: false });

export default function Map() {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <RiskMap />
    </div>
  );
}

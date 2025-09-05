"use client";

import React from "react";

// Type definition for an alert
interface Alert {
  id: number;
  type: string;
  value: string;
  status: "normal" | "warning" | "critical";
  level: number;
}

// Dummy sensor alert data
const alerts: Alert[] = [
  {
    id: 1,
    type: "Displacement",
    value: "3.2 mm",
    status: "warning",
    level: 35,
  },
  { id: 2, type: "Strain", value: "Normal", status: "normal", level: 20 },
  {
    id: 3,
    type: "Pore Pressure",
    value: "High",
    status: "critical",
    level: 82,
  },
  { id: 4, type: "Rainfall", value: "12 mm/hr", status: "warning", level: 65 },
  { id: 5, type: "Vibration", value: "0.8 Hz", status: "normal", level: 15 },
];

// Status color mapping
const statusColors: Record<Alert["status"], string> = {
  normal: "text-green-400",
  warning: "text-yellow-400 animate-pulse",
  critical: "text-red-500 animate-blink",
};

// WhatsApp alert handler
const handleWhatsAppAlert = (): void => {
  // Replace this alert() with API integration or WhatsApp API call
  alert("Message has been sent to WhatsApp/SMS!");
};

// Custom keyframes for blink
const blinkAnimation = `
@keyframes blink {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0; }
}
.animate-blink {
  animation: blink 1s infinite;
}
`;

const AlertsList: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-10 flex flex-col">
      {/* Inject custom keyframes */}
      <style>{blinkAnimation}</style>

      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-extrabold text-white mb-2 tracking-wide">
          🚨 Alerts Dashboard
        </h2>
        <p className="text-gray-400 text-lg">
          Real-time Geotechnical Sensor Status
        </p>
      </div>

      {/* Alerts in vertical list */}
      <div className="flex justify-center items-center">
        <div className="flex items-center justify-center w-1/2">
          <ul className="flex flex-col items-center justify-center space-y-4 w-full">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className="bg-gray-900 p-3 rounded-lg w-full transition-all duration-500 hover:bg-gray-800 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/30 cursor-pointer"
              >
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-gray-200 font-semibold text-lg">
                      {alert.type}
                    </p>
                    <p className="text-sm text-gray-400">{alert.value}</p>
                  </div>
                  {/* Status Icon */}
                  <span className={`text-2xl ${statusColors[alert.status]}`}>
                    {alert.status === "normal" && "✓"}
                    {alert.status === "warning" && "⚠"}
                    {alert.status === "critical" && "⛔"}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ease-in-out ${
                      alert.level > 70
                        ? "bg-red-500 animate-pulse"
                        : alert.level > 40
                        ? "bg-yellow-400"
                        : "bg-green-400"
                    }`}
                    style={{ width: `${alert.level}%` }}
                  ></div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* WhatsApp Button */}
      <div className="flex items-center justify-center">
        <button
          onClick={handleWhatsAppAlert}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mt-6 w-1/5 h-[10vh]"
        >
          Send Alerts on WhatsApp / SMS
        </button>
      </div>
    </div>
  );
};

export default AlertsList;

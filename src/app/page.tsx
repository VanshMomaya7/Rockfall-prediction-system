"use client";

import Link from "next/link";
import { NextPage } from "next";

const Landing: NextPage = () => {
  // Smooth scroll to features section
  const scrollToFeatures = (): void => {
    const element = document.getElementById("features");
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            AI-Based Rockfall Prediction and Alert System for Open-Pit Mines
          </h2>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Rockfalls in open-pit mines pose a serious threat to workers and
            equipment, leading to injuries, delays, and financial loss. This
            system leverages AI, predictive analytics, and multi-source data to
            transform slope stability assessments into proactive, life-saving
            insights.
          </p>
          <button
            onClick={scrollToFeatures}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
          >
            Explore Features
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-800 p-12 rounded-lg">
            <h3 className="text-3xl font-bold mb-8 text-center">
              Key System Capabilities
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Feature List - Left */}
              <div className="space-y-4">
                {[
                  "Multi-Source Data Processing",
                  "Real-Time Risk Maps",
                  "Probability-Based Forecasts",
                ].map((feature) => (
                  <div key={feature} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <h4 className="text-lg font-semibold mb-1">{feature}</h4>
                      <p className="text-gray-300">
                        {feature === "Multi-Source Data Processing" &&
                          "Integrates DEM, drone imagery, geotechnical sensors, and environmental data."}
                        {feature === "Real-Time Risk Maps" &&
                          "Dynamic visualization of slope stability and vulnerable zones."}
                        {feature === "Probability-Based Forecasts" &&
                          "Machine learning models predict likelihood of rockfall events with accuracy."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Feature List - Right */}
              <div className="space-y-4">
                {[
                  "Automated Alert Mechanisms",
                  "Dashboard for Mine Planners",
                  "Open-Source & Scalable",
                ].map((feature) => (
                  <div key={feature} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <h4 className="text-lg font-semibold mb-1">{feature}</h4>
                      <p className="text-gray-300">
                        {feature === "Automated Alert Mechanisms" &&
                          "Instant notifications via SMS and Email with suggested action plans."}
                        {feature === "Dashboard for Mine Planners" &&
                          "User-friendly web/mobile interface to monitor hazards and risks."}
                        {feature === "Open-Source & Scalable" &&
                          "Low-cost integration, customizable for different mines, adaptable to public/private operations."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-6">Impact</h3>
          <p className="text-lg text-gray-300 leading-relaxed mb-8">
            The AI-powered rockfall prediction and alert system is designed to
            be cost-effective, scalable, and adaptable across diverse mine
            sites. By predicting rockfall events before they occur, it reduces
            accidents, minimizes downtime, and ensures safer and more resilient
            mining operations. The proactive approach strengthens disaster
            management capabilities while saving lives and operational costs.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h4 className="text-2xl font-bold text-blue-400 mb-2">Safety</h4>
              <p className="text-gray-300">
                Reduces risks to miners & equipment
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h4 className="text-2xl font-bold text-green-400 mb-2">
                Scalable
              </h4>
              <p className="text-gray-300">
                Adaptable for small & large mining operations
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h4 className="text-2xl font-bold text-purple-400 mb-2">
                Cost-Effective
              </h4>
              <p className="text-gray-300">
                Affordable alternative to proprietary systems
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 Ministry of Mines | National Institute of Rock Mechanics
            (NIRM) | Disaster Management Theme
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

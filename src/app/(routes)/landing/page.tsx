// // src/app/(routes)/landing/page.tsx
// "use client";

// import Link from "next/link";
// import { NextPage } from "next";

// const Landing: NextPage = () => {
//   // Smooth scroll to features section
//   const scrollToFeatures = (): void => {
//     const element = document.getElementById("features");
//     if (element instanceof HTMLElement) {
//       element.scrollIntoView({ behavior: "smooth" });
//     }
//   };

//   return (
//     <div className="min-h-screen w-[100vw] bg-gray-900 text-white">
//       {/* Fixed Header */}
//       {/* <header className="fixed top-0 w-full bg-gray-900 border-b border-gray-700 z-50">
//         <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
//           <h1 className="text-xl font-bold">AI-Based Rockfall Prediction</h1>
//           <div className="flex">
//             <Link
//               href="/miner"
//               className="bg-blue-600 hover:bg-blue-700 hover:text-white text-white px-4 py-2 rounded ml-2"
//             >
//               Miner
//             </Link>
//             <Link
//               href="/admin"
//               className="bg-blue-600 hover:bg-blue-700 hover:text-white text-white px-4 py-2 rounded ml-2"
//             >
//               Admin
//             </Link>
//           </div>
//         </div>
//       </header> */}

//       {/* Hero Section */}
//       <section className="min-h-screen flex items-center justify-center px-4 pt-16">
//         <div className="text-center max-w-4xl mx-auto">
//           <h2 className="text-5xl font-bold mb-6 leading-tight">
//             Safer Mining Through AI-Powered Rockfall Prediction
//           </h2>
//           <p className="text-xl text-gray-300 mb-8 leading-relaxed">
//             Our advanced AI system combines real-time monitoring, predictive
//             analytics, and automated alerts to protect miners and equipment from
//             rockfall hazards in open-pit mining operations. Leveraging
//             cutting-edge technology to save lives and reduce operational
//             downtime.
//           </p>
//           <button
//             onClick={scrollToFeatures}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
//           >
//             Get Started
//           </button>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section id="features" className="py-16 px-4">
//         <div className="max-w-6xl mx-auto">
//           <div className="bg-gray-800 p-12 rounded-lg">
//             <h3 className="text-3xl font-bold mb-8 text-center">
//               System Features
//             </h3>
//             <div className="grid md:grid-cols-2 gap-8">
//               {/* Feature List - Left */}
//               <div className="space-y-4">
//                 {[
//                   "Real-time Risk Maps",
//                   "Probability-based Forecasts",
//                   "Multi-source Data Integration",
//                 ].map((feature) => (
//                   <div key={feature} className="flex items-start space-x-3">
//                     <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
//                     <div>
//                       <h4 className="text-lg font-semibold mb-1">{feature}</h4>
//                       <p className="text-gray-300">
//                         {feature === "Real-time Risk Maps" &&
//                           "Dynamic visualization of rockfall risk zones with continuous updates"}
//                         {feature === "Probability-based Forecasts" &&
//                           "Advanced algorithms predict rockfall likelihood with high accuracy"}
//                         {feature === "Multi-source Data Integration" &&
//                           "Combines DEM, drone imagery, sensors, and environmental data"}
//                       </p>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               {/* Feature List - Right */}
//               <div className="space-y-4">
//                 {[
//                   "Automated Alert Mechanisms",
//                   "Open-source Integration",
//                   "Scalable Architecture",
//                 ].map((feature) => (
//                   <div key={feature} className="flex items-start space-x-3">
//                     <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
//                     <div>
//                       <h4 className="text-lg font-semibold mb-1">{feature}</h4>
//                       <p className="text-gray-300">
//                         {feature === "Automated Alert Mechanisms" &&
//                           "Instant notifications via SMS, Email, and WhatsApp"}
//                         {feature === "Open-source Integration" &&
//                           "Seamless integration with existing mining software and systems"}
//                         {feature === "Scalable Architecture" &&
//                           "Adaptable to mines of all sizes with cloud-based infrastructure"}
//                       </p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Impact Section */}
//       <section className="py-16 px-4">
//         <div className="max-w-4xl mx-auto text-center">
//           <h3 className="text-3xl font-bold mb-6">Impact</h3>
//           <p className="text-lg text-gray-300 leading-relaxed mb-8">
//             Our AI-powered rockfall prediction system transforms mining safety
//             by providing early warning systems that significantly reduce injury
//             risks and equipment damage. By predicting rockfall events before
//             they occur, we help mining operations minimize costly downtime,
//             optimize resource allocation, and create safer working environments
//             for all personnel. The system&apos;s proactive approach has proven
//             to reduce rockfall-related incidents by up to 85% while saving
//             mining companies millions in operational costs and insurance claims.
//           </p>
//           <div className="grid md:grid-cols-3 gap-8 mt-12">
//             <div className="bg-gray-800 p-6 rounded-lg">
//               <h4 className="text-2xl font-bold text-blue-400 mb-2">85%</h4>
//               <p className="text-gray-300">Reduction in rockfall incidents</p>
//             </div>
//             <div className="bg-gray-800 p-6 rounded-lg">
//               <h4 className="text-2xl font-bold text-green-400 mb-2">$2M+</h4>
//               <p className="text-gray-300">Average annual cost savings</p>
//             </div>
//             <div className="bg-gray-800 p-6 rounded-lg">
//               <h4 className="text-2xl font-bold text-purple-400 mb-2">24/7</h4>
//               <p className="text-gray-300">Continuous monitoring coverage</p>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="bg-gray-800 py-8">
//         <div className="max-w-7xl mx-auto px-4 text-center">
//           <p className="text-gray-400">© 2025 Rockfall Prediction System</p>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default Landing;

// src/app/(routes)/landing/page.tsx
"use client";

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

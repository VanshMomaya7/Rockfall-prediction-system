// "use client";
// import { Canvas, useLoader } from "@react-three/fiber";
// import { OrbitControls } from "@react-three/drei";
// import * as THREE from "three";

// function Terrain() {
//   const heightMap = useLoader(THREE.TextureLoader, "/output.jpg"); // converted DEM
//   return (
//     <mesh rotation={[-Math.PI / 2, 0, 0]}>
//       <planeGeometry args={[200, 200, 256, 256]} />
//       {/* <meshStandardMaterial
//         map={heightMap} // use the DEM texture as color (so you see it)
//         displacementMap={heightMap} // also use it for terrain shaping
//         displacementScale={40} // tweak elevation exaggeration
//         flatShading={true}
//       /> */}

//       <meshStandardMaterial
//         map={heightMap}
//         displacementMap={heightMap}
//         displacementScale={40}
//         flatShading={true}
//         color="white" // multiply base color to brighten
//       />

//       {/* <meshStandardMaterial
//         displacementMap={heightMap}
//         displacementScale={40}
//         color="saddlebrown" // terrain color
//       /> */}
//     </mesh>
//   );
// }

// export default function MineDEM() {
//   return (
//     <div style={{ width: "100%", height: "100vh" }}>
//       <Canvas camera={{ position: [100, 100, 100], fov: 60 }}>
//         <ambientLight intensity={0.6} />
//         <directionalLight position={[100, 200, 100]} intensity={1} />
//         <Terrain />
//         <OrbitControls />
//       </Canvas>
//     </div>
//   );
// }

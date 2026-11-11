import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const BODY = "#91a4c8";
const BONE = "#e5d9b9";

function Bone({ position, length, rotation = 0 }: { position: [number, number, number]; length: number; rotation?: number }) {
  return <mesh position={position} rotation={[0, 0, rotation]}><cylinderGeometry args={[0.043, 0.05, length, 8]} /><meshStandardMaterial color={BONE} roughness={0.8} /></mesh>;
}
function SoftPart({ position, scale, color }: { position: [number, number, number]; scale: [number, number, number]; color: string }) {
  return <mesh position={position} scale={scale}><sphereGeometry args={[1, 20, 14]} /><meshStandardMaterial color={color} roughness={0.56} transparent opacity={0.92} /></mesh>;
}
function BodyForm({ system }: { system: string }) {
  const base = BODY;
  const muscle = system === "Muscular system";
  return <group>
    <SoftPart position={[0, 1.78, 0]} scale={[0.29, 0.35, 0.25]} color={system === "Nervous system" ? "#bc9bf4" : base} />
    <Bone position={[0, 1.48, 0]} length={0.24} />
    <SoftPart position={[0, 0.84, 0]} scale={muscle ? [0.5, 0.8, 0.3] : [0.42, 0.75, 0.25]} color={muscle ? "#bd637d" : base} />
    <SoftPart position={[-0.51, 1.28, 0]} scale={[0.2, 0.2, 0.22]} color={muscle ? "#bd637d" : base} />
    <SoftPart position={[0.51, 1.28, 0]} scale={[0.2, 0.2, 0.22]} color={muscle ? "#bd637d" : base} />
    <mesh position={[-0.61, 0.7, 0]} rotation={[0, 0, -0.12]}><capsuleGeometry args={[muscle ? 0.15 : 0.105, 0.74, 4, 12]} /><meshStandardMaterial color={muscle ? "#ca6a83" : base} roughness={0.62} /></mesh>
    <mesh position={[0.61, 0.7, 0]} rotation={[0, 0, 0.12]}><capsuleGeometry args={[muscle ? 0.15 : 0.105, 0.74, 4, 12]} /><meshStandardMaterial color={muscle ? "#ca6a83" : base} roughness={0.62} /></mesh>
    <Bone position={[-0.73, 0.11, 0]} length={0.52} rotation={-0.08} />
    <Bone position={[0.73, 0.11, 0]} length={0.52} rotation={0.08} />
    <SoftPart position={[-0.22, -0.1, 0]} scale={[0.19, 0.25, 0.21]} color={muscle ? "#bd637d" : base} />
    <SoftPart position={[0.22, -0.1, 0]} scale={[0.19, 0.25, 0.21]} color={muscle ? "#bd637d" : base} />
    <mesh position={[-0.23, -0.72, 0]}><capsuleGeometry args={[muscle ? 0.13 : 0.095, 0.78, 4, 12]} /><meshStandardMaterial color={muscle ? "#b85a75" : base} roughness={0.7} /></mesh>
    <mesh position={[0.23, -0.72, 0]}><capsuleGeometry args={[muscle ? 0.13 : 0.095, 0.78, 4, 12]} /><meshStandardMaterial color={muscle ? "#b85a75" : base} roughness={0.7} /></mesh>

    {system === "Skeletal system" && <group>
      <Bone position={[0, 0.85, 0.27]} length={0.85} />
      {[-1, 1].map((side) => <group key={side}><Bone position={[side * 0.2, 1.03, 0.24]} length={0.6} rotation={side * 0.08} /><Bone position={[side * 0.32, 0.96, 0.24]} length={0.59} rotation={side * -0.12} /><Bone position={[side * 0.26, 0.2, 0.23]} length={0.74} rotation={side * -0.06} /><Bone position={[side * 0.28, -0.55, 0.2]} length={0.72} rotation={side * 0.02} /></group>)}
      {Array.from({ length: 5 }, (_, i) => <mesh key={i} position={[0, 1.2 - i * 0.13, 0.23]} rotation={[0, 0, 0]}><torusGeometry args={[0.2 - i * 0.012, 0.018, 6, 24, Math.PI]} /><meshStandardMaterial color={BONE} roughness={0.8} /></mesh>)}
    </group>}
    {system === "Nervous system" && <group>{Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[0, 1.4 - i * 0.22, 0.3]}><sphereGeometry args={[0.055, 12, 10]} /><meshBasicMaterial color="#e2b6ff" /></mesh>)}<Bone position={[-0.4, 0.84, 0.28]} length={0.7} rotation={-0.46} /><Bone position={[0.4, 0.84, 0.28]} length={0.7} rotation={0.46} /><Bone position={[-0.12, -0.2, 0.26]} length={0.9} rotation={-0.18} /><Bone position={[0.12, -0.2, 0.26]} length={0.9} rotation={0.18} /></group>}
    {system === "Circulatory system" && <group><SoftPart position={[0.04, 0.95, 0.35]} scale={[0.17, 0.18, 0.12]} color="#ec687b" /><Bone position={[0, 1.28, 0.32]} length={0.45} /><Bone position={[-0.13, 0.59, 0.32]} length={0.66} rotation={0.16} /><Bone position={[0.13, 0.59, 0.32]} length={0.66} rotation={-0.16} /><Bone position={[-0.61, 0.8, 0.25]} length={0.76} rotation={0.28} /><Bone position={[0.61, 0.8, 0.25]} length={0.76} rotation={-0.28} /></group>}
    {system === "Respiratory system" && <group><Bone position={[0, 1.28, 0.34]} length={0.5} /><SoftPart position={[-0.19, 0.93, 0.33]} scale={[0.18, 0.35, 0.11]} color="#61cde1" /><SoftPart position={[0.19, 0.93, 0.33]} scale={[0.18, 0.35, 0.11]} color="#61cde1" /><Bone position={[-0.15, 1.21, 0.34]} length={0.27} rotation={0.44} /><Bone position={[0.15, 1.21, 0.34]} length={0.27} rotation={-0.44} /></group>}
    {system === "Digestive system" && <group><SoftPart position={[-0.17, 0.94, 0.34]} scale={[0.2, 0.15, 0.1]} color="#dda765" /><SoftPart position={[0.12, 0.58, 0.34]} scale={[0.16, 0.21, 0.1]} color="#cc9363" /><mesh position={[0, 0.16, 0.34]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.16, 0.047, 8, 20]} /><meshStandardMaterial color="#f0c674" /></mesh><mesh position={[0, -0.08, 0.35]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.12, 0.04, 8, 20]} /><meshStandardMaterial color="#f0c674" /></mesh></group>}
  </group>;
}

export default function AnatomyScene({ system }: { system: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <div className="anatomyLoading" role="status">Preparing the schematic model…</div>;
  return <div className="anatomyCanvas" role="img" aria-label={`Interactive 3D schematic of the ${system}. Drag to orbit and use the mouse wheel to zoom.`}>
    <Canvas dpr={[1, 1.35]} camera={{ position: [0, 0.55, 7.5], fov: 34 }} gl={{ antialias: false, powerPreference: "low-power", alpha: true }} onCreated={({ gl }) => gl.setClearColor("#0b1222", 0)}>
      <ambientLight intensity={1.3} /><directionalLight position={[2, 3, 5]} intensity={2.2} /><pointLight position={[-3, 1, 1]} color="#66cee0" intensity={14} distance={8} />
      <BodyForm system={system} />
      <OrbitControls enablePan={false} minDistance={5.5} maxDistance={10} minPolarAngle={0.75} maxPolarAngle={Math.PI - 0.75} rotateSpeed={0.55} />
    </Canvas>
    <div className="anatomyScale" aria-hidden="true">SCHEMATIC · NOT TO SCALE</div>
  </div>;
}

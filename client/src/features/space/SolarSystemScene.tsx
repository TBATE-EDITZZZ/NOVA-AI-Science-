import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

/** Optional controls for the stylized NOVA solar-system visualization. */
export interface SolarSystemSceneProps {
  /** Initial planet focus; defaults to Earth. */
  initialPlanet?: string;
  /** Compact layout for embedding in a narrower panel. */
  compact?: boolean;
}

type Planet = { name: string; color: string; radius: number; orbit: number; period: number; type: string; note: string };
const PLANETS: Planet[] = [
  { name: 'Mercury', color: '#a8a6a3', radius: 0.095, orbit: 1.25, period: 0.24, type: 'Terrestrial · inner planet', note: 'The smallest planet, with a heavily cratered surface.' },
  { name: 'Venus', color: '#e8c18d', radius: 0.15, orbit: 1.8, period: 0.62, type: 'Terrestrial · inner planet', note: 'A dense atmosphere traps heat beneath persistent clouds.' },
  { name: 'Earth', color: '#55b7de', radius: 0.17, orbit: 2.45, period: 1, type: 'Terrestrial · inner planet', note: 'Our ocean-rich home, and the only known world with life.' },
  { name: 'Mars', color: '#dc7254', radius: 0.13, orbit: 3.15, period: 1.88, type: 'Terrestrial · inner planet', note: 'A cold desert world with ancient river valleys and polar ice.' },
  { name: 'Jupiter', color: '#d7ad83', radius: 0.36, orbit: 4.4, period: 11.86, type: 'Gas giant · outer planet', note: 'The largest planet, with powerful storms and many moons.' },
  { name: 'Saturn', color: '#e7d29e', radius: 0.3, orbit: 5.55, period: 29.46, type: 'Gas giant · outer planet', note: 'A gas giant encircled by a broad, bright ring system.' },
  { name: 'Uranus', color: '#87d6d4', radius: 0.23, orbit: 6.7, period: 84.01, type: 'Ice giant · outer planet', note: 'An ice giant that rotates with an extreme axial tilt.' },
  { name: 'Neptune', color: '#6588ee', radius: 0.22, orbit: 7.8, period: 164.8, type: 'Ice giant · outer planet', note: 'A distant ice giant with fast winds and a deep-blue atmosphere.' },
];
const SUN_COLOR = '#ffc66b';

function OrbitRing({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
    return curve.getPoints(160).map((point) => new THREE.Vector3(point.x, 0, point.y));
  }, [radius]);
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  const lineObject = useMemo(() => new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: "#7184b7", transparent: true, opacity: 0.22 })), [geometry]);
  return <primitive object={lineObject} />;
}

function System({ selected, setSelected, paused, reducedMotion }: { selected: string; setSelected: (name: string) => void; paused: boolean; reducedMotion: boolean }) {
  return <>
    <ambientLight intensity={0.72} />
    <pointLight position={[0, 0, 0]} intensity={110} color="#ffd68f" distance={24} decay={2} />
    <Stars radius={35} depth={18} count={compactCount(reducedMotion)} factor={2} saturation={0.2} fade speed={reducedMotion || paused ? 0 : 0.08} />
    <mesh><sphereGeometry args={[0.48, 40, 32]} /><meshBasicMaterial color={SUN_COLOR} /></mesh>
    <mesh><sphereGeometry args={[0.65, 24, 16]} /><meshBasicMaterial color="#ffca71" transparent opacity={0.09} /></mesh>
    {PLANETS.map((planet) => <PlanetOrbit key={planet.name} planet={planet} selected={selected === planet.name} paused={paused} reducedMotion={reducedMotion} onSelect={() => setSelected(planet.name)} />)}
    <OrbitControls enablePan={false} minDistance={5} maxDistance={19} minPolarAngle={0.2} maxPolarAngle={Math.PI * 0.48} rotateSpeed={0.55} zoomSpeed={0.7} />
  </>;
}

function PlanetOrbit({ planet, selected, paused, reducedMotion, onSelect }: { planet: Planet; selected: boolean; paused: boolean; reducedMotion: boolean; onSelect: () => void }) {
  const pivot = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (pivot.current && !paused && !reducedMotion) pivot.current.rotation.y = clock.elapsedTime * (0.13 / Math.sqrt(planet.period));
  });
  return <group ref={pivot}>
    <OrbitRing radius={planet.orbit} />
    <group position={[planet.orbit, 0, 0]} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
        <mesh castShadow>
          <sphereGeometry args={[planet.radius, 32, 24]} />
          <meshStandardMaterial color={planet.color} roughness={0.76} emissive={selected ? planet.color : '#000000'} emissiveIntensity={selected ? 0.14 : 0} />
        </mesh>
        {planet.name === 'Saturn' && <mesh rotation={[Math.PI / 2.35, 0, 0]}><ringGeometry args={[planet.radius * 1.3, planet.radius * 2.05, 64]} /><meshStandardMaterial color="#dec998" transparent opacity={0.78} side={THREE.DoubleSide} /></mesh>}

    </group>
  </group>;
}
function compactCount(reduced: boolean) { return reduced ? 300 : 650; }

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch { return false; }
}

function DiagramFallback({ selected, onSelect }: { selected: string; onSelect: (name: string) => void }) {
  return <div role="img" aria-label="Static diagram of the Sun and eight planets in orbital order; scale is not representative." style={{ minHeight: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowX: 'auto', padding: '20px 12px', background: 'radial-gradient(ellipse at center,#1a2144 0%,#0a1024 72%)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px,2vw,22px)', minWidth: 570 }}>
      <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: '50%', background: SUN_COLOR, boxShadow: '0 0 22px #ffc66b', flex: 'none' }} />
      {PLANETS.map((planet) => <button key={planet.name} type="button" onClick={() => onSelect(planet.name)} aria-label={`Select ${planet.name}`} aria-pressed={selected === planet.name} title={planet.name} style={{ width: Math.max(12, Math.min(planet.radius * 62, 25)), height: Math.max(12, Math.min(planet.radius * 62, 25)), borderRadius: '50%', border: selected === planet.name ? '2px solid #d7f8ff' : '1px solid #ffffff33', background: planet.color, boxShadow: selected === planet.name ? '0 0 14px #70dff0' : 'none', cursor: 'pointer', flex: 'none' }} />)}
    </div>
  </div>;
}

export default function SolarSystemScene({ initialPlanet = 'Earth', compact = false }: SolarSystemSceneProps) {
  const [selected, setSelected] = useState(() => PLANETS.some((planet) => planet.name === initialPlanet) ? initialPlanet : 'Earth');
  const [paused, setPaused] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [smallScreen, setSmallScreen] = useState(false);
  const current = PLANETS.find((planet) => planet.name === selected) ?? PLANETS[2]!;

  useEffect(() => {
    setWebgl(supportsWebGL());
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const resize = () => setSmallScreen(window.innerWidth < 640);
    setReducedMotion(motion.matches);
    resize();
    const onMotion = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    motion.addEventListener?.('change', onMotion);
    window.addEventListener('resize', resize);
    return () => { motion.removeEventListener?.('change', onMotion); window.removeEventListener('resize', resize); };
  }, []);

  const buttonStyle: CSSProperties = { border: '1px solid rgba(152,177,224,.25)', background: 'rgba(20,29,58,.72)', color: '#e5edff', borderRadius: 7, padding: '8px 12px', fontSize: 12, cursor: 'pointer' };
  return <section aria-label="Solar system orbital visualization" style={{ color: '#edf2ff', background: 'linear-gradient(145deg,#090e20,#101833 58%,#0a1023)', border: '1px solid rgba(136,158,207,.2)', borderRadius: 16, overflow: 'hidden', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, padding: compact ? '18px 18px 8px' : '22px 24px 10px' }}>
      <div><div style={{ color: '#7ddbea', fontSize: 10, fontWeight: 700, letterSpacing: '.19em', textTransform: 'uppercase' }}>NOVA · Planetary systems</div><h2 style={{ margin: '7px 0 4px', fontSize: compact ? 19 : 22, fontWeight: 550, letterSpacing: '-.025em' }}>Our solar system</h2><p style={{ margin: 0, color: '#9caacb', fontSize: 12 }}>An orbital field guide · eight planets</p></div>
      <span style={{ color: '#92a4cd', fontSize: 10, letterSpacing: '.12em', paddingTop: 2 }}>NOT TO SCALE</span>
    </header>
    <div style={{ height: compact ? 290 : 370, position: 'relative' }}>
      {webgl === null ? <div aria-label="Loading visualization" style={{ height: '100%', background: 'radial-gradient(ellipse at center,#1a2144,#0a1024)' }} /> : webgl ? <Canvas dpr={smallScreen ? [1, 1.25] : [1, 1.6]} camera={{ position: [0, 10.5, 12.5], fov: 43 }} gl={{ antialias: !smallScreen, powerPreference: 'low-power', alpha: true }} aria-label="Interactive three-dimensional illustration of the Sun and eight planets. Drag to orbit; use controls to zoom." onCreated={({ gl }) => { gl.setClearColor('#090e20', 0); }}>
        <System selected={selected} setSelected={setSelected} paused={paused} reducedMotion={reducedMotion} />
      </Canvas> : <DiagramFallback selected={selected} onSelect={setSelected} />}
      <p aria-hidden="true" style={{ position: 'absolute', left: 14, bottom: 8, margin: 0, color: '#8594b8', fontSize: 10, pointerEvents: 'none' }}>{webgl ? 'DRAG TO ORBIT · SCROLL TO ZOOM' : 'PLANETARY ORDER'}</p>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: smallScreen ? '1fr' : 'minmax(0,1fr) auto', gap: 14, alignItems: 'center', padding: '14px 20px 18px', borderTop: '1px solid rgba(136,158,207,.14)' }}>
      <div aria-live="polite" aria-atomic="true"><div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}><h3 style={{ margin: 0, fontSize: 17, fontWeight: 550 }}>{current.name}</h3><span style={{ color: '#7ddbea', fontSize: 10, letterSpacing: '.08em' }}>{current.type}</span></div><p style={{ margin: '5px 0 0', color: '#aab6d2', fontSize: 12, lineHeight: 1.55 }}>{current.note}</p></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><label htmlFor="nova-planet-select" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>Choose a planet</label><select id="nova-planet-select" value={selected} onChange={(event) => setSelected(event.target.value)} style={{ ...buttonStyle, padding: '8px 28px 8px 10px' }}>{PLANETS.map((planet) => <option key={planet.name}>{planet.name}</option>)}</select><button type="button" style={buttonStyle} onClick={() => setPaused((value) => !value)} aria-pressed={paused}>{paused ? 'Resume motion' : 'Pause motion'}</button></div>
    </div>
    <aside style={{ margin: '0 20px 18px', padding: '10px 12px', borderLeft: '2px solid #4fc3d5', background: 'rgba(62,112,150,.09)', color: '#96a6c8', fontSize: 11, lineHeight: 1.55 }}><strong style={{ color: '#c7d5f1', fontWeight: 600 }}>Model note</strong> — Planet order is familiar; sizes, distances, and orbital timing are stylized and not to scale. This is an educational visualization, not a live-position display. {reducedMotion && <span>Reduced-motion preference detected; orbital animation is paused.</span>}</aside>
  </section>;
}

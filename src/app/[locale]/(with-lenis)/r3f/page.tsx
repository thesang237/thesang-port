'use client';

import { Suspense, useMemo, useRef, useState } from 'react';
import { Environment, Float, MeshDistortMaterial, MeshWobbleMaterial, OrbitControls, shaderMaterial } from '@react-three/drei';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { motion, useInView } from 'framer-motion';
import * as THREE from 'three';

import { cn } from '@/utils/cn';

// ─── Easing ───────────────────────────────────────────────────────────────────
const E_OUT = [0.23, 1, 0.32, 1] as const;

// ─── Noise background ─────────────────────────────────────────────────────────
const NOISE_BG = {
    backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'repeat' as const,
    backgroundSize: '128px',
};

// ─── Shared shader material for wave section ─────────────────────────────────
const WaveMaterial = shaderMaterial(
    { uTime: 0, uColor: new THREE.Color('#6366f1') },
    // vertex
    `
    varying vec2 vUv;
    uniform float uTime;
    void main() {
      vUv = uv;
      vec3 pos = position;
      pos.z += sin(pos.x * 3.0 + uTime * 2.0) * 0.15;
      pos.z += sin(pos.y * 4.0 + uTime * 1.5) * 0.1;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
    // fragment
    `
    varying vec2 vUv;
    uniform float uTime;
    uniform vec3 uColor;
    void main() {
      float pattern = sin(vUv.x * 10.0 + uTime) * 0.5 + 0.5;
      vec3 col = mix(uColor * 0.4, uColor, pattern);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
);
extend({ WaveMaterial });

// Augment JSX for custom shader
declare module '@react-three/fiber' {
    type ThreeElements = {
        waveMaterial: THREE.ShaderMaterial & { uTime: number; uColor: THREE.Color };
    };
}

// ─── Atoms ────────────────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.55, ease: E_OUT, delay }} className={className}>
            {children}
        </motion.div>
    );
}

function SectionNum({ n }: { n: string }) {
    return (
        <span
            className="absolute -top-8 -left-2 font-black leading-none select-none pointer-events-none"
            style={{ color: 'rgba(99,102,241,0.05)', fontVariantNumeric: 'tabular-nums', fontSize: '144px' }}
        >
            {n}
        </span>
    );
}

function Tag({ children, variant = 'indigo' }: { children: React.ReactNode; variant?: 'indigo' | 'green' | 'rose' | 'zinc' | 'sky' | 'amber' | 'violet' }) {
    return (
        <span
            className={cn(
                'inline-flex items-center px-2 py-0.5 rounded font-mono tracking-wider uppercase border',
                variant === 'indigo' && 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                variant === 'green' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                variant === 'rose' && 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                variant === 'zinc' && 'bg-zinc-700/30 text-zinc-400 border-zinc-700/40',
                variant === 'sky' && 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                variant === 'amber' && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                variant === 'violet' && 'bg-violet-500/10 text-violet-400 border-violet-500/20',
            )}
            style={{ fontSize: '10px' }}
        >
            {children}
        </span>
    );
}

function CodeBlock({ children, highlight }: { children: string; highlight?: string[] }) {
    const lines = children.split('\n');
    return (
        <pre className="bg-[#0a0a12] border border-zinc-800 rounded-xl p-5 font-mono overflow-x-auto leading-relaxed" style={{ fontSize: '12px' }}>
            {lines.map((line, i) => {
                const isHighlighted = highlight?.some((h) => line.includes(h));
                return (
                    <div key={i} className={cn('px-1 rounded', isHighlighted && 'bg-indigo-500/10 text-indigo-200')} style={{ color: isHighlighted ? undefined : '#a1a1aa' }}>
                        {line || '\u00A0'}
                    </div>
                );
            })}
        </pre>
    );
}

function CanvasWrapper({ children, height = 280 }: { children: React.ReactNode; height?: number }) {
    return (
        <div className="rounded-2xl overflow-hidden bg-[#060609] border border-zinc-800/80" style={{ height }}>
            <Canvas camera={{ position: [0, 0, 4], fov: 50 }} gl={{ antialias: true }}>
                <Suspense fallback={null}>{children}</Suspense>
            </Canvas>
        </div>
    );
}

function GhostButton({ children, onClick, active }: { children: React.ReactNode; onClick?: () => void; active?: boolean }) {
    return (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.16, ease: E_OUT }}
            className={cn(
                'px-4 py-2 rounded-lg font-medium border transition-colors duration-150',
                active ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200',
            )}
            style={{ fontSize: '13px' }}
        >
            {children}
        </motion.button>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function R3FPage() {
    return (
        <main className="min-h-screen bg-[#06060a] text-white overflow-x-hidden">
            <div className="absolute inset-0 pointer-events-none" style={NOISE_BG} />
            <div className="max-w-[1080px] mx-auto">
                <HeroSection />
                <MentalModelSection />
                <UseFrameSection />
                <GeometrySection />
                <MaterialsSection />
                <LightingSection />
                <AnimationSection />
                <ShadersSection />
                <InteractionSection />
                <LoadersSection />
                <PerformanceSection />
                <ChecklistSection />
            </div>
            <footer className="border-t border-zinc-800/60 px-6 md:px-12 xl:px-24 py-10 text-center text-zinc-600 font-mono" style={{ fontSize: '14px' }}>
                React Three Fiber · @react-three/fiber · @react-three/drei · Three.js r182+
            </footer>
        </main>
    );
}

// ─── Hero 3D mesh ─────────────────────────────────────────────────────────────
function HeroMesh() {
    const meshRef = useRef<THREE.Mesh>(null!);
    useFrame((state) => {
        const t = state.clock.elapsedTime;
        meshRef.current.rotation.x = t * 0.3;
        meshRef.current.rotation.y = t * 0.5;
    });
    return (
        <Float speed={2} rotationIntensity={0.4} floatIntensity={0.8}>
            <mesh ref={meshRef} castShadow>
                <icosahedronGeometry args={[1.2, 1]} />
                <meshStandardMaterial color="#6366f1" metalness={0.4} roughness={0.2} wireframe={false} />
            </mesh>
        </Float>
    );
}

// ─── 0. Hero ──────────────────────────────────────────────────────────────────
function HeroSection() {
    const words = ['React', 'Three', 'Fiber'];
    return (
        <section className="relative min-h-screen flex flex-col justify-center px-6 md:px-12 xl:px-24 pt-24 pb-0">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: E_OUT, delay: 0.1 }}
                        className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-6"
                        style={{ fontSize: '11px' }}
                    >
                        Practical Guide · Design Engineering
                    </motion.p>

                    <h1 className="font-black leading-[0.88] tracking-tight mb-8" style={{ fontSize: 'clamp(52px, 9vw, 112px)' }}>
                        {words.map((word, i) => (
                            <motion.div
                                key={word}
                                initial={{ opacity: 0, x: -40 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.7, ease: E_OUT, delay: 0.2 + i * 0.1 }}
                                className={i === 2 ? 'text-indigo-400' : 'text-white'}
                            >
                                {word}
                            </motion.div>
                        ))}
                    </h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, ease: E_OUT, delay: 0.7 }}
                        className="text-zinc-400 leading-relaxed mb-10"
                        style={{ fontSize: '17px' }}
                    >
                        The complete visual reference for building 3D interfaces with R3F — from your first spinning cube to custom GLSL shaders. Every section has a live demo you can see and touch.
                    </motion.p>

                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: E_OUT, delay: 0.9 }} className="flex flex-wrap gap-2">
                        {['@react-three/fiber', '@react-three/drei', 'Three.js r182', 'React 18'].map((pkg) => (
                            <Tag key={pkg} variant="zinc">
                                {pkg}
                            </Tag>
                        ))}
                    </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, ease: E_OUT, delay: 0.4 }} style={{ height: 420 }}>
                    <CanvasWrapper height={420}>
                        <HeroMesh />
                        <Environment preset="city" />
                        <ambientLight intensity={0.4} />
                        <pointLight position={[5, 5, 5]} intensity={2} color="#6366f1" />
                        <pointLight position={[-5, -3, -5]} intensity={1} color="#a855f7" />
                    </CanvasWrapper>
                </motion.div>
            </div>

            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.9, ease: E_OUT, delay: 1.1 }}
                style={{ transformOrigin: 'left' }}
                className="mt-20 h-px bg-gradient-to-r from-indigo-500/40 via-indigo-500/10 to-transparent"
            />
        </section>
    );
}

// ─── 1. Mental Model ──────────────────────────────────────────────────────────
function MentalModelSection() {
    const layers = [
        {
            name: 'Canvas',
            desc: 'Creates the WebGL renderer and React context. One per scene.',
            color: '#6366f1',
            code: '<Canvas camera={{ position: [0, 0, 5] }}>',
        },
        {
            name: 'Scene Graph',
            desc: 'JSX is your scene. <group>, <mesh>, <light> are Three.js objects.',
            color: '#8b5cf6',
            code: '<group position={[0, 1, 0]}>',
        },
        {
            name: 'Mesh',
            desc: 'The visible thing. Always = geometry + material.',
            color: '#a855f7',
            code: '<mesh> <boxGeometry /> <meshStandardMaterial /> </mesh>',
        },
        {
            name: 'useFrame',
            desc: 'Your animation loop. Runs every frame at 60fps.',
            color: '#c084fc',
            code: 'useFrame((state, delta) => { mesh.rotation.y += delta; })',
        },
    ];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <FadeIn>
                <p className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-3" style={{ fontSize: '11px' }}>
                    Mental Model
                </p>
                <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                    R3F is React rendering Three.js.
                </h2>
                <p className="text-zinc-400 max-w-2xl mb-14 leading-relaxed" style={{ fontSize: '16px' }}>
                    Every Three.js class — <code className="text-indigo-400 font-mono">BoxGeometry</code>, <code className="text-indigo-400 font-mono">MeshStandardMaterial</code>,{' '}
                    <code className="text-indigo-400 font-mono">PointLight</code> — becomes a lowercase JSX element. R3F handles creating, updating, and disposing them for you.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="relative">
                    {layers.map(({ name, desc, color, code }, i) => (
                        <motion.div
                            key={name}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.5, ease: E_OUT, delay: i * 0.1 }}
                            className="relative flex items-start gap-6 pb-0"
                        >
                            {/* Connector line */}
                            {i < layers.length - 1 && <div className="absolute left-[19px] top-10 w-px bg-gradient-to-b from-zinc-700 to-zinc-800" style={{ height: '72px' }} />}

                            {/* Dot */}
                            <div className="relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 mt-1" style={{ borderColor: color, background: `${color}15` }}>
                                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                            </div>

                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 mb-4 flex-1">
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <span className="font-mono font-bold" style={{ color, fontSize: '15px' }}>
                                        {name}
                                    </span>
                                    <span className="text-zinc-500" style={{ fontSize: '13px' }}>
                                        {desc}
                                    </span>
                                </div>
                                <code className="text-zinc-500 font-mono" style={{ fontSize: '11px' }}>
                                    {code}
                                </code>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </FadeIn>

            <FadeIn delay={0.3}>
                <div className="mt-8">
                    <p className="text-zinc-500 mb-3 font-mono uppercase tracking-widest" style={{ fontSize: '10px' }}>
                        A complete minimal scene
                    </p>
                    <CodeBlock highlight={['useFrame', 'Canvas', '<mesh>']}>
                        {`import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';

function SpinningBox() {
  const ref = useRef();

  // Called every frame — this IS your animation loop
  useFrame((state, delta) => {
    ref.current.rotation.y += delta;      // delta = seconds since last frame
    ref.current.rotation.x += delta * 0.5;
  });

  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />             {/* width, height, depth */}
      <meshStandardMaterial color="#6366f1" />
    </mesh>
  );
}

export default function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 4] }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} />
      <SpinningBox />
    </Canvas>
  );
}`}
                    </CodeBlock>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 2. useFrame ──────────────────────────────────────────────────────────────
function SpinBox({ speed, axis, color }: { speed: number; axis: 'x' | 'y' | 'both'; color: string }) {
    const ref = useRef<THREE.Mesh>(null!);
    useFrame((_, delta) => {
        if (axis === 'x' || axis === 'both') ref.current.rotation.x += delta * speed;
        if (axis === 'y' || axis === 'both') ref.current.rotation.y += delta * speed;
    });
    return (
        <mesh ref={ref}>
            <boxGeometry args={[1.5, 1.5, 1.5]} />
            <meshStandardMaterial color={color} metalness={0.2} roughness={0.4} />
        </mesh>
    );
}

function ClockDisplay() {
    const { clock } = useThree();
    const meshRef = useRef<THREE.Mesh>(null!);
    useFrame(() => {
        // Pulse on every second
        const t = clock.elapsedTime;
        const pulse = Math.sin(t * Math.PI * 2) * 0.08;
        meshRef.current.scale.setScalar(1 + pulse);
    });
    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[0.9, 32, 32]} />
            <meshStandardMaterial color="#6366f1" metalness={0.6} roughness={0.1} />
        </mesh>
    );
}

function UseFrameSection() {
    const [mode, setMode] = useState<'rotate' | 'pulse' | 'delta'>('rotate');

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="01" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-3" style={{ fontSize: '11px' }}>
                        Canvas · useFrame · useThree
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        useFrame is your entire animation system.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-10 leading-relaxed" style={{ fontSize: '16px' }}>
                        Unlike CSS animations or Framer Motion, R3F animations live inside <code className="text-indigo-400 font-mono">useFrame</code> — a hook that fires on every render frame.
                        Everything from rotation to shader uniforms to camera movement goes here.
                    </p>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="flex gap-2 mb-5">
                        {(['rotate', 'pulse', 'delta'] as const).map((m) => (
                            <GhostButton key={m} active={mode === m} onClick={() => setMode(m)}>
                                {m}
                            </GhostButton>
                        ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <CanvasWrapper height={260}>
                            <ambientLight intensity={0.5} />
                            <directionalLight position={[3, 3, 3]} intensity={1.5} />
                            {mode === 'rotate' && <SpinBox speed={1.5} axis="both" color="#6366f1" />}
                            {mode === 'pulse' && <ClockDisplay />}
                            {mode === 'delta' && <SpinBox speed={3} axis="y" color="#8b5cf6" />}
                        </CanvasWrapper>

                        <div>
                            {mode === 'rotate' && (
                                <CodeBlock highlight={['useFrame', 'delta']}>
                                    {`function SpinningBox() {
  const ref = useRef();

  useFrame((state, delta) => {
    // delta: seconds since last frame (~0.016 at 60fps)
    // Always use delta to keep speed framerate-independent
    ref.current.rotation.x += delta;
    ref.current.rotation.y += delta;
  });

  return (
    <mesh ref={ref}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color="#6366f1" />
    </mesh>
  );
}`}
                                </CodeBlock>
                            )}
                            {mode === 'pulse' && (
                                <CodeBlock highlight={['useFrame', 'clock.elapsedTime', 'setScalar']}>
                                    {`function PulseSphere() {
  const ref = useRef();

  useFrame((state) => {
    // state.clock.elapsedTime → seconds since Canvas mounted
    const t = state.clock.elapsedTime;
    const pulse = Math.sin(t * Math.PI * 2) * 0.08;
    ref.current.scale.setScalar(1 + pulse);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.9, 32, 32]} />
      <meshStandardMaterial color="#6366f1" />
    </mesh>
  );
}`}
                                </CodeBlock>
                            )}
                            {mode === 'delta' && (
                                <CodeBlock highlight={['useThree', 'invalidate', 'getState']}>
                                    {`// useThree — access the R3F state store
function MyComponent() {
  const {
    camera,      // The active camera
    scene,       // The Three.js scene
    gl,          // The WebGL renderer
    size,        // Canvas width/height in pixels
    clock,       // Three.js Clock
    invalidate,  // Force a re-render (on-demand mode)
    viewport,    // Normalized viewport dimensions
  } = useThree();

  // Pro tip: read state without subscribing
  useFrame(() => {
    const { camera } = useThree.getState();
  });
}`}
                                </CodeBlock>
                            )}
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.2}>
                    <div className="mt-6 bg-indigo-500/5 border border-indigo-500/15 rounded-xl px-6 py-5">
                        <p className="text-indigo-300/80 leading-relaxed" style={{ fontSize: '14px' }}>
                            <strong className="text-indigo-400">Key rule:</strong> Always multiply movement by <code className="text-indigo-300 font-mono">delta</code> (seconds since last frame).
                            Without it, your animation runs at different speeds on 60fps vs 120fps displays.
                        </p>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

// ─── 3. Geometry ──────────────────────────────────────────────────────────────
type GeoType = 'box' | 'sphere' | 'torus' | 'cylinder' | 'octahedron' | 'cone';

function LiveGeometry({ type }: { type: GeoType }) {
    const ref = useRef<THREE.Mesh>(null!);
    useFrame((_, d) => {
        ref.current.rotation.y += d * 0.6;
        ref.current.rotation.x += d * 0.2;
    });
    return (
        <mesh ref={ref} castShadow>
            {type === 'box' && <boxGeometry args={[1.6, 1.6, 1.6]} />}
            {type === 'sphere' && <sphereGeometry args={[1.1, 32, 32]} />}
            {type === 'torus' && <torusGeometry args={[0.9, 0.38, 16, 60]} />}
            {type === 'cylinder' && <cylinderGeometry args={[0.7, 0.7, 1.8, 32]} />}
            {type === 'octahedron' && <octahedronGeometry args={[1.2, 0]} />}
            {type === 'cone' && <coneGeometry args={[0.9, 1.8, 32]} />}
            <meshStandardMaterial color="#6366f1" metalness={0.3} roughness={0.3} />
        </mesh>
    );
}

const GEO_CODE: Record<GeoType, string> = {
    box: `<mesh>
  <boxGeometry args={[1, 1, 1]} />
  {/* args: [width, height, depth] */}
</mesh>`,
    sphere: `<mesh>
  <sphereGeometry args={[1, 32, 32]} />
  {/* args: [radius, widthSegments, heightSegments] */}
  {/* Higher segments = smoother, more vertices */}
</mesh>`,
    torus: `<mesh>
  <torusGeometry args={[1, 0.4, 16, 60]} />
  {/* args: [radius, tube, radialSeg, tubularSeg] */}
</mesh>`,
    cylinder: `<mesh>
  <cylinderGeometry args={[0.7, 0.7, 2, 32]} />
  {/* args: [radiusTop, radiusBottom, height, segments] */}
  {/* Set different top/bottom radii for a cone-like shape */}
</mesh>`,
    octahedron: `<mesh>
  <octahedronGeometry args={[1, 0]} />
  {/* args: [radius, detail] */}
  {/* detail=0 sharp, detail>0 subdivided */}
</mesh>`,
    cone: `<mesh>
  <coneGeometry args={[1, 2, 32]} />
  {/* args: [radius, height, segments] */}
</mesh>`,
};

function GeometrySection() {
    const [geo, setGeo] = useState<GeoType>('box');
    const geos: GeoType[] = ['box', 'sphere', 'torus', 'cylinder', 'octahedron', 'cone'];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="02" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-3" style={{ fontSize: '11px' }}>
                        Geometry
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        Every mesh needs a geometry and a material.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-10 leading-relaxed" style={{ fontSize: '16px' }}>
                        Geometry is the shape — the vertices, faces, and UV coordinates. In R3F, Three.js geometry classes become lowercase JSX children inside a mesh, using the{' '}
                        <code className="text-indigo-400 font-mono">args</code> prop for constructor arguments.
                    </p>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="flex flex-wrap gap-2 mb-5">
                        {geos.map((g) => (
                            <GhostButton key={g} active={geo === g} onClick={() => setGeo(g)}>
                                {g}
                            </GhostButton>
                        ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <CanvasWrapper height={280}>
                            <ambientLight intensity={0.4} />
                            <directionalLight position={[5, 5, 5]} intensity={2} castShadow />
                            <pointLight position={[-4, 2, 2]} intensity={1} color="#a855f7" />
                            <LiveGeometry key={geo} type={geo} />
                            <Environment preset="city" />
                        </CanvasWrapper>
                        <CodeBlock highlight={['args']}>{GEO_CODE[geo]}</CodeBlock>
                    </div>
                </FadeIn>

                <FadeIn delay={0.2}>
                    <div className="mt-8 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
                        <Tag variant="indigo">Custom BufferGeometry</Tag>
                        <p className="text-zinc-400 mt-3 mb-4 leading-relaxed" style={{ fontSize: '14px' }}>
                            When built-ins are not enough, create geometry from raw vertex data:
                        </p>
                        <CodeBlock highlight={['useMemo', 'BufferGeometry', 'setAttribute']}>
                            {`function CustomTriangle() {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();

    // 3 vertices, each with 3 coordinates (x,y,z)
    const vertices = new Float32Array([
      -1, -1, 0,   // bottom-left
       1, -1, 0,   // bottom-right
       0,  1, 0,   // top
    ]);

    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.computeVertexNormals(); // required for lighting
    return geo;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#6366f1" side={THREE.DoubleSide} />
    </mesh>
  );
}`}
                        </CodeBlock>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

// ─── 4. Materials ─────────────────────────────────────────────────────────────
type MatType = 'basic' | 'standard' | 'physical' | 'toon' | 'distort' | 'wobble';

function LiveMaterial({ type }: { type: MatType }) {
    const ref = useRef<THREE.Mesh>(null!);
    useFrame((_, d) => {
        ref.current.rotation.y += d * 0.5;
    });

    const content = (
        <mesh ref={ref}>
            <sphereGeometry args={[1.1, 64, 64]} />
            {type === 'basic' && <meshBasicMaterial color="#6366f1" />}
            {type === 'standard' && <meshStandardMaterial color="#6366f1" metalness={0.8} roughness={0.1} />}
            {type === 'physical' && <meshPhysicalMaterial color="#6366f1" metalness={0.2} roughness={0.05} transmission={0.5} thickness={1.5} />}
            {type === 'toon' && <meshToonMaterial color="#6366f1" />}
            {type === 'distort' && <MeshDistortMaterial color="#6366f1" distort={0.4} speed={2} />}
            {type === 'wobble' && <MeshWobbleMaterial color="#6366f1" factor={0.4} speed={3} />}
        </mesh>
    );

    return content;
}

const MAT_CODE: Record<MatType, { code: string; note: string; tag: string }> = {
    basic: {
        tag: 'meshBasicMaterial',
        note: 'No lighting needed. Flat color, always visible. Good for debug or background elements.',
        code: `<meshBasicMaterial
  color="#6366f1"
  wireframe={false}
  transparent={false}
  opacity={1}
/>`,
    },
    standard: {
        tag: 'meshStandardMaterial',
        note: 'PBR material. Responds to lights. 95% of real-world use cases.',
        code: `<meshStandardMaterial
  color="#6366f1"
  metalness={0.8}   // 0 = plastic, 1 = metal
  roughness={0.1}   // 0 = mirror, 1 = matte
  envMapIntensity={1}
  // map={texture}       for texture maps
  // normalMap={texture} for surface normals
/>`,
    },
    physical: {
        tag: 'meshPhysicalMaterial',
        note: 'Extends Standard with glass, clearcoat, transmission. Expensive — use on hero elements.',
        code: `<meshPhysicalMaterial
  color="#6366f1"
  metalness={0.2}
  roughness={0.05}
  transmission={0.5}  // 0-1, glass transparency
  thickness={1.5}     // refraction depth
  // clearcoat={1}    // car paint layer
  // ior={1.5}        // index of refraction
/>`,
    },
    toon: {
        tag: 'meshToonMaterial',
        note: 'Cel-shading. Flat steps of color. Pairs well with an outline post-process.',
        code: `<meshToonMaterial
  color="#6366f1"
  // gradientMap={texture}  custom step count
/>

// Add an outline effect:
// import { Outline } from '@react-three/postprocessing'`,
    },
    distort: {
        tag: 'MeshDistortMaterial',
        note: 'Drei helper. Perlin noise distortion — the blob effect you see everywhere.',
        code: `import { MeshDistortMaterial } from '@react-three/drei';

<mesh>
  <sphereGeometry args={[1, 64, 64]} />
  <MeshDistortMaterial
    color="#6366f1"
    distort={0.4}   // distortion amount
    speed={2}       // animation speed
  />
</mesh>`,
    },
    wobble: {
        tag: 'MeshWobbleMaterial',
        note: 'Drei helper. Sine-wave wobble. Simpler than distort, good for icons.',
        code: `import { MeshWobbleMaterial } from '@react-three/drei';

<mesh>
  <sphereGeometry args={[1, 64, 64]} />
  <MeshWobbleMaterial
    color="#6366f1"
    factor={0.4}   // wobble strength
    speed={3}      // wobble speed
  />
</mesh>`,
    },
};

function MaterialsSection() {
    const [mat, setMat] = useState<MatType>('standard');
    const mats: MatType[] = ['basic', 'standard', 'physical', 'toon', 'distort', 'wobble'];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="03" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-3" style={{ fontSize: '11px' }}>
                        Materials
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        Material = how light interacts with the surface.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-10 leading-relaxed" style={{ fontSize: '16px' }}>
                        Same sphere, six different materials. The geometry never changes — only how the surface responds to light. Use{' '}
                        <code className="text-indigo-400 font-mono">meshStandardMaterial</code> by default. Upgrade to Physical for glass/clearcoat effects.
                    </p>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="flex flex-wrap gap-2 mb-5">
                        {mats.map((m) => (
                            <GhostButton key={m} active={mat === m} onClick={() => setMat(m)}>
                                {m.replace('Mesh', '')}
                            </GhostButton>
                        ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <CanvasWrapper height={280}>
                                <ambientLight intensity={0.3} />
                                <directionalLight position={[5, 5, 5]} intensity={2} castShadow />
                                <pointLight position={[-4, 2, 2]} intensity={1.5} color="#c084fc" />
                                <LiveMaterial key={mat} type={mat} />
                                <Environment preset="city" />
                                <OrbitControls enableZoom={false} enablePan={false} />
                            </CanvasWrapper>
                            <p className="text-zinc-500 mt-3 text-center" style={{ fontSize: '12px' }}>
                                Drag to orbit
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Tag variant="indigo">{MAT_CODE[mat].tag}</Tag>
                            </div>
                            <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '14px' }}>
                                {MAT_CODE[mat].note}
                            </p>
                            <CodeBlock highlight={['metalness', 'roughness', 'transmission', 'distort', 'factor']}>{MAT_CODE[mat].code}</CodeBlock>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

// ─── 5. Lighting ──────────────────────────────────────────────────────────────
type LightMode = 'ambient' | 'directional' | 'point' | 'spot' | 'env';

function LightScene({ mode }: { mode: LightMode }) {
    const ref = useRef<THREE.Mesh>(null!);
    useFrame((_, d) => {
        ref.current.rotation.y += d * 0.4;
    });
    return (
        <>
            {mode === 'ambient' && <ambientLight intensity={1.5} />}
            {mode === 'directional' && (
                <>
                    <ambientLight intensity={0.1} />
                    <directionalLight position={[5, 5, 5]} intensity={3} castShadow />
                </>
            )}
            {mode === 'point' && (
                <>
                    <ambientLight intensity={0.05} />
                    <pointLight position={[2, 2, 2]} intensity={4} color="#6366f1" distance={8} />
                    <pointLight position={[-2, -1, -2]} intensity={2} color="#c084fc" distance={6} />
                </>
            )}
            {mode === 'spot' && (
                <>
                    <ambientLight intensity={0.05} />
                    <spotLight position={[0, 5, 2]} angle={0.4} penumbra={0.5} intensity={5} castShadow />
                </>
            )}
            {mode === 'env' && (
                <>
                    <ambientLight intensity={0.1} />
                    <Environment preset="sunset" />
                </>
            )}
            <mesh ref={ref} castShadow>
                <boxGeometry args={[1.5, 1.5, 1.5]} />
                <meshStandardMaterial color="#6366f1" metalness={0.6} roughness={0.2} />
            </mesh>
        </>
    );
}

const LIGHT_INFO: Record<LightMode, { code: string; note: string }> = {
    ambient: {
        note: 'Illuminates all objects equally from every direction. No shadows. Good for filling dark areas.',
        code: `<ambientLight intensity={0.5} color="white" />`,
    },
    directional: {
        note: 'Parallel rays from infinity (like the sun). Produces sharp, consistent shadows. The workhorse of real-time lighting.',
        code: `<directionalLight
  position={[5, 5, 5]}  // direction = towards origin
  intensity={2}
  castShadow            // enable shadow map
  shadow-mapSize={[2048, 2048]}
/>
// Shadows also need: <mesh receiveShadow /> and <mesh castShadow />`,
    },
    point: {
        note: 'Emits in all directions from a point in space. Drops off with distance. Great for colored accent lights.',
        code: `<pointLight
  position={[2, 2, 2]}
  intensity={4}
  color="#6366f1"
  distance={8}     // fade-out distance (0 = infinite)
  decay={2}        // physically correct falloff
/>`,
    },
    spot: {
        note: 'Cone of light from a point. Control the cone angle and soft edge (penumbra). Theatrical — use for hero spotlights.',
        code: `<spotLight
  position={[0, 5, 2]}
  angle={0.4}       // cone half-angle in radians
  penumbra={0.5}    // edge softness (0 = hard, 1 = full softness)
  intensity={5}
  castShadow
/>`,
    },
    env: {
        note: 'HDR environment map via Drei. Wraps the scene in a real-world panorama for image-based lighting. The fastest way to get photorealistic results.',
        code: `import { Environment } from '@react-three/drei';

// Presets: 'sunset' | 'dawn' | 'night' | 'warehouse'
// 'forest' | 'apartment' | 'studio' | 'city' | 'park' | 'lobby'
<Environment preset="sunset" />

// Or use your own HDR:
<Environment files="/scene.hdr" />

// Background too:
<Environment preset="sunset" background />`,
    },
};

function LightingSection() {
    const [mode, setMode] = useState<LightMode>('point');
    const modes: LightMode[] = ['ambient', 'directional', 'point', 'spot', 'env'];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="04" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-3" style={{ fontSize: '11px' }}>
                        Lighting
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        Light is 90% of what makes a scene feel real.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-10 leading-relaxed" style={{ fontSize: '16px' }}>
                        Five light types, each with its own role. Most scenes use an <strong className="text-white">ambient</strong> for fill + a <strong className="text-white">directional</strong>{' '}
                        for shadows + an <strong className="text-white">environment</strong> for reflections.
                    </p>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="flex flex-wrap gap-2 mb-5">
                        {modes.map((m) => (
                            <GhostButton key={m} active={mode === m} onClick={() => setMode(m)}>
                                {m}
                            </GhostButton>
                        ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <CanvasWrapper height={260}>
                            <LightScene key={mode} mode={mode} />
                            <OrbitControls enableZoom={false} enablePan={false} />
                        </CanvasWrapper>

                        <div className="space-y-3">
                            <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '14px' }}>
                                {LIGHT_INFO[mode].note}
                            </p>
                            <CodeBlock highlight={['intensity', 'castShadow', 'preset', 'angle', 'penumbra', 'distance']}>{LIGHT_INFO[mode].code}</CodeBlock>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

// ─── 6. Animation ─────────────────────────────────────────────────────────────
function FloatDemo() {
    return (
        <Float speed={2} rotationIntensity={0.6} floatIntensity={1.2}>
            <mesh>
                <icosahedronGeometry args={[1, 1]} />
                <meshStandardMaterial color="#6366f1" metalness={0.5} roughness={0.1} />
            </mesh>
        </Float>
    );
}

function DeltaDemo() {
    const group = useRef<THREE.Group>(null!);
    useFrame((state) => {
        const t = state.clock.elapsedTime;
        group.current.position.y = Math.sin(t * 1.5) * 0.6;
        group.current.rotation.z = Math.sin(t * 0.8) * 0.3;
    });
    return (
        <group ref={group}>
            <mesh>
                <torusGeometry args={[0.8, 0.3, 16, 50]} />
                <meshStandardMaterial color="#8b5cf6" metalness={0.3} roughness={0.3} />
            </mesh>
        </group>
    );
}

type AnimMode = 'float' | 'math' | 'group';

function AnimGroup() {
    const group = useRef<THREE.Group>(null!);
    useFrame((state) => {
        const t = state.clock.elapsedTime;
        group.current.rotation.y = t * 0.5;
    });
    return (
        <group ref={group}>
            {[0, 1, 2, 3, 4].map((i) => {
                const angle = (i / 5) * Math.PI * 2;
                return (
                    <mesh key={i} position={[Math.cos(angle) * 1.4, 0, Math.sin(angle) * 1.4]}>
                        <boxGeometry args={[0.4, 0.4, 0.4]} />
                        <meshStandardMaterial color={`hsl(${i * 60 + 240}, 70%, 65%)`} metalness={0.3} roughness={0.3} />
                    </mesh>
                );
            })}
        </group>
    );
}

function AnimationSection() {
    const [mode, setMode] = useState<AnimMode>('float');

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="05" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-3" style={{ fontSize: '11px' }}>
                        Animation
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        Three animation strategies for design engineers.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-10 leading-relaxed" style={{ fontSize: '16px' }}>
                        R3F animations range from one-liner Drei helpers to full math-driven frame loops. Pick the right tool for the complexity.
                    </p>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="flex gap-2 mb-5">
                        {(['float', 'math', 'group'] as const).map((m) => (
                            <GhostButton key={m} active={mode === m} onClick={() => setMode(m)}>
                                {m}
                            </GhostButton>
                        ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <CanvasWrapper height={260}>
                            <ambientLight intensity={0.5} />
                            <directionalLight position={[5, 5, 5]} intensity={2} />
                            <pointLight position={[-4, 2, 2]} intensity={1.5} color="#a855f7" />
                            {mode === 'float' && <FloatDemo />}
                            {mode === 'math' && <DeltaDemo />}
                            {mode === 'group' && <AnimGroup />}
                            <Environment preset="city" />
                        </CanvasWrapper>

                        <div>
                            {mode === 'float' && (
                                <CodeBlock highlight={['Float', 'rotationIntensity', 'floatIntensity']}>
                                    {`import { Float } from '@react-three/drei';

// Drei's Float — instant hover/levitation effect
// No useFrame needed — it handles the loop internally
<Float
  speed={2}                // animation speed
  rotationIntensity={0.6}  // random rotation amount
  floatIntensity={1.2}     // vertical float amplitude
>
  <mesh>
    <icosahedronGeometry args={[1, 1]} />
    <meshStandardMaterial color="#6366f1" />
  </mesh>
</Float>`}
                                </CodeBlock>
                            )}
                            {mode === 'math' && (
                                <CodeBlock highlight={['Math.sin', 'elapsedTime']}>
                                    {`// Math.sin() is your best friend for smooth loops
// sin() oscillates between -1 and 1 smoothly

useFrame((state) => {
  const t = state.clock.elapsedTime;

  // Vertical bob — amplitude 0.6, speed 1.5
  mesh.current.position.y = Math.sin(t * 1.5) * 0.6;

  // Tilt — different frequency for organic feel
  mesh.current.rotation.z = Math.sin(t * 0.8) * 0.3;

  // Orbit around Y axis
  mesh.current.position.x = Math.cos(t) * 2;
  mesh.current.position.z = Math.sin(t) * 2;
});`}
                                </CodeBlock>
                            )}
                            {mode === 'group' && (
                                <CodeBlock highlight={['<group', 'group.current.rotation']}>
                                    {`// Groups: parent transforms apply to all children
// Rotate the group → all children orbit

const group = useRef();

useFrame((state) => {
  // The whole group spins — children maintain their offset
  group.current.rotation.y = state.clock.elapsedTime * 0.5;
});

// Place children at computed positions
<group ref={group}>
  {items.map((item, i) => {
    const angle = (i / items.length) * Math.PI * 2;
    return (
      <mesh key={i} position={[
        Math.cos(angle) * 1.4,   // x
        0,                        // y
        Math.sin(angle) * 1.4,   // z
      ]}>
        ...
      </mesh>
    );
  })}
</group>`}
                                </CodeBlock>
                            )}
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

// ─── 7. Shaders ───────────────────────────────────────────────────────────────
function WavePlane() {
    const matRef = useRef<THREE.ShaderMaterial & { uTime: number }>(null!);
    useFrame((state) => {
        matRef.current.uTime = state.clock.elapsedTime;
    });
    return (
        <mesh rotation={[-Math.PI / 4, 0, 0]}>
            <planeGeometry args={[3, 3, 32, 32]} />
            {/* @ts-expect-error — custom extend */}
            <waveMaterial ref={matRef} uTime={0} uColor={new THREE.Color('#6366f1')} side={THREE.DoubleSide} />
        </mesh>
    );
}

function FresnelSphere() {
    const ref = useRef<THREE.Mesh>(null!);
    useFrame((_, d) => {
        ref.current.rotation.y += d * 0.4;
    });

    const uniforms = useMemo(
        () => ({
            uColor: { value: new THREE.Color('#6366f1') },
            uRimColor: { value: new THREE.Color('#c084fc') },
        }),
        [],
    );

    return (
        <mesh ref={ref}>
            <sphereGeometry args={[1.2, 64, 64]} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={`
                  varying vec3 vNormal;
                  varying vec3 vViewDir;
                  void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vViewDir = normalize(-vec3(modelViewMatrix * vec4(position, 1.0)));
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                  }
                `}
                fragmentShader={`
                  uniform vec3 uColor;
                  uniform vec3 uRimColor;
                  varying vec3 vNormal;
                  varying vec3 vViewDir;
                  void main() {
                    float fresnel = pow(1.0 - dot(vNormal, vViewDir), 3.0);
                    vec3 color = mix(uColor, uRimColor, fresnel);
                    gl_FragColor = vec4(color, 1.0);
                  }
                `}
            />
        </mesh>
    );
}

type ShaderMode = 'wave' | 'fresnel';

function ShadersSection() {
    const [mode, setMode] = useState<ShaderMode>('wave');

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="06" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-3" style={{ fontSize: '11px' }}>
                        Custom Shaders · GLSL
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        Shaders run on the GPU. Nothing else can.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-10 leading-relaxed" style={{ fontSize: '16px' }}>
                        GLSL shaders are the only way to do per-pixel effects — waves, dissolve, fresnel, noise. Drei&apos;s <code className="text-indigo-400 font-mono">shaderMaterial</code> helper
                        makes them React-friendly with uniforms as props.
                    </p>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="flex gap-2 mb-5">
                        {(['wave', 'fresnel'] as const).map((m) => (
                            <GhostButton key={m} active={mode === m} onClick={() => setMode(m)}>
                                {m}
                            </GhostButton>
                        ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <CanvasWrapper height={280}>
                            <ambientLight intensity={0.3} />
                            {mode === 'wave' && <WavePlane />}
                            {mode === 'fresnel' && <FresnelSphere />}
                        </CanvasWrapper>

                        <div>
                            {mode === 'wave' && (
                                <CodeBlock highlight={['shaderMaterial', 'uTime', 'useFrame', 'uniform']}>
                                    {`import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';

// 1. Create the material with drei
const WaveMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color('#6366f1') }, // uniforms
  // vertex shader — runs per vertex
  \`uniform float uTime;
   void main() {
     vec3 pos = position;
     pos.z += sin(pos.x * 3.0 + uTime * 2.0) * 0.15;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
   }\`,
  // fragment shader — runs per pixel
  \`uniform vec3 uColor;
   uniform float uTime;
   varying vec2 vUv;
   void main() {
     float pattern = sin(vUv.x * 10.0 + uTime) * 0.5 + 0.5;
     gl_FragColor = vec4(mix(uColor * 0.4, uColor, pattern), 1.0);
   }\`
);

// 2. Register with R3F
extend({ WaveMaterial });

// 3. Update uTime every frame
const ref = useRef();
useFrame(({ clock }) => { ref.current.uTime = clock.elapsedTime; });

return <waveMaterial ref={ref} />;`}
                                </CodeBlock>
                            )}
                            {mode === 'fresnel' && (
                                <CodeBlock highlight={['fresnel', 'dot(vNormal', 'uniform vec3', 'varyings']}>
                                    {`// Fresnel effect — bright at glancing angles
// Classic rim-light that works great on spheres

const uniforms = useMemo(() => ({
  uColor:    { value: new THREE.Color('#6366f1') },
  uRimColor: { value: new THREE.Color('#c084fc') },
}), []);

// Vertex: pass normals and view direction to fragment
const vert = \`
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-vec3(modelViewMatrix * vec4(position, 1.0)));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }\`;

// Fragment: fresnel = how perpendicular the surface is to camera
const frag = \`
  uniform vec3 uColor;
  uniform vec3 uRimColor;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    // dot() near 0 = glancing angle = rim
    float fresnel = pow(1.0 - dot(vNormal, vViewDir), 3.0);
    gl_FragColor = vec4(mix(uColor, uRimColor, fresnel), 1.0);
  }\`;

<shaderMaterial uniforms={uniforms} vertexShader={vert} fragmentShader={frag} />`}
                                </CodeBlock>
                            )}
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.2}>
                    <div className="grid md:grid-cols-2 gap-5">
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                            <Tag variant="violet">Uniforms</Tag>
                            <p className="text-zinc-400 mt-3 leading-relaxed" style={{ fontSize: '14px' }}>
                                Data sent from CPU → GPU. Updated each frame. Use for: time, colors, mouse position, viewport size. Each uniform has a typed value object:{' '}
                                <code className="text-zinc-300 font-mono">{`{ value: ... }`}</code>.
                            </p>
                        </div>
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                            <Tag variant="sky">Varyings</Tag>
                            <p className="text-zinc-400 mt-3 leading-relaxed" style={{ fontSize: '14px' }}>
                                Data passed from vertex shader → fragment shader. Automatically interpolated. Use for: UV coordinates, normals, world positions. Declare with{' '}
                                <code className="text-zinc-300 font-mono">varying vec2 vUv;</code> in both shaders.
                            </p>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

// ─── 8. Interaction ───────────────────────────────────────────────────────────
function InteractiveMeshes() {
    const [hovered, setHovered] = useState<number | null>(null);
    const [clicked, setClicked] = useState<number | null>(null);

    const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
    useFrame((_, d) => {
        meshRefs.current.forEach((m, i) => {
            if (!m) return;
            const target = i === clicked ? 1.35 : i === hovered ? 1.15 : 1;
            m.scale.setScalar(THREE.MathUtils.lerp(m.scale.x, target, d * 8));
        });
    });

    const positions: [number, number, number][] = [
        [-1.6, 0, 0],
        [0, 0, 0],
        [1.6, 0, 0],
    ];
    const colors = ['#6366f1', '#8b5cf6', '#a855f7'];

    return (
        <>
            {positions.map((pos, i) => (
                <mesh
                    key={i}
                    ref={(el) => {
                        meshRefs.current[i] = el;
                    }}
                    position={pos}
                    onClick={() => setClicked(clicked === i ? null : i)}
                    onPointerOver={() => {
                        setHovered(i);
                        document.body.style.cursor = 'pointer';
                    }}
                    onPointerOut={() => {
                        setHovered(null);
                        document.body.style.cursor = '';
                    }}
                >
                    <sphereGeometry args={[0.55, 32, 32]} />
                    <meshStandardMaterial color={colors[i]} emissive={colors[i]} emissiveIntensity={i === clicked ? 0.5 : i === hovered ? 0.2 : 0} metalness={0.4} roughness={0.2} />
                </mesh>
            ))}
        </>
    );
}

function InteractionSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="07" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-3" style={{ fontSize: '11px' }}>
                        Interaction · Events
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        3D objects are just clickable React elements.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-10 leading-relaxed" style={{ fontSize: '16px' }}>
                        R3F maps synthetic pointer events onto meshes via raycasting — automatically. Hover and click the spheres below.
                    </p>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <CanvasWrapper height={240}>
                                <ambientLight intensity={0.3} />
                                <pointLight position={[5, 5, 5]} intensity={2} />
                                <InteractiveMeshes />
                                <Environment preset="city" />
                            </CanvasWrapper>
                            <p className="text-zinc-500 mt-3 text-center" style={{ fontSize: '12px' }}>
                                Hover → glow. Click → select.
                            </p>
                        </div>

                        <CodeBlock highlight={['onClick', 'onPointerOver', 'onPointerOut', 'cursor']}>
                            {`<mesh
  onClick={(e) => {
    e.stopPropagation();  // prevent parent mesh triggering too
    setSelected(!selected);
  }}
  onPointerOver={(e) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  }}
  onPointerOut={() => {
    document.body.style.cursor = '';
  }}
  onPointerMove={(e) => {
    // e.point — exact 3D intersection point
    // e.distance — from camera to hit
    // e.face.normal — surface normal at hit
    // e.uv — UV coordinate at hit
  }}
>
  <sphereGeometry />
  <meshStandardMaterial />
</mesh>`}
                        </CodeBlock>
                    </div>
                </FadeIn>

                <FadeIn delay={0.15}>
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
                        <Tag variant="indigo">OrbitControls</Tag>
                        <p className="text-zinc-400 mt-3 mb-4 leading-relaxed" style={{ fontSize: '14px' }}>
                            The most-used Drei helper. Gives users orbit / pan / zoom without any configuration.
                        </p>
                        <CodeBlock highlight={['OrbitControls', 'makeDefault']}>
                            {`import { OrbitControls } from '@react-three/drei';

// Place inside Canvas — controls the default camera
<OrbitControls
  makeDefault              // register as the default controls
  enableZoom={true}
  enablePan={false}        // disable pan for portfolio pieces
  minPolarAngle={Math.PI / 6}   // limit vertical rotation
  maxPolarAngle={Math.PI - Math.PI / 6}
  autoRotate={true}        // continuous rotation when idle
  autoRotateSpeed={1.5}
/>`}
                        </CodeBlock>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

// ─── 9. Loaders ───────────────────────────────────────────────────────────────
function LoadersSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="08" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-3" style={{ fontSize: '11px' }}>
                        Loaders · Assets
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        Load models and textures with one hook.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-10 leading-relaxed" style={{ fontSize: '16px' }}>
                        Drei wraps Three.js loaders into React Suspense hooks. The component suspends while loading and renders when ready — no loading state management needed.
                    </p>
                </FadeIn>

                <div className="space-y-6">
                    <FadeIn delay={0.1}>
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Tag variant="indigo">useGLTF</Tag>
                                <span className="text-zinc-500" style={{ fontSize: '13px' }}>
                                    — 3D model loading (glTF / GLB)
                                </span>
                            </div>
                            <CodeBlock highlight={['useGLTF', 'Suspense', 'preload']}>
                                {`import { useGLTF } from '@react-three/drei';
import { Suspense } from 'react';

// The component suspends while the model loads
function Model() {
  const { scene, animations, nodes, materials } = useGLTF('/model.glb');

  // Tip: use nodes to access individual meshes
  // nodes.Cube → the named mesh from Blender

  return <primitive object={scene} />;
}

// Always wrap in Suspense for graceful loading
<Canvas>
  <Suspense fallback={null}>
    <Model />
  </Suspense>
</Canvas>

// Preload outside component so it starts immediately on page load
useGLTF.preload('/model.glb');`}
                            </CodeBlock>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.15}>
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Tag variant="sky">useTexture</Tag>
                                <span className="text-zinc-500" style={{ fontSize: '13px' }}>
                                    — texture loading
                                </span>
                            </div>
                            <CodeBlock highlight={['useTexture', 'map', 'normalMap', 'roughnessMap']}>
                                {`import { useTexture } from '@react-three/drei';

function TexturedMesh() {
  // Single texture
  const texture = useTexture('/albedo.jpg');

  // Or a PBR texture set — all load in parallel
  const { map, normalMap, roughnessMap, aoMap } = useTexture({
    map:          '/albedo.jpg',    // color
    normalMap:    '/normal.jpg',    // surface detail
    roughnessMap: '/roughness.jpg', // shininess variation
    aoMap:        '/ao.jpg',        // ambient occlusion
  });

  return (
    <mesh>
      <boxGeometry />
      <meshStandardMaterial
        map={map}
        normalMap={normalMap}
        roughnessMap={roughnessMap}
        aoMap={aoMap}
      />
    </mesh>
  );
}`}
                            </CodeBlock>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.2}>
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Tag variant="amber">useAnimations</Tag>
                                <span className="text-zinc-500" style={{ fontSize: '13px' }}>
                                    — GLTF skeletal / morph animations
                                </span>
                            </div>
                            <CodeBlock highlight={['useAnimations', 'actions', '.play()', '.fadeIn']}>
                                {`import { useGLTF, useAnimations } from '@react-three/drei';

function AnimatedCharacter() {
  const group = useRef();
  const { scene, animations } = useGLTF('/character.glb');

  // Pass the scene ref so animations can find the bones
  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    // names → ['Idle', 'Walk', 'Run'] (exported from Blender)
    actions['Idle']?.reset().fadeIn(0.3).play();

    return () => actions['Idle']?.fadeOut(0.3);
  }, [actions]);

  return <primitive ref={group} object={scene} />;
}`}
                            </CodeBlock>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
}

// ─── 10. Performance ──────────────────────────────────────────────────────────
function PerformanceSection() {
    const tips = [
        {
            title: 'Isolate animated components',
            tag: 'Critical',
            tagVariant: 'rose' as const,
            body: 'Never put useFrame inside a component that has React state. When state changes, the component re-renders. Move animation logic into its own isolated child.',
            code: `// Bad — re-renders break useFrame
function Parent() {
  const [count, setCount] = useState(0);
  useFrame(() => { ... }); // re-created on every re-render

  return <Child />;
}

// Good — animation lives in isolation
function AnimatedChild() {
  useFrame(() => { ... }); // stable reference
  return <mesh />;
}
function Parent() {
  const [count, setCount] = useState(0);
  return <AnimatedChild />;
}`,
        },
        {
            title: 'Use instancing for repeated meshes',
            tag: 'Performance',
            tagVariant: 'amber' as const,
            body: 'One drawcall for 1000 identical meshes. Use <Instances> from Drei — it batches all instanced meshes into a single GPU call.',
            code: `import { Instances, Instance } from '@react-three/drei';

// 1000 boxes = 1 draw call instead of 1000
<Instances limit={1000}>
  <boxGeometry args={[0.2, 0.2, 0.2]} />
  <meshStandardMaterial color="#6366f1" />
  {positions.map((pos, i) => (
    <Instance key={i} position={pos} />
  ))}
</Instances>`,
        },
        {
            title: 'Memoize geometries and materials',
            tag: 'Memory',
            tagVariant: 'sky' as const,
            body: 'Creating new geometry or material objects every render allocates GPU memory. Use useMemo to create them once.',
            code: `// Bad — new geometry object created every render
function Mesh() {
  return (
    <mesh geometry={new THREE.SphereGeometry(1)} />
  );
}

// Good — geometry created once, reused across renders
function Mesh() {
  const geo = useMemo(() => new THREE.SphereGeometry(1, 32, 32), []);
  return <mesh geometry={geo} />;
}

// Best — let R3F manage it via JSX
function Mesh() {
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
    </mesh>
  );
}`,
        },
        {
            title: 'frameloop="demand" for static scenes',
            tag: 'Battery',
            tagVariant: 'green' as const,
            body: 'By default R3F renders at 60fps always. For scenes that only need to update on user interaction, use demand mode to save CPU and battery.',
            code: `// Renders only when invalidated
<Canvas frameloop="demand">
  ...
</Canvas>

// Trigger a render when something changes
const { invalidate } = useThree();

function InteractiveScene() {
  return (
    <mesh
      onClick={() => {
        // do something then request one render
        invalidate();
      }}
    />
  );
}`,
        },
    ];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="09" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-3" style={{ fontSize: '11px' }}>
                        Performance
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        Four rules to keep 60fps.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-12 leading-relaxed" style={{ fontSize: '16px' }}>
                        R3F makes 3D accessible but it does not make it free. These patterns are the difference between a buttery 60fps experience and a janky mess.
                    </p>
                </FadeIn>

                <div className="space-y-5">
                    {tips.map(({ title, tag, tagVariant, body, code }, i) => (
                        <FadeIn key={title} delay={i * 0.08}>
                            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                    <h3 className="font-semibold text-white" style={{ fontSize: '16px' }}>
                                        {title}
                                    </h3>
                                    <Tag variant={tagVariant}>{tag}</Tag>
                                </div>
                                <p className="text-zinc-400 mb-4 leading-relaxed" style={{ fontSize: '14px' }}>
                                    {body}
                                </p>
                                <CodeBlock highlight={['useMemo', 'frameloop', 'invalidate', 'AnimatedChild', 'Instances']}>{code}</CodeBlock>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── 11. Checklist ────────────────────────────────────────────────────────────
function ChecklistSection() {
    const items = [
        { issue: 'Forgot Suspense wrapper', fix: 'useGLTF / useTexture suspend — always wrap with <Suspense fallback={null}> inside Canvas.' },
        { issue: 'Animation speed varies per device', fix: 'Multiply by delta, not a fixed value. rotation.y += delta (not += 0.01).' },
        { issue: 'Mesh invisible, no error', fix: 'Check: is there at least one light? meshStandardMaterial needs lights. Use meshBasicMaterial to debug.' },
        { issue: '<mesh> not receiving pointer events', fix: 'Make sure the Canvas has pointer-events: auto and the mesh has at least one material.' },
        { issue: 'Canvas too big / takes full page', fix: 'Wrap Canvas in a div with explicit width and height. Canvas fills its parent by default.' },
        { issue: 'Geometry / material garbage collected', fix: 'Call geometry.dispose() and material.dispose() in a useEffect cleanup when the component unmounts.' },
        { issue: 'Slow scene with many objects', fix: 'Use <Instances> for repeated meshes. One draw call per instance group vs one per mesh.' },
        { issue: 'Uniform not updating in shader', fix: 'Access it as ref.current.uTime = value (direct mutation). Setting it as a prop triggers re-render instead.' },
        { issue: 'Camera stuck / orbit not working', fix: 'Add <OrbitControls makeDefault /> inside Canvas. Check that the Canvas div is not behind a pointer-events: none overlay.' },
        { issue: 'useFrame not running', fix: 'useFrame only works inside Canvas. Components that use it must be rendered inside a <Canvas> tree.' },
    ];

    const [checked, setChecked] = useState<Record<number, boolean>>({});
    const doneCount = Object.values(checked).filter(Boolean).length;

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="10" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-3" style={{ fontSize: '11px' }}>
                        Debugging Checklist
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        Ten things to check when something is wrong.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-4 leading-relaxed" style={{ fontSize: '16px' }}>
                        R3F errors are often silent — a blank canvas, a frozen scene. These are the most common culprits.
                    </p>
                    <div className="flex items-center gap-3 mb-12">
                        <div className="h-1.5 w-40 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div layout className="h-full bg-indigo-500 rounded-full" style={{ width: `${(doneCount / items.length) * 100}%` }} transition={{ duration: 0.3, ease: E_OUT }} />
                        </div>
                        <span className="text-zinc-500 font-mono" style={{ fontSize: '12px' }}>
                            {doneCount}/{items.length}
                        </span>
                    </div>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-[1fr_2fr] bg-zinc-900/80 border-b border-zinc-800 font-mono tracking-[0.15em] uppercase text-zinc-500 px-6 py-3" style={{ fontSize: '11px' }}>
                            <span>Issue</span>
                            <span>Fix</span>
                        </div>
                        {items.map(({ issue, fix }, i) => (
                            <motion.button
                                key={issue}
                                onClick={() => setChecked((prev) => ({ ...prev, [i]: !prev[i] }))}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true, margin: '-20px' }}
                                transition={{ duration: 0.4, ease: E_OUT, delay: i * 0.04 }}
                                className={cn(
                                    'w-full grid grid-cols-[1fr_2fr] items-start gap-4 px-6 py-4 border-b border-zinc-800/60 last:border-0 transition-colors text-left',
                                    checked[i] ? 'bg-indigo-500/5' : 'hover:bg-zinc-900/40',
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={cn(
                                            'mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors',
                                            checked[i] ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600',
                                        )}
                                        style={{ fontSize: '10px' }}
                                    >
                                        {checked[i] && <span className="text-white">✓</span>}
                                    </div>
                                    <code
                                        className={cn('text-rose-400/80 font-mono bg-rose-950/20 px-2 py-1 rounded self-start leading-tight', checked[i] && 'line-through opacity-40')}
                                        style={{ fontSize: '11px' }}
                                    >
                                        {issue}
                                    </code>
                                </div>
                                <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '14px' }}>
                                    {fix}
                                </p>
                            </motion.button>
                        ))}
                    </div>
                </FadeIn>

                <FadeIn delay={0.2}>
                    <div className="mt-10 bg-indigo-500/5 border border-indigo-500/15 rounded-2xl p-8">
                        <p className="font-mono tracking-[0.18em] uppercase text-indigo-400/60 mb-4" style={{ fontSize: '10px' }}>
                            Where to go next
                        </p>
                        <p className="text-white font-semibold mb-3" style={{ fontSize: '20px' }}>
                            Ship something. Then explore.
                        </p>
                        <p className="text-zinc-400 leading-relaxed max-w-2xl mb-6" style={{ fontSize: '15px' }}>
                            The fastest path: start with a rotating mesh and an <code className="text-indigo-400 font-mono">Environment</code>. Add OrbitControls. Replace the material. When it looks
                            good — you understand R3F. Everything else is variation.
                        </p>
                        <div className="grid md:grid-cols-3 gap-4">
                            {[
                                { label: 'Drei docs', desc: 'Full Drei helper reference', url: 'https://github.com/pmndrs/drei' },
                                { label: 'R3F docs', desc: 'Core API reference', url: 'https://r3f.docs.pmnd.rs' },
                                { label: 'pmndrs/examples', desc: 'Community demos & sandboxes', url: 'https://codesandbox.io/examples/package/@react-three/fiber' },
                            ].map(({ label, desc, url }) => (
                                <a
                                    key={label}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group block bg-zinc-900/60 border border-zinc-800 hover:border-indigo-500/40 rounded-xl p-4 transition-colors"
                                >
                                    <p className="text-indigo-400 font-mono font-medium mb-1 group-hover:text-indigo-300 transition-colors" style={{ fontSize: '13px' }}>
                                        {label} ↗
                                    </p>
                                    <p className="text-zinc-500" style={{ fontSize: '12px' }}>
                                        {desc}
                                    </p>
                                </a>
                            ))}
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

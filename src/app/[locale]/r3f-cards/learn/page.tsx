'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Environment, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { motion } from 'framer-motion';
import * as THREE from 'three';

import { CodeBlock } from '@/components/code-block';
import { E_OUT, FadeIn, NOISE_BG } from '@/components/fade-in';
import { cn } from '@/utils/cn';

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionNum({ n }: { n: string }) {
    return (
        <span
            className="absolute -top-8 -left-2 font-black leading-none select-none pointer-events-none"
            style={{ color: 'rgba(251,191,36,0.06)', fontVariantNumeric: 'tabular-nums', fontSize: '144px' }}
        >
            {n}
        </span>
    );
}

function Tag({ children, variant = 'amber' }: { children: React.ReactNode; variant?: 'amber' | 'indigo' | 'green' | 'rose' | 'sky' | 'violet' | 'zinc' }) {
    return (
        <span
            className={cn(
                'inline-flex items-center px-2 py-0.5 rounded font-mono tracking-wider uppercase border',
                variant === 'amber' && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                variant === 'indigo' && 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                variant === 'green' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                variant === 'rose' && 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                variant === 'sky' && 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                variant === 'violet' && 'bg-violet-500/10 text-violet-400 border-violet-500/20',
                variant === 'zinc' && 'bg-zinc-700/30 text-zinc-400 border-zinc-700/40',
            )}
            style={{ fontSize: '11px' }}
        >
            {children}
        </span>
    );
}

function Callout({ children, variant = 'info', title }: { children: React.ReactNode; variant?: 'info' | 'warn' | 'tip' | 'perf'; title?: string }) {
    const map = {
        info: { border: 'border-sky-500/30', bg: 'bg-sky-500/5', icon: '💡', label: title ?? 'Why this matters', text: 'text-sky-300' },
        warn: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', icon: '⚠️', label: title ?? 'Watch out', text: 'text-amber-300' },
        tip: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', icon: '✦', label: title ?? 'Best practice', text: 'text-emerald-300' },
        perf: { border: 'border-violet-500/30', bg: 'bg-violet-500/5', icon: '⚡', label: title ?? 'Performance', text: 'text-violet-300' },
    };
    const c = map[variant];
    return (
        <div className={cn('rounded-xl border px-5 py-4 leading-relaxed', c.border, c.bg)}>
            <p className={cn('font-semibold mb-1 text-sm', c.text)}>
                {c.icon} {c.label}
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed">{children}</p>
        </div>
    );
}

function SectionRule() {
    return <div className="my-20 h-px bg-gradient-to-r from-amber-500/20 via-amber-500/5 to-transparent" />;
}

function Pill({ children }: { children: React.ReactNode }) {
    return <code className="inline-block bg-zinc-800/80 border border-zinc-700/60 text-amber-300 font-mono rounded px-1.5 py-0.5 text-[12px]">{children}</code>;
}

// ─── Mini live demos ──────────────────────────────────────────────────────────

// Demo 1: Circular positioning visualizer
function CircleDemo() {
    const [count, setCount] = useState(8);
    const [radius, setRadius] = useState(1.4);

    return (
        <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950">
            <div className="h-64 relative">
                <Canvas camera={{ position: [0, 4, 0], fov: 50 }}>
                    <CircleScene count={count} radius={radius} />
                    <OrbitControls enableZoom={false} enablePan={false} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[0, 4, 0]} intensity={1} />
                </Canvas>
            </div>
            <div className="p-4 border-t border-zinc-800/60 flex gap-6">
                <label className="flex flex-col gap-1 flex-1">
                    <div className="flex justify-between">
                        <span className="text-zinc-500 font-mono" style={{ fontSize: '11px' }}>
                            count
                        </span>
                        <span className="text-amber-400 font-mono font-bold" style={{ fontSize: '11px' }}>
                            {count}
                        </span>
                    </div>
                    <input
                        type="range"
                        min={3}
                        max={12}
                        step={1}
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                        className="w-full h-1 rounded-full bg-zinc-700 accent-amber-500 cursor-pointer"
                    />
                </label>
                <label className="flex flex-col gap-1 flex-1">
                    <div className="flex justify-between">
                        <span className="text-zinc-500 font-mono" style={{ fontSize: '11px' }}>
                            radius
                        </span>
                        <span className="text-amber-400 font-mono font-bold" style={{ fontSize: '11px' }}>
                            {radius.toFixed(1)}
                        </span>
                    </div>
                    <input
                        type="range"
                        min={0.6}
                        max={2.5}
                        step={0.1}
                        value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        className="w-full h-1 rounded-full bg-zinc-700 accent-amber-500 cursor-pointer"
                    />
                </label>
            </div>
        </div>
    );
}

function CircleScene({ count, radius }: { count: number; radius: number }) {
    const groupRef = useRef<THREE.Group>(null!);
    useFrame((_, delta) => {
        if (groupRef.current) groupRef.current.rotation.y += delta * 0.3;
    });
    return (
        <group ref={groupRef}>
            {Array.from({ length: count }, (_, i) => {
                const angle = (i / count) * Math.PI * 2;
                return (
                    <mesh key={i} position={[Math.sin(angle) * radius, 0, Math.cos(angle) * radius]}>
                        <boxGeometry args={[0.18, 0.26, 0.04]} />
                        <meshStandardMaterial color={`hsl(${(i / count) * 360}, 70%, 65%)`} />
                    </mesh>
                );
            })}
            {/* Axis ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[radius, 0.006, 8, 64]} />
                <meshBasicMaterial color="#3f3f46" />
            </mesh>
        </group>
    );
}

// Demo 2: Damping visualizer
function DampDemo() {
    const [target, setTarget] = useState(0);
    const [lambda, setLambda] = useState(4);
    const [display, setDisplay] = useState(0);

    return (
        <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950">
            <div className="h-44 relative">
                <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
                    <DampScene target={target} lambda={lambda} onPos={setDisplay} />
                </Canvas>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-4">
                    <button
                        onClick={() => setTarget(-1.2)}
                        className={cn(
                            'px-3 py-1 rounded-full font-mono border text-[11px] transition-colors',
                            target === -1.2 ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500',
                        )}
                    >
                        Left
                    </button>
                    <button
                        onClick={() => setTarget(0)}
                        className={cn(
                            'px-3 py-1 rounded-full font-mono border text-[11px] transition-colors',
                            target === 0 ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500',
                        )}
                    >
                        Center
                    </button>
                    <button
                        onClick={() => setTarget(1.2)}
                        className={cn(
                            'px-3 py-1 rounded-full font-mono border text-[11px] transition-colors',
                            target === 1.2 ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500',
                        )}
                    >
                        Right
                    </button>
                </div>
            </div>
            <div className="p-4 border-t border-zinc-800/60 flex gap-6 items-center">
                <label className="flex flex-col gap-1 flex-1">
                    <div className="flex justify-between">
                        <span className="text-zinc-500 font-mono" style={{ fontSize: '11px' }}>
                            lambda (speed)
                        </span>
                        <span className="text-amber-400 font-mono font-bold" style={{ fontSize: '11px' }}>
                            {lambda}
                        </span>
                    </div>
                    <input
                        type="range"
                        min={1}
                        max={20}
                        step={1}
                        value={lambda}
                        onChange={(e) => setLambda(Number(e.target.value))}
                        className="w-full h-1 rounded-full bg-zinc-700 accent-amber-500 cursor-pointer"
                    />
                </label>
                <div className="font-mono text-[11px] text-zinc-500 shrink-0">
                    pos: <span className="text-amber-400">{display.toFixed(3)}</span>
                </div>
            </div>
        </div>
    );
}

function DampScene({ target, lambda, onPos }: { target: number; lambda: number; onPos: (v: number) => void }) {
    const meshRef = useRef<THREE.Mesh>(null!);
    const posRef = useRef(0);

    useFrame((_, delta) => {
        if (!meshRef.current) return;
        posRef.current = THREE.MathUtils.damp(posRef.current, target, lambda, delta);
        meshRef.current.position.x = posRef.current;
        onPos(posRef.current);
    });

    return (
        <>
            <ambientLight intensity={0.4} />
            <pointLight position={[0, 2, 2]} intensity={1.5} />
            {/* Track line */}
            <mesh>
                <boxGeometry args={[3, 0.02, 0.02]} />
                <meshBasicMaterial color="#3f3f46" />
            </mesh>
            {/* Target ghost */}
            <mesh position={[target, 0, 0]}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshBasicMaterial color="#fbbf24" opacity={0.2} transparent />
            </mesh>
            {/* Moving sphere */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[0.14, 24, 24]} />
                <meshStandardMaterial color="#fbbf24" />
            </mesh>
        </>
    );
}

// Demo 3: Fog depth visualizer
function FogDemo() {
    const [near, setNear] = useState(8.5);
    const [far, setFar] = useState(12);

    return (
        <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950">
            <div className="h-52 relative">
                <Canvas camera={{ position: [0, 1.5, 14], fov: 40 }}>
                    <FogScene near={near} far={far} />
                </Canvas>
            </div>
            <div className="p-4 border-t border-zinc-800/60 flex gap-6">
                <label className="flex flex-col gap-1 flex-1">
                    <div className="flex justify-between">
                        <span className="text-zinc-500 font-mono" style={{ fontSize: '11px' }}>
                            near
                        </span>
                        <span className="text-amber-400 font-mono font-bold" style={{ fontSize: '11px' }}>
                            {near.toFixed(1)}
                        </span>
                    </div>
                    <input
                        type="range"
                        min={2}
                        max={15}
                        step={0.5}
                        value={near}
                        onChange={(e) => setNear(Number(e.target.value))}
                        className="w-full h-1 rounded-full bg-zinc-700 accent-amber-500 cursor-pointer"
                    />
                </label>
                <label className="flex flex-col gap-1 flex-1">
                    <div className="flex justify-between">
                        <span className="text-zinc-500 font-mono" style={{ fontSize: '11px' }}>
                            far
                        </span>
                        <span className="text-amber-400 font-mono font-bold" style={{ fontSize: '11px' }}>
                            {far.toFixed(1)}
                        </span>
                    </div>
                    <input
                        type="range"
                        min={5}
                        max={25}
                        step={0.5}
                        value={far}
                        onChange={(e) => setFar(Number(e.target.value))}
                        className="w-full h-1 rounded-full bg-zinc-700 accent-amber-500 cursor-pointer"
                    />
                </label>
            </div>
        </div>
    );
}

function FogScene({ near, far }: { near: number; far: number }) {
    const fogColor = '#a79';
    return (
        <>
            <fog attach="fog" args={[fogColor, near, far]} />
            <ambientLight intensity={0.6} />
            {Array.from({ length: 8 }, (_, i) => (
                <mesh key={i} position={[((i % 4) - 1.5) * 1.5, 0, -(Math.floor(i / 4) * 3) + 1]}>
                    <boxGeometry args={[0.8, 1.1, 0.06]} />
                    <meshStandardMaterial color={`hsl(${i * 45}, 60%, 55%)`} />
                </mesh>
            ))}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, -4]}>
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial color="#18181b" />
            </mesh>
        </>
    );
}

// ─── Page sections ────────────────────────────────────────────────────────────

function HeroSection() {
    const words = ['3D', 'Carousel'];
    return (
        <section className="relative min-h-[65vh] flex flex-col justify-center px-6 md:px-12 xl:px-24 pt-32 pb-16">
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: E_OUT }}
                className="font-mono tracking-widest uppercase text-amber-400/70 mb-6"
                style={{ fontSize: '11px' }}
            >
                <Link href="/r3f-cards" className="hover:text-amber-400 transition-colors">
                    ← Live demo
                </Link>
                &nbsp;&nbsp;·&nbsp;&nbsp; R3F Deep Dive
            </motion.p>
            <h1 className="flex flex-wrap gap-x-4 gap-y-1 font-black leading-[0.9] mb-8" style={{ fontSize: 'clamp(52px, 10vw, 120px)' }}>
                {words.map((word, i) => (
                    <motion.span key={word} initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: E_OUT, delay: 0.1 + i * 0.08 }} className="text-white">
                        {word}
                    </motion.span>
                ))}
            </h1>
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: E_OUT, delay: 0.35 }}
                className="text-zinc-400 max-w-2xl leading-relaxed"
                style={{ fontSize: '17px' }}
            >
                A complete breakdown of the techniques behind a performant, scroll-driven, interactive 3D image carousel. We cover circular math, per-frame damping, custom geometries, vertex shaders,
                and camera parallax — all in React Three Fiber.
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, ease: E_OUT, delay: 0.55 }} className="flex flex-wrap gap-2 mt-8">
                {['React Three Fiber', 'Three.js', 'Scroll-driven', 'Vertex Shaders', 'Custom Geometry'].map((t) => (
                    <Tag key={t} variant="amber">
                        {t}
                    </Tag>
                ))}
            </motion.div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease: E_OUT, delay: 0.7 }}
                className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-zinc-800 pt-8 max-w-2xl"
            >
                {[
                    { label: 'Sections', value: '8' },
                    { label: 'Live demos', value: '5' },
                    { label: 'Techniques', value: '12' },
                    { label: 'Lines of R3F', value: '~130' },
                ].map((s) => (
                    <div key={s.label}>
                        <p className="text-2xl font-black text-amber-400">{s.value}</p>
                        <p className="text-zinc-500 text-xs font-mono mt-0.5">{s.label}</p>
                    </div>
                ))}
            </motion.div>
        </section>
    );
}

function FoundationSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-16">
            <SectionNum n="01" />
            <FadeIn>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Tag variant="amber">Foundation</Tag>
                    <h2 className="text-3xl md:text-4xl font-black text-white">The Canvas & Scene Graph</h2>
                </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 mb-10">
                <FadeIn delay={0.05}>
                    <p className="text-zinc-400 leading-relaxed text-base">
                        Everything in R3F lives inside a <Pill>{'<Canvas>'}</Pill>. It creates a WebGL context, a renderer, a default camera, and a render loop — all managed for you. Your JSX children
                        describe the Three.js scene graph declaratively.
                    </p>
                </FadeIn>
                <FadeIn delay={0.1}>
                    <p className="text-zinc-400 leading-relaxed text-base">
                        The carousel uses a narrow <strong className="text-zinc-200">FOV of 15°</strong> with the camera pushed far back (<Pill>z = 100</Pill>). A low FOV compresses depth and gives
                        that clean, editorial look where everything appears the same size regardless of depth.
                    </p>
                </FadeIn>
            </div>

            <FadeIn delay={0.1}>
                <CodeBlock lang="tsx">{`// The entire scene is ~20 lines of JSX
export default function App() {
  return (
    <Canvas
      camera={{ position: [0, 0, 100], fov: 15 }}
      //              ^─ far back    ^─ narrow FOV = editorial "telephoto" look
    >
      <fog attach="fog" args={['#a79', 8.5, 12]} />
      {/*           color ──^      ^near  ^far   */}

      <ScrollControls pages={4} infinite>
        <Rig rotation={[0, 0, 0.15]}>
          <Carousel />          {/* 8 cards in a circle */}
        </Rig>
        <Banner position={[0, -0.15, 0]} />
      </ScrollControls>

      <Environment preset="dawn" background blur={0.5} />
    </Canvas>
  )
}`}</CodeBlock>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
                <FadeIn delay={0.15}>
                    <Callout variant="info" title="Why fov: 15?">
                        A narrow field-of-view mimics a telephoto lens. Objects appear flatter and similar in size regardless of their Z depth — perfect for a carousel where you want all cards to look
                        equal. Widen it and the perspective distortion breaks the illusion.
                    </Callout>
                </FadeIn>
                <FadeIn delay={0.2}>
                    <Callout variant="tip" title='attach="fog"'>
                        R3F&apos;s <code className="text-xs">attach</code> prop places this node directly on the parent scene object as <code className="text-xs">scene.fog</code>. It&apos;s how R3F
                        handles non-mesh Three.js objects that need to be attached to a parent property.
                    </Callout>
                </FadeIn>
            </div>
        </section>
    );
}

function CircularLayoutSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-16">
            <SectionNum n="02" />
            <FadeIn>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Tag variant="green">Math</Tag>
                    <h2 className="text-3xl md:text-4xl font-black text-white">Circular Layout</h2>
                </div>
            </FadeIn>

            <FadeIn delay={0.05}>
                <p className="text-zinc-400 leading-relaxed text-base mb-8 max-w-2xl">
                    Positioning <Pill>count</Pill> items evenly around a circle uses the unit circle: each item gets an angle of <Pill>{'(i / count) * 2π'}</Pill> radians, and its position is derived
                    from <Pill>sin(angle)</Pill> for X and <Pill>cos(angle)</Pill> for Z. Rotation is the same angle, offset by π so cards face outward.
                </p>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                <FadeIn delay={0.1}>
                    <CodeBlock lang="tsx">{`function Carousel({ radius = 1.4, count = 8 }) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2

    return (
      <Card
        key={i}
        url={\`/img\${i % 10 + 1}.jpg\`}
        position={[
          Math.sin(angle) * radius,  // X
          0,                          // Y (flat)
          Math.cos(angle) * radius,  // Z
        ]}
        rotation={[
          0,
          Math.PI + angle,  // face outward
          0,
        ]}
      />
    )
  })
}`}</CodeBlock>
                </FadeIn>
                <FadeIn delay={0.15}>
                    <div className="space-y-4">
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            <strong className="text-zinc-200">Drag the sliders</strong> to see how count and radius affect the layout in real time. Notice how cards become more spread out as radius
                            grows, and the angles stay evenly distributed regardless of count.
                        </p>
                        <CircleDemo />
                    </div>
                </FadeIn>
            </div>

            <FadeIn delay={0.2}>
                <Callout variant="tip" title="Why Math.PI + angle for rotation?">
                    Without the <code className="text-xs">Math.PI</code> offset, each card would face inward (toward the center). Adding π flips it 180° so the front of each card faces outward toward
                    the viewer.
                </Callout>
            </FadeIn>
        </section>
    );
}

function ScrollDrivenSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-16">
            <SectionNum n="03" />
            <FadeIn>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Tag variant="indigo">Interaction</Tag>
                    <h2 className="text-3xl md:text-4xl font-black text-white">Scroll-Driven Rotation</h2>
                </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                    <FadeIn delay={0.05}>
                        <p className="text-zinc-400 leading-relaxed text-base">
                            Drei&apos;s <Pill>{'<ScrollControls>'}</Pill> hijacks the page scroll and converts it into an <Pill>offset</Pill> value between 0 and 1. Setting <Pill>infinite</Pill> makes
                            it loop seamlessly. <Pill>pages={4}</Pill> means 4 full scrolls = one revolution.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p className="text-zinc-400 leading-relaxed text-base">
                            The <strong className="text-zinc-200">Rig</strong> component wraps the carousel in a group, reads the scroll offset every frame, and converts it to Y-axis rotation:
                            <Pill>{'rotation.y = -offset * (Math.PI * 2)'}</Pill>.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.15}>
                        <Callout variant="info" title="state.events.update()">
                            By calling this inside <code className="text-xs">useFrame</code>, raycasts run every frame — not just on pointer-move. This is essential: if the carousel spins while the
                            pointer is stationary, you still want hover detection to update correctly.
                        </Callout>
                    </FadeIn>
                </div>
                <FadeIn delay={0.1}>
                    <CodeBlock lang="tsx">{`function Rig({ children, ...props }) {
  const ref = useRef()
  const scroll = useScroll()
  //             ^─ from <ScrollControls>

  useFrame((state, delta) => {
    // Map scroll offset [0→1] to full rotation [0→2π]
    ref.current.rotation.y =
      -scroll.offset * (Math.PI * 2)

    // ⚠️ Must call this so raycasts update
    // even when the pointer isn't moving
    state.events.update()

    // Smooth camera parallax (section 05)
    damp3(
      state.camera.position,
      [-state.pointer.x * 2, state.pointer.y + 1.5, 10],
      smoothing, delta
    )
    state.camera.lookAt(0, 0, 0)
  })

  return <group ref={ref} {...props} />
}`}</CodeBlock>
                </FadeIn>
            </div>

            <FadeIn delay={0.2}>
                <CodeBlock lang="tsx">{`// In App.tsx — wire up ScrollControls
<ScrollControls
  pages={4}      // 4 scroll heights = full 360°
  infinite       // seamlessly loops offset 0→1→0
>
  <Rig rotation={[0, 0, 0.15]}>
    <Carousel />
  </Rig>
  {/* Banner is also inside ScrollControls so it
      receives scroll.delta for the sine animation */}
  <Banner position={[0, -0.15, 0]} />
</ScrollControls>`}</CodeBlock>
            </FadeIn>
        </section>
    );
}

function DampingSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-16">
            <SectionNum n="04" />
            <FadeIn>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Tag variant="violet">Animation</Tag>
                    <h2 className="text-3xl md:text-4xl font-black text-white">Per-Frame Damping</h2>
                </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-5">
                    <FadeIn delay={0.05}>
                        <p className="text-zinc-400 leading-relaxed text-base">
                            Instead of CSS transitions or spring libraries, R3F uses <strong className="text-zinc-200">exponential decay damping</strong> applied every frame. The formula is: on each
                            frame, move a fraction of the remaining distance toward the target. This creates that characteristic ease-out &quot;chase&quot; feel.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p className="text-zinc-400 leading-relaxed text-base">
                            Three.js ships <Pill>MathUtils.damp(from, to, lambda, delta)</Pill> built-in. The <Pill>lambda</Pill> controls speed — higher = snappier. Multiplying by{' '}
                            <Pill>1/delta</Pill> makes it framerate-independent (crucial for 120Hz screens).
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.15}>
                        <Callout variant="perf" title="Delta-independent damping">
                            Always pass <code className="text-xs">delta</code> to your damp calls. Without it, animations run twice as fast at 120fps versus 60fps. The formula uses{' '}
                            <code className="text-xs">1 - e^(-lambda × delta)</code> which naturally compensates for variable frame rates.
                        </Callout>
                    </FadeIn>
                </div>
                <FadeIn delay={0.1}>
                    <div className="space-y-4">
                        <p className="text-zinc-400 text-sm">Click a position — watch the sphere ease toward it. Adjust lambda to feel the difference between sluggish and snappy.</p>
                        <DampDemo />
                    </div>
                </FadeIn>
            </div>

            <FadeIn delay={0.15}>
                <CodeBlock lang="tsx">{`// Implementing damp helpers without external deps
// THREE.MathUtils.damp is built into Three.js

function damp(
  object: Record<string, number>,
  key: string,
  to: number,
  lambda: number,   // speed (higher = faster)
  delta: number     // frame time in seconds
) {
  object[key] = THREE.MathUtils.damp(
    object[key],  // from
    to,           // target
    lambda,       // speed
    delta         // frame dt — keeps it framerate-independent
  )
}

function damp3(
  current: THREE.Vector3,
  to: [number, number, number] | number,
  lambda: number,
  delta: number
) {
  const [x, y, z] =
    typeof to === 'number' ? [to, to, to] : to
  current.x = THREE.MathUtils.damp(current.x, x, lambda, delta)
  current.y = THREE.MathUtils.damp(current.y, y, lambda, delta)
  current.z = THREE.MathUtils.damp(current.z, z, lambda, delta)
}

// Usage inside useFrame
useFrame((_, delta) => {
  // Scale the card up smoothly on hover
  damp3(ref.current.scale, hovered ? 1.15 : 1, 0.1 / delta, delta)

  // Animate material properties (radius, zoom)
  damp(ref.current.material, 'radius', hovered ? 0.25 : 0.1, 0.2 / delta, delta)
  damp(ref.current.material, 'zoom',   hovered ? 1    : 1.5, 0.2 / delta, delta)
})`}</CodeBlock>
            </FadeIn>

            <FadeIn delay={0.2}>
                <div className="mt-6 p-5 rounded-xl border border-zinc-800 bg-zinc-900/40">
                    <p className="text-zinc-300 font-semibold mb-3 text-sm">Understanding the lambda values</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        {[
                            { lambda: '2–4', feel: 'Soft & floaty', use: 'Camera parallax' },
                            { lambda: '8–15', feel: 'Responsive', use: 'Hover scale' },
                            { lambda: '20+', feel: 'Near-instant', use: 'Cursor tracking' },
                        ].map((row) => (
                            <div key={row.lambda} className="bg-zinc-800/50 rounded-lg p-3">
                                <p className="text-amber-400 font-mono font-bold">{row.lambda}</p>
                                <p className="text-zinc-300 text-xs mt-1">{row.feel}</p>
                                <p className="text-zinc-500 text-xs mt-1">{row.use}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </FadeIn>
        </section>
    );
}

function HoverCardSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-16">
            <SectionNum n="05" />
            <FadeIn>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Tag variant="rose">Hover</Tag>
                    <h2 className="text-3xl md:text-4xl font-black text-white">Interactive Cards</h2>
                </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-5">
                    <FadeIn delay={0.05}>
                        <p className="text-zinc-400 leading-relaxed text-base">
                            Drei&apos;s <Pill>{'<Image>'}</Pill> component renders textures as planes with built-in shader properties: <Pill>radius</Pill> (rounded corners) and <Pill>zoom</Pill> (UV
                            scale). Both are floats on the material — perfect for smooth damp transitions.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p className="text-zinc-400 leading-relaxed text-base">
                            Hover detection uses R3F&apos;s <Pill>onPointerOver</Pill> / <Pill>onPointerOut</Pill> events, which map to Three.js raycasting.{' '}
                            <strong className="text-zinc-200">Always call</strong> <Pill>e.stopPropagation()</Pill> on pointer-over so only the front-most card registers the event when cards overlap.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.15}>
                        <Callout variant="tip" title="Three effects in one hover">
                            Scale up (1→1.15), shrink corner radius (0.1→0.25 = sharper edges), and zoom into the image (1.5→1 = reveal more). Each uses a different lambda for varied feel: scale is
                            snappy (0.1), while radius/zoom are softer (0.2).
                        </Callout>
                    </FadeIn>
                </div>
                <FadeIn delay={0.1}>
                    <CodeBlock lang="tsx">{`function Card({ url, ...props }) {
  const ref = useRef()
  const [hovered, hover] = useState(false)

  const pointerOver = (e) => {
    e.stopPropagation() // ← critical for overlapping cards
    hover(true)
  }
  const pointerOut = () => hover(false)

  useFrame((_, delta) => {
    // 1. Scale card up on hover
    damp3(ref.current.scale,
      hovered ? 1.15 : 1, 0.1 / delta, delta)

    // 2. Round corners via Image material property
    damp(ref.current.material, 'radius',
      hovered ? 0.25 : 0.1, 0.2 / delta, delta)

    // 3. Zoom: at rest show less, on hover show full
    damp(ref.current.material, 'zoom',
      hovered ? 1 : 1.5, 0.2 / delta, delta)
  })

  return (
    <Image
      ref={ref}
      url={url}
      transparent
      side={THREE.DoubleSide}
      onPointerOver={pointerOver}
      onPointerOut={pointerOut}
      {...props}
    >
      {/* Custom bent geometry (section 06) */}
      <bentPlaneGeometry args={[0.1, 1, 1, 20, 20]} />
    </Image>
  )
}`}</CodeBlock>
                </FadeIn>
            </div>

            <FadeIn delay={0.2}>
                <div className="mt-2 p-5 rounded-xl border border-zinc-800 bg-zinc-900/40">
                    <p className="text-zinc-400 text-sm mb-3">
                        <strong className="text-zinc-200">Why THREE.DoubleSide?</strong> As the carousel rotates, cards briefly show their back face. By default Three.js culls back faces (performance
                        optimization).
                        <Pill>DoubleSide</Pill> disables culling so both sides render — at a small GPU cost worth paying for this effect.
                    </p>
                </div>
            </FadeIn>
        </section>
    );
}

function BentGeometrySection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-16">
            <SectionNum n="06" />
            <FadeIn>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Tag variant="sky">Geometry</Tag>
                    <h2 className="text-3xl md:text-4xl font-black text-white">Custom Geometry: BentPlane</h2>
                </div>
            </FadeIn>

            <FadeIn delay={0.05}>
                <p className="text-zinc-400 leading-relaxed text-base mb-8 max-w-2xl">
                    A flat plane would look stiff. The <Pill>BentPlaneGeometry</Pill> wraps a <Pill>THREE.PlaneGeometry</Pill> around a circular arc — using circumscribed circle geometry to compute
                    the correct bend. The result is that subtle curved-card feel.
                </p>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                <FadeIn delay={0.1}>
                    <CodeBlock lang="ts">{`// By Paul West @prisoner849
// https://discourse.threejs.org/t/26647
class BentPlaneGeometry extends THREE.PlaneGeometry {
  constructor(radius: number, ...args) {
    super(...args)
    const p = this.parameters
    const hw = p.width * 0.5          // half-width

    // Three points on a circle: left edge, top arc, right edge
    const a = new THREE.Vector2(-hw, 0)
    const b = new THREE.Vector2(0, radius)
    const c = new THREE.Vector2(hw, 0)

    // Circumscribed circle radius from three points
    const ab = new THREE.Vector2().subVectors(a, b)
    const bc = new THREE.Vector2().subVectors(b, c)
    const ac = new THREE.Vector2().subVectors(a, c)
    const r = (ab.length() * bc.length() * ac.length())
            / (2 * Math.abs(ab.cross(ac)))

    // Arc parameters
    const center = new THREE.Vector2(0, radius - r)
    const baseV  = new THREE.Vector2().subVectors(a, center)
    const arc    = (baseV.angle() - Math.PI * 0.5) * 2

    // Reposition every vertex along the arc
    const uv  = this.attributes.uv
    const pos = this.attributes.position
    const v   = new THREE.Vector2()
    for (let i = 0; i < uv.count; i++) {
      const t = 1 - uv.getX(i)   // u coord → arc position
      const y = pos.getY(i)       // preserve vertical pos
      v.copy(c).rotateAround(center, arc * t)
      pos.setXYZ(i, v.x, y, -v.y)
    }
    pos.needsUpdate = true
  }
}

// Register as JSX element
extend({ BentPlaneGeometry })

// Usage
<bentPlaneGeometry args={[
  0.1,    // ← radius (smaller = tighter curve)
  1, 1,   // width, height
  20, 20  // segments (more = smoother curve)
]} />`}</CodeBlock>
                </FadeIn>
                <FadeIn delay={0.15}>
                    <div className="space-y-5">
                        <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950">
                            <div className="h-56">
                                <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
                                    <BentPlaneDemo />
                                    <OrbitControls enableZoom={false} />
                                    <ambientLight intensity={0.4} />
                                    <pointLight position={[2, 2, 2]} intensity={1.5} />
                                    <Environment preset="city" />
                                </Canvas>
                            </div>
                            <p className="p-3 text-zinc-500 font-mono text-center border-t border-zinc-800" style={{ fontSize: '10px' }}>
                                DRAG TO ROTATE · BentPlaneGeometry with radius=0.1, segments=20×20
                            </p>
                        </div>
                        <Callout variant="tip" title="Segment count matters">
                            The bend is achieved by moving existing vertices — not adding new ones. More segments (20×20) = more vertices to curve = smoother arc. Fewer segments (4×4) will look
                            faceted.
                        </Callout>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

function BentPlaneDemo() {
    const meshRef = useRef<THREE.Mesh>(null!);
    useFrame((_, delta) => {
        if (meshRef.current) meshRef.current.rotation.y += delta * 0.4;
    });

    const geo = new (class extends THREE.PlaneGeometry {
        constructor() {
            super(1, 1.4, 20, 20);
            const p = this.parameters;
            const hw = p.width * 0.5;
            const radius = 0.1;
            const a = new THREE.Vector2(-hw, 0);
            const b = new THREE.Vector2(0, radius);
            const c = new THREE.Vector2(hw, 0);
            const ab = new THREE.Vector2().subVectors(a, b);
            const bc = new THREE.Vector2().subVectors(b, c);
            const ac = new THREE.Vector2().subVectors(a, c);
            const r = (ab.length() * bc.length() * ac.length()) / (2 * Math.abs(ab.cross(ac)));
            const center = new THREE.Vector2(0, radius - r);
            const baseV = new THREE.Vector2().subVectors(a, center);
            const arc = (baseV.angle() - Math.PI * 0.5) * 2;
            const uv = this.attributes.uv;
            const pos = this.attributes.position;
            const v = new THREE.Vector2();
            for (let i = 0; i < uv.count; i++) {
                v.copy(c).rotateAround(center, arc * (1 - uv.getX(i)));
                pos.setXYZ(i, v.x, pos.getY(i), -v.y);
            }
            pos.needsUpdate = true;
        }
    })();

    return (
        <mesh ref={meshRef} geometry={geo}>
            <meshStandardMaterial color="#f59e0b" side={THREE.DoubleSide} />
        </mesh>
    );
}

function VertexShaderSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-16">
            <SectionNum n="07" />
            <FadeIn>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Tag variant="violet">Shaders</Tag>
                    <h2 className="text-3xl md:text-4xl font-black text-white">Vertex Shaders & onBeforeCompile</h2>
                </div>
            </FadeIn>

            <FadeIn delay={0.05}>
                <p className="text-zinc-400 leading-relaxed text-base mb-8 max-w-2xl">
                    The banner ribbon uses a custom vertex shader that animates each vertex with a sine wave. Rather than writing a shader from scratch, we{' '}
                    <strong className="text-zinc-200">extend</strong> <Pill>MeshBasicMaterial</Pill> and inject a snippet into Three.js&apos;s compiled GLSL using
                    <Pill>onBeforeCompile</Pill> — the cleanest way to add custom GPU effects.
                </p>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                <FadeIn delay={0.1}>
                    <CodeBlock lang="ts">{`class MeshSineMaterial extends THREE.MeshBasicMaterial {
  readonly time: { value: number }

  constructor(params = {}) {
    super(params)
    this.time = { value: 0 }   // uniform — updated from JS
  }

  onBeforeCompile(shader) {
    // 1. Expose our uniform to the shader
    shader.uniforms.time = this.time

    // 2. Declare it at the top of vertex shader
    shader.vertexShader = \`
      uniform float time;
      \${shader.vertexShader}
    \`

    // 3. Replace Three.js's #include <begin_vertex>
    //    with our custom vertex displacement
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      \`vec3 transformed = vec3(
        position.x,
        position.y
          + sin(time + uv.x * PI * 4.0) / 4.0,
        //   ^──────────────────────────────
        //   4 full sine cycles across the texture
        //   amplitude = 0.25 units
        position.z
      );\`
    )
  }
}

extend({ MeshSineMaterial })  // register as JSX`}</CodeBlock>
                </FadeIn>
                <div className="space-y-5">
                    <FadeIn delay={0.1}>
                        <CodeBlock lang="tsx">{`// Driving the shader from useFrame
function Banner(props) {
  const ref = useRef()
  const texture = useTexture('/work_.png')
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping

  const scroll = useScroll()

  useFrame((_, delta) => {
    // Accumulate time from scroll velocity
    // → faster scroll = more wave energy
    ref.current.material.time.value +=
      Math.abs(scroll.delta) * 4

    // Continuously pan the texture
    ref.current.material.map.offset.x += delta / 2
  })

  return (
    <mesh ref={ref} {...props}>
      <cylinderGeometry
        args={[1.6, 1.6, 0.14, 128, 16, true]}
        //    ^r   ^r   ^h    ^seg ^stacks ^open
      />
      <meshSineMaterial
        map={texture}
        map-anisotropy={16}   // sharp at angles
        map-repeat={[30, 1]}  // tile horizontally 30×
        side={THREE.DoubleSide}
        toneMapped={false}    // keep colors vivid
      />
    </mesh>
  )
}`}</CodeBlock>
                    </FadeIn>
                    <FadeIn delay={0.15}>
                        <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950">
                            <div className="h-36">
                                <Canvas camera={{ position: [0, 0.5, 4], fov: 40 }}>
                                    <SineWaveDemo />
                                    <ambientLight intensity={0.3} />
                                </Canvas>
                            </div>
                            <p className="p-3 text-zinc-500 font-mono text-center border-t border-zinc-800" style={{ fontSize: '10px' }}>
                                SINE WAVE VERTEX DISPLACEMENT · time uniform accumulates over scroll
                            </p>
                        </div>
                    </FadeIn>
                </div>
            </div>

            <FadeIn delay={0.2}>
                <div className="grid md:grid-cols-3 gap-4">
                    <Callout variant="info" title="onBeforeCompile">
                        Three.js calls this once before compiling the GLSL program. Use string replacement on shader.vertexShader / fragmentShader to inject code. It&apos;s surgical — you keep all of
                        Three&apos;s built-in lighting, fog, etc.
                    </Callout>
                    <Callout variant="tip" title="extend()">
                        Calling <code className="text-xs">extend({'{ MeshSineMaterial }'})</code> registers the class in R3F&apos;s catalogue so you can write{' '}
                        <code className="text-xs">{'<meshSineMaterial />'}</code> in JSX. Three.js classes get camelCased automatically.
                    </Callout>
                    <Callout variant="perf" title="toneMapped={false}">
                        Disabling tone mapping on the banner keeps its colors bright and punchy. Tone mapping compresses HDR to SDR — great for PBR materials, but it can dull a flat text/logo banner
                        that&apos;s meant to stand out.
                    </Callout>
                </div>
            </FadeIn>
        </section>
    );
}

function SineWaveDemo() {
    const meshRef = useRef<THREE.Mesh>(null!);
    const timeRef = useRef(0);

    useFrame((_, delta) => {
        timeRef.current += delta * 1.5;
        if (!meshRef.current) return;
        const geo = meshRef.current.geometry as THREE.PlaneGeometry;
        const pos = geo.attributes.position;
        const uv = geo.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
            const u = uv.getX(i);
            const x = pos.getX(i);
            const z = pos.getZ(i);
            const y = Math.sin(timeRef.current + u * Math.PI * 4) / 4;
            pos.setXYZ(i, x, y, z);
        }
        pos.needsUpdate = true;
    });

    return (
        <mesh ref={meshRef} rotation={[-0.3, 0, 0]}>
            <planeGeometry args={[4, 0.5, 64, 1]} />
            <meshBasicMaterial color="#f59e0b" side={THREE.DoubleSide} wireframe />
        </mesh>
    );
}

function FogEnvironmentSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-16">
            <SectionNum n="08" />
            <FadeIn>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Tag variant="zinc">Atmosphere</Tag>
                    <h2 className="text-3xl md:text-4xl font-black text-white">Fog & Environment</h2>
                </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-5">
                    <FadeIn delay={0.05}>
                        <p className="text-zinc-400 leading-relaxed text-base">
                            Linear fog fades objects between a <Pill>near</Pill> and <Pill>far</Pill> distance. In the carousel, <Pill>near=8.5</Pill> / <Pill>far=12</Pill> means cards just outside
                            the field of view start fading — creating a sense of infinite depth without rendering extra geometry.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p className="text-zinc-400 leading-relaxed text-base">
                            The <Pill>{'<Environment preset="dawn">'}</Pill> from drei loads an HDR image (from pmnd.rs assets CDN) and uses it for ambient/reflective lighting.
                            <Pill>background blur={0.5}</Pill> renders it as a blurred backdrop.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.15}>
                        <Callout variant="tip" title="Fog color = background color">
                            Set your fog color to match your background. Here both are the dawn HDR&apos;s ambient tint (#a79 — a warm mauve). When they match, objects don&apos;t &quot;pop in&quot;
                            against a different color; they smoothly dissolve.
                        </Callout>
                    </FadeIn>
                </div>
                <FadeIn delay={0.1}>
                    <div className="space-y-4">
                        <FogDemo />
                        <CodeBlock lang="tsx">{`// Fog is placed on scene via attach prop
<fog attach="fog" args={['#a79', 8.5, 12]} />
//               color ─^    ^near  ^far

// Environment: HDR image for lighting + background
<Environment
  preset="dawn"   // or: sunset, city, night, ...
  background      // render as background
  blur={0.5}      // blur the HDR in background
/>`}</CodeBlock>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

function PerformanceSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-16">
            <SectionNum n="09" />
            <FadeIn>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Tag variant="green">Performance</Tag>
                    <h2 className="text-3xl md:text-4xl font-black text-white">Staying Fast</h2>
                </div>
            </FadeIn>

            <FadeIn delay={0.05}>
                <p className="text-zinc-400 leading-relaxed text-base mb-8 max-w-2xl">
                    A 3D scene that chugs at 30fps destroys the experience. These are the patterns baked into the carousel that keep it smooth at 60–120fps even on mobile.
                </p>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
                {[
                    {
                        title: 'ssr: false on dynamic import',
                        desc: 'Three.js needs window/WebGL — it cannot run on the server. Always dynamic import canvas components with { ssr: false }. This also prevents hydration mismatches.',
                        code: `const Scene = dynamic(
  () => import('./Scene'),
  { ssr: false }  // ← required for WebGL
)`,
                    },
                    {
                        title: 'No allocations in useFrame',
                        desc: 'useFrame fires every render — potentially 120× per second. Never create new objects inside it. Use refs and mutate in place. Creating a new Vector3 each frame causes GC pressure.',
                        code: `// ✗ Bad: allocates every frame
useFrame(() => {
  ref.current.position.copy(new THREE.Vector3(1, 0, 0))
})

// ✓ Good: mutate in place
useFrame(() => {
  ref.current.position.x = 1
})`,
                    },
                    {
                        title: 'events.update() once per frame',
                        desc: "Raycasting is expensive. By calling state.events.update() inside the Rig's useFrame, we run one raycast per rendered frame — not per pointer-move event. This is crucial when the scene is animating.",
                        code: `useFrame((state) => {
  ref.current.rotation.y = -scroll.offset * PI2
  state.events.update()  // ← 1 raycast per frame
})`,
                    },
                    {
                        title: 'Damp over springs for 3D',
                        desc: 'Spring-based animations (framer-motion springs) run in JavaScript. Per-frame damp with THREE.MathUtils.damp is a single math operation per property — near-zero overhead and perfectly GPU-synced.',
                        code: `// Spring (JS overhead, can desync):
useSpring({ scale: hovered ? 1.15 : 1 })

// Damp (1 multiply per frame, GPU-synced):
useFrame((_, delta) => {
  ref.current.scale.x = MathUtils.damp(
    ref.current.scale.x, target, lambda, delta
  )
})`,
                    },
                ].map((item, i) => (
                    <FadeIn key={item.title} delay={i * 0.05}>
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 h-full flex flex-col gap-3">
                            <p className="text-zinc-200 font-semibold text-sm">{item.title}</p>
                            <p className="text-zinc-400 text-xs leading-relaxed flex-1">{item.desc}</p>
                            <CodeBlock lang="tsx">{item.code}</CodeBlock>
                        </div>
                    </FadeIn>
                ))}
            </div>

            <FadeIn delay={0.25}>
                <Callout variant="perf" title="dpr={[1, 2]} on Canvas">
                    Set device pixel ratio between 1 and 2. At 2×, a 1440p screen renders 8.3M pixels per frame. With <code className="text-xs">dpr={`{[1, 2]}`}</code> R3F caps it — retina looks sharp
                    but you don&apos;t melt mid-range GPUs. Omitting this is one of the most common performance mistakes.
                </Callout>
            </FadeIn>
        </section>
    );
}

function ChecklistSection() {
    const items = [
        { done: true, text: 'Dynamic import Scene with { ssr: false }' },
        { done: true, text: 'Set dpr={[1, 2]} on Canvas' },
        { done: true, text: 'Narrow FOV (10–20°) for editorial look' },
        { done: true, text: 'Position items with sin/cos on unit circle' },
        { done: true, text: 'Wrap carousel in <ScrollControls pages infinite>' },
        { done: true, text: 'Call state.events.update() in useFrame for live raycasting' },
        { done: true, text: 'Use THREE.MathUtils.damp — pass delta for framerate independence' },
        { done: true, text: 'stopPropagation on pointerOver to prevent event bubbling' },
        { done: true, text: 'Extend PlaneGeometry to curve vertices via BentPlaneGeometry' },
        { done: true, text: 'Use onBeforeCompile to inject vertex shader code without rewriting' },
        { done: true, text: 'Drive shader uniforms from useFrame (time, offset)' },
        { done: true, text: 'Add fog with color matching HDR background tint' },
        { done: true, text: 'Environment preset for free ambient/reflective lighting' },
        { done: true, text: 'DoubleSide on cards that rotate to show their backs' },
        { done: true, text: 'No new objects created inside useFrame (use refs, mutate in place)' },
    ];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex flex-wrap items-center gap-3 mb-8">
                    <Tag variant="green">Checklist</Tag>
                    <h2 className="text-3xl md:text-4xl font-black text-white">Build Checklist</h2>
                </div>
            </FadeIn>
            <div className="grid md:grid-cols-2 gap-2 mb-10">
                {items.map((item, i) => (
                    <FadeIn key={i} delay={i * 0.03}>
                        <div className="flex items-start gap-3 py-2.5 px-4 rounded-xl hover:bg-zinc-900/50 transition-colors">
                            <span className="mt-0.5 shrink-0 size-4 rounded-sm bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                    <path d="M1 3.5L3.5 6L8 1" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </span>
                            <span className="text-zinc-300 text-sm leading-relaxed">{item.text}</span>
                        </div>
                    </FadeIn>
                ))}
            </div>

            <FadeIn delay={0.4}>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div>
                        <p className="text-amber-400 font-semibold mb-1">See it live</p>
                        <p className="text-zinc-400 text-sm">All these techniques combined in the interactive carousel.</p>
                    </div>
                    <Link href="/r3f-cards" className="shrink-0 px-6 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors">
                        Open the demo →
                    </Link>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function R3fCardsLearnPage() {
    return (
        <main className="min-h-screen bg-[#080810] text-white overflow-x-hidden">
            <div className="absolute inset-0 pointer-events-none" style={NOISE_BG} />
            <div className="max-w-[1080px] mx-auto relative">
                <HeroSection />
                <SectionRule />
                <FoundationSection />
                <SectionRule />
                <CircularLayoutSection />
                <SectionRule />
                <ScrollDrivenSection />
                <SectionRule />
                <DampingSection />
                <SectionRule />
                <HoverCardSection />
                <SectionRule />
                <BentGeometrySection />
                <SectionRule />
                <VertexShaderSection />
                <SectionRule />
                <FogEnvironmentSection />
                <SectionRule />
                <PerformanceSection />
                <SectionRule />
                <ChecklistSection />
            </div>
            <footer className="border-t border-zinc-800/60 mt-16 py-10 text-center">
                <p className="text-zinc-600 font-mono text-xs">
                    Original experiment by{' '}
                    <a href="https://cydstumpel.nl/" className="text-zinc-500 hover:text-zinc-300 underline transition-colors" target="_blank" rel="noopener noreferrer">
                        cydstumpel.nl
                    </a>{' '}
                    · Guide by thesang.dev
                </p>
            </footer>
        </main>
    );
}

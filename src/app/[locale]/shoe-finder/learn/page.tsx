'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { AnimatePresence, motion } from 'framer-motion';
import gsapLib from 'gsap';

import { CodeBlock } from '@/components/code-block';
import { FadeIn, NOISE_BG } from '@/components/fade-in';

gsapLib.registerPlugin(useGSAP);

// ─── Primitives ───────────────────────────────────────────────────────────────

function Tag({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono tracking-wider uppercase border bg-orange-500/10 text-orange-400 border-orange-500/20" style={{ fontSize: '10px' }}>
            {children}
        </span>
    );
}

function StepBadge({ n }: { n: number }) {
    return (
        <span
            className="inline-flex items-center justify-center size-7 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 font-black font-mono shrink-0"
            style={{ fontSize: '12px' }}
        >
            {n}
        </span>
    );
}

function Pill({ children }: { children: React.ReactNode }) {
    return (
        <code className="inline-block bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 font-mono rounded px-1.5 py-0.5" style={{ fontSize: '12px' }}>
            {children}
        </code>
    );
}

function SectionRule() {
    return <div className="my-20 h-px bg-gradient-to-r from-orange-500/20 via-orange-500/5 to-transparent" />;
}

function Callout({ children, variant = 'tip' }: { children: React.ReactNode; variant?: 'tip' | 'info' | 'warn' }) {
    const styles = {
        tip: 'bg-orange-500/5 border-orange-500/20 text-orange-200/90',
        info: 'bg-sky-500/5 border-sky-500/20 text-sky-200/90',
        warn: 'bg-red-500/5 border-red-500/20 text-red-200/90',
    };
    const icons = { tip: '💡', info: 'ℹ️', warn: '⚠️' };
    return (
        <div className={`border rounded-xl px-4 py-3 leading-relaxed flex gap-2.5 ${styles[variant]}`} style={{ fontSize: '13px' }}>
            <span className="shrink-0 mt-0.5">{icons[variant]}</span>
            <span>{children}</span>
        </div>
    );
}

function DemoShell({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-800/60 flex items-center gap-2">
                <div className="flex gap-1.5">
                    {['bg-red-500/60', 'bg-yellow-500/60', 'bg-green-500/60'].map((c) => (
                        <div key={c} className={`size-2.5 rounded-full ${c}`} />
                    ))}
                </div>
                <span className="text-zinc-500 font-mono ml-1" style={{ fontSize: '11px' }}>
                    {title}
                </span>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

// ─── Demo 1: Dynamic Island ───────────────────────────────────────────────────

type IslandState = 'browse' | 'zoomed' | 'selected';

const islandSpring = { type: 'spring' as const, stiffness: 500, damping: 30, mass: 1 };

function DynamicIslandDemo() {
    const [mode, setMode] = useState<IslandState>('browse');
    const tabs = ['Nike', 'NB', '$150'];

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Island */}
            <div className="flex items-center justify-center" style={{ minHeight: 80 }}>
                <motion.div
                    layout
                    transition={islandSpring}
                    style={{
                        background: 'linear-gradient(135deg,rgba(255,240,235,0.35) 0%,rgba(255,255,255,0.25) 50%,rgba(245,235,255,0.35) 100%)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: 32,
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.3)',
                        padding: 6,
                        display: 'flex',
                        alignItems: 'center',
                        height: 52,
                        overflow: 'hidden',
                    }}
                >
                    <AnimatePresence mode="popLayout" initial={false}>
                        {mode === 'selected' ? (
                            <motion.button
                                key="buy"
                                initial={{ opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
                                transition={{ ...islandSpring, opacity: { duration: 0.18 } }}
                                style={{
                                    background: '#000',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 22,
                                    padding: '0 22px',
                                    height: 40,
                                    fontSize: 13,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                Buy Now
                            </motion.button>
                        ) : mode === 'zoomed' ? (
                            <motion.div
                                key="zoom-out"
                                initial={{ opacity: 0, scale: 0.5, filter: 'blur(4px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 0.5, filter: 'blur(4px)' }}
                                transition={{ ...islandSpring, opacity: { duration: 0.18 } }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', color: '#111' }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="browse"
                                initial={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                                transition={{ ...islandSpring, opacity: { duration: 0.18 } }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', color: '#111' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                </div>
                                <div style={{ width: 1, height: 22, background: 'rgba(0,0,0,0.1)' }} />
                                <div style={{ display: 'flex', gap: 2 }}>
                                    {tabs.map((t) => (
                                        <motion.div key={t} layout style={{ padding: '6px 12px', borderRadius: 18, fontSize: 12, fontWeight: 600, color: '#444', whiteSpace: 'nowrap' }}>
                                            {t}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* State buttons */}
            <div className="flex gap-2 flex-wrap justify-center">
                {(['browse', 'zoomed', 'selected'] as IslandState[]).map((s) => (
                    <button
                        key={s}
                        onClick={() => setMode(s)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${mode === s ? 'bg-orange-500/20 border-orange-500/40 text-orange-300' : 'bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:text-zinc-200'}`}
                    >
                        {s}
                    </button>
                ))}
            </div>
            <p className="text-zinc-500 font-mono text-center" style={{ fontSize: '11px' }}>
                {'Click states to see the island morph'}
            </p>
        </div>
    );
}

// ─── Demo 2: Stagger Grid ─────────────────────────────────────────────────────

function StaggerGridDemo() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useGSAP(
        () => {
            const dots = containerRef.current?.querySelectorAll<HTMLElement>('[data-dot]');
            if (!dots) return;
            gsapLib.set(dots, { opacity: 0, y: 20, scale: 0.5 });
        },
        { scope: containerRef },
    );

    const play = (entering: boolean) => {
        const dots = containerRef.current?.querySelectorAll<HTMLElement>('[data-dot]');
        if (!dots) return;
        setVisible(entering);
        dots.forEach((dot, _i) => {
            const delay = Math.random() * 0.4;
            if (entering) {
                gsapLib.to(dot, { opacity: 1, y: 0, scale: 1, duration: 0.5, delay, ease: 'expo.out' });
            } else {
                gsapLib.to(dot, { opacity: 0, y: -15, scale: 0.5, duration: 0.25, delay: delay * 0.5, ease: 'expo.in' });
            }
        });
    };

    return (
        <div className="flex flex-col items-center gap-5">
            <div ref={containerRef} className="grid gap-2" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
                {Array.from({ length: 32 }).map((_, i) => (
                    <div key={i} data-dot className="rounded-sm bg-orange-400/70" style={{ width: 28, height: 36 }} />
                ))}
            </div>
            <div className="flex gap-3">
                <button
                    onClick={() => play(true)}
                    className="px-4 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-mono hover:bg-orange-500/30 transition-colors"
                >
                    Enter
                </button>
                <button onClick={() => play(false)} className="px-4 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 text-xs font-mono hover:text-zinc-200 transition-colors">
                    Exit
                </button>
            </div>
            <p className="text-zinc-500 font-mono text-center" style={{ fontSize: '11px' }}>
                {visible ? 'Each tile has a random delay (0–400ms)' : 'Click Enter to see staggered animation'}
            </p>
        </div>
    );
}

// ─── Demo 3: Curvature ────────────────────────────────────────────────────────

function CurvatureDemo() {
    const [strength, setStrength] = useState(0.5);
    const COLS = 7;
    const ROWS = 4;
    const tiles = Array.from({ length: COLS * ROWS });

    return (
        <div className="flex flex-col items-center gap-5">
            <div style={{ perspective: 600 }}>
                <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COLS},1fr)`, transformStyle: 'preserve-3d' }}>
                    {tiles.map((_, i) => {
                        const col = i % COLS;
                        const row = Math.floor(i / COLS);
                        const cx = col - (COLS - 1) / 2;
                        const cy = row - (ROWS - 1) / 2;
                        const distSq = cx * cx + cy * cy;
                        const tz = -distSq * strength * 8;
                        return (
                            <div
                                key={i}
                                className="rounded-sm bg-orange-400/60 border border-orange-400/20"
                                style={{ width: 34, height: 42, transform: `translateZ(${tz}px)`, transition: 'transform 0.4s ease' }}
                            />
                        );
                    })}
                </div>
            </div>
            <div className="flex items-center gap-3 w-full max-w-xs">
                <span className="text-zinc-500 font-mono shrink-0" style={{ fontSize: '11px' }}>
                    curve
                </span>
                <input type="range" min={0} max={1} step={0.01} value={strength} onChange={(e) => setStrength(parseFloat(e.target.value))} className="flex-1 accent-orange-500" />
                <span className="text-orange-400 font-mono shrink-0" style={{ fontSize: '11px' }}>
                    {strength.toFixed(2)}
                </span>
            </div>
        </div>
    );
}

// ─── Demo 4: Drag Bounds ──────────────────────────────────────────────────────

function DragBoundsDemo() {
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
    const BOUND = 80;
    const RESIST = 0.25;

    useEffect(() => {
        const onMove = (e: PointerEvent) => {
            const d = dragRef.current;
            if (!d.active) return;
            const dx = e.clientX - d.startX;
            const dy = e.clientY - d.startY;
            let nx = d.originX + dx;
            let ny = d.originY + dy;
            if (nx > BOUND) nx = BOUND + (nx - BOUND) * RESIST;
            if (nx < -BOUND) nx = -BOUND + (nx + BOUND) * RESIST;
            if (ny > BOUND) ny = BOUND + (ny - BOUND) * RESIST;
            if (ny < -BOUND) ny = -BOUND + (ny + BOUND) * RESIST;
            setPos({ x: nx, y: ny });
        };
        const onUp = () => {
            if (!dragRef.current.active) return;
            dragRef.current.active = false;
            setIsDragging(false);
            setPos({ x: 0, y: 0 });
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
    }, []);

    const onDown = (e: React.PointerEvent) => {
        dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y };
        setIsDragging(true);
    };

    const isOverBound = Math.abs(pos.x) > BOUND || Math.abs(pos.y) > BOUND;

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative rounded-xl border border-zinc-700/50 bg-zinc-900/40 flex items-center justify-center overflow-hidden" style={{ width: 260, height: 180 }}>
                {/* Bounds indicator */}
                <div className="absolute border border-orange-500/20 rounded-lg pointer-events-none" style={{ width: BOUND * 2, height: BOUND * 2 }} />
                {/* Draggable tile */}
                <div
                    onPointerDown={onDown}
                    className={`absolute rounded-lg cursor-grab active:cursor-grabbing select-none flex items-center justify-center font-mono font-bold border transition-colors ${isOverBound ? 'bg-orange-500/30 border-orange-500/50 text-orange-300' : 'bg-orange-400/20 border-orange-400/30 text-orange-400'}`}
                    style={{
                        width: 56,
                        height: 68,
                        transform: `translate(${pos.x}px,${pos.y}px)`,
                        transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)',
                        fontSize: 11,
                    }}
                >
                    {isOverBound ? 'resist' : 'drag'}
                </div>
            </div>
            <p className="text-zinc-500 font-mono text-center" style={{ fontSize: '11px' }}>
                {'Drag past the orange boundary to feel resistance. Release to snap back.'}
            </p>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShoeFinderLearnPage() {
    return (
        <div className={`${NOISE_BG} min-h-screen text-white`}>
            <FadeIn className="max-w-3xl mx-auto px-6 py-20 space-y-6">
                <Link href="/shoe-finder" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors font-mono" style={{ fontSize: '13px' }}>
                    {'← shoe-finder'}
                </Link>

                <div>
                    <h1 className="text-3xl font-black tracking-tight">Shoe Finder — Techniques</h1>
                    <p className="text-zinc-400 mt-2" style={{ fontSize: '15px' }}>
                        A breakdown of the Dynamic Island filter bar, the 3D grid, shader materials, stagger animations, camera physics, and performance optimisations.
                    </p>
                </div>

                <SectionRule />

                {/* Step 1 ── Dynamic Island */}
                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <StepBadge n={1} />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Tag>UI / Animation</Tag>
                            </div>
                            <h2 className="text-xl font-bold">Dynamic Island — layout morphing</h2>
                        </div>
                    </div>
                    <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                        The control bar is a single <Pill>motion.div</Pill> with the <Pill>layout</Pill> prop. Framer Motion measures its size before and after a state change and automatically
                        interpolates the width, height, and border-radius between them — no explicit size management needed.
                        <br />
                        <br />
                        {'Inside, '}
                        <Pill>{'AnimatePresence mode="popLayout"'}</Pill>
                        {' lets the exiting child'} <em>pop</em> out of the layout flow so the container instantly knows the new content size, producing a snappy collapse-then-expand rather than a
                        stutter.
                    </p>
                    <CodeBlock lang="tsx">{`<motion.div layout transition={islandSpring} style={{ borderRadius: 32, overflow: 'hidden', height: 56 }}>
  <AnimatePresence mode="popLayout" initial={false}>
    {hasSelection ? (
      <motion.button key="buy"
        initial={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
      >Buy Now</motion.button>
    ) : isZoomedIn ? (
      <motion.div key="compact">...</motion.div>
    ) : (
      <motion.div key="expanded">...</motion.div>
    )}
  </AnimatePresence>
</motion.div>`}</CodeBlock>
                    <Callout variant="tip">
                        The <Pill>key</Pill> prop on each child is what tells AnimatePresence which element is entering and which is exiting. Changing the key triggers the exit animation on the old
                        child and the enter animation on the new one.
                    </Callout>
                    <DemoShell title="dynamic-island.tsx">
                        <DynamicIslandDemo />
                    </DemoShell>
                </div>

                <SectionRule />

                {/* Step 2 ── Spring Config */}
                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <StepBadge n={2} />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Tag>Physics</Tag>
                            </div>
                            <h2 className="text-xl font-bold">Spring config — that Apple feel</h2>
                        </div>
                    </div>
                    <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                        The island uses a single reused spring config: <Pill>stiffness 500</Pill> (snappy) and <Pill>damping 30</Pill> (no oscillation). High stiffness creates a near-instant response;
                        moderate damping lands cleanly without bouncing. Applying it to both <Pill>layout</Pill> and child <Pill>initial/animate</Pill> keeps everything in sync.
                    </p>
                    <CodeBlock lang="ts">{`// Single source of truth for all island transitions
const islandSpring = {
  type: 'spring',
  stiffness: 500,   // How fast it responds (higher = snappier)
  damping: 30,      // How quickly it settles (higher = less bounce)
  mass: 1,          // Inertia (lower = lighter/faster)
};

// Same config reused across layout, children, and layoutId
<motion.div layout transition={islandSpring} ... />
<TabButton>  {/* uses layoutId="sf-activeTab" with same spring */}`}</CodeBlock>
                    <Callout variant="info">
                        <Pill>layoutId</Pill> on the active-tab background pill lets it fly between buttons as the collection switches — Framer Motion finds the matching element by ID and animates the
                        position transfer automatically.
                    </Callout>
                </div>

                <SectionRule />

                {/* Step 3 ── Mutable Rig State */}
                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <StepBadge n={3} />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Tag>Architecture</Tag>
                                <Tag>Performance</Tag>
                            </div>
                            <h2 className="text-xl font-bold">Global mutable state — decoupled from React</h2>
                        </div>
                    </div>
                    <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                        Camera position, zoom, drag state, and the active item ID all live in a plain mutable object (<Pill>rigState</Pill>) — not in <Pill>useState</Pill>. React renders the UI at
                        ~16ms, but R3F reads and writes animation values at every frame inside <Pill>useFrame</Pill>. Putting those values in React state would trigger hundreds of re-renders per
                        second and block the GPU loop.
                    </p>
                    <CodeBlock lang="ts">{`// gridState.ts — a plain object, mutated directly by Rig.tsx and ShoeTile.tsx
export const rigState = {
  target:    new THREE.Vector3(0, 2, 0), // Where camera is heading
  current:   new THREE.Vector3(0, 2, 0), // Current interpolated position
  velocity:  new THREE.Vector3(0, 0, 0), // Used for parallax tilt
  zoom:      31,                          // Current camera Z distance
  isDragging: false,
  activeId:  null as number | null,       // Selected shoe index
};

// In Rig.tsx — runs every frame inside useFrame, mutates directly
easing.damp3(rigState.current, rigState.target, 0.2, delta);
easing.damp(camera.position, 'z', rigState.zoom, 0.25, delta);`}</CodeBlock>
                    <Callout variant="tip">
                        React state (<Pill>useState</Pill>) is only used for values the UI needs to re-render for — zoom level polling, active selection flag, collection index. These update every 50ms
                        via <Pill>setInterval</Pill>, bridging the mutable world back to React when the UI needs to change.
                    </Callout>
                </div>

                <SectionRule />

                {/* Step 4 ── Custom Shader Material */}
                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <StepBadge n={4} />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Tag>R3F / Three.js</Tag>
                                <Tag>GLSL</Tag>
                            </div>
                            <h2 className="text-xl font-bold">Custom shader material — shaderMaterial + extend</h2>
                        </div>
                    </div>
                    <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                        {"@react-three/drei's"} <Pill>shaderMaterial</Pill> factory creates a reusable Three.js material class with typed uniforms. Calling{' '}
                        <Pill>extend({'{ HoloCardMaterial }'})</Pill> registers it with R3F so it can be used as a JSX element. The uniform values (<Pill>uOpacity</Pill>, <Pill>uActive</Pill>,{' '}
                        <Pill>uTime</Pill>) are then animated directly via <Pill>easing.damp</Pill> inside <Pill>useFrame</Pill>.
                    </p>
                    <CodeBlock lang="ts">{`import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

const HoloCardMaterial = shaderMaterial(
  { uTime: 0, uTexture: new THREE.Texture(), uOpacity: 1, uActive: 0 },
  vertexShader,
  fragmentShader,
);

extend({ HoloCardMaterial });

// Used in ShoeTile.tsx
<mesh ref={imageRef}>
  <planeGeometry args={[w, h, 16, 16]} />
  <holoCardMaterial transparent uTexture={texture} />
</mesh>`}</CodeBlock>
                    <Callout variant="info">
                        The plane uses <Pill>16x16 segments</Pill> — this gives the vertex shader enough resolution to produce smooth per-vertex deformation (breathing animation). A single quad would
                        only animate the 4 corners.
                    </Callout>
                </div>

                <SectionRule />

                {/* Step 5 ── Holographic Sheen */}
                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <StepBadge n={5} />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Tag>GLSL</Tag>
                            </div>
                            <h2 className="text-xl font-bold">Holographic sheen — diagonal light band</h2>
                        </div>
                    </div>
                    <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                        When a shoe is selected, <Pill>uActive</Pill> is damped from 0 to 1. The fragment shader uses this value to sweep a diagonal light band across the card. The band position is{' '}
                        <Pill>sheenPos = uActive * 2.5</Pill> — as the uniform climbs from 0 to 1, the peak of the band moves from top-left to bottom-right (off screen), then fades via{' '}
                        <Pill>sheenFade</Pill> once the sweep is complete.
                    </p>
                    <CodeBlock lang="glsl">{`// holocard.frag (simplified)
float diagonal  = (vUv.x * 0.8) + vUv.y;  // Diagonal direction
float sheenPos  = uActive * 2.5;            // Sweeps 0 → 2.5 as uActive 0 → 1
float dist      = abs(diagonal - sheenPos);
float intensity = pow(1.0 - smoothstep(0.0, 0.5, dist), 3.0); // Sharp peak

// Fade the sheen out once sweep finishes
float sheenFade = 1.0 - smoothstep(0.7, 1.0, uActive);
vec3 sheen      = vec3(0.85, 0.92, 1.0) * intensity * 0.9 * sheenFade;

gl_FragColor = vec4(baseColor + sheen * texColor.a, texColor.a * uOpacity);`}</CodeBlock>
                    <Callout variant="tip">
                        The vertex shader adds a subtle <em>breathing</em> scale: <Pill>{'sin(uTime * 2.0) * 0.015 * uActive'}</Pill>. The <Pill>uActive</Pill> multiplier means it only breathes when
                        selected — inactive cards are perfectly still.
                    </Callout>
                </div>

                <SectionRule />

                {/* Step 6 ── Time-Sliced Mounting */}
                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <StepBadge n={6} />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Tag>Performance</Tag>
                                <Tag>R3F</Tag>
                            </div>
                            <h2 className="text-xl font-bold">Time-sliced mounting — 5 items per frame</h2>
                        </div>
                    </div>
                    <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                        Mounting 60+ Three.js meshes with textures in a single frame causes a GPU texture-upload spike that freezes the page. <Pill>GridCanvas</Pill> starts with{' '}
                        <Pill>mountedCount = 0</Pill> and increments by 5 inside <Pill>useFrame</Pill>. At 60fps this loads all items in ~200ms — imperceptible to the user, invisible to the GPU.
                    </p>
                    <CodeBlock lang="tsx">{`// GridCanvas.tsx
const [mountedCount, setMountedCount] = useState(
  gridVisible ? 0 : items.length  // Exiting grid renders all immediately
);

useFrame(() => {
  if (mountedCount < mappedItems.length) {
    setMountedCount(prev => Math.min(prev + 5, mappedItems.length));
  }
});

return (
  <>
    {mappedItems.map((item, i) => {
      if (i > mountedCount) return null;  // Gate on mountedCount
      return <ShoeTile key={item.product_url} ... />;
    })}
  </>
);`}</CodeBlock>
                    <Callout variant="warn">
                        Only apply this to <em>entering</em> grids. An exiting grid should render everything immediately — you want all tiles present for the exit animation, not a partially-mounted
                        set fading out.
                    </Callout>
                </div>

                <SectionRule />

                {/* Step 7 ── Stagger Entry/Exit */}
                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <StepBadge n={7} />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Tag>Animation</Tag>
                            </div>
                            <h2 className="text-xl font-bold">Staggered entry / exit — per-tile random delay</h2>
                        </div>
                    </div>
                    <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                        Each tile gets a <Pill>randomDelay</Pill> (0–400ms for enter, 0–300ms for exit) assigned at grid-build time. Inside <Pill>useFrame</Pill>, the tile checks{' '}
                        <Pill>Date.now() - transitionStartTime {'>'} staggerDelay</Pill> to decide whether to start animating. Before its delay fires, it holds its start position (Z = -50 for enter, Z
                        = 0 for exit), then smoothly damps to the target.
                    </p>
                    <CodeBlock lang="tsx">{`// ShoeTile.tsx — inside useFrame
const canTransition = Date.now() - transitionStartTime > (data.randomDelay ?? 0);

if (gridVisible) {
  // ENTERING: wait for delay, then fly in from Z=-50
  targetZ       = canTransition ? 0    : CONFIG.enterStartZ;  // -50
  targetOpacity = canTransition ? 1    : 0;
  targetY       = canTransition ? 0    : normalizedY * CONFIG.enterSpreadY;
} else {
  // EXITING: wait for delay, then fly out to Z=+20
  targetZ       = canTransition ? CONFIG.exitEndZ : 0;        // +20
  targetOpacity = canTransition ? 0    : 1;
  targetY       = canTransition ? normalizedY * 0.5 : 0;
}

// All targets are reached via maath smooth-damp, not instant
easing.damp(transitionZ, 'current', targetZ, CONFIG.transitionZDamp, delta);`}</CodeBlock>
                    <DemoShell title="stagger-demo.tsx">
                        <StaggerGridDemo />
                    </DemoShell>
                </div>

                <SectionRule />

                {/* Step 8 ── Layer Stack */}
                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <StepBadge n={8} />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Tag>Architecture</Tag>
                                <Tag>Animation</Tag>
                            </div>
                            <h2 className="text-xl font-bold">Grid layer stack — simultaneous enter + exit</h2>
                        </div>
                    </div>
                    <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                        Switching collections (Nike → New Balance) needs the old grid to fly out while the new one flies in. A single array of items cannot do both at once — instead,{' '}
                        <Pill>gridLayers</Pill> is an array where each layer is rendered as its own <Pill>GridCanvas</Pill>. When switching, the existing layer is marked <Pill>mode: exit</Pill> and a
                        new layer is pushed as <Pill>mode: enter</Pill>. Both render simultaneously inside the Canvas. After 700ms the exited layer is removed.
                    </p>
                    <CodeBlock lang="tsx">{`// ShoeGrid.tsx — switching collection
const handleCollectionSwitch = (index: number) => {
  const now = Date.now();

  setGridLayers(prev => {
    const exiting = prev.map(layer =>
      layer.mode === 'enter'
        ? { ...layer, mode: 'exit' as const, startTime: now }
        : layer
    );
    return [...exiting, { id: \`grid-\${index}-\${now}\`, items: collectionsData[index], mode: 'enter', startTime: now }];
  });

  // Cleanup exited layer after transitions complete
  setTimeout(() => setGridLayers(prev => prev.filter(l => l.mode === 'enter')), 700);
};

// In JSX — both layers render at the same time
{gridLayers.map(layer => (
  <GridCanvas key={layer.id} gridVisible={layer.mode === 'enter'} items={layer.items} ... />
))}`}</CodeBlock>
                    <Callout variant="tip">
                        The <Pill>key</Pill> prop on <Pill>GridCanvas</Pill> is essential — React treats layers with different keys as entirely separate component trees, each with their own{' '}
                        <Pill>mountedCount</Pill> state and <Pill>useFrame</Pill> loop.
                    </Callout>
                </div>

                <SectionRule />

                {/* Step 9 ── Camera Drag Physics */}
                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <StepBadge n={9} />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Tag>Physics</Tag>
                                <Tag>Interaction</Tag>
                            </div>
                            <h2 className="text-xl font-bold">Camera drag — bounds, resistance, and tilt</h2>
                        </div>
                    </div>
                    <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                        Drag events update <Pill>rigState.target</Pill> directly. When the target exceeds the visible grid bounds, a resistance factor (<Pill>0.25</Pill>) reduces further movement —
                        like a rubber-band. On pointer-up, the target snaps back to the nearest valid position. A parallax tilt is computed from <Pill>rigState.velocity</Pill> and applied to{' '}
                        <Pill>camera.rotation</Pill> via smooth-damp.
                    </p>
                    <CodeBlock lang="tsx">{`// Rig.tsx — drag handler
const sensitivity = (visibleHeight / window.innerHeight) * CONFIG.dragSpeed;
let rawX = initialRigX + dx * sensitivity;

// Rubber-band past bounds
if (rawX > bx) rawX = bx + (rawX - bx) * 0.25;
if (rawX < -bx) rawX = -bx + (rawX + bx) * 0.25;

rigState.target.set(rawX, rawY, 0);

// useFrame — tilt based on velocity (parallax feel)
rigState.velocity.copy(rigState.current).sub(prevPos.current);
const tiltX =  rigState.velocity.y * CONFIG.tiltFactor;
const tiltY = -rigState.velocity.x * CONFIG.tiltFactor;
easing.damp(camera.rotation, 'x', tiltX, 0.2, delta);
easing.damp(camera.rotation, 'y', tiltY, 0.2, delta);`}</CodeBlock>
                    <DemoShell title="drag-bounds.tsx">
                        <DragBoundsDemo />
                    </DemoShell>
                </div>

                <SectionRule />

                {/* Step 10 ── Curvature + Culling */}
                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <StepBadge n={10} />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Tag>Performance</Tag>
                                <Tag>3D Effect</Tag>
                            </div>
                            <h2 className="text-xl font-bold">Curvature + culling — bowl effect and sleep mode</h2>
                        </div>
                    </div>
                    <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                        Tiles farther from the grid centre are pushed back along Z proportional to <Pill>distSq * curvatureStrength</Pill>, creating a subtle bowl. The strength is gated by{' '}
                        <Pill>zoomRatio</Pill> (cubic ease-in-out) so it only appears when zoomed out. Off-screen tiles are hidden each frame via distance culling. Exiting tiles that have fully faded
                        set <Pill>isSleep.current = true</Pill> — skipping all <Pill>useFrame</Pill> work entirely.
                    </p>
                    <CodeBlock lang="tsx">{`// ShoeTile.tsx — inside useFrame
const zoomRatio = THREE.MathUtils.clamp(
  (rigState.zoom - CONFIG.zoomIn) / (zoomOut - CONFIG.zoomIn), 0, 1
);
const smoothRatio = cubicInOut(zoomRatio);
const targetCurveZ = -distSq * 0.06 * smoothRatio;  // bowl effect

// Distance culling — skip rasterising off-screen tiles
const cullDist = CONFIG.cullDistance * (rigState.zoom / 8);
if (Math.abs(x) > cullDist || Math.abs(y) > cullDist) {
  ref.current.visible = false;
  return;
}

// Sleep mode — exited + invisible tiles stop running useFrame entirely
if (!gridVisible && targetOpacity < 0.01 && filterOpacity.current < 0.01) {
  ref.current.visible = false;
  isSleep.current = true;  // useFrame check at top: if (isSleep.current) return;
  return;
}`}</CodeBlock>
                    <DemoShell title="curvature.tsx">
                        <CurvatureDemo />
                    </DemoShell>
                    <Callout variant="tip">
                        The sleep mode check is the first line in <Pill>useFrame</Pill>. Once a tile sleeps, it never runs any animation code again until a new grid layer mounts with a fresh instance.
                        For a 144-shoe grid with 60+ off-screen tiles, this saves significant CPU time per frame.
                    </Callout>
                </div>

                <SectionRule />

                {/* Summary */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Summary</h2>
                    <div className="grid gap-2" style={{ fontSize: '13px' }}>
                        {[
                            ['Dynamic Island', 'motion.div layout + AnimatePresence popLayout + layoutId'],
                            ['Spring feel', 'stiffness 500, damping 30 — snappy with no bounce'],
                            ['Mutable rig state', 'plain object outside React, polled by UI every 50ms'],
                            ['Shader material', 'shaderMaterial() + extend() + ThreeElements declaration'],
                            ['Holographic sheen', 'diagonal band sweep driven by uActive uniform (0 → 1)'],
                            ['Time-sliced mount', '5 tiles per useFrame — prevents GPU texture-upload spike'],
                            ['Stagger enter/exit', 'randomDelay per tile, checked against Date.now() in useFrame'],
                            ['Layer stack', 'two simultaneous GridCanvas trees: one entering, one exiting'],
                            ['Drag physics', 'rubber-band resistance, snap-on-release, velocity tilt'],
                            ['Culling + sleep', 'distance cull each frame; isSleep skips useFrame entirely'],
                        ].map(([technique, detail]) => (
                            <div key={technique} className="flex gap-3 items-start rounded-xl bg-zinc-900/40 border border-zinc-800/50 px-4 py-3">
                                <span className="text-orange-400 font-mono font-semibold shrink-0" style={{ minWidth: 160 }}>
                                    {technique}
                                </span>
                                <span className="text-zinc-400">{detail}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </FadeIn>
        </div>
    );
}

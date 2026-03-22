'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';

import { CodeBlock } from '@/components/code-block';
import { E_OUT, FadeIn, NOISE_BG } from '@/components/fade-in';

const MiniScene = dynamic(() => import('@/modules/pages/R3fBulge/MiniScene'), { ssr: false });

// ─── shared primitives ────────────────────────────────────────────────────────

function Tag({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono tracking-wider uppercase border bg-violet-500/10 text-violet-400 border-violet-500/20" style={{ fontSize: '10px' }}>
            {children}
        </span>
    );
}

function StepBadge({ n }: { n: number }) {
    return (
        <span
            className="inline-flex items-center justify-center size-7 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-400 font-black font-mono shrink-0"
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

function Slider({ label, value, min, max, step = 0.01, onChange, unit = '' }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string }) {
    return (
        <label className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
                <span className="text-zinc-400 font-mono" style={{ fontSize: '11px' }}>
                    {label}
                </span>
                <span className="text-violet-300 font-mono font-bold" style={{ fontSize: '11px' }}>
                    {value.toFixed(step < 1 ? 2 : 0)}
                    {unit}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-1 appearance-none rounded-full bg-zinc-700 accent-violet-500 cursor-pointer"
            />
        </label>
    );
}

function ControlPanel({ children, title }: { children: React.ReactNode; title: string }) {
    return (
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-zinc-500 font-mono uppercase tracking-widest" style={{ fontSize: '9px' }}>
                {title}
            </p>
            {children}
        </div>
    );
}

function SectionRule() {
    return <div className="my-20 h-px bg-gradient-to-r from-violet-500/20 via-violet-500/5 to-transparent" />;
}

// ─── canvas visualizers ───────────────────────────────────────────────────────

/** Shows a grid of dots representing plane segments */
function SegmentViz({ segments }: { segments: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        const W = canvas.width;
        const H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        const cols = segments + 1;
        const rows = segments + 1;
        const dotR = Math.max(1, Math.min(3, 120 / segments));

        // grid lines
        ctx.strokeStyle = 'rgba(139,92,246,0.15)';
        ctx.lineWidth = 0.5;
        for (let c = 0; c < cols; c++) {
            const x = (c / segments) * W;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
        }
        for (let r = 0; r < rows; r++) {
            const y = (r / segments) * H;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        // vertices
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                const x = (c / segments) * W;
                const y = (r / segments) * H;
                ctx.beginPath();
                ctx.arc(x, y, dotR, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(167,139,250,0.7)';
                ctx.fill();
            }
        }
    }, [segments]);

    return <canvas ref={canvasRef} width={280} height={180} className="w-full rounded-lg" />;
}

/** Visualizes the circle SDF heatmap */
function CircleSDFViz({ radius }: { radius: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        const W = canvas.width;
        const H = canvas.height;
        const imageData = ctx.createImageData(W, H);

        const cx = 0.5;
        const cy = 0.5;

        for (let py = 0; py < H; py++) {
            for (let px = 0; px < W; px++) {
                const uvx = px / W;
                const uvy = py / H;
                const dist = Math.sqrt((uvx - cx) ** 2 + (uvy - cy) ** 2);
                // smoothstep
                const t = Math.max(0, Math.min(1, dist / radius));
                const smooth = t * t * (3 - 2 * t);
                const value = 1 - smooth; // 1 at center, 0 at edge

                const i = (py * W + px) * 4;
                // violet gradient: dark bg → bright center
                imageData.data[i + 0] = Math.round(value * 167); // R
                imageData.data[i + 1] = Math.round(value * 50); // G
                imageData.data[i + 2] = Math.round(value * 220); // B
                imageData.data[i + 3] = Math.round(40 + value * 215); // A
            }
        }
        ctx.putImageData(imageData, 0, 0);

        // circle ring at exact radius
        ctx.beginPath();
        ctx.arc(W * cx, H * cy, radius * W, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(167,139,250,0.8)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // center dot
        ctx.beginPath();
        ctx.arc(W * cx, H * cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(221,214,254,1)';
        ctx.fill();

        // labels
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(167,139,250,0.9)';
        ctx.fillText(`radius: ${radius.toFixed(2)}`, 8, 16);
    }, [radius]);

    return <canvas ref={canvasRef} width={280} height={200} className="w-full rounded-lg bg-zinc-950/80" />;
}

/** Visualizes lerp speed: dot chases target */
function LerpViz({ speed }: { speed: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const stateRef = useRef({ current: 0.1, target: 0.9 });
    const trail = useRef<number[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        const W = canvas.width;
        const H = canvas.height;

        const draw = () => {
            const s = stateRef.current;
            s.current += (s.target - s.current) * speed;

            // auto-bounce
            if (Math.abs(s.current - s.target) < 0.005) {
                s.target = s.target > 0.5 ? 0.1 : 0.9;
            }

            trail.current.push(s.current);
            if (trail.current.length > 80) trail.current.shift();

            ctx.clearRect(0, 0, W, H);

            // track line
            ctx.beginPath();
            ctx.moveTo(20, H / 2);
            ctx.lineTo(W - 20, H / 2);
            ctx.strokeStyle = 'rgba(63,63,70,0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // target dot
            const tx = 20 + s.target * (W - 40);
            ctx.beginPath();
            ctx.arc(tx, H / 2, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(167,139,250,0.3)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(167,139,250,0.7)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // trail
            for (let i = 0; i < trail.current.length; i++) {
                const x = 20 + trail.current[i] * (W - 40);
                const alpha = (i / trail.current.length) * 0.4;
                ctx.beginPath();
                ctx.arc(x, H / 2, 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(167,139,250,${alpha})`;
                ctx.fill();
            }

            // current dot
            const cx = 20 + s.current * (W - 40);
            ctx.beginPath();
            ctx.arc(cx, H / 2, 7, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(221,214,254,1)';
            ctx.fill();

            // label
            ctx.font = '10px monospace';
            ctx.fillStyle = 'rgba(167,139,250,0.8)';
            ctx.fillText(`lerp speed: ${speed.toFixed(2)}`, 8, 16);

            animRef.current = requestAnimationFrame(draw);
        };
        animRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animRef.current);
    }, [speed]);

    return <canvas ref={canvasRef} width={280} height={80} className="w-full rounded-lg bg-zinc-950/80" />;
}

// ─── mini R3F scene wrapper ───────────────────────────────────────────────────

function MiniCanvas({ children, height = 280 }: { children: React.ReactNode; height?: number }) {
    return (
        <div className="relative rounded-xl overflow-hidden border border-zinc-800/80 bg-zinc-950" style={{ height }}>
            <Canvas dpr={[1, 2]} gl={{ antialias: true, preserveDrawingBuffer: true }} camera={{ fov: 55, near: 0.1, far: 200 }}>
                {children}
            </Canvas>
            <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/5" />
        </div>
    );
}

// ─── sections ─────────────────────────────────────────────────────────────────

function HeroSection() {
    return (
        <section className="relative min-h-[60vh] flex flex-col justify-center px-6 md:px-12 xl:px-24 pt-32 pb-16">
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: E_OUT, delay: 0.1 }}
                className="font-mono tracking-[0.22em] uppercase text-violet-400/70 mb-5"
                style={{ fontSize: '11px' }}
            >
                Breakdown · Step by Step · Interactive
            </motion.p>

            <h1 className="font-black leading-[0.9] tracking-tight mb-6" style={{ fontSize: 'clamp(42px, 7vw, 100px)' }}>
                {['How the', 'Bulge', 'Effect Works'].map((word, i) => (
                    <motion.span
                        key={word}
                        className={`block ${i === 1 ? 'text-violet-400' : 'text-white'}`}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.65, ease: E_OUT, delay: 0.2 + i * 0.1 }}
                    >
                        {word}
                    </motion.span>
                ))}
            </h1>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease: E_OUT, delay: 0.6 }}
                className="text-zinc-400 max-w-xl leading-relaxed"
                style={{ fontSize: '17px' }}
            >
                A practical guide for design engineers. Five techniques that compose into one fluid, mouse-driven 3D text deformation — no prior WebGL experience needed.
            </motion.p>

            <motion.div className="flex flex-wrap gap-2 mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
                {['DOM → Texture', 'Plane Geometry', 'Circle SDF', 'Vertex Shader', 'Mouse Lerp'].map((t) => (
                    <Tag key={t}>{t}</Tag>
                ))}
            </motion.div>

            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.9, ease: E_OUT, delay: 1 }}
                style={{ transformOrigin: 'left' }}
                className="mt-14 h-px bg-gradient-to-r from-violet-500/40 via-violet-500/10 to-transparent"
            />

            <motion.div className="mt-8 flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
                <Link href="/r3f-bulge" className="text-zinc-400 hover:text-white transition-colors text-sm font-mono flex items-center gap-2">
                    ← Back to demo
                </Link>
            </motion.div>
        </section>
    );
}

// ─── Step 1: The Pipeline ─────────────────────────────────────────────────────

function PipelineSection() {
    const steps = [
        { icon: '🖊', label: 'HTML + CSS', sub: 'Your text in the DOM', color: 'from-zinc-800 to-zinc-900' },
        { icon: '→', label: '', sub: '', color: '' },
        { icon: '🖼', label: 'Canvas Bitmap', sub: 'html2canvas snapshot', color: 'from-violet-900/40 to-violet-950/60' },
        { icon: '→', label: '', sub: '', color: '' },
        { icon: '🎨', label: 'GPU Texture', sub: 'THREE.CanvasTexture', color: 'from-violet-800/30 to-violet-900/40' },
        { icon: '→', label: '', sub: '', color: '' },
        { icon: '🌐', label: '3D Plane', sub: 'Deformed mesh + light', color: 'from-indigo-800/30 to-indigo-900/40' },
    ];

    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <StepBadge n={1} />
                    <h2 className="text-2xl font-black tracking-tight">The 5-Step Pipeline</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-10 leading-relaxed" style={{ fontSize: '16px' }}>
                    The entire effect is a data pipeline. Text lives in the browser&apos;s DOM, gets snapshotted as a bitmap, uploaded to the GPU as a texture, and painted onto a high-poly 3D plane
                    that the vertex shader pushes and pulls.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="flex flex-wrap items-center gap-2 mb-12">
                    {steps.map((s, i) =>
                        s.label ? (
                            <div key={i} className={`flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-xl border border-zinc-700/50 bg-gradient-to-b ${s.color} min-w-[110px]`}>
                                <span style={{ fontSize: '22px' }}>{s.icon}</span>
                                <span className="text-white font-bold" style={{ fontSize: '13px' }}>
                                    {s.label}
                                </span>
                                <span className="text-zinc-400 text-center" style={{ fontSize: '10px' }}>
                                    {s.sub}
                                </span>
                            </div>
                        ) : (
                            <span key={i} className="text-zinc-600 font-mono text-lg">
                                →
                            </span>
                        ),
                    )}
                </div>
            </FadeIn>

            <FadeIn delay={0.2}>
                <CodeBlock lang="tsx">
                    {`// 1. Render HTML text off-screen
<div ref={domRef} style={{ fontSize: 'clamp(100px, 17vw, 200px)', ... }}>
  THANH CHINH MAT TRINH
</div>

// 2. Snapshot DOM → canvas bitmap → GPU texture
const canvas = await html2canvas(domRef, { backgroundColor: null });
const texture = new THREE.CanvasTexture(canvas);

// 3. Feed texture to a deformable 3D plane
<mesh>
  <planeGeometry args={[width, height, 254, 254]} />  {/* high-poly */}
  <CustomShaderMaterial
    baseMaterial={THREE.MeshStandardMaterial}
    uniforms={{ uTexture: { value: texture }, uMouse: { value: mouseVec } }}
    vertexShader={bulgeVert}   // ← moves vertices
    fragmentShader={bulgeFrag} // ← applies texture
  />
</mesh>`}
                </CodeBlock>
            </FadeIn>
        </section>
    );
}

// ─── Step 2: Plane Geometry ───────────────────────────────────────────────────

function PlaneSection() {
    const [segments, setSegments] = useState(8);

    const vertexCount = (segments + 1) ** 2;
    const triangleCount = segments ** 2 * 2;

    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <StepBadge n={2} />
                    <h2 className="text-2xl font-black tracking-tight">Plane Geometry — Why Segments Matter</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    A vertex shader can only move <em>vertices</em>. A flat plane with 1×1 segments has just 4 corners — the bulge would look like a sharp pyramid. Crank it to <Pill>254×254</Pill> and
                    you get <strong className="text-white">65,025</strong> vertices — smooth, organic displacement.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-zinc-300 font-bold">Grid Visualizer</p>
                            <div className="flex gap-2">
                                <Tag>segments: {segments}</Tag>
                                <Tag>{vertexCount} verts</Tag>
                            </div>
                        </div>
                        <SegmentViz segments={segments} />
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 flex flex-col gap-4">
                        <p className="text-zinc-300 font-bold">Tweak it</p>
                        <Slider label="segments" value={segments} min={1} max={32} step={1} onChange={setSegments} />
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            {[
                                { label: 'Vertices', value: vertexCount.toLocaleString() },
                                { label: 'Triangles', value: triangleCount.toLocaleString() },
                                { label: 'Smoothness', value: segments < 4 ? 'Blocky' : segments < 16 ? 'OK' : 'Smooth' },
                                { label: 'GPU cost', value: segments < 8 ? 'Very low' : segments < 32 ? 'Low' : 'Medium' },
                            ].map(({ label, value }) => (
                                <div key={label} className="bg-zinc-800/50 rounded-lg p-3">
                                    <p className="text-zinc-500 font-mono mb-1" style={{ fontSize: '10px' }}>
                                        {label}
                                    </p>
                                    <p className="text-violet-300 font-bold font-mono" style={{ fontSize: '14px' }}>
                                        {value}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <p className="text-zinc-500 leading-relaxed" style={{ fontSize: '13px' }}>
                            The production value is <Pill>254</Pill> — the maximum that fits in a single draw call without index buffer overflow (max 16-bit index = 65535).
                        </p>
                    </div>
                </div>
            </FadeIn>

            <FadeIn delay={0.2}>
                <CodeBlock lang="glsl" highlight={['254']}>
                    {`// planeGeometry args: [width, height, widthSegments, heightSegments]
// Each segment = 2 triangles = 6 index values

<planeGeometry args={[width, height, 254, 254]} />
//                                    ^^^  ^^^
//                     65,025 vertices — smooth bulge`}
                </CodeBlock>
            </FadeIn>
        </section>
    );
}

// ─── Step 3: Circle SDF ───────────────────────────────────────────────────────

function CircleSDFSection() {
    const [radius, setRadius] = useState(0.35);

    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <StepBadge n={3} />
                    <h2 className="text-2xl font-black tracking-tight">The Circle SDF — Shaping the Bulge</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    A Signed Distance Function (SDF) gives every pixel a value based on its distance from a point. Combined with <Pill>smoothstep</Pill>, it creates a smooth circular falloff — bright
                    at the cursor, zero at the edges. This scalar value becomes the height of the displacement.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-zinc-300 font-bold">SDF Heatmap</p>
                            <Tag>center = mouse</Tag>
                        </div>
                        <CircleSDFViz radius={radius} />
                        <p className="text-zinc-500 mt-3" style={{ fontSize: '12px' }}>
                            White = full displacement · Black = zero displacement. The dashed ring is where <Pill>smoothstep</Pill> reaches 0.
                        </p>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 flex flex-col gap-4">
                        <p className="text-zinc-300 font-bold">Tweak the radius</p>
                        <Slider label="radius" value={radius} min={0.05} max={0.7} step={0.01} onChange={setRadius} />

                        <div className="bg-zinc-950/60 rounded-xl p-4 border border-zinc-800/60 mt-2">
                            <p className="text-violet-400 font-mono mb-2" style={{ fontSize: '11px' }}>
                                GLSL breakdown
                            </p>
                            <div className="space-y-2" style={{ fontSize: '13px' }}>
                                {[
                                    { step: 'distance()', desc: 'How far is this vertex from the mouse?' },
                                    { step: 'smoothstep(0, r, d)', desc: 'Remap distance to [0,1] with smooth easing' },
                                    { step: '1 - smoothstep', desc: 'Invert: 1 at center, 0 at radius edge' },
                                ].map(({ step, desc }) => (
                                    <div key={step} className="flex gap-3 items-start">
                                        <Pill>{step}</Pill>
                                        <span className="text-zinc-400 pt-0.5">{desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <CodeBlock lang="glsl">
                            {`float circle(vec2 uv, vec2 pos, float radius) {
  float dist = distance(pos, uv);
  return 1.0 - smoothstep(0.0, radius, dist);
}
// Returns: 1.0 at center, 0.0 beyond radius`}
                        </CodeBlock>
                    </div>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── Step 4: Vertex Shader ────────────────────────────────────────────────────

function VertexShaderSection() {
    const [radius, setRadius] = useState(0.2);
    const [intensity, setIntensity] = useState(0.7);
    const [segments, setSegments] = useState(64);
    const [wireframe, setWireframe] = useState(false);

    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <StepBadge n={4} />
                    <h2 className="text-2xl font-black tracking-tight">Vertex Shader — Pushing Geometry</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    The vertex shader runs once per vertex on the GPU. It uses the circle SDF to compute a Z-displacement: vertices near the cursor are pushed forward, creating the bulge. The mouse
                    position arrives as a <Pill>uniform vec2</Pill> updated every frame via <Pill>useFrame</Pill>.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* live preview */}
                    <div className="flex flex-col gap-4">
                        <MiniCanvas height={300}>
                            <MiniScene radius={radius} intensity={intensity} lerpSpeed={0.1} segments={segments} color="#7c3aed" wireframe={wireframe} />
                        </MiniCanvas>
                        <ControlPanel title="Move mouse over canvas ↑">
                            <Slider label="radius" value={radius} min={0.05} max={0.6} step={0.01} onChange={setRadius} />
                            <Slider label="intensity" value={intensity} min={0.1} max={3} step={0.05} onChange={setIntensity} />
                            <Slider label="segments" value={segments} min={4} max={128} step={4} onChange={setSegments} />
                            <label className="flex items-center gap-2 cursor-pointer mt-1">
                                <input type="checkbox" checked={wireframe} onChange={(e) => setWireframe(e.target.checked)} className="accent-violet-500" />
                                <span className="text-zinc-400 font-mono" style={{ fontSize: '11px' }}>
                                    wireframe
                                </span>
                            </label>
                        </ControlPanel>
                    </div>

                    {/* code */}
                    <div className="flex flex-col gap-4">
                        <CodeBlock lang="glsl" highlight={['uMouse', 'elevation', 'csm_Position']}>
                            {`uniform vec2 uMouse;    // mouse position (-1 to +1)
uniform float uRadius;  // bulge area size
uniform float uIntensity; // max Z push

varying vec2 vUv;

float circle(vec2 uv, vec2 pos, float r) {
  float dist = distance(pos, uv);
  return 1.0 - smoothstep(0.0, r, dist);
}

float elevation(float radius, float intensity) {
  // convert mouse from clip space → UV space
  vec2 mouseUV = (uMouse * 0.5) + 0.5;
  float shape = circle(uv, mouseUV, radius);
  return shape * intensity;
}

void main() {
  vec3 newPosition = position;

  // push the vertex forward by the elevation amount
  newPosition.z += elevation(uRadius, uIntensity);

  csm_Position = newPosition; // CustomShaderMaterial hook
  vUv = uv;
}`}
                        </CodeBlock>

                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3" style={{ fontSize: '14px' }}>
                            <p className="text-violet-400 font-mono" style={{ fontSize: '11px' }}>
                                KEY CONCEPTS
                            </p>
                            {[
                                {
                                    term: 'uv vs position',
                                    desc: 'uv is normalized [0,1] — perfect for distance math. position is world space — used to displace.',
                                },
                                {
                                    term: 'Mouse space conversion',
                                    desc: 'R3F gives mouse in [-1, +1]. Multiply by 0.5 + 0.5 maps it to [0, 1] UV space.',
                                },
                                {
                                    term: 'csm_Position',
                                    desc: "CustomShaderMaterial's hook into the base material. Setting this replaces the built-in position output.",
                                },
                            ].map(({ term, desc }) => (
                                <div key={term} className="flex gap-3 items-start">
                                    <Pill>{term}</Pill>
                                    <span className="text-zinc-400">{desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── Step 5: Mouse Lerp ───────────────────────────────────────────────────────

function MouseLerpSection() {
    const [speed, setSpeed] = useState(0.1);

    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <StepBadge n={5} />
                    <h2 className="text-2xl font-black tracking-tight">Mouse Lerp — Smooth Following</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    Raw mouse position is instant — the bulge would teleport. Linear interpolation (<Pill>lerp</Pill>) makes the bulge lag behind the cursor, creating the characteristic elastic
                    follow. Each frame, the current position moves <strong className="text-white">X%</strong> of the remaining distance to the target.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 flex flex-col gap-4">
                        <p className="text-zinc-300 font-bold">Lerp Visualizer</p>
                        <p className="text-zinc-500" style={{ fontSize: '13px' }}>
                            White dot = current (lerped) · Ring = target. Watch how lag changes with speed.
                        </p>
                        <LerpViz speed={speed} />
                        <Slider label="lerp speed" value={speed} min={0.01} max={0.5} step={0.01} onChange={setSpeed} />

                        <div className="grid grid-cols-3 gap-2 mt-1">
                            {[
                                { speed: 0.05, label: 'Very slow', feel: 'Dreamy' },
                                { speed: 0.1, label: 'Default', feel: 'Elastic' },
                                { speed: 0.3, label: 'Fast', feel: 'Snappy' },
                            ].map(({ speed: s, label, feel }) => (
                                <button
                                    key={label}
                                    onClick={() => setSpeed(s)}
                                    className={`rounded-lg border px-2 py-2 text-center transition-colors cursor-pointer ${speed === s ? 'border-violet-500/60 bg-violet-500/10 text-violet-300' : 'border-zinc-700/60 bg-zinc-800/40 text-zinc-400 hover:border-zinc-600'}`}
                                    style={{ fontSize: '11px' }}
                                >
                                    <div className="font-bold font-mono">{s}</div>
                                    <div className="opacity-70">{feel}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <CodeBlock lang="tsx" highlight={['lerp', 'mouseLerped', 'useFrame']}>
                            {`// ref holds current lerped position (avoids re-renders)
const mouseLerped = useRef({ x: 0, y: 0 });

useFrame((state) => {
  const mouse = state.mouse; // R3F: normalized -1 to +1

  // lerp = current + (target - current) * speed
  // = "move X% of the remaining gap each frame"
  mouseLerped.current.x = THREE.MathUtils.lerp(
    mouseLerped.current.x,
    mouse.x,
    0.1  // ← tweak this (0.01 = laggy, 0.5 = snappy)
  );
  mouseLerped.current.y = THREE.MathUtils.lerp(
    mouseLerped.current.y,
    mouse.y,
    0.1
  );

  // push to shader uniform every frame
  material.uniforms.uMouse.value.x = mouseLerped.current.x;
  material.uniforms.uMouse.value.y = mouseLerped.current.y;
});`}
                        </CodeBlock>

                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4" style={{ fontSize: '14px' }}>
                            <p className="text-amber-300 font-bold mb-2">
                                Why <Pill>useRef</Pill> not <Pill>useState</Pill>?
                            </p>
                            <p className="text-amber-200/80 leading-relaxed">
                                The lerped value changes 60 times per second. Using <Pill>setState</Pill> would trigger 60 re-renders/sec and tank performance. A <Pill>ref</Pill> mutates silently —
                                the shader reads it directly without React knowing.
                            </p>
                        </div>
                    </div>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── Step 6: Material stack ───────────────────────────────────────────────────

function MaterialSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <StepBadge n={6} />
                    <h2 className="text-2xl font-black tracking-tight">Material Stack — Texture + Lighting</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    <Pill>CustomShaderMaterial</Pill> wraps <Pill>MeshStandardMaterial</Pill> — you write shaders that <em>extend</em> the PBR pipeline rather than replace it. The fragment shader sets
                    the diffuse color from the canvas texture; lighting falls on it naturally.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-4">
                        <CodeBlock lang="glsl" highlight={['csm_DiffuseColor', 'uTexture']}>
                            {`// fragment.glsl
uniform sampler2D uTexture; // the canvas texture
varying vec2 vUv;           // from vertex shader

void main() {
  vec4 color = texture2D(uTexture, vUv);

  // csm_DiffuseColor → feeds into MeshStandard
  // lighting pipeline (diffuse, shadows, etc.)
  csm_DiffuseColor = color;
}`}
                        </CodeBlock>

                        <CodeBlock lang="tsx" highlight={['flatShading', 'pointLight', 'MeshStandardMaterial']}>
                            {`// Flat shading = faceted look on the bulge
// (each triangle gets one color, no smooth interpolation)
<CustomShaderMaterial
  baseMaterial={THREE.MeshStandardMaterial}
  flatShading  // ← makes displacement more visible
  silent       // suppress console warnings
/>

// Point light — position matters for the bulge shadow
<pointLight
  position={[2, 4, 6]}
  intensity={30}
  distance={12}
/>`}
                        </CodeBlock>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4" style={{ fontSize: '14px' }}>
                            <p className="text-violet-400 font-mono" style={{ fontSize: '11px' }}>
                                MATERIAL LAYER CAKE
                            </p>
                            {[
                                {
                                    layer: 'MeshStandardMaterial',
                                    role: 'Base PBR — handles lighting, shadows, reflections',
                                    color: 'text-blue-300',
                                },
                                {
                                    layer: 'CustomShaderMaterial',
                                    role: 'Wrapper — lets you inject GLSL into the PBR pipeline via csm_* hooks',
                                    color: 'text-violet-300',
                                },
                                {
                                    layer: 'vertexShader',
                                    role: 'Sets csm_Position — displaces geometry, passes vUv',
                                    color: 'text-green-300',
                                },
                                {
                                    layer: 'fragmentShader',
                                    role: 'Sets csm_DiffuseColor — paints canvas texture onto each pixel',
                                    color: 'text-yellow-300',
                                },
                            ].map(({ layer, role, color }) => (
                                <div key={layer} className="flex gap-3 items-start border-l-2 border-zinc-700/50 pl-3">
                                    <div>
                                        <p className={`font-mono font-bold ${color}`} style={{ fontSize: '13px' }}>
                                            {layer}
                                        </p>
                                        <p className="text-zinc-400 mt-0.5">{role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5" style={{ fontSize: '14px' }}>
                            <p className="text-violet-400 font-mono mb-3" style={{ fontSize: '11px' }}>
                                WHY html2canvas?
                            </p>
                            <p className="text-zinc-400 leading-relaxed mb-3">
                                You could render text directly with <Pill>troika-three-text</Pill> or <Pill>CanvasTexture</Pill>. But <Pill>html2canvas</Pill> lets you use{' '}
                                <strong className="text-white">any CSS</strong> — gradients, mix-blend-mode, variable fonts, SVG — and it just works.
                            </p>
                            <p className="text-zinc-500" style={{ fontSize: '13px' }}>
                                Trade-off: the snapshot is async and doesn&apos;t update on content changes automatically (hence the resize listener).
                            </p>
                        </div>
                    </div>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── Interactive Playground ───────────────────────────────────────────────────

function PlaygroundSection() {
    const [radius, setRadius] = useState(0.2);
    const [intensity, setIntensity] = useState(0.7);
    const [lerpSpeed, setLerpSpeed] = useState(0.1);
    const [segments, setSegments] = useState(64);
    const [color, setColor] = useState('#7c3aed');
    const [wireframe, setWireframe] = useState(false);

    const reset = useCallback(() => {
        setRadius(0.2);
        setIntensity(0.7);
        setLerpSpeed(0.1);
        setSegments(64);
        setColor('#7c3aed');
        setWireframe(false);
    }, []);

    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <StepBadge n={7} />
                    <h2 className="text-2xl font-black tracking-tight">Playground — All Together</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    Move your mouse over the canvas. All five techniques composing live — DOM texture, high-poly plane, circle SDF in the vertex shader, mouse lerp, and PBR lighting. Tweak every
                    parameter and feel the immediate feedback.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <MiniCanvas height={420}>
                            <MiniScene radius={radius} intensity={intensity} lerpSpeed={lerpSpeed} segments={segments} color={color} wireframe={wireframe} />
                        </MiniCanvas>
                    </div>

                    <div className="flex flex-col gap-3">
                        <ControlPanel title="Shape">
                            <Slider label="radius" value={radius} min={0.05} max={0.6} step={0.01} onChange={setRadius} />
                            <Slider label="intensity" value={intensity} min={0.1} max={3} step={0.05} onChange={setIntensity} />
                        </ControlPanel>

                        <ControlPanel title="Feel">
                            <Slider label="lerp speed" value={lerpSpeed} min={0.01} max={0.5} step={0.01} onChange={setLerpSpeed} />
                        </ControlPanel>

                        <ControlPanel title="Geometry">
                            <Slider label="segments" value={segments} min={4} max={128} step={4} onChange={setSegments} />
                        </ControlPanel>

                        <ControlPanel title="Appearance">
                            <label className="flex flex-col gap-1.5">
                                <span className="text-zinc-400 font-mono" style={{ fontSize: '11px' }}>
                                    color
                                </span>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-12 rounded cursor-pointer bg-transparent border-0" />
                                    <span className="text-violet-300 font-mono font-bold" style={{ fontSize: '11px' }}>
                                        {color}
                                    </span>
                                </div>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={wireframe} onChange={(e) => setWireframe(e.target.checked)} className="accent-violet-500" />
                                <span className="text-zinc-400 font-mono" style={{ fontSize: '11px' }}>
                                    wireframe
                                </span>
                            </label>
                        </ControlPanel>

                        <button
                            onClick={reset}
                            className="text-zinc-500 hover:text-zinc-300 font-mono transition-colors text-left border border-zinc-800/60 rounded-lg px-3 py-2 hover:border-zinc-600"
                            style={{ fontSize: '11px' }}
                        >
                            ↺ reset to defaults
                        </button>
                    </div>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── Full Code ────────────────────────────────────────────────────────────────

function FullCodeSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <StepBadge n={8} />
                    <h2 className="text-2xl font-black tracking-tight">Full Implementation</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    The complete Scene component — all five techniques assembled. Under 110 lines.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <CodeBlock lang="tsx" highlight={['useDomToCanvas', 'uMouse', 'mouseLerped', 'planeGeometry', 'CustomShaderMaterial']}>
                    {`'use client';
import { useRef, useMemo, useEffect, useState } from 'react';
import { debounce } from 'lodash';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import CustomShaderMaterial from 'three-custom-shader-material';
import html2canvas from 'html2canvas';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';

// ① DOM → Canvas → Texture
const useDomToCanvas = (domEl) => {
  const [texture, setTexture] = useState();
  useEffect(() => {
    if (!domEl) return;
    const convert = async () => {
      const canvas = await html2canvas(domEl, { backgroundColor: null });
      setTexture(new THREE.CanvasTexture(canvas));
    };
    convert();
    const onResize = debounce(convert, 100);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [domEl]);
  return texture;
};

export default function Scene() {
  const { width, height } = useThree((s) => s.viewport);
  const [domEl, setDomEl] = useState(null);

  // ② Snapshot the DOM text into a GPU texture
  const textureDOM = useDomToCanvas(domEl);

  // ③ Uniforms: texture + mouse position
  const uniforms = useMemo(() => ({
    uTexture: { value: textureDOM },
    uMouse: { value: new THREE.Vector2(0, 0) },
  }), [textureDOM]);

  // ④ Lerped mouse — ref to avoid re-renders at 60fps
  const materialRef = useRef();
  const mouseLerped = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    const { x, y } = state.mouse;
    mouseLerped.current.x = THREE.MathUtils.lerp(mouseLerped.current.x, x, 0.1);
    mouseLerped.current.y = THREE.MathUtils.lerp(mouseLerped.current.y, y, 0.1);
    materialRef.current.uniforms.uMouse.value.set(
      mouseLerped.current.x,
      mouseLerped.current.y
    );
  });

  return (
    <>
      {/* Hidden DOM text → snapshotted by html2canvas */}
      <Html zIndexRange={[-1, -10]} prepend fullscreen>
        <div ref={setDomEl} style={{
          width: '100%', height: '100%',
          fontSize: 'clamp(100px, 17vw, 200px)',
          backgroundColor: '#000', color: 'white',
          display: 'flex', alignItems: 'center',
          paddingLeft: '3vw', lineHeight: 0.8, fontWeight: 700,
        }}>
          <p>THANH<br/>CHINH<br/>MAT<br/>TRINH</p>
        </div>
      </Html>

      <mesh>
        {/* ⑤ High-poly plane — 254×254 segments for smooth displacement */}
        <planeGeometry args={[width, height, 254, 254]} />
        <CustomShaderMaterial
          ref={materialRef}
          baseMaterial={THREE.MeshStandardMaterial}
          vertexShader={vertexShader}   // circle SDF → Z displacement
          fragmentShader={fragmentShader} // canvas texture → diffuse
          uniforms={uniforms}
          flatShading  // faceted shading highlights the deformation
          silent
        />
        <pointLight position={[2, 4, 6]} intensity={30} distance={12} />
      </mesh>
    </>
  );
}`}
                </CodeBlock>
            </FadeIn>

            <FadeIn delay={0.2}>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CodeBlock lang="glsl">
                        {`// vertex.glsl
uniform vec2 uMouse;
varying vec2 vUv;

float circle(vec2 uv, vec2 pos, float r) {
  return 1.0 - smoothstep(0.0, r, distance(pos, uv));
}

void main() {
  vec3 pos = position;
  vec2 mouseUV = (uMouse * 0.5) + 0.5;
  pos.z += circle(uv, mouseUV, 0.2) * 0.7;
  csm_Position = pos;
  vUv = uv;
}`}
                    </CodeBlock>
                    <CodeBlock lang="glsl">
                        {`// fragment.glsl
uniform sampler2D uTexture;
varying vec2 vUv;

void main() {
  csm_DiffuseColor = texture2D(uTexture, vUv);
}`}
                    </CodeBlock>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── Summary Checklist ────────────────────────────────────────────────────────

function ChecklistSection() {
    const items = [
        { done: true, text: 'Render text as HTML/CSS — use any font, gradient, or style' },
        { done: true, text: 'Snapshot DOM to canvas with html2canvas → THREE.CanvasTexture' },
        { done: true, text: 'Create a planeGeometry with 254×254 segments for smooth displacement' },
        { done: true, text: 'Write a vertex shader using circle SDF to push Z by uMouse distance' },
        { done: true, text: 'Lerp mouse position in useFrame via ref — never useState for 60fps data' },
        { done: true, text: 'Use CustomShaderMaterial to extend MeshStandard — get lighting for free' },
        { done: true, text: 'Place a point light above and forward to make displacement visible' },
    ];

    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <h2 className="text-2xl font-black tracking-tight mb-8">Recipe Checklist</h2>
                <div className="space-y-3 max-w-2xl">
                    {items.map(({ done, text }, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.07, duration: 0.4, ease: E_OUT }}
                            className="flex items-start gap-3"
                        >
                            <span
                                className={`mt-0.5 shrink-0 size-5 rounded-full flex items-center justify-center border ${done ? 'bg-violet-500/20 border-violet-500/50 text-violet-400' : 'border-zinc-700 text-zinc-600'}`}
                                style={{ fontSize: '11px' }}
                            >
                                {done ? '✓' : '○'}
                            </span>
                            <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                                {text}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </FadeIn>

            <FadeIn delay={0.3}>
                <div className="mt-12 flex flex-wrap gap-4">
                    <Link
                        href="/r3f-bulge"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-colors"
                        style={{ fontSize: '14px' }}
                    >
                        See the demo →
                    </Link>
                    <Link
                        href="/r3f-experimental"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-bold transition-colors"
                        style={{ fontSize: '14px' }}
                    >
                        More R3F experiments
                    </Link>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BulgeLearnPage() {
    return (
        <main className="min-h-screen bg-[#080810] text-white overflow-x-hidden">
            <div className="absolute inset-0 pointer-events-none" style={NOISE_BG} />
            <div className="max-w-[1100px] mx-auto">
                <HeroSection />
                <PipelineSection />
                <SectionRule />
                <PlaneSection />
                <SectionRule />
                <CircleSDFSection />
                <SectionRule />
                <VertexShaderSection />
                <SectionRule />
                <MouseLerpSection />
                <SectionRule />
                <MaterialSection />
                <SectionRule />
                <PlaygroundSection />
                <SectionRule />
                <FullCodeSection />
                <ChecklistSection />
            </div>
            <footer className="border-t border-zinc-800/60 px-6 md:px-12 xl:px-24 py-10 text-center text-zinc-600 font-mono" style={{ fontSize: '13px' }}>
                Bulge Text Effect · Technique Breakdown · DOM → GLSL → WebGL
            </footer>
        </main>
    );
}

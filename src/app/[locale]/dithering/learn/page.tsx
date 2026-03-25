'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { CodeBlock } from '@/components/code-block';
import { E_OUT, FadeIn, NOISE_BG } from '@/components/fade-in';

// 4×4 Bayer matrix indexed as [row y][col x] — matches the GLSL shader exactly
const BAYER: number[][] = [
    [16, 8, 14, 6],
    [5, 12, 2, 10],
    [13, 4, 15, 7],
    [1, 9, 3, 11],
];

// ─── shared primitives ────────────────────────────────────────────────────────

function Tag({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono tracking-wider uppercase border bg-amber-500/10 text-amber-400 border-amber-500/20" style={{ fontSize: '10px' }}>
            {children}
        </span>
    );
}

function StepBadge({ n }: { n: number }) {
    return (
        <span
            className="inline-flex items-center justify-center size-7 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-black font-mono shrink-0"
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

function Slider({ label, value, min, max, step = 1, onChange, unit = '' }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string }) {
    return (
        <label className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
                <span className="text-zinc-400 font-mono" style={{ fontSize: '11px' }}>
                    {label}
                </span>
                <span className="text-amber-300 font-mono font-bold" style={{ fontSize: '11px' }}>
                    {step < 1 ? value.toFixed(2) : value}
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
                className="w-full h-1 appearance-none rounded-full bg-zinc-700 accent-amber-500 cursor-pointer"
            />
        </label>
    );
}

function SectionRule() {
    return <div className="my-20 h-px bg-gradient-to-r from-amber-500/20 via-amber-500/5 to-transparent" />;
}

function Callout({ children, variant = 'tip' }: { children: React.ReactNode; variant?: 'tip' | 'info' | 'note' }) {
    const styles = {
        tip: 'bg-amber-500/5 border-amber-500/20 text-amber-200/90',
        info: 'bg-sky-500/5 border-sky-500/20 text-sky-200/90',
        note: 'bg-zinc-800/40 border-zinc-700/60 text-zinc-300',
    };
    return (
        <div className={`border rounded-xl px-4 py-3 leading-relaxed ${styles[variant]}`} style={{ fontSize: '13px' }}>
            {children}
        </div>
    );
}

// ─── interactive demos ────────────────────────────────────────────────────────

/** Side-by-side gradient vs dithered canvas */
function DitheringDemo() {
    const origRef = useRef<HTMLCanvasElement>(null);
    const dithRef = useRef<HTMLCanvasElement>(null);
    const [gridSize, setGridSize] = useState(4);
    const [grayscale, setGrayscale] = useState(true);

    const W = 300;
    const H = 120;

    const draw = useCallback(() => {
        const origCanvas = origRef.current;
        const dithCanvas = dithRef.current;
        if (!origCanvas || !dithCanvas) return;
        const oc = origCanvas.getContext('2d')!;
        const dc = dithCanvas.getContext('2d')!;

        // Draw original gradient
        const g = oc.createLinearGradient(0, 0, W, 0);
        g.addColorStop(0, '#000');
        g.addColorStop(1, '#fff');
        oc.fillStyle = g;
        oc.fillRect(0, 0, W, H);

        // Copy gradient data to dither canvas then apply dithering
        const g2 = dc.createLinearGradient(0, 0, W, 0);
        g2.addColorStop(0, '#000');
        g2.addColorStop(1, '#fff');
        dc.fillStyle = g2;
        dc.fillRect(0, 0, W, H);

        const imgData = dc.getImageData(0, 0, W, H);
        const d = imgData.data;
        // Cache snapped pixel luminance to avoid re-sampling during dithering loop
        const snap = new Float32Array(W * H);
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const px = Math.floor(x / gridSize) * gridSize;
                const py = Math.floor(y / gridSize) * gridSize;
                const pi = (Math.min(py, H - 1) * W + Math.min(px, W - 1)) * 4;
                snap[y * W + x] = (d[pi] + d[pi + 1] + d[pi + 2]) / 3 / 255;
            }
        }

        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const lum = snap[y * W + x];
                const mx = Math.floor(x / gridSize) % 4;
                const my = Math.floor(y / gridSize) % 4;
                const threshold = BAYER[my][mx] / 17;
                const idx = (y * W + x) * 4;

                if (lum < threshold) {
                    d[idx] = 0;
                    d[idx + 1] = 0;
                    d[idx + 2] = 0;
                } else if (grayscale) {
                    const v = Math.round(lum * 255);
                    d[idx] = v;
                    d[idx + 1] = v;
                    d[idx + 2] = v;
                }
            }
        }
        dc.putImageData(imgData, 0, 0);
    }, [gridSize, grayscale, W, H]);

    useEffect(() => {
        draw();
    }, [draw]);

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
                {[
                    { ref: origRef, label: 'Smooth gradient' },
                    { ref: dithRef, label: 'After dithering' },
                ].map(({ ref, label }) => (
                    <div key={label} className="flex flex-col gap-1.5">
                        <p className="text-zinc-500 font-mono uppercase tracking-widest" style={{ fontSize: '9px' }}>
                            {label}
                        </p>
                        <canvas ref={ref} width={W} height={H} className="w-full rounded-lg border border-zinc-800" style={{ imageRendering: 'pixelated' }} />
                    </div>
                ))}
            </div>
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-4 flex flex-col gap-3">
                <Slider label="Grid size" value={gridSize} min={1} max={16} step={1} onChange={setGridSize} unit="px" />
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={grayscale} onChange={(e) => setGrayscale(e.target.checked)} className="accent-amber-500" />
                    <span className="text-zinc-400 font-mono" style={{ fontSize: '11px' }}>
                        Grayscale only
                    </span>
                </label>
            </div>
        </div>
    );
}

/** Color picker → luminance breakdown */
function LuminanceDemo() {
    const [hex, setHex] = useState('#3b82f6');

    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const lum = r + g + b; // matches the shader dot(color, vec3(1,1,1))
    const lumNorm = (r + g + b) / 3; // 0-1 for display

    const channels = [
        { label: 'R', value: r, color: '#ef4444' },
        { label: 'G', value: g, color: '#22c55e' },
        { label: 'B', value: b, color: '#3b82f6' },
    ];

    return (
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1 shrink-0">
                    <p className="text-zinc-500 font-mono uppercase tracking-widest" style={{ fontSize: '9px' }}>
                        Color
                    </p>
                    <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="size-12 rounded-lg cursor-pointer border border-zinc-700 bg-transparent p-0.5" />
                </div>
                <div className="h-12 flex-1 rounded-lg border border-zinc-800 transition-colors" style={{ background: `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})` }} />
                <div className="flex flex-col gap-1 items-center shrink-0">
                    <p className="text-zinc-500 font-mono uppercase tracking-widest" style={{ fontSize: '9px' }}>
                        Grayscale
                    </p>
                    <div
                        className="h-12 w-12 rounded-lg border border-zinc-800 transition-colors"
                        style={{
                            background: `rgb(${Math.round(lumNorm * 255)},${Math.round(lumNorm * 255)},${Math.round(lumNorm * 255)})`,
                        }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {channels.map(({ label, value, color: c }) => (
                    <div key={label} className="flex flex-col gap-1">
                        <div className="flex justify-between">
                            <span className="font-mono font-bold" style={{ fontSize: '11px', color: c }}>
                                {label}
                            </span>
                            <span className="text-zinc-400 font-mono" style={{ fontSize: '11px' }}>
                                {value.toFixed(3)}
                            </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-100" style={{ width: `${value * 100}%`, background: c }} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t border-zinc-800 pt-3 flex items-baseline justify-between gap-3">
                <span className="text-zinc-500 font-mono" style={{ fontSize: '12px' }}>
                    dot(color,&nbsp;vec3(1,1,1)) = {r.toFixed(2)} + {g.toFixed(2)} + {b.toFixed(2)}
                </span>
                <span className="text-amber-300 font-black font-mono text-2xl shrink-0">{lum.toFixed(3)}</span>
            </div>
        </div>
    );
}

/** 4×4 Bayer matrix grid with hover tooltip */
function BayerMatrixViz() {
    const [hovered, setHovered] = useState<[number, number] | null>(null);

    return (
        <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Grid */}
            <div className="grid gap-1.5 shrink-0" style={{ gridTemplateColumns: 'repeat(4, 3.5rem)' }}>
                {BAYER.map((row, y) =>
                    row.map((val, x) => {
                        const brightness = val / 17;
                        const isHovered = hovered?.[0] === x && hovered?.[1] === y;
                        const textColor = brightness > 0.52 ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)';
                        const subColor = brightness > 0.52 ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)';

                        return (
                            <div
                                key={`${x}-${y}`}
                                onMouseEnter={() => setHovered([x, y])}
                                onMouseLeave={() => setHovered(null)}
                                className={`h-14 flex flex-col items-center justify-center rounded-lg cursor-default select-none transition-all border ${
                                    isHovered ? 'border-amber-400 scale-110 z-10 shadow-lg shadow-amber-500/20' : 'border-zinc-700/30'
                                }`}
                                style={{
                                    background: `rgb(${Math.round(brightness * 255)},${Math.round(brightness * 255)},${Math.round(brightness * 255)})`,
                                }}
                            >
                                <span className="font-black font-mono leading-none" style={{ fontSize: '18px', color: textColor }}>
                                    {val}
                                </span>
                                <span className="font-mono leading-none" style={{ fontSize: '10px', color: subColor }}>
                                    /17
                                </span>
                            </div>
                        );
                    }),
                )}
            </div>

            {/* Info panel */}
            <div className="flex flex-col gap-3 flex-1 min-w-0">
                {hovered ? (
                    <div className="bg-zinc-900/80 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-2">
                        <p className="text-amber-400 font-mono font-bold" style={{ fontSize: '13px' }}>
                            Cell ({hovered[0]}, {hovered[1]})
                        </p>
                        <p className="text-zinc-300" style={{ fontSize: '13px' }}>
                            Threshold:{' '}
                            <strong className="text-amber-300">
                                {BAYER[hovered[1]][hovered[0]]}/17 ≈ {((BAYER[hovered[1]][hovered[0]] / 17) * 100).toFixed(0)}%
                            </strong>
                        </p>
                        <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '12px' }}>
                            A pixel at this grid position is turned <strong className="text-white">black</strong> when its brightness is below{' '}
                            <strong className="text-amber-300">{((BAYER[hovered[1]][hovered[0]] / 17) * 100).toFixed(0)}%</strong>.
                        </p>
                    </div>
                ) : (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                        <p className="text-zinc-500" style={{ fontSize: '13px' }}>
                            Hover a cell to inspect its threshold.
                        </p>
                    </div>
                )}
                <div className="flex flex-col gap-2">
                    {[
                        { bg: 'bg-zinc-900 border-zinc-700', label: 'Dark cell (high threshold) — turns black even for mid-tones' },
                        { bg: 'bg-white border-zinc-400', label: 'Light cell (low threshold) — stays unaffected until very dark' },
                    ].map(({ bg, label }) => (
                        <div key={label} className="flex items-center gap-3">
                            <div className={`size-4 rounded border shrink-0 ${bg}`} />
                            <span className="text-zinc-400" style={{ fontSize: '12px' }}>
                                {label}
                            </span>
                        </div>
                    ))}
                </div>
                <Callout variant="note">
                    The pattern of 16 different thresholds means each brightness level maps to a <strong className="text-zinc-100">unique fill pattern</strong> — giving the illusion of 17 distinct
                    tones using only black and non-black pixels.
                </Callout>
            </div>
        </div>
    );
}

/** Pixelation canvas demo */
function PixelationDemo() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pixelSize, setPixelSize] = useState(8);
    const W = 320;
    const H = 130;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;

        // Draw smooth gradient
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, '#0f0c29');
        g.addColorStop(0.4, '#302b63');
        g.addColorStop(0.7, '#c94b4b');
        g.addColorStop(1, '#f5f5f5');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        if (pixelSize <= 1) return;

        // Snap pixels to grid
        const src = new Uint8ClampedArray(ctx.getImageData(0, 0, W, H).data);
        const out = ctx.getImageData(0, 0, W, H);
        const d = out.data;

        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const px = Math.floor(x / pixelSize) * pixelSize;
                const py = Math.floor(y / pixelSize) * pixelSize;
                const si = (Math.min(py, H - 1) * W + Math.min(px, W - 1)) * 4;
                const di = (y * W + x) * 4;
                d[di] = src[si];
                d[di + 1] = src[si + 1];
                d[di + 2] = src[si + 2];
            }
        }
        ctx.putImageData(out, 0, 0);
    }, [pixelSize, W, H]);

    return (
        <div className="flex flex-col gap-4">
            <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-lg border border-zinc-800" style={{ imageRendering: 'pixelated' }} />
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-4">
                <Slider label="Pixel size" value={pixelSize} min={1} max={20} step={1} onChange={setPixelSize} unit="px" />
            </div>
        </div>
    );
}

/** Visual pipeline diagram */
function PipelineDiagram() {
    const steps = [
        { label: 'Scene', sub: '3D render', highlight: false },
        { label: 'RenderPass', sub: 'to texture', highlight: true },
        { label: 'Bloom 1', sub: 'optional', highlight: false },
        { label: 'DitheringEffect', sub: 'pixelate → luma → Bayer', highlight: true },
        { label: 'Bloom 2', sub: 'optional', highlight: false },
        { label: 'Screen', sub: 'final output', highlight: true },
    ];

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 font-mono uppercase tracking-widest mb-4" style={{ fontSize: '9px' }}>
                EffectComposer pipeline
            </p>
            <div className="flex flex-wrap items-center gap-2">
                {steps.map((step, i) => (
                    <div key={step.label} className="flex items-center gap-2">
                        <div
                            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border ${step.highlight ? 'border-amber-500/40 bg-amber-500/10' : 'border-zinc-700/50 bg-zinc-900/60'}`}
                        >
                            <span className={`font-mono font-bold ${step.highlight ? 'text-amber-300' : 'text-zinc-400'}`} style={{ fontSize: '12px' }}>
                                {step.label}
                            </span>
                            <span className="text-zinc-600 font-mono" style={{ fontSize: '10px' }}>
                                {step.sub}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <span className="text-zinc-600 font-mono" style={{ fontSize: '14px' }}>
                                →
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── code strings ─────────────────────────────────────────────────────────────

const CODE_LUMINANCE = `// Each channel is already 0.0 → 1.0 from the render buffer
vec3 color = texture2D(inputBuffer, uv).rgb;

// Sum all three channels — a quick "brightness" estimate
float luminance = dot(color, vec3(1., 1., 1.));
//  = color.r + color.g + color.b

// Optionally collapse to true grayscale
if (grayscaleOnly > 0.0) {
  color = vec3(luminance);
}`;

const CODE_BAYER = `bool getValue(float brightness, vec2 pos) {
  // Which 4×4 cell does this pixel land in?
  vec2 cell = floor(mod(pos.xy / gridSize, 4.0));
  int x = int(cell.x);
  int y = int(cell.y);

  // Threshold lookup — 16 unique values spread 1/17 apart
  // Returns true  → this pixel becomes black
  // Returns false → this pixel keeps its color
  if (x == 0) {
    if (y == 0) return brightness < 16.0/17.0;
    if (y == 1) return brightness < 5.0/17.0;
    if (y == 2) return brightness < 13.0/17.0;
    return             brightness < 1.0/17.0;
  }
  // ... (same pattern for x == 1, 2, 3)
}`;

const CODE_PIXELATION = `// gridSize controls the Bayer cell size
// pixelSizeRatio stretches it further for a blockier look
float pixelSize = gridSize * pixelSizeRatio;

// Snap UV to the nearest grid boundary (floor trick)
vec2 snappedUV = floor(fragCoord / pixelSize)
               * pixelSize / resolution;

// Sample the snapped position — every pixel in a tile
// reads the same source texel → blocky appearance
vec3 color = texture2D(inputBuffer, snappedUV).rgb;`;

const CODE_MAIN_IMAGE = `void mainImage(
  const in vec4 inputColor,
  const in vec2 uv,
  out vec4 outputColor
) {
  vec2 fragCoord = uv * resolution;

  // ① Pixelate — snap to grid
  float pixelSize = gridSize * pixelSizeRatio;
  vec2 snappedUV  = floor(fragCoord / pixelSize)
                  * pixelSize / resolution;
  vec3 color = texture2D(inputBuffer, snappedUV).rgb;

  // ② Luminance
  float lum = dot(color, vec3(1., 1., 1.));
  if (grayscaleOnly > 0.0) color = vec3(lum);

  // ③ Bayer threshold at this pixel's grid position
  bool dark = getValue(lum, fragCoord);
  color = dark ? vec3(0.0) : color;

  outputColor = vec4(color, inputColor.a);
}`;

const CODE_EFFECT_CLASS = `import { Effect } from 'postprocessing';
import * as THREE from 'three';
import ditheringShader from './DitheringShader';

export class DitheringEffect extends Effect {
  constructor({ gridSize = 4, pixelSizeRatio = 1, grayscaleOnly = false } = {}) {
    const uniforms = new Map([
      ['gridSize',       new THREE.Uniform(gridSize)],
      ['pixelSizeRatio', new THREE.Uniform(pixelSizeRatio)],
      ['grayscaleOnly',  new THREE.Uniform(grayscaleOnly ? 1 : 0)],
      ['resolution',     new THREE.Uniform(new THREE.Vector2(1, 1))],
    ]);

    // Pass the GLSL string + uniforms to the base Effect class
    super('DitheringEffect', ditheringShader, { uniforms });
    this.uniforms = uniforms;
  }

  // Called automatically every frame by the EffectComposer
  update(renderer, inputBuffer, deltaTime) {
    // Sync resolution so the shader knows the render target size
    this.uniforms.get('resolution').value
      .set(inputBuffer.width, inputBuffer.height);
  }
}`;

const CODE_PIPELINE = `// PostProcessing.tsx — manual EffectComposer setup
useFrame(({ gl, scene, camera }) => {
  if (!composerRef.current) {
    composerRef.current = new EffectComposer(gl);
  }

  const composer = composerRef.current;
  composer.removeAllPasses();

  // 1. Render the 3D scene into a texture
  composer.addPass(new RenderPass(scene, camera));

  // 2. Optional: bloom before dithering
  if (bloom1Enabled) {
    composer.addPass(new EffectPass(camera, new BloomEffect({ ... })));
  }

  // 3. Core effect — reads gridSize/pixelSizeRatio from Leva controls
  composer.addPass(new EffectPass(camera,
    new DitheringEffect({ gridSize, pixelSizeRatio, grayscaleOnly })
  ));

  // 4. Optional: bloom after dithering (softens the dot pattern)
  if (bloom2Enabled) {
    composer.addPass(new EffectPass(camera, new BloomEffect({ ... })));
  }

  composer.render();
}, 1); // priority 1 → runs after all scene updates`;

// ─── page sections ────────────────────────────────────────────────────────────

function HeroSection() {
    const title = 'Dithering Shader';
    return (
        <section className="px-6 md:px-12 xl:px-24 pt-20 pb-16" style={NOISE_BG}>
            <FadeIn>
                <div className="flex flex-wrap gap-2 mb-6">
                    <Tag>GLSL</Tag>
                    <Tag>Post-processing</Tag>
                    <Tag>React Three Fiber</Tag>
                    <Tag>Bayer Matrix</Tag>
                </div>
            </FadeIn>
            <div className="overflow-hidden mb-6">
                <motion.h1
                    className="font-black tracking-tight text-white leading-[0.9]"
                    style={{ fontSize: 'clamp(40px, 8vw, 96px)' }}
                    initial={{ y: '105%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.7, ease: E_OUT }}
                >
                    {title}
                </motion.h1>
            </div>
            <FadeIn delay={0.15}>
                <p className="text-zinc-400 max-w-2xl leading-relaxed mb-8" style={{ fontSize: '17px' }}>
                    How a 4×4 grid of thresholds, a luminance formula, and a floor trick combine into a full post-processing shader that turns a 3D render into a Bayer-dithered image — live, on the
                    GPU.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                    <Link
                        href="/dithering"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors font-mono"
                        style={{ fontSize: '13px' }}
                    >
                        ← View the demo
                    </Link>
                    <span className="text-zinc-600 font-mono" style={{ fontSize: '12px' }}>
                        7 concepts · interactive demos · annotated code
                    </span>
                </div>
            </FadeIn>
        </section>
    );
}

function TheIllusionSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <h2 className="text-3xl font-black tracking-tight mb-4">The Illusion</h2>
                <p className="text-zinc-400 max-w-2xl mb-6 leading-relaxed" style={{ fontSize: '16px' }}>
                    A 1-bit display can only show black or white. Dithering tricks the eye into seeing shades of gray by using <strong className="text-white">patterns of black and white dots</strong>{' '}
                    — the denser the dots, the darker the perceived tone. The same trick powers newspaper print, old Game Boy screens, and our shader.
                </p>
                <p className="text-zinc-500 max-w-2xl mb-10 leading-relaxed" style={{ fontSize: '14px' }}>
                    Drag the <strong className="text-zinc-300">Grid size</strong> slider below. Larger cells mean fewer, more visible dots — smaller cells approach the smooth original.
                </p>
            </FadeIn>
            <FadeIn delay={0.1}>
                <div className="max-w-2xl">
                    <DitheringDemo />
                </div>
            </FadeIn>
        </section>
    );
}

function LuminanceSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <StepBadge n={1} />
                    <h2 className="text-2xl font-black tracking-tight">Brightness in One Number</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-6 leading-relaxed" style={{ fontSize: '16px' }}>
                    Before we can dither, we need to know <em>how bright</em> a pixel is. Color has three channels (R, G, B) — we collapse them into a single{' '}
                    <strong className="text-white">luminance</strong> value that represents perceived brightness.
                </p>
                <p className="text-zinc-500 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '14px' }}>
                    The shader uses a dot product against <Pill>vec3(1,1,1)</Pill> — essentially summing all three channels. This is a fast, intentionally un-perceptual formula that works well for
                    artistic effects.
                </p>
            </FadeIn>
            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-4">
                        <LuminanceDemo />
                        <Callout variant="tip">
                            Pick a pure red or green and notice the luminance stays low. Pick a near-white color and it approaches 3.0 — that&apos;s the <Pill>dot(color, vec3(1,1,1))</Pill> formula
                            summing all three channels.
                        </Callout>
                    </div>
                    <CodeBlock lang="glsl" highlight={['dot', 'luminance', 'grayscaleOnly']}>
                        {CODE_LUMINANCE}
                    </CodeBlock>
                </div>
            </FadeIn>
        </section>
    );
}

function BayerSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <StepBadge n={2} />
                    <h2 className="text-2xl font-black tracking-tight">The 4×4 Decision Map</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-6 leading-relaxed" style={{ fontSize: '16px' }}>
                    The <strong className="text-white">Bayer matrix</strong> is a 4×4 grid of threshold values. For each pixel, we look up its position in this grid and compare the luminance against
                    the stored threshold. If the luminance is <em>below</em> the threshold, the pixel becomes black.
                </p>
                <p className="text-zinc-500 max-w-2xl mb-10 leading-relaxed" style={{ fontSize: '14px' }}>
                    The 16 thresholds are spaced evenly (multiples of 1/17), so the pattern gradually fills in as brightness decreases — producing a smooth-looking gradient from just two tones.
                </p>
            </FadeIn>
            <FadeIn delay={0.1}>
                <div className="mb-8">
                    <BayerMatrixViz />
                </div>
            </FadeIn>
            <FadeIn delay={0.15}>
                <CodeBlock lang="glsl" highlight={['cell', 'brightness', 'getValue']}>
                    {CODE_BAYER}
                </CodeBlock>
            </FadeIn>
        </section>
    );
}

function PixelationSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <StepBadge n={3} />
                    <h2 className="text-2xl font-black tracking-tight">The Pixel Grid</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-6 leading-relaxed" style={{ fontSize: '16px' }}>
                    Before dithering, the shader <strong className="text-white">snaps every pixel to the nearest grid corner</strong> using a floor trick. This makes all pixels within a tile share the
                    same source color — creating the blocky, low-fi appearance.
                </p>
                <p className="text-zinc-500 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '14px' }}>
                    The tile size is <Pill>gridSize × pixelSizeRatio</Pill>. <Pill>gridSize</Pill> also controls the Bayer cell size so the two effects stay in sync — each dither cell maps exactly to
                    one pixel tile.
                </p>
            </FadeIn>
            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PixelationDemo />
                    <CodeBlock lang="glsl" highlight={['floor', 'snappedUV', 'pixelSize']}>
                        {CODE_PIXELATION}
                    </CodeBlock>
                </div>
            </FadeIn>
        </section>
    );
}

function ShaderSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <StepBadge n={4} />
                    <h2 className="text-2xl font-black tracking-tight">The Fragment Shader</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-4 leading-relaxed" style={{ fontSize: '16px' }}>
                    <Pill>mainImage</Pill> is the entry point called for every pixel on screen. The three steps above run in sequence — pixelate, compute luminance, apply the Bayer threshold.
                </p>
                <p className="text-zinc-500 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '14px' }}>
                    The <Pill>postprocessing</Pill> library injects this GLSL into a larger shader. It provides <Pill>inputBuffer</Pill> (the rendered scene as a texture) and the framework for passes
                    and uniforms. We only need to write the effect logic inside <Pill>mainImage</Pill>.
                </p>
            </FadeIn>
            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <CodeBlock lang="glsl" highlight={['pixelSize', 'snappedUV', 'luminance', 'getValue', 'outputColor']}>
                            {CODE_MAIN_IMAGE}
                        </CodeBlock>
                    </div>
                    <div className="flex flex-col gap-3">
                        {[
                            {
                                n: '①',
                                label: 'Pixelate',
                                desc: 'Snap UV coordinates to the nearest tile boundary so every pixel in a cell samples the same texel.',
                                color: 'text-amber-300',
                            },
                            {
                                n: '②',
                                label: 'Luminance',
                                desc: 'Sum the RGB channels to get a single brightness number used for the Bayer comparison.',
                                color: 'text-amber-300',
                            },
                            {
                                n: '③',
                                label: 'Threshold',
                                desc: "Look up this pixel's Bayer cell. If luminance is below the threshold, output black — otherwise keep the color.",
                                color: 'text-amber-300',
                            },
                        ].map(({ n, label, desc, color }) => (
                            <div key={label} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`font-black font-mono ${color}`}>{n}</span>
                                    <span className="text-zinc-200 font-bold" style={{ fontSize: '13px' }}>
                                        {label}
                                    </span>
                                </div>
                                <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '12px' }}>
                                    {desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </FadeIn>
        </section>
    );
}

function EffectClassSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <StepBadge n={5} />
                    <h2 className="text-2xl font-black tracking-tight">The Effect Class</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-4 leading-relaxed" style={{ fontSize: '16px' }}>
                    The GLSL shader is just a string. To use it in a post-processing pipeline, we wrap it in a class that extends <Pill>Effect</Pill> from the <Pill>postprocessing</Pill> library. This
                    class owns the <strong className="text-white">uniforms</strong> — typed variables that act as live parameters between JavaScript and GLSL.
                </p>
                <p className="text-zinc-500 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '14px' }}>
                    The <Pill>update()</Pill> method is called every frame. We use it to keep the <Pill>resolution</Pill> uniform in sync with the actual render target size.
                </p>
            </FadeIn>
            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CodeBlock lang="ts" highlight={['Effect', 'uniforms', 'update', 'resolution']}>
                        {CODE_EFFECT_CLASS}
                    </CodeBlock>
                    <div className="flex flex-col gap-4">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                            <p className="text-zinc-400 font-mono uppercase tracking-widest mb-4" style={{ fontSize: '9px' }}>
                                Uniform types in use
                            </p>
                            <div className="flex flex-col gap-3">
                                {[
                                    {
                                        name: 'gridSize',
                                        type: 'float',
                                        desc: 'Controls both the Bayer cell size and the pixelation tile size — they must match.',
                                    },
                                    {
                                        name: 'pixelSizeRatio',
                                        type: 'float',
                                        desc: 'Multiplier on top of gridSize. Push it up for extra-chunky pixels without changing the dither pattern frequency.',
                                    },
                                    {
                                        name: 'grayscaleOnly',
                                        type: 'float (bool)',
                                        desc: 'Sent as 0.0 or 1.0. GLSL has no bool uniform, so we use a float and compare > 0.0.',
                                    },
                                    {
                                        name: 'resolution',
                                        type: 'vec2',
                                        desc: 'The render target dimensions in pixels. Updated every frame so fragCoord → UV conversion stays correct.',
                                    },
                                ].map(({ name, type, desc }) => (
                                    <div key={name} className="flex flex-col gap-0.5">
                                        <div className="flex items-baseline gap-2">
                                            <Pill>{name}</Pill>
                                            <span className="text-amber-500/70 font-mono" style={{ fontSize: '11px' }}>
                                                {type}
                                            </span>
                                        </div>
                                        <p className="text-zinc-500 leading-relaxed" style={{ fontSize: '12px' }}>
                                            {desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Callout variant="info">
                            GLSL doesn&apos;t have a boolean uniform type. Pass <Pill>grayscaleOnly</Pill> as <strong className="text-sky-200">0.0 or 1.0</strong> and check{' '}
                            <Pill>{'grayscaleOnly > 0.0'}</Pill> in the shader. This is the standard workaround.
                        </Callout>
                    </div>
                </div>
            </FadeIn>
        </section>
    );
}

function PipelineSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <StepBadge n={6} />
                    <h2 className="text-2xl font-black tracking-tight">The Post-Processing Stack</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-4 leading-relaxed" style={{ fontSize: '16px' }}>
                    An <Pill>EffectComposer</Pill> chains passes in order. Each pass reads from the previous pass&apos;s output texture and writes to its own. The scene is rendered once; every
                    subsequent pass is just a full-screen quad shader.
                </p>
                <p className="text-zinc-500 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '14px' }}>
                    We manage the composer manually with <Pill>useFrame</Pill> (priority 1 runs after the scene update) rather than using <Pill>@react-three/postprocessing</Pill>, so we have full
                    control over pass order and re-building when parameters change.
                </p>
            </FadeIn>
            <FadeIn delay={0.1}>
                <div className="flex flex-col gap-6">
                    <PipelineDiagram />
                    <CodeBlock lang="tsx" highlight={['EffectComposer', 'RenderPass', 'EffectPass', 'DitheringEffect', 'useFrame']}>
                        {CODE_PIPELINE}
                    </CodeBlock>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Callout variant="tip">
                            <strong className="text-amber-300">Bloom before dithering</strong> spreads highlights across more tiles before the threshold test — making bright areas bloom out into the
                            dot pattern.
                        </Callout>
                        <Callout variant="tip">
                            <strong className="text-amber-300">Bloom after dithering</strong> softens the hard black dots, adding a halation glow to the finished dithered image.
                        </Callout>
                    </div>
                </div>
            </FadeIn>
        </section>
    );
}

function WrapUpSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <StepBadge n={7} />
                    <h2 className="text-2xl font-black tracking-tight">All Together</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    The six concepts chain into a single render pass that runs entirely on the GPU — the only CPU work per frame is syncing the <Pill>resolution</Pill> uniform.
                </p>
            </FadeIn>
            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mb-10">
                    {[
                        { n: '1', label: 'Luminance', desc: 'Collapse RGB → single brightness float' },
                        { n: '2', label: 'Bayer Matrix', desc: '4×4 threshold map — 16 unique decision levels' },
                        { n: '3', label: 'Pixelation', desc: 'Floor trick — all pixels in a tile share one sample' },
                        { n: '4', label: 'Fragment Shader', desc: 'mainImage runs steps 1-3 per pixel in GLSL' },
                        { n: '5', label: 'Effect Class', desc: 'Uniforms bridge JS params → GLSL per frame' },
                        { n: '6', label: 'Composer', desc: 'Ordered pass chain — render → dither → optional bloom' },
                    ].map(({ n, label, desc }) => (
                        <div key={label} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-amber-500/60 font-black font-mono" style={{ fontSize: '11px' }}>
                                    {n}
                                </span>
                                <span className="text-zinc-200 font-bold" style={{ fontSize: '13px' }}>
                                    {label}
                                </span>
                            </div>
                            <p className="text-zinc-500" style={{ fontSize: '12px' }}>
                                {desc}
                            </p>
                        </div>
                    ))}
                </div>
            </FadeIn>
            <FadeIn delay={0.15}>
                <div className="flex flex-wrap items-center gap-4">
                    <Link
                        href="/dithering"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-colors"
                        style={{ fontSize: '14px' }}
                    >
                        Open the live demo →
                    </Link>
                    <Link href="/" className="text-zinc-500 hover:text-zinc-300 font-mono transition-colors" style={{ fontSize: '13px' }}>
                        ← Back home
                    </Link>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function DitheringLearnPage() {
    return (
        <main className="min-h-screen bg-[#080810] text-white">
            <HeroSection />
            <SectionRule />
            <TheIllusionSection />
            <SectionRule />
            <LuminanceSection />
            <SectionRule />
            <BayerSection />
            <SectionRule />
            <PixelationSection />
            <SectionRule />
            <ShaderSection />
            <SectionRule />
            <EffectClassSection />
            <SectionRule />
            <PipelineSection />
            <SectionRule />
            <WrapUpSection />
            <div className="h-24" />
        </main>
    );
}

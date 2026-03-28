'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { CodeBlock } from '@/components/code-block';
import { FadeIn, NOISE_BG } from '@/components/fade-in';
import { noise3D } from '@/modules/pages/OmmaCubes/noise';
import type { NoiseType } from '@/modules/pages/OmmaCubes/types';

// ─── shared primitives ────────────────────────────────────────────────────────

function Tag({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono tracking-wider uppercase border bg-sky-500/10 text-sky-400 border-sky-500/20" style={{ fontSize: '10px' }}>
            {children}
        </span>
    );
}

function StepBadge({ n }: { n: number }) {
    return (
        <span className="inline-flex items-center justify-center size-7 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 font-black font-mono shrink-0" style={{ fontSize: '12px' }}>
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
    return <div className="my-20 h-px bg-gradient-to-r from-sky-500/20 via-sky-500/5 to-transparent" />;
}

function Callout({ children, variant = 'tip' }: { children: React.ReactNode; variant?: 'tip' | 'info' | 'warn' }) {
    const styles = {
        tip: 'bg-sky-500/5 border-sky-500/20 text-sky-200/90',
        info: 'bg-indigo-500/5 border-indigo-500/20 text-indigo-200/90',
        warn: 'bg-amber-500/5 border-amber-500/20 text-amber-200/90',
    };
    const icons = { tip: '💡', info: 'ℹ️', warn: '⚠️' };
    return (
        <div className={`border rounded-xl px-4 py-3 leading-relaxed flex gap-2.5 ${styles[variant]}`} style={{ fontSize: '13px' }}>
            <span className="shrink-0 mt-0.5">{icons[variant]}</span>
            <span>{children}</span>
        </div>
    );
}

// ─── interactive demos ────────────────────────────────────────────────────────

function computeNoise(x: number, y: number, z: number, type: NoiseType, freq: number): number {
    const nx = x * freq;
    const ny = y * freq;
    const nz = z * freq;
    switch (type) {
        case 'ridged':
            return 1.0 - Math.abs(noise3D(nx, ny, nz)) * 2.0;
        case 'billow':
            return Math.abs(noise3D(nx, ny, nz)) * 2.0 - 0.5;
        case 'fbm':
            return noise3D(nx, ny, nz) * 0.5 + noise3D(nx * 2, ny * 2, nz * 2) * 0.25 + noise3D(nx * 4, ny * 4, nz * 4) * 0.125;
        case 'waveRadial': {
            const d = Math.sqrt((x - 9.5) ** 2 + (y - 9.5) ** 2 + (z - 9.5) ** 2);
            return Math.sin(d * freq * 2.0);
        }
        case 'wavePlanar':
            return Math.sin(x * freq * 1.5) * Math.sin(y * freq * 1.5) * Math.sin(z * freq * 1.5);
        case 'waveCross':
            return (Math.sin(x * freq * 2.0) + Math.sin(y * freq * 2.0) + Math.sin(z * freq * 2.0)) / 3.0;
        case 'waveSpiral': {
            const cx = x - 9.5,
                cz = z - 9.5;
            const angle = Math.atan2(cz, cx);
            const dist = Math.sqrt(cx ** 2 + cz ** 2);
            return Math.sin(dist * freq * 2.0 + angle * 3.0) * Math.cos(y * freq * 1.5);
        }
        case 'waveDiamond': {
            const m = Math.abs(x - 9.5) + Math.abs(y - 9.5) + Math.abs(z - 9.5);
            return Math.sin(m * freq * 1.2);
        }
        default:
            return noise3D(nx, ny, nz);
    }
}

const NOISE_TYPES: NoiseType[] = ['perlin', 'ridged', 'billow', 'fbm', 'waveRadial', 'wavePlanar', 'waveCross', 'waveSpiral', 'waveDiamond'];

function NoiseVisualizer() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [noiseType, setNoiseType] = useState<NoiseType>('perlin');
    const [freq, setFreq] = useState(0.25);
    const [exag, setExag] = useState(1.3);
    const [slice, setSlice] = useState(9.5); // z slice through the 3D field

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        const W = canvas.width;
        const H = canvas.height;
        const img = ctx.createImageData(W, H);
        const d = img.data;

        for (let py = 0; py < H; py++) {
            for (let px = 0; px < W; px++) {
                const x = (px / W) * 19;
                const y = (py / H) * 19;
                const n = computeNoise(x, y, slice, noiseType, freq);
                const nNorm = Math.pow(Math.max(0, Math.min(1, n * 0.5 + 0.5)), exag);
                const v = Math.round(nNorm * 255);
                const i = (py * W + px) * 4;
                d[i] = v;
                d[i + 1] = v;
                d[i + 2] = v;
                d[i + 3] = 255;
            }
        }
        ctx.putImageData(img, 0, 0);
    }, [noiseType, freq, exag, slice]);

    useEffect(() => {
        draw();
    }, [draw]);

    return (
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-start gap-4">
                <div className="flex flex-col gap-1.5 shrink-0">
                    <p className="text-zinc-500 font-mono uppercase tracking-widest" style={{ fontSize: '9px' }}>
                        2D slice of 3D noise field
                    </p>
                    <canvas ref={canvasRef} width={200} height={200} className="rounded-lg border border-zinc-700" style={{ imageRendering: 'pixelated', width: 200, height: 200 }} />
                </div>
                <div className="flex-1 flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        <span className="text-zinc-400 font-mono" style={{ fontSize: '11px' }}>
                            Type
                        </span>
                        <select
                            value={noiseType}
                            onChange={(e) => setNoiseType(e.target.value as NoiseType)}
                            className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-md px-2 py-1.5 font-mono"
                            style={{ fontSize: '12px' }}
                        >
                            {NOISE_TYPES.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </div>
                    {[
                        { label: 'Freq', val: freq, min: 0.05, max: 0.8, step: 0.01, set: setFreq },
                        { label: 'Exag', val: exag, min: 0.1, max: 3.0, step: 0.05, set: setExag },
                        { label: 'Z slice', val: slice, min: 0, max: 19, step: 0.1, set: setSlice },
                    ].map(({ label, val, min, max, step, set }) => (
                        <label key={label} className="flex flex-col gap-1">
                            <div className="flex justify-between">
                                <span className="text-zinc-400 font-mono" style={{ fontSize: '11px' }}>
                                    {label}
                                </span>
                                <span className="text-sky-300 font-mono font-bold" style={{ fontSize: '11px' }}>
                                    {val.toFixed(2)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={min}
                                max={max}
                                step={step}
                                value={val}
                                onChange={(e) => set(parseFloat(e.target.value))}
                                className="w-full h-1 appearance-none rounded-full bg-zinc-700 accent-sky-500 cursor-pointer"
                            />
                        </label>
                    ))}
                </div>
            </div>
            <p className="text-zinc-500 leading-relaxed" style={{ fontSize: '12px' }}>
                {'Each pixel samples '}
                <Pill>{'noise3D(x, y, z)'}</Pill>
                {' where x/y map to the 20×20 grid and z is the slice. Drag the '}
                <strong className="text-zinc-300">{'Z slice'}</strong>
                {' slider to move through the 3D field — notice how neighbouring slices look similar (that\u2019s the continuity property of Perlin noise).'}
            </p>
        </div>
    );
}

function ColorLerpDemo() {
    const [brightHex, setBrightHex] = useState('#ffffff');
    const [darkHex, setDarkHex] = useState('#000000');
    const [noiseVal, setNoiseVal] = useState(0.6);
    const [contrast, setContrast] = useState(2.78);
    const [colorMix, setColorMix] = useState(1.0);

    const contrasted = Math.pow(noiseVal, contrast);

    function hexToRgb(hex: string) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return { r, g, b };
    }
    function lerp(a: number, b: number, t: number) {
        return a + (b - a) * t;
    }

    const d = hexToRgb(darkHex);
    const br = hexToRgb(brightHex);
    const r = Math.min(1, lerp(d.r, br.r, contrasted) * colorMix);
    const g = Math.min(1, lerp(d.g, br.g, contrasted) * colorMix);
    const b = Math.min(1, lerp(d.b, br.b, contrasted) * colorMix);
    const resultCss = `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;

    const curve = Array.from({ length: 60 }, (_, i) => {
        const t = i / 59;
        return { t, y: Math.pow(t, contrast) };
    });
    const svgW = 120,
        svgH = 60;

    return (
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-5 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                    <div className="flex gap-3 items-center">
                        <div className="flex flex-col gap-1 items-center">
                            <p className="text-zinc-500 font-mono uppercase tracking-widest" style={{ fontSize: '9px' }}>
                                Dark
                            </p>
                            <input type="color" value={darkHex} onChange={(e) => setDarkHex(e.target.value)} className="size-10 rounded cursor-pointer border border-zinc-700 bg-transparent p-0.5" />
                        </div>
                        <div className="flex flex-col gap-1 items-center">
                            <p className="text-zinc-500 font-mono uppercase tracking-widest" style={{ fontSize: '9px' }}>
                                Bright
                            </p>
                            <input
                                type="color"
                                value={brightHex}
                                onChange={(e) => setBrightHex(e.target.value)}
                                className="size-10 rounded cursor-pointer border border-zinc-700 bg-transparent p-0.5"
                            />
                        </div>
                        <div className="flex flex-col gap-1 flex-1 items-center">
                            <p className="text-zinc-500 font-mono uppercase tracking-widest" style={{ fontSize: '9px' }}>
                                Result
                            </p>
                            <div className="size-10 rounded border border-zinc-700" style={{ background: resultCss }} />
                        </div>
                    </div>
                    {[
                        { label: 'Noise value', val: noiseVal, min: 0, max: 1, step: 0.01, set: setNoiseVal },
                        { label: 'Contrast', val: contrast, min: 0.1, max: 5, step: 0.05, set: setContrast },
                        { label: 'Color mix', val: colorMix, min: 0, max: 3, step: 0.05, set: setColorMix },
                    ].map(({ label, val, min, max, step, set }) => (
                        <label key={label} className="flex flex-col gap-1">
                            <div className="flex justify-between">
                                <span className="text-zinc-400 font-mono" style={{ fontSize: '11px' }}>
                                    {label}
                                </span>
                                <span className="text-sky-300 font-mono font-bold" style={{ fontSize: '11px' }}>
                                    {val.toFixed(2)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={min}
                                max={max}
                                step={step}
                                value={val}
                                onChange={(e) => set(parseFloat(e.target.value))}
                                className="w-full h-1 appearance-none rounded-full bg-zinc-700 accent-sky-500 cursor-pointer"
                            />
                        </label>
                    ))}
                </div>
                <div className="flex flex-col gap-2">
                    <p className="text-zinc-500 font-mono uppercase tracking-widest" style={{ fontSize: '9px' }}>
                        Contrast curve pow(t, {contrast.toFixed(2)})
                    </p>
                    <svg width={svgW} height={svgH} className="rounded border border-zinc-700/60 bg-zinc-900">
                        <polyline points={curve.map(({ t, y }) => `${t * svgW},${svgH - y * svgH}`).join(' ')} fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                        {/* marker for current noise val */}
                        <circle cx={noiseVal * svgW} cy={svgH - Math.pow(noiseVal, contrast) * svgH} r="3" fill="#38bdf8" />
                        <line x1={noiseVal * svgW} y1={0} x2={noiseVal * svgW} y2={svgH} stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5" />
                    </svg>
                    <p className="text-zinc-500 leading-relaxed" style={{ fontSize: '11px' }}>
                        Input: <span className="text-zinc-200">{noiseVal.toFixed(2)}</span>
                        {' → '}contrasted: <span className="text-sky-300">{contrasted.toFixed(3)}</span>
                    </p>
                    <div className="mt-auto rounded border border-zinc-700/60 overflow-hidden" style={{ height: 28 }}>
                        <div
                            className="h-full w-full"
                            style={{
                                background: `linear-gradient(to right, ${darkHex}, ${brightHex})`,
                            }}
                        />
                    </div>
                    <p className="text-zinc-500 font-mono" style={{ fontSize: '10px' }}>
                        dark → bright gradient
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── code snippets ─────────────────────────────────────────────────────────────

const SNIPPET_DEPS = `
# Install once — Three.js, R3F, and Drei helpers
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
`.trim();

const SNIPPET_NOISE = `
// noise.ts — 3D value noise with smooth interpolation
function mod289(x: number) { return x - Math.floor(x / 289) * 289; }
function permute(x: number) { return mod289((x * 34 + 1) * x); }

function grad(hash: number, x: number, y: number, z: number): number {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
}

export function noise3D(x: number, y: number, z: number): number {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
  const fx = x - Math.floor(x), fy = y - Math.floor(y), fz = z - Math.floor(z);
  // Smoothstep: 6t⁵ − 15t⁴ + 10t³  (Perlin's improved fade)
  const u = fx*fx*fx*(fx*(fx*6-15)+10);
  const v = fy*fy*fy*(fy*(fy*6-15)+10);
  const w = fz*fz*fz*(fz*(fz*6-15)+10);

  const A = permute(X)+Y, B = permute(X+1)+Y;
  const AA = permute(A)+Z, AB = permute(A+1)+Z;
  const BA = permute(B)+Z, BB = permute(B+1)+Z;

  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  return lerp(
    lerp(lerp(grad(permute(AA),   fx,   fy,   fz),   grad(permute(BA),   fx-1, fy,   fz),   u),
         lerp(grad(permute(AB),   fx,   fy-1, fz),   grad(permute(BB),   fx-1, fy-1, fz),   u), v),
    lerp(lerp(grad(permute(AA+1), fx,   fy,   fz-1), grad(permute(BA+1), fx-1, fy,   fz-1), u),
         lerp(grad(permute(AB+1), fx,   fy-1, fz-1), grad(permute(BB+1), fx-1, fy-1, fz-1), u), v), w);
}
`.trim();

const SNIPPET_TYPES = `
// types.ts
export type NoiseType = 'perlin' | 'ridged' | 'billow' | 'fbm'
  | 'waveRadial' | 'wavePlanar' | 'waveCross' | 'waveSpiral' | 'waveDiamond';

export type Params = {
  speed: number; freq: number; exag: number; scaleMax: number;
  brightColor: string; darkColor: string; bgColor: string;
  colorMix: number; contrast: number; noiseType: NoiseType;
  scaleX: number; scaleY: number; scaleZ: number;
  gridX: number; gridY: number; gridZ: number;
};

export const DEFAULT_PARAMS: Params = {
  speed: 1.01, freq: 0.25, exag: 1.3, scaleMax: 3.0,
  brightColor: '#ffffff', darkColor: '#000000', bgColor: '#808080',
  colorMix: 3.0, contrast: 2.78, noiseType: 'perlin',
  scaleX: 1.0, scaleY: 1.0, scaleZ: 1.0,
  gridX: 20, gridY: 20, gridZ: 20,
};
`.trim();

const SNIPPET_INSTANCED_SETUP = `
// CubeGrid.tsx — declare module-level temporaries once, reuse every frame
const MAX_GRID = 20;
const MAX_CUBES = MAX_GRID ** 3;          // 8 000 instances
const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0); // hides inactive cubes

// Reusable scratch objects — never recreated, same GC pressure as vanilla JS
const _matrix = new THREE.Matrix4();
const _pos    = new THREE.Vector3();
const _quat   = new THREE.Quaternion();
const _scale  = new THREE.Vector3();
const _color  = new THREE.Color();

export function CubeGrid({ paramsRef }: { paramsRef: { current: Params } }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const geometry = useMemo(() => new THREE.BoxGeometry(0.85, 0.85, 0.85), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    metalness: 0.15, roughness: 0.6
  }), []);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, MAX_CUBES]}  // pre-allocates GPU buffer for 8k instances
      castShadow receiveShadow
    />
  );
}
`.trim();

const SNIPPET_USEFRAME = `
useFrame(({ clock }) => {
  const mesh = meshRef.current;
  const p    = paramsRef.current;   // read params directly — no React re-renders
  const t    = clock.getElapsedTime();

  const gx = Math.round(p.gridX), gy = Math.round(p.gridY), gz = Math.round(p.gridZ);
  const offsetX = (gx - 1) * GAP * 0.5; // centre the grid around origin
  const offsetY = (gy - 1) * GAP * 0.5;
  const offsetZ = (gz - 1) * GAP * 0.5;

  let idx = 0;
  for (let x = 0; x < gx; x++) {
    for (let y = 0; y < gy; y++) {
      for (let z = 0; z < gz; z++) {
        // Remap grid index → normalised 0-19 range so noise looks the
        // same regardless of how many cubes are active
        const normX = gx > 1 ? (x / (gx - 1)) * 19 : 9.5;
        const normY = gy > 1 ? (y / (gy - 1)) * 19 : 9.5;
        const normZ = gz > 1 ? (z / (gz - 1)) * 19 : 9.5;

        // Advance noise coordinates through time (each axis at a different rate
        // so the animation doesn't look axis-aligned)
        const nx = normX * p.freq + t * p.speed;
        const ny = normY * p.freq + t * p.speed * 0.7;
        const nz = normZ * p.freq + t * p.speed * 0.5;

        const n     = noise3D(nx, ny, nz);              // −1 → +1
        const nNorm = Math.pow(                          // 0  → 1, exaggerated
          Math.max(0, Math.min(1, n * 0.5 + 0.5)),
          p.exag
        );
        const s = 0.02 + nNorm * nNorm * p.scaleMax;    // min size + quadratic ramp

        _pos.set(x * GAP - offsetX, y * GAP - offsetY, z * GAP - offsetZ);
        _scale.set(s * p.scaleX, s * p.scaleY, s * p.scaleZ);
        _matrix.compose(_pos, _quat.identity(), _scale);
        mesh.setMatrixAt(idx, _matrix);
        idx++;
      }
    }
  }

  // Zero out any inactive instances beyond the current grid
  for (let i = idx; i < MAX_CUBES; i++) mesh.setMatrixAt(i, zeroMatrix);

  mesh.instanceMatrix.needsUpdate = true;
});
`.trim();

const SNIPPET_NOISE_VARIANTS = `
// Each variant samples the same noise3D() but transforms the output differently

switch (p.noiseType) {
  // ── classic Perlin — values cross zero, giving smooth dark/bright bands
  default:          n = noise3D(nx, ny, nz);  break;

  // ── Ridged — abs() folds negative values upward → sharp bright ridges
  case 'ridged':    n = 1 - Math.abs(noise3D(nx, ny, nz)) * 2;  break;

  // ── Billow — abs() folds upward → puffy cloud-like shapes
  case 'billow':    n = Math.abs(noise3D(nx, ny, nz)) * 2 - 0.5;  break;

  // ── fBm — fractal Brownian motion: sum 3 octaves, each at 2× frequency
  //    and ½ amplitude → more detailed, natural-looking turbulence
  case 'fbm':
    n = noise3D(nx, ny, nz)       * 0.5     // octave 1 — coarse
      + noise3D(nx*2, ny*2, nz*2) * 0.25   // octave 2
      + noise3D(nx*4, ny*4, nz*4) * 0.125; // octave 3 — fine
    break;

  // ── Radial wave — sin on Euclidean distance from centre
  case 'waveRadial': {
    const d = Math.sqrt((normX-9.5)**2 + (normY-9.5)**2 + (normZ-9.5)**2);
    n = Math.sin(d * p.freq * 2 - t * p.speed * 3);
    break;
  }

  // ── Spiral wave — sin on polar distance + rotation angle
  case 'waveSpiral': {
    const cx = normX-9.5, cz = normZ-9.5;
    n = Math.sin(Math.sqrt(cx**2+cz**2) * p.freq*2 + Math.atan2(cz,cx)*3 - t*p.speed*3)
      * Math.cos(y * p.freq*1.5 + t*p.speed);
    break;
  }
}
`.trim();

const SNIPPET_COLOR = `
// After computing nNorm (0-1), apply a power-curve contrast adjustment,
// then lerp between the user's dark and bright colours.
// multiplyScalar is the "exposure" / color mix boost.

_bright.set(p.brightColor);
_dark.set(p.darkColor);

const contrasted = Math.pow(nNorm, p.contrast);  // >1 → increase contrast
                                                  // <1 → flatten towards mid

_color
  .copy(_dark)
  .lerp(_bright, contrasted)   // dark → bright based on noise
  .multiplyScalar(p.colorMix); // overall brightness / bloom-like boost

mesh.setColorAt(idx, _color);
mesh.instanceColor!.needsUpdate = true;
`.trim();

const SNIPPET_PARAMS_REF = `
// ── The core pattern: params live in a ref, not React state ──────────────────
//
// If params were useState, every slider drag would trigger a React re-render.
// Since useFrame reads params 60× per second, that's fine — but slider input
// events would also fire React's reconciler on every pixel moved.
// A ref sidesteps this completely: writes from the UI are instant,
// reads from useFrame are instant, zero overhead.

// In OmmaCubesPage.tsx:
const paramsRef = useRef<Params>({ ...DEFAULT_PARAMS });

// In ControlPanel.tsx (uncontrolled inputs):
<input
  type="range"
  defaultValue={p.speed}
  onChange={(e) => { paramsRef.current.speed = parseFloat(e.target.value); }}
/>
// Local useState is only needed to display the current value in the <span>
`.trim();

const SNIPPET_CAMERA = `
// Two cameras share the same position on toggle.
// CamSync tracks position every frame via useFrame into a ref
// the parent can read synchronously when the button is clicked.

function CamSync({ posRef }: { posRef: { current: THREE.Vector3 } }) {
  useFrame(({ camera }) => { posRef.current.copy(camera.position); });
  return null;
}

function SceneCamera({ state }: { state: CameraState }) {
  const p = state.pos;
  if (state.isOrtho)
    return <OrthographicCamera makeDefault position={p} zoom={20} near={0.1} far={500} />;
  return <PerspectiveCamera makeDefault fov={60} position={p} near={0.1} far={500} />;
}

// In the parent — key forces both camera + controls to remount on switch,
// matching the original's OrbitControls.dispose() + new OrbitControls() pattern
<SceneCamera key={isOrtho ? 'ortho' : 'persp'} state={camState} />
<OrbitControls key={isOrtho ? 'ortho-ctrl' : 'persp-ctrl'}
  enableDamping dampingFactor={0.08} minDistance={10} maxDistance={100} />
`.trim();

const SNIPPET_CANVAS = `
// OmmaCubesPage.tsx — the root layout
export function OmmaCubesPage() {
  const paramsRef = useRef<Params>({ ...DEFAULT_PARAMS });
  const camPosRef = useRef(new THREE.Vector3(30, 25, 30));
  const [bgColor,   setBgColor]   = useState('#808080');
  const [camState,  setCamState]  = useState({ isOrtho: false, pos: [30,25,30] });

  return (
    <div className="fixed inset-0">
      <Canvas shadows style={{ position: 'fixed', inset: 0 }}>
        <color attach="background" args={[bgColor]} />

        <SceneCamera key={camState.isOrtho ? 'ortho':'persp'} state={camState} />
        <OrbitControls key={camState.isOrtho ? 'o':'p'}
          enableDamping dampingFactor={0.08} minDistance={10} maxDistance={100} />

        <ambientLight intensity={0.6} />
        <directionalLight position={[40,60,30]} intensity={1.2} castShadow
          shadow-mapSize={[2048,2048]} shadow-bias={-0.001} />
        <hemisphereLight args={['#aaccff','#446644',0.4]} />

        <CubeGrid paramsRef={paramsRef} />
        <CamSync posRef={camPosRef} />
      </Canvas>

      {/* HTML overlay — outside Canvas, renders on top via z-index */}
      <ControlPanel paramsRef={paramsRef} isOrtho={camState.isOrtho}
        onToggleCamera={() => {
          const {x,y,z} = camPosRef.current;
          setCamState(prev => ({ isOrtho: !prev.isOrtho, pos: [x,y,z] }));
        }}
        onBgChange={setBgColor}
      />
    </div>
  );
}
`.trim();

// ─── page ─────────────────────────────────────────────────────────────────────

export default function OmmaCubesLearnPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0f] text-zinc-100" style={NOISE_BG}>
            {/* hero */}
            <div className="max-w-3xl mx-auto px-6 pt-24 pb-16">
                <FadeIn>
                    <Link href="/omma-3d-cubes" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors mb-10 font-mono" style={{ fontSize: '12px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 5l-7 7 7 7" />
                        </svg>
                        Back to demo
                    </Link>
                    <div className="flex flex-wrap gap-2 mb-6">
                        <Tag>Three.js</Tag>
                        <Tag>React Three Fiber</Tag>
                        <Tag>Perlin Noise</Tag>
                        <Tag>InstancedMesh</Tag>
                        <Tag>useFrame</Tag>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight mb-4 bg-gradient-to-br from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">Animating 8,000 cubes with 3D noise</h1>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                        A complete walkthrough of how a 20×20×20 grid of instanced cubes is driven by Perlin noise in real time — covering GPU-instanced rendering, the noise math, animation patterns,
                        and parameter-driven UI in React Three Fiber.
                    </p>
                </FadeIn>
            </div>

            <div className="max-w-3xl mx-auto px-6 pb-32 flex flex-col gap-16">
                {/* concept cards */}
                <FadeIn>
                    <div className="grid sm:grid-cols-3 gap-4">
                        {[
                            {
                                icon: '⚡',
                                title: 'GPU Instancing',
                                desc: 'Draw 8,000 cubes in a single GPU draw call using InstancedMesh. Without it you would need 8,000 separate draw calls — a 100× performance cliff.',
                            },
                            {
                                icon: '🌊',
                                title: '3D Perlin Noise',
                                desc: 'A smooth, continuous random field in three dimensions. Sampling (x, y, z + time) gives every cube a unique, silky-smooth scale that evolves over time.',
                            },
                            {
                                icon: '🔄',
                                title: 'Ref-driven animation',
                                desc: 'Params live in a useRef, not useState. The animation loop reads them directly every frame — no React reconciler overhead on slider input.',
                            },
                        ].map(({ icon, title, desc }) => (
                            <div key={title} className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col gap-2">
                                <span className="text-2xl">{icon}</span>
                                <h3 className="font-bold text-zinc-100" style={{ fontSize: '14px' }}>
                                    {title}
                                </h3>
                                <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '13px' }}>
                                    {desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </FadeIn>

                <SectionRule />

                {/* step 1 */}
                <FadeIn>
                    <div className="flex gap-4">
                        <StepBadge n={1} />
                        <div className="flex flex-col gap-4 flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-zinc-100">Install dependencies</h2>
                            <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '14px' }}>
                                You need <Pill>three</Pill>, the React wrapper <Pill>@react-three/fiber</Pill>, and the helper library <Pill>@react-three/drei</Pill> which provides ready-made{' '}
                                <Pill>OrbitControls</Pill>, camera components and more.
                            </p>
                            <CodeBlock lang="bash">{SNIPPET_DEPS}</CodeBlock>
                        </div>
                    </div>
                </FadeIn>

                {/* step 2 */}
                <FadeIn>
                    <div className="flex gap-4">
                        <StepBadge n={2} />
                        <div className="flex flex-col gap-4 flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-zinc-100">Implement 3D Perlin noise</h2>
                            <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '14px' }}>
                                Perlin noise works by hashing 3D integer lattice points into gradient vectors, then smoothly interpolating between them with a{' '}
                                <strong className="text-zinc-200">fade curve</strong> (smoothstep). The result is a value in <Pill>−1 → +1</Pill> that changes slowly as coordinates change — perfect
                                for organic-looking animation.
                            </p>
                            <div className="grid sm:grid-cols-3 gap-3 text-zinc-400 bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4">
                                {[
                                    ['Hash', 'Integer lattice corners are permuted into pseudo-random gradient indices'],
                                    ['Gradient', 'Each corner contributes a dot product of its gradient with the fractional offset'],
                                    ['Interpolate', 'Trilinear interpolation with the smoothstep fade gives continuous output'],
                                ].map(([t, d]) => (
                                    <div key={t as string}>
                                        <p className="text-sky-400 font-mono font-bold mb-1" style={{ fontSize: '11px' }}>
                                            {t}
                                        </p>
                                        <p style={{ fontSize: '12px' }}>{d}</p>
                                    </div>
                                ))}
                            </div>
                            <CodeBlock lang="ts" highlight={['smoothstep', 'fade', 'lerp']}>
                                {SNIPPET_NOISE}
                            </CodeBlock>
                            <Callout variant="tip">
                                {'Keep this file pure TypeScript with no imports \u2014 it\u2019s called inside '}
                                <Pill>{'useFrame'}</Pill>
                                {' 8,000 times per frame. Any extra indirection adds up.'}
                            </Callout>
                        </div>
                    </div>
                </FadeIn>

                {/* interactive noise demo */}
                <FadeIn delay={0.05}>
                    <div className="flex flex-col gap-3">
                        <p className="text-zinc-500 font-mono uppercase tracking-widest" style={{ fontSize: '10px' }}>
                            Interactive — explore the noise field
                        </p>
                        <NoiseVisualizer />
                        <Callout variant="info">
                            {'This renders a 2D horizontal slice of the same '}
                            <Pill>{'noise3D'}</Pill>
                            {' function used in the demo. Move the '}
                            <strong className="text-indigo-300">{'Z slice'}</strong>
                            {' slider to walk through the 3D field depth and notice the continuity between slices \u2014 that\u2019s Perlin\u2019s key property.'}
                        </Callout>
                    </div>
                </FadeIn>

                <SectionRule />

                {/* step 3 */}
                <FadeIn>
                    <div className="flex gap-4">
                        <StepBadge n={3} />
                        <div className="flex flex-col gap-4 flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-zinc-100">Define shared types and default params</h2>
                            <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '14px' }}>
                                All 16 parameters (noise type, speed, frequencies, colors, grid size…) live in a single typed <Pill>Params</Pill> object. Centralising them here means the canvas loop
                                and the control panel share exactly the same shape without prop-drilling separate values.
                            </p>
                            <CodeBlock lang="ts">{SNIPPET_TYPES}</CodeBlock>
                        </div>
                    </div>
                </FadeIn>

                {/* step 4 */}
                <FadeIn>
                    <div className="flex gap-4">
                        <StepBadge n={4} />
                        <div className="flex flex-col gap-4 flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-zinc-100">Set up InstancedMesh</h2>
                            <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '14px' }}>
                                <Pill>THREE.InstancedMesh</Pill> lets you render thousands of copies of one geometry in a <strong className="text-zinc-200">single draw call</strong>. You tell it the
                                max count upfront (<Pill>8000</Pill> = 20³) and it pre-allocates the GPU buffer. Every frame you write a 4×4 matrix per instance to set position/scale — and optionally
                                a per-instance color.
                            </p>
                            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 flex gap-6">
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-red-400 font-mono font-black text-2xl">8,000</span>
                                    <span className="text-zinc-500 font-mono" style={{ fontSize: '10px' }}>
                                        draw calls (naive)
                                    </span>
                                </div>
                                <div className="flex items-center text-zinc-600 font-mono text-xl">→</div>
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-sky-400 font-mono font-black text-2xl">1</span>
                                    <span className="text-zinc-500 font-mono" style={{ fontSize: '10px' }}>
                                        draw call (instanced)
                                    </span>
                                </div>
                            </div>
                            <CodeBlock lang="tsx" highlight={['InstancedMesh', 'MAX_CUBES', 'useMemo']}>
                                {SNIPPET_INSTANCED_SETUP}
                            </CodeBlock>
                            <Callout variant="tip">
                                Declare <Pill>_matrix</Pill>, <Pill>_pos</Pill>, <Pill>_scale</Pill>, <Pill>_color</Pill> and similar scratch objects at{' '}
                                <strong className="text-sky-300">module level</strong>, not inside
                                <Pill>useFrame</Pill>. Allocating new <Pill>THREE.Vector3</Pill> objects every frame creates GC pressure that causes subtle frame-rate stutters at scale.
                            </Callout>
                        </div>
                    </div>
                </FadeIn>

                {/* step 5 */}
                <FadeIn>
                    <div className="flex gap-4">
                        <StepBadge n={5} />
                        <div className="flex flex-col gap-4 flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-zinc-100">Drive each cube with noise in useFrame</h2>
                            <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '14px' }}>
                                <Pill>{'useFrame'}</Pill>
                                {' is R3F\u2019s animation hook \u2014 it runs before each render, synchronized with the browser\u2019s '}
                                <Pill>{'requestAnimationFrame'}</Pill>
                                {'. Inside, we loop over every active cube, evaluate the noise field at its '}
                                <Pill>{'(x, y, z + time)'}</Pill>
                                {' coordinate, and write a matrix and color back into the instanced mesh.'}
                            </p>
                            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 grid sm:grid-cols-2 gap-4 text-zinc-400">
                                {[
                                    ['Normalise coords', 'Remap grid index to a 0–19 range so the same noise pattern appears regardless of grid size (4³ looks like 20³ just zoomed in)'],
                                    ['Offset time per axis', "Multiply time by 1.0, 0.7, 0.5 on X/Y/Z so the wave doesn't look axis-aligned — each axis drifts at a different speed"],
                                    ['Power curve scale', 's = 0.02 + nNorm² × scaleMax — the quadratic ramp gives a sharper difference between small and large cubes'],
                                    ['Centred grid', 'Subtract offset = (count − 1) × gap × 0.5 from each axis so the grid is always centred on the origin'],
                                ].map(([t, d]) => (
                                    <div key={t as string}>
                                        <p className="text-sky-400 font-mono font-bold mb-1" style={{ fontSize: '11px' }}>
                                            {t}
                                        </p>
                                        <p style={{ fontSize: '12px' }}>{d}</p>
                                    </div>
                                ))}
                            </div>
                            <CodeBlock lang="tsx" highlight={['normX', 'normY', 'normZ', 'nNorm', 'useFrame']}>
                                {SNIPPET_USEFRAME}
                            </CodeBlock>
                        </div>
                    </div>
                </FadeIn>

                {/* step 6 */}
                <FadeIn>
                    <div className="flex gap-4">
                        <StepBadge n={6} />
                        <div className="flex flex-col gap-4 flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-zinc-100">Noise variants — nine ways to sculpt the field</h2>
                            <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '14px' }}>
                                All nine noise types share the same <Pill>noise3D</Pill> function or use sin/cos — what differs is how the raw output is{' '}
                                <strong className="text-zinc-200">transformed</strong> before being fed into the scale and color calculations.
                            </p>
                            <div className="grid sm:grid-cols-3 gap-3">
                                {[
                                    { name: 'Perlin', formula: 'n = noise3D(…)', note: 'Raw output. Values cross zero, producing alternating dark/bright bands.' },
                                    { name: 'Ridged', formula: '1 − |noise| × 2', note: 'Fold negatives up. Creates sharp bright ridges with flat dark valleys.' },
                                    { name: 'Billow', formula: '|noise| × 2 − 0.5', note: 'Similar fold but shifted. Puffy cloud-like blobs of activity.' },
                                    { name: 'fBm', formula: 'Σ octaves × 0.5ⁿ', note: 'Sum multiple frequencies. More detail and a natural, turbulent look.' },
                                    { name: 'Radial', formula: 'sin(dist − time)', note: 'Spherical ripples radiating from the centre of the grid.' },
                                    { name: 'Planar', formula: 'sin(x)·sin(y)·sin(z)', note: 'Orthogonal standing waves. Creates a lattice-like interference pattern.' },
                                    { name: 'Cross', formula: '(sin x + sin y + sin z) / 3', note: 'Additive waves on each axis. Softer lattice than planar.' },
                                    { name: 'Spiral', formula: 'sin(dist + angle × 3)', note: 'Polar spiral in XZ, modulated by a vertical wave in Y.' },
                                    { name: 'Diamond', formula: 'sin(|x|+|y|+|z|)', note: 'Manhattan distance creates diamond / octahedron-shaped wave fronts.' },
                                ].map(({ name, formula, note }) => (
                                    <div key={name} className="bg-zinc-900/40 border border-zinc-800/60 rounded-lg p-3 flex flex-col gap-1.5">
                                        <p className="font-bold text-zinc-100" style={{ fontSize: '13px' }}>
                                            {name}
                                        </p>
                                        <code className="text-sky-300 font-mono" style={{ fontSize: '11px' }}>
                                            {formula}
                                        </code>
                                        <p className="text-zinc-500 leading-snug" style={{ fontSize: '11px' }}>
                                            {note}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <CodeBlock lang="ts" highlight={['ridged', 'billow', 'fbm', 'waveSpiral']}>
                                {SNIPPET_NOISE_VARIANTS}
                            </CodeBlock>
                        </div>
                    </div>
                </FadeIn>

                {/* step 7 */}
                <FadeIn>
                    <div className="flex gap-4">
                        <StepBadge n={7} />
                        <div className="flex flex-col gap-4 flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-zinc-100">Color interpolation and the contrast curve</h2>
                            <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '14px' }}>
                                {'Color is not sampled from a texture \u2014 it\u2019s computed per cube each frame from the same noise value '}
                                <Pill>{'nNorm'}</Pill>
                                {' used for scale. A power curve '}
                                <Pill>{'pow(nNorm, contrast)'}</Pill>
                                {' controls how sharply the transition between dark and bright happens, and '}
                                <Pill>{'multiplyScalar(colorMix)'}</Pill>
                                {' acts as an exposure/intensity multiplier.'}
                            </p>
                            <CodeBlock lang="ts" highlight={['contrasted', 'lerp', 'multiplyScalar']}>
                                {SNIPPET_COLOR}
                            </CodeBlock>
                        </div>
                    </div>
                </FadeIn>

                {/* interactive color demo */}
                <FadeIn delay={0.05}>
                    <div className="flex flex-col gap-3">
                        <p className="text-zinc-500 font-mono uppercase tracking-widest" style={{ fontSize: '10px' }}>
                            Interactive — color lerp explorer
                        </p>
                        <ColorLerpDemo />
                        <Callout variant="info">
                            The curve graph shows <Pill>pow(t, contrast)</Pill>. A value above 1 pulls the curve downward — most cubes stay dark, with a sharp burst into brightness near the top. A
                            value below 1 does the opposite, flattening everything toward bright.
                        </Callout>
                    </div>
                </FadeIn>

                <SectionRule />

                {/* step 8 */}
                <FadeIn>
                    <div className="flex gap-4">
                        <StepBadge n={8} />
                        <div className="flex flex-col gap-4 flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-zinc-100">Parameter-driven UI with paramsRef</h2>
                            <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '14px' }}>
                                Rather than storing all 16 parameters as React state, they live in a single <Pill>useRef</Pill>. The control panel mutates it directly on input; <Pill>useFrame</Pill>{' '}
                                reads it every frame. This keeps both paths allocation-free and avoids React re-renders during animation.
                            </p>
                            <CodeBlock lang="tsx" highlight={['useRef', 'paramsRef.current', 'defaultValue']}>
                                {SNIPPET_PARAMS_REF}
                            </CodeBlock>
                            <Callout variant="warn">
                                Only <Pill>bgColor</Pill> and <Pill>isOrtho</Pill> need to be React state because they change something <em>outside</em> the canvas (scene background and which camera
                                component is mounted). Everything else is purely internal to the animation loop.
                            </Callout>
                        </div>
                    </div>
                </FadeIn>

                {/* step 9 */}
                <FadeIn>
                    <div className="flex gap-4">
                        <StepBadge n={9} />
                        <div className="flex flex-col gap-4 flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-zinc-100">Camera switching — Perspective ↔ Orthographic</h2>
                            <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '14px' }}>
                                {'The two cameras share position on toggle. A tiny '}
                                <Pill>{'CamSync'}</Pill>
                                {
                                    ' component inside the Canvas copies the current camera position into a ref every frame. When the user clicks toggle, the parent reads that ref synchronously and passes the position to the new camera. Keying both the camera component and '
                                }
                                <Pill>{'OrbitControls'}</Pill>
                                {' forces React to unmount and remount them \u2014 matching the original code\u2019s '}
                                <Pill>{'controls.dispose()'}</Pill>
                                {' pattern.'}
                            </p>
                            <CodeBlock lang="tsx" highlight={['CamSync', 'makeDefault', 'key']}>
                                {SNIPPET_CAMERA}
                            </CodeBlock>
                        </div>
                    </div>
                </FadeIn>

                {/* step 10 */}
                <FadeIn>
                    <div className="flex gap-4">
                        <StepBadge n={10} />
                        <div className="flex flex-col gap-4 flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-zinc-100">Wire everything together in the Canvas</h2>
                            <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '14px' }}>
                                The root component owns the minimal React state (bg color + camera toggle), renders the R3F <Pill>Canvas</Pill>, and places the HTML <Pill>ControlPanel</Pill> overlay
                                outside the canvas. R3F renders the canvas in a separate WebGL context — HTML overlays go in normal DOM on top via CSS <Pill>z-index</Pill>.
                            </p>
                            <CodeBlock lang="tsx" highlight={['paramsRef', 'CamSync', 'ControlPanel', 'attach']}>
                                {SNIPPET_CANVAS}
                            </CodeBlock>
                        </div>
                    </div>
                </FadeIn>

                <SectionRule />

                {/* performance tips */}
                <FadeIn>
                    <h2 className="text-2xl font-bold text-zinc-100 mb-6">Performance checklist</h2>
                    <div className="flex flex-col gap-3">
                        {[
                            {
                                check: 'Module-level scratch objects',
                                detail: 'Declare THREE.Vector3, THREE.Matrix4, THREE.Color etc. outside any component. Allocating them inside useFrame creates garbage every frame.',
                            },
                            {
                                check: 'Params in useRef, not useState',
                                detail: 'Sliders fire dozens of events per second. State updates trigger React reconciliation. A ref write is a direct property assignment — zero overhead.',
                            },
                            {
                                check: 'Set instanceMatrix.needsUpdate once per frame',
                                detail: 'You must set it to true after writing new matrices, but only do it once at the end of the loop — not per cube.',
                            },
                            {
                                check: 'Pre-allocate MAX_CUBES up front',
                                detail: 'InstancedMesh is created with the maximum grid size (20³ = 8000). When the grid shrinks, unused instances are hidden by writing zeroMatrix — no GPU buffer reallocation.',
                            },
                            {
                                check: 'Geometry and material in useMemo',
                                detail: 'Prevents them from being recreated on parent re-renders. Pair with a useEffect cleanup to dispose() them when the component unmounts.',
                            },
                            {
                                check: 'Antialias + shadow map size',
                                detail: 'WebGLRenderer antialias and 2048×2048 shadow maps are expensive on low-end hardware. Consider making them conditional on devicePixelRatio or a quality setting.',
                            },
                        ].map(({ check, detail }) => (
                            <div key={check} className="bg-zinc-900/50 border border-zinc-800/70 rounded-xl px-4 py-3 flex gap-3">
                                <svg
                                    className="shrink-0 mt-0.5 text-sky-500"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <div>
                                    <p className="font-semibold text-zinc-100 mb-0.5" style={{ fontSize: '13px' }}>
                                        {check}
                                    </p>
                                    <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '12px' }}>
                                        {detail}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </FadeIn>

                {/* final CTA */}
                <FadeIn>
                    <div className="bg-gradient-to-br from-sky-500/10 to-indigo-500/5 border border-sky-500/20 rounded-2xl p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                        <div>
                            <p className="text-zinc-100 font-bold text-lg mb-1">See it live</p>
                            <p className="text-zinc-400" style={{ fontSize: '14px' }}>
                                Play with all the parameters in the interactive demo — noise type, grid size, colors, and more.
                            </p>
                        </div>
                        <Link
                            href="/omma-3d-cubes"
                            className="shrink-0 inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl px-5 py-2.5 transition-colors"
                            style={{ fontSize: '14px' }}
                        >
                            Open demo
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}

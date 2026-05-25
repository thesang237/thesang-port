'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { CodeBlock } from '@/components/code-block';
import { FadeIn, NOISE_BG } from '@/components/fade-in';
import TransitionLink from '@/components/ui/transition-link';

// ─── Primitives ───────────────────────────────────────────────────────────────

function Tag({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono tracking-wider uppercase border bg-emerald-500/10 text-emerald-400 border-emerald-500/20" style={{ fontSize: '10px' }}>
            {children}
        </span>
    );
}

function StepBadge({ n }: { n: number }) {
    return (
        <span
            className="inline-flex items-center justify-center size-7 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black font-mono shrink-0"
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
    return <div className="my-20 h-px bg-gradient-to-r from-emerald-500/20 via-emerald-500/5 to-transparent" />;
}

function Callout({ children, variant = 'tip' }: { children: React.ReactNode; variant?: 'tip' | 'info' | 'warn' }) {
    const styles = {
        tip: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-200/90',
        info: 'bg-sky-500/5 border-sky-500/20 text-sky-200/90',
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

function DemoShell({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-800/60 flex items-center gap-2">
                <div className="flex gap-1.5">
                    {['bg-red-500/60', 'bg-yellow-500/60', 'bg-green-500/60'].map((c, i) => (
                        <div key={i} className={`size-2.5 rounded-full ${c}`} />
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

// ─── Demo 1: InstancedMesh at Scale ──────────────────────────────────────────

function InstancedMeshDemo() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [count, setCount] = useState(200);
    const rafRef = useRef(0);

    useEffect(() => {
        if (!canvasRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, 2, 0.1, 100);
        camera.position.z = 18;

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true,
        });
        renderer.setSize(400, 200);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const stalkGeom = new THREE.CylinderGeometry(0.04, 0.08, 1, 5);
        stalkGeom.rotateX(Math.PI / 2);
        stalkGeom.translate(0, 0, 0.5);

        const tipGeom = new THREE.SphereGeometry(0.12, 5, 4);
        const mat = new THREE.MeshStandardMaterial({ color: 0x33ff88 });
        const tipMat = new THREE.MeshStandardMaterial({ color: 0xffee44 });

        const stalkMesh = new THREE.InstancedMesh(stalkGeom, mat, count);
        const tipMesh = new THREE.InstancedMesh(tipGeom, tipMat, count);

        const dummy = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
            dummy.position.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 4);
            const tilt = Math.random() * 0.5;
            const angle = Math.random() * Math.PI * 2;
            dummy.rotation.set(Math.sin(angle) * tilt, Math.cos(angle) * tilt, Math.random() * Math.PI);
            const h = 1 + Math.random() * 4;
            dummy.scale.set(1, 1, h);
            dummy.updateMatrix();
            stalkMesh.setMatrixAt(i, dummy.matrix);

            dummy.scale.set(1, 1, 1);
            dummy.position.z += h;
            dummy.updateMatrix();
            tipMesh.setMatrixAt(i, dummy.matrix);
        }
        stalkMesh.instanceMatrix.needsUpdate = true;
        tipMesh.instanceMatrix.needsUpdate = true;

        scene.add(stalkMesh);
        scene.add(tipMesh);
        scene.add(new THREE.AmbientLight(0x404040, 0.5));
        const dir = new THREE.DirectionalLight(0xffffff, 1.2);
        dir.position.set(5, 5, 5);
        scene.add(dir);

        const animate = () => {
            rafRef.current = requestAnimationFrame(animate);
            stalkMesh.rotation.y += 0.004;
            tipMesh.rotation.y += 0.004;
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(rafRef.current);
            stalkGeom.dispose();
            tipGeom.dispose();
            mat.dispose();
            tipMat.dispose();
            renderer.dispose();
        };
    }, [count]);

    return (
        <div className="flex flex-col gap-4">
            <canvas ref={canvasRef} className="w-full rounded-lg bg-zinc-950/50" style={{ height: 200 }} />
            <div className="flex items-center gap-3">
                <label className="text-zinc-400 text-sm shrink-0">{'Instances:'}</label>
                <input type="range" min="20" max="600" value={count} onChange={(e) => setCount(Number(e.target.value))} className="flex-1 accent-emerald-500" />
                <span className="text-emerald-400 font-mono text-sm w-16 text-right">{count}</span>
            </div>
            <Callout variant="info">
                {`Both stalk + tip are ${count} instances — but the GPU issues only `}
                <strong>{'2 draw calls'}</strong>
                {` total regardless of instance count. Traditional approach: ${count * 2} draw calls.`}
            </Callout>
        </div>
    );
}

// ─── Demo 2: Attribute Visualizer ─────────────────────────────────────────────

type AttrMode = 'noise' | 'delay' | 'tilt';

function AttributeVisualizerDemo() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mode, setMode] = useState<AttrMode>('noise');
    const W = 280;
    const H = 140;
    const COLS = 40;
    const ROWS = 20;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, W, H);
        const cw = W / COLS;
        const ch = H / ROWS;

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const wx = (c / COLS - 0.5) * 10;
                const wy = (r / ROWS - 0.5) * 10;

                let val = 0;
                if (mode === 'noise') {
                    val = Math.max(0, Math.min(1, (Math.sin(wx * 0.4) + Math.cos(wy * 0.4) + Math.sin((wx + wy) * 0.25)) * 0.35 + 0.5));
                } else if (mode === 'delay') {
                    const dist = Math.sqrt(wx * wx + wy * wy);
                    val = Math.min(1, (dist * 4.0) / 30);
                } else {
                    val = Math.abs(Math.sin(c * 0.3) * Math.cos(r * 0.4));
                }

                const r2 = Math.round(val * 20);
                const g2 = Math.round(val * 200);
                const b2 = Math.round(val * 120);
                ctx.fillStyle = `rgb(${r2},${g2},${b2})`;
                ctx.fillRect(c * cw, r * ch, cw - 0.5, ch - 0.5);
            }
        }
    }, [mode]);

    const modes: { id: AttrMode; label: string }[] = [
        { id: 'noise', label: 'aNoise' },
        { id: 'delay', label: 'aDelay' },
        { id: 'tilt', label: 'aBaseEuler' },
    ];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-2 flex-wrap">
                {modes.map(({ id, label }) => (
                    <button
                        key={id}
                        onClick={() => setMode(id)}
                        className={`px-3 py-1.5 rounded-lg font-mono text-xs border transition-colors ${
                            mode === id ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:border-zinc-600'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>
            <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-lg border border-zinc-700/50" style={{ imageRendering: 'pixelated' }} />
            <p className="text-zinc-500 leading-relaxed" style={{ fontSize: '12px' }}>
                {mode === 'noise' && 'aNoise blends ground colors — derived from sin/cos wave sums at each world position.'}
                {mode === 'delay' && 'aDelay creates the radial ripple — stalks near center animate first, outer ones follow.'}
                {mode === 'tilt' && 'aBaseEuler gives each stalk a random lean angle for natural variation.'}
            </p>
        </div>
    );
}

// ─── Demo 3: Shader Wave (GLSL vertex displacement) ───────────────────────────

function ShaderWaveDemo() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [speed, setSpeed] = useState(1.0);
    const [amplitude, setAmplitude] = useState(0.3);
    const rafRef = useRef(0);

    const speedRef = useRef(speed);
    const ampRef = useRef(amplitude);

    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);

    useEffect(() => {
        ampRef.current = amplitude;
    }, [amplitude]);

    useEffect(() => {
        if (!canvasRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, 2, 0.1, 100);
        camera.position.set(0, 1.5, 4);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true,
        });
        renderer.setSize(400, 200);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const geometry = new THREE.PlaneGeometry(5, 3, 48, 32);
        const uniforms = {
            uTime: { value: 0 },
            uSpeed: { value: speedRef.current },
            uAmp: { value: ampRef.current },
        };

        const material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader: `
                uniform float uTime;
                uniform float uSpeed;
                uniform float uAmp;
                varying float vElevation;
                void main() {
                    vec3 pos = position;
                    float wave = sin(pos.x * 2.0 + uTime * uSpeed) * uAmp;
                    wave += sin(pos.y * 1.5 + uTime * uSpeed * 0.7) * uAmp * 0.6;
                    pos.z += wave;
                    vElevation = wave;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying float vElevation;
                void main() {
                    vec3 low = vec3(0.05, 0.25, 0.12);
                    vec3 high = vec3(0.3, 1.0, 0.5);
                    float t = vElevation * 2.0 + 0.5;
                    gl_FragColor = vec4(mix(low, high, clamp(t, 0.0, 1.0)), 1.0);
                }
            `,
            side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        scene.add(new THREE.AmbientLight(0xffffff, 0.2));

        const animate = () => {
            rafRef.current = requestAnimationFrame(animate);
            uniforms.uTime.value += 0.016;
            uniforms.uSpeed.value = speedRef.current;
            uniforms.uAmp.value = ampRef.current;
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(rafRef.current);
            geometry.dispose();
            material.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div className="flex flex-col gap-4">
            <canvas ref={canvasRef} className="w-full rounded-lg bg-zinc-950/50" style={{ height: 200 }} />
            {[
                { label: 'Wave Speed', val: speed, min: 0.1, max: 4, step: 0.1, set: setSpeed },
                { label: 'Amplitude', val: amplitude, min: 0.0, max: 0.8, step: 0.05, set: setAmplitude },
            ].map(({ label, val, min, max, step, set }) => (
                <div key={label} className="flex items-center gap-3">
                    <label className="text-zinc-400 text-sm shrink-0 w-28">{label}</label>
                    <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(parseFloat(e.target.value))} className="flex-1 accent-emerald-500" />
                    <span className="text-emerald-400 font-mono text-sm w-10 text-right">{val.toFixed(1)}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Demo 4: Height-Based Color Gradient ─────────────────────────────────────

function ColorGradientDemo() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [height, setHeight] = useState(3.5);

    const zones = [
        { label: 'Ground shadow', range: '0 – 1.5', color: '#1a5c3a' },
        { label: 'Mid grass', range: '1.5 – 3.5', color: '#33ff88' },
        { label: 'Edge glow', range: '3.5 – 5.0', color: '#ff5500' },
        { label: 'Peak burst', range: '5.0+', color: '#ffcc00' },
    ];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        // Draw gradient bar
        const barX = 20;
        const barW = 40;
        const barH = H - 40;
        const maxH = 7;

        const grad = ctx.createLinearGradient(0, barH + 20, 0, 20);
        grad.addColorStop(0, '#0d1a11');
        grad.addColorStop(0.21, '#1a5c3a');
        grad.addColorStop(0.5, '#33ff88');
        grad.addColorStop(0.7, '#ff5500');
        grad.addColorStop(1, '#ffcc00');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(barX, 20, barW, barH, 4);
        ctx.fill();

        // Draw height indicator
        const yPos = 20 + barH - (height / maxH) * barH;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(barX - 8, yPos);
        ctx.lineTo(barX + barW + 8, yPos);
        ctx.stroke();

        // Determine current color
        let color = '#1a5c3a';
        if (height < 1.5) {
            const shadow = height < 0.8 ? 0.6 + height * 0.5 : 1.0;
            color = `rgba(26, 92, 58, ${shadow})`;
        } else if (height < 3.5) {
            const t = (height - 1.5) / 2.0;
            const st = t * t * (3.0 - 2.0 * t);
            const r = Math.round(51 + st * (255 - 51));
            const g = Math.round(255 - st * (255 - 85));
            color = `rgb(${r},${g},0)`;
        } else if (height < 5.0) {
            const t = (height - 3.5) / 1.5;
            const r = 255;
            const g = Math.round(85 + t * (204 - 85));
            color = `rgb(${r},${g},0)`;
        } else {
            color = '#ffcc00';
        }

        // Draw color swatch
        const swX = barX + barW + 30;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(swX, H / 2 - 30, 60, 60, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(swX, H / 2 - 30, 60, 60, 8);
        ctx.stroke();

        // Height label
        ctx.fillStyle = '#a1a1aa';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`h = ${height.toFixed(1)}`, swX + 30, H / 2 + 48);
    }, [height]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-4 items-start">
                <canvas ref={canvasRef} width={200} height={200} className="rounded-lg border border-zinc-700/50 shrink-0" />
                <div className="flex flex-col gap-2 flex-1">
                    <p className="text-zinc-400" style={{ fontSize: '12px' }}>
                        {'Drag to set stalk height and observe the 4-zone color gradient used in the vertex shader.'}
                    </p>
                    <div className="flex flex-col gap-2 mt-2">
                        {zones.map(({ label, range, color }) => (
                            <div key={label} className="flex items-center gap-2">
                                <div className="size-3 rounded-full shrink-0" style={{ background: color }} />
                                <span className="text-zinc-400" style={{ fontSize: '11px' }}>
                                    {label}
                                    {' ('}
                                    {range}
                                    {')'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <label className="text-zinc-400 text-sm shrink-0">{'Stalk height:'}</label>
                <input type="range" min="0" max="7" step="0.1" value={height} onChange={(e) => setHeight(parseFloat(e.target.value))} className="flex-1 accent-emerald-500" />
                <span className="text-emerald-400 font-mono text-sm w-10 text-right">{height.toFixed(1)}</span>
            </div>
        </div>
    );
}

// ─── Demo 5: Off-Screen Canvas Number Rendering ───────────────────────────────

function NumberRenderDemo() {
    const displayRef = useRef<HTMLCanvasElement>(null);
    const heightRef = useRef<HTMLCanvasElement>(null);
    const [num, setNum] = useState(5);

    useEffect(() => {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = 256;
        offCanvas.height = 256;
        const ctx = offCanvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, 256, 256);

        const fontSize = num === 10 ? 140 : 190;
        ctx.filter = 'blur(8px)';
        ctx.fillStyle = '#0000ff';
        ctx.font = `bold ${fontSize}px Helvetica, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(num.toString(), 128, 138);
        ctx.fillText(num.toString(), 128, 138);

        ctx.filter = 'none';
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 7;
        ctx.strokeText(num.toString(), 128, 138);

        const dispCanvas = displayRef.current;
        const htCanvas = heightRef.current;
        if (!dispCanvas || !htCanvas) return;

        const dispCtx = dispCanvas.getContext('2d');
        const htCtx = htCanvas.getContext('2d');
        if (!dispCtx || !htCtx) return;

        dispCtx.drawImage(offCanvas, 0, 0, 256, 256);

        const imgData = ctx.getImageData(0, 0, 256, 256);
        const htImg = htCtx.createImageData(256, 256);
        for (let i = 0; i < imgData.data.length; i += 4) {
            const red = imgData.data[i];
            const blue = imgData.data[i + 2];
            const isVein = red > 100;
            const halo = blue / 255;

            let height = 0;
            if (isVein) height = 1.0;
            else height = Math.pow(halo, 0.4) * 0.8;

            const v = Math.round(height * 255);
            htImg.data[i] = isVein ? v : 0;
            htImg.data[i + 1] = Math.round(halo * 200);
            htImg.data[i + 2] = isVein ? 0 : v;
            htImg.data[i + 3] = 255;
        }
        htCtx.putImageData(htImg, 0, 0);
    }, [num]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-3 flex-wrap">
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                    <button
                        key={n}
                        onClick={() => setNum(n)}
                        className={`w-9 h-9 rounded-lg font-mono font-bold text-sm border transition-colors ${
                            num === n ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:border-zinc-500'
                        }`}
                    >
                        {n}
                    </button>
                ))}
            </div>
            <div className="flex gap-4 flex-wrap">
                <div className="flex flex-col gap-1.5">
                    <p className="text-zinc-500 font-mono uppercase tracking-widest" style={{ fontSize: '9px' }}>
                        {'Raw canvas output'}
                    </p>
                    <canvas ref={displayRef} width={256} height={256} className="rounded-lg border border-zinc-700" style={{ width: 140, height: 140 }} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <p className="text-zinc-500 font-mono uppercase tracking-widest" style={{ fontSize: '9px' }}>
                        {'Height map (R=vein, B=halo)'}
                    </p>
                    <canvas ref={heightRef} width={256} height={256} className="rounded-lg border border-zinc-700" style={{ width: 140, height: 140 }} />
                </div>
                <div className="flex-1 flex flex-col gap-2 min-w-[140px]">
                    <div className="flex items-center gap-2">
                        <div className="size-3 rounded-full bg-red-500 shrink-0" />
                        <span className="text-zinc-400" style={{ fontSize: '11px' }}>
                            {'Red channel → vein detection'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="size-3 rounded-full bg-blue-500 shrink-0" />
                        <span className="text-zinc-400" style={{ fontSize: '11px' }}>
                            {'Blue channel → halo intensity'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="size-3 rounded-full bg-green-500 shrink-0" />
                        <span className="text-zinc-400" style={{ fontSize: '11px' }}>
                            {'Green → combined height map'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Demo 6: Easing Curves ────────────────────────────────────────────────────

type EasingType = 'linear' | 'cubic' | 'elastic';

function EasingCurveDemo() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [easing, setEasing] = useState<EasingType>('cubic');
    const [duration, setDuration] = useState(2000);
    const startRef = useRef(0);
    const rafRef = useRef(0);

    const easeFns: Record<EasingType, (t: number) => number> = {
        linear: (t) => t,
        cubic: (t) => 1 - Math.pow(1 - t, 3),
        elastic: (t) => (t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin(((t * 10 - 0.75) * (2 * Math.PI)) / 3) + 1),
    };

    const easingRef = useRef(easing);
    const durationRef = useRef(duration);
    useEffect(() => {
        easingRef.current = easing;
    }, [easing]);
    useEffect(() => {
        durationRef.current = duration;
    }, [duration]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        startRef.current = performance.now();

        const animate = () => {
            rafRef.current = requestAnimationFrame(animate);
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const W = canvas.width;
            const H = canvas.height;
            ctx.clearRect(0, 0, W, H);

            // Grid
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                ctx.beginPath();
                ctx.moveTo(i * (W / 4), 0);
                ctx.lineTo(i * (W / 4), H);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, i * (H / 4));
                ctx.lineTo(W, i * (H / 4));
                ctx.stroke();
            }

            const fn = easeFns[easingRef.current];
            const pad = 20;

            // Draw curve
            ctx.strokeStyle = '#33ff88';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = 0; x <= W; x++) {
                const t = x / W;
                const y = H - pad - fn(t) * (H - pad * 2);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Animated dot
            const elapsed = (performance.now() - startRef.current) % (durationRef.current * 1.5);
            const rawT = Math.min(elapsed / durationRef.current, 1);
            const ease = fn(rawT);

            const dotX = rawT * W;
            const dotY = H - pad - ease * (H - pad * 2);

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
            ctx.fill();

            // Height indicator line
            ctx.strokeStyle = 'rgba(255, 204, 0, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(0, dotY);
            ctx.lineTo(W, dotY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Label
            ctx.fillStyle = '#ffcc00';
            ctx.font = '11px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`t=${rawT.toFixed(2)}  ease=${ease.toFixed(2)}`, 6, H - 5);
        };
        animate();

        return () => cancelAnimationFrame(rafRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const easingLabels: Record<EasingType, string> = {
        linear: 'Linear',
        cubic: 'Cubic ease-out (used in Google Countdown)',
        elastic: 'Elastic (overshoot)',
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-2 flex-wrap">
                {(Object.keys(easingLabels) as EasingType[]).map((key) => (
                    <button
                        key={key}
                        onClick={() => {
                            setEasing(key);
                            startRef.current = performance.now();
                        }}
                        className={`px-3 py-1.5 rounded-lg font-mono text-xs border transition-colors ${
                            easing === key ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:border-zinc-600'
                        }`}
                    >
                        {key}
                    </button>
                ))}
            </div>
            <canvas ref={canvasRef} width={400} height={180} className="w-full rounded-lg border border-zinc-700/50 bg-zinc-950/50" />
            <div className="flex items-center gap-3">
                <label className="text-zinc-400 text-sm shrink-0">{'Duration:'}</label>
                <input
                    type="range"
                    min="500"
                    max="4000"
                    step="100"
                    value={duration}
                    onChange={(e) => {
                        setDuration(Number(e.target.value));
                        startRef.current = performance.now();
                    }}
                    className="flex-1 accent-emerald-500"
                />
                <span className="text-emerald-400 font-mono text-sm w-16 text-right">{duration}ms</span>
            </div>
            <p className="text-zinc-500" style={{ fontSize: '12px' }}>
                {easingLabels[easing]}
            </p>
        </div>
    );
}

// ─── Demo 7: Web Audio Synth ──────────────────────────────────────────────────

type WaveType = 'sine' | 'triangle' | 'square' | 'sawtooth';

function AudioSynthDemo() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const rafRef = useRef(0);
    const [freq, setFreq] = useState(261.63);
    const [wave, setWave] = useState<WaveType>('sine');
    const [playing, setPlaying] = useState(false);
    const oscRef = useRef<OscillatorNode | null>(null);
    const gainRef = useRef<GainNode | null>(null);
    const freqRef = useRef(freq);
    useEffect(() => {
        freqRef.current = freq;
    }, [freq]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const drawIdle = () => {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            const W = canvas.width;
            const H = canvas.height;
            ctx.fillStyle = '#0a0a0e';
            ctx.fillRect(0, 0, W, H);
            ctx.strokeStyle = 'rgba(51,255,136,0.15)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, H / 2);
            ctx.lineTo(W, H / 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(51,255,136,0.25)';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('click Play to visualize waveform', W / 2, H / 2 + 20);
        };

        drawIdle();

        const animate = () => {
            rafRef.current = requestAnimationFrame(animate);
            if (!analyserRef.current) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const W = canvas.width;
            const H = canvas.height;
            const bufLen = analyserRef.current.frequencyBinCount;
            const dataArr = new Uint8Array(bufLen);
            analyserRef.current.getByteTimeDomainData(dataArr);

            ctx.fillStyle = '#0a0a0e';
            ctx.fillRect(0, 0, W, H);

            ctx.strokeStyle = '#33ff88';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const sliceW = W / bufLen;
            let x = 0;
            for (let i = 0; i < bufLen; i++) {
                const v = dataArr[i] / 128.0;
                const y = (v * H) / 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                x += sliceW;
            }
            ctx.stroke();
        };
        animate();

        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    const handlePlay = useCallback(() => {
        if (playing) {
            oscRef.current?.stop();
            oscRef.current = null;
            gainRef.current = null;
            setPlaying(false);
            analyserRef.current = null;
            return;
        }

        if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyserRef.current = analyser;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = wave;
        osc.frequency.value = freqRef.current;
        filter.type = 'lowpass';
        filter.frequency.value = freqRef.current * 4;
        filter.Q.value = 1.5;
        gain.gain.value = 0.15;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(analyser);
        analyser.connect(ctx.destination);
        osc.start();
        oscRef.current = osc;
        gainRef.current = gain;
        setPlaying(true);
    }, [playing, wave]);

    useEffect(() => {
        if (oscRef.current) {
            oscRef.current.frequency.value = freq;
        }
    }, [freq]);

    const notes = [
        { label: 'C4', hz: 261.63 },
        { label: 'D4', hz: 293.66 },
        { label: 'E4', hz: 329.63 },
        { label: 'G4', hz: 392.0 },
        { label: 'A4', hz: 440.0 },
        { label: 'C5', hz: 523.25 },
    ];

    return (
        <div className="flex flex-col gap-4">
            <canvas ref={canvasRef} width={400} height={120} className="w-full rounded-lg border border-zinc-700/50" />
            <div className="flex gap-1.5 flex-wrap">
                {notes.map(({ label, hz }) => (
                    <button
                        key={label}
                        onClick={() => setFreq(hz)}
                        className={`px-3 py-1.5 rounded-lg font-mono text-xs border transition-colors ${
                            freq === hz ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:border-zinc-600'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-3">
                <label className="text-zinc-400 text-sm shrink-0 w-24">{'Frequency:'}</label>
                <input type="range" min="110" max="1760" step="0.01" value={freq} onChange={(e) => setFreq(parseFloat(e.target.value))} className="flex-1 accent-emerald-500" />
                <span className="text-emerald-400 font-mono text-sm w-20 text-right">
                    {freq.toFixed(1)}
                    {'Hz'}
                </span>
            </div>
            <div className="flex gap-2 flex-wrap">
                {(['sine', 'triangle', 'square', 'sawtooth'] as WaveType[]).map((w) => (
                    <button
                        key={w}
                        onClick={() => {
                            setWave(w);
                            if (oscRef.current) oscRef.current.type = w;
                        }}
                        className={`px-3 py-1.5 rounded-lg font-mono text-xs border transition-colors ${
                            wave === w ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:border-zinc-600'
                        }`}
                    >
                        {w}
                    </button>
                ))}
            </div>
            <button
                onClick={handlePlay}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-colors border ${
                    playing ? 'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                }`}
            >
                {playing ? 'Stop' : 'Play Tone'}
            </button>
        </div>
    );
}

// ─── Demo 8: Spatial Grid Interaction ─────────────────────────────────────────

function SpatialGridDemo() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [radius, setRadius] = useState(3);
    const mouseRef = useRef({ x: 0, y: 0 });
    const rafRef = useRef(0);
    const radiusRef = useRef(radius);
    useEffect(() => {
        radiusRef.current = radius;
    }, [radius]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const COLS = 24;
        const ROWS = 14;
        const W = canvas.width;
        const H = canvas.height;
        const cellW = W / COLS;
        const cellH = H / ROWS;

        const handleMove = (e: MouseEvent | TouchEvent) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = W / rect.width;
            const scaleY = H / rect.height;
            let cx = 0;
            let cy = 0;
            if (e instanceof MouseEvent) {
                cx = (e.clientX - rect.left) * scaleX;
                cy = (e.clientY - rect.top) * scaleY;
            } else if (e.touches.length > 0) {
                cx = (e.touches[0].clientX - rect.left) * scaleX;
                cy = (e.touches[0].clientY - rect.top) * scaleY;
            }
            mouseRef.current = { x: cx, y: cy };
        };

        canvas.addEventListener('mousemove', handleMove);
        canvas.addEventListener('touchmove', handleMove as EventListener, { passive: true });

        const animate = () => {
            rafRef.current = requestAnimationFrame(animate);
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const r = radiusRef.current;
            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;

            const mouseCellC = mx / cellW;
            const mouseCellR = my / cellH;
            const cellRadC = r / (COLS / COLS);
            const cellRadR = r / (ROWS / ROWS);

            ctx.fillStyle = '#0a0a0e';
            ctx.fillRect(0, 0, W, H);

            for (let row = 0; row < ROWS; row++) {
                for (let col = 0; col < COLS; col++) {
                    const px = (col + 0.5) * cellW;
                    const py = (row + 0.5) * cellH;
                    const dx = col - mouseCellC;
                    const dy = row - mouseCellR;
                    const inRadius = Math.abs(dx) <= cellRadC + 1 && Math.abs(dy) <= cellRadR + 1;
                    const dist = Math.sqrt(((px - mx) * (px - mx)) / (cellW * cellW) + ((py - my) * (py - my)) / (cellH * cellH));
                    const within = dist <= r;

                    if (within) {
                        const force = Math.pow((r - dist) / r, 2);
                        ctx.fillStyle = `rgba(51,255,136,${0.15 + force * 0.6})`;
                    } else if (inRadius) {
                        ctx.fillStyle = 'rgba(51,255,136,0.05)';
                    } else {
                        ctx.fillStyle = 'rgba(255,255,255,0.03)';
                    }

                    ctx.fillRect(col * cellW + 1, row * cellH + 1, cellW - 2, cellH - 2);

                    // stalk dot
                    ctx.fillStyle = within ? '#33ff88' : 'rgba(255,255,255,0.2)';
                    ctx.beginPath();
                    ctx.arc(px, py, within ? 3 : 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Interaction circle
            ctx.strokeStyle = 'rgba(255,204,0,0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(mx, my, r * cellW, 0, Math.PI * 2);
            ctx.stroke();

            // Mouse dot
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.arc(mx, my, 4, 0, Math.PI * 2);
            ctx.fill();
        };
        animate();

        return () => {
            cancelAnimationFrame(rafRef.current);
            canvas.removeEventListener('mousemove', handleMove);
            canvas.removeEventListener('touchmove', handleMove as EventListener);
        };
    }, []);

    return (
        <div className="flex flex-col gap-4">
            <canvas ref={canvasRef} width={400} height={220} className="w-full rounded-lg border border-zinc-700/50 cursor-crosshair" />
            <div className="flex items-center gap-3">
                <label className="text-zinc-400 text-sm shrink-0">{'Radius (cells):'}</label>
                <input type="range" min="1" max="8" step="0.5" value={radius} onChange={(e) => setRadius(parseFloat(e.target.value))} className="flex-1 accent-emerald-500" />
                <span className="text-emerald-400 font-mono text-sm w-8 text-right">{radius}</span>
            </div>
            <Callout variant="info">
                {'Move your mouse over the grid. The yellow circle shows the interaction radius. Only '}
                <strong>{'highlighted cells'}</strong>
                {' are checked — not all 168,000 stalks.'}
            </Callout>
        </div>
    );
}

// ─── Demo 9: Particle System ──────────────────────────────────────────────────

function ParticleDemo() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef(0);
    const [gravity, setGravity] = useState(0.05);
    const [damping, setDamping] = useState(0.95);
    const gravRef = useRef(gravity);
    const dampRef = useRef(damping);
    useEffect(() => {
        gravRef.current = gravity;
    }, [gravity]);
    useEffect(() => {
        dampRef.current = damping;
    }, [damping]);

    type Particle = { x: number; y: number; vx: number; vy: number; life: number; r: number; g: number; b: number };
    const particlesRef = useRef<Particle[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const W = canvas.width;
        const H = canvas.height;

        const spawnAt = (x: number, y: number, intensity = 1) => {
            for (let i = 0; i < Math.floor(8 * intensity); i++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = Math.random() * 3 * intensity + 0.5;
                const hue = 100 + Math.random() * 60;
                const sat = 80 + Math.random() * 20;
                particlesRef.current.push({
                    x,
                    y,
                    vx: Math.cos(angle) * spd,
                    vy: Math.sin(angle) * spd - 1,
                    life: 1,
                    r: Math.round((Math.sin(((hue + 120) * Math.PI) / 180) * 0.5 + 0.5) * 255 * (sat / 100)),
                    g: Math.round((Math.sin((hue * Math.PI) / 180) * 0.5 + 0.5) * 255),
                    b: Math.round((Math.sin(((hue - 120) * Math.PI) / 180) * 0.5 + 0.5) * 255 * (sat / 100) * 0.3),
                });
            }
            if (particlesRef.current.length > 800) {
                particlesRef.current.splice(0, particlesRef.current.length - 800);
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const sx = (e.clientX - rect.left) * (W / rect.width);
            const sy = (e.clientY - rect.top) * (H / rect.height);
            if (e.buttons > 0) spawnAt(sx, sy, 0.6);
        };

        const handleClick = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            spawnAt((e.clientX - rect.left) * (W / rect.width), (e.clientY - rect.top) * (H / rect.height), 2);
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('click', handleClick);

        const animate = () => {
            rafRef.current = requestAnimationFrame(animate);
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Additive blending: dark fill fades old particles
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(8,8,14,0.25)';
            ctx.fillRect(0, 0, W, H);

            ctx.globalCompositeOperation = 'lighter';
            const particles = particlesRef.current;
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.vy += gravRef.current;
                p.vx *= dampRef.current;
                p.vy *= dampRef.current;
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.012;

                if (p.life <= 0 || p.y > H + 10) {
                    particles.splice(i, 1);
                    continue;
                }

                ctx.globalAlpha = Math.min(1, p.life * 2);
                ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2.5 * p.life + 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
        };
        animate();

        return () => {
            cancelAnimationFrame(rafRef.current);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('click', handleClick);
        };
    }, []);

    return (
        <div className="flex flex-col gap-4">
            <canvas ref={canvasRef} width={400} height={220} className="w-full rounded-lg border border-zinc-700/50 cursor-crosshair bg-[#08080e]" />
            <p className="text-zinc-500" style={{ fontSize: '12px' }}>
                {'Click or drag to spawn particles. Notice '}
                <strong className="text-zinc-300">{'additive blending'}</strong>
                {' — overlapping particles brighten rather than occlude.'}
            </p>
            {[
                { label: 'Gravity', val: gravity, min: 0, max: 0.3, step: 0.01, set: setGravity },
                { label: 'Damping', val: damping, min: 0.7, max: 1.0, step: 0.01, set: setDamping },
            ].map(({ label, val, min, max, step, set }) => (
                <div key={label} className="flex items-center gap-3">
                    <label className="text-zinc-400 text-sm shrink-0 w-20">{label}</label>
                    <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(parseFloat(e.target.value))} className="flex-1 accent-emerald-500" />
                    <span className="text-emerald-400 font-mono text-sm w-10 text-right">{val.toFixed(2)}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GoogleCountdownLearnPage() {
    return (
        <div className="min-h-screen bg-[#080810] text-zinc-200" style={{ fontFamily: 'system-ui, sans-serif' }}>
            {/* Hero */}
            <div className="relative border-b border-zinc-800/60 overflow-hidden" style={NOISE_BG}>
                <div className="max-w-3xl mx-auto px-6 py-20 md:py-28">
                    <FadeIn>
                        <div className="flex items-center gap-3 mb-6">
                            <TransitionLink href="/google-countdown" className="text-zinc-500 hover:text-emerald-400 transition-colors font-mono" style={{ fontSize: '12px' }}>
                                {'← google-countdown'}
                            </TransitionLink>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-6">
                            <Tag>{'Three.js'}</Tag>
                            <Tag>{'WebGL Shaders'}</Tag>
                            <Tag>{'Web Audio'}</Tag>
                            <Tag>{'Canvas 2D'}</Tag>
                            <Tag>{'Instanced Rendering'}</Tag>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-100 mb-5 leading-tight">
                            {'Building a 3D audiovisual'}
                            <br />
                            {'countdown experience'}
                        </h1>
                        <p className="text-zinc-400 leading-relaxed text-lg max-w-2xl">
                            {
                                'A complete technical deep-dive into the techniques behind Google Countdown — from rendering 168,000 grass stalks in a single draw call to synthesising real-time audio and sampling canvas pixels as height maps.'
                            }
                        </p>
                    </FadeIn>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-6 pb-32">
                {/* ── Step 1: InstancedMesh ── */}
                <SectionRule />
                <FadeIn>
                    <div className="space-y-5">
                        <div className="flex items-start gap-3">
                            <StepBadge n={1} />
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Tag>{'THREE.JS'}</Tag>
                                    <Tag>{'PERFORMANCE'}</Tag>
                                </div>
                                <h2 className="text-xl font-bold">{'InstancedMesh — 168,000 stalks, 2 draw calls'}</h2>
                            </div>
                        </div>

                        <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                            {'The entire grass field is two '}
                            <Pill>{'InstancedMesh'}</Pill>
                            {
                                ' objects — one for stalk cylinders, one for spherical tips. A 300×150 grid with 4 stalks per cell gives 168,000 instances, yet the GPU processes them in exactly 2 draw calls regardless of count.'
                            }
                        </p>

                        <CodeBlock lang="tsx">{`// Geometry: a thin cylinder oriented along +Z, pivoted at origin
const stalkGeom = new THREE.CylinderGeometry(0.02, 0.035, 1, 5);
stalkGeom.rotateX(Math.PI / 2);   // make it face forward
stalkGeom.translate(0, 0, 0.5);   // pivot at base

const tipGeom = new THREE.SphereGeometry(0.08, 5, 4);

// One InstancedMesh for all 168,000 stalks
const stalkMesh = new THREE.InstancedMesh(stalkGeom, material, totalCount);
stalkMesh.frustumCulled = false;   // don't cull — stalks fill the viewport

// Initialize identity matrices (positions are handled by custom attributes)
const arr = stalkMesh.instanceMatrix.array;
for (let i = 0; i < totalCount; i++) {
  const o = i * 16;
  arr[o] = arr[o+5] = arr[o+10] = arr[o+15] = 1; // identity matrix
}
stalkMesh.instanceMatrix.needsUpdate = true;
scene.add(stalkMesh);`}</CodeBlock>

                        <Callout variant="tip">
                            {'Setting '}
                            <Pill>{'frustumCulled = false'}</Pill>
                            {
                                " is essential here — Three.js's bounding box check would cull the mesh based on the identity-matrix positions, hiding everything before the custom shader moves instances into place."
                            }
                        </Callout>

                        <DemoShell title="instanced-mesh.tsx">
                            <InstancedMeshDemo />
                        </DemoShell>
                    </div>
                </FadeIn>

                {/* ── Step 2: InstancedBufferAttributes ── */}
                <SectionRule />
                <FadeIn>
                    <div className="space-y-5">
                        <div className="flex items-start gap-3">
                            <StepBadge n={2} />
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Tag>{'GPU DATA'}</Tag>
                                </div>
                                <h2 className="text-xl font-bold">{'InstancedBufferAttributes — per-stalk data to the GPU'}</h2>
                            </div>
                        </div>

                        <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                            {'Each stalk needs its own position, orientation, scale, delay, and glow. Instead of CPU-side matrix updates every frame, this data lives in '}
                            <Pill>{'Float32Array'}</Pill>
                            {' buffers uploaded once and read by the vertex shader as instanced attributes. Updating only '}
                            <Pill>{'needsUpdate = true'}</Pill>
                            {' triggers a zero-copy GPU upload.'}
                        </p>

                        <CodeBlock lang="tsx">{`// Eight typed arrays — one value (or component set) per stalk
const positions   = new Float32Array(totalCount * 3);  // xyz world position
const baseEulers  = new Float32Array(totalCount * 3);  // base lean angles
const startScales = new Float32Array(totalCount);      // height at transition start
const targetScales= new Float32Array(totalCount);      // height target
const delays      = new Float32Array(totalCount);      // animation delay (ms)
const noiseValues = new Float32Array(totalCount);      // colour-blend noise
const bends       = new Float32Array(totalCount * 2);  // mouse bend X/Y
const illumination= new Float32Array(totalCount);      // mouse glow 0–1

// Attach as InstancedBufferAttributes (one value per instance)
const posAttr = new THREE.InstancedBufferAttribute(positions, 3);
stalkMesh.geometry.setAttribute('aBasePosition', posAttr);
stalkMesh.geometry.setAttribute('aStartScale',
  new THREE.InstancedBufferAttribute(startScales, 1));
// ... repeat for all 8 attributes

// Per-frame mutation (CPU side) — flag GPU re-upload
bends[i * 2]     += targetBendX;
bends[i * 2 + 1] += targetBendY;
stalkMesh.geometry.attributes.aBend.needsUpdate = true;`}</CodeBlock>

                        <DemoShell title="attribute-visualizer.tsx">
                            <AttributeVisualizerDemo />
                        </DemoShell>
                    </div>
                </FadeIn>

                {/* ── Step 3: onBeforeCompile ── */}
                <SectionRule />
                <FadeIn>
                    <div className="space-y-5">
                        <div className="flex items-start gap-3">
                            <StepBadge n={3} />
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Tag>{'GLSL'}</Tag>
                                    <Tag>{'SHADERS'}</Tag>
                                </div>
                                <h2 className="text-xl font-bold">{'Shader injection via onBeforeCompile'}</h2>
                            </div>
                        </div>

                        <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                            {'Rather than writing a full '}
                            <Pill>{'ShaderMaterial'}</Pill>
                            {' from scratch (losing PBR lighting), the project uses '}
                            <Pill>{'MeshStandardMaterial.onBeforeCompile'}</Pill>
                            {". This callback receives Three.js's compiled shader source before it's sent to the GPU, letting you inject custom code by replacing specific "}
                            <Pill>{'#include'}</Pill>
                            {' directives.'}
                        </p>

                        <CodeBlock lang="tsx">{`const material = new THREE.MeshStandardMaterial({ vertexColors: true });

material.onBeforeCompile = (shader) => {
  // 1. Inject shared uniforms
  shader.uniforms.uTime         = shaderUniforms.current.uTime;
  shader.uniforms.uHeightFactor = shaderUniforms.current.uHeightFactor;
  shader.uniforms.uColorPeak    = shaderUniforms.current.uColorPeak;

  // 2. Prepend attribute declarations to vertex shader
  shader.vertexShader = \`
    attribute vec3  aBasePosition;
    attribute vec3  aBaseEuler;
    attribute float aStartScale;
    attribute float aTargetScale;
    attribute float aDelay;
    attribute float aNoise;
    attribute vec2  aBend;
    attribute float aIllumination;
    varying float vDisplayHeight;
    \` + shader.vertexShader;

  // 3. Replace Three.js include hooks with custom logic
  shader.vertexShader = shader.vertexShader.replace(
    '#include <defaultnormal_vertex>',
    customNormalCode          // rotation + turbulence
  );
  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    customPositionCode        // growth + bending + colour
  );
};`}</CodeBlock>

                        <Callout variant="info">
                            <Pill>{'onBeforeCompile'}</Pill>
                            {
                                " runs once per material variant. The injected GLSL is cached — subsequent frames reuse the compiled program at zero cost. This is the same approach used by libraries like drei's "
                            }
                            <Pill>{'MeshTransmissionMaterial'}</Pill>
                            {'.'}
                        </Callout>

                        <DemoShell title="shader-wave.tsx">
                            <ShaderWaveDemo />
                        </DemoShell>
                    </div>
                </FadeIn>

                {/* ── Step 4: Height-Based Coloring ── */}
                <SectionRule />
                <FadeIn>
                    <div className="space-y-5">
                        <div className="flex items-start gap-3">
                            <StepBadge n={4} />
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Tag>{'GLSL COLOR'}</Tag>
                                </div>
                                <h2 className="text-xl font-bold">{'4-zone height gradient in the vertex shader'}</h2>
                            </div>
                        </div>

                        <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                            {'Each stalk is coloured by its rendered height — not UV coordinates. The vertex shader blends across 4 zones using '}
                            <Pill>{'mix()'}</Pill>
                            {' and '}
                            <Pill>{'smoothstep()'}</Pill>
                            {'. Color uniforms are hot-swappable via JavaScript, enabling palette transitions between countdown numbers without recompiling shaders.'}
                        </p>

                        <CodeBlock lang="glsl">{`// Inside the custom begin_vertex replacement:
float h = gpuDisplayHeight;   // 0 → 7+ units tall

vec3 baseColor = mix(uColorGrnd1, uColorGrnd2, vNoise);
vec3 finalColor;

if (h < 1.5) {
  // Shadow zone — short stalks are darker at the base
  float shadow = (h < 0.8) ? (0.6 + h * 0.5) : 1.0;
  finalColor = baseColor * shadow;

} else if (h < 3.5) {
  // Transition → edge color with smoothstep
  float t = (h - 1.5) / 2.0;
  float smoothT = t * t * (3.0 - 2.0 * t);  // smoothstep
  finalColor = mix(baseColor, uColorEdge, smoothT);

} else {
  // Peak zone → white for very tall stalks
  float t = min(1.0, (h - 3.5) / 1.5);
  finalColor = mix(uColorEdge, uColorPeak, t);
  if (h > 5.0) {
    float w = min(1.0, (h - 5.0) * 0.15);
    finalColor = mix(finalColor, vec3(1.0), w);  // bleach to white
  }
}

// Mouse illumination overlay
if (vIllum > 0.0) {
  finalColor = mix(finalColor, uColorPeak, vIllum * 0.6);
}

vColor = finalColor;`}</CodeBlock>

                        <DemoShell title="color-gradient.tsx">
                            <ColorGradientDemo />
                        </DemoShell>
                    </div>
                </FadeIn>

                {/* ── Step 5: Off-Screen Canvas ── */}
                <SectionRule />
                <FadeIn>
                    <div className="space-y-5">
                        <div className="flex items-start gap-3">
                            <StepBadge n={5} />
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Tag>{'CANVAS 2D'}</Tag>
                                    <Tag>{'HEIGHT MAPS'}</Tag>
                                </div>
                                <h2 className="text-xl font-bold">{'Off-screen canvas as a height map'}</h2>
                            </div>
                        </div>

                        <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                            {
                                'When each countdown number appears, a 512×512 off-screen canvas renders the digit with a Gaussian blur (halo) and a sharp stroke (vein outline). The pixel data is then sampled — '
                            }
                            <strong className="text-zinc-200">{'red channel'}</strong>
                            {' detects vein pixels, '}
                            <strong className="text-zinc-200">{'blue channel'}</strong>
                            {" encodes halo intensity — to set each stalk's target height."}
                        </p>

                        <CodeBlock lang="tsx">{`function startTransition(num: number) {
  const ctx = offCanvasCtx;           // 512×512 off-screen canvas

  // Clear and draw blurred fill (creates the halo)
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 512, 512);
  ctx.filter = 'blur(16px)';
  ctx.fillStyle = '#0000ff';          // blue = halo channel
  ctx.font = 'bold 380px Helvetica';
  ctx.textAlign = 'center';
  ctx.fillText(num.toString(), 256, 276);

  // Sharp stroke outline (creates the vein)
  ctx.filter = 'none';
  ctx.strokeStyle = '#ff0000';        // red = vein channel
  ctx.lineWidth = 14;
  ctx.strokeText(num.toString(), 256, 276);

  // Read pixels and map to stalk heights
  const imgData = ctx.getImageData(0, 0, 512, 512).data;
  for (let i = 0; i < totalCount; i++) {
    const canvasX = /* world-to-canvas mapping */;
    const canvasY = /* ... */;
    const pixelIdx = (Math.floor(canvasY) * 512 + Math.floor(canvasX)) * 4;

    const isVein = imgData[pixelIdx] > 100;           // red channel
    const halo   = imgData[pixelIdx + 2] / 255;       // blue channel

    if (isVein) targetScales[i] = 4.8 + Math.random() * 1.5;   // tall veins
    else        targetScales[i] = 0.5 + Math.pow(halo, 0.4) * 4.0; // gradient halo
  }
}`}</CodeBlock>

                        <DemoShell title="number-render.tsx">
                            <NumberRenderDemo />
                        </DemoShell>
                    </div>
                </FadeIn>

                {/* ── Step 6: Easing & Growth Animation ── */}
                <SectionRule />
                <FadeIn>
                    <div className="space-y-5">
                        <div className="flex items-start gap-3">
                            <StepBadge n={6} />
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Tag>{'ANIMATION'}</Tag>
                                    <Tag>{'GLSL'}</Tag>
                                </div>
                                <h2 className="text-xl font-bold">{'GPU-side easing with per-stalk delays'}</h2>
                            </div>
                        </div>

                        <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                            {'Growth animations run entirely on the GPU — no CPU lerp loop. Each stalk stores a '}
                            <Pill>{'aStartScale'}</Pill>
                            {', '}
                            <Pill>{'aTargetScale'}</Pill>
                            {', and '}
                            <Pill>{'aDelay'}</Pill>
                            {'. The vertex shader computes the interpolated height every frame using a cubic ease-out curve, creating the ripple effect where stalks near the center animate first.'}
                        </p>

                        <CodeBlock lang="glsl">{`// Vertex shader — runs for every vertex, every frame
uniform float uTime;   // elapsed ms since last transition

// Progress: 0 → 1 over 2000ms, offset by per-stalk delay
float progress = clamp((uTime - aDelay) / 2000.0, 0.0, 1.0);

// Cubic ease-out: fast start, smooth finish
float easeFactor = 1.0 - pow(1.0 - progress, 3.0);

// Interpolated display height
float gpuDisplayHeight =
  (aStartScale + (aTargetScale - aStartScale) * easeFactor)
  * uHeightFactor;

// Wriggle for growing stalks (adds organic life)
if (aTargetScale > aStartScale && aTargetScale * uHeightFactor > 3.0) {
  float p = clamp((uTime - aDelay) / 2000.0, 0.0, 1.0);
  float wriggleAmt = sin(p * 3.14159) * 0.25;  // bell curve
  wriggleX = sin(uNow * 0.006 + aBasePosition.x) * wriggleAmt;
  wriggleY = cos(uNow * 0.005 + aBasePosition.y) * wriggleAmt;
}`}</CodeBlock>

                        <Callout variant="warn">
                            {'Before each transition, the CPU captures the current interpolated height and writes it back to '}
                            <Pill>{'aStartScale'}</Pill>
                            {'. This prevents stalks from snapping — they smoothly re-interpolate from wherever they were, even mid-animation.'}
                        </Callout>

                        <DemoShell title="easing-curves.tsx">
                            <EasingCurveDemo />
                        </DemoShell>
                    </div>
                </FadeIn>

                {/* ── Step 7: Web Audio Synthesis ── */}
                <SectionRule />
                <FadeIn>
                    <div className="space-y-5">
                        <div className="flex items-start gap-3">
                            <StepBadge n={7} />
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Tag>{'WEB AUDIO'}</Tag>
                                </div>
                                <h2 className="text-xl font-bold">{'Web Audio API — pluck synthesis and pentatonic scales'}</h2>
                            </div>
                        </div>

                        <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                            {
                                "Each mouse interaction triggers a pluck sound from the current countdown number's pentatonic scale. Ten audio profiles map numbers 10→1 to different keys and timbres. The audio graph chains oscillators through a filter envelope, stereo panner, shared delay line, and master compressor."
                            }
                        </p>

                        <CodeBlock lang="tsx">{`// Audio graph: OSC → Filter → Gain → Panner → Delay + Master → Compressor
function playPluck(frequency: number, brightness: number, pan: number) {
  const osc    = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const gain   = audioCtx.createGain();
  const panner = audioCtx.createStereoPanner();

  osc.type = 'sine';
  osc.frequency.value = frequency;

  // Brightness controls filter cutoff sweep — mouse speed maps here
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(brightness * 0.8, audioCtx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(
    Math.max(100, brightness * 0.1),
    audioCtx.currentTime + duration * 1.5    // sweep down over note duration
  );
  filter.Q.value = 1.5;

  panner.pan.value = pan;    // -1 (left) to +1 (right) based on cursor X

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(panner);
  panner.connect(masterDelay);     // 850ms delay with 75% feedback
  panner.connect(masterGain);

  // Attack-decay envelope
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.035, audioCtx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 4);
  osc.start();
  osc.stop(audioCtx.currentTime + 4);
}`}</CodeBlock>

                        <DemoShell title="audio-synth.tsx">
                            <AudioSynthDemo />
                        </DemoShell>
                    </div>
                </FadeIn>

                {/* ── Step 8: Spatial Grid Interaction ── */}
                <SectionRule />
                <FadeIn>
                    <div className="space-y-5">
                        <div className="flex items-start gap-3">
                            <StepBadge n={8} />
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Tag>{'INTERACTION'}</Tag>
                                    <Tag>{'SPATIAL'}</Tag>
                                </div>
                                <h2 className="text-xl font-bold">{'Grid-based spatial partitioning for O(nearby) interaction'}</h2>
                            </div>
                        </div>

                        <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                            {
                                'A naive approach checking all 168,000 stalks per frame would be O(n) every tick. Instead, the mouse world position is mapped to a grid cell, and only cells within the interaction radius are checked. This reduces the inner loop to ~200 stalks regardless of total count.'
                            }
                        </p>

                        <CodeBlock lang="tsx">{`// Map mouse world-space to grid cell coordinates
const cellWidth  = groundWidth  / gridCols;   // ~0.6 units
const cellHeight = groundHeight / gridRows;   // ~0.6 units
const mouseCellC = (mouseWorld.x / groundWidth  + 0.5) * gridCols;
const mouseCellR = (-mouseWorld.y / groundHeight + 0.5) * gridRows;

// Bounding box of cells within interaction radius
const cellRadiusC = Math.ceil(interactionRadius / cellWidth)  + 1;
const cellRadiusR = Math.ceil(interactionRadius / cellHeight) + 1;
const minC = Math.max(0,          Math.floor(mouseCellC - cellRadiusC));
const maxC = Math.min(gridCols-1, Math.ceil (mouseCellC + cellRadiusC));
// ... same for rows

// Only iterate nearby cells (~15×15 = ~225 cells, ~900 stalks)
for (let r = minR; r <= maxR; r++) {
  for (let c = minC; c <= maxC; c++) {
    const i = (r * gridCols + c) * stalksPerCell + s;
    const dx = positions[i*3]   - mouseWorld.x;
    const dy = positions[i*3+1] - mouseWorld.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist >= interactionRadius) continue;

    const force = Math.pow((interactionRadius - dist) / interactionRadius, 2);
    bends[i*2]   += (dy/dist) * force * 1.2;   // bend away from cursor
    bends[i*2+1] -= (dx/dist) * force * 1.2;
    illumination[i] = Math.min(1, illumination[i] + force * 1.5);
  }
}`}</CodeBlock>

                        <DemoShell title="spatial-grid.tsx">
                            <SpatialGridDemo />
                        </DemoShell>
                    </div>
                </FadeIn>

                {/* ── Step 9: Particle Systems ── */}
                <SectionRule />
                <FadeIn>
                    <div className="space-y-5">
                        <div className="flex items-start gap-3">
                            <StepBadge n={9} />
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Tag>{'PARTICLES'}</Tag>
                                    <Tag>{'THREE.JS'}</Tag>
                                </div>
                                <h2 className="text-xl font-bold">{'Additive-blended particle systems'}</h2>
                            </div>
                        </div>

                        <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                            {'Two particle layers coexist: 8,000 atmospheric dust points that drift slowly (set once), and up to 3,000 interactive sparks spawned by mouse brushing. Both use '}
                            <Pill>{'THREE.AdditiveBlending'}</Pill>
                            {' — particles brighten overlapping areas rather than occlude them, creating a luminous fire-fly effect.'}
                        </p>

                        <CodeBlock lang="tsx">{`// Soft circular sprite texture (generated on a 64×64 canvas)
const spriteCanvas = document.createElement('canvas');
spriteCanvas.width = spriteCanvas.height = 64;
const spriteCtx = spriteCanvas.getContext('2d')!;
spriteCtx.beginPath();
spriteCtx.arc(32, 32, 30, 0, Math.PI * 2);
spriteCtx.fillStyle = '#fff';
spriteCtx.fill();
const particleTex = new THREE.CanvasTexture(spriteCanvas);

// Interactive dust ring buffer — avoids GC pressure
const maxDust = 3000;
const positions  = new Float32Array(maxDust * 3).fill(9999); // start off-screen
const velocities = new Float32Array(maxDust * 3);
const lifetimes  = new Float32Array(maxDust);
let   dustIndex  = 0;

const mat = new THREE.PointsMaterial({
  size: 0.75,
  map: particleTex,
  blending: THREE.AdditiveBlending,   // additive — no occluding
  depthWrite: false,                   // don't write to depth buffer
  transparent: true,
});

// Per-frame update (CPU side)
for (let i = 0; i < maxDust; i++) {
  if (lifetimes[i] <= 0) continue;
  positions[i*3]   += velocities[i*3]   *= 0.95;   // drag
  positions[i*3+1] += velocities[i*3+1] *= 0.95;
  lifetimes[i] -= delta * 0.001;
  if (lifetimes[i] <= 0) positions[i*3] = 9999;    // hide off-screen
}
dustPoints.geometry.attributes.position.needsUpdate = true;`}</CodeBlock>

                        <Callout variant="tip">
                            {'The ring buffer pattern ('}
                            <Pill>{'dustIndex % maxDust'}</Pill>
                            {') reuses slots from oldest particles without creating garbage. Combined with hiding expired particles at position 9999, this avoids any per-frame allocation.'}
                        </Callout>

                        <DemoShell title="particle-system.tsx">
                            <ParticleDemo />
                        </DemoShell>
                    </div>
                </FadeIn>

                {/* ── Step 10: Architecture Composition ── */}
                <SectionRule />
                <FadeIn>
                    <div className="space-y-5">
                        <div className="flex items-start gap-3">
                            <StepBadge n={10} />
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Tag>{'ARCHITECTURE'}</Tag>
                                    <Tag>{'REACT'}</Tag>
                                </div>
                                <h2 className="text-xl font-bold">{'Composing the hooks and the render loop'}</h2>
                            </div>
                        </div>

                        <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                            {'The four custom hooks are independent systems that share data through '}
                            <Pill>{'useRef'}</Pill>
                            {" — mutable values that don't trigger React re-renders. The main component wires them together and runs a single "}
                            <Pill>{'requestAnimationFrame'}</Pill>
                            {' loop that calls each system in sequence.'}
                        </p>

                        <CodeBlock lang="tsx">{`export function GoogleCountdown() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Each hook is a self-contained system
  const { sceneRef, cameraRef, rendererRef, stalkMeshRef,
          shaderUniforms, positions, bends, illumination,
          startScales, targetScales, delays,
          initScene, cleanupScene }        = useThreeScene();

  const { initAudio, playPluck,
          currentAudioProfile }            = useAudioEngine();

  const { currentNumber, startTransition,
          triggerEndSequence }             = useCountdownLogic({
    stalkMeshRef, positions, startScales, targetScales, delays,
    initAudio, fadeOutAudio,
  });

  const { updateMousePosition,
          updateInteraction }              = useInteraction({
    cameraRef, positions, bends, illumination,
    shaderUniforms, stalkMeshRef,
    currentAudioProfile, playPluck,
  });

  // Single RAF loop — all systems update in sequence
  useEffect(() => {
    if (!animationStarted) return;
    let id: number;
    let last = performance.now();

    const animate = () => {
      id = requestAnimationFrame(animate);
      const now   = performance.now();
      const delta = now - last;
      last = now;

      updateInteraction(now, delta);              // physics, audio, GPU uploads
      rendererRef.current!.render(               // WebGL draw
        sceneRef.current!, cameraRef.current!
      );
    };
    animate();
    return () => cancelAnimationFrame(id);
  }, [animationStarted, updateInteraction, rendererRef, sceneRef, cameraRef]);

  return <div ref={containerRef} />;
}`}</CodeBlock>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                {
                                    icon: '🎨',
                                    hook: 'useThreeScene',
                                    desc: 'Scene, camera, renderer, 168K instanced geometry, shader materials, particle systems',
                                },
                                {
                                    icon: '🔊',
                                    hook: 'useAudioEngine',
                                    desc: '10 pentatonic profiles, drone oscillators, pluck synthesis, delay/reverb, voice pooling',
                                },
                                {
                                    icon: '⏱️',
                                    hook: 'useCountdownLogic',
                                    desc: 'Off-screen canvas number rendering, height map sampling, transition orchestration',
                                },
                                {
                                    icon: '🖱️',
                                    hook: 'useInteraction',
                                    desc: 'Raycaster, spatial grid, stalk bending, illumination decay, dust spawning',
                                },
                            ].map(({ icon, hook, desc }) => (
                                <div key={hook} className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg">{icon}</span>
                                        <Pill>{hook}</Pill>
                                    </div>
                                    <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '12px' }}>
                                        {desc}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <Callout variant="info">
                            <strong>{'Performance snapshot:'}</strong>
                            {
                                ' 60 fps on desktop with 168,000 instanced stalks, <100ms interaction latency, ~200MB GPU memory, 32 simultaneous audio voices. Mobile uses a 280×140 grid (156,800 stalks), capped pixel ratio, and 14 audio voices.'
                            }
                        </Callout>
                    </div>
                </FadeIn>

                {/* ── Footer ── */}
                <SectionRule />
                <FadeIn>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <TransitionLink href="/google-countdown" className="text-zinc-400 hover:text-emerald-400 transition-colors font-mono" style={{ fontSize: '13px' }}>
                            {'← View the experience'}
                        </TransitionLink>
                        <div className="flex flex-wrap gap-2">
                            <Tag>{'Three.js'}</Tag>
                            <Tag>{'WebGL'}</Tag>
                            <Tag>{'Web Audio'}</Tag>
                            <Tag>{'Canvas 2D'}</Tag>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}

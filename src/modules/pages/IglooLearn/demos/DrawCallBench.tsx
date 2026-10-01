'use client';

import { useRef } from 'react';
import * as THREE from 'three';

import { Demo, Readout, Segmented, Slider } from '../kit/controls';
import { useParams, useThreeCanvas } from '../kit/loop';
import { rng } from '../kit/math';

const DEFAULTS = { mode: 'instanced' as 'instanced' | 'separate meshes', count: 3000, dpr: '1.5' as '1' | '1.5' | '2' };

/** Same picture, two ways to draw it. Watch draw calls and the CPU cost per frame. */
export default function DrawCallBench() {
    const host = useRef<HTMLDivElement>(null);
    const calls = useRef<HTMLSpanElement>(null);
    const cpu = useRef<HTMLSpanElement>(null);
    const fps = useRef<HTMLSpanElement>(null);
    const px = useRef<HTMLSpanElement>(null);
    const { p, set, ref, reset } = useParams(DEFAULTS);

    useThreeCanvas(
        host,
        ({ renderer, size }) => {
            const scene = new THREE.Scene();
            scene.background = new THREE.Color('#0e131b');
            const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
            camera.position.set(0, 0, 38);
            scene.add(new THREE.HemisphereLight('#dfe6ef', '#3d4554', 1.4));
            const geo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
            const mat = new THREE.MeshStandardMaterial({ color: '#94dbff', roughness: 0.5 });
            const group = new THREE.Group();
            scene.add(group);
            let inst: THREE.InstancedMesh | null = null;
            let meshes: THREE.Mesh[] = [];
            const layout: { p: THREE.Vector3; s: number }[] = [];
            let built = '';
            const dummy = new THREE.Object3D();
            const stats = { t: 0, frames: 0, cpu: 0 };

            const build = (mode: string, n: number) => {
                if (inst) group.remove(inst);
                meshes.forEach((m) => group.remove(m));
                inst?.dispose();
                inst = null;
                meshes = [];
                layout.length = 0;
                const r = rng(4);
                for (let i = 0; i < n; i++) {
                    const rad = Math.cbrt(r()) * 16;
                    const a = r() * Math.PI * 2;
                    const b = Math.acos(r() * 2 - 1);
                    layout.push({ p: new THREE.Vector3(Math.sin(b) * Math.cos(a) * rad, Math.cos(b) * rad * 0.7, Math.sin(b) * Math.sin(a) * rad), s: r() * 6 });
                }
                if (mode === 'instanced') {
                    inst = new THREE.InstancedMesh(geo, mat, n);
                    group.add(inst);
                } else {
                    meshes = layout.map(() => new THREE.Mesh(geo, mat));
                    meshes.forEach((m) => group.add(m));
                }
            };

            return {
                resize: (w, h) => {
                    camera.aspect = w / h;
                    camera.updateProjectionMatrix();
                },
                frame: (t, dt) => {
                    const P = ref.current;
                    const key = `${P.mode}|${P.count}`;
                    if (key !== built) {
                        built = key;
                        build(P.mode, P.count);
                    }
                    const want = Math.min(Number(P.dpr), window.devicePixelRatio || 1);
                    if (renderer.getPixelRatio() !== want) {
                        renderer.setPixelRatio(want);
                        renderer.setSize(size.w, size.h, false);
                    }
                    const start = performance.now();
                    for (let i = 0; i < layout.length; i++) {
                        const L = layout[i];
                        dummy.position.copy(L.p);
                        dummy.rotation.set(t * 0.8 + L.s, t * 0.6 + L.s, 0);
                        if (inst) {
                            dummy.updateMatrix();
                            inst.setMatrixAt(i, dummy.matrix);
                        } else {
                            meshes[i].position.copy(dummy.position);
                            meshes[i].rotation.copy(dummy.rotation);
                        }
                    }
                    if (inst) inst.instanceMatrix.needsUpdate = true;
                    group.rotation.y = t * 0.1;
                    renderer.render(scene, camera);
                    stats.cpu += performance.now() - start;
                    stats.frames++;
                    stats.t += dt;
                    if (stats.t > 0.5) {
                        if (fps.current) fps.current.textContent = String(Math.round(stats.frames / stats.t));
                        if (cpu.current) cpu.current.textContent = `${(stats.cpu / stats.frames).toFixed(2)} ms`;
                        if (calls.current) calls.current.textContent = String(renderer.info.render.calls);
                        if (px.current) px.current.textContent = `${Math.round(size.w * want)}×${Math.round(size.h * want)}`;
                        stats.t = stats.frames = stats.cpu = 0;
                    }
                },
                dispose: () => {
                    inst?.dispose();
                    geo.dispose();
                    mat.dispose();
                },
            };
        },
        [],
        { antialias: false },
    );

    return (
        <Demo
            title="Draw-call bench — instanced vs separate"
            hint="Switch between the two modes at 3,000+ cubes and compare draw calls and CPU time. Then try pixel ratio 2."
            onReset={reset}
            controls={
                <>
                    <Segmented label="draw as" options={['instanced', 'separate meshes'] as const} value={p.mode} onChange={(v) => set('mode', v)} />
                    <Slider label="cubes" value={p.count} min={100} max={10000} step={100} onChange={(v) => set('count', v)} />
                    <Segmented label="pixel ratio (capped by your screen)" options={['1', '1.5', '2'] as const} value={p.dpr} onChange={(v) => set('dpr', v)} />
                    <Readout
                        items={[
                            { label: 'draw calls', value: <span ref={calls}>–</span>, color: 'var(--il-ice)' },
                            { label: 'CPU / frame', value: <span ref={cpu}>–</span>, color: 'var(--il-lilac)' },
                            { label: 'fps', value: <span ref={fps}>–</span> },
                            { label: 'pixels', value: <span ref={px}>–</span> },
                        ]}
                    />
                    <p className="text-[11.5px] leading-snug text-[var(--il-faint)]">
                        CPU time = JavaScript updating transforms + three.js submitting draw calls. GPU time isn’t visible here, but grows with pixels.
                    </p>
                </>
            }
        >
            <div ref={host} className="h-[380px] sm:h-[440px]" />
        </Demo>
    );
}

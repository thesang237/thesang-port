'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { Demo, Group, Slider, Toggle } from '../kit/controls';
import { disposeTree, useParams, useThreeCanvas } from '../kit/loop';
import { clamp, damp, fbm2, ridged2, smoothstep } from '../kit/math';

import { FOG } from './iglooScene';

const DEFAULTS = { plateau: 2.7, lumps: 1.6, lumpScale: 0.16, octaves: 5, peaks: 34, wire: false };
type P = typeof DEFAULTS;

// same recipe as IglooWorld's terrainHeight, split into named layers
const layers = (x: number, z: number, P: P) => {
    const r = Math.hypot(x, z);
    const plateau = r < P.plateau ? 0 : -Math.min(Math.pow(r - P.plateau, 2) * 0.028, 7);
    const lumps = fbm2(x * P.lumpScale + 3, z * P.lumpScale, P.octaves) * P.lumps * smoothstep(P.plateau - 0.3, 9, r);
    const peaks = ridged2(x * 0.03 + 7, z * 0.03 + 2) * P.peaks * smoothstep(12, 60, r);
    return { plateau, lumps, peaks, total: plateau + lumps + peaks };
};

/** Terrain = a flat grid whose points are pushed up by layered noise. */
export default function TerrainLab() {
    const host = useRef<HTMLDivElement>(null);
    const graph = useRef<HTMLCanvasElement>(null);
    const { p, set, ref, reset } = useParams(DEFAULTS);

    useThreeCanvas(host, ({ renderer, pointer }) => {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(FOG);
        scene.fog = new THREE.FogExp2(FOG, 0.012);
        const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 500);
        scene.add(new THREE.HemisphereLight('#e6ecf3', '#4b5362', 1.1));
        const sun = new THREE.DirectionalLight('#ffffff', 1.6);
        sun.position.set(-30, 40, 20);
        scene.add(sun);

        const seg = 180;
        const geo = new THREE.PlaneGeometry(2, 2, seg, seg);
        geo.rotateX(-Math.PI / 2);
        const base = (geo.attributes.position as THREE.BufferAttribute).array.slice() as Float32Array;
        const colors = new Float32Array((seg + 1) * (seg + 1) * 3);
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const solid = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: false });
        const wire = new THREE.MeshBasicMaterial({ color: '#56657a', wireframe: true });
        const mesh = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(geo, solid);
        scene.add(mesh);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(1.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#5c6470', roughness: 0.9 }));
        scene.add(dome);

        const snow = new THREE.Color('#c9d0da');
        const rock = new THREE.Color('#6b7280');
        const c = new THREE.Color();
        let last = '';
        const rebuild = (P: P) => {
            const pos = geo.attributes.position as THREE.BufferAttribute;
            for (let i = 0; i < pos.count; i++) {
                const u = base[i * 3];
                const v = base[i * 3 + 2];
                const x = u * (Math.abs(u) * 150 + 10);
                const z = v * (Math.abs(v) * 150 + 10);
                pos.setXYZ(i, x, layers(x, z, P).total, z);
            }
            pos.needsUpdate = true;
            geo.computeVertexNormals();
            const nrm = geo.attributes.normal as THREE.BufferAttribute;
            for (let i = 0; i < pos.count; i++) {
                const slope = 1 - nrm.getY(i);
                c.copy(snow).lerp(rock, clamp(smoothstep(0.18, 0.55, slope)));
                colors.set([c.r, c.g, c.b], i * 3);
            }
            (geo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
        };

        let angle = 0.6;
        let sx = 0;
        return {
            resize: (w, h) => {
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
            },
            frame: (_, dt) => {
                const P = ref.current;
                const key = JSON.stringify([P.plateau, P.lumps, P.lumpScale, P.octaves, P.peaks]);
                if (key !== last) {
                    last = key;
                    rebuild(P);
                }
                mesh.material = P.wire ? wire : solid;
                angle += dt * 0.06;
                sx = damp(sx, pointer.over ? pointer.x : 0, 3, dt);
                const a = angle + sx * 0.6;
                camera.position.set(Math.sin(a) * 26, 9, Math.cos(a) * 26);
                camera.lookAt(0, 1, 0);
                renderer.render(scene, camera);
            },
            dispose: () => {
                disposeTree(scene);
                wire.dispose();
            },
        };
    });

    // cross-section graph: the layers along one line through the igloo
    useEffect(() => {
        const cv = graph.current;
        const ctx = cv?.getContext('2d');
        if (!cv || !ctx) return;
        const dpr = Math.min(window.devicePixelRatio, 2);
        const w = cv.clientWidth;
        const h = cv.clientHeight;
        cv.width = w * dpr;
        cv.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        const span = 70;
        const yMin = -9;
        const yMax = Math.max(12, p.peaks * 0.6);
        const Y = (v: number) => h - 8 - ((v - yMin) / (yMax - yMin)) * (h - 16);
        const lines: [keyof ReturnType<typeof layers>, string, number][] = [
            ['plateau', '#94dbff', 1.2],
            ['lumps', '#d4c2ff', 1.2],
            ['peaks', '#ffd08a', 1.2],
            ['total', '#e8edf4', 2],
        ];
        lines.forEach(([k, color, lw]) => {
            ctx.beginPath();
            for (let i = 0; i <= 400; i++) {
                const x = (i / 400) * span * 2 - span;
                const v = layers(x, 0.5, p)[k];
                const px = (i / 400) * w;
                if (i === 0) ctx.moveTo(px, Y(v));
                else ctx.lineTo(px, Y(v));
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = lw;
            ctx.stroke();
        });
        ctx.fillStyle = '#5c6470';
        ctx.beginPath();
        ctx.arc(w / 2, Y(0), 7, Math.PI, 0);
        ctx.fill();
    }, [p]);

    return (
        <Demo
            title="Terrain lab — landscape from layered noise"
            hint="Each dial is one layer of the height recipe. The graph is a slice through the igloo: blue plateau + lilac lumps + amber mountains = white total."
            onReset={reset}
            controls={
                <>
                    <Group title="Height layers">
                        <Slider
                            label="plateau radius"
                            value={p.plateau}
                            min={0.5}
                            max={8}
                            step={0.1}
                            onChange={(v) => set('plateau', v)}
                            help="Flat ground for the igloo; outside it the land falls away as a curve (r²)."
                        />
                        <Slider label="lumps height" value={p.lumps} min={0} max={5} step={0.05} onChange={(v) => set('lumps', v)} help="fbm noise — rolling snow drifts." />
                        <Slider
                            label="lumps scale"
                            value={p.lumpScale}
                            min={0.03}
                            max={0.6}
                            step={0.005}
                            onChange={(v) => set('lumpScale', v)}
                            help="Small = wide, gentle hills. Large = busy, bumpy."
                        />
                        <Slider label="octaves" value={p.octaves} min={1} max={7} step={1} onChange={(v) => set('octaves', v)} help="Layers of detail in the fbm. 1 = blobby, 5 = natural." />
                        <Slider
                            label="mountains"
                            value={p.peaks}
                            min={0}
                            max={70}
                            step={0.5}
                            onChange={(v) => set('peaks', v)}
                            help="Ridged noise: 1 − |noise| makes sharp crests. Only far away (smoothstep 12 → 60)."
                        />
                        <Toggle label="wireframe" checked={p.wire} onChange={(v) => set('wire', v)} help="See the trick: grid cells are tiny near the centre and huge at the horizon." />
                    </Group>
                </>
            }
        >
            <div ref={host} className="h-[380px] sm:h-[440px]" />
            <div className="border-t border-[var(--il-line)] px-4 pb-3 pt-2">
                <div className="il-mono mb-1 flex flex-wrap gap-3 text-[10px]">
                    <span className="text-[var(--il-ice)]">— plateau</span>
                    <span className="text-[var(--il-lilac)]">— lumps (fbm)</span>
                    <span className="text-[var(--il-warn)]">— mountains (ridged)</span>
                    <span className="text-[var(--il-ink)]">— total height</span>
                </div>
                <canvas ref={graph} className="block h-[120px] w-full" />
            </div>
        </Demo>
    );
}

'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';

import { Demo, Readout, Slider, Toggle } from '../kit/controls';
import { makeLoaders } from '../kit/gl';
import { useParams, useThreeCanvas } from '../kit/loop';
import { curvePath, mapX, mapY } from '../kit/plot';
import { baseView, PaintedScene, type Painting, PAINTINGS, seg, storyProgress } from '../kit/source';

const T0 = 4.6;
const T1 = 9.6;
const DEFAULTS = { t: 6.2, curve: true };
/** the story painting without its flipbook planes (hair, cloth): those need sprite sheets (chapter 09) */
const DEF: Painting = { ...PAINTINGS.story, fx: [] };

/**
 * Chapter 05: the story GLB carries a baked camera move (10.4 s). The page never plays it in time:
 * storyProgress(t) turns the film clock into a position along that clip, and the mixer jumps there.
 */
export default function StoryScrub() {
    const host = useRef<HTMLDivElement>(null);
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const [status, setStatus] = useState('Loads 4.6 MB when scrolled into view');
    const k = p.curve ? storyProgress(p.t) : seg(p.t, T0, T1);

    useThreeCanvas(host, ({ renderer, size }) => {
        renderer.setClearColor('#cf9a7a', 1);
        const loaders = makeLoaders(renderer);
        let painted: PaintedScene | null = null;
        let started = false;
        const view = baseView();
        const quadScene = new THREE.Scene();
        const quadCam = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 2);
        quadCam.position.z = 1;
        const quadMat = new THREE.MeshBasicMaterial();
        const quadGeo = new THREE.PlaneGeometry(1, 1);
        quadScene.add(new THREE.Mesh(quadGeo, quadMat));
        let sizedW = 0;
        return {
            frame: (time) => {
                if (!started) {
                    started = true;
                    setStatus('Loading project-2048.glb…');
                    loaders.gltf
                        .loadAsync(DEF.glb)
                        .then((glb) => {
                            painted = new PaintedScene(glb, DEF, {} as never);
                            quadMat.map = painted.texture;
                            quadMat.needsUpdate = true;
                            setStatus('');
                        })
                        .catch(() => setStatus('Could not load the painting'));
                }
                if (!painted) {
                    renderer.clear();
                    return;
                }
                if (sizedW !== size.w) {
                    painted.resize(size.w, size.h, size.dpr);
                    sizedW = size.w;
                }
                const d = ref.current;
                // the page frames the story a little tighter than the file (STORY_ZOOM = 1.12)
                Object.assign(view, { progress: d.curve ? storyProgress(d.t) : seg(d.t, T0, T1), zoom: 1.12, fx: 0.5, fy: 0.5, time });
                painted.render(renderer, view);
                renderer.render(quadScene, quadCam);
            },
            dispose: () => {
                painted?.dispose();
                painted?.scene.traverse((o) => {
                    const m = o as THREE.Mesh;
                    if (!m.isMesh) return;
                    m.geometry.dispose();
                    (m.material as THREE.MeshBasicMaterial).map?.dispose();
                });
                quadGeo.dispose();
                quadMat.dispose();
                loaders.dispose();
            },
        };
    });

    const G = { w: 600, h: 120 };
    return (
        <Demo
            title="Scrubbing a baked camera clip"
            hint="Drag the film clock through the story (4.6 → 9.6). The camera drifts over the clouds, travels down the mountains, lands on the two figures."
            onReset={reset}
            controls={
                <>
                    <Slider label="film t" value={p.t} min={T0} max={T1} step={0.005} onChange={(v) => set('t', v)} />
                    <Toggle
                        label="storyProgress curve"
                        checked={p.curve}
                        onChange={(v) => set('curve', v)}
                        help="Off: the clip is spread evenly over the story. On: three eased stretches matched to the reference."
                    />
                    <Readout
                        items={[
                            { label: 'clip position', value: `${(k * 100).toFixed(1)} %`, color: '#c0fb50' },
                            { label: 'clip time', value: `${(k * 10.4).toFixed(2)} s` },
                        ]}
                    />
                </>
            }
        >
            {/* the canvas box has no React children: React may reset a box's text content, which would wipe the canvas */}
            <div className="relative aspect-[16/9] w-full">
                <div ref={host} className="absolute inset-0" />
                {status ? (
                    <div className="kl-mono absolute left-3 top-3 z-10 flex items-center gap-2 bg-[var(--kl-black)] px-2 py-1 text-[10.5px] uppercase text-white">
                        <span className="kl-dot animate-pulse text-[var(--kl-lime)]" />
                        {status}
                    </div>
                ) : null}
            </div>
            <div className="border-t border-[var(--kl-line)] p-4">
                <svg viewBox={`-4 -6 ${G.w + 8} ${G.h + 26}`} className="w-full" role="img" aria-label="Clip position against film time">
                    <path d={curvePath((x) => seg(x, T0, T1), G.w, G.h, T0, T1)} stroke="#8a8a94" strokeDasharray="4 4" fill="none" />
                    <path d={curvePath(storyProgress, G.w, G.h, T0, T1)} stroke="#0c0c0e" strokeWidth={2} fill="none" />
                    <line x1={mapX(p.t, G.w, T0, T1)} x2={mapX(p.t, G.w, T0, T1)} y1={0} y2={G.h} stroke="#5b4daa" />
                    <rect x={mapX(p.t, G.w, T0, T1) - 5} y={mapY(k, G.h, 0, 1) - 5} width={10} height={10} fill="#c0fb50" stroke="#0c0c0e" />
                    {[5, 6, 7, 8, 9].map((v) => (
                        <text key={v} x={mapX(v, G.w, T0, T1)} y={G.h + 16} fontSize={10} textAnchor="middle" fontFamily="ui-monospace" fill="#8a8a94">
                            {v}
                        </text>
                    ))}
                </svg>
            </div>
        </Demo>
    );
}

'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';

import { Demo, Group, Readout, Segmented, Slider, Toggle } from '../kit/controls';
import { makeLoaders } from '../kit/gl';
import { useParams, useThreeCanvas } from '../kit/loop';
import { baseView, damp, PaintedScene, type Painting, PAINTINGS } from '../kit/source';

const FRAMINGS = {
    closeup: { label: 'Landing close-up', zoom: 3.1, fx: 0.5, fy: 0.418 },
    card: { label: 'Intro card', zoom: 1.8, fx: 0.5, fy: 0.41 },
    file: { label: 'File camera', zoom: 1, fx: 0.5, fy: 0.5 },
} as const;
type FramingKey = keyof typeof FRAMINGS;

const L = PAINTINGS.landing;
const DEFAULTS = { framing: 'card' as FramingKey, zoom: 1.8, fx: 0.5, fy: 0.41, yaw: L.orbit[0], pitch: L.orbit[1], pivot: L.pivot, side: true, director: 0.9, autoPointer: true };

/**
 * Chapter 05: the real landing painting (landing-2048.glb) in the real PaintedScene class. Left: what
 * the card shows (the scene rendered into a texture). Right: a director's camera looking at the same
 * planes from the side, with the card's camera drawn as a frustum.
 */
export default function PaintedLab() {
    const host = useRef<HTMLDivElement>(null);
    const { p, set, merge, ref, reset } = useParams(DEFAULTS);
    const [status, setStatus] = useState('Loads 3.9 MB when scrolled into view');
    const [info, setInfo] = useState({ planes: 0 });

    useThreeCanvas(host, ({ renderer, pointer, size }) => {
        renderer.setClearColor('#f3f2ee', 1);
        renderer.autoClear = false;
        const loaders = makeLoaders(renderer);
        // our own copy of the painting definition, so the orbit dials can change it live
        const def: Painting = { ...L, orbit: [L.orbit[0], L.orbit[1]] };
        let painted: PaintedScene | null = null;
        let started = false;
        const view = baseView();
        // the card view: a full-viewport quad showing the painting's texture
        const quadScene = new THREE.Scene();
        const quadCam = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 2);
        quadCam.position.z = 1;
        const quadMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const quadGeo = new THREE.PlaneGeometry(1, 1);
        quadScene.add(new THREE.Mesh(quadGeo, quadMat));
        // the director's view
        const helperScene = new THREE.Scene();
        const sideCam = new THREE.PerspectiveCamera(35, 1, 0.01, 200);
        const proxy = new THREE.PerspectiveCamera();
        proxy.matrixAutoUpdate = false;
        proxy.matrixWorldAutoUpdate = false;
        const helper = new THREE.CameraHelper(proxy);
        helperScene.add(helper);
        const pivotDot = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), new THREE.MeshBasicMaterial({ color: 0xc0fb50 }));
        helperScene.add(pivotDot);
        const fwd = new THREE.Vector3();
        const right = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);
        const camPos = new THREE.Vector3();
        const mid = new THREE.Vector3();
        const sp = { x: 0, y: 0 };
        let leftW = 1;

        const load = () => {
            started = true;
            setStatus('Loading landing-2048.glb…');
            loaders.gltf
                .loadAsync(L.glb)
                .then((glb) => {
                    painted = new PaintedScene(glb, def, {} as never);
                    quadMat.map = painted.texture;
                    quadMat.needsUpdate = true;
                    let planes = 0;
                    glb.scene.traverse((o) => {
                        if ((o as THREE.Mesh).isMesh && o.visible) planes++;
                    });
                    setInfo({ planes });
                    setStatus('');
                    sized = false;
                })
                .catch(() => setStatus('Could not load the painting'));
        };
        let sized = false;

        return {
            resize: () => {
                sized = false;
            },
            frame: (time, dt) => {
                if (!started) load();
                const d = ref.current;
                const W = size.w;
                const H = size.h;
                renderer.setViewport(0, 0, W, H);
                renderer.setScissorTest(false);
                renderer.clear();
                if (!painted) return;
                const side = d.side && W > 520;
                leftW = side ? Math.round(W * 0.56) : W;
                if (!sized) {
                    painted.resize(leftW, H, size.dpr);
                    sized = true;
                }
                if (painted.camera.aspect !== leftW / H) painted.resize(leftW, H, size.dpr);
                // pointer → smoothed, like the card's inner layer (≈ 5.5 /s)
                const over = pointer.over && pointer.px < leftW;
                const tx = d.autoPointer && !over ? Math.sin(time * 0.6) * 0.8 : over ? (pointer.px / leftW) * 2 - 1 : 0;
                const ty = d.autoPointer && !over ? Math.sin(time * 0.45 + 1) * 0.5 : over ? pointer.y : 0;
                sp.x = damp(sp.x, tx, 5.5, dt);
                sp.y = damp(sp.y, ty, 5.5, dt);
                def.orbit[0] = d.yaw;
                def.orbit[1] = d.pitch;
                // pivotDist is private in the class (read once from the definition): set it directly for the demo
                (painted as unknown as { pivotDist: number }).pivotDist = d.pivot;
                Object.assign(view, { px: sp.x, py: sp.y, zoom: d.zoom, fx: d.fx, fy: d.fy, time });
                painted.render(renderer, view);
                // copy the camera pose actually used for this render (before anything recomputes it)
                proxy.matrixWorld.copy(painted.camera.matrixWorld);
                proxy.fov = painted.camera.fov;
                proxy.aspect = painted.camera.aspect;
                proxy.near = 0.05;
                proxy.far = d.pivot * 1.6;
                if (painted.camera.view?.enabled) {
                    const v = painted.camera.view;
                    proxy.setViewOffset(v.fullWidth, v.fullHeight, v.offsetX, v.offsetY, v.width, v.height);
                } else proxy.clearViewOffset();
                proxy.updateProjectionMatrix();
                helper.update();
                painted.camera.getWorldDirection(fwd);
                pivotDot.position.setFromMatrixPosition(proxy.matrixWorld).addScaledVector(fwd, d.pivot);

                // left: the card's picture
                renderer.setViewport(0, 0, leftW, H);
                renderer.render(quadScene, quadCam);

                // right: the director
                if (side) {
                    right.crossVectors(fwd, up).normalize();
                    // frame the stretch from the lens to a bit past the pivot (the sky plane is far behind)
                    camPos.setFromMatrixPosition(proxy.matrixWorld);
                    mid.copy(camPos).addScaledVector(fwd, d.pivot * 1.05);
                    const R = d.pivot * 2.3 + 0.6;
                    sideCam.position
                        .copy(mid)
                        .addScaledVector(right, Math.cos(d.director) * R)
                        .addScaledVector(fwd, -Math.sin(d.director) * R)
                        .addScaledVector(up, R * 0.28);
                    sideCam.lookAt(mid);
                    sideCam.aspect = (W - leftW) / H;
                    sideCam.updateProjectionMatrix();
                    renderer.setScissorTest(true);
                    renderer.setScissor(leftW, 0, W - leftW, H);
                    renderer.setViewport(leftW, 0, W - leftW, H);
                    renderer.setClearColor('#e9e6f6', 1);
                    renderer.clear();
                    renderer.render(painted.scene, sideCam);
                    renderer.render(helperScene, sideCam);
                    renderer.setClearColor('#f3f2ee', 1);
                    renderer.setScissorTest(false);
                }
            },
            dispose: () => {
                painted?.dispose();
                painted?.scene.traverse((o) => {
                    const m = o as THREE.Mesh;
                    if (!m.isMesh) return;
                    m.geometry.dispose();
                    const mat = m.material as THREE.MeshBasicMaterial;
                    mat.map?.dispose();
                });
                quadGeo.dispose();
                quadMat.dispose();
                helper.dispose();
                pivotDot.geometry.dispose();
                (pivotDot.material as THREE.Material).dispose();
                loaders.dispose();
            },
        };
    });

    return (
        <Demo
            title="A painting is a 3D scene — the real landing GLB"
            hint="Move the pointer over the left picture (or let it drift). Right: the same planes from the side; lime dot = the orbit pivot."
            onReset={reset}
            controls={
                <>
                    <Segmented
                        label="framing (choreo.ts)"
                        options={(Object.keys(FRAMINGS) as FramingKey[]).map((k) => ({ value: k, label: FRAMINGS[k].label }))}
                        value={p.framing}
                        onChange={(k) => merge({ framing: k, zoom: FRAMINGS[k].zoom, fx: FRAMINGS[k].fx, fy: FRAMINGS[k].fy })}
                    />
                    <Group title="Camera zoom (view offset)">
                        <Slider
                            label="zoom"
                            value={p.zoom}
                            min={1}
                            max={4}
                            step={0.01}
                            onChange={(v) => set('zoom', v)}
                            format={(v) => `${v.toFixed(2)}×`}
                            help="Crops into a bigger virtual frame: perspective stays true."
                        />
                        <Slider label="focus x" value={p.fx} min={0} max={1} step={0.005} onChange={(v) => set('fx', v)} />
                        <Slider label="focus y" value={p.fy} min={0} max={1} step={0.005} onChange={(v) => set('fy', v)} />
                    </Group>
                    <Group title="Pointer orbit (media.ts)">
                        <Slider
                            label="yaw at the edge"
                            value={p.yaw}
                            min={0}
                            max={0.5}
                            step={0.005}
                            onChange={(v) => set('yaw', v)}
                            format={(v) => `${v.toFixed(3)} rad`}
                            help="Source: 0.1. How far the camera swings left/right."
                        />
                        <Slider
                            label="pitch at the edge"
                            value={p.pitch}
                            min={0}
                            max={0.4}
                            step={0.005}
                            onChange={(v) => set('pitch', v)}
                            format={(v) => `${v.toFixed(3)} rad`}
                            help="Source: 0.065."
                        />
                        <Slider
                            label="pivot distance"
                            value={p.pivot}
                            min={0.2}
                            max={8}
                            step={0.05}
                            onChange={(v) => set('pivot', v)}
                            help="Source: 3 (≈ the girl’s distance). Planes nearer than the pivot move with the pointer, farther ones against it."
                        />
                        <Toggle label="drift when idle" checked={p.autoPointer} onChange={(v) => set('autoPointer', v)} />
                    </Group>
                    <Group title="View">
                        <Toggle label="director view" checked={p.side} onChange={(v) => set('side', v)} />
                        {p.side && <Slider label="director angle" value={p.director} min={-0.6} max={1.5} step={0.01} onChange={(v) => set('director', v)} />}
                    </Group>
                    <Readout
                        items={[
                            { label: 'painted planes', value: info.planes || '—' },
                            { label: 'file', value: 'landing-2048.glb' },
                        ]}
                    />
                </>
            }
        >
            {/* the canvas box has no React children: React may reset a box's text content, which would wipe the canvas */}
            <div className="relative aspect-[16/10] w-full lg:aspect-auto lg:h-full lg:min-h-[520px]">
                <div ref={host} className="absolute inset-0" />
                {status ? (
                    <div className="kl-mono absolute left-3 top-3 z-10 flex items-center gap-2 bg-[var(--kl-black)] px-2 py-1 text-[10.5px] uppercase text-white">
                        <span className="kl-dot animate-pulse text-[var(--kl-lime)]" />
                        {status}
                    </div>
                ) : null}
            </div>
        </Demo>
    );
}

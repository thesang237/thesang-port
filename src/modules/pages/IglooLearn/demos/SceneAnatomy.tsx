'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import { Demo, Group, Slider, Toggle } from '../kit/controls';
import { disposeTree, useParams, useThreeCanvas } from '../kit/loop';
import { damp } from '../kit/math';

import { buildBricks, createBrickMesh, createTerrain, FOG } from './iglooScene';

const STEPS = [
    { title: 'An empty stage', body: 'new Scene() + PerspectiveCamera + WebGLRenderer. The renderer clears the canvas to the background colour every frame. Nothing to see yet.' },
    { title: '+ Geometry', body: 'Shapes are just points joined into triangles. Shown here as wireframe: 150 rounded boxes for the igloo and a 160×160 grid bent into terrain.' },
    { title: '+ Material, no light', body: 'MeshStandardMaterial is physically based: it needs light to be seen. With no light, everything is black. (A common first-day surprise.)' },
    { title: '+ Lights', body: 'A hemisphere light (sky above, ground below) for soft fill, and a directional “sun” for form. Now roughness and shape read.' },
    { title: '+ Shadows', body: 'The sun casts shadows into a 1024² shadow map. Bricks shadow each other and the snow — instantly grounded.' },
    { title: '+ Fog & sky colour', body: 'Background and FogExp2 share the same grey. Distant terrain dissolves into the sky: no horizon line, instant atmosphere and depth.' },
    {
        title: '+ Environment & glow',
        body: 'A generated room environment adds soft reflections; a point light and an HDR core inside the dome make the igloo glow. Neutral tone mapping keeps highlights soft.',
    },
];

const DEFAULTS = { step: 7, fov: 30, fog: 0.035, sun: 1.8, orbit: true };

/** Build a three.js picture one layer at a time. */
export default function SceneAnatomy() {
    const host = useRef<HTMLDivElement>(null);
    const { p, set, ref, reset } = useParams(DEFAULTS);

    useThreeCanvas(host, ({ renderer, pointer }) => {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);
        const pmrem = new THREE.PMREMGenerator(renderer);
        const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        pmrem.dispose();

        const bricks = buildBricks();
        // typed loosely so the demo can swap in a wireframe material
        const igloo: THREE.Mesh<THREE.BufferGeometry, THREE.Material> = createBrickMesh(bricks);
        const terrain: THREE.Mesh<THREE.BufferGeometry, THREE.Material> = createTerrain(160);
        const wire = new THREE.MeshBasicMaterial({ color: '#9fb4cc', wireframe: true, transparent: true, opacity: 0.55 });
        const iglooMat = igloo.material as THREE.MeshStandardMaterial;
        const terrainMat = terrain.material as THREE.MeshStandardMaterial;
        scene.add(igloo, terrain);

        const hemi = new THREE.HemisphereLight('#dfe6ef', '#5d6574', 0.8);
        const sun = new THREE.DirectionalLight('#fbfcff', 1.8);
        sun.position.set(-7, 9, 5);
        sun.shadow.mapSize.set(1024, 1024);
        sun.shadow.bias = -0.0004;
        sun.shadow.normalBias = 0.02;
        Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
        const inner = new THREE.PointLight('#d9ecff', 0, 7, 2);
        inner.position.set(0, 0.55, 0);
        const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(4.4, 4.5, 4.8), toneMapped: false }));
        core.position.copy(inner.position);
        scene.add(hemi, sun, inner, core);
        const fog = new THREE.FogExp2(FOG, 0.035);
        const dark = new THREE.Color('#0e131b');
        const fogColor = new THREE.Color(FOG);

        let angle = 0.35;
        let lastStep = -1;
        const sm = { x: 0, y: 0 };

        return {
            resize: (w, h) => {
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
            },
            frame: (t, dt) => {
                const P = ref.current;
                const s = P.step;
                if (s !== lastStep) {
                    lastStep = s;
                    igloo.visible = terrain.visible = s >= 2;
                    igloo.material = s === 2 ? wire : iglooMat;
                    terrain.material = s === 2 ? wire : terrainMat;
                    hemi.visible = sun.visible = s >= 4;
                    sun.castShadow = s >= 5;
                    scene.fog = s >= 6 ? fog : null;
                    scene.background = s >= 6 ? fogColor : dark;
                    scene.environment = s >= 7 ? env : null;
                    scene.environmentIntensity = 0.35;
                    inner.intensity = s >= 7 ? 22 : 0;
                    inner.castShadow = s >= 7;
                    core.visible = s >= 7;
                    renderer.toneMapping = s >= 7 ? THREE.NeutralToneMapping : THREE.NoToneMapping;
                    [iglooMat, terrainMat, wire].forEach((m) => {
                        m.needsUpdate = true;
                    });
                }
                fog.density = P.fog;
                sun.intensity = P.sun;
                inner.intensity = s >= 7 ? 22 * (1 + Math.sin(t * 11.3) * 0.03 + Math.sin(t * 6.7) * 0.03) : 0;

                if (P.orbit) angle += dt * 0.12;
                sm.x = damp(sm.x, pointer.over ? pointer.x : 0, 3, dt);
                sm.y = damp(sm.y, pointer.over ? pointer.y : 0, 3, dt);
                const a = angle + sm.x * 0.4;
                camera.position.set(Math.sin(a) * 12.6, 2.9 + sm.y * 1.2, Math.cos(a) * 12.6);
                camera.lookAt(0.25, 1.15, 0);
                if (camera.fov !== P.fov) {
                    camera.fov = P.fov;
                    camera.updateProjectionMatrix();
                }
                renderer.render(scene, camera);
            },
            dispose: () => {
                disposeTree(scene);
                wire.dispose();
                env.dispose();
            },
        };
    });

    const step = STEPS[p.step - 1];
    return (
        <Demo
            title="Scene anatomy — build the picture layer by layer"
            hint="Drag “layer” from 1 to 7. Each step adds one idea. Then play with the lens (field of view) and fog."
            onReset={reset}
            controls={
                <>
                    <Group title="Build-up">
                        <Slider label="layer" value={p.step} min={1} max={7} step={1} onChange={(v) => set('step', v)} format={(v) => `${v} / 7`} />
                        <div className="rounded-lg border border-[var(--il-line)] bg-black/25 p-3">
                            <div className="mb-1 text-[14px] font-semibold text-[var(--il-ink)]">{step.title}</div>
                            <p className="text-[12.5px] leading-relaxed text-[var(--il-dim)]">{step.body}</p>
                        </div>
                    </Group>
                    <Group title="Dials">
                        <Slider
                            label="field of view (°)"
                            value={p.fov}
                            min={12}
                            max={90}
                            step={1}
                            onChange={(v) => set('fov', v)}
                            help="Igloo hero: 30° — a long lens that flattens and feels cinematic. 70°+ feels like a phone camera."
                        />
                        <Slider
                            label="fog density"
                            value={p.fog}
                            min={0}
                            max={0.12}
                            step={0.001}
                            onChange={(v) => set('fog', v)}
                            help="Visible from layer 6. Igloo animates this: 0.2 in the loader → 0.021 hero → 0.06 when exploding."
                        />
                        <Slider label="sun intensity" value={p.sun} min={0} max={4} step={0.05} onChange={(v) => set('sun', v)} />
                        <Toggle label="auto orbit" checked={p.orbit} onChange={(v) => set('orbit', v)} />
                    </Group>
                </>
            }
        >
            <div ref={host} className="h-[440px] sm:h-[520px]" />
        </Demo>
    );
}

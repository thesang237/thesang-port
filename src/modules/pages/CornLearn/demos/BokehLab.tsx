'use client';

import { useRef } from 'react';
import * as THREE from 'three';

import { Demo, Group, Segmented, Slider, Toggle } from '../kit/controls';
import { createLinearOutput, disposeObject } from '../kit/gl';
import { prefersReducedMotion, useParams, useThreeCanvas } from '../kit/loop';
import { accentBackdropMaterial, type AreaPreset, DofController, particleArea, tickPoly } from '../kit/source';

/**
 * The page's own bokeh: particleArea() spiral clouds of polygon sprites with polyMaterial, a
 * DofController whose focus follows the pointer, seen through the reference camera (45°, z 10)
 * that slides toward the pointer. Presets are the real scene presets.
 */
type Preset = { areas: [AreaPreset, number][]; dof: { width: number; height: number; farMin: number; farMax: number }; bg: [string, string, string]; at: [number, number, number] };
const PRESETS: Record<'hero' | 'helix' | 'kernel', Preset> = {
    hero: {
        areas: [
            [{ pX: 2.33, pY: -3.05, s: 1, rY: -27.746, color: '#103f0c', o: 0.8, particleSizeMin: 10, particleSizeMax: 200, radius: 2 }, 200],
            [{ pX: 1.4, pY: -2.82, s: 0.6, rY: -47.968, rZ: 1.84, color: '#b22020', o: 1, particleSizeMin: 10, particleSizeMax: 80, radius: 4 }, 200],
            [{ pX: -3.27, pY: -2.15, s: 1, rY: -11.1965, color: '#103f42', o: 0.58, particleSizeMin: 5, particleSizeMax: 200, radius: 3 }, 500],
        ],
        dof: { width: 5, height: 12, farMin: 25, farMax: 40 },
        bg: ['#00160a', '#004484', '#025b15'],
        // the hero camera rises through the clouds with the scroll; centre them for the lab
        at: [-0.4, 2.6, 0],
    },
    helix: {
        areas: [
            [{ pY: -2.01, s: 1.02, rY: -28.8, rZ: -1, color: '#06fcb2', o: 2, particleSizeMin: 12, particleSizeMax: 20, radius: 3 }, 200],
            [{ pX: 3.25, pY: -3.29, pZ: -1.5, rY: -13.5, rZ: -1, color: '#41be91', o: 0.3, particleSizeMin: 3, particleSizeMax: 120, radius: 3 }, 200],
            [{ pX: -0.51, pY: -2.86, pZ: 1.18, s: 1.01, rY: -149.75, color: '#e80a5a', o: 1, particleSizeMin: 10, particleSizeMax: 20, radius: 3.03 }, 300],
            [{ pX: -4.24, pY: 1.75, s: 0.27, rX: -4, rY: -123.66, rZ: -1.71, color: '#15f7a6', o: 2.54, particleSizeMin: 1, particleSizeMax: 50, radius: 2.83 }, 300],
        ],
        dof: { width: 5, height: 12, farMin: 32, farMax: 32 },
        bg: ['#17120f', '#4e2e10', '#224528'],
        at: [0, 1.6, 0],
    },
    kernel: {
        areas: [
            [{ pX: -10, pY: -10, pZ: -30, s: 3, rY: -29.7, rZ: -1, color: '#ffffff', o: 0.17, particleSizeMin: 10, particleSizeMax: 180, radius: 6 }, 200],
            [{ pX: 3.6, pY: 0.5, pZ: 1.74, s: 1, rY: -7.08, color: '#12eefc', o: 0.36, particleSizeMin: 3, particleSizeMax: 40, radius: 3.09 }, 200],
            [{ color: '#5f661e', o: 0.3, particleSizeMin: 3, particleSizeMax: 120, radius: 3 }, 200],
        ],
        dof: { width: 10, height: 5, farMin: 40, farMax: 70 },
        bg: ['#160b05', '#6a2c0c', '#2e2a08'],
        at: [-1.5, 0.4, 0],
    },
};
type PresetId = keyof typeof PRESETS;
const ZERO = new THREE.Vector2();
const DEFAULTS = { preset: 'hero' as PresetId, sides: '5' as '0' | '3' | '4' | '5' | '6' | '8', size: 1, opacity: 1, near: 4, far: 1, follow: true, drift: true };

export default function BokehLab() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const ring = useRef<HTMLDivElement>(null);

    useThreeCanvas(
        host,
        ({ renderer, size, pointer }) => {
            const out = createLinearOutput({ samples: 0, grain: 0.05, vignette: true });
            const scene = new THREE.Scene();
            const bgMat = accentBackdropMaterial('#00160a', '#004484', '#025b15', [0.2, 0.2], [0.8, 0.8]);
            const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
            bg.frustumCulled = false;
            scene.add(bg);
            const flat = new THREE.Camera();
            const fx = new THREE.Scene();
            const cam = new THREE.PerspectiveCamera(45, 1, 1, 700);
            cam.position.set(0, 0, 10);
            const dof = new DofController({ ...PRESETS.hero.dof });
            const group = new THREE.Group();
            fx.add(group);
            let built = '';
            let base: { size: [number, number]; o: number }[] = [];
            const build = (id: PresetId) => {
                group.children.slice().forEach((c) => {
                    group.remove(c);
                    disposeObject(c);
                });
                const pr = PRESETS[id];
                base = [];
                pr.areas.forEach(([a, n], k) => {
                    group.add(particleArea(a, dof, n, 100 + k));
                    base.push({ size: [a.particleSizeMin, a.particleSizeMax], o: a.o });
                });
                dof.o = { ...pr.dof };
                group.position.set(...pr.at);
                bgMat.uniforms.baseColor.value.setStyle(pr.bg[0], THREE.LinearSRGBColorSpace);
                bgMat.uniforms.accentColor1.value.setStyle(pr.bg[1], THREE.LinearSRGBColorSpace);
                bgMat.uniforms.accentColor2.value.setStyle(pr.bg[2], THREE.LinearSRGBColorSpace);
                built = id;
            };
            const ptr = new THREE.Vector2();
            let t = 0;
            let fxTime = 0;
            let drift = true;
            return {
                resize(w, h) {
                    out.setSize(w, h, size.dpr);
                    cam.aspect = w / h;
                    cam.updateProjectionMatrix();
                },
                frame(_time, dt) {
                    t += dt;
                    const prm = ref.current;
                    if (built !== prm.preset) build(prm.preset);
                    if (pointer.over) ptr.set(pointer.x, pointer.y);
                    else if (!prefersReducedMotion()) ptr.set(Math.sin(t * 0.4) * 0.7, Math.sin(t * 0.62) * 0.5);
                    const k = 1 - Math.exp(-3 * dt);
                    cam.position.x += (ptr.x * 0.75 - cam.position.x) * k;
                    cam.position.y += (ptr.y * 0.75 - cam.position.y) * k;
                    const pr = PRESETS[prm.preset].dof;
                    dof.o.farMin = pr.farMin * prm.far;
                    dof.o.farMax = pr.farMax * prm.far;
                    dof.update(prm.follow ? ptr : ZERO, true, dt);
                    dof.amount.x = prm.near;
                    if (ring.current) {
                        const show = prm.follow;
                        ring.current.style.opacity = show ? '1' : '0';
                        ring.current.style.left = `${(0.5 + ptr.x * 0.5) * 100}%`;
                        ring.current.style.top = `${(0.5 - ptr.y * 0.5) * 100}%`;
                    }
                    const flip = prm.drift !== drift;
                    drift = prm.drift;
                    group.children.forEach((c, i) => {
                        const m = (c as THREE.Points).material as THREE.ShaderMaterial;
                        m.uniforms.shapeSides.value = Number(prm.sides);
                        m.uniforms.size.value.set(base[i].size[0] * prm.size, base[i].size[1] * prm.size);
                        m.uniforms.opacity.value = base[i].o * prm.opacity;
                        if (flip) {
                            if (drift) m.defines.NOISE = '';
                            else delete m.defines.NOISE;
                            m.needsUpdate = true;
                        }
                        c.rotation.y -= 0.03 * dt;
                    });
                    fxTime += dt * 0.6;
                    tickPoly(fx, fxTime, size.h, size.dpr);
                    out.begin(renderer);
                    renderer.render(scene, flat);
                    renderer.clearDepth();
                    renderer.render(fx, cam);
                    out.present(renderer);
                },
                dispose() {
                    disposeObject(scene);
                    disposeObject(fx);
                    out.dispose();
                },
            };
        },
        [],
        { antialias: false, maxDpr: 1.5 },
    );

    return (
        <Demo
            title="Bokeh lab: the page’s particle fields"
            hint="Move the pointer: dots near the focus (the ring) shrink and sharpen into pentagons; far ones swell into soft discs. Switch presets and shapes."
            onReset={reset}
            stacked
            controls={
                <>
                    <Segmented label="scene preset" options={['hero', 'helix', 'kernel'] as const} value={p.preset} onChange={(v) => set('preset', v)} />
                    <Segmented
                        label="sprite shape (sides)"
                        options={[
                            { value: '0', label: 'circle' },
                            { value: '3', label: '3' },
                            { value: '4', label: '4' },
                            { value: '5', label: '5 (page)' },
                            { value: '6', label: '6' },
                            { value: '8', label: '8' },
                        ]}
                        value={p.sides}
                        onChange={(v) => set('sides', v)}
                    />
                    <Group title="Look">
                        <Slider
                            label="size"
                            value={p.size}
                            min={0.2}
                            max={3}
                            step={0.01}
                            onChange={(v) => set('size', v)}
                            format={(v) => `${v.toFixed(2)}×`}
                            help="Scales each field’s [in focus, out of focus] sizes."
                        />
                        <Slider label="opacity" value={p.opacity} min={0} max={3} step={0.01} onChange={(v) => set('opacity', v)} format={(v) => `${v.toFixed(2)}×`} />
                        <Toggle label="simplex drift" checked={p.drift} onChange={(v) => set('drift', v)} help="Each sprite wanders on 3D noise (a shader define)." />
                    </Group>
                    <Group title="Focus">
                        <Toggle label="focus follows pointer" checked={p.follow} onChange={(v) => set('follow', v)} help="Off = fixed at the centre." />
                        <Slider label="sharp within" value={p.near} min={0} max={30} step={0.5} onChange={(v) => set('near', v)} help="Distance (clip units) still fully sharp (4)." />
                        <Slider
                            label="fully soft at"
                            value={p.far}
                            min={0.2}
                            max={2.5}
                            step={0.01}
                            onChange={(v) => set('far', v)}
                            format={(v) => `${v.toFixed(2)}×`}
                            help="Scales the preset’s far edge (hero 25 → 40 while the pointer is on the page)."
                        />
                    </Group>
                </>
            }
        >
            <div className="relative aspect-[4/3] w-full sm:aspect-[16/9]">
                <div ref={host} className="absolute inset-0" />
                <div ref={ring} className="pointer-events-none absolute size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[rgba(233,196,106,0.7)]" aria-hidden>
                    <span className="cl-mono absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9.5px] uppercase text-[var(--cl-gold)]">focus</span>
                </div>
            </div>
        </Demo>
    );
}

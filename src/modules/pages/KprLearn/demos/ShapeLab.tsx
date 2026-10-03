'use client';

import { useRef } from 'react';
import * as THREE from 'three';

import { Demo, Group, Segmented, Slider, Toggle } from '../kit/controls';
import { bindSharedTextures, loadTex, makeShared } from '../kit/gl';
import { useParams, useThreeCanvas } from '../kit/loop';
import { createNotchedMaterial, IMAGES, KPR } from '../kit/source';

import { autoRadius, SHAPES } from './shapes';

type PresetKey = keyof typeof SHAPES;
const CORNERS = [
    { value: '0', label: 'TL' },
    { value: '1', label: 'TR' },
    { value: '2', label: 'BR' },
    { value: '3', label: 'BL' },
] as const;
type CornerStr = (typeof CORNERS)[number]['value'];

const fromPreset = (k: PresetKey) => {
    const s = SHAPES[k];
    return {
        preset: k,
        w: s.w,
        h: s.h,
        auto: s.radius < 0,
        radius: s.radius < 0 ? autoRadius(s.w, s.h) : s.radius,
        nCorner: String(s.notch[0]) as CornerStr,
        nAxis: s.notch[1] > 0.5 ? 'side' : 'top/bottom',
        nLen: Math.round(s.notch[2]),
        nDepth: Math.round(s.notch[3] * 10) / 10,
        n2: s.notch2[3] > 0,
        cCorner: String(s.chamfer[0]) as CornerStr,
        cSize: Math.round(s.chamfer[1] * 10) / 10,
    };
};

const DEFAULTS = { ...fromPreset('girl'), picture: true, breathe: false };

/**
 * Chapter 03: the real card shader (gl/materials/notched.ts) on one plane. Every dial is one uniform.
 * Sizes are in screen pixels at a 1440 × 900 viewport, like the page.
 */
export default function ShapeLab() {
    const host = useRef<HTMLDivElement>(null);
    const { p, set, merge, ref, reset } = useParams(DEFAULTS);

    useThreeCanvas(host, ({ renderer }) => {
        renderer.setClearColor('#f3f2ee', 1);
        const scene = new THREE.Scene();
        // orthographic pixel camera: the canvas shows 820 virtual pixels of height
        const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
        cam.position.z = 10;
        const VIEW_H = 820;
        const shared = makeShared();
        const mat = createNotchedMaterial(shared);
        mat.uniforms.uBaseF.value.set(KPR.lavender);
        const geo = new THREE.PlaneGeometry(1, 1);
        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        let tex: THREE.Texture | null = null;
        void shared.ready.then(() => bindSharedTextures(mat, shared));
        void loadTex(IMAGES.faceTraits).then((t) => {
            tex = t;
            const img = t.image as HTMLImageElement;
            mat.uniforms.uFace.value.z = img.width / img.height;
        });
        const u = mat.uniforms;
        return {
            resize: (w, h) => {
                const vw = (VIEW_H * w) / h;
                cam.left = -vw / 2;
                cam.right = vw / 2;
                cam.top = VIEW_H / 2;
                cam.bottom = -VIEW_H / 2;
                cam.updateProjectionMatrix();
            },
            frame: (time) => {
                const d = ref.current;
                const b = d.breathe ? 0.5 + 0.5 * Math.sin(time * 1.6) : 1;
                mesh.scale.set(d.w, d.h, 1);
                u.uSize.value.set(d.w, d.h);
                u.uRadius.value = d.auto ? autoRadius(d.w, d.h) : d.radius;
                u.uNotch.value.set(Number(d.nCorner), d.nAxis === 'side' ? 1 : 0, d.nLen * (d.breathe ? 0.6 + 0.4 * b : 1), d.nDepth * b);
                const s2 = SHAPES[d.preset].notch2;
                u.uNotch2.value.set(s2[0], s2[1], s2[2], d.n2 ? s2[3] : 0);
                u.uChamfer.value.set(Number(d.cCorner), d.cSize * (d.breathe ? b : 1));
                u.uMapF.value = d.picture ? tex : null;
                u.uFace.value.x = d.picture && tex ? 1 : 0;
                u.uTime.value = time;
                renderer.render(scene, cam);
            },
            dispose: () => {
                geo.dispose();
                mat.dispose();
                tex?.dispose();
                shared.dispose();
            },
        };
    });

    const s2 = SHAPES[p.preset].notch2;

    return (
        <Demo
            title="Shape lab — the real card shader"
            hint="Pick a card measured on the reference, then pull it apart: every dial is one number handed to the shader."
            onReset={reset}
            controls={
                <>
                    <Segmented
                        label="preset (measured)"
                        options={(Object.keys(SHAPES) as PresetKey[]).map((k) => ({ value: k, label: SHAPES[k].label }))}
                        value={p.preset}
                        onChange={(k) => merge(fromPreset(k))}
                    />
                    <Group title="Box">
                        <Slider label="width" value={p.w} min={60} max={900} step={1} onChange={(v) => set('w', v)} format={(v) => `${v.toFixed(0)} px`} />
                        <Slider label="height" value={p.h} min={60} max={780} step={1} onChange={(v) => set('h', v)} format={(v) => `${v.toFixed(0)} px`} />
                        <Toggle label="automatic radius" checked={p.auto} onChange={(v) => set('auto', v)} help="≈ 5.8 % of the short side, clamped 1.2–4.2 u (10.8–37.8 px here)." />
                        {!p.auto && <Slider label="radius" value={p.radius} min={0} max={80} step={0.5} onChange={(v) => set('radius', v)} format={(v) => `${v.toFixed(1)} px`} />}
                    </Group>
                    <Group title="Notch (folder tab)">
                        <Segmented label="corner" options={CORNERS} value={p.nCorner} onChange={(v) => set('nCorner', v)} />
                        <Segmented label="runs along" options={['top/bottom', 'side']} value={p.nAxis} onChange={(v) => set('nAxis', v)} />
                        <Slider
                            label="length"
                            value={p.nLen}
                            min={0}
                            max={900}
                            step={1}
                            onChange={(v) => set('nLen', v)}
                            help="How far along the edge the lowered part reaches."
                            format={(v) => `${v.toFixed(0)} px`}
                        />
                        <Slider
                            label="depth"
                            value={p.nDepth}
                            min={0}
                            max={120}
                            step={0.5}
                            onChange={(v) => set('nDepth', v)}
                            help="How far the edge steps in. 0 = no notch."
                            format={(v) => `${v.toFixed(1)} px`}
                        />
                        {s2[3] > 0 && <Toggle label="second notch" checked={p.n2} onChange={(v) => set('n2', v)} help="The trailer card’s small step on its lower left edge." />}
                    </Group>
                    <Group title="45° corner cut">
                        <Segmented label="corner" options={CORNERS} value={p.cCorner} onChange={(v) => set('cCorner', v)} />
                        <Slider label="size" value={p.cSize} min={0} max={120} step={0.5} onChange={(v) => set('cSize', v)} format={(v) => `${v.toFixed(1)} px`} />
                    </Group>
                    <Group title="Look">
                        <Toggle label="picture" checked={p.picture} onChange={(v) => set('picture', v)} help="Off: the card’s base colour (what shows while a painting loads)." />
                        <Toggle label="breathe" checked={p.breathe} onChange={(v) => set('breathe', v)} help="Animate notch and cut: every part of the outline is a live number." />
                    </Group>
                </>
            }
        >
            <div ref={host} className="aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[560px]" />
        </Demo>
    );
}

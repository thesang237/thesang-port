'use client';

import { useRef } from 'react';
import * as THREE from 'three';

import { ColorInput, Demo, Group, Readout, Slider, Toggle } from '../kit/controls';
import { COVER_VERT, coverUv, loadTexture, pixelCamera, placeOver } from '../kit/gl';
import { gsap } from '../kit/gsap';
import { useParams, useThreeCanvas } from '../kit/loop';
import { IMG } from '../kit/source';

// slots 1 and 2 of the menu (shell/Menu.tsx) and the MenuGL colours
const PHOTOS = [
    { src: IMG.portraitHelmet, w: 2400, h: 1288, pos: [0.5, 0.18], zoom: 1.35, label: 'HOME' },
    { src: IMG.portrait, w: 2400, h: 1288, pos: [0.5, 0.22], zoom: 1.5, label: 'ON TRACK' },
] as const;
const DEFAULTS = { dark: '#283024', light: '#d2d6c3', amp: 0.018, freq: 38, clip: 1, manual: false, a: 0.5, inT: 0.18, outT: 0.45 };

const FRAG = /* glsl */ `
uniform sampler2D map;
uniform vec2 uvScale;
uniform vec2 uvOffset;
uniform float uActive;
uniform float clip;
uniform float amp;
uniform float freq;
uniform vec3 dark;
uniform vec3 light;
varying vec2 vUv;
void main() {
    float yDown = 1.0 - vUv.y;
    if (yDown > clip) discard;                                   // the --clip wipe
    float wobble = uActive * (1.0 - uActive) * 4.0;                // 0 at both ends, 1 half-way
    float dx = sin(yDown * freq + uActive * 9.0) * amp * wobble;  // horizontal ripple
    vec2 q = vec2(vUv.x + dx, yDown) * uvScale + uvOffset;
    vec4 t = texture2D(map, vec2(q.x, 1.0 - q.y));
    vec3 c = mix(vec3(0.863, 0.867, 0.831), t.rgb, t.a);
    float luma = dot(c, vec3(0.299, 0.587, 0.114));
    vec3 duo = mix(dark, light, smoothstep(0.0, 1.05, luma));
    gl_FragColor = vec4(mix(duo, c, uActive), 1.0);
    #include <colorspace_fragment>
}`;

/** The menu photos: duotone at rest, full colour with a ripple on hover. */
export default function DuotoneLab() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const slots = useRef<HTMLDivElement[]>([]);
    const state = useRef(PHOTOS.map(() => ({ a: 0 })));
    const out = useRef<HTMLSpanElement>(null);

    const hover = (i: number, on: boolean) => {
        const d = ref.current;
        gsap.to(state.current[i], { a: on ? 1 : 0, duration: on ? d.inT : d.outT, ease: on ? 'power2.out' : 'power2.inOut', overwrite: true });
    };

    useThreeCanvas(
        host,
        ({ renderer }) => {
            renderer.setClearColor(0x000000, 0);
            const scene = new THREE.Scene();
            const { cam, resize } = pixelCamera();
            const planes = PHOTOS.map((ph) => {
                const u = {
                    map: { value: loadTexture(ph.src) },
                    uvScale: { value: new THREE.Vector2(1, 1) },
                    uvOffset: { value: new THREE.Vector2() },
                    uActive: { value: 0 },
                    clip: { value: 1 },
                    amp: { value: 0 },
                    freq: { value: 0 },
                    dark: { value: new THREE.Color() },
                    light: { value: new THREE.Color() },
                };
                const mat = new THREE.ShaderMaterial({ vertexShader: COVER_VERT, fragmentShader: FRAG, uniforms: u, transparent: true });
                const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
                scene.add(mesh);
                return { u, mat, mesh };
            });
            let W = 1;
            let H = 1;
            return {
                resize: (w, h) => {
                    W = w;
                    H = h;
                    resize(w, h);
                },
                frame: () => {
                    const d = ref.current;
                    const b = host.current!.getBoundingClientRect();
                    planes.forEach((pl, i) => {
                        const el = slots.current[i];
                        if (!el) return;
                        const r = el.getBoundingClientRect();
                        placeOver(pl.mesh, r.left - b.left, r.top - b.top, r.width, r.height, W, H);
                        const ph = PHOTOS[i];
                        const fit = coverUv(r.width, r.height, ph.w, ph.h, ph.pos[0], ph.pos[1], ph.zoom);
                        pl.u.uvScale.value.set(...fit.scale);
                        pl.u.uvOffset.value.set(...fit.offset);
                        pl.u.uActive.value = d.manual ? d.a : state.current[i].a;
                        pl.u.clip.value = d.clip;
                        pl.u.amp.value = d.amp;
                        pl.u.freq.value = d.freq;
                        pl.u.dark.value.set(d.dark);
                        pl.u.light.value.set(d.light);
                    });
                    const a = d.manual ? d.a : Math.max(...state.current.map((s) => s.a));
                    if (out.current) out.current.textContent = `active ${a.toFixed(2)} · ripple ${(a * (1 - a) * 4).toFixed(2)}`;
                    renderer.render(scene, cam);
                },
                dispose: () => {
                    planes.forEach((pl) => {
                        pl.mesh.geometry.dispose();
                        pl.mat.dispose();
                        pl.u.map.value.dispose();
                    });
                },
            };
        },
        [],
        { alpha: true, toneMapping: THREE.NoToneMapping },
    );

    return (
        <Demo
            title="Duotone ↔ colour with a ripple"
            hint="Hover a photo: it floods with colour in 0.18 s and wobbles half-way; leave and it sinks back to duotone in 0.45 s. Or take manual control of “active”."
            onReset={reset}
            controls={
                <>
                    <Group title="Duotone">
                        <ColorInput label="shadows" value={p.dark} onChange={(v) => set('dark', v)} />
                        <ColorInput label="highlights" value={p.light} onChange={(v) => set('light', v)} />
                    </Group>
                    <Group title="Switch">
                        <Slider label="in" value={p.inT} min={0.05} max={1.5} onChange={(v) => set('inT', v)} format={(v) => `${v.toFixed(2)} s`} help="power2.out. Source: 0.18 s." />
                        <Slider label="out" value={p.outT} min={0.05} max={1.5} onChange={(v) => set('outT', v)} format={(v) => `${v.toFixed(2)} s`} help="power2.inOut. Source: 0.45 s." />
                        <Toggle label="manual" checked={p.manual} onChange={(v) => set('manual', v)} />
                        <Slider label="active" value={p.a} min={0} max={1} onChange={(v) => set('a', v)} help="0 = duotone, 1 = colour (manual mode)." />
                    </Group>
                    <Group title="Ripple & clip">
                        <Slider
                            label="ripple amount"
                            value={p.amp}
                            min={0}
                            max={0.12}
                            step={0.001}
                            onChange={(v) => set('amp', v)}
                            help="Sideways shift at the peak. Source: 0.018 (1.8% of the width)."
                        />
                        <Slider label="ripple frequency" value={p.freq} min={2} max={120} step={1} onChange={(v) => set('freq', v)} help="Waves down the photo. Source: 38." />
                        <Slider label="--clip" value={p.clip} min={0} max={1} onChange={(v) => set('clip', v)} help="The menu timeline’s wipe — pixels below this line are discarded." />
                    </Group>
                    <Readout items={[{ label: 'live', value: <span ref={out} /> }]} />
                </>
            }
        >
            <div className="relative flex h-[420px] items-center justify-center gap-4 bg-[#22281c] px-4 sm:gap-8">
                {PHOTOS.map((ph, i) => (
                    <div
                        key={ph.label}
                        ref={(el) => {
                            if (el) slots.current[i] = el;
                        }}
                        onPointerEnter={() => hover(i, true)}
                        onPointerLeave={() => hover(i, false)}
                        className="relative aspect-[409/444] w-[min(42%,240px)] cursor-pointer"
                    >
                        <span className="ll-mono absolute -bottom-6 left-0 text-[10px] uppercase tracking-[0.14em] text-[var(--ll-dim)]">{ph.label}</span>
                    </div>
                ))}
                <div ref={host} className="pointer-events-none absolute inset-0" aria-hidden />
            </div>
        </Demo>
    );
}

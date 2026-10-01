'use client';

import { useRef } from 'react';
import * as THREE from 'three';

import { cn } from '@/utils/cn';

import { Btn, Demo, Group, Segmented, Toggle } from '../kit/controls';
import { COVER_VERT, coverUv, loadTexture, pixelCamera, placeOver } from '../kit/gl';
import { useParams, useThreeCanvas } from '../kit/loop';
import { IMG } from '../kit/source';

type Mode = 'frame' | 'throttled' | 'once';
const DEFAULTS = { mode: 'frame' as Mode, wobble: true, showDom: true, showGl: true };

const FRAG = /* glsl */ `
uniform sampler2D map;
uniform float ready;
uniform vec2 uvScale;
uniform vec2 uvOffset;
varying vec2 vUv;
void main() {
    // object-fit: cover, same maths as MenuGL (y measured downwards)
    vec2 q = vec2(vUv.x, 1.0 - vUv.y) * uvScale + uvOffset;
    vec4 t = texture2D(map, vec2(q.x, 1.0 - q.y));
    vec3 bg = vec3(0.98, 0.984, 0.965);
    vec3 c = mix(bg, t.rgb, t.a);
    // tint so you can tell the WebGL copy from the DOM image
    float l = dot(c, vec3(0.299, 0.587, 0.114));
    vec3 duo = mix(vec3(0.13, 0.16, 0.11), vec3(0.8, 1.0, 0.04), l);
    gl_FragColor = vec4(mix(vec3(0.8, 1.0, 0.04), duo, ready), 1.0);
    #include <colorspace_fragment>
}`;

/**
 * A DOM card inside a scroll box, and a WebGL plane on a canvas above it. Every frame the plane reads the
 * card’s rect and moves there — the same trick HeroGL and MenuGL use with [data-gl-hero] / [data-menu-photo].
 */
export default function DomSyncLab() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const stage = useRef<HTMLDivElement>(null);
    const overlay = useRef<HTMLDivElement>(null);
    const card = useRef<HTMLDivElement>(null);
    const syncNow = useRef(true);

    useThreeCanvas(
        overlay,
        ({ renderer }) => {
            renderer.setClearColor(0x000000, 0);
            const scene = new THREE.Scene();
            const { cam, resize } = pixelCamera();
            const uniforms = { map: { value: null as THREE.Texture | null }, ready: { value: 0 }, uvScale: { value: new THREE.Vector2(1, 1) }, uvOffset: { value: new THREE.Vector2(0, 0) } };
            uniforms.map.value = loadTexture(IMG.portrait, () => (uniforms.ready.value = 1));
            const mat = new THREE.ShaderMaterial({ vertexShader: COVER_VERT, fragmentShader: FRAG, uniforms });
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
            scene.add(mesh);
            let W = 1;
            let H = 1;
            let last = 0;
            return {
                resize: (w, h) => {
                    W = w;
                    H = h;
                    resize(w, h);
                    syncNow.current = true;
                },
                frame: (time) => {
                    const c = card.current;
                    const o = overlay.current;
                    if (c && o) {
                        const mode = ref.current.mode;
                        const due = mode === 'frame' || (mode === 'throttled' && time - last > 0.25) || syncNow.current;
                        if (due) {
                            last = time;
                            syncNow.current = false;
                            const r = c.getBoundingClientRect();
                            const b = o.getBoundingClientRect();
                            placeOver(mesh, r.left - b.left, r.top - b.top, r.width, r.height, W, H);
                            const fit = coverUv(r.width, r.height, 2400, 1288, 0.5, 0.5, 1);
                            uniforms.uvScale.value.set(...fit.scale);
                            uniforms.uvOffset.value.set(...fit.offset);
                        }
                    }
                    mesh.visible = ref.current.showGl;
                    renderer.render(scene, cam);
                },
                dispose: () => {
                    mesh.geometry.dispose();
                    mat.dispose();
                    uniforms.map.value?.dispose();
                },
            };
        },
        [],
        { alpha: true, toneMapping: THREE.NoToneMapping },
    );

    return (
        <Demo
            title="DOM sync — a WebGL plane glued to an HTML box"
            hint="Scroll inside the stage. The lime-tinted image is WebGL, drawn on a canvas above the page; the dashed box is the real HTML element it follows."
            onReset={() => {
                reset();
                syncNow.current = true;
            }}
            controls={
                <>
                    <Group title="Sync">
                        <Segmented
                            label="read the DOM rect"
                            options={[
                                { value: 'frame', label: 'every frame' },
                                { value: 'throttled', label: 'every 250 ms' },
                                { value: 'once', label: 'once' },
                            ]}
                            value={p.mode}
                            onChange={(v) => {
                                set('mode', v);
                                syncNow.current = true;
                            }}
                        />
                        <Btn onClick={() => (syncNow.current = true)}>Sync now</Btn>
                        <Toggle label="wobble the card (CSS)" checked={p.wobble} onChange={(v) => set('wobble', v)} help="A CSS animation WebGL knows nothing about — it only sees the rect." />
                    </Group>
                    <Group title="Layers">
                        <Toggle label="DOM image" checked={p.showDom} onChange={(v) => set('showDom', v)} help='The source hides it (data-gl="1") once WebGL has drawn a frame.' />
                        <Toggle label="WebGL plane" checked={p.showGl} onChange={(v) => set('showGl', v)} />
                    </Group>
                </>
            }
        >
            <div ref={stage} className="relative h-[400px] overflow-hidden bg-[#1b1f15]">
                <div data-lenis-prevent className="ll-scrollbox absolute inset-0 overflow-y-auto">
                    <div className="flex h-[1100px] flex-col items-center pt-[260px]">
                        <p className="ll-mono mb-6 text-[10px] uppercase tracking-[0.16em] text-[var(--ll-faint)]">↓ scroll</p>
                        <div
                            ref={card}
                            className={cn(
                                'relative h-[220px] w-[min(70%,380px)] overflow-hidden rounded-md outline outline-1 outline-dashed outline-[var(--ll-warn)]',
                                p.wobble && 'animate-[ll-wobble_3s_ease-in-out_infinite]',
                            )}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element -- the DOM fallback layer */}
                            <img src={IMG.portrait} alt="" className="size-full object-cover" style={{ visibility: p.showDom ? 'visible' : 'hidden' }} />
                            <span className="ll-mono absolute left-2 top-2 rounded bg-black/60 px-1.5 text-[9.5px] text-[var(--ll-warn)]">DOM · data-gl-hero</span>
                        </div>
                    </div>
                </div>
                <div ref={overlay} className="pointer-events-none absolute inset-0 opacity-90 mix-blend-normal" aria-hidden />
            </div>
        </Demo>
    );
}

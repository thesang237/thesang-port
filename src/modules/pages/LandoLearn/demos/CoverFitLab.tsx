'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { Demo, Group, Readout, Segmented, Slider, Toggle } from '../kit/controls';
import { COVER_VERT, coverUv, loadTexture, pixelCamera, placeOver } from '../kit/gl';
import { useParams, useThreeCanvas } from '../kit/loop';
import { IMG } from '../kit/source';

const IMAGES = {
    portrait: { src: IMG.portrait, w: 2400, h: 1288 },
    profile: { src: IMG.profile, w: 1400, h: 1600 },
    scene: { src: IMG.scene, w: 2400, h: 1400 },
} as const;
type Img = keyof typeof IMAGES;

// the second menu photo slot: 409×444, '50% 22%', zoom 1.5 (shell/Menu.tsx)
const DEFAULTS = { img: 'portrait' as Img, bw: 409, bh: 444, px: 0.5, py: 0.22, zoom: 1.5, ghost: true };

const FRAG = /* glsl */ `
uniform sampler2D map;
uniform vec2 uvScale;
uniform vec2 uvOffset;
varying vec2 vUv;
void main() {
    vec2 q = vec2(vUv.x, 1.0 - vUv.y) * uvScale + uvOffset;   // y measured downwards, like CSS
    vec4 t = texture2D(map, vec2(q.x, 1.0 - q.y));
    gl_FragColor = vec4(mix(vec3(0.863, 0.867, 0.831), t.rgb, t.a), 1.0);  // #DCDDD4 studio grey behind
    #include <colorspace_fragment>
}`;

/** shrink the box to fit the stage (40 px margin) — shared by the WebGL box and the ghost */
const fitScale = (W: number, H: number, bw: number, bh: number) => Math.min(1, (H - 40) / Math.max(bh, 1), (W - 40) / Math.max(bw, 1));

/** object-fit: cover + object-position + zoom, done in a shader with two numbers: a uv scale and an offset. */
export default function CoverFitLab() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const overlay = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ w: 600, h: 420 });

    useEffect(() => {
        const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
        ro.observe(overlay.current!);
        return () => ro.disconnect();
    }, []);

    useThreeCanvas(
        overlay,
        ({ renderer }) => {
            renderer.setClearColor(0x000000, 0);
            const scene = new THREE.Scene();
            const { cam, resize } = pixelCamera();
            const tex = Object.fromEntries(Object.entries(IMAGES).map(([k, v]) => [k, loadTexture(v.src)])) as Record<Img, THREE.Texture>;
            const uniforms = { map: { value: tex.portrait }, uvScale: { value: new THREE.Vector2(1, 1) }, uvOffset: { value: new THREE.Vector2() } };
            const mat = new THREE.ShaderMaterial({ vertexShader: COVER_VERT, fragmentShader: FRAG, uniforms });
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
            scene.add(mesh);
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
                    const k = fitScale(W, H, d.bw, d.bh);
                    const bw = d.bw * k;
                    const bh = d.bh * k;
                    placeOver(mesh, (W - bw) / 2, (H - bh) / 2, bw, bh, W, H);
                    const im = IMAGES[d.img];
                    const fit = coverUv(bw, bh, im.w, im.h, d.px, d.py, d.zoom);
                    uniforms.map.value = tex[d.img];
                    uniforms.uvScale.value.set(...fit.scale);
                    uniforms.uvOffset.value.set(...fit.offset);
                    renderer.render(scene, cam);
                },
                dispose: () => {
                    mesh.geometry.dispose();
                    mat.dispose();
                    Object.values(tex).forEach((t) => t.dispose());
                },
            };
        },
        [],
        { alpha: true, toneMapping: THREE.NoToneMapping },
    );

    // same maths in CSS pixels (unscaled box), for the readout and the ghost image
    const im = IMAGES[p.img];
    const fit = coverUv(p.bw, p.bh, im.w, im.h, p.px, p.py, p.zoom);
    const ghost = {
        left: p.bw / 2 - (p.bw / 2 - fit.ox) * p.zoom,
        top: p.bh / 2 - (p.bh / 2 - fit.oy) * p.zoom,
        width: fit.dw * p.zoom,
        height: fit.dh * p.zoom,
    };

    return (
        <Demo
            title="Cover fit in a shader"
            hint="The bright box is WebGL. The faint image behind it (ghost) shows the whole picture: what cover-fit crops away. Move the focus point and zoom."
            onReset={reset}
            controls={
                <>
                    <Segmented label="image" options={Object.keys(IMAGES) as Img[]} value={p.img} onChange={(v) => set('img', v)} />
                    <Group title="Box (px)">
                        <Slider label="width" value={p.bw} min={120} max={900} step={1} onChange={(v) => set('bw', v)} format={(v) => `${v}`} />
                        <Slider label="height" value={p.bh} min={120} max={900} step={1} onChange={(v) => set('bh', v)} format={(v) => `${v}`} help="Defaults: the menu’s 409 × 444 photo slot." />
                    </Group>
                    <Group title="object-position + zoom">
                        <Slider label="focus x" value={p.px} min={0} max={1} onChange={(v) => set('px', v)} format={(v) => `${Math.round(v * 100)}%`} />
                        <Slider
                            label="focus y"
                            value={p.py}
                            min={0}
                            max={1}
                            onChange={(v) => set('py', v)}
                            format={(v) => `${Math.round(v * 100)}%`}
                            help="Which part of the image stays in view when it’s cropped."
                        />
                        <Slider label="zoom" value={p.zoom} min={1} max={3} onChange={(v) => set('zoom', v)} help="Extra scale about the box centre. Source slot: 1.5." />
                        <Toggle label="ghost" checked={p.ghost} onChange={(v) => set('ghost', v)} />
                    </Group>
                    <Readout
                        items={[
                            { label: 'uvScale', value: `${fit.scale[0].toFixed(3)}, ${fit.scale[1].toFixed(3)}`, color: 'var(--ll-lime)' },
                            { label: 'uvOffset', value: `${fit.offset[0].toFixed(3)}, ${fit.offset[1].toFixed(3)}`, color: 'var(--ll-lime)' },
                        ]}
                    />
                </>
            }
        >
            <div className="relative h-[420px] overflow-hidden bg-[#1b1f15]">
                <GhostLayer on={p.ghost} src={im.src} box={{ w: p.bw, h: p.bh }} ghost={ghost} k={fitScale(size.w, size.h, p.bw, p.bh)} />
                <div ref={overlay} className="absolute inset-0" aria-hidden />
            </div>
        </Demo>
    );
}

/** The whole image, drawn faintly at its cover-fit position around the box (scaled like the WebGL box). */
function GhostLayer({ on, src, box, ghost, k }: { on: boolean; src: string; box: { w: number; h: number }; ghost: { left: number; top: number; width: number; height: number }; k: number }) {
    return (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative shrink-0" style={{ width: box.w, height: box.h, transform: `scale(${k})`, opacity: on ? 1 : 0, transition: 'opacity 0.3s' }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- ghost of the full image */}
                <img src={src} alt="" className="absolute max-w-none opacity-25" style={{ left: ghost.left, top: ghost.top, width: ghost.width, height: ghost.height }} />
                <div className="absolute outline outline-1 outline-dashed outline-[var(--ll-warn)]" style={{ left: ghost.left, top: ghost.top, width: ghost.width, height: ghost.height }} />
            </div>
        </div>
    );
}

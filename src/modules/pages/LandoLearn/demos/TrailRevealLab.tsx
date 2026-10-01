'use client';

import { useRef } from 'react';
import * as THREE from 'three';

import { cn } from '@/utils/cn';

import { Demo, Group, Slider, Toggle } from '../kit/controls';
import { COVER_VERT, loadTexture, pixelCamera, placeOver } from '../kit/gl';
import { useParams, useThreeCanvas } from '../kit/loop';
import { SIMPLEX_3D } from '../kit/noise';
import { IMG } from '../kit/source';

// numbers from gl/HeroGL.tsx (brush radius and noise scale are given for a 1920 px wide screen)
const DEFAULTS = {
    radius: 200,
    decay: 0.018,
    amount: 0.17,
    scale: 0.0105,
    threshold: 0.4,
    edge: 0.03,
    speedGate: true,
    res: 0.25,
    showTrail: true,
    maskOnly: false,
    auto: false,
};
const ASPECT = 2400 / 1288;

const FRAG = /* glsl */ `
uniform sampler2D portrait;
uniform sampler2D helmet;
uniform sampler2D contours;
uniform sampler2D trail;
uniform vec2 view;       // stage size in px
uniform vec2 imgOrigin;  // where the (cover, bottom-anchored) image starts, px
uniform vec2 imgSize;
uniform float time;
uniform float amount;
uniform float nscale;
uniform float threshold;
uniform float edge;
uniform float maskOnly;
varying vec2 vUv;
${SIMPLEX_3D}
void main() {
    vec2 P = vec2(vUv.x, 1.0 - vUv.y) * view;                  // pixel position, y down
    vec2 iuv = (P - imgOrigin) / imgSize;
    vec2 tuv = vec2(iuv.x, 1.0 - iuv.y);
    vec4 por = texture2D(portrait, tuv);
    vec4 hel = texture2D(helmet, tuv);
    float line = texture2D(contours, vec2(P.x / 1920.0, 1.0 - P.y / 1200.0)).r;
    vec3 bg  = mix(vec3(0.980, 0.984, 0.965), vec3(0.890, 0.894, 0.863), line);  // #FAFBF6 + lines
    vec3 bgH = mix(vec3(0.894, 0.898, 0.871), vec3(0.839, 0.847, 0.812), line);  // a touch darker
    vec3 base = mix(bg, por.rgb, por.a);
    vec3 helm = mix(bgH, hel.rgb, hel.a);
    float tr = texture2D(trail, vec2(P.x / view.x, 1.0 - P.y / view.y)).r;
    float n = snoise(vec3(P * nscale, time * 0.35));
    float m = smoothstep(threshold, threshold + edge, tr + n * amount);
    vec3 col = mix(base, helm, m);
    gl_FragColor = vec4(mix(col, vec3(m), maskOnly), 1.0);
    #include <colorspace_fragment>
}`;

function contourTexture() {
    const c = document.createElement('canvas');
    c.width = 1920;
    c.height = 1200;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, c.width, c.height);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    const img = new Image();
    img.onload = () => {
        ctx.filter = 'invert(1)'; // black lines on transparent → white lines on black
        ctx.drawImage(img, 0, 0, 1920, 2400);
        t.needsUpdate = true;
    };
    img.src = IMG.contours;
    return t;
}

/** The hero’s cursor-trail helmet reveal, with the trail canvas on show and every number on a dial. */
export default function TrailRevealLab() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const inset = useRef<HTMLDivElement>(null);

    useThreeCanvas(
        host,
        ({ renderer, pointer }) => {
            const scene = new THREE.Scene();
            const { cam, resize } = pixelCamera();
            const trail = { c: document.createElement('canvas'), last: null as null | { x: number; y: number }, res: 0 };
            const tctx = trail.c.getContext('2d')!;
            const ttex = new THREE.CanvasTexture(trail.c);
            ttex.colorSpace = THREE.NoColorSpace;
            trail.c.style.cssText = 'display:block;width:100%;height:100%;';
            inset.current?.appendChild(trail.c);

            const u = {
                portrait: { value: loadTexture(IMG.portrait) },
                helmet: { value: loadTexture(IMG.portraitHelmet) },
                contours: { value: contourTexture() },
                trail: { value: ttex },
                view: { value: new THREE.Vector2(1, 1) },
                imgOrigin: { value: new THREE.Vector2() },
                imgSize: { value: new THREE.Vector2(1, 1) },
                time: { value: 0 },
                amount: { value: 0 },
                nscale: { value: 0 },
                threshold: { value: 0 },
                edge: { value: 0 },
                maskOnly: { value: 0 },
            };
            const mat = new THREE.ShaderMaterial({ vertexShader: COVER_VERT, fragmentShader: FRAG, uniforms: u });
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
            scene.add(mesh);
            let W = 1;
            let H = 1;

            const sizeTrail = () => {
                const r = ref.current.res;
                trail.res = r;
                trail.c.width = Math.max(2, Math.ceil(W * r));
                trail.c.height = Math.max(2, Math.ceil(H * r));
                tctx.fillStyle = '#000';
                tctx.fillRect(0, 0, trail.c.width, trail.c.height);
                trail.last = null;
            };

            return {
                resize: (w, h) => {
                    W = w;
                    H = h;
                    resize(w, h);
                    placeOver(mesh, 0, 0, w, h, w, h);
                    u.view.value.set(w, h);
                    const dw = Math.max(w, h * ASPECT);
                    const dh = dw / ASPECT;
                    u.imgOrigin.value.set(w / 2 - dw / 2, h - dh); // cover, anchored bottom-centre
                    u.imgSize.value.set(dw, dh);
                    sizeTrail();
                },
                frame: (time) => {
                    const d = ref.current;
                    if (d.res !== trail.res) sizeTrail();
                    const k = W / 1920; // source numbers are for a 1920 px wide hero
                    u.time.value = time;
                    u.amount.value = d.amount;
                    u.nscale.value = d.scale / k;
                    u.threshold.value = d.threshold;
                    u.edge.value = Math.max(0.001, d.edge);
                    u.maskOnly.value = d.maskOnly ? 1 : 0;

                    // fade the whole trail a little every frame
                    tctx.globalCompositeOperation = 'source-over';
                    tctx.fillStyle = `rgba(0,0,0,${d.decay})`;
                    tctx.fillRect(0, 0, trail.c.width, trail.c.height);

                    let px = pointer.px;
                    let py = pointer.py;
                    let active = pointer.over;
                    if (!active && d.auto) {
                        px = W * (0.5 + 0.34 * Math.sin(time * 1.3));
                        py = H * (0.42 + 0.22 * Math.sin(time * 2.1));
                        active = true;
                    }
                    if (active) {
                        const mx = px * trail.res;
                        const my = py * trail.res;
                        const last = trail.last ?? { x: mx, y: my };
                        const dist = trail.last ? Math.hypot(mx - last.x, my - last.y) : 0;
                        const steps = Math.max(1, Math.ceil(dist / 2));
                        const R = d.radius * k * trail.res;
                        // stamp strength follows pointer speed: sub-pixel jitter leaves no trace
                        const strength = d.speedGate ? Math.min(1, Math.max(0, (dist / trail.res / k - 3) / 25)) : trail.last ? 1 : 0;
                        if (strength > 0 && R > 0.5) {
                            for (let i = 1; i <= steps; i++) {
                                const x = last.x + ((mx - last.x) * i) / steps;
                                const y = last.y + ((my - last.y) * i) / steps;
                                const g = tctx.createRadialGradient(x, y, 0, x, y, R);
                                g.addColorStop(0, `rgba(255,255,255,${0.55 * strength})`);
                                g.addColorStop(0.55, `rgba(255,255,255,${0.35 * strength})`);
                                g.addColorStop(1, 'rgba(255,255,255,0)');
                                tctx.fillStyle = g;
                                tctx.fillRect(x - R, y - R, R * 2, R * 2);
                            }
                        }
                        trail.last = { x: mx, y: my };
                    } else trail.last = null;
                    ttex.needsUpdate = true;
                    renderer.render(scene, cam);
                },
                dispose: () => {
                    trail.c.remove();
                    mesh.geometry.dispose();
                    mat.dispose();
                    [u.portrait.value, u.helmet.value, u.contours.value, ttex].forEach((t) => t.dispose());
                },
            };
        },
        [],
        { toneMapping: THREE.NoToneMapping },
    );

    return (
        <Demo
            title="Trail reveal — paint the helmet on"
            hint="Move your pointer over the portrait (or turn on auto-draw). Bottom right: the actual trail canvas the shader reads — white = reveal."
            onReset={reset}
            controls={
                <>
                    <Toggle label="auto-draw" checked={p.auto} onChange={(v) => set('auto', v)} help="A fake pointer, for touch screens." />
                    <Group title="Brush (trail canvas)">
                        <Slider
                            label="radius"
                            value={p.radius}
                            min={40}
                            max={500}
                            step={5}
                            onChange={(v) => set('radius', v)}
                            format={(v) => `${v} px`}
                            help="Soft dot stamped along the path (at 1920 wide). Source: 200 (a ~400 px blob)."
                        />
                        <Slider
                            label="decay"
                            value={p.decay}
                            min={0.002}
                            max={0.12}
                            step={0.001}
                            onChange={(v) => set('decay', v)}
                            help="Black painted over the trail each frame. Source: 0.018 → the blob lives ~0.9 s."
                        />
                        <Toggle label="speed gate" checked={p.speedGate} onChange={(v) => set('speedGate', v)} help="Stamps get stronger with speed; a resting or jittering pointer paints nothing." />
                        <Slider
                            label="trail resolution"
                            value={p.res}
                            min={0.05}
                            max={1}
                            onChange={(v) => set('res', v)}
                            format={(v) => `${Math.round(v * 100)}%`}
                            help="Source: 25% — the trail is blurry anyway, so a quarter-size canvas is 16× cheaper."
                        />
                    </Group>
                    <Group title="Edge (shader)">
                        <Slider label="noise amount" value={p.amount} min={0} max={0.6} onChange={(v) => set('amount', v)} help="How much noise wobbles the edge. Source: 0.17." />
                        <Slider
                            label="noise scale"
                            value={p.scale}
                            min={0.002}
                            max={0.04}
                            step={0.0005}
                            onChange={(v) => set('scale', v)}
                            format={(v) => v.toFixed(4)}
                            help="Size of the wobbles (smaller = bigger blobs). Source: 0.0105."
                        />
                        <Slider label="threshold" value={p.threshold} min={0.05} max={0.9} onChange={(v) => set('threshold', v)} help="Trail value where the helmet starts. Source: 0.40." />
                        <Slider
                            label="edge softness"
                            value={p.edge}
                            min={0.001}
                            max={0.4}
                            step={0.001}
                            onChange={(v) => set('edge', v)}
                            help="smoothstep width. Source: 0.03 — crisp, but not jagged."
                        />
                    </Group>
                    <Group title="View">
                        <Toggle label="show trail canvas" checked={p.showTrail} onChange={(v) => set('showTrail', v)} />
                        <Toggle label="mask only" checked={p.maskOnly} onChange={(v) => set('maskOnly', v)} help="Paint the final mask (after noise + threshold) instead of the photos." />
                    </Group>
                </>
            }
        >
            <div className="relative h-[460px] cursor-crosshair overflow-hidden bg-[#fafbf6] sm:h-[520px]">
                <div ref={host} className="absolute inset-0" />
                <div
                    className={cn(
                        'pointer-events-none absolute bottom-3 right-3 aspect-[16/10] w-[28%] min-w-[120px] overflow-hidden rounded-md border border-[var(--ll-warn)] bg-black transition-opacity',
                        p.showTrail ? 'opacity-100' : 'opacity-0',
                    )}
                >
                    <div ref={inset} className="size-full" />
                    <span className="ll-mono absolute left-1.5 top-1 text-[9px] text-[var(--ll-warn)]">trail canvas</span>
                </div>
            </div>
        </Demo>
    );
}

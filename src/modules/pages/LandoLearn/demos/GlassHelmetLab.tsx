'use client';

import { type CSSProperties, useRef } from 'react';
import * as THREE from 'three';

import { Demo, Group, Readout, Slider, Toggle } from '../kit/controls';
import { pixelCamera } from '../kit/gl';
import { useParams, useThreeCanvas } from '../kit/loop';
import { IMG } from '../kit/source';

// gl/HeroGL.tsx: head centre in image uv (y down), size as a share of the image height, 1.0 s loop
const HEAD = { u: 0.5, v: 0.47 };
const ASPECT = 2400 / 1288;
// decorative loop: off by default for people who asked for reduced motion (the source hides it entirely)
const REDUCED = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DEFAULTS = { period: 1, meridians: 40, rings: 16, drop: 90, opacity: 0.42, size: 0.36, play: !REDUCED, phase: 0.3 };

/** Lat/long lines of a helmet-shaped dome (a squashed sphere), as line segments. */
function helmetGrid(meridians: number, rings: number) {
    const pts: number[] = [];
    const S = (th: number, ph: number) => [Math.sin(th) * Math.cos(ph) * 1.08, Math.cos(th) * 1.3, Math.sin(th) * Math.sin(ph) * 1.26];
    const TH = Math.PI * 0.64;
    for (let i = 0; i < meridians; i++) {
        const ph = (i / meridians) * Math.PI * 2;
        for (let k = 0; k < 24; k++) pts.push(...S((k / 24) * TH, ph), ...S(((k + 1) / 24) * TH, ph));
    }
    for (let j = 1; j <= rings; j++) {
        const th = (j / rings) * TH;
        for (let k = 0; k < 64; k++) pts.push(...S(th, (k / 64) * Math.PI * 2), ...S(th, ((k + 1) / 64) * Math.PI * 2));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
}

const VERT = /* glsl */ `
varying float vY;
void main() {
    vY = position.y;   // the dome's own height, before rotation
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const FRAG = /* glsl */ `
uniform float glass;
uniform float maxOpacity;
varying float vY;
void main() {
    // fade the lower part of the dome + global loop opacity
    gl_FragColor = vec4(vec3(0.604, 0.612, 0.576), glass * maxOpacity * smoothstep(0.0, 0.62, vY));
    #include <colorspace_fragment>
}`;

/** The hero’s decorative loop: a wireframe “glass helmet” drops onto the head every second. */
export default function GlassHelmetLab() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const out = useRef<HTMLSpanElement>(null);

    useThreeCanvas(
        host,
        ({ renderer }) => {
            renderer.setClearColor(0x000000, 0);
            const scene = new THREE.Scene();
            const { cam, resize } = pixelCamera();
            const uniforms = { glass: { value: 0 }, maxOpacity: { value: 0.42 } };
            const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, transparent: true, depthTest: false, depthWrite: false });
            let built = { m: 0, r: 0 };
            const lines = new THREE.LineSegments(new THREE.BufferGeometry(), mat);
            const grp = new THREE.Group();
            grp.add(lines);
            scene.add(grp);
            let W = 1;
            let H = 1;
            let t = 0;
            return {
                resize: (w, h) => {
                    W = w;
                    H = h;
                    resize(w, h);
                },
                frame: (_time, dt) => {
                    const d = ref.current;
                    if (built.m !== d.meridians || built.r !== d.rings) {
                        lines.geometry.dispose();
                        lines.geometry = helmetGrid(d.meridians, d.rings);
                        built = { m: d.meridians, r: d.rings };
                    }
                    if (d.play) t += dt;
                    const ph = d.play ? (t % d.period) / d.period : d.phase;
                    const fadeIn = Math.min(1, ph / 0.22);
                    const fadeOut = 1 - Math.min(1, Math.max(0, (ph - 0.55) / 0.35));
                    const drop = 1 - Math.pow(1 - Math.min(1, ph / 0.6), 3);
                    uniforms.glass.value = fadeIn * fadeOut;
                    uniforms.maxOpacity.value = d.opacity;

                    // image covers the stage, anchored bottom-centre → head position in px
                    const dw = Math.max(W, H * ASPECT);
                    const dh = dw / ASPECT;
                    const ox = W / 2 - dw / 2;
                    const oy = H - dh;
                    const k = d.size * dh;
                    const s = W / 1920;
                    const cx = ox + HEAD.u * dw;
                    const cy = oy + HEAD.v * dh;
                    grp.position.set(cx - W / 2, -(cy - H / 2) + (1 - drop) * d.drop * s, 10);
                    const sc = k * (1.06 - 0.06 * drop);
                    grp.scale.set(sc, sc, sc);
                    lines.rotation.set(0.32, t * 0.25, 0);
                    if (out.current) out.current.textContent = `phase ${ph.toFixed(2)} · opacity ${(fadeIn * fadeOut).toFixed(2)} · drop ${drop.toFixed(2)}`;
                    renderer.render(scene, cam);
                },
                dispose: () => {
                    lines.geometry.dispose();
                    mat.dispose();
                },
            };
        },
        [],
        { alpha: true, toneMapping: THREE.NoToneMapping },
    );

    const phase = p.phase;
    return (
        <Demo
            title="Glass helmet loop"
            hint="A wire dome fades in above the head, drops and settles, then fades — once per second. Pause it and scrub the phase to see each beat."
            onReset={reset}
            controls={
                <>
                    <Group title="Loop">
                        <Toggle label="play" checked={p.play} onChange={(v) => set('play', v)} />
                        <Slider label="phase (paused)" value={phase} min={0} max={1} onChange={(v) => set('phase', v)} help="0–0.22 fade in · 0–0.6 drop (ease-out) · 0.55–0.9 fade out." />
                        <Slider label="period" value={p.period} min={0.3} max={4} onChange={(v) => set('period', v)} format={(v) => `${v.toFixed(2)} s`} help="Measured in the video: 1.0 s." />
                        <Slider
                            label="drop distance"
                            value={p.drop}
                            min={0}
                            max={300}
                            step={1}
                            onChange={(v) => set('drop', v)}
                            format={(v) => `${v} px`}
                            help="How far above the head it starts (at 1920 wide). Source: 90."
                        />
                    </Group>
                    <Group title="Shape">
                        <Slider
                            label="meridians"
                            value={p.meridians}
                            min={4}
                            max={80}
                            step={1}
                            onChange={(v) => set('meridians', v)}
                            format={(v) => `${v}`}
                            help="Lines from top to rim. Source: 40."
                        />
                        <Slider label="rings" value={p.rings} min={2} max={40} step={1} onChange={(v) => set('rings', v)} format={(v) => `${v}`} help="Horizontal rings. Source: 16." />
                        <Slider label="size" value={p.size} min={0.15} max={0.6} onChange={(v) => set('size', v)} help="Dome size as a share of the image height. Source: 0.36." />
                        <Slider label="max opacity" value={p.opacity} min={0.05} max={1} onChange={(v) => set('opacity', v)} help="Source: 0.42 — it should whisper." />
                    </Group>
                    <Readout items={[{ label: 'live', value: <span ref={out} /> }]} />
                </>
            }
        >
            <div className="relative h-[440px] overflow-hidden bg-[#fafbf6]">
                <div className="ll-contours" style={{ '--ll-contour': '#e6e7df' } as CSSProperties} />
                {/* eslint-disable-next-line @next/next/no-img-element -- backdrop for the canvas */}
                <img src={IMG.portrait} alt="" className="absolute inset-0 size-full object-cover object-bottom" />
                <div ref={host} className="absolute inset-0" aria-hidden />
            </div>
        </Demo>
    );
}

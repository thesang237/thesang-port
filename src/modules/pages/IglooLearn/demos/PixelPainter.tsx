'use client';

import { useRef } from 'react';
import * as THREE from 'three';

import { cn } from '@/utils/cn';

import { Demo, Slider } from '../kit/controls';
import { QUAD_VERT, SNOISE } from '../kit/glsl';
import { useParams, useThreeCanvas } from '../kit/loop';
import { damp } from '../kit/math';

const STEPS = [
    {
        title: 'Every pixel knows where it is',
        says: 'The shader runs once per pixel, in parallel. Its only input is its own position, uv (0..1). Paint red = x, green = y and you get this gradient.',
        glsl: `vec3 col = vec3(uv.x, uv.y, 0.0);`,
    },
    {
        title: 'Distance → a hard circle',
        says: 'length() measures how far this pixel is from a point (the mouse). step() turns “closer than radius” into 1, else 0. A circle with no geometry at all.',
        glsl: `float d = length(uv - mouse);
vec3 col = vec3(step(d, radius));   // 1 inside, 0 outside`,
    },
    {
        title: 'smoothstep → a soft edge',
        says: 'Swap step() for smoothstep() and the edge fades over a distance. This is how every glow, vignette and soft mask on Igloo is made.',
        glsl: `float d = length(uv - mouse);
float glow = smoothstep(radius, radius - softness, d);
vec3 col = vec3(glow);`,
    },
    {
        title: 'Noise → organic variation',
        says: 'Simplex noise returns smooth random values: neighbours are similar. Scale it up and you get blobs, down and you get grain.',
        glsl: `float n = snoise(vec3(uv * scale, 0.0));   // -1..1
vec3 col = vec3(n * 0.5 + 0.5);`,
    },
    {
        title: 'fbm + time → drifting fog',
        says: 'Stack 4 octaves of noise (fbm) and feed time into the third coordinate. The clouds now evolve — the fog-front in Igloo’s transitions is exactly this.',
        glsl: `float n = fbm3(vec3(uv * scale, time * speed)) * 0.5 + 0.5;
vec3 col = vec3(n);`,
    },
    {
        title: 'Mix → an Igloo sky',
        says: 'Use the fog to mix two colours, add the soft glow at the mouse, darken the corners (vignette) and sprinkle grain. Six lines, one mood.',
        glsl: `float n = fbm3(vec3(uv * scale, time * speed)) * 0.5 + 0.5;
vec3 col = mix(vec3(0.62, 0.67, 0.75), vec3(0.93, 0.95, 0.98), n);
col += vec3(0.8, 0.9, 1.0) * smoothstep(radius, radius - softness, length(uv - mouse)) * 0.6;
col *= mix(0.78, 1.0, smoothstep(1.1, 0.25, length(uv - 0.5)));  // vignette
col += (hash(gl_FragCoord.xy + time) - 0.5) * 0.035;              // grain`,
    },
];

const FRAG = /* glsl */ `
precision highp float;
uniform float uStep;
uniform float uTime;
uniform float uRadius;
uniform float uSoft;
uniform float uScale;
uniform float uSpeed;
uniform vec2 uMouse;
uniform vec2 uRes;
varying vec2 vUv;
${SNOISE}
float hash21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void main() {
    // keep circles round on any aspect ratio
    vec2 asp = vec2(uRes.x / uRes.y, 1.0);
    vec2 uv = vUv;
    vec2 q = uv * asp;
    vec2 m = uMouse * asp;
    float d = length(q - m);
    vec3 col;
    if (uStep < 0.5) col = vec3(uv.x, uv.y, 0.0);
    else if (uStep < 1.5) col = vec3(step(d, uRadius));
    else if (uStep < 2.5) col = vec3(smoothstep(uRadius, uRadius - uSoft, d));
    else if (uStep < 3.5) col = vec3(snoise(vec3(q * uScale, 0.0)) * 0.5 + 0.5);
    else if (uStep < 4.5) col = vec3(fbm3(vec3(q * uScale, uTime * uSpeed)) * 0.5 + 0.5);
    else {
        float n = fbm3(vec3(q * uScale, uTime * uSpeed)) * 0.5 + 0.5;
        col = mix(vec3(0.62, 0.67, 0.75), vec3(0.93, 0.95, 0.98), n);
        col += vec3(0.8, 0.9, 1.0) * smoothstep(uRadius, uRadius - uSoft, d) * 0.6;
        col *= mix(0.78, 1.0, smoothstep(1.1, 0.25, length((uv - 0.5) * asp)));
        col += (hash21(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5) * 0.035;
    }
    gl_FragColor = vec4(col, 1.0);
}
`;

const DEFAULTS = { step: 0, radius: 0.22, soft: 0.18, scale: 3, speed: 0.12 };

/** A fragment shader in six steps — each adds one idea. Move the mouse over it. */
export default function PixelPainter() {
    const host = useRef<HTMLDivElement>(null);
    const { p, set, ref, reset } = useParams(DEFAULTS);

    useThreeCanvas(
        host,
        ({ renderer, pointer, size }) => {
            const scene = new THREE.Scene();
            const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
            const mat = new THREE.ShaderMaterial({
                vertexShader: QUAD_VERT,
                fragmentShader: FRAG,
                uniforms: {
                    uStep: { value: 0 },
                    uTime: { value: 0 },
                    uRadius: { value: 0.2 },
                    uSoft: { value: 0.1 },
                    uScale: { value: 3 },
                    uSpeed: { value: 0.1 },
                    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
                    uRes: { value: new THREE.Vector2(1, 1) },
                },
            });
            scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
            const m = { x: 0.5, y: 0.5 };
            return {
                frame: (t, dt) => {
                    const P = ref.current;
                    const u = mat.uniforms;
                    m.x = damp(m.x, pointer.over ? pointer.x * 0.5 + 0.5 : 0.5 + Math.sin(t * 0.6) * 0.18, 8, dt);
                    m.y = damp(m.y, pointer.over ? pointer.y * 0.5 + 0.5 : 0.5 + Math.cos(t * 0.5) * 0.12, 8, dt);
                    u.uMouse.value.set(m.x, m.y);
                    u.uRes.value.set(size.w, size.h);
                    u.uStep.value = P.step;
                    u.uTime.value = t;
                    u.uRadius.value = P.radius;
                    u.uSoft.value = P.soft;
                    u.uScale.value = P.scale;
                    u.uSpeed.value = P.speed;
                    renderer.render(scene, cam);
                },
                dispose: () => mat.dispose(),
            };
        },
        [],
        { toneMapping: THREE.NoToneMapping, antialias: false },
    );

    const s = STEPS[p.step];
    return (
        <Demo
            title="Pixel painter — a shader in six steps"
            hint="Click through the steps. Move the mouse over the canvas: the mouse position is a uniform — one value shared by every pixel."
            onReset={reset}
            stacked
            controls={
                <>
                    <Slider label="radius" value={p.radius} min={0.02} max={0.6} onChange={(v) => set('radius', v)} />
                    <Slider label="softness" value={p.soft} min={0} max={0.5} onChange={(v) => set('soft', v)} />
                    <Slider label="noise scale" value={p.scale} min={0.5} max={14} step={0.1} onChange={(v) => set('scale', v)} />
                    <Slider label="time speed" value={p.speed} min={0} max={1} onChange={(v) => set('speed', v)} />
                </>
            }
        >
            <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
                <div ref={host} className="h-[320px] sm:h-[400px]" />
                <div className="flex flex-col border-t border-[var(--il-line)] p-4 lg:border-l lg:border-t-0">
                    <div className="mb-4 flex flex-wrap gap-1">
                        {STEPS.map((st, i) => (
                            <button
                                key={st.title}
                                type="button"
                                onClick={() => set('step', i)}
                                className={cn(
                                    'il-btn il-mono flex size-8 items-center justify-center rounded-md border text-[11px]',
                                    p.step === i
                                        ? 'border-[var(--il-ice)] bg-[rgba(148,219,255,0.14)] text-[var(--il-ink)]'
                                        : 'border-[var(--il-line)] text-[var(--il-faint)] hover:text-[var(--il-ink)]',
                                )}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                    <div className="mb-1 text-[16px] font-semibold">{s.title}</div>
                    <p className="mb-4 text-[13.5px] leading-relaxed text-[var(--il-dim)]">{s.says}</p>
                    <pre className="il-mono il-scrollbox mt-auto overflow-x-auto rounded-lg border border-[var(--il-line)] bg-black/35 p-3 text-[11.5px] leading-relaxed text-[#cfeeff]">{s.glsl}</pre>
                </div>
            </div>
        </Demo>
    );
}

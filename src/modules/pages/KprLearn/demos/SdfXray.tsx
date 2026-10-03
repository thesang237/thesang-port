'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';

import { Demo, Readout, Slider, Toggle } from '../kit/controls';
import { useParams, useThreeCanvas } from '../kit/loop';

/**
 * Teaching copy of the shape maths in gl/materials/notched.ts (one notch on the top-right corner, along
 * the top edge, plus a 45° cut bottom right), drawn as a distance map: every pixel shows how far it is
 * from the edge. Contour lines every 12 px; inside is lavender, outside grey; the edge is black.
 */
const FRAG = /* glsl */ `
    uniform vec2 uSize; uniform float uRadius; uniform vec2 uNotch; uniform float uCut; uniform float uK; uniform float uSmooth; uniform float uField;
    uniform vec2 uMouse; uniform vec2 uFrame;
    varying vec2 vUv;
    float sdRoundBox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r; }
    float smax(float a, float b, float k) {
        if (uSmooth < 0.5) return max(a, b);
        float h = max(k - abs(a - b), 0.0) / max(k, 1e-4);
        return max(a, b) + h * h * k * 0.25;
    }
    float shape(vec2 p, vec2 hs) {
        float r = min(uRadius, min(hs.x, hs.y));
        float d = sdRoundBox(p, hs, r);
        // notch at the top-right corner along the top edge: above the step line AND right of the 45° step
        float a = p.y - (hs.y - uNotch.y);
        float b = ((p.x + p.y) - (hs.x - uNotch.x + hs.y)) * 0.70710678;
        float k = min(r * 1.1, uNotch.y * 0.75) * uK;
        float cut = -smax(-a, -b, k);
        if (uNotch.y > 0.01) d = smax(d, cut, k);
        // 45° corner cut, bottom right
        vec2 q = vec2(p.x, -p.y);
        float c = ((q.x + q.y) - (hs.x + hs.y - uCut)) * 0.70710678;
        if (uCut > 0.01) d = smax(d, c, min(r * 1.1, uCut * 0.5) * uK);
        return d;
    }
    void main() {
        vec2 p = (vUv - 0.5) * uFrame;
        float d = shape(p, uSize * 0.5);
        float aa = fwidth(d);
        vec3 inside = vec3(0.545, 0.494, 0.851);
        vec3 outside = vec3(0.93, 0.93, 0.92);
        vec3 col = d < 0.0 ? inside : outside;
        if (uField > 0.5) {
            float bands = abs(fract(d / 12.0 + 0.5) - 0.5) * 12.0;
            float line = 1.0 - smoothstep(0.0, aa * 1.2, bands);
            col = mix(col, d < 0.0 ? vec3(0.25, 0.2, 0.55) : vec3(0.55), line * 0.55);
            col *= d < 0.0 ? 0.85 + 0.15 * smoothstep(-80.0, 0.0, d) : 1.0;
        }
        col = mix(col, vec3(0.0), 1.0 - smoothstep(0.0, aa * 1.5, abs(d)));
        float m = length(p - uMouse);
        col = mix(col, vec3(0.75, 0.98, 0.31), 1.0 - smoothstep(4.0, 5.5, m));
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
    }
`;

/* the same maths in TypeScript, to read the distance under the pointer */
const sdRoundBox = (px: number, py: number, bx: number, by: number, r: number) => {
    const qx = Math.abs(px) - bx + r;
    const qy = Math.abs(py) - by + r;
    return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
};

const DEFAULTS = { w: 420, h: 300, radius: 17.4, nLen: 150, nDepth: 22, cut: 24, k: 1, smooth: true, field: true };

export default function SdfXray() {
    const host = useRef<HTMLDivElement>(null);
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const [probe, setProbe] = useState<{ d: number } | null>(null);

    useThreeCanvas(host, ({ renderer, pointer }) => {
        const scene = new THREE.Scene();
        const cam = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 10);
        cam.position.z = 1;
        const mat = new THREE.ShaderMaterial({
            vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }',
            fragmentShader: FRAG,
            uniforms: {
                uSize: { value: new THREE.Vector2() },
                uRadius: { value: 0 },
                uNotch: { value: new THREE.Vector2() },
                uCut: { value: 0 },
                uK: { value: 1 },
                uSmooth: { value: 1 },
                uField: { value: 1 },
                uMouse: { value: new THREE.Vector2(9999, 9999) },
                uFrame: { value: new THREE.Vector2(1, 1) },
            },
        });
        const geo = new THREE.PlaneGeometry(1, 1);
        scene.add(new THREE.Mesh(geo, mat));
        let lastProbe = 0;
        let aspect = 4 / 3;
        const u = mat.uniforms;
        return {
            resize: (w, h) => {
                aspect = w / h;
            },
            frame: (time) => {
                const d = ref.current;
                // fit the card plus an 80 px margin, keeping pixels square
                const fh = Math.max(d.h + 160, (d.w + 160) / aspect);
                const fw = fh * aspect;
                u.uFrame.value.set(fw, fh);
                u.uSize.value.set(d.w, d.h);
                u.uRadius.value = d.radius;
                u.uNotch.value.set(d.nLen, d.nDepth);
                u.uCut.value = d.cut;
                u.uK.value = d.k;
                u.uSmooth.value = d.smooth ? 1 : 0;
                u.uField.value = d.field ? 1 : 0;
                if (pointer.over) {
                    const mx = (pointer.x * fw) / 2;
                    const my = (pointer.y * fh) / 2;
                    u.uMouse.value.set(mx, my);
                    if (time - lastProbe > 0.08) {
                        lastProbe = time;
                        // the rounded box part only (enough to see the sign flip at the edge)
                        setProbe({ d: sdRoundBox(mx, my, d.w / 2, d.h / 2, Math.min(d.radius, d.w / 2, d.h / 2)) });
                    }
                } else u.uMouse.value.set(9999, 9999);
                renderer.render(scene, cam);
            },
            dispose: () => {
                geo.dispose();
                mat.dispose();
            },
        };
    });

    return (
        <Demo
            title="Distance-field x-ray"
            hint="Every pixel knows its distance to the edge (lines every 12 px). Move the pointer over it; switch off “smooth joints” to see what smax adds."
            onReset={reset}
            controls={
                <>
                    <Toggle label="smooth joints (smax)" checked={p.smooth} onChange={(v) => set('smooth', v)} help="Off: a plain max — the inner corners of the notch go sharp." />
                    <Slider
                        label="joint rounding ×"
                        value={p.k}
                        min={0}
                        max={4}
                        step={0.05}
                        onChange={(v) => set('k', v)}
                        help="1 = the source (k = min(1.1 r, 0.75 × depth)). Push it to see the edges melt."
                    />
                    <Slider label="radius" value={p.radius} min={0} max={80} step={0.5} onChange={(v) => set('radius', v)} format={(v) => `${v.toFixed(1)} px`} />
                    <Slider label="notch length" value={p.nLen} min={0} max={400} step={1} onChange={(v) => set('nLen', v)} format={(v) => `${v.toFixed(0)} px`} />
                    <Slider label="notch depth" value={p.nDepth} min={0} max={100} step={0.5} onChange={(v) => set('nDepth', v)} format={(v) => `${v.toFixed(1)} px`} />
                    <Slider label="corner cut" value={p.cut} min={0} max={120} step={0.5} onChange={(v) => set('cut', v)} format={(v) => `${v.toFixed(1)} px`} />
                    <Toggle label="show the field" checked={p.field} onChange={(v) => set('field', v)} />
                    <Readout
                        items={[
                            { label: 'distance (box)', value: probe ? `${probe.d.toFixed(1)} px` : '—', color: probe && probe.d < 0 ? '#b9b4e8' : '#c0fb50' },
                            { label: 'sign', value: probe ? (probe.d < 0 ? 'inside' : 'outside') : '—' },
                        ]}
                    />
                </>
            }
        >
            <div ref={host} className="aspect-[4/3] w-full cursor-crosshair" />
        </Demo>
    );
}

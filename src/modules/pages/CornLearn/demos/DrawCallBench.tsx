'use client';

import { useRef } from 'react';
import * as THREE from 'three';

import { Demo, Segmented, Slider } from '../kit/controls';
import { disposeObject } from '../kit/gl';
import { useParams, useThreeCanvas } from '../kit/loop';
import { rng } from '../kit/source';

/**
 * The same N glowing dots, drawn two ways: as one Points object (one draw call, how the page draws
 * every bead field) or as N separate objects (N draw calls). The readout is the CPU time three.js
 * spends issuing the frame, averaged — the GPU work is nearly identical.
 */
const DEFAULTS = { mode: 'one' as 'one' | 'many', count: 1500 };

const vert = /* glsl */ `
attribute float aSeed;
uniform float uTime;
varying float vSeed;
void main() {
    vSeed = aSeed;
    vec3 p = position;
    p.y += sin(uTime * 0.8 + aSeed * 30.0) * 0.08;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (4.0 + aSeed * 10.0) * (10.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
}`;
const frag = /* glsl */ `
varying float vSeed;
void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = 1.0 - smoothstep(0.4, 1.0, d);
    vec3 c = mix(vec3(0.33, 1.0, 0.76), vec3(0.93, 0.53, 0.23), step(0.7, vSeed));
    gl_FragColor = vec4(c * 0.8, a); // additive blending multiplies by alpha
}`;

export default function DrawCallBench() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const read = useRef<HTMLDivElement>(null);

    useThreeCanvas(
        host,
        ({ renderer }) => {
            renderer.autoClear = true;
            const scene = new THREE.Scene();
            const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
            cam.position.set(0, 0, 9);
            const mat = new THREE.ShaderMaterial({
                uniforms: { uTime: { value: 0 } },
                vertexShader: vert,
                fragmentShader: frag,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            const group = new THREE.Group();
            scene.add(group);
            let key = '';
            let avg = 0;
            let frames = 0;
            const build = (mode: string, count: number) => {
                group.children.slice().forEach((c) => {
                    group.remove(c);
                    (c as THREE.Points).geometry.dispose();
                });
                const r = rng(9);
                const pos = new Float32Array(count * 3);
                const seed = new Float32Array(count);
                for (let i = 0; i < count; i++) {
                    const a = r() * Math.PI * 2;
                    const rad = Math.sqrt(r()) * 4;
                    pos.set([Math.cos(a) * rad * 1.5, (r() - 0.5) * 4.5, Math.sin(a) * rad * 0.6], i * 3);
                    seed[i] = r();
                }
                if (mode === 'one') {
                    const g = new THREE.BufferGeometry();
                    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
                    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
                    group.add(new THREE.Points(g, mat));
                } else {
                    for (let i = 0; i < count; i++) {
                        const g = new THREE.BufferGeometry();
                        g.setAttribute('position', new THREE.BufferAttribute(pos.slice(i * 3, i * 3 + 3), 3));
                        g.setAttribute('aSeed', new THREE.BufferAttribute(seed.slice(i, i + 1), 1));
                        group.add(new THREE.Points(g, mat));
                    }
                }
                avg = 0;
                frames = 0;
            };
            return {
                resize(w, h) {
                    cam.aspect = w / h;
                    cam.updateProjectionMatrix();
                },
                frame(time) {
                    const prm = ref.current;
                    const k = `${prm.mode}|${prm.count}`;
                    if (k !== key) {
                        key = k;
                        build(prm.mode, prm.count);
                    }
                    mat.uniforms.uTime.value = time;
                    group.rotation.y = time * 0.1;
                    renderer.setClearColor(0x040a07, 1);
                    const t0 = performance.now();
                    renderer.render(scene, cam);
                    const ms = performance.now() - t0;
                    frames++;
                    avg += (ms - avg) * (frames < 10 ? 0.5 : 0.05);
                    if (read.current && frames % 10 === 0) {
                        read.current.textContent = `${renderer.info.render.calls} draw call${renderer.info.render.calls > 1 ? 's' : ''} · ${prm.count} dots · ${avg.toFixed(2)} ms of CPU to issue the frame`;
                    }
                },
                dispose() {
                    disposeObject(group);
                    mat.dispose();
                },
            };
        },
        [],
        { antialias: false, maxDpr: 1.5 },
    );

    return (
        <Demo
            title="Draw-call bench: one object vs many"
            hint="Same dots, same shader. Switch between one object and one object per dot, then raise the count. Watch the CPU time, not the picture."
            onReset={reset}
            controls={
                <>
                    <Segmented
                        label="draw the dots as"
                        options={[
                            { value: 'one', label: 'one Points object' },
                            { value: 'many', label: 'one object per dot' },
                        ]}
                        value={p.mode}
                        onChange={(v) => set('mode', v)}
                    />
                    <Slider label="dots" value={p.count} min={100} max={3000} step={100} onChange={(v) => set('count', v)} help="The DNA alone has 6,000 beads; the page draws them in one call." />
                    <div ref={read} className="cl-mono rounded-md border border-[var(--cl-line)] bg-[#030806] p-2.5 text-[11px] leading-relaxed text-[var(--cl-gold)]" aria-live="polite" />
                </>
            }
        >
            <div ref={host} className="aspect-[4/3] w-full sm:aspect-[16/9]" />
        </Demo>
    );
}

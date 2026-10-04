'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';

import { loadTex } from '../kit/assets';
import { Demo, Group, Segmented, Slider, StageNote, Toggle } from '../kit/controls';
import { createLinearOutput, disposeObject } from '../kit/gl';
import { prefersReducedMotion, useParams, useThreeCanvas } from '../kit/loop';
import { damp, rng, TILT } from '../kit/source';

/**
 * Teaching copy of PlotsWorld's "Field-Object": every plot is a stack of 5–7 transparent slices of
 * crop from one atlas (map-field-diffuse: 12 frames of 256 px), lifted 0.13 apart. All slices of all
 * plots are one instanced mesh. Tilt the camera: the layers slide against each other (parallax).
 */
const N = 12;
const DEFAULTS = { gap: 0.13, layers: 7, view: 'angled' as 'top' | 'angled' | 'side', wind: true, tint: true };

const vert = /* glsl */ `
attribute vec3 a_base;      // plot x, y and the slice's lift
attribute vec4 a_frame;     // atlas rect (px)
attribute float a_rot;
attribute float a_rand;
attribute float a_tint;
attribute float a_layer;
attribute float a_plus;
uniform float uTime, uGap, uLayers, uWind;
uniform sampler2D tNoise;
varying vec2 vUv;
varying vec4 vFrame;
varying float vRot, vTint, vElev;
void main() {
    vec3 p = position;
    vec2 posT = p.xy - vec2(uTime * 0.7 * 0.8, uTime * 0.7 * 0.1) * a_rand * 24.0;
    float turb = (texture2D(tNoise, posT * 0.2).r * 2.0 - 1.0) * a_rand * uWind;
    p += vec3(0.04, 0.04, 0.06) * turb;                       // wind through the crop
    p.xy *= vec2(1.08, 1.02);
    float z = uGap + a_layer * (uGap + a_plus * 0.5);           // PlotsWorld: ELEV + g · (ELEV ± 0.02)
    vec3 world = vec3(p.xy + a_base.xy, z);
    vUv = uv; vFrame = a_frame; vRot = a_rot; vTint = a_tint; vElev = a_layer / 6.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
    if (a_layer >= uLayers) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;
const frag = /* glsl */ `
#define PI 3.141592653589793
uniform sampler2D tAtlas, tNoise;
uniform float uTime, uTintOn;
varying vec2 vUv;
varying vec4 vFrame;
varying float vRot, vTint, vElev;
vec2 rotateUV(vec2 uv, float r) { return vec2(cos(r) * (uv.x - 0.5) + sin(r) * (uv.y - 0.5) + 0.5, cos(r) * (uv.y - 0.5) - sin(r) * (uv.x - 0.5) + 0.5); }
float ov(float b, float s) { return b < 0.5 ? 2.0 * b * s : 1.0 - 2.0 * (1.0 - b) * (1.0 - s); }
void main() {
    vec4 f = vFrame / 1024.0;
    vec2 uv = rotateUV(vUv, PI * vRot + PI * 0.5);
    vec4 tex = texture2D(tAtlas, vec2(f.x + uv.x * f.z, f.y + uv.y * f.w));
    if (tex.a < 0.02) discard;
    vec3 col = pow(tex.rgb, vec3(1.0 / 2.2));                   // display-space maths, like the page
    vec3 tint = mix(vec3(0.60, 0.44, 0.28), vec3(0.33, 0.50, 0.40), vTint);
    if (uTintOn > 0.5) col = vec3(ov(col.r, tint.r), ov(col.g, tint.g), ov(col.b, tint.b));
    col *= mix(0.55, 1.15, vElev);                             // higher slices catch more light
    gl_FragColor = vec4(pow(col, vec3(2.2)), tex.a);
}`;

export default function SliceLab() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState('Loading the plot atlas…');

    useThreeCanvas(
        host,
        ({ renderer, size, pointer }) => {
            const out = createLinearOutput({ samples: 2, vignette: true });
            const scene = new THREE.Scene();
            const field = new THREE.Group();
            field.rotation.x = -0.12;
            scene.add(field);
            const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
            const rand = rng(17);
            const stacks = Array.from({ length: N * N }, () => ({ quads: rand() < 0.5 ? 7 : 5, tint: rand(), rot: Math.floor(rand() * 2), plus: rand() * 0.08 - 0.04 }));
            const total = stacks.reduce((s, t) => s + t.quads, 0);
            const plane = new THREE.PlaneGeometry(1, 1, 4, 4);
            const geo = new THREE.InstancedBufferGeometry();
            geo.index = plane.index;
            geo.setAttribute('position', plane.getAttribute('position'));
            geo.setAttribute('uv', plane.getAttribute('uv'));
            geo.instanceCount = total;
            const A = (n: number) => new Float32Array(total * n);
            const base = A(3);
            const frame = A(4);
            const rot = A(1);
            const rnd = A(1);
            const tint = A(1);
            const layer = A(1);
            const plus = A(1);
            let h = 0;
            stacks.forEach((m, f) => {
                const v = f % N;
                const d = Math.floor(f / N);
                for (let g = 0; g < m.quads; g++) {
                    const idx = m.quads > 5 ? 12 - (g + 1) : 5 - (g + 1);
                    base.set([v - (N - 1) / 2, -(d - (N - 1) / 2), 0], h * 3);
                    frame.set([(idx % 4) * 256, Math.floor(idx / 4) * 256, 256, 256], h * 4);
                    rot[h] = m.rot;
                    rnd[h] = 0.5 + rand() * 0.5;
                    tint[h] = m.tint;
                    layer[h] = g;
                    plus[h] = m.plus;
                    h++;
                }
            });
            const attr = (name: string, arr: Float32Array, n: number) => geo.setAttribute(name, new THREE.InstancedBufferAttribute(arr, n));
            attr('a_base', base, 3);
            attr('a_frame', frame, 4);
            attr('a_rot', rot, 1);
            attr('a_rand', rnd, 1);
            attr('a_tint', tint, 1);
            attr('a_layer', layer, 1);
            attr('a_plus', plus, 1);
            const uniforms = {
                tAtlas: { value: null as THREE.Texture | null },
                tNoise: { value: null as THREE.Texture | null },
                uTime: { value: 0 },
                uGap: { value: 0.13 },
                uLayers: { value: 7 },
                uWind: { value: 1 },
                uTintOn: { value: 1 },
            };
            const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag, transparent: true, depthTest: false, depthWrite: false });
            const tiles = new THREE.Mesh(geo, mat);
            tiles.frustumCulled = false;
            tiles.visible = false;
            // soil under the plots
            const ground = new THREE.Mesh(new THREE.PlaneGeometry(N * 1.08, N * 1.08), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.06, 0.045, 0.03) }));
            ground.position.z = -0.05;
            field.add(ground, tiles);
            const texs: THREE.Texture[] = [];
            let alive = true;
            Promise.all([loadTex('map-field-diffuse'), loadTex('map-cloud-noise', { data: true, repeat: true })])
                .then(([atlas, noise]) => {
                    texs.push(atlas, noise);
                    if (!alive) return;
                    uniforms.tAtlas.value = atlas;
                    uniforms.tNoise.value = noise;
                    tiles.visible = true;
                    setStatus('');
                })
                .catch(() => setStatus('Could not load the atlas'));
            let yaw = 0;
            let pitch = 0.5;
            let t = 0;
            const pivot = new THREE.Vector3();
            const ptr = new THREE.Vector2();
            return {
                resize(w, hh) {
                    out.setSize(w, hh, size.dpr);
                    cam.aspect = w / hh;
                    cam.updateProjectionMatrix();
                },
                frame(time, dt) {
                    t += dt;
                    const prm = ref.current;
                    uniforms.uTime.value = 0.02 * time;
                    uniforms.uGap.value = prm.gap;
                    uniforms.uLayers.value = prm.layers;
                    uniforms.uWind.value = prm.wind ? 1 : 0;
                    uniforms.uTintOn.value = prm.tint ? 1 : 0;
                    if (pointer.over) ptr.set(pointer.x, pointer.y);
                    else if (!prefersReducedMotion()) ptr.set(Math.sin(t * 0.4) * 0.8, Math.sin(t * 0.55) * 0.6);
                    const basePitch = prm.view === 'top' ? 0.02 : prm.view === 'angled' ? 0.55 : 1.32;
                    yaw = damp(yaw, ptr.x * TILT.yaw * 1.6, 4, dt);
                    pitch = damp(pitch, basePitch + ptr.y * TILT.pitch * 1.2, 4, dt);
                    const cp = Math.cos(pitch);
                    const dist = prm.view === 'side' ? 7 : 9.5;
                    // PlotsWorld orbits in the field's frame: plots in x/y, layers toward +z
                    cam.up.set(0, 1, 0);
                    cam.position.set(pivot.x + Math.sin(yaw) * cp * dist, pivot.y - Math.sin(pitch) * dist, pivot.z + Math.cos(yaw) * cp * dist);
                    cam.lookAt(pivot);
                    out.begin(renderer, 0x050806);
                    renderer.render(scene, cam);
                    out.present(renderer);
                },
                dispose() {
                    alive = false;
                    disposeObject(scene);
                    plane.dispose();
                    texs.forEach((x) => x.dispose());
                    out.dispose();
                },
            };
        },
        [],
        { antialias: false, maxDpr: 1.5 },
    );

    return (
        <Demo
            title="Stacked slices: volume from flat pictures"
            hint="Move over the field to tilt it: the crop layers slide past each other. Set the gap to 0 and the same field turns into a flat sticker."
            onReset={reset}
            controls={
                <>
                    <Segmented
                        label="camera"
                        options={[
                            { value: 'top', label: 'from above' },
                            { value: 'angled', label: 'angled' },
                            { value: 'side', label: 'side x-ray' },
                        ]}
                        value={p.view}
                        onChange={(v) => set('view', v)}
                    />
                    <Group title="Slices">
                        <Slider label="gap between slices" value={p.gap} min={0} max={0.6} step={0.005} onChange={(v) => set('gap', v)} help="0.26 × 0.5 = 0.13 plot widths on the page. 0 = flat." />
                        <Slider label="slices per plot" value={p.layers} min={1} max={7} step={1} onChange={(v) => set('layers', v)} help="Tall plots have 7, short ones 5." />
                    </Group>
                    <Group title="Look">
                        <Toggle label="wind jiggle" checked={p.wind} onChange={(v) => set('wind', v)} help="Each slice shivers on cloud noise in the vertex shader." />
                        <Toggle label="per-plot tint" checked={p.tint} onChange={(v) => set('tint', v)} help="Overlay between soil-brown and green: every plot a slightly different crop." />
                    </Group>
                </>
            }
        >
            <div ref={host} className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
                {status ? <StageNote>{status}</StageNote> : null}
            </div>
        </Demo>
    );
}

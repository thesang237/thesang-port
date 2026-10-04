'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';

import { disposeGltf, loadModel, loadTex } from '../kit/assets';
import { ColorDot, Demo, Group, Slider, StageNote, Toggle } from '../kit/controls';
import { createLinearOutput } from '../kit/gl';
import { prefersReducedMotion, useParams, useThreeCanvas } from '../kit/loop';
import { bakedGeometry, damp } from '../kit/source';

/**
 * Teaching copy of KernelWorld's kernelMaterial with a build-up slider: 1 albedo → 2 × a multiply
 * matcap → 3 colour burn (0.27, 0.88, 0.97) at 30 % → 4 screen a second matcap. The maths runs on
 * display values like the reference, then converts back to linear.
 */
const DEFAULTS = { step: 4, burn: 0.3, glow: 1, spin: true };
const STEPS = ['', 'Albedo: the painted colour only', '× multiply matcap: shading from a lit sphere', '+ colour burn 30 %: deep, saturated shadows', '+ screen matcap: the rim light and sheen'];

const vert = /* glsl */ `
varying vec2 vUv;
varying vec2 vN;
void main() {
    vUv = uv;
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    vec3 e = normalize(p.xyz);
    vec3 n = normalize(mat3(modelViewMatrix) * normal);
    vec3 r = reflect(e, n);
    float m = 2.0 * sqrt(r.x * r.x + r.y * r.y + (r.z + 1.0) * (r.z + 1.0));
    vN = r.xy / m + 0.5;                         // sphere-map uv: where this normal sits on the matcap ball
    gl_Position = projectionMatrix * p;
}`;
const frag = /* glsl */ `
uniform sampler2D tMap, tMult, tScreen;
uniform float uStep, uBurn, uGlow;
varying vec2 vUv;
varying vec2 vN;
vec3 toDisplay(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
float burn(float base, float blend) { return blend == 0.0 ? blend : max(1.0 - (1.0 - base) / blend, 0.0); }
void main() {
    vec3 base = toDisplay(texture2D(tMap, vUv).rgb);
    vec3 c = base;
    if (uStep > 1.5) c = base * toDisplay(texture2D(tMult, vN).rgb);
    if (uStep > 2.5) {
        vec3 cb = vec3(0.27, 0.88, 0.97);
        c = mix(c, vec3(burn(c.r, cb.r), burn(c.g, cb.g), burn(c.b, cb.b)), uBurn);
    }
    if (uStep > 3.5) {
        vec3 scr = toDisplay(texture2D(tScreen, vN).rgb) * uGlow;
        c = 1.0 - (1.0 - c) * (1.0 - scr);
    }
    gl_FragColor = vec4(pow(c, vec3(2.2)), 1.0);
}`;

export default function MatcapLab() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState('Loading the kernel…');

    useThreeCanvas(
        host,
        ({ renderer, size, pointer }) => {
            const out = createLinearOutput({ samples: 4 });
            const scene = new THREE.Scene();
            const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
            const uniforms = {
                tMap: { value: null as THREE.Texture | null },
                tMult: { value: null as THREE.Texture | null },
                tScreen: { value: null as THREE.Texture | null },
                uStep: { value: 4 },
                uBurn: { value: 0.3 },
                uGlow: { value: 1 },
            };
            const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag });
            let mesh: THREE.Mesh | null = null;
            const textures: THREE.Texture[] = [];
            let gltf: Awaited<ReturnType<typeof loadModel>> | null = null;
            let alive = true;
            Promise.all([loadModel('KERNAL'), loadTex('map_diffuse_kernel'), loadTex('map_matcap_mult'), loadTex('map_matcap_screen')])
                .then(([g, a, m, s]) => {
                    gltf = g;
                    textures.push(a, m, s);
                    if (!alive) return;
                    uniforms.tMap.value = a;
                    uniforms.tMult.value = m;
                    uniforms.tScreen.value = s;
                    const geo = bakedGeometry(g.scene);
                    geo.computeBoundingBox();
                    const box = geo.boundingBox!;
                    const c = box.getCenter(new THREE.Vector3());
                    geo.translate(-c.x, -c.y, -c.z);
                    const h = box.max.y - box.min.y;
                    mesh = new THREE.Mesh(geo, mat);
                    mesh.scale.setScalar(2.2 / h);
                    scene.add(mesh);
                    setStatus('');
                })
                .catch(() => setStatus('Could not load the kernel'));
            cam.position.set(0, 0, 7);
            let rx = 0.1;
            let ry = 0.3;
            return {
                resize(w, h) {
                    out.setSize(w, h, size.dpr);
                    cam.aspect = w / h;
                    cam.updateProjectionMatrix();
                },
                frame(time, dt) {
                    const prm = ref.current;
                    uniforms.uStep.value = prm.step;
                    uniforms.uBurn.value = prm.burn;
                    uniforms.uGlow.value = prm.glow;
                    if (mesh) {
                        const spin = prm.spin && !prefersReducedMotion() ? time * 0.35 : 0;
                        rx = damp(rx, 0.1 + (pointer.over ? -pointer.y * 0.6 : 0), 4, dt);
                        ry = damp(ry, 0.3 + (pointer.over ? pointer.x * 1.2 : 0), 4, dt);
                        mesh.rotation.set(rx, ry + spin, -0.08);
                    }
                    out.begin(renderer, 0x0a0705);
                    renderer.render(scene, cam);
                    out.present(renderer);
                },
                dispose() {
                    alive = false;
                    mesh?.geometry.dispose();
                    mat.dispose();
                    disposeGltf(gltf);
                    textures.forEach((x) => x.dispose());
                    out.dispose();
                },
            };
        },
        [],
        { antialias: false, maxDpr: 2 },
    );

    return (
        <Demo
            title="Matcap kernel: studio light without lights"
            stacked
            hint="Step the build-up from 1 to 4. Move over the kernel to turn it: the shading stays glued to the view, because a matcap is looked up by the surface’s direction to you."
            onReset={reset}
            controls={
                <>
                    <Slider label="build-up" value={p.step} min={1} max={4} step={1} onChange={(v) => set('step', v)} format={(v) => `${v} / 4`} help={STEPS[p.step]} />
                    <Group title="Dials">
                        <Slider
                            label="colour burn amount"
                            value={p.burn}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(v) => set('burn', v)}
                            format={(v) => `${Math.round(v * 100)} %`}
                            help="The page: 30 %. Burn darkens and saturates toward cyan-ish (0.27, 0.88, 0.97)."
                        />
                        <Slider label="screen glow" value={p.glow} min={0} max={2} step={0.01} onChange={(v) => set('glow', v)} help="Strength of the second matcap (rim + sheen)." />
                    </Group>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            ['map_matcap_mult', 'multiply matcap'],
                            ['map_matcap_screen', 'screen matcap'],
                        ].map(([f, l]) => (
                            <figure key={f}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={`/corn/tex/${f}.webp`} alt={l} className="aspect-square w-full rounded-full border border-[var(--cl-line-2)] object-cover" />
                                <figcaption className="cl-mono mt-1 text-center text-[10px] text-[var(--cl-dim)]">{l}</figcaption>
                            </figure>
                        ))}
                    </div>
                    <ColorDot label="burn colour" color="rgb(69,224,247)" note="(0.27, 0.88, 0.97)" />
                    <Toggle label="slow spin" checked={p.spin} onChange={(v) => set('spin', v)} />
                </>
            }
        >
            <div ref={host} className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
                {status ? <StageNote>{status}</StageNote> : null}
            </div>
        </Demo>
    );
}

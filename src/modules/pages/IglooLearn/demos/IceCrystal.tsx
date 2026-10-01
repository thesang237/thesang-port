'use client';

import { useRef } from 'react';
import * as THREE from 'three';

import { Demo, Group, Segmented, Slider, Toggle } from '../kit/controls';
import { UV_VERT } from '../kit/glsl';
import { useParams, useThreeCanvas } from '../kit/loop';
import { damp } from '../kit/math';

import { buildCrystalGeometry, createCrystalMaterial, createSnow, CRYSTAL_DEFAULTS } from './crystal';

const DEFAULTS = { ...CRYSTAL_DEFAULTS, shape: 'rock' as 'rock' | 'prism' | 'shard', spin: true, light: true };

const BACKDROP = /* glsl */ `
uniform vec3 uColor;
uniform float uLight;
varying vec2 vUv;
void main() {
    vec2 p = vUv * vec2(60.0, 34.0);
    vec2 g = fract(p) - 0.5;
    float dots = smoothstep(0.07, 0.0, length(g));
    vec3 col = mix(vec3(0.004, 0.006, 0.01), uColor, uLight);
    col += dots * mix(0.02, 0.35, uLight);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
}
`;

/** The portfolio crystal — every ingredient of the ice shader on a dial. */
export default function IceCrystal() {
    const host = useRef<HTMLDivElement>(null);
    const { p, set, ref, reset } = useParams(DEFAULTS);

    useThreeCanvas(
        host,
        ({ renderer, pointer, host: el }) => {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
            camera.position.set(0, 0, 7.4);
            const mat = createCrystalMaterial();
            const geos = { rock: buildCrystalGeometry(11, 'rock'), prism: buildCrystalGeometry(18, 'prism'), shard: buildCrystalGeometry(32, 'shard') };
            const crystal = new THREE.Mesh(geos.rock, mat);
            scene.add(crystal);
            const backMat = new THREE.ShaderMaterial({ vertexShader: UV_VERT, fragmentShader: BACKDROP, uniforms: { uColor: { value: new THREE.Color('#bcc3cd') }, uLight: { value: 1 } } });
            const back = new THREE.Mesh(new THREE.PlaneGeometry(60, 34), backMat);
            back.position.z = -14;
            scene.add(back);
            const snow = createSnow(700, [16, 12, 8], { speed: 0.18, pointSize: 1.6, opacity: 0.6 });
            snow.position.z = -2;
            scene.add(snow);
            const ray = new THREE.Raycaster();
            const ndc = new THREE.Vector2();
            const st = { hover: 0, rot: 0, sx: 0, sy: 0 };

            return {
                resize: (w, h) => {
                    camera.aspect = w / h;
                    camera.updateProjectionMatrix();
                },
                frame: (t, dt) => {
                    const P = ref.current;
                    if (crystal.geometry !== geos[P.shape]) crystal.geometry = geos[P.shape];
                    ray.setFromCamera(ndc.set(pointer.x, pointer.y), camera);
                    const hit = pointer.over && ray.intersectObject(crystal, false).length > 0;
                    st.hover = damp(st.hover, hit ? 1 : 0, 6, dt);
                    st.sx = damp(st.sx, pointer.over ? pointer.x : 0, 3.5, dt);
                    st.sy = damp(st.sy, pointer.over ? pointer.y : 0, 3.5, dt);
                    if (P.spin) st.rot += dt * 0.18;
                    crystal.rotation.set(0.15 + st.sy * 0.25 + Math.sin(t * 0.3) * 0.06, st.rot + st.sx * 0.4, Math.sin(t * 0.25) * 0.05);
                    crystal.position.y = Math.sin(t * 0.6) * 0.08;
                    camera.position.set(st.sx * 0.5, st.sy * 0.35, 7.4);
                    camera.lookAt(0, 0, 0);

                    const u = mat.uniforms;
                    u.uTime.value = t;
                    u.uFresnel.value = P.fresnel;
                    u.uPower.value = P.power;
                    u.uIrid.value = P.irid + st.hover * 0.5;
                    u.uEdges.value = P.edges + st.hover * 0.6;
                    u.uFrost.value = P.frost;
                    u.uCloud.value = P.cloud;
                    u.uSpark.value = P.spark;
                    u.uRefract.value = P.refract;
                    u.uGlitch.value = damp(u.uGlitch.value, P.glitch + st.hover * 0.35, 8, dt);
                    backMat.uniforms.uLight.value = P.light ? 1 : 0;
                    (snow.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
                    el.style.cursor = hit ? 'pointer' : '';
                    renderer.render(scene, camera);
                },
                dispose: () => {
                    Object.values(geos).forEach((g) => g.dispose());
                    mat.dispose();
                    backMat.dispose();
                    back.geometry.dispose();
                    snow.geometry.dispose();
                    (snow.material as THREE.Material).dispose();
                },
            };
        },
        [],
    );

    return (
        <Demo
            title="Ice crystal — a hand-written material"
            hint="Pull each dial to 0 to see what it contributes, then back up. Hover the crystal: iridescence, edges and glitch all rise together."
            onReset={reset}
            controls={
                <>
                    <Group title="Object">
                        <Segmented label="shape" options={['rock', 'prism', 'shard'] as const} value={p.shape} onChange={(v) => set('shape', v)} />
                        <Toggle label="spin" checked={p.spin} onChange={(v) => set('spin', v)} />
                        <Toggle label="light backdrop (as on Igloo)" checked={p.light} onChange={(v) => set('light', v)} />
                    </Group>
                    <Group title="Inside the ice">
                        <Slider
                            label="refraction (see-through)"
                            value={p.refract}
                            min={0}
                            max={2}
                            onChange={(v) => set('refract', v)}
                            help="Bends the view ray through the surface into a fake room gradient."
                        />
                        <Slider label="cloudiness" value={p.cloud} min={0} max={2} onChange={(v) => set('cloud', v)} help="fbm noise inside the volume — milky, not glass-clear." />
                        <Slider label="frosted base" value={p.frost} min={0} max={1.5} onChange={(v) => set('frost', v)} help="Below a height, mix toward white with noise: crushed ice." />
                    </Group>
                    <Group title="Surface">
                        <Slider label="fresnel glow" value={p.fresnel} min={0} max={1.5} onChange={(v) => set('fresnel', v)} help="Edges seen at grazing angles glow." />
                        <Slider label="fresnel power" value={p.power} min={0.5} max={6} onChange={(v) => set('power', v)} help="Higher = only the very rim glows." />
                        <Slider label="iridescence" value={p.irid} min={0} max={1.5} onChange={(v) => set('irid', v)} help="Cosine rainbow on the rim — a thin-film (soap bubble) look." />
                        <Slider label="facet edges" value={p.edges} min={0} max={2} onChange={(v) => set('edges', v)} help="Bright lines where triangles meet, via barycentric coords." />
                        <Slider label="sparkle" value={p.spark} min={0} max={2} onChange={(v) => set('spark', v)} help="A sharp specular highlight from a fixed light direction." />
                        <Slider
                            label="glitch"
                            value={p.glitch}
                            min={0}
                            max={1}
                            onChange={(v) => set('glitch', v)}
                            help="Vertex shader: horizontal slices jump sideways. On Igloo it rises with hover and scroll speed."
                        />
                    </Group>
                </>
            }
        >
            <div ref={host} className="h-[460px] sm:h-[560px]" />
        </Demo>
    );
}

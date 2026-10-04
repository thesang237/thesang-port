'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';

import { loadTex } from '../kit/assets';
import { Demo, Group, Segmented, Slider, StageNote, Toggle } from '../kit/controls';
import { createLinearOutput, disposeObject, fullscreenPass } from '../kit/gl';
import { prefersReducedMotion, useParams, useThreeCanvas } from '../kit/loop';

/**
 * Teaching copy of StalkWorld's depth of field: the field (rows of billboard plants from bg_corn) is
 * rendered at half resolution with a depth texture; three rotated 8-tap disk blurs grow their radius
 * with the distance from the focus depth; then a foreground plant is drawn on top, sharp.
 */
const DEFAULTS = { focus: 0.02, radius: 60, minBlur: 10, passes: 3, front: true, view: 'final' as 'final' | 'depth' };
// StalkWorld's billboard rows (the nearest twelve): wide in front, narrowing toward the sky
const FAR_ROWS = [15, 15, 13, 13, 9, 9, 5, 5, 3, 3, 3, 3];

const DEPTH = /* glsl */ `
#include <packing>
uniform sampler2D tDepth;
uniform float cameraNear, cameraFar;
float readDepth(vec2 coord) {
    float z = texture2D(tDepth, coord).x;
    return viewZToOrthographicDepth(perspectiveDepthToViewZ(z, cameraNear, cameraFar), cameraNear, cameraFar);
}`;
const blurFrag = (salt: string, k: string) => /* glsl */ `
${DEPTH}
uniform sampler2D tDiffuse;
uniform float radius, minBlur, focusPoint, iTime, uOn;
uniform vec2 iResolution;
varying vec2 vUv;
float hash12n(vec2 p) { p = fract(p * vec2(5.3987, 5.4421)); p += dot(p.yx, p.xy + vec2(21.5351, 14.3137)); return fract(p.x * p.y * 95.4307); }
void main() {
    if (uOn < 0.5) { gl_FragColor = texture2D(tDiffuse, vUv); return; }
    float depth = abs(focusPoint - readDepth(vUv));
    float r = (minBlur + radius * depth) * ${k};
    float da = 6.283 / 8.0;
    float a = da * hash12n(vUv + fract(iTime) + ${salt});
    vec3 sum = vec3(0.0);
    for (int i = 0; i < 8; i++) {
        vec2 p = clamp(vUv + vec2(cos(a), sin(a)) / iResolution * r, 0.0, 1.0);
        vec3 s = texture2D(tDiffuse, p).rgb;
        sum += s * s;
        a += da;
    }
    gl_FragColor = vec4(sqrt(max(sum / 8.0, 0.0)), 1.0);
}`;
const showFrag = /* glsl */ `
${DEPTH}
uniform sampler2D tDiffuse;
uniform float uDepthView, focusPoint;
varying vec2 vUv;
void main() {
    if (uDepthView > 0.5) {
        float d = readDepth(vUv);
        float near = 1.0 - smoothstep(0.0, 0.003, abs(d - focusPoint));
        gl_FragColor = vec4(mix(vec3(pow(clamp(d * 6.0, 0.0, 1.0), 0.8)), vec3(1.0, 0.48, 0.35), near * 0.9), 1.0);
        return;
    }
    gl_FragColor = texture2D(tDiffuse, vUv);
}`;

const farVert = /* glsl */ `
attribute float aId;
varying vec2 vUv;
void main() {
    float inImg = mod(aId, 8.0);
    float inRow = floor(inImg / 4.0);
    vUv = vec2(0.25 * (inImg - inRow * 4.0) + uv.x * 0.25, inRow * 0.5 + (1.0 - uv.y) * 0.5); // cells upright
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}`;
const farFrag = /* glsl */ `
uniform sampler2D map;
uniform float uBright;
varying vec2 vUv;
void main() {
    vec4 col = texture2D(map, vUv);
    if (col.a < 0.1) discard;
    gl_FragColor = vec4(col.rgb * uBright, 1.0);
}`;

export default function DofLab() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState('Loading the plants…');

    useThreeCanvas(
        host,
        ({ renderer, size, pointer }) => {
            const out = createLinearOutput({ samples: 0, vignette: true });
            const cam = new THREE.PerspectiveCamera(42, 1, 1, 10000);
            const scene = new THREE.Scene();
            const fg = new THREE.Scene();
            // sky + ground
            const sky = new THREE.Mesh(new THREE.PlaneGeometry(6000, 2400), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.05, 0.075, 0.05), depthWrite: false }));
            sky.position.set(0, 600, -1500);
            scene.add(sky);
            const ground = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.035, 0.03, 0.02) }));
            ground.rotation.x = -Math.PI / 2;
            ground.position.y = -30;
            scene.add(ground);
            const farMat = new THREE.ShaderMaterial({
                uniforms: { map: { value: null as THREE.Texture | null }, uBright: { value: 0.32 } },
                vertexShader: farVert,
                fragmentShader: farFrag,
                side: THREE.DoubleSide,
            });
            const total = FAR_ROWS.reduce((s, v) => s + v, 0);
            const farGeo = new THREE.PlaneGeometry(180, 360);
            farGeo.translate(0, 180, 0);
            farGeo.setAttribute(
                'aId',
                new THREE.InstancedBufferAttribute(
                    new Float32Array(total).map((_, i) => i),
                    1,
                ),
            );
            const far = new THREE.InstancedMesh(farGeo, farMat, total);
            far.frustumCulled = false;
            far.visible = false;
            const dummy = new THREE.Object3D();
            let k = 0;
            FAR_ROWS.forEach((cnt, r) => {
                for (let l = 0; l < cnt; l++) {
                    dummy.position.set(50 * l - 0.5 * (cnt - 1) * 50 + (r % 2) * 18, -30, -100 - r * 50);
                    dummy.rotation.set(0, (l * 1.7 + r) % 0.6, 0);
                    dummy.updateMatrix();
                    far.setMatrixAt(k++, dummy.matrix);
                }
            });
            scene.add(far);
            // the sharp front plant
            const frontMat = farMat.clone();
            frontMat.uniforms.uBright.value = 0.55;
            const front = new THREE.InstancedMesh(farGeo, frontMat, 1);
            dummy.position.set(-60, -30, 400); // 200 units from the camera: depth 0.02, the default focus
            dummy.rotation.set(0, 0.25, 0);
            dummy.scale.setScalar(0.9);
            dummy.updateMatrix();
            front.setMatrixAt(0, dummy.matrix);
            front.frustumCulled = false;
            front.visible = false;
            fg.add(front);

            const depthTex = new THREE.DepthTexture(1, 1);
            depthTex.type = THREE.UnsignedIntType;
            const rtScene = new THREE.WebGLRenderTarget(1, 1, { depthTexture: depthTex, depthBuffer: true, type: THREE.HalfFloatType });
            const rtA = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false, type: THREE.HalfFloatType });
            const rtB = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false, type: THREE.HalfFloatType });
            const depthU = () => ({ tDepth: { value: depthTex }, cameraNear: { value: cam.near }, cameraFar: { value: cam.far } });
            const blurs = [
                ['4.2', '2.0'],
                ['1.337', '1.41421'],
                ['0.0', '1.0'],
            ].map(([salt, kk]) =>
                fullscreenPass(blurFrag(salt, kk), {
                    ...depthU(),
                    tDiffuse: { value: null },
                    radius: { value: 60 },
                    minBlur: { value: 10 },
                    focusPoint: { value: 0.02 },
                    iTime: { value: 0 },
                    uOn: { value: 1 },
                    iResolution: { value: new THREE.Vector2(1920, 994) },
                }),
            );
            const show = fullscreenPass(showFrag, { ...depthU(), tDiffuse: { value: null }, uDepthView: { value: 0 }, focusPoint: { value: 0.02 } });
            const post = new THREE.Camera();
            const texs: THREE.Texture[] = [];
            let alive = true;
            loadTex('bg_corn')
                .then((t) => {
                    texs.push(t);
                    if (!alive) return;
                    farMat.uniforms.map.value = t;
                    frontMat.uniforms.map.value = t;
                    far.visible = true;
                    front.visible = true;
                    setStatus('');
                })
                .catch(() => setStatus('Could not load the plants'));
            let camX = 0;
            let t = 0;
            return {
                resize(w, h) {
                    out.setSize(w, h, size.dpr);
                    const W = Math.max(1, Math.round(w * size.dpr * 0.5));
                    const H = Math.max(1, Math.round(h * size.dpr * 0.5));
                    [rtScene, rtA, rtB].forEach((r) => r.setSize(W, H));
                    blurs.forEach((b) => b.uniforms.iResolution.value.set(w, h));
                    cam.aspect = w / h;
                    cam.updateProjectionMatrix();
                },
                frame(time, dt) {
                    t += dt;
                    const prm = ref.current;
                    const px = pointer.over ? pointer.x : prefersReducedMotion() ? 0 : Math.sin(t * 0.3) * 0.6;
                    camX += (px * 60 - camX) * (1 - Math.exp(-1.2 * dt));
                    cam.position.set(camX, 170, 600);
                    cam.rotation.set(-0.12, 0.002 * camX, 0);
                    renderer.autoClear = false;
                    renderer.setRenderTarget(rtScene);
                    renderer.setClearColor(0x000000, 1);
                    renderer.clear();
                    renderer.render(scene, cam);
                    let src = rtScene;
                    let dst = rtA;
                    blurs.forEach((b, i) => {
                        b.uniforms.tDiffuse.value = src.texture;
                        b.uniforms.focusPoint.value = prm.focus;
                        b.uniforms.radius.value = prm.radius;
                        b.uniforms.minBlur.value = prm.minBlur;
                        b.uniforms.iTime.value = time * 1000;
                        b.uniforms.uOn.value = i < prm.passes ? 1 : 0;
                        renderer.setRenderTarget(dst);
                        renderer.render(b.scene, post);
                        src = dst;
                        dst = dst === rtA ? rtB : rtA;
                    });
                    show.uniforms.tDiffuse.value = src.texture;
                    show.uniforms.uDepthView.value = prm.view === 'depth' ? 1 : 0;
                    show.uniforms.focusPoint.value = prm.focus;
                    out.begin(renderer);
                    renderer.render(show.scene, post);
                    if (prm.front && prm.view === 'final') {
                        renderer.clearDepth();
                        renderer.render(fg, cam);
                    }
                    out.present(renderer);
                },
                dispose() {
                    alive = false;
                    [rtScene, rtA, rtB].forEach((r) => r.dispose());
                    depthTex.dispose();
                    blurs.forEach((b) => b.dispose());
                    show.dispose();
                    disposeObject(scene);
                    frontMat.dispose();
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
            title="Depth of field from the depth buffer"
            hint="Set minimum blur to 0, then slide the focus: the sharp band moves through the rows. “Depth buffer” shows what the blur reads (orange = the focus depth)."
            onReset={reset}
            controls={
                <>
                    <Segmented
                        label="view"
                        options={[
                            { value: 'final', label: 'final' },
                            { value: 'depth', label: 'depth buffer' },
                        ]}
                        value={p.view}
                        onChange={(v) => set('view', v)}
                    />
                    <Group title="Focus">
                        <Slider
                            label="focus depth"
                            value={p.focus}
                            min={0}
                            max={0.12}
                            step={0.001}
                            onChange={(v) => set('focus', v)}
                            help="Where the band is sharp, as a share of the camera’s range (the page: 0.02)."
                        />
                        <Slider label="blur per unit of depth" value={p.radius} min={0} max={400} step={1} onChange={(v) => set('radius', v)} help="How fast blur grows away from the focus (60)." />
                        <Slider
                            label="minimum blur"
                            value={p.minBlur}
                            min={0}
                            max={30}
                            step={0.5}
                            onChange={(v) => set('minBlur', v)}
                            format={(v) => `${v} px`}
                            help="Even the focus is a little soft (10; the tests mode lowers it)."
                        />
                    </Group>
                    <Group title="Passes">
                        <Slider
                            label="blur passes"
                            value={p.passes}
                            min={0}
                            max={3}
                            step={1}
                            onChange={(v) => set('passes', v)}
                            help="Three rotated 8-tap disks (radius × 2, × 1.41, × 1): 24 taps that read as a smooth blur."
                        />
                        <Toggle label="sharp plant on top" checked={p.front} onChange={(v) => set('front', v)} help="The front stalk is drawn after the blur, so it is never blurred." />
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

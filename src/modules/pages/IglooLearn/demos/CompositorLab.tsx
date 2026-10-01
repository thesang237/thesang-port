'use client';

import { useRef } from 'react';
import * as THREE from 'three';

import { Demo, Group, Slider, Toggle } from '../kit/controls';
import { HASH, QUAD_VERT, SNOISE, UV_VERT } from '../kit/glsl';
import { disposeTree, useParams, useThreeCanvas } from '../kit/loop';
import { damp } from '../kit/math';

import { buildCrystalGeometry, createCrystalMaterial, createSnow } from './crystal';
import { buildBricks, createBrickMesh, FOG } from './iglooScene';

// Canvas/Compositor.tsx, with every effect behind its own uniform.
const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tA;
uniform sampler2D tB;
uniform float uT;
uniform float uTime;
uniform float uVel;
uniform float uDetail;
uniform vec2 uMouse;
uniform vec2 uRes;
uniform vec3 uFog;
uniform float uSplit;
uniform float uDissolve;
uniform float uNoiseScale;
uniform float uEdge;
uniform float uWarp;
uniform float uGlitch;
uniform float uCA;
uniform float uStreak;
uniform float uWhiteout;
uniform float uBloom;
uniform float uVignette;
uniform float uGrain;
varying vec2 vUv;
${HASH}
${SNOISE}

vec3 sampleCA(sampler2D t, vec2 uv, vec2 dir, float amt) {
    return vec3(texture2D(t, uv + dir * amt).r, texture2D(t, uv).g, texture2D(t, uv - dir * amt).b);
}
// cheap bloom: the targets are mip-mapped, so higher levels are free blurs of the bright parts
vec3 bloom(sampler2D t, vec2 uv) {
    vec3 b = vec3(0.0);
    b += max(textureLod(t, uv, 2.0).rgb - 1.05, 0.0) * 0.5;
    b += max(textureLod(t, uv, 3.5).rgb - 1.0, 0.0) * 0.8;
    b += max(textureLod(t, uv, 5.0).rgb - 0.95, 0.0) * 1.1;
    return b * uBloom;
}
vec3 rainbow(float x) { return 0.5 + 0.5 * cos(6.28318 * (x + vec3(0.0, 0.33, 0.67))); }

void main() {
    vec2 uv = vUv;
    // raw view: the two worlds side by side, before compositing
    if (uSplit > 0.5) {
        vec3 raw = uv.x < 0.5 ? texture2D(tA, vec2(uv.x + 0.25, uv.y)).rgb : texture2D(tB, vec2(uv.x - 0.25, uv.y)).rgb;
        raw *= smoothstep(0.0, 0.003, abs(uv.x - 0.5));
        gl_FragColor = vec4(raw, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        return;
    }
    vec2 c = uv - 0.5;
    float aspect = uRes.x / uRes.y;
    float t = uT;
    float mid = sin(t * 3.14159);             // 0 at both ends, 1 mid-transition
    float vel = clamp(abs(uVel), 0.0, 1.0);

    // glitch bands: random rows shift sideways — strongest mid-transition and on fast scroll
    float row = floor(uv.y * 34.0) + floor(uTime * 14.0) * 7.0;
    float band = step(0.72, hash11(row)) * (hash11(row + 11.0) - 0.5);
    uv.x += band * (uGlitch * mid + 0.03 * vel);

    // lens: barrel warp during the transition + mouse parallax
    uv += c * dot(c, c) * (mid * uWarp);
    uv += uMouse * 0.004;

    vec2 dir = normalize(c + 1e-4) * (0.35 + length(c));
    float ca = 0.0005 + mid * uCA + vel * 0.004 + uDetail * 0.004;

    vec3 A = sampleCA(tA, uv, dir, ca) + bloom(tA, uv);
    vec3 col = A;
    if (t > 0.0005) {
        vec3 B = sampleCA(tB, uv, dir, ca) + bloom(tB, uv);
        // fog-front dissolve: B rolls in through drifting noise
        float n = fbm3(vec3(uv * vec2(aspect, 1.0) * uNoiseScale, uTime * 0.12)) * 0.5 + 0.5;
        float m = uDissolve > 0.5 ? smoothstep(n - uEdge, n + uEdge, t * (1.0 + 2.0 * uEdge) - uEdge) : t;
        col = mix(A, B, m);
        // whiteout fog + iridescent streaks
        float streak = smoothstep(0.55, 0.9, snoise(vec3(uv.x * 1.2, uv.y * 14.0, uTime * 0.4))) * mid;
        col += rainbow(uv.x * 1.8 + uv.y * 0.6 + uTime * 0.25) * streak * uStreak;
        col = mix(col, uFog, mid * (0.55 + 0.35 * n) * uWhiteout);
    }
    // detail overlay: deep slate, blurred through the mip chain
    if (uDetail > 0.001) {
        vec3 blurred = textureLod(tA, uv, 4.0).rgb;
        col = mix(col, vec3(0.006, 0.009, 0.015) + blurred * 0.035, uDetail * 0.96);
    }
    // vignette + grain
    float vig = smoothstep(1.1, 0.25, length(c * vec2(aspect * 0.8, 1.0)));
    col *= mix(1.0, mix(0.78, 1.0, vig), uVignette);
    col += (hash21(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5) * uGrain;

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

const DEFAULTS = {
    t: 0.5,
    auto: true,
    split: false,
    dissolve: true,
    noiseScale: 2.2,
    edge: 0.28,
    warp: 0.55,
    glitch: 0.16,
    ca: 0.018,
    streak: 0.35,
    whiteout: 0.55,
    bloom: 1,
    vignette: 1,
    grain: 0.035,
    vel: 0,
    detail: 0,
};

const makeTarget = () =>
    new THREE.WebGLRenderTarget(4, 4, {
        type: THREE.HalfFloatType,
        samples: 4,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
        magFilter: THREE.LinearFilter,
        colorSpace: THREE.LinearSRGBColorSpace,
    });

/** Two worlds → two offscreen images → one full-screen shader. */
export default function CompositorLab() {
    const host = useRef<HTMLDivElement>(null);
    const { p, set, ref, reset } = useParams(DEFAULTS);

    useThreeCanvas(
        host,
        ({ renderer, pointer, size }) => {
            // ── world A: the igloo ──
            const A = new THREE.Scene();
            A.background = new THREE.Color(FOG);
            A.fog = new THREE.FogExp2(FOG, 0.028);
            const camA = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
            const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 48), new THREE.MeshStandardMaterial({ color: '#c9d0da', roughness: 1 }));
            ground.rotation.x = -Math.PI / 2;
            A.add(ground, createBrickMesh(buildBricks()), new THREE.HemisphereLight('#dfe6ef', '#5d6574', 1));
            const sun = new THREE.DirectionalLight('#fbfcff', 1.8);
            sun.position.set(-7, 9, 5);
            A.add(sun);
            const core = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 3.2, 3.6), toneMapped: false }));
            core.position.set(1.2, 0.5, 2.2);
            A.add(core);
            const snowA = createSnow(1200, [26, 14, 26]);
            snowA.position.y = 5;
            A.add(snowA);

            // ── world B: a crystal ──
            const B = new THREE.Scene();
            B.background = new THREE.Color('#bcc3cd');
            const camB = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
            camB.position.set(0, 0, 8);
            const crystal = new THREE.Mesh(buildCrystalGeometry(18, 'rock'), createCrystalMaterial());
            B.add(crystal);
            const dots = new THREE.Mesh(
                new THREE.PlaneGeometry(60, 34),
                new THREE.ShaderMaterial({
                    vertexShader: UV_VERT,
                    fragmentShader: `uniform vec3 uColor; varying vec2 vUv; void main(){ vec2 g = fract(vUv * vec2(60.0, 34.0)) - 0.5; gl_FragColor = vec4(uColor + smoothstep(0.07, 0.0, length(g)) * 0.3, 1.0); }`,
                    uniforms: { uColor: { value: new THREE.Color('#bcc3cd') } },
                }),
            );
            dots.position.z = -14;
            B.add(dots);

            // ── compositor ──
            const rtA = makeTarget();
            const rtB = makeTarget();
            const quadScene = new THREE.Scene();
            const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
            const mat = new THREE.ShaderMaterial({
                vertexShader: QUAD_VERT,
                fragmentShader: FRAG,
                depthTest: false,
                depthWrite: false,
                uniforms: {
                    tA: { value: rtA.texture },
                    tB: { value: rtB.texture },
                    uT: { value: 0 },
                    uTime: { value: 0 },
                    uVel: { value: 0 },
                    uDetail: { value: 0 },
                    uMouse: { value: new THREE.Vector2() },
                    uRes: { value: new THREE.Vector2(1, 1) },
                    uFog: { value: new THREE.Color(FOG) },
                    uSplit: { value: 0 },
                    uDissolve: { value: 1 },
                    uNoiseScale: { value: 2.2 },
                    uEdge: { value: 0.28 },
                    uWarp: { value: 0.55 },
                    uGlitch: { value: 0.16 },
                    uCA: { value: 0.018 },
                    uStreak: { value: 0.35 },
                    uWhiteout: { value: 0.55 },
                    uBloom: { value: 1 },
                    uVignette: { value: 1 },
                    uGrain: { value: 0.035 },
                },
            });
            quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
            const st = { t: 0.5, mx: 0, my: 0, vel: 0 };

            return {
                resize: (w, h) => {
                    const dpr = renderer.getPixelRatio();
                    rtA.setSize(Math.floor(w * dpr), Math.floor(h * dpr));
                    rtB.setSize(Math.floor(w * dpr), Math.floor(h * dpr));
                    camA.aspect = camB.aspect = w / h;
                    camA.updateProjectionMatrix();
                    camB.updateProjectionMatrix();
                },
                frame: (time, dt) => {
                    const P = ref.current;
                    // auto: ping-pong between worlds, holding at each end
                    if (P.auto) {
                        const cyc = (time % 6) / 6;
                        st.t = cyc < 0.15 ? 0 : cyc < 0.5 ? (cyc - 0.15) / 0.35 : cyc < 0.65 ? 1 : 1 - (cyc - 0.65) / 0.35;
                        st.t = st.t * st.t * (3 - 2 * st.t);
                    } else st.t = P.t;
                    st.mx = damp(st.mx, pointer.over ? pointer.x : 0, 3.5, dt);
                    st.my = damp(st.my, pointer.over ? pointer.y : 0, 3.5, dt);
                    st.vel = damp(st.vel, P.vel, 6, dt);

                    camA.position.set(Math.sin(time * 0.1) * 12.6 + st.mx * 0.55, 2.9 + st.my * 0.3, Math.cos(time * 0.1) * 12.6);
                    camA.lookAt(0.25, 1.15, 0);
                    crystal.rotation.set(0.15 + st.my * 0.25, time * 0.2 + st.mx * 0.4, 0);
                    const cu = (crystal.material as THREE.ShaderMaterial).uniforms;
                    cu.uTime.value = time;
                    cu.uGlitch.value = st.vel * 0.6;
                    (snowA.material as THREE.ShaderMaterial).uniforms.uTime.value = time;

                    // render the worlds that are visible into their own images
                    renderer.setRenderTarget(rtA);
                    renderer.render(A, camA);
                    if (st.t > 0.0005 || P.split) {
                        renderer.setRenderTarget(rtB);
                        renderer.render(B, camB);
                    }
                    renderer.setRenderTarget(null);

                    const u = mat.uniforms;
                    u.uT.value = st.t;
                    u.uTime.value = time;
                    u.uVel.value = st.vel;
                    u.uDetail.value = P.detail;
                    u.uMouse.value.set(st.mx, st.my);
                    u.uRes.value.set(size.w, size.h);
                    u.uSplit.value = P.split ? 1 : 0;
                    u.uDissolve.value = P.dissolve ? 1 : 0;
                    u.uNoiseScale.value = P.noiseScale;
                    u.uEdge.value = P.edge;
                    u.uWarp.value = P.warp;
                    u.uGlitch.value = P.glitch;
                    u.uCA.value = P.ca;
                    u.uStreak.value = P.streak;
                    u.uWhiteout.value = P.whiteout;
                    u.uBloom.value = P.bloom;
                    u.uVignette.value = P.vignette;
                    u.uGrain.value = P.grain;
                    renderer.render(quadScene, quadCam);
                },
                dispose: () => {
                    disposeTree(A);
                    disposeTree(B);
                    disposeTree(quadScene);
                    rtA.dispose();
                    rtB.dispose();
                },
            };
        },
        [],
        { antialias: false, maxDpr: 1.5 },
    );

    return (
        <Demo
            title="Compositor lab — blend two worlds, one pass"
            hint="Watch the auto transition, then switch auto off and scrub it yourself. Set any effect to 0 to see what it adds. “Show raw worlds” reveals the two images before compositing."
            onReset={reset}
            controls={
                <>
                    <Group title="Transition">
                        <Toggle label="auto ping-pong" checked={p.auto} onChange={(v) => set('auto', v)} />
                        <Slider
                            label="t (world A → B)"
                            value={p.t}
                            min={0}
                            max={1}
                            step={0.001}
                            onChange={(v) => {
                                set('auto', false);
                                set('t', v);
                            }}
                            help="On Igloo: the fractional part of motion.scene."
                        />
                        <Toggle label="show raw worlds" checked={p.split} onChange={(v) => set('split', v)} help="Left: world A’s image. Right: world B’s. Everything else is the shader." />
                        <Toggle label="noise dissolve" checked={p.dissolve} onChange={(v) => set('dissolve', v)} help="Off = a plain cross-fade. Compare them." />
                        <Slider label="noise scale" value={p.noiseScale} min={0.3} max={10} step={0.1} onChange={(v) => set('noiseScale', v)} />
                        <Slider label="edge softness" value={p.edge} min={0.01} max={0.6} onChange={(v) => set('edge', v)} />
                    </Group>
                    <Group title="Mid-transition only (× sin(t·π))">
                        <Slider label="whiteout fog" value={p.whiteout} min={0} max={1} onChange={(v) => set('whiteout', v)} help="Both worlds sink into fog colour halfway — hides the seam." />
                        <Slider label="barrel warp" value={p.warp} min={0} max={1.5} onChange={(v) => set('warp', v)} />
                        <Slider label="glitch bands" value={p.glitch} min={0} max={0.5} onChange={(v) => set('glitch', v)} />
                        <Slider label="chromatic aberration" value={p.ca} min={0} max={0.06} step={0.001} onChange={(v) => set('ca', v)} />
                        <Slider label="rainbow streaks" value={p.streak} min={0} max={1.5} onChange={(v) => set('streak', v)} />
                    </Group>
                    <Group title="Always on">
                        <Slider label="bloom" value={p.bloom} min={0} max={3} onChange={(v) => set('bloom', v)} help="Only pixels brighter than white glow — see the HDR core by the igloo." />
                        <Slider label="vignette" value={p.vignette} min={0} max={1} onChange={(v) => set('vignette', v)} />
                        <Slider label="grain" value={p.grain} min={0} max={0.15} step={0.001} onChange={(v) => set('grain', v)} />
                        <Slider
                            label="scroll speed (simulated)"
                            value={p.vel}
                            min={0}
                            max={1}
                            onChange={(v) => set('vel', v)}
                            help="Fast scrolling adds glitch + aberration on Igloo — the page reacts to how you scroll."
                        />
                        <Slider label="detail overlay" value={p.detail} min={0} max={1} onChange={(v) => set('detail', v)} help="Clicking a crystal: the frame sinks into dark, blurred slate." />
                    </Group>
                </>
            }
        >
            <div ref={host} className="h-[440px] sm:h-[560px]" />
        </Demo>
    );
}

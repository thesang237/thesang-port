'use client';

import { useRef } from 'react';
import * as THREE from 'three';

import { Btn, Demo, Group, Segmented, Slider, Toggle } from '../kit/controls';
import { fullscreenPass } from '../kit/gl';
import { prefersReducedMotion, useParams, useThreeCanvas } from '../kit/loop';
import { DofController, ENGINE, MOVE_SCALE, particleArea, smooth, tickPoly } from '../kit/source';

/**
 * Teaching copy of engine/Composite.ts. Two "worlds" (a still of the real stop + a live bokeh field in
 * its own camera) each render into their own half-float MSAA target; one shader cuts between them with
 * the slanted wipe or a blend, converts to display colour, grades through the page's LUT; then the
 * menu blur (dual filter, 4 levels), vignette and grain. Defaults are the source's constants.
 */
const W = ENGINE.wipe;
const PAIRS = {
    wipe1: { a: 0, b: 1, mode: 'wipe', label: 'hero → DNA', colors: ['#103f42', '#ed863b'] },
    blend: { a: 1, b: 2, mode: 'blend', label: 'DNA → network', colors: ['#06fcb2', '#7ddbbf'] },
    wipe2: { a: 4, b: 5, mode: 'wipe', label: 'stalk → plots', colors: ['#c9b45a', '#8fbf5a'] },
    wipe3: { a: 5, b: 6, mode: 'wipe', label: 'plots → kernel', colors: ['#8fbf5a', '#12eefc'] },
} as const;
type PairId = keyof typeof PAIRS;

const DEFAULTS = {
    pair: 'wipe1' as PairId,
    f: 0.45,
    slope: W.slope as number,
    push: W.pushOld as number,
    lift: W.liftNew as number,
    grade: true,
    blur: 0,
    grain: W.grain as number,
    vignette: true,
    moveScale: MOVE_SCALE as number,
    showTargets: true,
};

/** A world: the stop's still, cover-fitted, slowly drifting (so you can see it move with push / lift). */
function stillMaterial(tex: THREE.Texture) {
    return new THREE.ShaderMaterial({
        uniforms: { tImg: { value: tex }, uAspect: { value: 1 }, uTime: { value: 0 } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 1.0, 1.0); }`,
        fragmentShader: /* glsl */ `
            uniform sampler2D tImg; uniform float uAspect, uTime; varying vec2 vUv;
            void main() {
                float img = 1920.0 / 994.0;
                vec2 uv = vUv - 0.5;
                if (uAspect > img) uv.y *= img / uAspect; else uv.x *= uAspect / img;
                uv = uv * (0.96 + 0.02 * sin(uTime * 0.2)) + 0.5;
                gl_FragColor = vec4(texture2D(tImg, uv).rgb, 1.0);
            }`,
        depthTest: false,
        depthWrite: false,
    });
}

const composeFrag = /* glsl */ `
uniform sampler2D tA, tB, tLut;
uniform float uMode, uP, uSlope, uFade, uPush, uLift, uGrade;
varying vec2 vUv;
vec3 toSrgb(vec3 c) {
    c = max(c, 0.0);
    return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
vec3 grade(vec3 c) {
    float b = clamp(c.b, 0.0, 1.0) * 63.0;
    float b0 = floor(b);
    float b1 = min(b0 + 1.0, 63.0);
    vec2 rg = (clamp(c.rg, 0.0, 1.0) * 63.0 + 0.5) / 512.0;
    vec2 t0 = vec2(mod(b0, 8.0), floor(b0 / 8.0)) * 64.0 / 512.0;
    vec2 t1 = vec2(mod(b1, 8.0), floor(b1 / 8.0)) * 64.0 / 512.0;
    return mix(texture2D(tLut, t0 + rg).rgb, texture2D(tLut, t1 + rg).rgb, b - b0);
}
void main() {
    vec3 col;
    if (uMode < 0.5) {
        col = texture2D(tA, vUv).rgb;
    } else if (uMode < 1.5) {
        float hs = abs(uSlope) * 0.5;
        float edge = mix(-hs - 0.02, 1.0 + hs + 0.02, uP) + uSlope * (vUv.x - 0.5);
        vec2 ua = vUv - vec2(0.0, uPush * uP);
        vec2 ub = vUv + vec2(0.0, uLift * (1.0 - uP));
        col = vUv.y < edge ? texture2D(tB, ub).rgb : texture2D(tA, ua).rgb;
    } else {
        col = mix(texture2D(tA, vUv).rgb, texture2D(tB, vUv).rgb, uP);
    }
    col = toSrgb(col);
    if (uGrade > 0.5) col = grade(col);
    gl_FragColor = vec4(col * uFade, 1.0);
}`;

const downFrag = /* glsl */ `
uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
void main() {
    vec2 o = uTexel * 0.5;
    vec4 s = texture2D(tSrc, vUv) * 4.0;
    s += texture2D(tSrc, vUv - o); s += texture2D(tSrc, vUv + o);
    s += texture2D(tSrc, vUv + vec2(o.x, -o.y)); s += texture2D(tSrc, vUv - vec2(o.x, -o.y));
    gl_FragColor = s / 8.0;
}`;

const upFrag = /* glsl */ `
uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
void main() {
    vec2 o = uTexel * 0.5;
    vec4 s = texture2D(tSrc, vUv + vec2(-o.x * 2.0, 0.0));
    s += texture2D(tSrc, vUv + vec2(-o.x, o.y)) * 2.0;
    s += texture2D(tSrc, vUv + vec2(0.0, o.y * 2.0));
    s += texture2D(tSrc, vUv + vec2(o.x, o.y)) * 2.0;
    s += texture2D(tSrc, vUv + vec2(o.x * 2.0, 0.0));
    s += texture2D(tSrc, vUv + vec2(o.x, -o.y)) * 2.0;
    s += texture2D(tSrc, vUv + vec2(0.0, -o.y * 2.0));
    s += texture2D(tSrc, vUv + vec2(-o.x, -o.y)) * 2.0;
    gl_FragColor = s / 12.0;
}`;

const finalFrag = /* glsl */ `
uniform sampler2D tSharp, tBlur, tNoise, tA, tB;
uniform float uBlur, uGrain, uVignette, uThumbs;
uniform vec2 uNoiseScale, uNoiseOffset, uAspect;
varying vec2 vUv;
vec3 toSrgb(vec3 c) { c = max(c, 0.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
void main() {
    vec3 col = texture2D(tSharp, vUv).rgb;
    if (uBlur > 0.001) col = mix(col, texture2D(tBlur, vUv).rgb * 0.8, uBlur);
    float v = smoothstep(1.25, 0.35, length((vUv - 0.5) * vec2(1.2, 1.0)));
    col *= mix(1.0, mix(0.78, 1.0, v), uVignette);
    col += (texture2D(tNoise, vUv * uNoiseScale + uNoiseOffset).r - 0.5) * uGrain;
    // the two world targets as thumbnails (what the composite reads)
    if (uThumbs > 0.5) {
        vec2 size = vec2(0.2, 0.2 * uAspect.x / uAspect.y);
        vec2 pa = (vUv - vec2(0.02, 0.04)) / size;
        vec2 pb = (vUv - vec2(0.24, 0.04)) / size;
        if (all(greaterThan(pa, vec2(0.0))) && all(lessThan(pa, vec2(1.0)))) col = toSrgb(texture2D(tA, pa).rgb);
        if (all(greaterThan(pb, vec2(0.0))) && all(lessThan(pb, vec2(1.0)))) col = toSrgb(texture2D(tB, pb).rgb);
        vec2 ea = abs(pa - 0.5), eb = abs(pb - 0.5);
        if ((max(ea.x, ea.y) > 0.49 && max(ea.x, ea.y) < 0.505) || (max(eb.x, eb.y) > 0.49 && max(eb.x, eb.y) < 0.505)) col = vec3(0.33, 1.0, 0.76);
    }
    gl_FragColor = vec4(col, 1.0);
}`;

export default function Compositor() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const playRef = useRef({ on: false, t: 0 });

    useThreeCanvas(
        host,
        ({ renderer, size }) => {
            renderer.autoClear = false;
            const rt = (samples = 0) =>
                new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples, depthBuffer: samples > 0, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
            const tA = rt(2);
            const tB = rt(2);
            const sharp = rt();
            const chain = [rt(), rt(), rt(), rt()];
            const loader = new THREE.TextureLoader();
            const stills = Array.from({ length: 9 }, () => null as THREE.Texture | null);
            const lut = loader.load('/corn/tex/map-grade.png', (t) => {
                t.flipY = false;
                t.needsUpdate = true;
            });
            lut.flipY = false;
            lut.minFilter = lut.magFilter = THREE.LinearFilter;
            lut.generateMipmaps = false;
            const noise = loader.load('/corn/tex/post-noise.png');
            noise.wrapS = noise.wrapT = THREE.RepeatWrapping;

            // two worlds: still + bokeh, each with its own fx camera
            const makeWorld = () => {
                const scene = new THREE.Scene();
                const mat = stillMaterial(new THREE.Texture());
                const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
                quad.frustumCulled = false;
                scene.add(quad);
                const fx = new THREE.Scene();
                const cam = new THREE.PerspectiveCamera(45, 1, 1, 700);
                cam.position.set(0, 0, 10);
                const dof = new DofController({ width: 5, height: 12, farMin: 25, farMax: 40 });
                return { scene, mat, fx, cam, dof, area: null as THREE.Points | null, color: '' };
            };
            const worlds = [makeWorld(), makeWorld()];
            const flat = new THREE.Camera();
            const still = (i: number) => {
                if (!stills[i]) {
                    stills[i] = loader.load(`/corn-learn/stops/stop${i}.webp`);
                    stills[i]!.colorSpace = THREE.SRGBColorSpace;
                }
                return stills[i]!;
            };
            const setWorld = (w: (typeof worlds)[number], img: number, color: string, seed: number) => {
                w.mat.uniforms.tImg.value = still(img);
                if (w.color === color) return;
                if (w.area) {
                    w.fx.remove(w.area);
                    w.area.geometry.dispose();
                    (w.area.material as THREE.Material).dispose();
                }
                w.area = particleArea({ pX: 1.5, pY: -2.5, rY: -30, color, o: 1, particleSizeMin: 8, particleSizeMax: 90, radius: 3 }, w.dof, 260, seed);
                w.fx.add(w.area);
                w.color = color;
            };

            const compose = fullscreenPass(composeFrag, {
                tA: { value: tA.texture },
                tB: { value: tB.texture },
                tLut: { value: lut },
                uMode: { value: 1 },
                uP: { value: 0 },
                uSlope: { value: 0 },
                uFade: { value: 1 },
                uPush: { value: W.pushOld },
                uLift: { value: W.liftNew },
                uGrade: { value: 1 },
            });
            const down = fullscreenPass(downFrag, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
            const up = fullscreenPass(upFrag, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
            const final = fullscreenPass(finalFrag, {
                tSharp: { value: sharp.texture },
                tBlur: { value: chain[0].texture },
                tNoise: { value: noise },
                tA: { value: tA.texture },
                tB: { value: tB.texture },
                uBlur: { value: 0 },
                uGrain: { value: W.grain },
                uVignette: { value: 1 },
                uThumbs: { value: 1 },
                uNoiseScale: { value: new THREE.Vector2(1, 1) },
                uNoiseOffset: { value: new THREE.Vector2() },
                uAspect: { value: new THREE.Vector2(1, 1) },
            });
            const cam = new THREE.Camera();
            let lastScale = -1;
            let lastW = 0;
            let lastH = 0;
            const sizeTargets = (scale: number) => {
                const Wpx = Math.round(size.w * size.dpr);
                const Hpx = Math.round(size.h * size.dpr);
                if (scale === lastScale && Wpx === lastW && Hpx === lastH) return;
                lastScale = scale;
                lastW = Wpx;
                lastH = Hpx;
                [tA, tB].forEach((t) => t.setSize(Math.max(1, Math.round(Wpx * scale)), Math.max(1, Math.round(Hpx * scale))));
            };
            let time = 0;
            const ptr = new THREE.Vector2();

            return {
                resize(w, h) {
                    const Wpx = Math.round(w * size.dpr);
                    const Hpx = Math.round(h * size.dpr);
                    sharp.setSize(Wpx, Hpx);
                    chain.forEach((c, i) => c.setSize(Math.max(1, Wpx >> (i + 1)), Math.max(1, Hpx >> (i + 1))));
                    worlds.forEach((wd) => {
                        wd.cam.aspect = w / h;
                        wd.cam.updateProjectionMatrix();
                        wd.mat.uniforms.uAspect.value = w / h;
                    });
                    compose.uniforms.uSlope.value = 0; // set per frame from the dial
                    final.uniforms.uNoiseScale.value.set(Wpx / 512, Hpx / 512);
                    final.uniforms.uAspect.value.set(w, h);
                    lastScale = -1;
                },
                frame(_t, dt) {
                    time += dt;
                    const prm = ref.current;
                    const pair = PAIRS[prm.pair];
                    // play: the move fraction runs 0 → 1 on the landing spring's pace (≈ 1.6 s)
                    const pl = playRef.current;
                    let f = prm.f;
                    if (pl.on) {
                        pl.t += dt / 1.6;
                        f = Math.min(1, pl.t);
                        if (pl.t >= 1.6) pl.on = false;
                    }
                    const mode = pair.mode === 'wipe' ? 1 : 2;
                    const pr = mode === 1 ? smooth(W.window[0], W.window[1], f) : smooth(0, 1, f);
                    const moving = pr > 1e-4 && pr < 1 - 1e-4;
                    sizeTargets(moving ? prm.moveScale : 1);
                    setWorld(worlds[0], pair.a, pair.colors[0], 3);
                    setWorld(worlds[1], pair.b, pair.colors[1], 7);
                    ptr.set(Math.sin(time * 0.3) * 0.5, Math.cos(time * 0.23) * 0.3);
                    worlds.forEach((wd, k) => {
                        wd.mat.uniforms.uTime.value = time + k * 3;
                        wd.cam.position.x = ptr.x * 0.75;
                        wd.cam.position.y = ptr.y * 0.75;
                        wd.dof.update(ptr, true, dt);
                        tickPoly(wd.fx, time * 0.6, size.h, size.dpr);
                        if (wd.area) wd.area.rotation.y -= 0.05 * dt;
                        renderer.setRenderTarget(k ? tB : tA);
                        renderer.setClearColor(0x000000, 1);
                        renderer.clear();
                        renderer.render(wd.scene, flat);
                        renderer.clearDepth();
                        renderer.render(wd.fx, wd.cam);
                    });

                    const c = compose.uniforms;
                    c.uMode.value = pr <= 1e-4 ? 0 : mode;
                    c.uP.value = pr;
                    c.uSlope.value = prm.slope * (size.w / size.h);
                    c.uPush.value = prm.push;
                    c.uLift.value = prm.lift;
                    c.uGrade.value = prm.grade ? 1 : 0;
                    renderer.setRenderTarget(sharp);
                    renderer.render(compose.scene, cam);
                    if (prm.blur > 0.001) {
                        let src = sharp;
                        for (const r of chain) {
                            down.uniforms.tSrc.value = src.texture;
                            down.uniforms.uTexel.value.set(1 / src.width, 1 / src.height);
                            renderer.setRenderTarget(r);
                            renderer.render(down.scene, cam);
                            src = r;
                        }
                        for (let i = chain.length - 2; i >= 0; i--) {
                            up.uniforms.tSrc.value = src.texture;
                            up.uniforms.uTexel.value.set(1 / src.width, 1 / src.height);
                            renderer.setRenderTarget(chain[i]);
                            renderer.render(up.scene, cam);
                            src = chain[i];
                        }
                    }
                    const fu = final.uniforms;
                    fu.uBlur.value = prm.blur;
                    fu.uGrain.value = prm.grain;
                    fu.uVignette.value = prm.vignette ? 1 : 0;
                    fu.uThumbs.value = prm.showTargets ? 1 : 0;
                    fu.uNoiseOffset.value.set(Math.random(), Math.random());
                    renderer.setRenderTarget(null);
                    renderer.render(final.scene, cam);
                },
                dispose() {
                    [tA, tB, sharp, ...chain].forEach((t) => t.dispose());
                    [compose, down, up, final].forEach((x) => x.dispose());
                    worlds.forEach((wd) => {
                        wd.mat.dispose();
                        (wd.scene.children[0] as THREE.Mesh).geometry.dispose();
                        if (wd.area) {
                            wd.area.geometry.dispose();
                            (wd.area.material as THREE.Material).dispose();
                        }
                    });
                    stills.forEach((t) => t?.dispose());
                    lut.dispose();
                    noise.dispose();
                },
            };
        },
        [],
        { antialias: false, maxDpr: ENGINE.maxDpr },
    );

    const play = () => {
        playRef.current = { on: true, t: 0 };
    };

    return (
        <Demo
            title="Compositor: two worlds, one shader"
            stacked
            hint={
                <>
                    Drag “move fraction” or press play. The small frames bottom-left are the two off-screen pictures the shader reads.
                    {prefersReducedMotion() ? ' Play only runs when you press it.' : ''}
                </>
            }
            onReset={reset}
            controls={
                <>
                    <Segmented
                        label="pair of stops"
                        options={(Object.keys(PAIRS) as PairId[]).map((k) => ({ value: k, label: `${PAIRS[k].label} (${PAIRS[k].mode})` }))}
                        value={p.pair}
                        onChange={(v) => set('pair', v)}
                    />
                    <Slider
                        label="move fraction f"
                        value={p.f}
                        min={0}
                        max={1}
                        step={0.005}
                        onChange={(v) => set('f', v)}
                        help="How far the scroll is through the move. Wipes map it through smooth(0.12, 0.88)."
                    />
                    <Btn primary onClick={play}>
                        Play the move
                    </Btn>
                    <Group title="Wipe">
                        <Slider
                            label="edge slope"
                            value={p.slope}
                            min={-0.6}
                            max={0.6}
                            step={0.002}
                            onChange={(v) => set('slope', v)}
                            help="Rise per px across the screen: 0.248 ≈ 14°, measured on the reference."
                        />
                        <Slider
                            label="push old up"
                            value={p.push}
                            min={0}
                            max={0.6}
                            step={0.01}
                            onChange={(v) => set('push', v)}
                            format={(v) => `${Math.round(v * 100)} %`}
                            help="The outgoing world slides up as it’s covered (22 %)."
                        />
                        <Slider
                            label="lift new"
                            value={p.lift}
                            min={0}
                            max={0.8}
                            step={0.01}
                            onChange={(v) => set('lift', v)}
                            format={(v) => `${Math.round(v * 100)} %`}
                            help="The incoming world starts this much lower and rises (30 %)."
                        />
                    </Group>
                    <Group title="After the cut">
                        <Toggle label="colour grade (LUT)" checked={p.grade} onChange={(v) => set('grade', v)} help="The page’s map-grade.png: a gentle contrast curve." />
                        <Slider
                            label="menu blur"
                            value={p.blur}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(v) => set('blur', v)}
                            help="Dual-filter blur, 4 levels down and up. Only runs while the menu is open."
                        />
                        <Slider label="grain" value={p.grain} min={0} max={0.3} step={0.005} onChange={(v) => set('grain', v)} help="Film grain added last (0.07)." />
                        <Toggle label="vignette" checked={p.vignette} onChange={(v) => set('vignette', v)} />
                    </Group>
                    <Group title="Cost">
                        <Slider
                            label="resolution while moving"
                            value={p.moveScale}
                            min={0.25}
                            max={1}
                            step={0.01}
                            onChange={(v) => set('moveScale', v)}
                            format={(v) => `${Math.round(v * 100)} %`}
                            help="Both worlds render smaller during a transition (72 %). Parked frames are full size."
                        />
                        <Toggle label="show the two targets" checked={p.showTargets} onChange={(v) => set('showTargets', v)} />
                    </Group>
                </>
            }
        >
            <div ref={host} className="aspect-[16/10] w-full sm:aspect-[1920/994]" />
        </Demo>
    );
}

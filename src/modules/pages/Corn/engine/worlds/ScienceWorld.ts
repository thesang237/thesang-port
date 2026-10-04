import * as THREE from 'three';

import type { Assets } from '../assets';
import { beadsOnCurve, dna, helixSpline, wanderPoints } from '../fx/helix';
import { Network } from '../fx/network';
import { accentBackdropMaterial, type AreaPreset, particleArea, raw, rng, setFade } from '../fx/particles';

import { kernelMaterial } from './KernelWorld';
import { bakedGeometry } from './shared';
import { clamp01, damp, type FrameCtx, smooth, TILT, World } from './World';

/**
 * Science: three stops in one world, driven by `local` (0 → 2), rebuilt from the reference bundle.
 *   0  the helix: 40 strands that cross between two backbones, drawn as hairlines + pentagon beads
 *      that draw on as the stop arrives; green bead streams and trails, nine bokeh fields
 *   1  the funnel network: candidates on narrowing spirals, linked by bead strings, breathing
 *   2  the pot: the seedling's root and shoot grow bone by bone with the scroll; the leaves spring
 *      when the pointer brushes past; kernels drift around it
 * Library mode ("Browse the archive"): the reference camera flies into the field (z 10 → 3), the helix
 * fades, and a single kernel holds the centre of the DOM infographic.
 */

// background cards per stop (reference presets: base + two accent glows)
const BG = [
    { base: '#17120f', a1: '#4e2e10', a2: '#224528', p1: [0.2, 0.8], p2: [0.8, 0.2] },
    { base: '#05190d', a1: '#262808', a2: '#0b3838', p1: [0.2, 0.2], p2: [0.8, 0.8] },
    { base: '#041517', a1: '#0a3a4f', a2: '#0b3b2a', p1: [0.25, 0.75], p2: [0.8, 0.25] },
] as const;

// bokeh fields of the helix stop (reference module 421: area … area9; area4 is never added there)
const HELIX_AREAS: [AreaPreset, number][] = [
    [{ pY: -2.01, s: 1.02, rY: -28.8, rZ: -1, color: '#06fcb2', o: 2, particleSizeMin: 12, particleSizeMax: 20, radius: 3 }, 200],
    [{ pX: 3.25, pY: -3.29, pZ: -1.5, rY: -13.5, rZ: -1, color: '#41be91', o: 0.3, particleSizeMin: 3, particleSizeMax: 120, radius: 3 }, 200],
    [{ pX: -1.18, pY: 2.58, pZ: 1.18, s: 0.42, rY: -148.77, color: '#00ff75', o: 1, particleSizeMin: 13, particleSizeMax: 20, radius: 3.16 }, 100],
    [{ pX: -0.51, pY: -2.86, pZ: 1.18, s: 1.01, rY: -149.75, color: '#e80a5a', o: 1, particleSizeMin: 10, particleSizeMax: 20, radius: 3.03 }, 300],
    [{ pX: -6.86, pZ: -3.72, s: 0.85, rX: -1.02, rY: -128.3, rZ: -0.8, color: '#16ed52', o: 0.5, particleSizeMin: 20, particleSizeMax: 30, radius: 3 }, 300],
    [{ pX: -4.24, pY: 1.75, s: 0.27, rX: -4, rY: -123.66, rZ: -1.71, color: '#15f7a6', o: 2.54, particleSizeMin: 1, particleSizeMax: 50, radius: 2.83 }, 300],
    [{ pX: 4.12, pY: -0.02, s: 0.43, rX: -0.93, rY: -123.6, rZ: -30, color: '#28d879', o: 0.9, particleSizeMin: 2, particleSizeMax: 100, radius: 2.3 }, 150],
    [{ pX: 5.34, pY: 2.68, s: 2.11, rX: 0.2, rY: -118.25, rZ: 0.37, color: '#00ff84', o: 1.47, particleSizeMin: 0.59, particleSizeMax: 70, radius: 0.27 }, 150],
];
const DATA_AREAS: [AreaPreset, number][] = [
    [{ pY: -2.85, s: 1.02, rY: 137.18, rZ: -1, color: '#ad1818', o: 0.75, particleSizeMin: 10, particleSizeMax: 20 }, 200],
    [{ pY: -4.73, pZ: -1.5, rY: 152.42, rZ: -1, color: '#41be91', o: 0.3, particleSizeMin: 3, particleSizeMax: 120 }, 200],
    [{ pY: -6.19, pZ: -1.5, s: 1.24, rY: 155.49, color: '#ffffff', o: 0.14, particleSizeMin: 3, particleSizeMax: 120 }, 200],
];

const DOF_HELIX = { width: 5, height: 12, farMin: 32, farMax: 32 };
const DOF_DATA = { width: 20, height: 15, farMin: 55, farMax: 55 };
/** How far one chapter's dwell (its in-chapter scroll) carries the world's own scroll motion. */
const DWELL = 0.4;

const map = (v: number, a: number, b: number, c: number, d: number, clamp = false) => {
    let t = (v - a) / (b - a);
    if (clamp) t = clamp01(t);
    return c + (d - c) * t;
};
const sineIn = (e: number) => 1 + Math.sin((Math.PI / 2) * e - Math.PI / 2);
const quartInOut = (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2);

/** Pot atlas, unlit with a soft key from the upper left and a blue rim (reference 39 s). */
function potMaterial(map: THREE.Texture) {
    return new THREE.ShaderMaterial({
        uniforms: { tMap: { value: map }, uDim: { value: 1 }, uTime: { value: 0 } },
        vertexShader: /* glsl */ `
            #include <common>
            #include <skinning_pars_vertex>
            varying vec2 vUv;
            varying vec3 vN;
            varying vec3 vV;
            void main() {
                vUv = uv;
                #include <skinbase_vertex>
                #include <begin_vertex>
                #include <beginnormal_vertex>
                #include <skinnormal_vertex>
                #include <skinning_vertex>
                vec4 mv = modelViewMatrix * vec4(transformed, 1.0);
                vN = normalize(normalMatrix * objectNormal);
                vV = normalize(-mv.xyz);
                gl_Position = projectionMatrix * mv;
            }`,
        fragmentShader: /* glsl */ `
            uniform sampler2D tMap;
            uniform float uDim;
            varying vec2 vUv;
            varying vec3 vN;
            varying vec3 vV;
            void main() {
                vec4 c = texture2D(tMap, vUv);
                if (c.a < 0.5) discard; // atlas gaps are transparent (white RGB)
                float key = 0.75 + 0.35 * max(dot(normalize(vN), normalize(vec3(-0.5, 0.6, 0.6))), 0.0);
                float rim = pow(1.0 - max(dot(normalize(vN), vV), 0.0), 3.0);
                vec3 col = c.rgb * key * vec3(0.9, 1.0, 1.25) + vec3(0.05, 0.3, 0.8) * rim * 0.9;
                gl_FragColor = vec4(col * uDim, 1.0);
            }`,
        side: THREE.DoubleSide,
    });
}

type GrowBone = { bone: THREE.Bone; level: number; max: number; scale: number };
type SwayBone = { bone: THREE.Bone; rot: THREE.Euler; speed: number; offset: number };

const PIVOT = new THREE.Vector3(0, 0, 0);

export class ScienceWorld extends World {
    readonly camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
    /** Library mode weight (set by the engine). */
    hotspot = 0;
    private bg: THREE.Mesh;
    private bgMat: THREE.ShaderMaterial;
    private bgCols = BG.map((b) => ({ base: raw(b.base), a1: raw(b.a1), a2: raw(b.a2), p1: new THREE.Vector2(...b.p1), p2: new THREE.Vector2(...b.p2) }));
    private helixWrap = new THREE.Group();
    private dataWrap = new THREE.Group();
    private helix: ReturnType<typeof dna>;
    private threads: THREE.Points[] = [];
    private network: Network;
    private libKernel: THREE.Mesh;
    private libMat: THREE.ShaderMaterial;
    private yaw = 0;
    private pitch = 0;
    private seeds: THREE.InstancedMesh;
    private seedState: { p: THREE.Vector3; v: number; r: THREE.Euler; s: number }[] = [];
    private pot = new THREE.Group();
    private potMats: THREE.ShaderMaterial[] = [];
    private dummy = new THREE.Object3D();
    private grow: GrowBone[] = [];
    private sway: SwayBone[] = [];
    private lastLocal = 0;
    private lastPtrX = 0;
    private brushBox = new THREE.Box3();
    private ray = new THREE.Raycaster();
    private v = new THREE.Vector3();
    private ndc = new THREE.Vector2();
    private ticker = 0;

    constructor(a: Assets) {
        super();
        this.bgMat = accentBackdropMaterial(BG[0].base, BG[0].a1, BG[0].a2, [0.2, 0.8], [0.8, 0.2]);
        this.bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.bgMat);
        this.bg.frustumCulled = false;
        this.bg.renderOrder = -100;
        this.scene.add(this.bg);

        const dof = this.dof;
        // ── stop 0: the helix ─────────────────────────────────────────────
        this.helix = dna({ color: '#ed863b', size: [7, 30], dof, seed: 5 });
        this.helixWrap.add(this.helix.group);
        // three green trails wandering up through the strands (reference thread / thread2 / thread3)
        [
            ['#12f9b4', 0],
            ['#13ff63', 472.324],
            ['#38703d', -7462.123],
        ].forEach(([color, seed], k) => {
            const curve = new THREE.CatmullRomCurve3(wanderPoints(seed as number));
            const p = beadsOnCurve(curve, { count: 300, color: color as string, opacity: 0.7, size: [10, 50], dof, seed: 31 + k });
            p.rotation.y = [222.6, -114.1, -130.22][k];
            this.threads.push(p);
            this.helixWrap.add(p);
        });
        // two bead streams (reference stream / stream2: a flat fast-wobbling spiral, first half only)
        const stream = beadsOnCurve(helixSpline({ height: 4, radius: 2, frequency: 0.1, radius2: 0.3, frequency2: 100, phase: 0.05 + 0.5 * Math.PI, crossAt: [] }, rng(61)), {
            count: 200,
            randomness: 0.3,
            color: '#55ffc2',
            opacity: 0.8,
            size: [15, 27],
            dof,
            window: [0, 0.5],
            seed: 41,
        });
        stream.position.set(-0.23, 5.09, 1.01);
        stream.scale.setScalar(1.34);
        stream.rotation.set(0.02, 0, -0.66);
        const stream2 = beadsOnCurve(helixSpline({ height: 2, radius: 1.5, frequency: 0.1, radius2: 0.3, frequency2: 100, phase: 0.05 + 0.5 * Math.PI, crossAt: [] }, rng(62)), {
            count: 150,
            randomness: 0.5,
            color: '#21d37d',
            opacity: 1,
            size: [28, 35],
            dof,
            window: [0, 0.5],
            seed: 42,
        });
        stream2.position.set(-2.83, 8.82, -8.13);
        stream2.scale.setScalar(4.43);
        stream2.rotation.z = -0.42;
        this.helixWrap.add(stream, stream2);
        HELIX_AREAS.forEach(([p, n], k) => this.helixWrap.add(particleArea(p, dof, n, 100 + k)));
        this.fx.add(this.helixWrap);

        // ── stop 1: the funnel network ───────────────────────────────────
        this.network = new Network({ dof, color1: '#7ddbbf', color2: '#eeff30', linksColor: '#345b46', size: 64 });
        this.network.object.position.z = -1;
        this.dataWrap.add(this.network.object);
        const ds = beadsOnCurve(helixSpline({ height: 4, radius: 2, frequency: 0.1, radius2: 0.3, frequency2: 100, phase: 0.05 + 0.5 * Math.PI, crossAt: [] }, rng(63)), {
            count: 200,
            randomness: 0.3,
            color: '#be4141',
            opacity: 1,
            size: [10, 27],
            dof,
            window: [0, 0.5],
            seed: 51,
        });
        ds.position.set(4.3, 1.08, 2.76);
        ds.scale.setScalar(1.34);
        ds.rotation.set(0.02, 0, -0.66);
        const ds2 = beadsOnCurve(helixSpline({ height: 2, radius: 1.5, frequency: 0.1, radius2: 0.3, frequency2: 100, phase: 0.05 + 0.5 * Math.PI, crossAt: [] }, rng(64)), {
            count: 150,
            randomness: 0.5,
            color: '#be8b42',
            opacity: 1,
            size: [35, 35],
            dof,
            window: [0, 0.5],
            seed: 52,
        });
        ds2.position.set(5.94, 1.13, -7.6);
        ds2.scale.setScalar(3.45);
        ds2.rotation.z = -0.73;
        this.dataWrap.add(ds, ds2);
        DATA_AREAS.forEach(([p, n], k) => this.dataWrap.add(particleArea(p, dof, n, 200 + k)));
        this.fx.add(this.dataWrap);

        // ── library mode: one kernel in the middle of the infographic ────
        this.libMat = kernelMaterial(a);
        this.libKernel = new THREE.Mesh(bakedGeometry(a.models.kernel.scene), this.libMat);
        this.libKernel.visible = false;
        this.fx.add(this.libKernel);

        // ── stop 2: seeds and the pot ────────────────────────────────────
        const seedMat = kernelMaterial(a);
        this.seeds = new THREE.InstancedMesh(bakedGeometry(a.models.kernel.scene), seedMat, 16);
        this.seeds.frustumCulled = false;
        for (let i = 0; i < this.seeds.count; i++) {
            this.seedState.push({
                p: new THREE.Vector3(-0.5 + Math.random() * 5.5, -5 + Math.random() * 11, -2 + Math.random() * 3),
                v: 0.25 + Math.random() * 0.3,
                r: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
                s: 0.075 + Math.random() * 0.05,
            });
        }
        this.scene.add(this.seeds);

        // pot3 is authored Z-up with the opening facing +z, and its plant rig sits ≈74 units away:
        // stand the pot up and move the plant (root tips → near the pot floor) into the soil.
        const potScene = a.models.pot.scene;
        potScene.rotation.x = -Math.PI / 2;
        potScene.scale.setScalar(0.66);
        const plantRig = potScene.getObjectByName('Armature001'); // GLTFLoader drops the '.' from 'Armature.001'
        plantRig?.position.add(new THREE.Vector3(0.97, -9.3, -74.2));
        potScene.traverse((o) => {
            const m = o as THREE.Mesh;
            if (!m.isMesh) return;
            const mat = potMaterial(a.tex.pot);
            this.potMats.push(mat);
            m.material = mat;
            m.frustumCulled = false;
            // the roots show through the cut-away soil (reference 41 s): draw the seedling last, over the pot
            if ((m as THREE.SkinnedMesh).isSkinnedMesh) {
                mat.depthTest = false;
                m.renderOrder = 5;
            }
        });
        // reference: root and shoot scale up bone by bone (level n starts 0.3 later), max 0.9 / 1.4
        const rootBone = potScene.getObjectByName('root') as THREE.Bone | undefined;
        const shootBone = potScene.getObjectByName('plant') as THREE.Bone | undefined;
        const collect = (b: THREE.Object3D, level: number, max: number) => {
            if (!(b as THREE.Bone).isBone) return;
            this.grow.push({ bone: b as THREE.Bone, level, max, scale: 1 });
            b.children.forEach((c) => collect(c, level + 1, 1));
        };
        if (rootBone) collect(rootBone, 0, 0.9);
        if (shootBone) {
            collect(shootBone, 0, 1.4);
            shootBone.traverse((b) => {
                if ((b as THREE.Bone).isBone) this.sway.push({ bone: b as THREE.Bone, rot: b.rotation.clone(), speed: 0, offset: 0 });
            });
        }
        this.pot.add(potScene);
        const bgPot = a.models.bgPot.scene;
        bgPot.traverse((o) => {
            const m = o as THREE.Mesh;
            if (!m.isMesh) return;
            const mat = potMaterial(a.tex.bgPot);
            mat.uniforms.uDim.value = 0.3;
            this.potMats.push(mat);
            m.material = mat;
        });
        // the dark out-of-focus pot behind, left (x 560–780, y 470–690)
        bgPot.position.set(-2.9, -0.9, -5);
        bgPot.scale.setScalar(7);
        this.pot.add(bgPot);
        this.scene.add(this.pot);
        // pointer brush zone: a box around the seedling's leaves
        this.brushBox.set(new THREE.Vector3(-0.6, 0.2, -0.8), new THREE.Vector3(1.6, 3.4, 0.8));
    }

    update(ctx: FrameCtx) {
        const { time, dt, ptr, local, dwell } = ctx;
        // the in-chapter scroll carries every scroll-driven move on (helix rises and turns, the network
        // climbs, the pot rises to its roots); it eases back during the blend to the next stop, where
        // `local` takes over, so the motion never stops while scrolling
        const s = local + DWELL * dwell;
        const h = this.hotspot;
        // focus band per stop (reference: helix 5 × 12, far 32; network 20 × 15, far 55)
        this.dof.o = local < 0.5 ? DOF_HELIX : DOF_DATA;
        // library mode: the reference camera flies into the field (z 10 → 3, Quart in-out)
        this.fxOffset.z = -7 * quartInOut(clamp01(h));
        this.updateFx(ctx);
        this.ticker++;

        // background: brown → green-teal → teal-blue cards
        const l = Math.max(0, Math.min(2, local));
        const i = Math.min(1, Math.floor(l));
        const f = smooth(0, 1, l - i);
        const A = this.bgCols[i];
        const B = this.bgCols[i + 1];
        const u = this.bgMat.uniforms;
        u.baseColor.value.copy(A.base).lerp(B.base, f);
        u.accentColor1.value.copy(A.a1).lerp(B.a1, f);
        u.accentColor2.value.copy(A.a2).lerp(B.a2, f);
        u.accent1Position.value.copy(A.p1).lerp(B.p1, f);
        u.accent2Position.value.copy(A.p2).lerp(B.p2, f);
        u.uScale.value = map(0.3 + 0.35 * s, 0, 0.5, 2, 1, true);
        u.opacity.value = 1 - 0.35 * h;

        // ── helix (reference progress mapping; rest ≈ 0.3) ───────────────
        const p0 = 0.3 + 0.35 * s;
        // each stop sits on its own card in the reference: the next card covers the helix field
        setFade(this.helixWrap, 1 - smooth(0.45, 1.0, s));
        if (this.helixWrap.visible) {
            this.helixWrap.position.y = map(p0, 0, 1, -3, 3);
            const g = this.helix.group;
            g.position.y = map(p0, -0.7, 1.5, -8, 13);
            g.rotation.y = map(p0, 0, 0.5, 0, 0.25 * Math.PI, true) + map(p0, 0, 1, 0, 2 * Math.PI) + time * 0.06 - 20.559;
            const t = sineIn(map(p0, -0.2, 0.29, 0, 1, true));
            this.helix.setProgress(map(t, 0, 1, 1.1, 0, true), 3);
            this.helix.setOpacity(1 - smooth(0, 0.6, h));
            this.threads.forEach((p) => {
                p.position.y = map(p0, -0.7, 1.5, -10, 13);
                p.rotation.y -= 0.06 * dt;
            });
        }

        // ── network (rest ≈ 0.35) ────────────────────────────────────────
        const p1 = 0.35 + 0.35 * (s - 1);
        setFade(this.dataWrap, smooth(0.35, 1.0, s) * (1 - smooth(1.5, 2.1, s) * 0.75));
        if (this.dataWrap.visible) {
            this.dataWrap.position.y = map(p1, 0, 1, -2, 2);
            const n = this.network.object;
            n.position.y = map(p1, -0.7, 1.5, -10, 11);
            const e = Math.min(p1, 1);
            n.rotation.y = map(1 - (1 - e) * (1 - e), 0, 1, 0, Math.PI) + time * 0.06;
            this.network.update(dt * 1000);
        }

        // library mode: the kernel takes the centre of the infographic
        this.libKernel.visible = h > 0.01;
        if (this.libKernel.visible) {
            // centre of the DOM infographic (reference px 1240, 500), 4 units in front of the camera
            this.ndc.set((1240 / 1920) * 2 - 1, -((500 / 994) * 2 - 1));
            this.v.set(this.ndc.x, this.ndc.y, 0.5).unproject(this.fxCamera).sub(this.fxCamera.position).normalize();
            this.libKernel.position.copy(this.fxCamera.position).addScaledVector(this.v, 4);
            const k = smooth(0.3, 1, h);
            this.libKernel.scale.setScalar(0.3 * (0.6 + 0.4 * k));
            this.libKernel.rotation.set(0.15 + ptr.y * 0.2, time * 0.35 + ptr.x * 0.4, 0.1);
            this.libMat.uniforms.uFade.value = k;
        }

        // ── seeds and pot ────────────────────────────────────────────────
        const seedsIn = smooth(1.4, 1.95, s) * (1 - smooth(2.5, 3.1, s));
        this.seeds.visible = seedsIn > 0.01;
        this.seeds.position.y = (s - 2) * 3;
        if (this.seeds.visible) {
            this.seedState.forEach((st, k) => {
                st.p.y -= st.v * dt;
                if (st.p.y < -5.5) st.p.y += 11;
                st.r.x += dt * 0.6;
                st.r.y += dt * 0.4;
                this.dummy.position.copy(st.p);
                this.dummy.rotation.copy(st.r);
                this.dummy.scale.setScalar(st.s * seedsIn);
                this.dummy.updateMatrix();
                this.seeds.setMatrixAt(k, this.dummy.matrix);
            });
            this.seeds.instanceMatrix.needsUpdate = true;
        }

        // the pot rises into place with the scroll (in at 2), turns as it comes, carries on up as we leave
        // measured at 41 s: pot x 765–1275, rim y 420, base y 885 (centre x 1020)
        // arrives during the move to the pot stop, not during the network's own segment (s ≤ 1.4)
        const potIn = smooth(1.42, 2, s);
        this.pot.visible = potIn > 0.001 && s < 3;
        this.pot.position.set(0.45, -0.48 - (1 - potIn) * 5.5 + Math.max(0, s - 2) * 4, 0);
        this.pot.rotation.y = -0.35 + (s - 2) * 0.7;
        this.potMats.forEach((m) => (m.uniforms.uTime.value = time));
        if (this.pot.visible) this.updatePlant(s, ptr);
        this.lastLocal = s;
        this.lastPtrX = ptr.x;

        // camera: pointer orbit + a slow arc across the three stops
        this.yaw = damp(this.yaw, ptr.x * TILT.yaw + (s - 1) * 0.22, 4, dt);
        this.pitch = damp(this.pitch, ptr.y * TILT.pitch - (s - 1) * 0.05, 4, dt);
        this.orbit(PIVOT, 14, this.yaw, this.pitch);
    }

    /** Growth (reference incrementalScaleRoots) and the leaf springs (scroll speed + pointer brush). */
    private updatePlant(s: number, ptr: THREE.Vector2) {
        // pot progress: ≈ 0.83 at the stop; growth runs 0.65 → 0.8
        const pp = s < 2 ? 0.83 + 0.4 * (s - 2) : 0.83 + 0.2 * (s - 2);
        const t = map(pp, 0.65, 0.8, 0, 0.5);
        for (const g of this.grow) {
            const target = Math.max(1e-3, Math.min(g.max, 10 * t - g.level * 0.3));
            g.scale += (target - g.scale) * 0.25;
            g.bone.scale.setScalar(g.scale);
        }
        // brush: is the pointer over the seedling? (ray against a box in the pot's space)
        this.ray.setFromCamera(ptr, this.camera);
        this.pot.updateMatrixWorld();
        const inv = new THREE.Matrix4().copy(this.pot.matrixWorld).invert();
        const r = this.ray.ray.clone().applyMatrix4(inv);
        const over = r.intersectsBox(this.brushBox);
        const scrollSpeed = s - this.lastLocal;
        const n = this.sway.length;
        this.sway.forEach((b, k) => {
            const w = k / (0.5 * n);
            b.speed += 0.001 * Math.sin(0.02 * this.ticker + 0.5 * Math.PI) * w;
            b.speed += 0.15 * scrollSpeed * w;
            if (over) b.speed += 0.5 * (this.lastPtrX - ptr.x) * 0.5;
            b.speed = 0.05 * -b.offset + 0.8 * b.speed;
            b.offset += b.speed;
            b.bone.rotation.x = b.rot.x + b.offset;
            b.bone.rotation.z = b.rot.z - 0.4 * b.offset;
        });
    }

    resize(w: number, h: number) {
        super.resize(w, h);
    }
}

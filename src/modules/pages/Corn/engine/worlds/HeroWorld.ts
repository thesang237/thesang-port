import * as THREE from 'three';

import type { Assets } from '../assets';
import { accentBackdropMaterial, particleArea } from '../fx/particles';

import { relitMaterial, remat } from './shared';
import { clamp01, damp, type FrameCtx, World } from './World';

/**
 * Hero: the painted cob + husk (`cobb_test.gltf`, 16 leaf cards) and its silk (`hair.gltf`), rebuilt
 * from the reference bundle:
 * - each card is drawn without depth, in the order the artist stored in its glTF extras
 *   ("RENDER ORDER"), with premultiplied atlases (rgb / alpha) — soft leaf edges, no z-fighting;
 * - the light is one of four baked lightings, blended by the cob's own turn plus the pointer
 *   (x: rotY + pointer −5°…15° over −15°…15°; y: pointer tilt −20°…0°);
 * - the husk leaves flutter on their own, close by 2° as the stop arrives and peel open by 3–6° as
 *   it leaves;
 * - three spiral bokeh fields (green, red, teal; reference presets) float in the reference camera
 *   and turn after the pointer, their focus following it.
 * Framing measured on the reference at 1920 × 994: leaf tips y ≈ 75, kernels x 1030–1110 / y 190–630.
 */

const PIVOT = new THREE.Vector3(0, 0, 0);
const deg = THREE.MathUtils.degToRad;
const lerp = THREE.MathUtils.lerp;
const map = (v: number, a: number, b: number, c: number, d: number) => c + (d - c) * clamp01((v - a) / (b - a));

type Leaf = { mesh: THREE.Object3D; r: number; open: number; base: THREE.Euler };

export class HeroWorld extends World {
    readonly camera = new THREE.PerspectiveCamera(26, 1, 0.1, 200);
    /** 0 → 1 during the intro (reference inProgress: 3 s, easeOutQuint). Set by the engine. */
    intro = 1;
    private rig = new THREE.Group();
    private plant = new THREE.Group();
    private mats: THREE.ShaderMaterial[] = [];
    private leaves: Leaf[] = [];
    private areas = new THREE.Group();
    private bg: THREE.Mesh;
    private light = new THREE.Vector2(0.5, 0.35);
    private ptr01 = new THREE.Vector2(0.5, 0.5);
    private yaw = 0;
    private pitch = 0.03;

    constructor(a: Assets) {
        super();
        // reference landing card: base #00160a, blue glow lower left, green glow upper right
        const bgMat = accentBackdropMaterial('#00160a', '#004484', '#025b15', [0.2, 0.2], [0.8, 0.8]);
        // measured on the reference: the card sits ≈ 22 % high (its blue glow lands mid-left, the green
        // at the top-right corner) and the screen is black below it (1, 1, 1 at y 880)
        bgMat.uniforms.uShift.value.set(0, -0.22);
        bgMat.uniforms.uFloor.value.set(0.1, 0.42);
        this.bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
        this.bg.frustumCulled = false;
        this.bg.renderOrder = -100;
        this.scene.add(this.bg);

        const t = a.tex;
        const cob = a.models.cob.scene;
        const silk = a.models.silk.scene;
        const cobMat = relitMaterial([t.cobTL, t.cobTR, t.cobBL, t.cobBR], t.cobAlpha, { sway: 0.06, baseY: -3, height: 9 });
        const silkMat = relitMaterial([t.silkTL, t.silkTR, t.silkBL, t.silkBR], t.silkAlpha, { sway: 0.05, baseY: -3, height: 9 });
        this.mats.push(cobMat, silkMat);
        remat(cob, (m) => {
            m.renderOrder = Number(m.userData['RENDER ORDER'] ?? 0);
            return cobMat;
        });
        remat(silk, (m) => {
            m.renderOrder = 9;
            return silkMat;
        });
        // husk cards: one group per leaf (the mesh inside turns about the leaf's base); '07004' is the cob
        const split = cob.children[0];
        split?.children.forEach((g, n) => {
            const mesh = g.children[0];
            if (!mesh || g.name === '07004') return;
            if (n === 3) mesh.position.x = -0.52;
            this.leaves.push({ mesh, r: Math.random(), open: -3 - Math.random() * 3, base: mesh.rotation.clone() });
        });
        this.plant.add(cob, silk);
        this.rig.add(this.plant);
        this.scene.add(this.rig);

        // bokeh (reference landing presets areaBack1 / areaBack2 / areaFront)
        const dof = this.dof;
        this.areas.add(
            particleArea({ pX: 2.33, pY: -3.05, s: 1, rY: -27.746, color: '#103f0c', o: 0.8, particleSizeMin: 10, particleSizeMax: 200, radius: 2 }, dof, 200, 1),
            particleArea({ pX: 1.4, pY: -2.82, s: 0.6, rY: -47.968, rZ: 1.84, color: '#b22020', o: 1, particleSizeMin: 10, particleSizeMax: 80, radius: 4 }, dof, 200, 2),
            particleArea({ pX: -3.27, pY: -2.15, s: 1, rY: -11.1965, color: '#103f42', o: 0.58, particleSizeMin: 5, particleSizeMax: 200, radius: 3 }, dof, 500, 3),
        );
        this.fx.add(this.areas);
    }

    update(ctx: FrameCtx) {
        const { time, dt, ptr, local, dwell } = ctx;
        // reference stop progress: 0.5 at rest, 0 arriving from the loop, 1 leaving
        const s = Math.max(-1, Math.min(1, local));
        // in-chapter scroll: the camera travels down the cob (it rises in frame), turns a little round
        // it and comes closer; the husk starts to open; the bokeh drift up past the lens
        const dw = dwell;
        const progress = 0.5 + 0.5 * s + 0.12 * dw;
        const e = 1 - Math.pow(1 - clamp01(this.intro), 5);
        // the reference camera rises through the scene with the progress (y 3 → −3) and settles in the intro
        this.fxOffset.y = lerp(3, -3, progress) * 0.35 + (1 - e) - 1.4 * dw;
        this.updateFx(ctx);
        this.ptr01.set(damp(this.ptr01.x, 0.5 + ptr.x * 0.5, 4.8, dt), damp(this.ptr01.y, 0.5 - ptr.y * 0.5, 4.8, dt));

        // the cob's own slow turn (reference: rotY −20°…20° with the progress ± 5° breathing)
        const rY = lerp(-20, 20, progress) + 5 * Math.sin(0.2 * time);
        const rZ = 3 * Math.cos(0.2 * time);
        const sY = lerp(-5, 15, this.ptr01.x);
        const sX = lerp(-20, 0, this.ptr01.y);
        this.light.set(map(rY + sY, -15, 15, 0, 1), map(sX, -20, 0, 1, 0));
        for (const m of this.mats) {
            m.uniforms.uLight.value.copy(this.light);
            m.uniforms.uTime.value = time;
        }
        // intro (reference inProgress): the cob turns in 30° and tips back 10° while it settles
        this.rig.rotation.set(deg(10 * (1 - e)) + deg(rZ) * 0.2, deg(rY - lerp(-20, 20, 0.5)) * 0.55 + deg(-30 * (1 - e)), deg(rZ) * 0.35);
        this.rig.position.y = 0.15 * Math.cos(0.2 * time) * 0.4 - (1 - e) * 0.6;

        // husk leaves: flutter, close as the stop arrives, peel open as it leaves
        const close = map(progress, 0, 0.5, 2, 0);
        this.leaves.forEach((l) => {
            const open = map(progress, 0.5, 1, 0, l.open);
            const w = time * lerp(0.5, 1, l.r) + l.r * Math.PI * 2;
            l.mesh.rotation.x = l.base.x + deg(close + open) * 2.2;
            l.mesh.rotation.y = l.base.y + Math.sin(w) * lerp(0.004, 0.006, l.r) * 3;
        });

        // bokeh fields turn after the pointer (reference particlesObj, eased 8 % a frame) and spin slowly
        const k = 1 - Math.exp(-4.8 * dt);
        this.areas.rotation.x += (deg(sX + 10) - this.areas.rotation.x) * k;
        this.areas.rotation.y += (deg(sY - 5) - this.areas.rotation.y) * k;
        this.areas.children.forEach((c) => (c.rotation.y -= 0.03 * dt));

        // camera: pointer orbit; leaving swings round the cob, pushes in and lifts it; arriving from the
        // loop is the mirror. Intro: a slow push from 3 units further out.
        this.yaw = damp(this.yaw, ptr.x * 0.3 + s * 0.55 + dw * 0.3, 4, dt);
        this.pitch = damp(this.pitch, 0.03 + ptr.y * 0.15 - Math.abs(s) * 0.08 + dw * 0.05, 4, dt);
        // kernels at x 1030–1110, y 190–630 of 1920 × 994: the cob's centre sits at (1050, 548)
        this.lens.set(1050 - s * 60 - dw * 40, 548 - Math.max(0, s) * 140 + Math.max(0, -s) * 90 - dw * 85);
        this.orbit(PIVOT, 26 + 3 * (1 - e) - Math.abs(s) * 5 - dw * 2.5, this.yaw, this.pitch);
    }
}

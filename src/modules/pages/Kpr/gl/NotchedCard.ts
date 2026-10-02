'use client';

import * as THREE from 'three';

import { damp } from '../scroll/timeline';

import { type CardShared, createNotchedMaterial, type NotchedUniforms } from './materials/notched';
import { stageDistance } from './layout';
import type { PaintedScene, PaintedView } from './PaintedScene';

/** Everything a card can do, as plain numbers (written by the choreography, read once per frame). */
export type CardState = {
    x: number;
    y: number;
    z: number;
    w: number;
    h: number;
    rx: number;
    ry: number;
    rz: number;
    /** corner radius in px; negative = automatic (≈ 5.8 % of the short side, 1.2–4.2 u) */
    radius: number;
    /** corner (0 TL, 1 TR, 2 BR, 3 BL), axis (0 along top/bottom edge, 1 along left/right edge), length px, depth px */
    notch: [number, number, number, number];
    /** a second notch (same layout), e.g. the trailer card's small step on its lower left edge */
    notch2: [number, number, number, number];
    /** corner, size px */
    chamfer: [number, number];
    opacity: number;
    /** flat images: zoom + focus inside the card (painted scenes zoom with their camera, see `view`) */
    zoom: number;
    fx: number;
    fy: number;
    wash: number;
    washColor: THREE.ColorRepresentation;
    dim: number;
    skew: number;
    bend: number;
    /** pointer response: inner parallax strength (flat images shift, scenes move their camera) */
    parallax: number;
    /** how far the card itself tilts toward the pointer (radians at the screen edge: x = pitch, y = yaw) */
    tiltX: number;
    tiltY: number;
    edge: number;
    order: number;
    /** where the picture sits (stage px, upright); null = the card's own rect. Set it to keep the
     *  painting still while the card (its mask) shrinks, grows or turns. */
    frame: { x: number; y: number; w: number; h: number } | null;
    /** inputs for the painted scene on the face that is showing */
    view: { progress: number; zoom: number; fx: number; fy: number; dolly: number };
};

export const baseState = (): CardState => ({
    x: 0,
    y: 0,
    z: 0,
    w: 100,
    h: 100,
    rx: 0,
    ry: 0,
    rz: 0,
    radius: -1,
    notch: [0, 0, 0, 0],
    notch2: [0, 0, 0, 0],
    chamfer: [2, 0],
    opacity: 0,
    zoom: 1,
    fx: 0.5,
    fy: 0.5,
    wash: 0,
    washColor: '#ffffff',
    dim: 0,
    skew: 0,
    bend: 0,
    parallax: 1,
    tiltX: 0.1,
    tiltY: 0.16,
    edge: 0,
    order: 0,
    frame: null,
    view: { progress: 0, zoom: 1, fx: 0.5, fy: 0.5, dolly: 0 },
});

/** One face of a card: a texture (image, text, video) or a painted scene rendered into a texture. */
export type Face = { tex: THREE.Texture | null; aspect: number; base: THREE.ColorRepresentation; scene?: PaintedScene; alphaMap?: boolean };

/** Pointer response speeds (1/s): the frame follows slower than the painting inside, which is what
 *  makes the two read as separate layers. Each card gets a slightly different pair. */
const FRAME_LAMBDA = 3.2;
const INNER_LAMBDA = 5.5;
/** flat images at full pointer: how far the picture slides inside the frame (uv units) */
const IMAGE_SHIFT = 0.018;
/** page-scroll parallax: how far (uv) the picture lags when its card is half a screen off centre */
const SCROLL_LAG = 0.035;

/** one "rem" of the reference (10px at 1600 wide, clamped 6.4–12) */
const unit = () => Math.min(12, Math.max(6.4, window.innerWidth * 0.00625));

const tmpColor = new THREE.Color();
let seed = 0;

export class NotchedCard {
    readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
    readonly u: NotchedUniforms;
    readonly state: CardState = baseState();
    /** faces in turning order: 0 = front at ry 0, 1 = back at ±π, 2 = front again at ±2π … */
    faces: Face[] = [];
    /** smoothed pointer for the frame tilt and for the inner layer, plus the tilt actually applied */
    private tp = { x: 0, y: 0 };
    private ip = { x: 0, y: 0 };
    readonly tilt = { x: 0, y: 0 };
    private frameLambda: number;
    private innerLambda: number;
    /** painted scenes that must render this frame (the face showing, plus the next one near edge-on) */
    readonly needs: { scene: PaintedScene; view: PaintedView }[] = [];
    private views = [0, 1].map(() => ({ progress: 0, px: 0, py: 0, tiltX: 0, tiltY: 0, zoom: 1, fx: 0.5, fy: 0.5, dolly: 0, time: 0 }));

    constructor(geometry: THREE.PlaneGeometry, shared: CardShared) {
        const mat = createNotchedMaterial(shared);
        this.mesh = new THREE.Mesh(geometry, mat);
        this.mesh.frustumCulled = false;
        this.u = mat.uniforms as unknown as NotchedUniforms;
        const k = (seed++ * 0.618) % 1;
        this.frameLambda = FRAME_LAMBDA * (0.85 + 0.3 * k);
        this.innerLambda = INNER_LAMBDA * (0.85 + 0.3 * ((k * 7.3) % 1));
    }

    setFaces(...faces: Face[]) {
        this.faces = faces;
        return this;
    }

    /** one-sided: past 90° the card simply disappears */
    single(on = true) {
        this.u.uSingle.value = on ? 1 : 0;
        return this;
    }

    private bind(slot: 'F' | 'B', face: Face | undefined) {
        const u = this.u;
        const on = face?.tex ? 1 : 0;
        // painted scenes render at the viewport's aspect (changes on resize)
        const aspect = face?.scene ? face.scene.camera.aspect : (face?.aspect ?? 1);
        if (slot === 'F') {
            u.uMapF.value = face?.tex ?? null;
            u.uFace.value.x = on;
            u.uFace.value.z = aspect;
            u.uBaseF.value.set(face?.base ?? '#888');
            u.uAlphaMap.value = face?.alphaMap ? 1 : 0;
        } else {
            u.uMapB.value = face?.tex ?? null;
            u.uFace.value.y = on;
            u.uFace.value.w = aspect;
            u.uBaseB.value.set(face?.base ?? '#888');
        }
    }

    /** write the state into the mesh + uniforms; skips invisible cards */
    apply(time: number, dt: number, pointerX: number, pointerY: number, chroma: number) {
        const s = this.state;
        this.needs.length = 0;
        const visible = s.opacity > 0.001 && s.w > 0.5 && s.h > 0.5;
        this.mesh.visible = visible;

        // the pointer is followed even while hidden, so a card never jumps when it appears
        this.tp.x = damp(this.tp.x, pointerX, this.frameLambda, dt);
        this.tp.y = damp(this.tp.y, pointerY, this.frameLambda, dt);
        this.ip.x = damp(this.ip.x, pointerX, this.innerLambda, dt);
        this.ip.y = damp(this.ip.y, pointerY, this.innerLambda, dt);
        if (!visible) return;

        // frame: lean toward the pointer (yaw with x, pitch with y) on top of the choreography
        this.tilt.x = -this.tp.y * s.tiltX;
        this.tilt.y = this.tp.x * s.tiltY;
        this.mesh.position.set(s.x, s.y, s.z);
        this.mesh.rotation.set(s.rx + this.tilt.x, s.ry + this.tilt.y, s.rz);
        this.mesh.scale.set(s.w, s.h, 1);
        this.mesh.renderOrder = s.order;

        // which faces are front / back right now: every half turn moves one step along `faces`
        // (a card with a single face shows it on both sides, however far it spins)
        const turn = Math.abs(s.ry);
        const k = Math.round(turn / Math.PI);
        const even = k % 2 === 0;
        const at = (i: number) => (this.faces.length === 1 ? this.faces[0] : this.faces[i]);
        this.bind('F', at(even ? k : k + 1));
        this.bind('B', at(even ? k + 1 : k));
        // painted scenes to render: the face showing, and its neighbour when the card is near edge-on
        const showing = at(k);
        if (showing?.scene) this.need(0, showing.scene, time);
        if (Math.abs(Math.cos(turn)) < 0.35) {
            const next = at(turn > k * Math.PI ? k + 1 : k - 1);
            if (next?.scene && next.scene !== showing?.scene) this.need(1, next.scene, time);
        }

        const u = this.u;
        u.uSize.value.set(s.w, s.h);
        const un = unit();
        u.uRadius.value = s.radius >= 0 ? s.radius : Math.min(4.2 * un, Math.max(1.2 * un, 0.058 * Math.min(s.w, s.h)));
        u.uNotch.value.set(s.notch[0], s.notch[1], s.notch[2], s.notch[3]);
        u.uNotch2.value.set(s.notch2[0], s.notch2[1], s.notch2[2], s.notch2[3]);
        u.uChamfer.value.set(s.chamfer[0], s.chamfer[1]);
        u.uOpacity.value = s.opacity;
        // flat images: the picture follows the pointer inside the frame (scenes do it with their camera)
        // the picture stays upright on screen (the card is only its mask): its rect is the card's rect
        // projected at the card's depth, without rotation. Images with a baked shape (ring cards, the
        // KEEPERS word) keep the shape on the card instead.
        const showsShape = (showing ?? this.faces[0])?.alphaMap;
        if (showsShape) u.uRect.value.set(0, 0, 0, 0);
        else {
            const D = stageDistance(window.innerHeight);
            const f = s.frame;
            const k = f ? 1 : D / Math.max(1, D - s.z);
            const r = f ?? s;
            u.uRect.value.set(r.x * k, r.y * k, Math.max(1, r.w * k), Math.max(1, r.h * k));
        }
        // inside: flat images slide a little with the pointer (scenes move their own camera), and every
        // picture lags behind the card's vertical travel on screen (page-scroll parallax)
        const flat = !showing?.scene;
        const shift = flat ? IMAGE_SHIFT * s.parallax : 0;
        const travel = showsShape || s.frame ? 0 : Math.max(-1, Math.min(1, (s.y * 2) / window.innerHeight));
        u.uZoom.value = s.zoom * (1 + shift * 2 + (showsShape ? 0 : SCROLL_LAG * 2));
        u.uFocus.value.set(s.fx, s.fy);
        u.uParallax.value.set(-this.ip.x * shift, -this.ip.y * shift + travel * SCROLL_LAG);
        tmpColor.set(s.washColor);
        u.uWash.value.set(tmpColor.r, tmpColor.g, tmpColor.b, s.wash);
        u.uDim.value = s.dim;
        u.uSkew.value = s.skew;
        u.uBend.value = s.bend;
        u.uTime.value = time;
        u.uChroma.value = chroma;
        u.uEdge.value.w = s.edge;
    }

    private need(slot: number, scene: PaintedScene, time: number) {
        const s = this.state;
        const v = this.views[slot];
        v.progress = s.view.progress;
        v.zoom = s.view.zoom;
        v.fx = s.view.fx;
        v.fy = s.view.fy;
        v.dolly = s.view.dolly;
        v.px = this.ip.x * s.parallax;
        v.py = this.ip.y * s.parallax;
        v.tiltX = this.tilt.x;
        v.tiltY = this.tilt.y;
        v.time = time;
        this.needs.push({ scene, view: v });
    }

    dispose() {
        this.mesh.material.dispose();
    }
}

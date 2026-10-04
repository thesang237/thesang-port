import * as THREE from 'three';

import { DofController, tickPoly } from '../fx/particles';

export type FrameCtx = {
    time: number;
    dt: number;
    /** Smoothed pointer, −1..1, y up. */
    ptr: THREE.Vector2;
    /** Story position relative to this world's first chapter (0 = its first stop, 1 = its second…). */
    local: number;
    /**
     * How far the scroll has travelled inside the current chapter (0 on arrival → 1 at its last
     * segment, before it leaves). Worlds move their scene on with it — mostly vertically — while the
     * copy holds. Stays at 1 through a wipe out; eases back during a blend inside one world.
     */
    dwell: number;
    /** Viewport in CSS px. */
    w: number;
    h: number;
    /** Render pixel ratio. */
    dpr: number;
    /** The pointer is over the page (widens the bokeh focus band). */
    ptrActive: boolean;
};

/**
 * One full-screen scene. The engine renders a world into its own render target (3D scene, then the
 * headline overlay in screen px) and composites one or two worlds with the wipe.
 */
export abstract class World {
    readonly scene = new THREE.Scene();
    /** Headlines and other screen-px layers (orthographic, y down), drawn after the 3D scene. */
    readonly overlay = new THREE.Scene();
    abstract readonly camera: THREE.Camera;
    /**
     * Bokeh / particle layer seen through the reference's own camera: 45°, at z 10, sliding (not
     * turning) toward the pointer by ±0.75 units with the reference's distance-scaled easing. Drawn
     * after the 3D scene, before the headlines.
     */
    readonly fx = new THREE.Scene();
    readonly fxCamera = new THREE.PerspectiveCamera(45, 1, 1, 700);
    readonly dof = new DofController({ width: 5, height: 12, farMin: 25, farMax: 40 });
    /** Background colour the target is cleared with. */
    clear = new THREE.Color(0x000000);
    /** Bokeh clock: the reference adds 0.01 a frame (0.6 / s). */
    protected fxTime = 0;
    /** Extra placement of the fx camera (scroll moves, fly-ins), added to its pointer target. */
    protected fxOffset = new THREE.Vector3();

    constructor() {
        this.fxCamera.position.set(0, 0, 10);
    }

    /** Where the orbit pivot lands on screen, in reference px (1920 × 994). */
    protected lens = new THREE.Vector2(960, 497);
    private size = new THREE.Vector2(1920, 994);

    abstract update(ctx: FrameCtx): void;

    /** Shared per-frame work for the fx layer (call from `update`). */
    protected updateFx(ctx: FrameCtx, slide = 0.75) {
        const c = this.fxCamera;
        const tx = ctx.ptr.x * slide + this.fxOffset.x;
        const ty = ctx.ptr.y * slide + this.fxOffset.y;
        const tz = 10 + this.fxOffset.z;
        const d = Math.hypot(tx - c.position.x, ty - c.position.y, tz - c.position.z);
        const k = Math.min(1, Math.max(0.02 * d, 0.04) * ctx.dt * 60);
        c.position.x += (tx - c.position.x) * k;
        c.position.y += (ty - c.position.y) * k;
        c.position.z += (tz - c.position.z) * k;
        this.dof.update(ctx.ptr, ctx.ptrActive, ctx.dt);
        this.fxTime += ctx.dt * 0.6;
        tickPoly(this.fx, this.fxTime, ctx.h, ctx.dpr);
    }

    /**
     * Optional custom pipeline (depth of field, extra passes). Return true when the world drew itself
     * into `target`; the engine then only adds the fx layer and the headlines.
     */
    render?(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget): boolean;

    resize(w: number, h: number) {
        this.size.set(w, h);
        for (const cam of [this.camera, this.fxCamera] as THREE.PerspectiveCamera[]) {
            if (!cam.isPerspectiveCamera) continue;
            cam.aspect = w / h;
            cam.updateProjectionMatrix();
        }
    }

    /**
     * Orbit the camera around `pivot` (yaw / pitch in radians, distance in world units) and shift the
     * lens so the pivot stays at `this.lens` on screen: the scene tilts with the pointer and the
     * scroll while the composition holds (a lens shift, not a pan, so perspective stays natural).
     */
    protected orbit(pivot: THREE.Vector3, dist: number, yaw: number, pitch: number) {
        const cam = this.camera as THREE.PerspectiveCamera;
        const cp = Math.cos(pitch);
        cam.position.set(pivot.x + Math.sin(yaw) * cp * dist, pivot.y + Math.sin(pitch) * dist, pivot.z + Math.cos(yaw) * cp * dist);
        cam.lookAt(pivot);
        const { x: w, y: h } = this.size;
        cam.setViewOffset(w, h, (-(this.lens.x - 960) / 1920) * w, (-(this.lens.y - 497) / 994) * h, w, h);
    }
    dispose() {
        const seen = new Set<unknown>();
        for (const root of [this.scene, this.fx, this.overlay]) {
            root.traverse((o) => {
                const m = o as THREE.Mesh;
                if (m.geometry && !seen.has(m.geometry)) {
                    seen.add(m.geometry);
                    m.geometry.dispose();
                }
                const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
                mats.forEach((mat) => {
                    if (!seen.has(mat)) {
                        seen.add(mat);
                        mat.dispose();
                    }
                });
            });
        }
    }
}

/** Frame-rate independent exponential approach. */
export const damp = (a: number, b: number, lambda: number, dt: number) => a + (b - a) * (1 - Math.exp(-lambda * dt));

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Pointer orbit strength shared by every world (radians at the screen edge). */
export const TILT = { yaw: 0.3, pitch: 0.15 };

export const smooth = (a: number, b: number, v: number) => {
    const t = clamp01((v - a) / (b - a));
    return t * t * (3 - 2 * t);
};

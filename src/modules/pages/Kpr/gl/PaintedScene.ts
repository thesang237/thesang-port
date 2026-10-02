'use client';

import * as THREE from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

import type { FlipbookId, Painting } from '../data/media';

import type { Flipbook } from './assets';
import { createSpriteMaterial } from './SpriteSheet';

export type PaintedView = {
    /** 0..1 along the file's baked camera clip (if it has one) */
    progress: number;
    /** this scene's smoothed pointer, -1..1 */
    px: number;
    py: number;
    /** the card's pointer tilt (radians): the inner camera turns with it, so the painting reads as a
     *  world behind a window instead of a picture glued to the card */
    tiltX: number;
    tiltY: number;
    /** camera zoom and the point it zooms into (0..1 of the frame, y down) */
    zoom: number;
    fx: number;
    fy: number;
    /** push along the view direction (scene units), for slow scroll dollies */
    dolly: number;
    time: number;
};

export const baseView = (): PaintedView => ({ progress: 0, px: 0, py: 0, tiltX: 0, tiltY: 0, zoom: 1, fx: 0.5, fy: 0.5, dolly: 0, time: 0 });

/** How far the inner camera turns with the card's lean, as a share of the horizontal field of view
 *  per radian of lean (0.3 → a 0.15 rad lean shifts the picture by ~4.5 % of its width). */
const PORTAL = 0.3;

/**
 * One painted glTF scene, rendered from its own camera into a texture that a card shows.
 * - unlit materials (the paint already has its light), alpha blended, drawn back to front by the
 *   planes' `extras.order` (1 = front)
 * - effect planes without texture play their flipbook
 * - the pointer moves the camera (every plane shifts by its depth); the card's tilt turns it
 */
export class PaintedScene {
    readonly scene = new THREE.Scene();
    readonly camera: THREE.PerspectiveCamera;
    readonly target: THREE.WebGLRenderTarget;
    readonly clear: THREE.Color;
    private rig: THREE.Object3D;
    private basePos = new THREE.Vector3();
    private baseQuat = new THREE.Quaternion();
    private posePos = new THREE.Vector3();
    private poseQuat = new THREE.Quaternion();
    private mixer: THREE.AnimationMixer | null = null;
    private duration = 1;
    private sprites: ReturnType<typeof createSpriteMaterial>[] = [];
    private owned: { dispose: () => void }[] = [];
    private size = new THREE.Vector2(2, 2);
    private orbit: [number, number];
    private pivotDist: number;
    private pivot = new THREE.Vector3();
    private off = new THREE.Vector3();
    private q = new THREE.Quaternion();
    private e = new THREE.Euler();
    private fwd = new THREE.Vector3();

    constructor(glb: GLTF, def: Painting, books: Record<FlipbookId, Flipbook>) {
        this.scene.add(glb.scene);
        this.clear = new THREE.Color(def.clear);
        this.orbit = def.orbit;
        this.pivotDist = def.pivot;
        this.camera = (glb.cameras[0] as THREE.PerspectiveCamera) ?? new THREE.PerspectiveCamera(23, 16 / 9, 0.1, 1000);
        this.rig = this.camera.parent && this.camera.parent !== glb.scene ? this.camera.parent : this.camera;
        this.basePos.copy(this.rig.position);
        this.baseQuat.copy(this.rig.quaternion);

        const fx = new Map((def.fx ?? []).map((f) => [f.node, f]));
        const hide = new Set(def.hide ?? []);
        glb.scene.traverse((o) => {
            const m = o as THREE.Mesh;
            if (!m.isMesh) return;
            m.frustumCulled = false;
            m.renderOrder = 100 - Number(m.userData?.order ?? 6);
            if (hide.has(m.name)) {
                m.visible = false;
                return;
            }
            const src = m.material as THREE.MeshStandardMaterial;
            const bind = fx.get(m.name);
            if (bind) {
                const sprite = createSpriteMaterial(books[bind.book], { additive: bind.additive, tint: bind.tint, tintAmount: bind.tintAmount, opacity: bind.opacity, offset: Math.random() * 10 });
                m.material = sprite.material;
                this.sprites.push(sprite);
                this.owned.push(sprite.material);
                src.dispose();
                return;
            }
            const map = src.map ?? src.emissiveMap;
            if (map) map.colorSpace = THREE.SRGBColorSpace;
            // planes without paint (and no flipbook) stay hidden rather than showing grey
            if (!map) {
                m.visible = false;
                return;
            }
            const alphaTest = src.alphaTest > 0 ? src.alphaTest : 0.002;
            const mat = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide, alphaTest });
            m.material = mat;
            this.owned.push(mat);
            src.dispose();
        });

        // only clips that actually move (a single keyframe is just the rest pose)
        const clip = glb.animations.find((a) => a.duration > 0.01);
        if (clip) {
            this.mixer = new THREE.AnimationMixer(glb.scene);
            this.mixer.clipAction(clip).play();
            this.duration = clip.duration;
        }

        this.target = new THREE.WebGLRenderTarget(2, 2, { depthBuffer: true, colorSpace: THREE.SRGBColorSpace });
        this.target.texture.generateMipmaps = false;
    }

    get texture() {
        return this.target.texture;
    }

    resize(w: number, h: number, dpr: number) {
        const scale = Math.min(dpr, 1.5);
        this.size.set(Math.max(2, Math.round(w * scale)), Math.max(2, Math.round(h * scale)));
        this.target.setSize(this.size.x, this.size.y);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }

    render(renderer: THREE.WebGLRenderer, v: PaintedView) {
        // camera: baked clip (or rest pose), then pointer travel, card tilt and dolly
        // (the mixer skips writing values that haven't changed, so the pointer's offsets are undone after
        // the render below instead of resetting the pose here)
        if (this.mixer) this.mixer.setTime(Math.min(this.duration - 1e-3, Math.max(0, v.progress) * this.duration));
        else {
            this.rig.position.copy(this.basePos);
            this.rig.quaternion.copy(this.baseQuat);
        }
        this.posePos.copy(this.rig.position);
        this.poseQuat.copy(this.rig.quaternion);
        // pointer: the camera orbits a pivot in front of it (planes nearer than the pivot swing with the
        // pointer, farther ones against it), so the painting turns rather than slides. A zoomed view
        // magnifies the turn, so it turns less when zoomed in.
        const z0 = Math.max(1, v.zoom);
        const travel = 1 / Math.pow(z0, 0.65);
        this.rig.updateMatrixWorld(true);
        this.camera.getWorldDirection(this.fwd);
        this.pivot.copy(this.rig.position).addScaledVector(this.fwd, this.pivotDist);
        this.e.set(v.py * this.orbit[1] * travel, -v.px * this.orbit[0] * travel, 0, 'YXZ');
        this.q.setFromEuler(this.e);
        this.off.copy(this.rig.position).sub(this.pivot).applyQuaternion(this.q);
        this.rig.position.copy(this.pivot).add(this.off);
        this.rig.quaternion.premultiply(this.q);
        if (v.dolly) {
            this.camera.getWorldDirection(this.fwd);
            this.rig.position.addScaledVector(this.fwd, v.dolly);
        }
        // the frame's lean turns the camera by a share of the field of view, so every scene (wide or
        // narrow lens, zoomed or not) shifts by about the same small part of the picture
        const fovH = (2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2) * this.camera.aspect)) / z0;
        this.e.set(v.tiltX * PORTAL * fovH, v.tiltY * PORTAL * fovH, 0, 'YXZ');
        this.q.setFromEuler(this.e);
        this.rig.quaternion.premultiply(this.q);

        // zoom into a focus point with a view offset (keeps the true perspective of the planes)
        const { x: W, y: H } = this.size;
        const z = Math.max(1, v.zoom);
        if (z > 1.001) {
            const fw = W * z;
            const fh = H * z;
            const ox = Math.min(fw - W, Math.max(0, v.fx * fw - W / 2));
            const oy = Math.min(fh - H, Math.max(0, v.fy * fh - H / 2));
            this.camera.setViewOffset(fw, fh, ox, oy, W, H);
        } else if (this.camera.view?.enabled) this.camera.clearViewOffset();
        else this.camera.updateProjectionMatrix();

        for (const s of this.sprites) s.setTime(v.time);

        const prev = renderer.getRenderTarget();
        renderer.setRenderTarget(this.target);
        renderer.setClearColor(this.clear, 1);
        renderer.clear();
        renderer.render(this.scene, this.camera);
        renderer.setRenderTarget(prev);
        renderer.setClearColor(0xffffff, 1);
        this.rig.position.copy(this.posePos);
        this.rig.quaternion.copy(this.poseQuat);
    }

    dispose() {
        this.mixer?.stopAllAction();
        this.owned.forEach((d) => d.dispose());
        this.target.dispose();
    }
}

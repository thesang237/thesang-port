import * as THREE from 'three';

import type { Assets } from '../assets';
import { Molecules } from '../fx/cluster';
import { particleArea } from '../fx/particles';

import { backdrop, bakedGeometry } from './shared';
import { clamp01, damp, type FrameCtx, smooth, TILT, World } from './World';

/**
 * The cut: one giant kernel (`KERNAL.gltf`) on the orange horizon (`map_bg`). Beside it, two columns
 * of spring "molecules" (reference kernelClusterFront / Back) lean after the pointer; white and cyan
 * bokeh drift in front (reference particlesAreaBack0 / 1). Stops 1–2 are the footer: the kernel rises
 * to the top edge and the horizon dims, then it leaves as the link list scrolls.
 *
 * Facts mode ("Meet the new class", reference kernel hotspot): the kernel comes forward and turns
 * face-on; dragging sideways spins it like a dial with spring physics that snaps to thirds, one fact
 * per third. Three ripple markers sit on its face; the one at the top is the current fact.
 * Measured at 1920 × 994: kernel x 1015–1385, y 290–775 (centre 1200, 530).
 */
/** Reference `KernelBackgroundMaterial`: the photo cover-fitted, turned about its right edge by up to
 * 0.04 π and slid down with the progress. */
const bgFrag = /* glsl */ `
uniform sampler2D tBg;
uniform vec2 uResolution, uResolutionTex;
uniform float uProgress, uScale, uDim;
uniform vec2 uShift;
varying vec2 vUv;
vec2 rotateUV(vec2 uv, float r, vec2 mid) {
    return vec2(cos(r) * (uv.x - mid.x) + sin(r) * (uv.y - mid.y) + mid.x, cos(r) * (uv.y - mid.y) - sin(r) * (uv.x - mid.x) + mid.y);
}
void main() {
    float rot = 3.14159265 * -mix(0.0, 0.04, uProgress);
    float offY = -0.04 + mix(0.07, -0.07, uProgress);
    vec2 st = rotateUV(vUv, rot, vec2(1.0, 0.5));
    vec2 k = uResolution / uResolutionTex;
    st = (st - 0.5) * k / max(k.x, k.y) + 0.5;
    st = (st - 0.5) / uScale + vec2(0.0, offY) + 0.5 + uShift;
    vec3 col = texture2D(tBg, st).rgb;
    col *= mix(1.0, 0.45, uDim);
    gl_FragColor = vec4(col, 1.0);
}`;

/**
 * Reference `KernelMaterial`: albedo × matcap (multiply) → colour-burn with (0.27, 0.88, 0.97) at 30 %
 * → screen with a second matcap. The maths runs on display values (as in the reference, which had no
 * colour management), then converts back to linear for this pipeline. Matcap uvs come from the
 * reflected eye vector (sphere map), per vertex, like the reference.
 */
export function kernelMaterial(a: Assets) {
    return new THREE.ShaderMaterial({
        uniforms: {
            tMap: { value: a.tex.kernel },
            tMult: { value: a.tex.matcapMult },
            tScreen: { value: a.tex.matcapScreen },
            uGlow: { value: 1 },
            uFade: { value: 1 },
        },
        vertexShader: /* glsl */ `
            varying vec2 vUv;
            varying vec2 vN;
            void main() {
                vUv = uv;
                #ifdef USE_INSTANCING
                    mat4 mv = modelViewMatrix * instanceMatrix;
                #else
                    mat4 mv = modelViewMatrix;
                #endif
                vec4 p = mv * vec4(position, 1.0);
                vec3 e = normalize(p.xyz);
                vec3 n = normalize(mat3(mv) * normal);
                vec3 r = reflect(e, n);
                float m = 2.0 * sqrt(r.x * r.x + r.y * r.y + (r.z + 1.0) * (r.z + 1.0));
                vN = r.xy / m + 0.5;
                gl_Position = projectionMatrix * p;
            }`,
        fragmentShader: /* glsl */ `
            uniform sampler2D tMap, tMult, tScreen;
            uniform float uGlow, uFade;
            varying vec2 vUv;
            varying vec2 vN;
            vec3 toDisplay(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
            float burn(float base, float blend) { return blend == 0.0 ? blend : max(1.0 - (1.0 - base) / blend, 0.0); }
            void main() {
                vec3 base = toDisplay(texture2D(tMap, vUv).rgb);
                vec3 mult = toDisplay(texture2D(tMult, vN).rgb);
                vec3 scr = toDisplay(texture2D(tScreen, vN).rgb) * uGlow;
                vec3 c = base * mult;
                vec3 cb = vec3(0.27, 0.88, 0.97);
                c = mix(c, vec3(burn(c.r, cb.r), burn(c.g, cb.g), burn(c.b, cb.b)), 0.3);
                c = 1.0 - (1.0 - c) * (1.0 - scr);
                gl_FragColor = vec4(pow(c, vec3(2.2)) * uFade, 1.0);
            }`,
    });
}

/** Ripple marker (reference `HotspotMaterial`): a dot, an outer ring and three ripples running out. */
function markerMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uPrInnerCircle: { value: 0 }, uPrOuterRing: { value: 0 }, uSize: { value: new THREE.Vector2(120, 120) }, uStrokeWidth: { value: 2.5 } },
        vertexShader: /* glsl */ `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
                vec2 scale = vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz));
                mv.xy += position.xy * scale;
                gl_Position = projectionMatrix * mv;
            }`,
        fragmentShader: /* glsl */ `
            uniform float uStrokeWidth, uTime, uPrInnerCircle, uPrOuterRing;
            uniform vec2 uSize;
            varying vec2 vUv;
            float createCircle(vec2 uv, float scale, float smoothing) {
                float radius = length(uv - 0.5) * 2.0 / scale;
                return smoothstep(1.0, 1.0 - smoothing, radius);
            }
            float createRing(vec2 uv, float scale, float smoothing) {
                float strokeWidth = 1.0 - uStrokeWidth / uSize.x * 2.0 / scale;
                float radius = length(uv - 0.5) * 2.0 / scale;
                return smoothstep(1.0, 1.0 - smoothing, radius) * (1.0 - smoothstep(strokeWidth + smoothing, strokeWidth, radius));
            }
            void main() {
                float minRing = mix(0.1, 0.36, uPrOuterRing);
                float maxRing = mix(0.1, 1.0, uPrOuterRing);
                float ring = createRing(vUv, minRing, 0.05) * 0.3 * step(0.01, uPrOuterRing);
                float dot_ = createCircle(vUv, mix(0.02, 0.1, uPrInnerCircle), 0.2);
                float ripple = 0.0;
                for (int i = 0; i < 3; i++) {
                    float sc = mix(minRing, maxRing, mod(uTime + float(i) / 3.0, 1.0));
                    float a = (1.0 - clamp((sc - minRing) / (maxRing - minRing), 0.0, 1.0)) * 0.4 * uPrInnerCircle * step(0.01, uPrOuterRing);
                    ripple += createRing(vUv, sc, 0.05) * a;
                }
                float alpha = (dot_ + ring + ripple) * step(0.01, uPrInnerCircle);
                gl_FragColor = vec4(vec3(1.0), alpha);
            }`,
        transparent: true,
        depthTest: false,
        depthWrite: false,
    });
}

const PIVOT = new THREE.Vector3(0, 0, 0);
const STEP = 1 / 60;
/** Molecule columns: reference units → this scene (the reference kernel is 1.6 × taller). */
const MOL = 0.8;

export class KernelWorld extends World {
    readonly camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
    /** Facts mode weight, set by the engine. */
    hotspot = 0;
    /** The fact the dial has settled on (0–2). */
    fact = 0;
    private bg: THREE.Mesh;
    private dial = new THREE.Group();
    private kernel: THREE.Mesh;
    private mat: THREE.ShaderMaterial;
    private front: Molecules;
    private back: Molecules;
    private mols = new THREE.Group();
    private areas = new THREE.Group();
    private markers: { mesh: THREE.Mesh; mat: THREE.ShaderMaterial; on: number }[] = [];
    private yaw = 0;
    private pitch = 0;
    private acc = 0;
    // dial physics (reference kernel hotspot: px of drag, one fact per quarter screen)
    private spin = 0;
    private spinVel = 0;
    private spinTg = 0;
    private spinDelta = 0;
    private spinStep = 480;
    private spring = 0.02;
    private friction = 0.78;
    private down = false;
    private downX = 0;
    private open = false;

    constructor(a: Assets) {
        super();
        this.bg = backdrop(bgFrag, {
            tBg: { value: a.tex.horizon },
            uResolution: { value: new THREE.Vector2(1920, 994) },
            uResolutionTex: { value: new THREE.Vector2(1024, 1024) },
            uProgress: { value: 0.5 },
            uScale: { value: 1 },
            uDim: { value: 0 },
            uShift: { value: new THREE.Vector2() },
        });
        // reference kernel focus band: wide (10 × 5, far 40 → 70)
        this.dof.o = { width: 10, height: 5, farMin: 40, farMax: 70 };
        this.scene.add(this.bg);

        this.mat = kernelMaterial(a);
        this.kernel = new THREE.Mesh(bakedGeometry(a.models.kernel.scene), this.mat);
        this.kernel.renderOrder = 1;
        this.dial.add(this.kernel);
        this.scene.add(this.dial);

        // molecules: front column over the kernel's left half, a smaller one behind it
        const dof = this.dof;
        this.front = new Molecules({
            height: 6,
            width: 1,
            rows: 8,
            columns: 1,
            perLink: 50,
            clusterRadius: 1,
            spring: 0.03,
            damping: 0.005,
            color1: '#d9fff5',
            color2: '#b5fff6',
            size: 18,
            opacity: 1,
            dof,
            seed: 3,
        });
        this.back = new Molecules({
            height: 8,
            width: 2,
            rows: 8,
            columns: 1,
            perLink: 20,
            clusterRadius: 1,
            spring: 0.01,
            damping: 0.005,
            color1: '#d9fff5',
            color2: '#b5fff6',
            size: 18,
            opacity: 1,
            dof,
            seed: 11,
        });
        this.front.object.position.set(-1.5, 0, 1);
        this.back.object.position.set(-1.6, 0, -2.2);
        this.back.object.scale.setScalar(0.6);
        this.front.object.renderOrder = 5;
        this.mols.add(this.back.object, this.front.object);
        this.mols.scale.setScalar(MOL);
        this.front.object.traverse((o) => (o.renderOrder = 5));
        this.scene.add(this.mols);

        // bokeh (reference kernel presets; Back2 has no preset, so it takes the defaults)
        this.areas.add(
            particleArea({ pX: -10, pY: -10, pZ: -30, s: 3, rY: -29.7, rZ: -1, color: '#ffffff', o: 0.17, particleSizeMin: 10, particleSizeMax: 180, radius: 6 }, dof, 200, 21),
            particleArea({ pX: 3.6, pY: 0.5, pZ: 1.74, s: 1, rY: -7.08, color: '#12eefc', o: 0.36, particleSizeMin: 3, particleSizeMax: 40, radius: 3.09 }, dof, 200, 22),
            particleArea({ color: '#5f661e', o: 0.3, particleSizeMin: 3, particleSizeMax: 120, radius: 3 }, dof, 200, 23),
        );
        this.fx.add(this.areas);

        // three fact markers on the kernel's face, 120° apart; the one at the top is current
        for (let k = 0; k < 3; k++) {
            const mat = markerMaterial();
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
            const ang = Math.PI / 2 - (k * Math.PI * 2) / 3;
            mesh.position.set(Math.cos(ang) * 0.62, Math.sin(ang) * 0.78, 0.72);
            mesh.scale.setScalar(0.62);
            mesh.renderOrder = 6;
            mesh.frustumCulled = false;
            this.dial.add(mesh);
            this.markers.push({ mesh, mat, on: 0 });
        }
    }

    // ── facts mode ─────────────────────────────────────────────────────────────

    openFacts() {
        this.open = true;
        this.spinTg = this.spin = this.spinVel = this.spinDelta = 0;
        this.fact = 0;
    }

    closeFacts() {
        this.open = false;
        this.down = false;
        this.goToFact(0);
    }

    /** Reference goToIndex: shortest way round to fact k. */
    goToFact(k: number) {
        const cur = ((Math.round(-this.spinTg / this.spinStep) % 3) + 3) % 3;
        let d = k - cur;
        if (d > 1) d -= 3;
        if (d < -1) d += 3;
        this.spinTg -= d * this.spinStep;
    }

    dragStart(x: number) {
        if (!this.open) return;
        this.down = true;
        this.downX = x;
        this.spring = 0.04;
        this.friction = 0.52;
        this.spinTg = this.spin;
        this.spinDelta = 0;
    }

    dragMove(x: number) {
        if (!this.down) return;
        this.spinDelta = x - this.downX;
    }

    dragEnd() {
        if (!this.down) return;
        this.down = false;
        this.spring = 0.05;
        this.friction = 0.68;
        // throw: project the release speed (reference project(v, 0.95)) and snap to a third
        const proj = (2 * this.spinVel * 0.95) / (1 - 0.95);
        const t = Math.round(proj / this.spinStep);
        this.spinTg =
            t === 0
                ? Math.floor((this.spinTg + this.spinDelta + 0.5 * this.spinStep) / this.spinStep) * this.spinStep
                : Math.floor((this.spinTg + 0.5 * this.spinStep) / this.spinStep + t) * this.spinStep;
        this.spinDelta = 0;
    }

    private stepDial() {
        const target = this.spinTg + this.spinDelta;
        this.spinVel += (target - this.spin) * this.spring;
        this.spinVel *= this.friction;
        this.spin += this.spinVel;
        const idx = ((Math.round(-(this.down ? this.spinTg + this.spinDelta : this.spinTg) / this.spinStep) % 3) + 3) % 3;
        if (Math.abs(this.spinVel) < 8 && this.open) this.fact = idx;
    }

    // ── frame ──────────────────────────────────────────────────────────────────

    update(ctx: FrameCtx) {
        const { time, dt, ptr, local, dwell } = ctx;
        // in-chapter scroll (the cut): the kernel turns and rises, the molecules and bokeh drift up
        const dw = dwell * (1 - this.hotspot);
        this.fxOffset.y = -(Math.max(-1, local) + dw) * 0.9;
        this.updateFx(ctx);
        const h = this.hotspot;
        const footer = smooth(0, 1, Math.max(0, local));
        const u = (this.bg.material as THREE.ShaderMaterial).uniforms;
        u.uDim.value = footer * 0.6 + h * 0.35;
        u.uProgress.value = clamp01(0.5 + 0.5 * local + 0.25 * dw);
        u.uShift.value.set(damp(u.uShift.value.x, ptr.x * 0.01, 2, dt), damp(u.uShift.value.y, ptr.y * 0.01 + footer * 0.04, 2, dt));

        this.acc = Math.min(this.acc + dt, STEP * 4);
        while (this.acc >= STEP) {
            this.acc -= STEP;
            this.front.step(ptr);
            this.back.step(ptr);
            this.stepDial();
        }

        // kernel: turns with the scroll and slowly on its own; in facts mode it faces the camera and
        // the dial (the drag) turns it about the view axis
        const k = this.kernel;
        const idle = 1 - h;
        k.rotation.set((0.08 + 0.12 * dw) * idle, (0.25 + local * 1.4 + dw * 0.9 + Math.sin(time * 0.3) * 0.12) * idle, (-0.08 + Math.sin(time * 0.25) * 0.03) * idle);
        k.position.y = 0.04 * Math.sin(1.4 * time);
        this.dial.rotation.z = (-this.spin / this.spinStep) * ((Math.PI * 2) / 3);

        const enter = Math.min(0, local);
        const more = smooth(1, 2, local);
        // facts mode: the kernel moves a little left of its spot and comes closer
        this.lens.set(1200 - footer * 85 - h * 70 - dw * 30, 530 - footer * 520 - more * 300 - enter * 280 + h * 10 - dw * 110);

        // molecules: beside the kernel, fading for the footer and the facts mode
        const ca = (1 - smooth(0, 0.5, Math.max(0, local))) * (1 - h);
        this.front.opacity = ca;
        this.back.opacity = ca;
        this.mols.visible = ca > 0.001;
        // the molecule columns climb past the kernel with the in-chapter scroll
        this.mols.position.set(0, k.position.y * 0.5 + dw * 0.9, 0);
        this.mols.rotation.y = dw * 0.5;
        // bokeh pushes toward the camera in facts mode (reference: z 0 → 6)
        this.areas.position.z = h * 6;
        this.areas.children.forEach((c) => (c.rotation.y -= 0.03 * dt));

        // markers: dots appear with the mode; the one at the top ripples
        const cur = this.fact;
        this.markers.forEach((m, i) => {
            m.on = damp(m.on, this.open && i === cur && Math.abs(this.spinVel) < 8 ? 1 : 0, 6, dt);
            m.mat.uniforms.uPrInnerCircle.value = clamp01(h * 1.2 - 0.1);
            m.mat.uniforms.uPrOuterRing.value = m.on;
            m.mat.uniforms.uTime.value = (time / 2.2) % 1;
        });

        const orbit = 1 - 0.7 * h;
        this.yaw = damp(this.yaw, ptr.x * TILT.yaw * 1.2 * orbit, 4, dt);
        this.pitch = damp(this.pitch, ptr.y * TILT.pitch * 1.2 * orbit - enter * 0.2 + dw * 0.12, 4, dt);
        this.orbit(PIVOT, 9.8 - h * 1.6, this.yaw, this.pitch);
    }

    resize(w: number, h: number) {
        super.resize(w, h);
        this.spinStep = w * 0.25;
        (this.bg.material as THREE.ShaderMaterial).uniforms.uResolution.value.set(w, h);
        this.markers.forEach((m) => m.mat.uniforms.uSize.value.set(h * 0.12, h * 0.12));
    }
}

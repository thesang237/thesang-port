'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { Btn, ColorInput, Demo, Group, Segmented, Slider } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { useParams, useThreeCanvas } from '../kit/loop';
import { damp, rng, smoothstep } from '../kit/math';

import { cloudPoints, sampleDrawing, SHAPES, textShape } from './particleShapes';

type ShapeKey = 'penguin' | 'x' | 'snowflake' | 'ring' | 'text';

// defaults ≈ tweaks.ts → colonyParams, scaled for a smaller, CPU-simulated figure
const DEFAULTS = {
    shape: 'penguin' as ShapeKey,
    text: 'IGLOO',
    form: 1,
    spring: 26,
    loose: 2.8,
    damping: 7,
    radius: 0.32,
    drag: 6.5,
    chaos: 1,
    decay: 0.45,
    burst: 1,
    plume: 0.7,
    morphDur: 2.1,
    idle: 0.04,
    size: 26,
    glow: 1.15,
    tint: '#d4c2ff',
};

const VERT = /* glsl */ `
attribute float aEnergy;
attribute float aRnd;
uniform float uSize;
uniform float uGlow;
uniform float uTime;
uniform vec3 uTint;
varying vec3 vCol;
varying float vGlow;
vec3 palette(float t) { return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67))); }
void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float g = smoothstep(0.04, 0.85, aEnergy);
    // calm = dense slate, excited = pearl-white tinted by the palette
    vec3 base = vec3(0.12, 0.14, 0.18) + vec3(0.1, 0.11, 0.14) * aRnd;
    vec3 hue = mix(uTint, palette(uTime * 0.035 + aRnd * 0.22 + aEnergy * 0.2), 0.35);
    vec3 glow = mix(vec3(1.0), hue, 0.45) * (0.9 + uGlow * g);
    vCol = mix(base, glow, g);
    vGlow = g;
    gl_PointSize = uSize * (0.8 + aRnd * 0.4) * (1.0 + g * 0.35) / -mv.z;
}
`;
const FRAG = /* glsl */ `
varying vec3 vCol;
varying float vGlow;
void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (length(c) > 0.5) discard;
    float lit = clamp(0.6 - c.x * 0.7 - c.y * 0.9, 0.0, 1.0);   // tiny sphere impostor, lit top-left
    gl_FragColor = vec4(vCol * mix(0.7 + lit * 0.5, 1.0, vGlow), 1.0);
    #include <colorspace_fragment>
}
`;

/**
 * The colony, simulated on the CPU so every rule is readable: a spring to
 * home, damping, cursor drag, energy → glow, click shockwave, drag spin and a
 * staggered morph between shapes sampled from a canvas.
 */
export default function ParticleMorph() {
    const host = useRef<HTMLDivElement>(null);
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const [count] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 6000 : 12000));
    const api = useRef<{ morphTo: (key: ShapeKey, text: string) => void; gather: () => void } | null>(null);

    useThreeCanvas(host, ({ renderer, pointer, host: el }) => {
        const N = count;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#b4bcc7');
        scene.fog = new THREE.Fog('#b4bcc7', 9, 30);
        const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
        camera.position.set(0, 1.5, 7.4);
        scene.add(new THREE.HemisphereLight('#eef2f8', '#59616e', 1.2));
        const dir = new THREE.DirectionalLight('#ffffff', 2);
        dir.position.set(-4, 9, 6);
        scene.add(dir);
        const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.62, 0.4, 64), new THREE.MeshStandardMaterial({ color: '#8d95a1', roughness: 0.55, metalness: 0.3 }));
        pedestal.position.y = -0.2;
        const rim = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.022, 8, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.5, 2.7), toneMapped: false }));
        rim.rotation.x = Math.PI / 2;
        const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 64), new THREE.MeshStandardMaterial({ color: '#8b93a0', roughness: 0.9 }));
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.4;
        scene.add(pedestal, rim, floor);

        // ── particle data ──
        const r = rng(77);
        const rnd = new Float32Array(N);
        for (let i = 0; i < N; i++) rnd[i] = r();
        const cloud = cloudPoints(N);
        const from = new Float32Array(N * 3);
        let to = sampleDrawing(SHAPES.penguin, N, 9);
        from.set(to);
        const pos = new Float32Array(cloud);
        const vel = new Float32Array(N * 3);
        const energy = new Float32Array(N);

        const geo = new THREE.BufferGeometry();
        const posAttr = new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage);
        const eAttr = new THREE.BufferAttribute(energy, 1).setUsage(THREE.DynamicDrawUsage);
        geo.setAttribute('position', posAttr);
        geo.setAttribute('aEnergy', eAttr);
        geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
        const mat = new THREE.ShaderMaterial({
            vertexShader: VERT,
            fragmentShader: FRAG,
            uniforms: { uSize: { value: 26 }, uGlow: { value: 1.15 }, uTime: { value: 0 }, uTint: { value: new THREE.Color() } },
        });
        const points = new THREE.Points(geo, mat);
        points.frustumCulled = false;
        const fig = new THREE.Group();
        fig.position.y = 1.3;
        fig.add(points);
        scene.add(fig);

        const fx = { morph: 1, burst: 0, form: 0, shock: 0 };
        const inp = {
            ray: new THREE.Raycaster(),
            ndc: new THREE.Vector2(),
            plane: new THREE.Plane(),
            a: new THREE.Vector3(),
            b: new THREE.Vector3(),
            o: new THREE.Vector3(),
            d: new THREE.Vector3(),
            vel: new THREE.Vector3(),
            so: new THREE.Vector3(0, -99, 0),
            sd: new THREE.Vector3(0, 0, -1),
            last: new THREE.Vector2(),
            lastPx: 0,
            spin: 0,
            spinVel: 0,
            has: false,
        };
        const camDir = new THREE.Vector3();
        const center = new THREE.Vector3(0, 1.3, 0);
        const hitAt = (x: number, y: number, out: THREE.Vector3) => {
            inp.ndc.set(x, y);
            inp.ray.setFromCamera(inp.ndc, camera);
            if (!inp.ray.ray.intersectPlane(inp.plane, out)) return false;
            fig.worldToLocal(out);
            return true;
        };

        // shape change: snapshot current homes as "from", burst, then morph with per-particle stagger
        const morphTo = (key: ShapeKey, text: string) => {
            for (let i = 0; i < N; i++) {
                const m = smoothstep(rnd[i] * 0.45, rnd[i] * 0.45 + 0.55, fx.morph);
                for (let k = 0; k < 3; k++) from[i * 3 + k] += (to[i * 3 + k] - from[i * 3 + k]) * m;
            }
            to = sampleDrawing(key === 'text' ? textShape(text) : SHAPES[key], N, key.length * 7 + text.length);
            fx.morph = 0;
            const d = ref.current.morphDur;
            gsap.killTweensOf(fx, 'morph,burst'); // keep a running gather alive
            gsap.timeline()
                .to(fx, { burst: 1, duration: 0.3, ease: 'power2.out' }, 0)
                .to(fx, { burst: 0, duration: d * 0.67, ease: 'power2.inOut' }, 0.3)
                .to(fx, { morph: 1, duration: d, ease: 'power2.inOut' }, 0.15);
        };
        const gather = () => {
            fx.form = 0;
            gsap.to(fx, { form: 1, duration: 1.8, ease: 'none' });
        };
        api.current = { morphTo, gather };
        gather();

        return {
            resize: (w, h) => {
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
            },
            onClick: (ptr) => {
                camera.getWorldDirection(camDir);
                inp.plane.setFromNormalAndCoplanarPoint(camDir.clone().negate(), center);
                if (hitAt(ptr.x, ptr.y, inp.a)) {
                    inp.so.copy(camera.position);
                    fig.worldToLocal(inp.so);
                    inp.sd.copy(inp.a).sub(inp.so).normalize();
                    fx.shock = 1;
                }
            },
            frame: (time, rawDt) => {
                const P = ref.current;
                const dt = Math.min(rawDt, 1 / 30);
                mat.uniforms.uSize.value = P.size * renderer.getPixelRatio();
                mat.uniforms.uGlow.value = P.glow;
                mat.uniforms.uTime.value = time;
                mat.uniforms.uTint.value.set(P.tint);

                // drag to spin (with inertia), otherwise a slow turntable
                if (pointer.down && pointer.moved) inp.spinVel += (pointer.px - inp.lastPx) * 0.0022;
                inp.lastPx = pointer.px;
                inp.spinVel = damp(inp.spinVel, 0, 2.2, dt);
                inp.spin += dt * 0.12 + inp.spinVel;
                fig.rotation.y = inp.spin;
                fig.updateMatrixWorld();
                el.style.cursor = pointer.down && pointer.moved ? 'grabbing' : 'grab';

                // cursor → local-space ray + cursor velocity
                camera.lookAt(0, 1.25, 0);
                camera.getWorldDirection(camDir);
                inp.plane.setFromNormalAndCoplanarPoint(camDir.clone().negate(), center);
                const moved = pointer.x !== inp.last.x || pointer.y !== inp.last.y;
                inp.has = pointer.over && !pointer.down && hitAt(pointer.x, pointer.y, inp.a);
                if (inp.has) {
                    inp.o.copy(camera.position);
                    fig.worldToLocal(inp.o);
                    inp.d.copy(inp.a).sub(inp.o).normalize();
                    if (moved && hitAt(inp.last.x, inp.last.y, inp.b)) {
                        inp.b.subVectors(inp.a, inp.b).divideScalar(dt);
                        if (inp.b.length() > 18) inp.b.setLength(18);
                        inp.vel.lerp(inp.b, 1 - Math.exp(-14 * dt));
                    } else inp.vel.multiplyScalar(Math.exp(-10 * dt));
                } else inp.vel.multiplyScalar(Math.exp(-10 * dt));
                inp.last.set(pointer.x, pointer.y);
                const speed = inp.vel.length();
                const rad = P.radius + Math.min(speed, 8) * 0.035; // faster gesture → wider wake
                const r2 = rad * rad;
                fx.shock = damp(fx.shock, 0, 7, dt);

                // ── the simulation: two half steps keep the stiff spring stable ──
                const h = dt / 2;
                for (let step = 0; step < 2; step++) {
                    for (let i = 0; i < N; i++) {
                        const i3 = i * 3;
                        const rn = rnd[i];
                        // home: staggered morph + idle wander + plume mid-morph + gather from cloud
                        const m = smoothstep(rn * 0.45, rn * 0.45 + 0.55, fx.morph);
                        const mid = Math.sin(m * Math.PI);
                        let hx = from[i3] + (to[i3] - from[i3]) * m;
                        let hy = from[i3 + 1] + (to[i3 + 1] - from[i3 + 1]) * m;
                        let hz = from[i3 + 2] + (to[i3 + 2] - from[i3 + 2]) * m;
                        hx += Math.sin(time * 1.1 + rn * 20 + hy * 2) * P.idle;
                        hy += Math.sin(time * 0.9 + rn * 13 + hx * 2) * P.idle;
                        hz += Math.sin(time * 1.3 + rn * 7) * P.idle;
                        hx += Math.sin(rn * 40 + time) * 0.5 * mid * P.plume;
                        hy += (0.3 + rn * 0.6) * mid * P.plume;
                        hz += Math.cos(rn * 31 + time) * 0.5 * mid * P.plume;
                        const f = smoothstep(rn * 0.5, rn * 0.5 + 0.5, fx.form);
                        hx = cloud[i3] + (hx - cloud[i3]) * f;
                        hy = cloud[i3 + 1] + (hy - cloud[i3 + 1]) * f;
                        hz = cloud[i3 + 2] + (hz - cloud[i3 + 2]) * f;

                        const px = pos[i3];
                        const py = pos[i3 + 1];
                        const pz = pos[i3 + 2];
                        let vx = vel[i3];
                        let vy = vel[i3 + 1];
                        let vz = vel[i3 + 2];
                        const e = Math.min(energy[i], 1.5);
                        const e1 = Math.min(e, 1);

                        // spring home — loosens with energy and while bursting
                        const k = (P.spring + (P.loose - P.spring) * e1) * (1 - 0.85 * Math.min(fx.burst, 1));
                        const dmp = P.damping + (P.damping * 0.27 - P.damping) * e1;
                        let ax = (hx - px) * k - vx * dmp;
                        let ay = (hy - py) * k - vy * dmp;
                        let az = (hz - pz) * k - vz * dmp;

                        // turbulence grows with energy → chaos follows the gesture
                        const turb = (e * e * 7 + e * 3) * P.chaos;
                        ax += Math.sin(py * 2.3 + time * 1.7 + rn * 13) * turb;
                        ay += Math.sin(pz * 2.1 + time * 1.3 + rn * 7) * turb;
                        az += Math.sin(px * 2.7 + time * 1.1 + rn * 3) * turb;

                        // cursor: particles near the cursor ray are dragged along with it
                        let fall = 0;
                        if (inp.has) {
                            const dx = px - inp.o.x;
                            const dy = py - inp.o.y;
                            const dz = pz - inp.o.z;
                            const t = dx * inp.d.x + dy * inp.d.y + dz * inp.d.z;
                            const qx = dx - inp.d.x * t;
                            const qy = dy - inp.d.y * t;
                            const qz = dz - inp.d.z * t;
                            const d2 = qx * qx + qy * qy + qz * qz;
                            if (d2 < r2 * 9) {
                                fall = Math.exp(-d2 / r2) * (0.6 + rn * 0.8);
                                const ql = Math.sqrt(d2) + 1e-4;
                                ax += (inp.vel.x * 1.15 - vx) * fall * P.drag + (qx / ql) * fall * speed * 1.5;
                                ay += (inp.vel.y * 1.15 - vy) * fall * P.drag + (qy / ql) * fall * speed * 1.5;
                                az += (inp.vel.z * 1.15 - vz) * fall * P.drag + (qz / ql) * fall * speed * 1.5;
                            }
                        }

                        // click shockwave: a blast along the click ray
                        let sf = 0;
                        if (fx.shock > 0.01) {
                            const dx = px - inp.so.x;
                            const dy = py - inp.so.y;
                            const dz = pz - inp.so.z;
                            const t = dx * inp.sd.x + dy * inp.sd.y + dz * inp.sd.z;
                            const qx = dx - inp.sd.x * t;
                            const qy = dy - inp.sd.y * t;
                            const qz = dz - inp.sd.z * t;
                            const d2 = qx * qx + qy * qy + qz * qz;
                            sf = Math.exp(-d2 / 0.9);
                            const ql = Math.sqrt(d2) + 1e-4;
                            ax += (qx / ql) * 34 * sf * fx.shock;
                            ay += (qy / ql) * 34 * sf * fx.shock;
                            az += (qz / ql) * 34 * sf * fx.shock;
                        }

                        // shape change: a vortex, strongest mid-morph
                        if (fx.burst > 0.001) {
                            const b = fx.burst * P.burst * (0.45 + rn);
                            ax += (pz * 3.4 + px * 1.1) * b;
                            ay += (py * 1.1 + 0.9) * b;
                            az += (-px * 3.4 + pz * 1.1) * b;
                        }

                        // soft containment
                        const out = Math.max(Math.hypot(px, py * 0.75, pz) - 2.8, 0);
                        if (out > 0) {
                            const l = Math.hypot(px, py, pz) + 1e-4;
                            ax -= (px / l) * out * out * 30;
                            ay -= (py / l) * out * out * 30;
                            az -= (pz / l) * out * out * 30;
                        }

                        vx += ax * h;
                        vy += ay * h;
                        vz += az * h;
                        const sp = Math.hypot(vx, vy, vz);
                        if (sp > 14) {
                            vx *= 14 / sp;
                            vy *= 14 / sp;
                            vz *= 14 / sp;
                        }
                        vel[i3] = vx;
                        vel[i3 + 1] = vy;
                        vel[i3 + 2] = vz;
                        pos[i3] = px + vx * h;
                        pos[i3 + 1] = py + vy * h;
                        pos[i3 + 2] = pz + vz * h;

                        // energy is injected by outside causes only, then fades into a glow trail
                        const inject = fall * Math.min(speed * 0.28, 1.3) + sf * fx.shock * 1.3 + fx.burst * P.burst * (0.35 + rn * 0.7) + Math.min(Math.max((sp - 2.2) * 0.25, 0), 0.6);
                        energy[i] = Math.max(e - h * P.decay, Math.min(inject, 1.4));
                    }
                }
                posAttr.needsUpdate = true;
                eAttr.needsUpdate = true;
                renderer.render(scene, camera);
            },
            dispose: () => {
                gsap.killTweensOf(fx);
                geo.dispose();
                mat.dispose();
                [pedestal, rim, floor].forEach((m) => {
                    m.geometry.dispose();
                    (m.material as THREE.Material).dispose();
                });
                api.current = null;
            },
        };
    });

    // morph whenever the shape (or the custom text) changes — compare keys so re-runs never re-morph
    const shown = useRef('penguin|');
    useEffect(() => {
        const key = `${p.shape}|${p.shape === 'text' ? p.text : ''}`;
        if (key === shown.current) return;
        const id = window.setTimeout(
            () => {
                shown.current = key;
                api.current?.morphTo(p.shape, p.text);
            },
            p.shape === 'text' ? 350 : 0,
        );
        return () => window.clearTimeout(id);
    }, [p.shape, p.text]);

    return (
        <Demo
            title="Particle colony — springs, energy, morph"
            hint="Sweep the cursor through the figure. Click for a shockwave, drag to spin it. Then change the shape."
            onReset={reset}
            controls={
                <>
                    <Group title="Shape">
                        <Segmented options={['penguin', 'x', 'snowflake', 'ring', 'text'] as const} value={p.shape} onChange={(v) => set('shape', v)} />
                        {p.shape === 'text' && (
                            <input
                                value={p.text}
                                maxLength={8}
                                onChange={(e) => set('text', e.target.value)}
                                className="il-mono w-full rounded-md border border-[var(--il-line-2)] bg-black/25 px-2 py-1.5 text-[12px] text-[var(--il-ink)] outline-none focus:border-[var(--il-ice)]"
                            />
                        )}
                        <div className="flex gap-2">
                            <Btn onClick={() => api.current?.gather()}>▶ Gather from cloud</Btn>
                        </div>
                    </Group>
                    <Group title="Physics">
                        <Slider label="spring" value={p.spring} min={2} max={60} step={0.5} onChange={(v) => set('spring', v)} help="Pull toward home when calm. High = tight, crisp figure." />
                        <Slider
                            label="loose spring"
                            value={p.loose}
                            min={0.5}
                            max={20}
                            step={0.1}
                            onChange={(v) => set('loose', v)}
                            help="Pull when fully excited. Low = excited particles drift like smoke."
                        />
                        <Slider label="damping" value={p.damping} min={0.5} max={20} step={0.1} onChange={(v) => set('damping', v)} help="Friction. Low = wobbly jelly, high = syrup." />
                        <Slider label="energy decay" value={p.decay} min={0.05} max={2} onChange={(v) => set('decay', v)} help="How fast the glow trail fades and the figure re-forms." />
                        <Slider label="chaos" value={p.chaos} min={0} max={4} step={0.05} onChange={(v) => set('chaos', v)} help="Turbulence that grows with energy²." />
                    </Group>
                    <Group title="Cursor">
                        <Slider label="radius" value={p.radius} min={0.05} max={1} onChange={(v) => set('radius', v)} />
                        <Slider label="drag" value={p.drag} min={0} max={20} step={0.1} onChange={(v) => set('drag', v)} help="How strongly particles inherit the cursor’s velocity." />
                    </Group>
                    <Group title="Morph">
                        <Slider label="burst" value={p.burst} min={0} max={3} step={0.05} onChange={(v) => set('burst', v)} help="Vortex kick when the shape changes." />
                        <Slider label="plume" value={p.plume} min={0} max={2} step={0.05} onChange={(v) => set('plume', v)} help="Homes swirl up mid-morph instead of cutting straight across." />
                        <Slider label="duration" value={p.morphDur} min={0.6} max={5} step={0.1} onChange={(v) => set('morphDur', v)} />
                        <Slider label="idle wander" value={p.idle} min={0} max={0.2} step={0.001} onChange={(v) => set('idle', v)} />
                    </Group>
                    <Group title="Look">
                        <Slider label="size" value={p.size} min={6} max={60} step={0.5} onChange={(v) => set('size', v)} />
                        <Slider label="glow" value={p.glow} min={0} max={4} step={0.05} onChange={(v) => set('glow', v)} />
                        <ColorInput label="tint" value={p.tint} onChange={(v) => set('tint', v)} />
                    </Group>
                </>
            }
        >
            <div ref={host} className="h-[480px] sm:h-[580px]" />
            <div className="il-mono border-t border-[var(--il-line)] px-4 py-2 text-[10.5px] text-[var(--il-faint)]">{`${count.toLocaleString()} particles simulated in JavaScript · Igloo runs 65,536 on the GPU`}</div>
        </Demo>
    );
}

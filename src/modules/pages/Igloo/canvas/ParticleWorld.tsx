'use client';

import { useEffect, useMemo, useRef } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import * as THREE from 'three';

import { SOCIALS } from '../data';
import { motion, useIglooUI, worldWeight } from '../store';
import { colonyParams, tweakCommands } from '../tweaks';
import { SNOISE } from '../utils/glsl';
import { damp, easeInOutCubic, fitFov, lerp } from '../utils/math';
import { ambience } from '../utils/sound';

import { ColonySim } from './colonySim';
import { buildShapes } from './shapes';
import Snow from './Snow';
import useWorld from './useWorld';

const BG = '#b4bcc7';
const SHAPE_KEYS = SOCIALS.map((s) => s.shape);
const CENTER = new THREE.Vector3(0, 1.2, 0);

// ─── Particle rendering: reads simulated positions from the GPGPU texture ──
const particleVertex = /* glsl */ `
attribute vec2 aRef;
uniform sampler2D tPos;
uniform sampler2D tFrom;
uniform sampler2D tTo;
uniform sampler2D tCloud;
uniform float uForm;
uniform sampler2D tFromN;
uniform sampler2D tToN;
uniform float uMorph;
uniform float uTime;
uniform float uSize;
uniform float uFlash;
uniform vec3 uTintA;
uniform vec3 uTintB;
uniform vec3 uTintC;
uniform float uGlow;
uniform float uTint;
uniform float uPaletteSpeed;
uniform float uScan;
uniform float uTwinkle;
varying vec3 vCol;
varying float vGlow;

// icy cyan → pearl lilac → glacier mint, slowly cycling
vec3 palette(float t) {
    vec3 a = uTintA;
    vec3 b = uTintB;
    vec3 c = uTintC;
    t = fract(t) * 3.0;
    if (t < 1.0) return mix(a, b, smoothstep(0.0, 1.0, t));
    if (t < 2.0) return mix(b, c, smoothstep(1.0, 2.0, t));
    return mix(c, a, smoothstep(2.0, 3.0, t));
}

void main() {
    vec4 P = texture2D(tPos, aRef);
    vec4 A = texture2D(tFrom, aRef);
    float rnd = A.w;
    float m = smoothstep(rnd * 0.45, rnd * 0.45 + 0.55, uMorph);
    float f = smoothstep(rnd * 0.5, rnd * 0.5 + 0.5, uForm);
    vec3 home = mix(texture2D(tCloud, aRef).xyz, mix(A.xyz, texture2D(tTo, aRef).xyz, m), f);
    vec4 N = mix(texture2D(tFromN, aRef), texture2D(tToN, aRef), m);
    vec3 n = normalize(N.xyz + 1e-4);
    float ao = N.w;
    float e = clamp(P.w, 0.0, 1.4);

    vec4 mv = modelViewMatrix * vec4(P.xyz, 1.0);
    gl_Position = projectionMatrix * mv;

    // calm: dense slate surface, key light + cool rim
    vec3 vn = normalize(normalMatrix * n);
    float lam = max(dot(vn, normalize(vec3(-0.45, 0.75, 0.55))), 0.0);
    float rim = pow(1.0 - abs(vn.z), 3.0);
    vec3 base = (vec3(0.07, 0.08, 0.1) + vec3(0.3, 0.33, 0.38) * lam + vec3(0.3, 0.37, 0.46) * rim * 0.55) * ao;

    // a faint scanline climbs the figure every few seconds
    float scan = smoothstep(0.03, 0.0, abs(fract(P.y * 0.16 - uTime * 0.13) - 0.5));
    vec3 hue = palette(uTime * uPaletteSpeed + rnd * 0.22 + e * 0.2);
    base += hue * scan * uScan;

    // excited: glowing pastel, brighter the more energy it carries
    // glow = physical energy, or simply being away from home (visual only)
    float away = clamp(length(home - P.xyz) * 0.5 - 0.06, 0.0, 0.7);
    float g = smoothstep(0.04, 0.85, max(e, away));
    // pearl-white core tinted by the palette — premium, not neon
    vec3 glow = mix(vec3(1.0), hue, clamp(uTint + 0.2 * g, 0.0, 1.0)) * (0.9 + uGlow * g);
    vec3 col = mix(base, glow, g);

    // sparse twinkles + global flash on shape change
    col += hue * step(0.9975, fract(rnd * 97.31 + floor(uTime * 1.4) * 0.137)) * 0.6 * uTwinkle;
    col += hue * uFlash * rnd * 0.14;

    vCol = col;
    vGlow = g;
    gl_PointSize = min(uSize * (0.8 + rnd * 0.4) * (1.0 + g * 0.35) / -mv.z, uSize * 0.28);
}
`;

const particleFragment = /* glsl */ `
varying vec3 vCol;
varying float vGlow;
void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    // tiny sphere impostor — lit top-left, glow flattens it
    float lit = clamp(0.6 - c.x * 0.7 - c.y * 0.9, 0.0, 1.0);
    vec3 col = vCol * mix(0.7 + lit * 0.5, 1.0, vGlow);
    gl_FragColor = vec4(col, 1.0);
}
`;

const floorFragment = /* glsl */ `
uniform float uTime;
uniform float uFlash;
varying vec2 vUv;
${SNOISE}
void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float rr = length(p);
    float r = rr * 13.0;
    float grooves = smoothstep(0.08, 0.0, abs(fract(r * 0.5) - 0.5) - 0.44);
    float grit = snoise(vec3(p * 30.0, 0.0)) * 0.5 + 0.5;
    vec3 col = mix(vec3(0.46, 0.5, 0.57), vec3(0.6, 0.64, 0.7), grit * 0.6);
    col -= grooves * 0.08;
    col += smoothstep(1.0, 0.0, rr * 3.0) * 0.15;
    // shape-change ripple racing outward along the grooves
    float wave = smoothstep(0.12, 0.0, abs(rr - (1.0 - uFlash) * 1.1)) * uFlash;
    col += vec3(0.6, 0.85, 1.0) * wave * (0.6 + grooves);
    gl_FragColor = vec4(col, 1.0);
    #include <fog_fragment>
}
`;

const glassFragment = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
void main() {
    float panel = fract(vUv.x * 24.0);
    float edge = smoothstep(0.0, 0.03, panel) * smoothstep(1.0, 0.97, panel);
    float fade = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
    vec3 col = vec3(0.86, 0.9, 0.95) * (1.0 - edge * 0.35);
    gl_FragColor = vec4(col, fade * 0.3);
}
`;

export default function ParticleWorld({ env }: { env: THREE.Texture }) {
    const fog = useMemo(() => new THREE.Fog(BG, 9, 30), []);
    const { scene, ref: worldRef } = useWorld(3, { fov: 38, background: BG, fog, environment: env, environmentIntensity: 0.6 });
    const social = useIglooUI((s) => s.social);
    const gl = useThree((s) => s.gl);

    // 65k particles on desktop, 31k on small screens
    const size = useMemo(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 176 : 256), []);

    const bundle = useMemo(() => {
        const shapes = buildShapes(size * size);
        const sim = new ColonySim(gl, size, shapes);
        const count = size * size;
        const ref = new Float32Array(count * 2);
        for (let i = 0; i < count; i++) ref.set([((i % size) + 0.5) / size, (Math.floor(i / size) + 0.5) / size], i * 2);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
        geometry.setAttribute('aRef', new THREE.BufferAttribute(ref, 2));
        geometry.boundingSphere = new THREE.Sphere(CENTER.clone(), 8);
        const material = new THREE.ShaderMaterial({
            vertexShader: particleVertex,
            fragmentShader: particleFragment,
            uniforms: {
                tPos: { value: null },
                tFrom: { value: sim.textures.penguin.pos },
                tTo: { value: sim.textures.penguin.pos },
                tCloud: { value: sim.textures.cloud.pos },
                uForm: { value: 0 },
                tFromN: { value: sim.textures.penguin.nrm },
                tToN: { value: sim.textures.penguin.nrm },
                uMorph: { value: 1 },
                uTime: { value: 0 },
                uSize: { value: 16 },
                uFlash: { value: 0 },
                uTintA: { value: new THREE.Color(colonyParams.tintA) },
                uTintB: { value: new THREE.Color(colonyParams.tintB) },
                uTintC: { value: new THREE.Color(colonyParams.tintC) },
                uGlow: { value: 1.15 },
                uTint: { value: 0.38 },
                uPaletteSpeed: { value: 0.035 },
                uScan: { value: 0.22 },
                uTwinkle: { value: 1 },
            },
        });
        const floorMat = new THREE.ShaderMaterial({
            vertexShader:
                '#include <fog_pars_vertex>\nvarying vec2 vUv; void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mvPosition; \n#include <fog_vertex>\n}',
            fragmentShader: '#include <fog_pars_fragment>\n' + floorFragment,
            uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uFlash: { value: 0 } }]),
            fog: true,
        });
        const glassMat = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            side: THREE.BackSide,
            uniforms: { uTime: { value: 0 } },
            vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
            fragmentShader: glassFragment,
        });
        const halo = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.8, 2.9, 3.1), toneMapped: false });
        const rim = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.5, 2.7), toneMapped: false });
        return { sim, geometry, material, floorMat, glassMat, halo, rim };
    }, [gl, size]);

    // everything mutated per frame lives behind a ref
    const live = useRef(bundle);
    const fx = useRef({ burst: 0, flash: 0, shock: 0 });
    const input = useRef({
        ray: new THREE.Raycaster(),
        ndc: new THREE.Vector2(),
        plane: new THREE.Plane(),
        a: new THREE.Vector3(),
        b: new THREE.Vector3(),
        origin: new THREE.Vector3(),
        dir: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        prevVel: new THREE.Vector3(),
        accel: 0,
        idle: 0,
        lastMove: 0,
        last: new THREE.Vector2(),
        spin: 0,
        spinVel: 0,
        down: null as null | { x: number; y: number; t: number; moved: boolean },
        shockAt: null as null | THREE.Vector2,
    });

    useEffect(() => {
        const b = live.current;
        return () => {
            b.sim.dispose();
            b.geometry.dispose();
            b.material.dispose();
            b.floorMat.dispose();
            b.glassMat.dispose();
            document.body.removeAttribute('data-ig-cursor');
        };
    }, []);

    // ── shape change: vortex burst, staggered re-targeting, floor ripple ──
    const target = useRef(0);
    useEffect(() => {
        if (social === target.current) return;
        const from = target.current;
        target.current = social;
        const { sim, material } = live.current;
        const T = sim.textures;
        sim.uniforms.tFrom.value = T[SHAPE_KEYS[from]].pos;
        sim.uniforms.tTo.value = T[SHAPE_KEYS[social]].pos;
        material.uniforms.tFromN.value = T[SHAPE_KEYS[from]].nrm;
        material.uniforms.tToN.value = T[SHAPE_KEYS[social]].nrm;
        motion.morph = 0;
        ambience.whoosh();
        const f = fx.current;
        const tl = gsap.timeline();
        const d = colonyParams.morphDuration;
        tl.to(f, { burst: 1, duration: 0.3, ease: 'power2.out' }, 0)
            .to(f, { burst: 0, duration: d * 0.67, ease: 'power2.inOut' }, 0.3)
            .fromTo(f, { flash: 1 }, { flash: 0, duration: 1.6, ease: 'power2.out' }, 0)
            .to(motion, { morph: 1, duration: d, ease: 'power2.inOut' }, 0.15);
        return () => {
            tl.kill();
        };
    }, [social]);

    // ── drag to spin, click to send a shockwave ──
    useEffect(() => {
        const inColony = (e: PointerEvent) => {
            const ui = useIglooUI.getState();
            return ui.section === 3 && ui.detail < 0 && worldWeight(3) > 0.9 && !(e.target as HTMLElement).closest('button, a, [data-ig-ui]');
        };
        const onDown = (e: PointerEvent) => {
            if (!inColony(e)) return;
            input.current.down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
            document.body.setAttribute('data-ig-cursor', 'grabbing');
        };
        const onMove = (e: PointerEvent) => {
            const d = input.current.down;
            if (!d) return;
            const dx = e.movementX || 0;
            if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 6) d.moved = true;
            input.current.spinVel += dx * 0.0022;
        };
        const onUp = (e: PointerEvent) => {
            const d = input.current.down;
            input.current.down = null;
            document.body.setAttribute('data-ig-cursor', worldWeight(3) > 0.9 ? 'grab' : '');
            if (d && !d.moved && performance.now() - d.t < 350) {
                input.current.shockAt = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
                ambience.tick(700);
            }
        };
        window.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        return () => {
            window.removeEventListener('pointerdown', onDown);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
    }, []);

    const figureRef = useRef<THREE.Group>(null);
    const haloRef = useRef<THREE.Mesh>(null);

    useFrame((state, delta) => {
        const weight = worldWeight(3);
        const cursor = document.body.getAttribute('data-ig-cursor');
        if (weight <= 0.9 && cursor === 'grab') document.body.removeAttribute('data-ig-cursor');
        if (weight <= 0) return;
        if (weight > 0.9 && !cursor && motion.hasPointer) document.body.setAttribute('data-ig-cursor', 'grab');

        const { sim, material, floorMat, halo, rim } = live.current;
        const inp = input.current;
        const f = fx.current;
        const { camera } = worldRef.current;
        const dt = Math.min(delta, 1 / 30);
        const time = state.clock.elapsedTime;
        const cam = easeInOutCubic(motion.colonyCam);
        const px = motion.pointerSmooth.x;
        const py = motion.pointerSmooth.y;

        // camera: settles to eye level; pulls back a touch on each burst
        camera.position.set(px * 0.45, lerp(9.5, 1.85, cam) + py * 0.22, lerp(3.2, 7.4, cam) + f.burst * 0.35);
        camera.lookAt(0, lerp(0, 1.25, cam), 0);
        const pc = camera as THREE.PerspectiveCamera;
        pc.fov = fitFov(38, pc.aspect);
        pc.updateProjectionMatrix();

        // figure: slow turntable + drag inertia + gentle bob
        const fig = figureRef.current;
        if (!fig) return;
        inp.spinVel = damp(inp.spinVel, 0, 2.2, dt);
        inp.spin += dt * colonyParams.autoSpin + inp.spinVel;
        fig.rotation.y = inp.spin + px * 0.35;
        fig.position.y = Math.sin(time * 0.8) * 0.035;
        fig.updateMatrixWorld();

        // cursor → local ray + local velocity (from pointer motion only, not the spin)
        camera.getWorldDirection(inp.dir);
        inp.plane.setFromNormalAndCoplanarPoint(inp.dir.clone().negate(), CENTER);
        const hitAt = (x: number, y: number, out: THREE.Vector3) => {
            inp.ndc.set(x, y);
            inp.ray.setFromCamera(inp.ndc, camera);
            if (!inp.ray.ray.intersectPlane(inp.plane, out)) return false;
            fig.worldToLocal(out);
            return true;
        };
        const u = sim.uniforms;
        const active = motion.hasPointer && !motion.overUI && cam > 0.8 && motion.detail < 0.01 && !inp.down;
        const moved = motion.pointer.x !== inp.last.x || motion.pointer.y !== inp.last.y;
        if (active && hitAt(motion.pointer.x, motion.pointer.y, inp.a)) {
            inp.origin.copy(camera.position);
            fig.worldToLocal(inp.origin);
            u.uRayO.value.copy(inp.origin);
            u.uRayD.value.copy(inp.a).sub(inp.origin).normalize();
            if (moved && hitAt(inp.last.x, inp.last.y, inp.b)) {
                inp.b.subVectors(inp.a, inp.b).divideScalar(dt);
                if (inp.b.length() > 18) inp.b.setLength(18);
                inp.vel.lerp(inp.b, 1 - Math.exp(-14 * dt));
            } else {
                inp.vel.multiplyScalar(Math.exp(-10 * dt));
            }
        } else {
            inp.vel.multiplyScalar(Math.exp(-10 * dt));
            u.uRayO.value.set(0, -99, 0);
        }
        inp.last.set(motion.pointer.x, motion.pointer.y);
        const speed = inp.vel.length();
        // acceleration → chaos; resting cursor → idle wisps
        const accel = inp.prevVel.distanceTo(inp.vel) / dt;
        inp.prevVel.copy(inp.vel);
        inp.accel = damp(inp.accel, accel, accel > inp.accel ? 20 : 4, dt);
        if (moved) inp.lastMove = time;
        inp.idle = damp(inp.idle, time - inp.lastMove > 1.6 && motion.detail < 0.01 ? 1 : 0, 1.5, dt);
        u.uAccel.value = inp.accel;
        u.uIdle.value = colonyParams.wisps ? inp.idle * cam : 0;
        u.uMouseVel.value.copy(inp.vel);
        u.uMouseSpeed.value = speed;
        u.uRadius.value = colonyParams.radius + Math.min(speed, 8) * colonyParams.radiusGain; // faster gesture → wider wake

        // click shockwave
        if (inp.shockAt && hitAt(inp.shockAt.x, inp.shockAt.y, inp.a)) {
            u.uShockO.value.copy(camera.position);
            fig.worldToLocal(u.uShockO.value);
            u.uShockD.value.copy(inp.a).sub(u.uShockO.value).normalize();
            f.shock = 1;
        }
        if (tweakCommands.shock) {
            tweakCommands.shock = false;
            inp.shockAt = new THREE.Vector2(0, 0.05);
            if (hitAt(0, 0.05, inp.a)) {
                u.uShockO.value.copy(camera.position);
                fig.worldToLocal(u.uShockO.value);
                u.uShockD.value.copy(inp.a).sub(u.uShockO.value).normalize();
                f.shock = 1;
            }
        }
        inp.shockAt = null;
        f.shock = damp(f.shock, 0, 7, dt);

        u.uTime.value = time;
        u.uForm.value = motion.form;
        u.uMorph.value = motion.morph;
        u.uBurst.value = f.burst * colonyParams.burst;
        const P = colonyParams;
        u.uIdleAmp.value = P.idleAmp;
        u.uIdleFreq.value = P.idleFreq;
        u.uIdleSpeed.value = P.idleSpeed;
        u.uJitter.value = P.jitter;
        u.uBreathe.value = P.breathe;
        u.uPlume.value = P.plume;
        u.uSpring.value = P.spring;
        u.uLoose.value = P.looseSpring;
        u.uDamping.value = P.damping;
        u.uChaos.value = P.chaos;
        u.uDrag.value = P.drag;
        u.uAccelChaos.value = P.accelChaos;
        u.uDecay.value = P.energyDecay;
        u.uShock.value = f.shock;
        // two half steps keep the stiff spring stable on slow frames
        sim.step(dt / 2);
        sim.step(dt / 2);

        const mu = material.uniforms;
        mu.tPos.value = sim.position;
        mu.tFrom.value = u.tFrom.value;
        mu.tTo.value = u.tTo.value;
        mu.uForm.value = motion.form;
        mu.uMorph.value = motion.morph;
        mu.uTime.value = time;
        mu.uFlash.value = f.flash;
        mu.uSize.value = P.size * (size > 200 ? 1 : 1.22) * state.viewport.dpr;
        mu.uGlow.value = P.glow;
        mu.uTint.value = P.tint;
        mu.uPaletteSpeed.value = P.paletteSpeed;
        mu.uScan.value = P.scanline;
        mu.uTwinkle.value = P.twinkle ? 1 : 0;
        mu.uTintA.value.set(P.tintA);
        mu.uTintB.value.set(P.tintB);
        mu.uTintC.value.set(P.tintC);

        // stage reacts to the transition
        floorMat.uniforms.uTime.value = time;
        floorMat.uniforms.uFlash.value = f.flash;
        halo.color.setRGB(2.8, 2.9, 3.1).multiplyScalar(1 + f.flash * 1.4);
        rim.color.setRGB(2.4, 2.5, 2.7).multiplyScalar(1 + f.flash * 1.8);
        if (haloRef.current) haloRef.current.rotation.z = time * 0.1;
    });

    const { geometry, material, floorMat, glassMat, halo, rim } = bundle;

    return createPortal(
        <>
            <hemisphereLight args={['#eef2f8', '#59616e', 1.2]} />
            <directionalLight position={[-4, 9, 6]} intensity={2} />
            <spotLight position={[0, 9, 0]} angle={0.5} penumbra={0.8} intensity={60} distance={20} decay={1.5} />

            <group ref={figureRef}>
                <points geometry={geometry} material={material} frustumCulled={false} />
            </group>

            {/* pedestal */}
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[1.55, 1.62, 0.4, 64]} />
                <meshStandardMaterial color="#8d95a1" roughness={0.55} metalness={0.3} />
            </mesh>
            <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} material={rim}>
                <torusGeometry args={[1.55, 0.022, 8, 96]} />
            </mesh>
            <mesh position={[0, 0.201, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.9, 0.92, 96]} />
                <meshBasicMaterial color="#dfe6ef" />
            </mesh>

            {/* platform */}
            <mesh position={[0, -0.34, 0]}>
                <cylinderGeometry args={[6.4, 6.5, 0.3, 96]} />
                <meshStandardMaterial color="#7f8793" roughness={0.6} metalness={0.25} />
            </mesh>
            <mesh position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]} material={floorMat}>
                <circleGeometry args={[6.4, 96]} />
            </mesh>
            <mesh position={[0, -0.19, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[6.42, 0.05, 8, 160]} />
                <meshBasicMaterial color={[2.2, 2.3, 2.5]} toneMapped={false} />
            </mesh>
            <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[40, 64]} />
                <meshStandardMaterial color="#8b93a0" roughness={0.9} />
            </mesh>

            {/* overhead halo + glass enclosure */}
            <mesh ref={haloRef} position={[0, 6.4, 0]} rotation={[Math.PI / 2, 0, 0]} material={halo}>
                <torusGeometry args={[3.2, 0.09, 12, 128]} />
            </mesh>
            <mesh position={[0, 5, 0]} material={glassMat}>
                <cylinderGeometry args={[11, 11, 22, 96, 1, true]} />
            </mesh>

            <Snow count={260} size={[20, 8, 6]} center={[0, 3, -6]} speed={0.1} pointSize={1.2} opacity={0.35} visible={() => worldWeight(3)} />
        </>,
        scene,
    );
}

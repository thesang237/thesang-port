'use client';

import { useEffect, useMemo, useRef } from 'react';
import { createPortal, useFrame } from '@react-three/fiber';
import { gsap } from 'gsap';
import * as THREE from 'three';

import { SOCIALS } from '../data';
import { motion, useIglooUI, worldWeight } from '../store';
import { SNOISE } from '../utils/glsl';
import { clamp, damp, easeInOutCubic, fitFov, lerp, rng } from '../utils/math';

import { buildShapes, PARTICLE_COUNT } from './shapes';
import Snow from './Snow';
import useWorld from './useWorld';

const BG = '#b4bcc7';

const particleVertex = /* glsl */ `
attribute vec3 aA;
attribute vec3 aB;
attribute vec3 aCloud;
attribute vec4 aRand;
uniform float uMorph;
uniform float uForm;
uniform float uTime;
uniform float uSize;
uniform float uMouseStr;
uniform vec3 uRayO;
uniform vec3 uRayD;
varying float vShade;
varying float vSpark;
${SNOISE}
void main() {
    float d = aRand.x * 0.45;
    float m = smoothstep(d, d + 0.55, uMorph);
    float mid = sin(m * 3.14159);
    vec3 p = mix(aA, aB, m);

    vec3 q = p * 0.7 + uTime * 0.25;
    vec3 flow = vec3(snoise(q), snoise(q + 17.0), snoise(q + 31.0));
    // gust: particles stream sideways while re-forming
    p += (flow * 0.7 + vec3(-2.2 * aRand.y, 0.5 * aRand.z, 0.8 * (aRand.w - 0.5))) * mid;

    // cloud → figure
    float f = smoothstep(aRand.z * 0.5, aRand.z * 0.5 + 0.5, uForm);
    p = mix(aCloud + flow * 0.4, p, f);
    p += flow * 0.012;

    // pointer: particles part around the cursor ray (a soft tunnel through the figure)
    vec3 v = p - uRayO;
    vec3 perp = v - uRayD * dot(v, uRayD);
    float dist = length(perp);
    float push = smoothstep(0.5, 0.0, dist) * uMouseStr;
    p += normalize(perp + 1e-4) * push * 0.32 + vec3(0.0, push * 0.08, 0.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.55 + aRand.w * 0.9) / -mv.z;

    vec3 n = normalize(p - vec3(0.0, 1.2, 0.0));
    vShade = 0.25 + 0.75 * clamp(dot(n, normalize(vec3(-0.45, 0.75, 0.6))) * 0.5 + 0.5, 0.0, 1.0);
    vSpark = clamp(step(0.975, aRand.y) + mid * step(0.75, aRand.w) + push * 0.55 + (1.0 - f) * 0.6, 0.0, 1.0);
}
`;

const particleFragment = /* glsl */ `
varying float vShade;
varying float vSpark;
void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    // tiny sphere impostor
    float lit = clamp(0.55 - c.x * 0.6 - c.y * 0.9, 0.0, 1.0);
    vec3 dark = vec3(0.07, 0.08, 0.1);
    vec3 light = vec3(0.5, 0.54, 0.6);
    vec3 col = mix(dark, light, vShade * (0.55 + lit * 0.6));
    col = mix(col, vec3(1.6, 1.7, 1.8), vSpark * 0.6);
    gl_FragColor = vec4(col, 1.0);
}
`;

const floorFragment = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
${SNOISE}
void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p) * 13.0;
    float grooves = smoothstep(0.08, 0.0, abs(fract(r * 0.5) - 0.5) - 0.44);
    float grit = snoise(vec3(p * 30.0, 0.0)) * 0.5 + 0.5;
    vec3 col = mix(vec3(0.46, 0.5, 0.57), vec3(0.6, 0.64, 0.7), grit * 0.6);
    col -= grooves * 0.08;
    col += smoothstep(1.0, 0.0, length(p) * 3.0) * 0.15;
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

const SHAPE_KEYS = SOCIALS.map((s) => s.shape);

export default function ParticleWorld({ env }: { env: THREE.Texture }) {
    const fog = useMemo(() => new THREE.Fog(BG, 9, 30), []);
    const { scene, ref: worldRef } = useWorld(3, { fov: 38, background: BG, fog, environment: env, environmentIntensity: 0.6 });
    const social = useIglooUI((s) => s.social);

    const shapes = useMemo(() => buildShapes(PARTICLE_COUNT), []);

    const { geometry, material } = useMemo(() => {
        const g = new THREE.BufferGeometry();
        const rand = new Float32Array(PARTICLE_COUNT * 4);
        const r = rng(77);
        for (let i = 0; i < rand.length; i++) rand[i] = r();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PARTICLE_COUNT * 3), 3));
        g.setAttribute('aA', new THREE.BufferAttribute(shapes.penguin.slice(), 3));
        g.setAttribute('aB', new THREE.BufferAttribute(shapes.penguin.slice(), 3));
        g.setAttribute('aCloud', new THREE.BufferAttribute(shapes.cloud, 3));
        g.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.3, 0), 6);
        const m = new THREE.ShaderMaterial({
            vertexShader: particleVertex,
            fragmentShader: particleFragment,
            uniforms: {
                uMorph: { value: 1 },
                uForm: { value: 0 },
                uTime: { value: 0 },
                uSize: { value: 30 },
                uMouseStr: { value: 0 },
                uRayO: { value: new THREE.Vector3(0, -99, 0) },
                uRayD: { value: new THREE.Vector3(0, 0, -1) },
            },
        });
        return { geometry: g, material: m };
    }, [shapes]);

    const floorMat = useMemo(
        () =>
            new THREE.ShaderMaterial({
                vertexShader:
                    '#include <fog_pars_vertex>\nvarying vec2 vUv; void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mvPosition; \n#include <fog_vertex>\n}',
                fragmentShader: '#include <fog_pars_fragment>\n' + floorFragment,
                uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 } }]),
                fog: true,
            }),
        [],
    );

    const glassMat = useMemo(
        () =>
            new THREE.ShaderMaterial({
                transparent: true,
                depthWrite: false,
                side: THREE.BackSide,
                uniforms: { uTime: { value: 0 } },
                vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
                fragmentShader: glassFragment,
            }),
        [],
    );

    const live = useRef({ geometry, material, floorMat, shapes });

    // morph between social shapes
    // `shown` only advances when a morph completes, so Strict Mode's
    // mount → cleanup → mount cycle replays the morph instead of skipping it
    const shown = useRef(0);
    useEffect(() => {
        const from = shown.current;
        if (social === from) return;
        const { geometry, shapes } = live.current;
        const aA = geometry.getAttribute('aA') as THREE.BufferAttribute;
        const aB = geometry.getAttribute('aB') as THREE.BufferAttribute;
        aA.copyArray(shapes[SHAPE_KEYS[from]]);
        aB.copyArray(shapes[SHAPE_KEYS[social]]);
        aA.needsUpdate = true;
        aB.needsUpdate = true;
        motion.morph = 0;
        const tween = gsap.to(motion, {
            morph: 1,
            duration: 2.1,
            ease: 'power2.inOut',
            onComplete: () => {
                shown.current = social;
            },
        });
        return () => {
            // interrupted past the midpoint → treat the target as the new origin
            if (motion.morph > 0.5) shown.current = social;
            tween.kill();
        };
    }, [social]);

    const figureRef = useRef<THREE.Group>(null);
    const haloRef = useRef<THREE.Mesh>(null);
    const tmp = useMemo(() => ({ ray: new THREE.Raycaster(), ndc: new THREE.Vector2(), plane: new THREE.Plane(), hit: new THREE.Vector3(), n: new THREE.Vector3(), spin: 0 }), []);
    const tmpRef = useRef(tmp);

    useFrame((state, delta) => {
        if (worldWeight(3) <= 0) return;
        const { material, floorMat } = live.current;
        const tmp = tmpRef.current;
        const { camera } = worldRef.current;
        const time = state.clock.elapsedTime;
        const cam = easeInOutCubic(motion.colonyCam);
        const px = motion.pointerSmooth.x;
        const py = motion.pointerSmooth.y;

        camera.position.set(px * 0.5, lerp(9.5, 1.85, cam) + py * 0.25, lerp(3.2, 7.4, cam));
        camera.lookAt(0, lerp(0, 1.25, cam), 0);
        const pc = camera as THREE.PerspectiveCamera;
        pc.fov = fitFov(38, pc.aspect);
        pc.updateProjectionMatrix();

        const u = material.uniforms;
        u.uTime.value = time;
        u.uForm.value = motion.form;
        u.uMorph.value = motion.morph;
        u.uSize.value = 24 * state.viewport.dpr;

        const fig = figureRef.current;
        if (fig) {
            tmp.spin += delta * 0.18;
            fig.rotation.y = tmp.spin + px * 0.6;
            fig.position.y = Math.sin(time * 0.8) * 0.04;

            tmp.ndc.set(motion.pointer.x, motion.pointer.y);
            tmp.ray.setFromCamera(tmp.ndc, camera);
            camera.getWorldDirection(tmp.n);
            tmp.plane.setFromNormalAndCoplanarPoint(tmp.n.negate(), new THREE.Vector3(0, 1.2, 0));
            if (tmp.ray.ray.intersectPlane(tmp.plane, tmp.hit)) {
                // cursor ray in the figure's (rotating) local space
                fig.worldToLocal(tmp.hit);
                const origin = fig.worldToLocal(tmp.n.copy(camera.position));
                u.uRayO.value.lerp(origin, clamp(delta * 10));
                u.uRayD.value.lerp(tmp.hit.sub(origin).normalize(), clamp(delta * 10)).normalize();
            }
            u.uMouseStr.value = damp(u.uMouseStr.value, motion.hasPointer && cam > 0.8 ? 1 : 0, 4, delta);
        }
        if (haloRef.current) haloRef.current.rotation.z = time * 0.1;
        floorMat.uniforms.uTime.value = time;
    });

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
            <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.55, 0.022, 8, 96]} />
                <meshBasicMaterial color={[2.4, 2.5, 2.7]} toneMapped={false} />
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
            <mesh ref={haloRef} position={[0, 6.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[3.2, 0.09, 12, 128]} />
                <meshBasicMaterial color={[2.8, 2.9, 3.1]} toneMapped={false} />
            </mesh>
            <mesh position={[0, 5, 0]} material={glassMat}>
                <cylinderGeometry args={[11, 11, 22, 96, 1, true]} />
            </mesh>

            <Snow count={700} size={[14, 8, 14]} center={[0, 3, 0]} speed={0.12} pointSize={1.4} opacity={0.5} visible={() => worldWeight(3)} />
        </>,
        scene,
    );
}

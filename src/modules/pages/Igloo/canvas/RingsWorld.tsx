'use client';

import { useMemo, useRef } from 'react';
import { createPortal, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { motion, worldWeight } from '../store';
import { SNOISE } from '../utils/glsl';
import { clamp, easeInOutCubic, easeOutCubic, fitFov, lerp, rng, smoothstep } from '../utils/math';

import useWorld from './useWorld';

const BG = '#b7bfca';

type Segment = {
    geometry: THREE.BufferGeometry;
    ring: number;
    start: THREE.Vector3;
    startRot: THREE.Euler;
    delay: number;
};

const RINGS = [
    { radius: 3.3, width: 0.62, depth: 0.5, count: 9 },
    { radius: 2.15, width: 0.46, depth: 0.42, count: 7 },
    { radius: 1.3, width: 0.34, depth: 0.36, count: 5 },
];

/** Rounded-rectangle profile revolved over a partial angle → chunky ring segment. */
function segmentGeometry(radius: number, width: number, depth: number, phiStart: number, phiLength: number) {
    const pts: THREE.Vector2[] = [];
    const bevel = Math.min(width, depth) * 0.28;
    const x0 = radius - width / 2;
    const x1 = radius + width / 2;
    const y0 = -depth / 2;
    const y1 = depth / 2;
    const corner = (cx: number, cy: number, a0: number) => {
        for (let i = 0; i <= 4; i++) {
            const a = a0 + (i / 4) * (Math.PI / 2);
            pts.push(new THREE.Vector2(cx + Math.cos(a) * bevel, cy + Math.sin(a) * bevel));
        }
    };
    corner(x1 - bevel, y0 + bevel, -Math.PI / 2);
    corner(x1 - bevel, y1 - bevel, 0);
    corner(x0 + bevel, y1 - bevel, Math.PI / 2);
    corner(x0 + bevel, y0 + bevel, Math.PI);
    pts.push(pts[0].clone());
    const body = new THREE.LatheGeometry(pts, 28, phiStart, phiLength);
    // close both ends with the profile shape
    const caps = [phiStart, phiStart + phiLength].map((phi) => {
        const cap = new THREE.ShapeGeometry(new THREE.Shape(pts.slice(0, -1)));
        cap.rotateY(phi - Math.PI / 2);
        return cap;
    });
    const g = mergeGeometries([body, ...caps])!;
    g.rotateX(Math.PI / 2); // lathe axis Y → ring faces the camera (Z)
    return g;
}

const tunnelFragment = /* glsl */ `
uniform float uTime;
uniform float uDive;
varying vec2 vUv;
${SNOISE}
void main() {
    float streak = snoise(vec3(vUv.x * 24.0, vUv.y * 2.0 - uTime * 1.5 * (0.3 + uDive * 3.0), 0.0)) * 0.5 + 0.5;
    float band = smoothstep(0.0, 0.4, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
    vec3 col = mix(vec3(0.72, 0.78, 0.86), vec3(1.5), streak * band);
    gl_FragColor = vec4(col, (0.25 + streak * 0.6) * uDive);
}
`;

export default function RingsWorld({ env }: { env: THREE.Texture }) {
    const fog = useMemo(() => new THREE.Fog(BG, 8, 30), []);
    const { scene, ref: worldRef } = useWorld(2, { fov: 40, background: BG, fog, environment: env, environmentIntensity: 0.45 });

    const segments = useMemo<Segment[]>(() => {
        const r = rng(21);
        const out: Segment[] = [];
        RINGS.forEach((ring, ri) => {
            const gap = 0.05;
            const arc = (Math.PI * 2) / ring.count;
            for (let k = 0; k < ring.count; k++) {
                out.push({
                    geometry: segmentGeometry(ring.radius, ring.width, ring.depth, k * arc + gap / 2, arc - gap),
                    ring: ri,
                    start: new THREE.Vector3((r() - 0.5) * 14, (r() - 0.5) * 10, -4 - r() * 10),
                    startRot: new THREE.Euler(r() * 4, r() * 4, r() * 4),
                    delay: ri * 0.12 + r() * 0.25,
                });
            }
        });
        return out;
    }, []);

    const core = useMemo(() => {
        const r = rng(5);
        const n = 2600;
        const pos = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const v = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(Math.pow(r(), 0.6) * 0.75);
            pos.set([v.x, v.y, v.z], i * 3);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        return g;
    }, []);

    const glowMat = useMemo(
        () =>
            new THREE.ShaderMaterial({
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                uniforms: { uStrength: { value: 0 } },
                vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
                fragmentShader: /* glsl */ `
                    uniform float uStrength; varying vec2 vUv;
                    void main(){ float d = length(vUv - 0.5) * 2.0; float g = pow(clamp(1.0 - d, 0.0, 1.0), 2.4);
                    gl_FragColor = vec4(vec3(1.6, 1.7, 1.9) * g * uStrength, 1.0); }
                `,
            }),
        [],
    );

    const tunnelMat = useMemo(
        () =>
            new THREE.ShaderMaterial({
                transparent: true,
                depthWrite: false,
                side: THREE.BackSide,
                uniforms: { uTime: { value: 0 }, uDive: { value: 0 } },
                vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
                fragmentShader: tunnelFragment,
            }),
        [],
    );

    const meshes = useRef<(THREE.Mesh | null)[]>([]);
    const ringGroups = useRef<(THREE.Group | null)[]>([]);
    const rootRef = useRef<THREE.Group>(null);
    const coreRef = useRef<THREE.Points>(null);
    const coreMat = useRef<THREE.PointsMaterial>(null);
    const pointLight = useRef<THREE.PointLight>(null);
    const tmpEuler = useMemo(() => new THREE.Euler(), []);
    const tmpQ = useMemo(() => ({ a: new THREE.Quaternion(), b: new THREE.Quaternion() }), []);
    const live = useRef({ tmpEuler, tmpQ, glowMat, tunnelMat });

    useFrame((state) => {
        if (worldWeight(2) <= 0) return;
        const { tmpEuler, tmpQ, glowMat, tunnelMat } = live.current;
        const { camera } = worldRef.current;
        const time = state.clock.elapsedTime;
        const a = motion.rings;
        const dive = easeInOutCubic(motion.dive);
        const px = motion.pointerSmooth.x;
        const py = motion.pointerSmooth.y;

        // camera: approach, then dive through the rings
        const cam = camera as THREE.PerspectiveCamera;
        cam.position.set(px * 0.6 * (1 - dive), py * 0.4 * (1 - dive), lerp(lerp(13, 10.5, easeOutCubic(a)), -3, dive));
        cam.lookAt(0, 0, -6);
        cam.fov = fitFov(lerp(40, 100, dive * dive), cam.aspect);
        cam.updateProjectionMatrix();

        // segments assemble from the scattered debris
        segments.forEach((s, i) => {
            const m = meshes.current[i];
            if (!m) return;
            const p = easeOutCubic(clamp((a - s.delay) / 0.55));
            m.position.copy(s.start).multiplyScalar(1 - p);
            tmpQ.a.setFromEuler(s.startRot);
            tmpQ.b.identity();
            m.quaternion.copy(tmpQ.a).slerp(tmpQ.b, p);
        });

        // rings: gimbal-like tumble that settles face-on, then spin
        ringGroups.current.forEach((g, ri) => {
            if (!g) return;
            const settle = smoothstep(0.35, 1, a);
            const dir = ri % 2 ? -1 : 1;
            tmpEuler.set((1 - settle) * (0.9 + ri * 0.5) * Math.sin(time * 0.3 + ri), (1 - settle) * (1.2 - ri * 0.4), time * 0.15 * dir * (1 + ri * 0.6) + a * Math.PI * dir);
            g.rotation.copy(tmpEuler);
            g.position.z = -dive * ri * 1.2;
        });
        if (rootRef.current) {
            rootRef.current.rotation.x = py * 0.25 * (1 - dive);
            rootRef.current.rotation.y = px * 0.35 * (1 - dive);
        }

        // glowing core
        const coreOn = smoothstep(0.4, 0.95, a);
        if (coreRef.current) {
            coreRef.current.rotation.y = time * 0.4;
            coreRef.current.rotation.x = time * 0.23;
            coreRef.current.scale.setScalar(lerp(0.2, 1, coreOn) * (1 + dive * 2.5) * (1 + Math.sin(time * 2) * 0.03));
        }
        if (coreMat.current) coreMat.current.opacity = coreOn;
        glowMat.uniforms.uStrength.value = coreOn * (0.8 + dive * 2.2);
        if (pointLight.current) pointLight.current.intensity = coreOn * 7 + dive * 25;
        tunnelMat.uniforms.uTime.value = time;
        tunnelMat.uniforms.uDive.value = smoothstep(0.0, 0.5, dive) + a * 0.15;
    });

    return createPortal(
        <>
            <hemisphereLight args={['#e4e9f0', '#4f5764', 0.7]} />
            <directionalLight position={[-5, 6, 8]} intensity={1.5} />
            <pointLight ref={pointLight} position={[0, 0, 0.5]} color="#e8f0ff" distance={9} decay={1.6} />

            <group ref={rootRef}>
                {RINGS.map((_, ri) => (
                    <group
                        key={ri}
                        ref={(el) => {
                            ringGroups.current[ri] = el;
                        }}
                    >
                        {segments.map((s, i) =>
                            s.ring === ri ? (
                                <mesh
                                    key={i}
                                    geometry={s.geometry}
                                    ref={(el) => {
                                        meshes.current[i] = el;
                                    }}
                                >
                                    <meshStandardMaterial side={THREE.DoubleSide} color="#a5aebb" roughness={0.42} metalness={0.2} />
                                </mesh>
                            ) : null,
                        )}
                    </group>
                ))}
                <points ref={coreRef} geometry={core}>
                    <pointsMaterial ref={coreMat} color={[2, 2.1, 2.3]} size={0.035} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
                </points>
                <mesh material={glowMat} position={[0, 0, 0.1]}>
                    <planeGeometry args={[5, 5]} />
                </mesh>
            </group>

            <mesh material={tunnelMat} position={[0, 0, -10]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[5.5, 5.5, 36, 48, 1, true]} />
            </mesh>
        </>,
        scene,
    );
}

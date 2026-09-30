'use client';

import { useEffect, useMemo, useRef } from 'react';
import { createPortal, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

import { motion, worldWeight } from '../store';
import { clamp, damp, easeInOutCubic, easeOutCubic, fbm2, fitFov, lerp, ridged2, rng, smoothstep } from '../utils/math';

import Snow from './Snow';
import { createSnowMaterial } from './snowMaterial';
import useWorld from './useWorld';

const R = 1.7; // dome radius
const TH = 0.34; // wall thickness
const ENTRANCE = 0.55; // entrance direction (radians around Y)
const FOG = '#c3cad4';

type Brick = {
    pos: THREE.Vector3;
    quat: THREE.Quaternion;
    scale: THREE.Vector3;
    normal: THREE.Vector3;
    h01: number;
    rand: number;
    start: THREE.Vector3;
    startQuat: THREE.Quaternion;
    spinAxis: THREE.Vector3;
    fly: THREE.Vector3;
};

// ─── Igloo layout ───────────────────────────────────────────────────────────
function buildBricks(): Brick[] {
    const r = rng(7);
    const bricks: Omit<Brick, 'start' | 'startQuat' | 'spinAxis' | 'fly' | 'rand'>[] = [];
    const m = new THREE.Matrix4();
    const up = new THREE.Vector3(0, 1, 0);

    const add = (pos: THREE.Vector3, x: THREE.Vector3, z: THREE.Vector3, scale: THREE.Vector3) => {
        const y = new THREE.Vector3().crossVectors(z, x).normalize();
        m.makeBasis(x, y, z);
        bricks.push({ pos, quat: new THREE.Quaternion().setFromRotationMatrix(m), scale, normal: z.clone(), h01: clamp(pos.y / R) });
    };

    // dome rings
    const rows = 8;
    const phiMax = 1.38;
    const rowH = phiMax / rows;
    for (let row = 0; row < rows; row++) {
        const phi = (row + 0.5) * rowH;
        const ringR = (R - TH * 0.5) * Math.cos(phi);
        const circ = Math.PI * 2 * R * Math.cos(phi);
        const n = Math.max(5, Math.round(circ / 0.64));
        const w = circ / n;
        for (let k = 0; k < n; k++) {
            const theta = ((k + (row % 2) * 0.5) / n) * Math.PI * 2;
            // leave an opening where the tunnel meets the dome
            let dTheta = Math.abs(theta - ENTRANCE) % (Math.PI * 2);
            dTheta = Math.min(dTheta, Math.PI * 2 - dTheta);
            if (row < 3 && dTheta < 0.34) continue;
            const pos = new THREE.Vector3(ringR * Math.sin(theta), (R - TH * 0.5) * Math.sin(phi), ringR * Math.cos(theta));
            const normal = new THREE.Vector3(Math.cos(phi) * Math.sin(theta), Math.sin(phi), Math.cos(phi) * Math.cos(theta));
            const east = new THREE.Vector3(Math.cos(theta), 0, -Math.sin(theta));
            add(pos, east, normal, new THREE.Vector3(w * 0.9, R * rowH * 0.86, TH));
        }
    }
    // cap
    add(new THREE.Vector3(0, R - TH * 0.35, 0), new THREE.Vector3(1, 0, 0), up.clone(), new THREE.Vector3(0.62, 0.62, TH * 0.8));

    // entrance tunnel (arch extruded along ENTRANCE)
    const axis = new THREE.Vector3(Math.sin(ENTRANCE), 0, Math.cos(ENTRANCE));
    const right = new THREE.Vector3(Math.cos(ENTRANCE), 0, -Math.sin(ENTRANCE));
    const ra = 0.66;
    const wall = 0.26;
    const slices = 3;
    const sliceL = 0.42;
    for (let s = 0; s < slices; s++) {
        const along = R - 0.35 + (s + 0.5) * sliceL;
        const segs = 7;
        for (let k = 0; k < segs; k++) {
            const a = ((k + 0.5) / segs) * Math.PI;
            const pos = axis
                .clone()
                .multiplyScalar(along)
                .addScaledVector(right, Math.cos(a) * ra)
                .add(new THREE.Vector3(0, wall + Math.sin(a) * ra, 0));
            const n = right
                .clone()
                .multiplyScalar(Math.cos(a))
                .add(new THREE.Vector3(0, Math.sin(a), 0))
                .normalize();
            // x = along the tunnel, y = along the arch, z = outward
            add(pos, axis.clone().negate(), n, new THREE.Vector3(sliceL * 0.92, ((Math.PI * (ra + TH * 0.5)) / segs) * 0.9, TH * 0.9));
        }
        // side walls
        for (const side of [-1, 1]) {
            const n = right.clone().multiplyScalar(side);
            const pos = axis
                .clone()
                .multiplyScalar(along)
                .addScaledVector(right, side * ra)
                .add(new THREE.Vector3(0, wall * 0.5, 0));
            add(pos, axis.clone().multiplyScalar(side), n, new THREE.Vector3(sliceL * 0.92, wall * 0.9, TH * 0.9));
        }
    }

    return bricks.map((b, i) => {
        const rr = rng(100 + i);
        const rand = rr();
        const dir = new THREE.Vector3(rr() - 0.5, rr() * 0.8, rr() - 0.5).normalize();
        return {
            ...b,
            rand,
            start: b.pos
                .clone()
                .addScaledVector(dir, 5 + rr() * 8)
                .add(new THREE.Vector3(0, 2, 0)),
            startQuat: new THREE.Quaternion().setFromEuler(new THREE.Euler(rr() * 6, rr() * 6, rr() * 6)),
            spinAxis: new THREE.Vector3(rr() - 0.5, rr() - 0.5, rr() - 0.5).normalize(),
            fly: b.normal
                .clone()
                .multiplyScalar(2 + r() * 5)
                .add(new THREE.Vector3((rr() - 0.5) * 3, 3 + rr() * 7, (rr() - 0.5) * 3)),
        };
    });
}

// ─── Terrain ────────────────────────────────────────────────────────────────
export const terrainHeight = (x: number, z: number) => {
    const r = Math.hypot(x, z);
    const plateau = r < 2.7 ? 0 : -Math.min(Math.pow(r - 2.7, 2) * 0.028, 7);
    const lumps = fbm2(x * 0.16 + 3, z * 0.16) * 1.6 * smoothstep(2.4, 9, r);
    const grain = fbm2(x * 1.4, z * 1.4, 3) * 0.08 * smoothstep(2.0, 3.5, r);
    const mountains = ridged2(x * 0.03 + 7, z * 0.03 + 2) * 34 * smoothstep(12, 60, r);
    return plateau + lumps + grain + mountains;
};

function buildTerrain() {
    const seg = 280;
    const geo = new THREE.PlaneGeometry(2, 2, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getZ(i);
        // denser near the igloo, sparse at the horizon
        const x = u * (Math.abs(u) * 150 + 10);
        const z = v * (Math.abs(v) * 150 + 10);
        pos.setXYZ(i, x, terrainHeight(x, z), z);
    }
    geo.computeVertexNormals();
    const nrm = geo.attributes.normal as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const snow = new THREE.Color('#c9d0da');
    const rock = new THREE.Color('#6b7280');
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
        const slope = 1 - nrm.getY(i);
        const n = fbm2(pos.getX(i) * 0.3, pos.getZ(i) * 0.3, 3);
        c.copy(snow).lerp(rock, clamp(smoothstep(0.18, 0.55, slope + n * 0.15)));
        colors.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
}

// ─── Intro network (loader wireframe) ───────────────────────────────────────
function buildNetwork() {
    const r = rng(42);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 160; i++) {
        const v = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(2.6 + r() * 9);
        v.y = v.y * 0.7 + 1;
        pts.push(v);
    }
    const seg: number[] = [];
    pts.forEach((p, i) => {
        const near = pts
            .map((q, j) => ({ j, d: p.distanceTo(q) }))
            .filter((o) => o.j !== i)
            .sort((a, b) => a.d - b.d)
            .slice(0, 3);
        near.forEach(({ j }) => seg.push(p.x, p.y, p.z, pts[j].x, pts[j].y, pts[j].z));
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
    const nodes = new THREE.BufferGeometry().setFromPoints(pts);
    return { lines: g, nodes };
}

const HERO_POS = new THREE.Vector3(0.6, 2.9, 12.6);
const HERO_TARGET = new THREE.Vector3(0.25, 1.15, 0);
const INTRO_POS = new THREE.Vector3(-4.2, 1.6, 4.6);
const RISE_POS = new THREE.Vector3(0.2, 7.2, 3.6);
const RISE_TARGET = new THREE.Vector3(0, 1.1, 0);

export default function IglooWorld({ env }: { env: THREE.Texture }) {
    const fog = useMemo(() => new THREE.FogExp2(FOG, 0.03), []);
    const { scene, ref: worldRef } = useWorld(0, { fov: 30, background: FOG, fog, environment: env, environmentIntensity: 0.35 });

    const bricks = useMemo(() => buildBricks(), []);
    const terrain = useMemo(() => buildTerrain(), []);
    const network = useMemo(() => buildNetwork(), []);
    const brickGeo = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 3, 0.09), []);
    const brickMat = useMemo(() => createSnowMaterial({ color: '#a9b1bd', roughness: 0.9, metalness: 0, bumpScale: 1.6, bumpStrength: 0.05, instanced: true }), []);
    const groundMat = useMemo(() => createSnowMaterial({ vertexColors: true, roughness: 1, metalness: 0, bumpScale: 0.45, bumpStrength: 0.09 }), []);

    const meshRef = useRef<THREE.InstancedMesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const tunnelGlowRef = useRef<THREE.Mesh>(null);
    const netRef = useRef<THREE.Group>(null);
    const lineMat = useRef<THREE.LineBasicMaterial>(null);
    const nodeMat = useRef<THREE.PointsMaterial>(null);
    const wireMat = useRef<THREE.MeshBasicMaterial>(null);
    const lightRef = useRef<THREE.DirectionalLight>(null);

    const tmp = useMemo(
        () => ({
            m: new THREE.Matrix4(),
            p: new THREE.Vector3(),
            q: new THREE.Quaternion(),
            q2: new THREE.Quaternion(),
            s: new THREE.Vector3(),
            c: new THREE.Color(),
            ray: new THREE.Raycaster(),
            ndc: new THREE.Vector2(),
            hit: new THREE.Vector3(),
            target: new THREE.Vector3(),
            hover: new Float32Array(bricks.length),
            hoverAmt: 0,
        }),
        [bricks.length],
    );
    const live = useRef({ tmp, fog });

    useEffect(() => {
        const mesh = meshRef.current;
        if (!mesh) return;
        const white = new THREE.Color('#ffffff');
        for (let i = 0; i < bricks.length; i++) mesh.setColorAt(i, white);
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        const light = lightRef.current;
        if (light) {
            light.target.position.set(0, 0, 0);
            worldRef.current.scene.add(light.target);
        }
    }, [bricks.length, worldRef]);

    useFrame((state, delta) => {
        const weight = worldWeight(0);
        if (weight <= 0 && motion.intro >= 1) return;
        const mesh = meshRef.current;
        if (!mesh) return;
        const { tmp, fog } = live.current;
        const { camera } = worldRef.current;
        const time = state.clock.elapsedTime;
        const intro = motion.intro;
        const explode = motion.explode;

        // ── camera ────────────────────────────────────────────────────────
        const ei = easeInOutCubic(clamp((intro - 0.25) / 0.75));
        const rise = easeInOutCubic(motion.heroCam);
        const px = motion.pointerSmooth.x;
        const py = motion.pointerSmooth.y;
        tmp.p.copy(INTRO_POS).lerp(HERO_POS, ei).lerp(RISE_POS, rise);
        tmp.target.copy(HERO_TARGET).lerp(RISE_TARGET, rise);
        camera.position.set(tmp.p.x + px * 0.55, tmp.p.y + py * 0.3 + Math.sin(time * 0.3) * 0.04, tmp.p.z);
        camera.lookAt(tmp.target);
        (camera as THREE.PerspectiveCamera).fov = fitFov(lerp(lerp(38, 30, ei), 44, rise), (camera as THREE.PerspectiveCamera).aspect);
        (camera as THREE.PerspectiveCamera).updateProjectionMatrix();

        fog.density = lerp(lerp(0.2, 0.021, clamp(intro * 1.4)), 0.06, explode);

        // ── pointer → dome hit (analytic ray/sphere) ─────────────────────────
        tmp.ndc.set(motion.pointer.x, motion.pointer.y);
        tmp.ray.setFromCamera(tmp.ndc, camera);
        const o = tmp.ray.ray.origin;
        const d = tmp.ray.ray.direction;
        const b = o.dot(d);
        const c = o.lengthSq() - R * R;
        const disc = b * b - c;
        const hasHit = motion.hasPointer && disc > 0 && intro > 0.95 && explode < 0.05;
        if (hasHit) tmp.hit.copy(o).addScaledVector(d, -b - Math.sqrt(disc));
        tmp.hoverAmt = damp(tmp.hoverAmt, hasHit ? 1 : 0, 5, delta);

        // ── bricks ───────────────────────────────────────────────────────
        for (let i = 0; i < bricks.length; i++) {
            const br = bricks[i];

            // intro: fly in bottom → top
            const delayIn = br.h01 * 0.5 + br.rand * 0.14;
            const pin = easeOutCubic(clamp((intro - 0.12 - delayIn * 0.5) / 0.42));
            tmp.p.copy(br.start).lerp(br.pos, pin);
            tmp.q.copy(br.startQuat).slerp(br.quat, pin);

            // hover: lift bricks near the cursor
            const hw = hasHit ? smoothstep(0.95, 0.0, br.pos.distanceTo(tmp.hit)) : 0;
            tmp.hover[i] = damp(tmp.hover[i], hw, 8, delta);
            tmp.p.addScaledVector(br.normal, tmp.hover[i] * 0.16);

            // scroll: explode top → bottom
            const delayOut = (1 - br.h01) * 0.42 + br.rand * 0.12;
            const pe = clamp((explode - delayOut) / 0.46);
            if (pe > 0) {
                const e = pe * pe * (3 - 2 * pe);
                tmp.p.addScaledVector(br.fly, e);
                tmp.q2.setFromAxisAngle(br.spinAxis, e * (2 + br.rand * 4));
                tmp.q.premultiply(tmp.q2);
            }

            tmp.s.copy(br.scale).multiplyScalar(pin < 0.02 ? 0.0001 : lerp(0.6, 1, pin));
            tmp.m.compose(tmp.p, tmp.q, tmp.s);
            mesh.setMatrixAt(i, tmp.m);
            const glow = 1 + tmp.hover[i] * 1.4;
            tmp.c.setRGB(glow, glow, glow * 1.02);
            mesh.setColorAt(i, tmp.c);
        }
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

        // inner glow swells as the shell opens
        const glowScale = lerp(0.2, 1, easeOutCubic(clamp((intro - 0.35) / 0.4))) * (1 + explode * 0.25);
        // once the shell is gone the glow becomes a core that lifts off the ground
        const lift = easeInOutCubic(clamp((explode - 0.25) / 0.75));
        glowRef.current?.scale.setScalar(glowScale * lerp(1, 0.32, lift));
        glowRef.current?.position.set(0, lift * 1.1, 0);
        tunnelGlowRef.current?.scale.setScalar((clamp((intro - 0.5) / 0.3) + 0.0001) * (1 - smoothstep(0, 0.35, explode)) + 0.0001);
        const gm = glowRef.current?.material as THREE.MeshBasicMaterial | undefined;
        if (gm) gm.color.setScalar(3.2 + explode * 5 + tmp.hoverAmt * 0.8);

        // intro network fades out
        const net = 1 - smoothstep(0.25, 0.75, intro);
        if (netRef.current) {
            netRef.current.visible = net > 0.001;
            netRef.current.rotation.y = time * 0.05;
            netRef.current.scale.setScalar(lerp(1.35, 1, easeOutCubic(intro)));
        }
        if (lineMat.current) lineMat.current.opacity = net * 0.65;
        if (nodeMat.current) nodeMat.current.opacity = net;
        if (wireMat.current) wireMat.current.opacity = net * 0.35;
    });

    return createPortal(
        <>
            <hemisphereLight args={['#dfe6ef', '#5d6574', 0.9]} />
            <directionalLight
                ref={lightRef}
                position={[-7, 9, 5]}
                intensity={2.3}
                color="#fbfcff"
                castShadow
                shadow-mapSize={[1024, 1024]}
                shadow-bias={-0.0004}
                shadow-normalBias={0.02}
                shadow-camera-left={-6}
                shadow-camera-right={6}
                shadow-camera-top={6}
                shadow-camera-bottom={-6}
                shadow-camera-near={1}
                shadow-camera-far={30}
            />

            <mesh geometry={terrain} material={groundMat} receiveShadow />

            <instancedMesh ref={meshRef} args={[brickGeo, brickMat, bricks.length]} castShadow receiveShadow frustumCulled={false} />

            {/* light leaking through the brick seams */}
            <mesh ref={glowRef} position={[0, 0, 0]}>
                <sphereGeometry args={[R - TH * 0.62, 48, 32]} />
                <meshBasicMaterial color={[2.4, 2.4, 2.5]} toneMapped={false} />
            </mesh>
            <group rotation={[0, ENTRANCE, 0]}>
                <mesh ref={tunnelGlowRef} position={[0, 0.26, R + 0.28]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.66 - TH * 0.55, 0.66 - TH * 0.55, 1.26, 24, 1]} />
                    <meshBasicMaterial color={[2.6, 2.6, 2.7]} toneMapped={false} />
                </mesh>
            </group>

            <group ref={netRef} position={[0, 0.2, 0]}>
                <lineSegments geometry={network.lines}>
                    <lineBasicMaterial ref={lineMat} color="#ffffff" transparent opacity={0.6} depthWrite={false} />
                </lineSegments>
                <points geometry={network.nodes}>
                    <pointsMaterial ref={nodeMat} color="#ffffff" size={0.09} transparent depthWrite={false} />
                </points>
                <mesh position={[0, 0.8, 0]}>
                    <icosahedronGeometry args={[R * 1.25, 3]} />
                    <meshBasicMaterial ref={wireMat} color="#ffffff" wireframe transparent opacity={0.3} depthWrite={false} />
                </mesh>
            </group>

            <Snow count={2200} size={[26, 14, 26]} center={[0, 5, 0]} speed={0.55} visible={() => worldWeight(0)} />
        </>,
        scene,
    );
}

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

import { clamp, fbm2, ridged2, rng, smoothstep } from '../kit/math';

/**
 * Teaching copy of the procedural igloo in canvas/IglooWorld.tsx.
 * Same layout maths, trimmed of the effects the demos add back one by one.
 */
export const R = 1.7; // dome radius
export const TH = 0.34; // wall thickness
export const ENTRANCE = 0.55; // entrance direction (radians around Y)

export type Brick = {
    pos: THREE.Vector3;
    quat: THREE.Quaternion;
    scale: THREE.Vector3;
    normal: THREE.Vector3;
    h01: number; // height on the dome, 0 bottom → 1 top
    rand: number; // personal random 0..1
    start: THREE.Vector3; // where it flies in from
    startQuat: THREE.Quaternion;
    spinAxis: THREE.Vector3;
    fly: THREE.Vector3; // where it flies to when exploding
};

export function buildBricks(): Brick[] {
    const bricks: Omit<Brick, 'start' | 'startQuat' | 'spinAxis' | 'fly' | 'rand'>[] = [];
    const m = new THREE.Matrix4();
    const add = (pos: THREE.Vector3, x: THREE.Vector3, z: THREE.Vector3, scale: THREE.Vector3) => {
        const y = new THREE.Vector3().crossVectors(z, x).normalize();
        m.makeBasis(x, y, z); // brick faces outward along its normal
        bricks.push({ pos, quat: new THREE.Quaternion().setFromRotationMatrix(m), scale, normal: z.clone(), h01: clamp(pos.y / R) });
    };

    // dome: 8 rings of bricks, fewer per ring as the dome narrows
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
            const theta = ((k + (row % 2) * 0.5) / n) * Math.PI * 2; // every other row offset by half a brick
            let dTheta = Math.abs(theta - ENTRANCE) % (Math.PI * 2);
            dTheta = Math.min(dTheta, Math.PI * 2 - dTheta);
            if (row < 3 && dTheta < 0.34) continue; // leave a doorway
            const pos = new THREE.Vector3(ringR * Math.sin(theta), (R - TH * 0.5) * Math.sin(phi), ringR * Math.cos(theta));
            const normal = new THREE.Vector3(Math.cos(phi) * Math.sin(theta), Math.sin(phi), Math.cos(phi) * Math.cos(theta));
            const east = new THREE.Vector3(Math.cos(theta), 0, -Math.sin(theta));
            add(pos, east, normal, new THREE.Vector3(w * 0.9, R * rowH * 0.86, TH));
        }
    }
    // cap
    add(new THREE.Vector3(0, R - TH * 0.35, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.62, 0.62, TH * 0.8));

    // entrance tunnel: an arch of bricks extruded along the entrance direction
    const axis = new THREE.Vector3(Math.sin(ENTRANCE), 0, Math.cos(ENTRANCE));
    const right = new THREE.Vector3(Math.cos(ENTRANCE), 0, -Math.sin(ENTRANCE));
    const ra = 0.66;
    const wall = 0.26;
    const sliceL = 0.42;
    for (let s = 0; s < 3; s++) {
        const along = R - 0.35 + (s + 0.5) * sliceL;
        for (let k = 0; k < 7; k++) {
            const a = ((k + 0.5) / 7) * Math.PI;
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
            add(pos, axis.clone().negate(), n, new THREE.Vector3(sliceL * 0.92, ((Math.PI * (ra + TH * 0.5)) / 7) * 0.9, TH * 0.9));
        }
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

    // personality: a seeded random per brick decides its start, spin and flight
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
                .multiplyScalar(2 + rr() * 5)
                .add(new THREE.Vector3((rr() - 0.5) * 3, 3 + rr() * 7, (rr() - 0.5) * 3)),
        };
    });
}

export function createBrickMesh(bricks: Brick[], color = '#5c6470') {
    const geo = new RoundedBoxGeometry(1, 1, 1, 3, 0.09);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0 });
    const mesh = new THREE.InstancedMesh(geo, mat, bricks.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    const m = new THREE.Matrix4();
    bricks.forEach((b, i) => {
        m.compose(b.pos, b.quat, b.scale);
        mesh.setMatrixAt(i, m);
        mesh.setColorAt(i, new THREE.Color(1, 1, 1));
    });
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
}

/** Plateau for the igloo, noisy lumps around it, ridged mountains far away. */
export const terrainHeight = (x: number, z: number, mountains = 1) => {
    const r = Math.hypot(x, z);
    const plateau = r < 2.7 ? 0 : -Math.min(Math.pow(r - 2.7, 2) * 0.028, 7);
    const lumps = fbm2(x * 0.16 + 3, z * 0.16) * 1.6 * smoothstep(2.4, 9, r);
    const grain = fbm2(x * 1.4, z * 1.4, 3) * 0.08 * smoothstep(2.0, 3.5, r);
    const peaks = ridged2(x * 0.03 + 7, z * 0.03 + 2) * 34 * smoothstep(12, 60, r) * mountains;
    return plateau + lumps + grain + peaks;
};

export function createTerrain(seg = 160, mountains = 1) {
    const geo = new THREE.PlaneGeometry(2, 2, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getZ(i);
        // non-linear spacing: dense near the igloo, sparse at the horizon
        const x = u * (Math.abs(u) * 150 + 10);
        const z = v * (Math.abs(v) * 150 + 10);
        pos.setXYZ(i, x, terrainHeight(x, z, mountains), z);
    }
    geo.computeVertexNormals();
    // snow on flat ground, rock on steep slopes
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
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
    mesh.receiveShadow = true;
    return mesh;
}

export const FOG = '#c3cad4';

/** The camera keyframes from IglooWorld.tsx. */
export const CAM = {
    INTRO_POS: new THREE.Vector3(-4.2, 1.6, 4.6),
    HERO_POS: new THREE.Vector3(0.6, 2.9, 12.6),
    HERO_TARGET: new THREE.Vector3(0.25, 1.15, 0),
    RISE_POS: new THREE.Vector3(0.2, 7.2, 3.6),
    RISE_TARGET: new THREE.Vector3(0, 1.1, 0),
};

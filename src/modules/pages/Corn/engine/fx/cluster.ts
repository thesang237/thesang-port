import * as THREE from 'three';

import { ADDITIVE, type DofController, rng } from './particles';

/**
 * Molecules beside the kernel (reference `Jf`, "kernelClusterFront/Back"): a column of nodes, each
 * held to a slowly turning anchor by a spring with rest length 1 and pulled gently toward the
 * pointer, so the whole column leans after the cursor. Every node carries 2–4 satellites on a ring
 * that spins faster while the node moves; dotted links join node and satellites.
 */

export function dotMaterial(o: { color1: string; color2?: string; size: number; opacity: number; dof: DofController; glow?: boolean }) {
    return new THREE.ShaderMaterial({
        defines: o.glow ? { GLOW: '' } : {},
        uniforms: {
            color1: { value: new THREE.Color(o.color1) },
            color2: { value: new THREE.Color(o.color2 ?? o.color1) },
            size: { value: o.size },
            opacity: { value: o.opacity },
            dofAmount: { value: o.dof.amount },
            dofFocus: { value: o.dof.focus },
            resolution: { value: new THREE.Vector2(1920, 994) },
            uDpr: { value: 1 },
            time: { value: 0 },
            shapeSides: { value: 0 },
        },
        vertexShader: /* glsl */ `
            attribute float id;
            uniform float size;
            uniform vec2 dofAmount;
            uniform vec3 dofFocus;
            uniform vec2 resolution;
            uniform float uDpr;
            varying float vId;
            varying float vSize;
            void main() {
                vId = id;
                vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                vSize = smoothstep(dofAmount.x, dofAmount.y, distance(p.xyz, dofFocus));
                gl_Position = p;
                gl_PointSize = size * (resolution.y / 800.0) * uDpr;
            }`,
        fragmentShader: /* glsl */ `
            uniform vec3 color1, color2;
            uniform float opacity;
            varying float vId;
            varying float vSize;
            void main() {
                vec3 color = mod(vId, 4.0) == 0.0 ? color2 : color1;
                float d = length(gl_PointCoord - 0.5) * 2.0;
                #ifdef GLOW
                float a = pow(max(0.0, 1.0 - d), 2.5) * 0.35;
                #else
                float r = 0.36;
                float a = 1.0 - smoothstep(r - fwidth(d) * 1.5, r, d);
                #endif
                float distanceAlpha = mix(1.0, 0.4, smoothstep(0.0, 0.2, vSize));
                gl_FragColor = vec4(color * distanceAlpha, pow(max(a * opacity, 0.0), 2.2));
            }`,
        ...ADDITIVE,
    });
}

type Node = {
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    origin: THREE.Vector3;
    rot: THREE.Quaternion;
    spin: THREE.Quaternion;
    sats: { offset: THREE.Vector3; pos: THREE.Vector3 }[];
};

export type MoleculeOpts = {
    height: number;
    width: number;
    rows: number;
    columns: number;
    perLink: number;
    clusterRadius: number;
    spring: number;
    damping: number;
    color1: string;
    color2: string;
    size: number;
    opacity: number;
    dof: DofController;
    seed?: number;
};

const ID_Q = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
const q = new THREE.Quaternion();

export class Molecules {
    readonly object = new THREE.Group();
    private nodes: Node[] = [];
    private ptr = new THREE.Vector3();
    private pts: THREE.Points;
    private glow: THREE.Points;
    private links: THREE.Points;
    private linkPairs: [Node, { pos: THREE.Vector3 }][] = [];
    private linkT: Float32Array;
    readonly materials: THREE.ShaderMaterial[];

    constructor(private o: MoleculeOpts) {
        const rand = rng(o.seed ?? 7);
        const h = o.height / o.rows;
        const f = o.width / o.columns;
        for (let t = 0; t < o.columns; t++)
            for (let r = 0; r < o.rows; r++)
                for (let c = 0; c < o.columns; c++) {
                    const u = ((c % 2) * Math.PI * 2) / 4;
                    const x = t * f + f / 2 - o.width / 2 + f * Math.cos(u) * 0.1;
                    const y = -r * h - h / 2 + o.height / 2 + h * Math.sin(u) * 0.4;
                    const z = c * f + f / 2 - o.width / 2 + f * Math.cos(u) * 0.1;
                    const n = [2, 3, 3, 4][Math.floor(rand() * 4)];
                    const sats = Array.from({ length: n }, (_, e) => {
                        const a = (e / (n - 1)) * Math.PI * 2;
                        return { offset: new THREE.Vector3(Math.cos(a) * o.clusterRadius, Math.sin(a) * o.clusterRadius, o.clusterRadius / 3), pos: new THREE.Vector3() };
                    });
                    this.nodes.push({
                        pos: new THREE.Vector3(x, y, z),
                        vel: new THREE.Vector3(),
                        origin: new THREE.Vector3(x, y, z),
                        rot: new THREE.Quaternion(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1, 1).normalize(),
                        spin: new THREE.Quaternion(rand() * 0.002 - 0.001, rand() * 0.002 - 0.001, rand() * 0.002 - 0.001, 1).normalize(),
                        sats,
                    });
                }
        const count = this.nodes.reduce((s, n) => s + 1 + n.sats.length, 0);
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
        g.setAttribute(
            'id',
            new THREE.BufferAttribute(
                new Float32Array(count).map((_, i) => i),
                1,
            ),
        );
        const dot = dotMaterial({ color1: o.color1, color2: o.color2, size: o.size, opacity: o.opacity, dof: o.dof });
        const glow = dotMaterial({ color1: o.color1, color2: o.color2, size: o.size * 2, opacity: 1.2 * o.opacity, dof: o.dof, glow: true });
        this.pts = new THREE.Points(g, dot);
        this.glow = new THREE.Points(g, glow);

        // dotted links: perLink dots spread along each node → satellite segment
        this.nodes.forEach((n) => n.sats.forEach((s) => this.linkPairs.push([n, s])));
        const L = this.linkPairs.length * o.perLink;
        this.linkT = new Float32Array(L);
        for (let i = 0; i < L; i++) {
            const k = i % o.perLink;
            this.linkT[i] = THREE.MathUtils.clamp((k + rand() - 0.5) / (o.perLink - 1), 0, 1);
        }
        const lg = new THREE.BufferGeometry();
        lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(L * 3), 3));
        lg.setAttribute(
            'id',
            new THREE.BufferAttribute(
                new Float32Array(L).map((_, i) => i * 4 + 1),
                1,
            ),
        );
        const linkMat = dotMaterial({ color1: '#ffffff', size: 6, opacity: 0.7, dof: o.dof });
        this.links = new THREE.Points(lg, linkMat);
        for (const p of [this.glow, this.links, this.pts]) {
            p.frustumCulled = false;
            this.object.add(p);
        }
        this.materials = [dot, glow, linkMat];
        this.write();
    }

    set opacity(v: number) {
        this.materials[0].uniforms.opacity.value = v * this.o.opacity;
        this.materials[1].uniforms.opacity.value = 1.2 * v * this.o.opacity;
        this.materials[2].uniforms.opacity.value = 0.7 * v;
    }

    /** One 60 Hz step. `ptr` is the pointer in −1..1 (y up). */
    step(ptr: THREE.Vector2) {
        const o = this.o;
        this.ptr.set(0.4 * ptr.x, 0.4 * ptr.y, 0);
        for (const n of this.nodes) {
            n.origin.applyAxisAngle(UP, 0.001);
            // pointer spring (rest 0) + anchor spring (rest 1), both damped
            tmp.copy(this.ptr)
                .sub(n.pos)
                .multiplyScalar(0.5 * o.spring);
            tmp2.copy(n.origin).sub(n.pos);
            const d = tmp2.length();
            if (d > 1e-5) tmp.addScaledVector(tmp2, ((d - 1) / d) * 5 * o.spring);
            tmp.addScaledVector(n.vel, -10 * o.damping);
            n.vel.add(tmp).multiplyScalar(0.86);
            n.pos.add(n.vel);
            q.copy(ID_Q).slerp(n.spin, Math.min(1, 0.2 + 300 * n.vel.length()));
            n.rot.multiply(q).normalize();
            for (const s of n.sats) s.pos.copy(s.offset).applyQuaternion(n.rot).add(n.pos);
        }
        this.write();
    }

    private write() {
        const a = this.pts.geometry.attributes.position.array as Float32Array;
        let i = 0;
        for (const n of this.nodes) {
            a.set([n.pos.x, n.pos.y, n.pos.z], i);
            i += 3;
            for (const s of n.sats) {
                a.set([s.pos.x, s.pos.y, s.pos.z], i);
                i += 3;
            }
        }
        this.pts.geometry.attributes.position.needsUpdate = true;
        const la = this.links.geometry.attributes.position.array as Float32Array;
        const per = this.o.perLink;
        this.linkPairs.forEach(([n, s], k) => {
            for (let j = 0; j < per; j++) {
                const t = this.linkT[k * per + j];
                const b = (k * per + j) * 3;
                la[b] = n.pos.x + (s.pos.x - n.pos.x) * t;
                la[b + 1] = n.pos.y + (s.pos.y - n.pos.y) * t;
                la[b + 2] = n.pos.z + (s.pos.z - n.pos.z) * t;
            }
        });
        this.links.geometry.attributes.position.needsUpdate = true;
    }

    tick(h: number, dpr: number) {
        for (const m of this.materials) {
            m.uniforms.resolution.value.y = h;
            m.uniforms.uDpr.value = dpr;
        }
    }
}

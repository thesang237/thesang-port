import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

import { helixSpline } from './helix';
import { ADDITIVE, type DofController, polyMaterial, rng } from './particles';

/**
 * "Computers cut down the contenders" (reference `zc`): candidate nodes on two helices that narrow
 * toward the top like a funnel, plus a few stragglers below; every pair closer than 1.8 is linked by a
 * string of soft beads. Nodes breathe outward on 3D simplex noise (more near the top), and the links
 * follow. Teal nodes, every fourth one yellow, each with a soft halo.
 */

const sineIn = (e: number) => 1 + Math.sin((Math.PI / 2) * e - Math.PI / 2);
const quadInOut = (e: number) => (e < 0.5 ? 2 * e * e : 1 - 2 * (1 - e) * (1 - e));

function nodeMaterial(o: { color1: string; color2: string; size: number; dof: DofController; glow?: boolean; opacity?: number }) {
    return new THREE.ShaderMaterial({
        defines: o.glow ? { GLOW: '' } : {},
        uniforms: {
            color1: { value: new THREE.Color(o.color1) },
            color2: { value: new THREE.Color(o.color2) },
            size: { value: o.size },
            opacity: { value: o.opacity ?? 1 },
            dofAmount: { value: o.dof.amount },
            dofFocus: { value: o.dof.focus },
            resolution: { value: new THREE.Vector2(1920, 994) },
            uDpr: { value: 1 },
            time: { value: 0 },
            shapeSides: { value: 0 },
            uFade: { value: 1 },
        },
        vertexShader: /* glsl */ `
            attribute float id;
            uniform float size, uDpr;
            uniform vec2 dofAmount, resolution;
            uniform vec3 dofFocus;
            varying float vId, vSize;
            void main() {
                vId = id;
                vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                vSize = smoothstep(dofAmount.x, dofAmount.y, distance(p.xyz, dofFocus));
                gl_Position = p;
                gl_PointSize = size * (resolution.y / 800.0) * uDpr * mix(1.0, 1.6, vSize);
            }`,
        fragmentShader: /* glsl */ `
            uniform vec3 color1, color2;
            uniform float opacity, uFade;
            varying float vId, vSize;
            void main() {
                vec3 color = mod(vId, 4.0) == 0.0 ? color2 : color1;
                float d = length(gl_PointCoord - 0.5) * 2.0;
                #ifdef GLOW
                float a = pow(max(0.0, 1.0 - d), 3.0) * 0.28;
                #else
                float r = 0.3;
                float a = smoothstep(r, r - mix(0.04, 0.3, vSize), d);
                #endif
                float distanceAlpha = mix(1.0, 0.6, smoothstep(0.0, 0.2, vSize));
                gl_FragColor = vec4(color * distanceAlpha, pow(max(a * opacity * uFade, 0.0), 2.2));
            }`,
        ...ADDITIVE,
    });
}

type Node = { origin: THREE.Vector3; pos: THREE.Vector3 };

export class Network {
    readonly object = new THREE.Group();
    private nodes: Node[] = [];
    private links: [Node, Node][] = [];
    private nodePts: THREE.Points;
    private linkPts: THREE.Points;
    private linkT: Float32Array;
    private noise = new SimplexNoise();
    private t = 0;
    private v = new THREE.Vector3();
    readonly mats: THREE.ShaderMaterial[];

    constructor(
        private o: {
            dof: DofController;
            color1: string;
            color2: string;
            linksColor: string;
            size: number;
            amount?: number;
            height?: number;
            radius?: number;
            frequency?: number;
            phase?: number;
            perLink?: number;
            seed?: number;
        },
    ) {
        const rand = rng(o.seed ?? 13);
        const amount = o.amount ?? 14;
        const height = o.height ?? 14;
        const radius = o.radius ?? 2.5;
        const frequency = o.frequency ?? 0.8;
        const phase = o.phase ?? 1;
        for (let t = 0; t < 2; t++) {
            const sp = helixSpline({ height, radius, frequency, crossAt: [], phase: phase + t * Math.PI - 0.6 }, rand);
            for (let i = 0; i < amount; i++) {
                if (i === amount - 3 && t === 0) continue;
                const r = sineIn(i / (amount - 1));
                const p = sp.getPoint(r);
                p.x *= 0.5 * (quadInOut(1 - r) + 1);
                p.x += 1.4 * Math.sin(73.173 * i + rand()) * (1 - r);
                p.z *= 0.5 * (quadInOut(1 - r) + 1);
                p.z += 1.4 * Math.sin(25.5836 * i) * (1 - r);
                this.nodes.push({ origin: p.clone(), pos: p });
            }
        }
        const third = helixSpline({ height, radius, frequency, crossAt: [], phase: 0.7 * Math.PI }, rand);
        const n3 = Math.floor(0.33 * amount);
        for (let i = 0; i < n3 - 1; i++) {
            const p = third.getPoint(i / (n3 - 1));
            p.y -= 1;
            p.x += Math.sin(173.14353 * i + rand());
            p.z += Math.sin(25.72538 * i - rand());
            this.nodes.push({ origin: p.clone(), pos: p });
        }
        const low = helixSpline({ frequency: Math.PI / 2, height: height / 2, radius: 2, crossAt: [], phase: Math.PI / 4 }, rand);
        for (let i = 0; i < n3 - 1; i++) {
            const p = low.getPoint(i / (n3 - 1));
            p.y -= 7;
            p.x += Math.sin(278.14371 * i + rand());
            p.z += Math.sin(123.72894 * i - rand());
            this.nodes.push({ origin: p.clone(), pos: p });
        }
        this.nodes.forEach((a, i) => this.nodes.forEach((b, j) => j > i && a.pos.distanceTo(b.pos) < 1.8 && this.links.push([a, b])));

        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.nodes.length * 3), 3));
        g.setAttribute(
            'id',
            new THREE.BufferAttribute(
                new Float32Array(this.nodes.length).map((_, i) => i),
                1,
            ),
        );
        const dot = nodeMaterial({ color1: o.color1, color2: o.color2, size: o.size, dof: o.dof });
        const halo = nodeMaterial({ color1: o.color1, color2: o.color2, size: o.size * 2, dof: o.dof, glow: true, opacity: 1.2 });
        this.nodePts = new THREE.Points(g, dot);
        const glow = new THREE.Points(g, halo);

        const per = o.perLink ?? 30;
        const L = this.links.length * per;
        this.linkT = new Float32Array(L);
        for (let i = 0; i < L; i++) this.linkT[i] = THREE.MathUtils.clamp(((i % per) + rand() * 1.6 - 0.8) / (per - 1), 0, 1);
        const lg = new THREE.BufferGeometry();
        lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(L * 3), 3));
        lg.setAttribute(
            'id',
            new THREE.BufferAttribute(
                new Float32Array(L).map((_, i) => i),
                1,
            ),
        );
        lg.setAttribute('t', new THREE.BufferAttribute(new Float32Array(L), 1));
        lg.setAttribute('aOffset', new THREE.BufferAttribute(new Float32Array(L), 1));
        const linkMat = polyMaterial({ color: o.linksColor, size: [20, 50], opacity: 0.8, dof: o.dof });
        this.linkPts = new THREE.Points(lg, linkMat);
        for (const p of [this.linkPts, glow, this.nodePts]) {
            p.frustumCulled = false;
            this.object.add(p);
        }
        this.mats = [dot, halo, linkMat];
        this.write();
    }

    set opacity(v: number) {
        this.mats[0].uniforms.opacity.value = v;
        this.mats[1].uniforms.opacity.value = 1.2 * v;
        this.mats[2].uniforms.opacity.value = 0.8 * v;
    }

    /** dtMs: frame time in ms (the reference adds the frame delta and scales by 1e-5). */
    update(dtMs: number) {
        this.t += dtMs;
        const n = this.t / 1e5;
        this.object.updateMatrixWorld();
        for (const node of this.nodes) {
            this.v.copy(node.origin).applyMatrix4(this.object.matrixWorld).multiplyScalar(0.1);
            const i = this.noise.noise3d(this.v.x + 100 + n, this.v.y + 100 + n, this.v.z + n);
            // breathes most near the top of the funnel (reference: map(y, 0, −10, 1, 0))
            const fall = THREE.MathUtils.clamp(1 + node.origin.y / 10, 0, 1);
            this.v
                .copy(node.origin)
                .normalize()
                .multiplyScalar(1.5 * i * fall);
            node.pos
                .copy(node.origin)
                .addScalar(0.2 * i * fall)
                .add(this.v);
        }
        this.write();
    }

    private write() {
        const a = this.nodePts.geometry.attributes.position.array as Float32Array;
        this.nodes.forEach((n, i) => a.set([n.pos.x, n.pos.y, n.pos.z], i * 3));
        this.nodePts.geometry.attributes.position.needsUpdate = true;
        const la = this.linkPts.geometry.attributes.position.array as Float32Array;
        const per = this.o.perLink ?? 30;
        this.links.forEach(([p, q], k) => {
            for (let j = 0; j < per; j++) {
                const t = this.linkT[k * per + j];
                const b = (k * per + j) * 3;
                la[b] = p.pos.x + (q.pos.x - p.pos.x) * t;
                la[b + 1] = p.pos.y + (q.pos.y - p.pos.y) * t;
                la[b + 2] = p.pos.z + (q.pos.z - p.pos.z) * t;
            }
        });
        this.linkPts.geometry.attributes.position.needsUpdate = true;
    }
}

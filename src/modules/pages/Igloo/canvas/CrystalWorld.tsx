'use client';

import { useMemo, useRef } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { PORTFOLIO, type PortfolioItem } from '../data';
import { hudNodes, motion, useIglooUI, worldWeight } from '../store';
import { HASH, SNOISE } from '../utils/glsl';
import { clamp, damp, fitFov, lerp, rng, smoothstep } from '../utils/math';

import Snow from './Snow';
import useWorld from './useWorld';

const SPACING = 5.2;
const BG = '#bcc3cd';

// ─── Geometry ───────────────────────────────────────────────────────────────
function buildCrystalGeometry(shape: PortfolioItem['shape'], seed: number) {
    let g: THREE.BufferGeometry;
    switch (shape) {
        case 'prism':
            g = new THREE.CylinderGeometry(0.95, 1.1, 2.6, 6, 3);
            g.rotateZ(0.12);
            break;
        case 'cube':
            g = new THREE.BoxGeometry(1.9, 1.9, 1.9, 2, 2, 2);
            g.rotateX(0.55);
            g.rotateZ(0.4);
            break;
        case 'shard':
            g = new THREE.OctahedronGeometry(1.35, 1);
            g.scale(0.8, 1.45, 0.7);
            break;
        default:
            g = new THREE.IcosahedronGeometry(1.25, 1);
            g.scale(0.95, 1.4, 0.85);
    }
    g = g.index ? g.toNonIndexed() : g;
    g.deleteAttribute('normal');
    g.deleteAttribute('uv');

    // jitter shared vertices consistently so faces stay closed
    const r = rng(seed);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const offsets = new Map<string, THREE.Vector3>();
    for (let i = 0; i < pos.count; i++) {
        const key = `${pos.getX(i).toFixed(3)}|${pos.getY(i).toFixed(3)}|${pos.getZ(i).toFixed(3)}`;
        let off = offsets.get(key);
        if (!off) {
            off = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.42);
            // chipped, frosty base
            if (pos.getY(i) < -0.6) off.multiplyScalar(2.2);
            offsets.set(key, off);
        }
        pos.setXYZ(i, pos.getX(i) + off.x, pos.getY(i) + off.y, pos.getZ(i) + off.z);
    }
    g.computeVertexNormals();
    const bary = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) bary[i * 3 + (i % 3)] = 1;
    g.setAttribute('aBary', new THREE.BufferAttribute(bary, 3));
    g.computeBoundingSphere();
    return g;
}

// ─── Logo textures (drawn, no assets) ───────────────────────────────────────
function buildLogo(kind: PortfolioItem['logo']) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    switch (kind) {
        case 'penguin':
            ctx.beginPath();
            ctx.ellipse(128, 150, 62, 78, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(128, 78, 48, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(128, 160, 38, 56, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(110, 74, 7, 0, Math.PI * 2);
            ctx.arc(146, 74, 7, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'ip':
            ctx.lineWidth = 16;
            ctx.strokeRect(46, 56, 164, 144);
            ctx.font = '900 104px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('IP', 128, 132);
            break;
        case 'abstract':
            ctx.lineWidth = 30;
            ctx.beginPath();
            ctx.moveTo(128, 44);
            ctx.lineTo(128, 120);
            ctx.moveTo(60, 200);
            ctx.lineTo(118, 140);
            ctx.moveTo(196, 200);
            ctx.lineTo(138, 140);
            ctx.stroke();
            break;
        default:
            ctx.font = '900 150px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', 128, 136);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.NoColorSpace;
    return tex;
}

// ─── Ice shader ─────────────────────────────────────────────────────────────
const crystalVertex = /* glsl */ `
uniform float uTime;
uniform float uGlitch;
varying vec3 vN;
varying vec3 vWPos;
varying vec3 vObj;
attribute vec3 aBary;
varying vec3 vBary;
varying vec3 vViewObj;
${HASH}
void main() {
    vec3 p = position;
    // horizontal slice glitch (hover / scroll speed)
    float slice = floor(p.y * 9.0 + floor(uTime * 18.0));
    p.x += (hash11(slice) - 0.5) * step(0.62, hash11(slice + 3.1)) * uGlitch * 0.5;
    vObj = p;
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vWPos = wp.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    vViewObj = normalize((inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz - p);
    vBary = aBary;
    gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const crystalFragment = /* glsl */ `
uniform float uTime;
uniform float uHover;
uniform float uFocus;
uniform sampler2D uLogo;
varying vec3 vN;
varying vec3 vWPos;
varying vec3 vObj;
varying vec3 vViewObj;
varying vec3 vBary;
${SNOISE}

vec3 envGrad(vec3 d) {
    float y = d.y * 0.5 + 0.5;
    vec3 c = mix(vec3(0.04, 0.05, 0.075), vec3(0.62, 0.67, 0.75), smoothstep(0.2, 1.0, y));
    // soft window bands → fake caustics
    c += smoothstep(0.75, 1.0, sin(d.x * 7.0 + d.y * 3.0 + uTime * 0.2)) * 0.25;
    return c;
}

void main() {
    vec3 N = normalize(vN);
    if (!gl_FrontFacing) N = -N;
    vec3 V = normalize(cameraPosition - vWPos);
    float ndv = clamp(abs(dot(N, V)), 0.0, 1.0);
    float fres = pow(1.0 - ndv, 2.2);

    vec3 Rr = refract(-V, N, 0.76);
    vec3 Rl = reflect(-V, N);
    vec3 col = envGrad(Rr) * 0.55 + envGrad(Rl) * 0.25 * (0.4 + fres);

    // embedded logo, parallax-shifted to sit inside the ice
    vec2 luv = vObj.xy * 0.55 + 0.5 - vViewObj.xy * 0.22;
    float logo = texture2D(uLogo, clamp(luv, 0.0, 1.0)).r;
    float inside = (1.0 - fres) * smoothstep(-0.6, 0.2, vObj.y + 0.6);
    col = mix(col, vec3(0.03, 0.035, 0.05), logo * 0.85 * inside);
    // thin-film halo around the embedded logo
    float halo = smoothstep(0.0, 0.5, logo) * (1.0 - smoothstep(0.5, 1.0, logo));
    col += (0.5 + 0.5 * cos(6.28318 * (luv.x * 2.0 + uTime * 0.1 + vec3(0.0, 0.33, 0.67)))) * halo * 0.6 * inside;
    // subsurface cloudiness
    float cloud = fbm3(vObj * 1.6 + uTime * 0.05) * 0.5 + 0.5;
    col = mix(col, vec3(0.2, 0.23, 0.29), cloud * 0.35);

    // thin-film iridescence on grazing angles
    vec3 irid = 0.5 + 0.5 * cos(6.28318 * (fres * 1.6 + vObj.y * 0.25 + uTime * 0.03 + vec3(0.0, 0.33, 0.67)));
    col += irid * smoothstep(0.15, 0.75, fres) * (0.28 + uHover * 0.5);

    // facet sparkle
    float spec = pow(max(dot(Rl, normalize(vec3(0.4, 0.85, 0.45))), 0.0), 40.0);
    col += spec * 2.2;
    col += fres * 0.35;
    // bright facet edges
    float edge = min(min(vBary.x, vBary.y), vBary.z);
    float line = 1.0 - smoothstep(0.0, fwidth(edge) * 1.6, edge);
    col += line * (0.45 + uHover * 0.6) * (0.4 + fres);
    // scratched surface
    col += smoothstep(0.82, 1.0, snoise(vObj * vec3(22.0, 1.5, 22.0))) * 0.12;

    // frosted / crushed base
    float frost = smoothstep(-0.2, -1.4, vObj.y) * (0.55 + 0.45 * snoise(vObj * 9.0));
    col = mix(col, vec3(0.74, 0.78, 0.84), clamp(frost, 0.0, 1.0) * 0.8);

    col *= mix(0.75, 1.0, uFocus);
    gl_FragColor = vec4(col, 1.0);
}
`;

// ─── Backdrop: dot grid + drifting cloud ────────────────────────────────────
const backdropFragment = /* glsl */ `
uniform float uTime;
uniform float uScroll;
uniform vec3 uColor;
varying vec2 vUv;
${SNOISE}
void main() {
    vec2 p = vUv * vec2(60.0, 34.0);
    p.y += uScroll * 2.2;
    vec2 g = fract(p) - 0.5;
    float dots = smoothstep(0.07, 0.0, length(g));
    float cloud = fbm3(vec3(vUv * 2.4 + vec2(uTime * 0.01, uScroll * 0.08), uTime * 0.03)) * 0.5 + 0.5;
    vec3 col = uColor * (0.88 + cloud * 0.22);
    col += dots * 0.35 * (0.6 + cloud);
    gl_FragColor = vec4(col, 1.0);
}
`;

export default function CrystalWorld() {
    const fog = useMemo(() => new THREE.Fog(BG, 6, 22), []);
    const { scene, ref: worldRef } = useWorld(1, { fov: 35, background: BG, fog });
    const { size } = useThree();

    const items = useMemo(
        () =>
            PORTFOLIO.map((item, i) => ({
                item,
                geometry: buildCrystalGeometry(item.shape, 11 + i * 7),
                material: new THREE.ShaderMaterial({
                    vertexShader: crystalVertex,
                    fragmentShader: crystalFragment,
                    side: THREE.DoubleSide,
                    uniforms: {
                        uTime: { value: 0 },
                        uHover: { value: 0 },
                        uGlitch: { value: 0 },
                        uFocus: { value: 1 },
                        uLogo: { value: buildLogo(item.logo) },
                    },
                }),
                x: [0.35, -0.55, 0.5, -0.25][i % 4],
                spin: [0.18, -0.14, 0.22, -0.2][i % 4],
            })),
        [],
    );

    const backdrop = useMemo(
        () =>
            new THREE.ShaderMaterial({
                vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
                fragmentShader: backdropFragment,
                uniforms: { uTime: { value: 0 }, uScroll: { value: 0 }, uColor: { value: new THREE.Color(BG) } },
                fog: false,
            }),
        [],
    );

    // tiny HUD tick-lines hanging off each crystal
    const ticks = useMemo(() => {
        const r = rng(3);
        const seg: number[] = [];
        for (let i = 0; i < 9; i++) {
            const a = r() * Math.PI * 2;
            const rad = 1.5 + r() * 0.6;
            const y = (r() - 0.5) * 2.6;
            const x0 = Math.cos(a) * rad;
            const z0 = Math.sin(a) * rad * 0.4;
            seg.push(x0, y, z0, x0 + (r() - 0.5) * 0.9, y + (r() - 0.5) * 0.7, z0);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
        return g;
    }, []);

    const groups = useRef<(THREE.Group | null)[]>([]);
    const tmp = useMemo(() => ({ v: new THREE.Vector3(), ray: new THREE.Raycaster(), ndc: new THREE.Vector2(), hover: -1 }), []);
    const live = useRef({ tmp, items, backdrop });

    useFrame((state, delta) => {
        const weight = worldWeight(1);
        if (weight <= 0) {
            hudNodes.forEach((n) => n && (n.style.opacity = '0'));
            if (useIglooUI.getState().activeCrystal !== -1) useIglooUI.getState().set({ activeCrystal: -1 });
            return;
        }
        const { tmp, items, backdrop } = live.current;
        const { camera } = worldRef.current;
        const time = state.clock.elapsedTime;
        const px = motion.pointerSmooth.x;
        const py = motion.pointerSmooth.y;
        const detail = motion.detail;
        const openIndex = useIglooUI.getState().detail;

        // camera: drifts with the pointer, pushes in on detail
        camera.position.set(px * 0.5, py * 0.35, lerp(10.5, 7.2, detail));
        camera.lookAt(0, 0, 0);
        const pc = camera as THREE.PerspectiveCamera;
        pc.fov = fitFov(35, pc.aspect);
        pc.updateProjectionMatrix();

        backdrop.uniforms.uTime.value = time;
        backdrop.uniforms.uScroll.value = motion.crystals;

        // hover pick (only when this world is the one on screen)
        tmp.ndc.set(motion.pointer.x, motion.pointer.y);
        tmp.ray.setFromCamera(tmp.ndc, camera);
        let hover = -1;
        if (motion.hasPointer && weight > 0.9 && detail < 0.01) {
            let best = Infinity;
            groups.current.forEach((g, i) => {
                const mesh = g?.children[0] as THREE.Mesh | undefined;
                if (!mesh) return;
                const hit = tmp.ray.intersectObject(mesh, false)[0];
                if (hit && hit.distance < best) {
                    best = hit.distance;
                    hover = i;
                }
            });
        }
        if (hover !== motion.hoverCrystal) {
            motion.hoverCrystal = hover;
            document.body.style.cursor = hover >= 0 ? 'pointer' : '';
        }

        // active crystal for the HUD
        const nearest = Math.round(motion.crystals);
        const active = weight > 0.6 && nearest >= 0 && nearest < items.length && Math.abs(motion.crystals - nearest) < 0.34 ? nearest : -1;
        if (useIglooUI.getState().activeCrystal !== active) useIglooUI.getState().set({ activeCrystal: active });

        const halfW = size.width / 2;
        const halfH = size.height / 2;
        const vel = clamp(Math.abs(motion.velocity) / 30);

        items.forEach((it, i) => {
            const g = groups.current[i];
            if (!g) return;
            const offset = motion.crystals - i;
            const focused = openIndex === i ? 1 : 0;
            g.position.set(lerp(it.x, 0, focused * detail) + Math.sin(time * 0.4 + i) * 0.05, offset * SPACING + Math.sin(time * 0.6 + i * 2) * 0.08, 0);
            g.rotation.set(0.15 + py * 0.25 + Math.sin(time * 0.3 + i) * 0.06, time * it.spin + i * 1.3 + offset * 0.9 + px * 0.4, Math.sin(time * 0.25 + i) * 0.05);
            const hoverT = hover === i ? 1 : 0;
            const u = it.material.uniforms;
            u.uTime.value = time;
            u.uHover.value = damp(u.uHover.value, hoverT, 6, delta);
            u.uGlitch.value = damp(u.uGlitch.value, hoverT * 0.35 + vel * 0.6 + (1 - smoothstep(0, 0.4, 1 - Math.abs(offset) * 0.5)) * 0.2, 8, delta);
            u.uFocus.value = openIndex >= 0 && openIndex !== i ? 1 - detail : 1;
            g.scale.setScalar(0.82 * lerp(0.92, 1, smoothstep(1.2, 0, Math.abs(offset))) * (1 + u.uHover.value * 0.05));

            // project the crystal centre → HUD anchor
            const node = hudNodes[i];
            if (node) {
                tmp.v.set(g.position.x, g.position.y, 0).project(camera);
                const sx = tmp.v.x * halfW + halfW;
                const sy = -tmp.v.y * halfH + halfH;
                node.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
                const vis = weight * smoothstep(0.5, 0.15, Math.abs(offset)) * (1 - detail);
                node.style.opacity = vis.toFixed(3);
            }
        });
    });

    return createPortal(
        <>
            <mesh position={[0, 0, -14]} material={backdrop}>
                <planeGeometry args={[60, 34]} />
            </mesh>
            {items.map((it, i) => (
                <group
                    key={it.item.code}
                    ref={(el) => {
                        groups.current[i] = el;
                    }}
                >
                    <mesh geometry={it.geometry} material={it.material} />
                    <lineSegments geometry={ticks} rotation={[0, i * 1.7, 0]}>
                        <lineBasicMaterial color="#ffffff" transparent opacity={0.55} />
                    </lineSegments>
                </group>
            ))}
            <Snow count={900} size={[18, 14, 10]} center={[0, 0, -2]} speed={0.18} pointSize={1.6} opacity={0.6} visible={() => worldWeight(1)} />
        </>,
        scene,
    );
}

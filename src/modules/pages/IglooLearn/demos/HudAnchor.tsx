'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';

import { Btn, Demo, Slider, Toggle } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { useParams, useThreeCanvas } from '../kit/loop';
import { damp, lerp, smoothstep } from '../kit/math';
import { scrambleIn } from '../kit/scramble';

import { buildCrystalGeometry, createCrystalMaterial } from './crystal';

const ITEMS = [
    { code: 'PORTFOLIO_CO_01', name: 'PUDGY PENGUINS', date: 'D 03.02.2020', shape: 'rock' as const, seed: 11, x: 0.35 },
    { code: 'PORTFOLIO_CO_02', name: 'OVERPASS', date: 'D 06.01.2023', shape: 'prism' as const, seed: 18, x: -0.55 },
    { code: 'PORTFOLIO_CO_03', name: 'ABSTRACT', date: 'D 06.28.2024', shape: 'shard' as const, seed: 25, x: 0.5 },
];
const SPACING = 5.2;
const DEFAULTS = { carousel: 0, showRay: true };

/**
 * Three ideas at once: a crystal carousel on a dial, raycast picking, and
 * HTML labels glued to 3D positions with vector.project(camera).
 */
export default function HudAnchor() {
    const host = useRef<HTMLDivElement>(null);
    const nodes = useRef<(HTMLDivElement | null)[]>([]);
    const detailRef = useRef<HTMLDivElement>(null);
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const [open, setOpen] = useState(-1);
    const state = useRef({ hover: -1, detail: 0, open: -1 });

    const openItem = (i: number) => {
        state.current.open = i;
        setOpen(i);
        gsap.to(state.current, { detail: 1, duration: 1.1, ease: 'expo.inOut' });
        requestAnimationFrame(() => {
            detailRef.current?.querySelectorAll('[data-text]').forEach((n, k) => {
                scrambleIn(n, { delay: 0.35 + k * 0.08 });
            });
        });
    };
    const close = () => {
        gsap.to(state.current, {
            detail: 0,
            duration: 0.8,
            ease: 'power3.inOut',
            onComplete: () => {
                state.current.open = -1;
                setOpen(-1);
            },
        });
    };

    useThreeCanvas(host, ({ renderer, pointer, size, host: el }) => {
        renderer.setClearColor('#bcc3cd');
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#bcc3cd');
        scene.fog = new THREE.Fog('#bcc3cd', 6, 22);
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
        const meshes = ITEMS.map((it) => {
            const m = new THREE.Mesh(buildCrystalGeometry(it.seed, it.shape), createCrystalMaterial());
            scene.add(m);
            return m;
        });
        const ray = new THREE.Raycaster();
        const ndc = new THREE.Vector2();
        const v = new THREE.Vector3();
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: '#2a7fb8' }));
        scene.add(line);
        const sm = { x: 0, y: 0, c: 0 };
        const ra = new THREE.Vector3();
        const rb = new THREE.Vector3();

        return {
            resize: (w, h) => {
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
            },
            onClick: () => {
                const s = state.current;
                if (s.hover >= 0 && s.open < 0) openItem(s.hover);
            },
            frame: (t, dt) => {
                const P = ref.current;
                const s = state.current;
                sm.x = damp(sm.x, pointer.over ? pointer.x : 0, 3.5, dt);
                sm.y = damp(sm.y, pointer.over ? pointer.y : 0, 3.5, dt);
                sm.c = damp(sm.c, P.carousel, 6, dt);
                camera.position.set(sm.x * 0.5, sm.y * 0.35, lerp(10.5, 7.2, s.detail));
                camera.lookAt(0, 0, 0);

                // pick: which crystal is under the cursor?
                ray.setFromCamera(ndc.set(pointer.x, pointer.y), camera);
                let hover = -1;
                let best = Infinity;
                if (pointer.over && s.detail < 0.01) {
                    meshes.forEach((m, i) => {
                        const hit = ray.intersectObject(m, false)[0];
                        if (hit && hit.distance < best) {
                            best = hit.distance;
                            hover = i;
                        }
                    });
                }
                s.hover = hover;
                el.style.cursor = hover >= 0 ? 'pointer' : '';
                line.visible = P.showRay && pointer.over && s.detail < 0.01;
                if (line.visible) {
                    ra.copy(ray.ray.origin).addScaledVector(ray.ray.direction, 2);
                    rb.copy(ray.ray.origin).addScaledVector(ray.ray.direction, hover >= 0 ? best : 14);
                    const lp = line.geometry.attributes.position as THREE.BufferAttribute;
                    lp.setXYZ(0, ra.x, ra.y, ra.z);
                    lp.setXYZ(1, rb.x, rb.y, rb.z);
                    lp.needsUpdate = true;
                    (line.material as THREE.LineBasicMaterial).color.set(hover >= 0 ? '#ffffff' : '#2a7fb8');
                }

                meshes.forEach((m, i) => {
                    const it = ITEMS[i];
                    const offset = sm.c - i;
                    const focused = s.open === i ? 1 : 0;
                    m.position.set(lerp(it.x, 0, focused * s.detail) + Math.sin(t * 0.4 + i) * 0.05, offset * SPACING + Math.sin(t * 0.6 + i * 2) * 0.08, 0);
                    m.rotation.set(0.15 + sm.y * 0.25, t * 0.18 + i * 1.3 + offset * 0.9 + sm.x * 0.4, 0);
                    const u = (m.material as THREE.ShaderMaterial).uniforms;
                    u.uTime.value = t;
                    u.uIrid.value = damp(u.uIrid.value, hover === i ? 0.9 : 0.35, 6, dt);
                    u.uEdges.value = damp(u.uEdges.value, hover === i ? 1.1 : 0.5, 6, dt);
                    u.uGlitch.value = damp(u.uGlitch.value, hover === i ? 0.35 : 0, 8, dt);
                    m.scale.setScalar(0.82 * (1 + (hover === i ? 0.05 : 0)));

                    // HUD: project the 3D centre to screen pixels, move the HTML node there
                    const node = nodes.current[i];
                    if (node) {
                        v.set(m.position.x, m.position.y, 0).project(camera);
                        const sx = (v.x * 0.5 + 0.5) * size.w;
                        const sy = (-v.y * 0.5 + 0.5) * size.h;
                        node.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
                        node.style.opacity = (smoothstep(0.5, 0.15, Math.abs(offset)) * (1 - s.detail)).toFixed(3);
                    }
                });
                if (detailRef.current) detailRef.current.style.opacity = s.detail.toFixed(3);
                renderer.render(scene, camera);
            },
            dispose: () => {
                meshes.forEach((m) => {
                    m.geometry.dispose();
                    (m.material as THREE.Material).dispose();
                });
                line.geometry.dispose();
                (line.material as THREE.Material).dispose();
            },
        };
    });

    const snap = (dir: number) => {
        const o = { v: ref.current.carousel };
        const target = Math.max(0, Math.min(ITEMS.length - 1, Math.round(o.v) + dir));
        gsap.to(o, { v: target, duration: 1.2, ease: 'power3.inOut', onUpdate: () => set('carousel', o.v) });
    };

    return (
        <Demo
            title="HUD anchoring + picking"
            hint="Hover a crystal (the line is the pick ray). Click it to open the detail. Drag the carousel dial — labels stay glued to their crystals."
            onReset={reset}
            controls={
                <>
                    <Slider
                        label="carousel (motion.crystals)"
                        value={p.carousel}
                        min={-0.8}
                        max={2.8}
                        step={0.001}
                        onChange={(v) => set('carousel', v)}
                        help="The scroll dial. Labels fade unless their crystal is within ±0.5 of centre."
                    />
                    <div className="flex gap-2">
                        <Btn onClick={() => snap(-1)}>↑ Prev (power3.inOut)</Btn>
                        <Btn onClick={() => snap(1)}>Next ↓</Btn>
                    </div>
                    <Toggle label="show pick ray" checked={p.showRay} onChange={(v) => set('showRay', v)} />
                </>
            }
        >
            <div className="relative overflow-hidden">
                <div ref={host} className="h-[460px] sm:h-[520px]" />
                {ITEMS.map((it, i) => (
                    <div
                        key={it.code}
                        ref={(el) => {
                            nodes.current[i] = el;
                        }}
                        className="il-mono pointer-events-none absolute left-0 top-0 text-[#f7f9fc] opacity-0 will-change-transform [text-shadow:0_0_10px_rgba(10,16,26,0.45)]"
                    >
                        <svg className="absolute left-0 top-0 overflow-visible" width="1" height="1" aria-hidden>
                            <path d="M -120 -150 L -60 -96" stroke="currentColor" strokeWidth="1.2" fill="none" />
                            <path d="M 130 70 L 80 30" stroke="currentColor" strokeWidth="1.2" fill="none" />
                        </svg>
                        <div className="absolute -left-[250px] -top-[182px] w-[160px] text-[11px] font-bold leading-[1.15]">
                            <p>{it.code}</p>
                            <p>{it.name}</p>
                            <span className="mt-1.5 block h-px w-full bg-current" />
                        </div>
                        <div className="absolute left-[120px] top-[70px] w-[150px] text-right text-[11px] font-bold leading-[1.15]">
                            <p>{it.date}</p>
                            <p>CLICK TO EXPLORE</p>
                            <span className="mt-1.5 block h-px w-full bg-current" />
                        </div>
                    </div>
                ))}
                {open >= 0 && (
                    <div ref={detailRef} className="absolute inset-0 flex items-center justify-center bg-[rgba(8,11,16,0.55)] opacity-0 backdrop-blur-md">
                        <button type="button" onClick={close} className="il-bracket il-hv-bracket il-mono absolute right-4 top-4 px-4 py-2 text-[11px] text-[var(--il-ink)]">
                            Close
                        </button>
                        <div className="il-mono w-[min(86%,40ch)] space-y-3 text-[11.5px] leading-relaxed text-[var(--il-ink)]">
                            <p data-text="////// Summary" className="opacity-50" />
                            <p data-text={`${ITEMS[open].code} — ${ITEMS[open].name}`} className="font-bold" />
                            <p
                                data-text="The camera pushed in from z 10.5 to 7.2, the other crystals dimmed and the frame behind this text sank into slate — all driven by one tweened value: motion.detail."
                                className="text-[#c9d2de]"
                            />
                        </div>
                    </div>
                )}
            </div>
        </Demo>
    );
}

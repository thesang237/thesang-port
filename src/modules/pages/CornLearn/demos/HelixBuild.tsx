'use client';

import { useRef } from 'react';
import * as THREE from 'three';

import { Demo, Group, Slider } from '../kit/controls';
import { createLinearOutput, disposeObject } from '../kit/gl';
import { prefersReducedMotion, useParams, useThreeCanvas } from '../kit/loop';
import { accentBackdropMaterial, dna, DofController, helixSpline, rng, tickPoly } from '../kit/source';

/**
 * The DNA, built up one rule at a time with the page's own helixSpline(); steps 6–7 are the real
 * dna() object (2 backbones × 20 strands, hairlines + 150 pentagon beads each, draw-on window).
 * Seen through the reference camera (45°, z 10), like ScienceWorld's fx layer.
 */
const STEPS = [
    '',
    'One helix: a spline through 13 points of a spiral (radius, turns).',
    'A second, faster wobble rides on the first (radius2, frequency2).',
    'Crossings: at chosen heights the strand dives through the axis to the other side.',
    '20 strands per backbone, each with its own wobble phase and crossing pattern.',
    'Two backbones, half a turn apart (phase 0 and π): the double helix.',
    'The real dna(): 1 px hairlines + 150 pentagon beads per strand, focus from the pointer.',
    'Draw-on: each point knows its place t along the strand; a moving window reveals it.',
];
const DEFAULTS = { step: 1, radius: 1.17, turns: 0.9, wobble: 1, wobbleTurns: 4, draw: 0.35, auto: true };
const SCALE = 0.55;

function strands(o: { step: number; radius: number; turns: number; wobble: number; wobbleTurns: number }) {
    const rand = rng(5);
    const stripes = Array.from({ length: 7 }, (_, e) => e / 7 + 0.5 / 7);
    const pos: number[] = [];
    const col: number[] = [];
    const nStrands = o.step >= 4 ? 20 : 1;
    const phases = o.step >= 5 ? [0, Math.PI] : [0];
    const amber = new THREE.Color('#ed863b');
    const mint = new THREE.Color('#55ffc2');
    for (const phase of phases) {
        for (let r = 0; r < nStrands; r++) {
            const spline = helixSpline(
                {
                    height: 15,
                    phase,
                    phase2: (r / 20) * Math.PI * 2 + 0.8 * (rand() - 0.5),
                    radius: o.radius,
                    radius2: o.step >= 2 ? 0.9 * (0.2 + rand() * 0.1) * o.wobble : 0,
                    frequency: o.turns,
                    frequency2: o.wobbleTurns,
                    crossAt: o.step >= 3 ? stripes.filter((_, t) => t % 3 === r % 3 && t !== 0 && t !== 1) : [],
                },
                rand,
            );
            const pts = spline.getSpacedPoints(200);
            const c = o.step < 4 ? mint : amber;
            for (let i = 0; i < 200; i++) {
                pos.push(...pts[i].toArray(), ...pts[i + 1].toArray());
                col.push(c.r, c.g, c.b, c.r, c.g, c.b);
            }
        }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: o.step >= 4 ? 0.55 : 1, blending: THREE.AdditiveBlending, depthWrite: false });
    return new THREE.LineSegments(g, m);
}

export default function HelixBuild() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);

    useThreeCanvas(
        host,
        ({ renderer, size, pointer }) => {
            const out = createLinearOutput({ samples: 2, vignette: true });
            const scene = new THREE.Scene();
            const bgMat = accentBackdropMaterial('#17120f', '#4e2e10', '#224528', [0.2, 0.8], [0.8, 0.2]);
            const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
            bg.frustumCulled = false;
            scene.add(bg);
            const flat = new THREE.Camera();
            const fx = new THREE.Scene();
            const cam = new THREE.PerspectiveCamera(45, 1, 1, 700);
            cam.position.set(0, 0, 10);
            const dof = new DofController({ width: 5, height: 12, farMin: 32, farMax: 32 });
            const wrap = new THREE.Group();
            wrap.scale.setScalar(SCALE);
            fx.add(wrap);
            const real = dna({ color: '#ed863b', size: [7, 30], dof, seed: 5 });
            real.group.visible = false;
            wrap.add(real.group);
            let lines: THREE.LineSegments | null = null;
            let key = '';
            const ptr = new THREE.Vector2();
            let t = 0;
            let drawT = 0;
            return {
                resize(w, h) {
                    out.setSize(w, h, size.dpr);
                    cam.aspect = w / h;
                    cam.updateProjectionMatrix();
                },
                frame(time, dt) {
                    t += dt;
                    const prm = ref.current;
                    const k = `${prm.step < 6 ? prm.step : 6}|${prm.radius}|${prm.turns}|${prm.wobble}|${prm.wobbleTurns}`;
                    if (k !== key) {
                        key = k;
                        if (lines) {
                            wrap.remove(lines);
                            disposeObject(lines);
                            lines = null;
                        }
                        if (prm.step < 6) {
                            lines = strands(prm);
                            wrap.add(lines);
                        }
                        real.group.visible = prm.step >= 6;
                    }
                    if (pointer.over) ptr.set(pointer.x, pointer.y);
                    else if (!prefersReducedMotion()) ptr.set(Math.sin(t * 0.4) * 0.5, Math.sin(t * 0.6) * 0.4);
                    const kk = 1 - Math.exp(-3 * dt);
                    cam.position.x += (ptr.x * 0.75 - cam.position.x) * kk;
                    cam.position.y += (ptr.y * 0.75 - cam.position.y) * kk;
                    dof.update(ptr, true, dt);
                    wrap.rotation.y = time * 0.15;
                    // the draw-on window: start sweeps 1.1 → 0 (sine in), the end stays past the strand
                    if (prm.step >= 7) {
                        if (prm.auto && !prefersReducedMotion()) {
                            drawT = (drawT + dt / 4) % 1.25;
                        } else drawT = prm.draw;
                        const u = Math.min(1, drawT);
                        const s = 1 + Math.sin((Math.PI / 2) * u - Math.PI / 2);
                        real.setProgress(1.1 * (1 - s), 3);
                    } else real.setProgress(-1, 3);
                    tickPoly(fx, time * 0.6, size.h, size.dpr);
                    out.begin(renderer);
                    renderer.render(scene, flat);
                    renderer.clearDepth();
                    renderer.render(fx, cam);
                    out.present(renderer);
                },
                dispose() {
                    disposeObject(scene);
                    disposeObject(fx);
                    out.dispose();
                },
            };
        },
        [],
        { antialias: false, maxDpr: 1.5 },
    );

    const procedural = p.step < 6;
    return (
        <Demo
            title="Helix build-up: one curve to a double helix"
            hint={STEPS[p.step]}
            onReset={reset}
            controls={
                <>
                    <Slider label="build-up" value={p.step} min={1} max={7} step={1} onChange={(v) => set('step', v)} format={(v) => `${v} / 7`} help="Add one rule at a time." />
                    <Group title="Spiral (steps 1–5)">
                        <Slider label="radius" value={p.radius} min={0.2} max={3} step={0.01} onChange={(v) => set('radius', v)} help="1.3 × 0.9 = 1.17 on the page." disabled={!procedural} />
                        <Slider
                            label="turns over the height"
                            value={p.turns}
                            min={0.1}
                            max={3}
                            step={0.01}
                            onChange={(v) => set('turns', v)}
                            help="0.9: less than one full twist over 15 units."
                            disabled={!procedural}
                        />
                        <Slider
                            label="wobble size"
                            value={p.wobble}
                            min={0}
                            max={4}
                            step={0.01}
                            onChange={(v) => set('wobble', v)}
                            format={(v) => `${v.toFixed(2)}×`}
                            help="Second spiral’s radius (0.18–0.27)."
                            disabled={!procedural || p.step < 2}
                        />
                        <Slider
                            label="wobble turns"
                            value={p.wobbleTurns}
                            min={0}
                            max={20}
                            step={0.1}
                            onChange={(v) => set('wobbleTurns', v)}
                            help="4 on the page: the strands braid gently."
                            disabled={!procedural || p.step < 2}
                        />
                    </Group>
                    <Group title="Draw-on (step 7)">
                        <Slider
                            label="draw progress"
                            value={p.draw}
                            min={0}
                            max={1}
                            step={0.005}
                            onChange={(v) => {
                                set('auto', false);
                                set('draw', v);
                            }}
                            help="The page drives this from the scroll as the chapter arrives. Dragging stops the auto loop."
                            disabled={p.step < 7}
                        />
                    </Group>
                    {!procedural && <p className="text-[12px] leading-snug text-[var(--cl-dim)]">Steps 6–7 use the page’s dna() as is: its shape values are fixed in the source.</p>}
                </>
            }
        >
            <div ref={host} className="aspect-[4/3] w-full sm:aspect-[16/10]" />
        </Demo>
    );
}

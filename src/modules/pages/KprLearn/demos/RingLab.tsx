'use client';

import { useRef, useState } from 'react';
import type * as THREE from 'three';

import { Demo, Group, Readout, Segmented, Slider, StageNote } from '../kit/controls';
import { loadTex, STAGE_H } from '../kit/gl';
import { useParams, useThreeCanvas } from '../kit/loop';
import { clamp01, ease, GALLERY_RING, IMAGES, lerp } from '../kit/source';

import { makeCardStage, setPicture } from './cardStage';

const DEFAULTS = { count: GALLERY_RING.count, radius: 0.62, open: 1, close: 0, flip: 0, spin: 0.05, shape: 'convex (page)' as 'convex (page)' | 'concave', decay: 3 };
const MAX = 26;

/**
 * Chapter 08: a teaching copy of the gallery ring from choreo.ts, drawn with real notched cards and the
 * page's gallery portraits (their notch is baked into the image, so they use the alpha-map mode).
 */
export default function RingLab() {
    const host = useRef<HTMLDivElement>(null);
    const [loaded, setLoaded] = useState(0);
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const drag = useRef({ active: false, x: 0, last: 0, v: 0, offset: 0, momentum: 0 });
    const [front, setFront] = useState(0);

    useThreeCanvas(host, ({ renderer }) => {
        const st = makeCardStage(renderer, '#8b7ed9');
        const cards = Array.from({ length: MAX }, () => st.card());
        cards.forEach((m) => {
            m.material.uniforms.uSingle.value = 1;
            m.material.uniforms.uAlphaMap.value = 1;
            m.material.uniforms.uBaseF.value.set('#6e5aa8');
        });
        let count = 0;
        IMAGES.gallery.slice(0, MAX).forEach((url, i) => {
            void loadTex(url).then((t: THREE.Texture) => {
                st.track(t);
                setPicture(cards[i].material, t, 622 / 682, false);
                setLoaded(++count);
            });
        });
        let lastFront = -1;
        return {
            resize: (w, h) => st.resize(w, h),
            frame: (time, dt) => {
                const d = ref.current;
                const dr = drag.current;
                if (!dr.active && Math.abs(dr.momentum) > 1e-4) {
                    dr.offset += dr.momentum * dt;
                    dr.momentum *= Math.exp(-d.decay * dt);
                }
                const vw = st.width;
                const n = Math.round(d.count);
                const open = ease.inOutStrong(d.open);
                const close = ease.inOutStrong(d.close);
                const R = lerp(lerp(0.05 * vw, d.radius * vw, open), 0.03 * vw, close);
                const step = (Math.PI * 2) / n;
                const rot = dr.offset + time * d.spin + close * close * 6.5;
                const ringCardW = Math.min(0.2 * vw, 0.36 * STAGE_H);
                const cw = lerp(ringCardW, ringCardW * 0.62, close);
                const concave = d.shape === 'concave';
                let best = -2;
                let bestI = 0;
                cards.forEach((m, i) => {
                    if (i >= n) {
                        m.visible = false;
                        return;
                    }
                    const th = i * step * lerp(0.35, 1, open) + rot;
                    const cos = Math.cos(th);
                    const wrapped = Math.atan2(Math.sin(th), cos);
                    const fk = ease.inOutStrong(clamp01((d.flip - (i / n) * 0.35) / 0.65));
                    const x = Math.sin(th) * R;
                    const z = concave ? (1 - cos) * R * 0.55 : (cos - 1) * R;
                    const ry = lerp(concave ? -wrapped : wrapped, Math.sign(wrapped || 1) * Math.PI * 0.62, fk);
                    const opacity = close > 0.98 ? 1 : clamp01((cos + 0.15) / 0.35);
                    m.visible = opacity > 0.001;
                    m.position.set(x, 0, z);
                    m.rotation.set(0, ry, 0);
                    m.scale.set(cw, cw * 1.096, 1);
                    m.renderOrder = concave ? 30 - Math.round(cos * 40) : 30 + Math.round(cos * 40);
                    const u = m.material.uniforms;
                    u.uSize.value.set(cw, cw * 1.096);
                    u.uRadius.value = 0;
                    u.uOpacity.value = opacity;
                    u.uDim.value = lerp(0, 0.25, clamp01(1 - cos)) * (1 - close);
                    u.uTime.value = time;
                    if (cos > best) {
                        best = cos;
                        bestI = i;
                    }
                });
                if (bestI !== lastFront) {
                    lastFront = bestI;
                    setFront(bestI);
                }
                st.sync();
                st.render();
            },
            dispose: () => st.dispose(),
        };
    });

    return (
        <Demo
            title="The gallery ring — a cylinder of cards"
            hint="Drag the ring sideways and let go. Then close it and flip the cards away: that is how the page leaves the gallery."
            onReset={() => {
                drag.current.offset = 0;
                drag.current.momentum = 0;
                reset();
            }}
            controls={
                <>
                    <Group title="Ring">
                        <Slider label="cards" value={p.count} min={6} max={MAX} step={1} onChange={(v) => set('count', v)} help="The page uses 26: 12 reference portraits + 14 generated." />
                        <Slider label="radius × width" value={p.radius} min={0.1} max={1.4} step={0.01} onChange={(v) => set('radius', v)} help="Source 0.62 of the viewport width (1.0 on phones)." />
                        <Segmented label="camera" options={['convex (page)', 'concave']} value={p.shape} onChange={(v) => set('shape', v)} />
                        <Slider
                            label="idle spin"
                            value={p.spin}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(v) => set('spin', v)}
                            format={(v) => `${v.toFixed(2)} rad/s`}
                            help="Source 0.05, plus 0.75 rad per screen of scroll."
                        />
                        <Slider
                            label="momentum decay"
                            value={p.decay}
                            min={0.3}
                            max={12}
                            step={0.1}
                            onChange={(v) => set('decay', v)}
                            help="Speed × e^(−decay·dt) each frame after you let go. Source 3."
                        />
                    </Group>
                    <Group title="Entrance and exit (scrubbed on the page)">
                        <Slider label="open" value={p.open} min={0} max={1} step={0.005} onChange={(v) => set('open', v)} help="Cards fan out from a bunch (spacing 0.35 → 1) as the radius grows." />
                        <Slider label="close" value={p.close} min={0} max={1} step={0.005} onChange={(v) => set('close', v)} help="Radius shrinks to a small spinning box." />
                        <Slider
                            label="flip away"
                            value={p.flip}
                            min={0}
                            max={1}
                            step={0.005}
                            onChange={(v) => set('flip', v)}
                            help="Each card turns past 90° toward its nearer edge and, one-sided, vanishes."
                        />
                    </Group>
                    <Readout
                        items={[
                            { label: 'front card', value: `#${front + 1}`, color: '#c0fb50' },
                            { label: 'portraits', value: `${loaded}/${Math.min(MAX, IMAGES.gallery.length)}` },
                        ]}
                    />
                </>
            }
        >
            <div
                className="relative aspect-[16/10] w-full cursor-grab touch-pan-y active:cursor-grabbing lg:aspect-auto lg:h-full lg:min-h-[560px]"
                onPointerDown={(e) => {
                    drag.current = { ...drag.current, active: true, x: e.clientX, last: performance.now(), v: 0, momentum: 0 };
                    e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                    const dr = drag.current;
                    if (!dr.active) return;
                    const now = performance.now();
                    const w = e.currentTarget.getBoundingClientRect().width;
                    // Collection.tsx: drag angle = dx / width × 2.4
                    const da = ((e.clientX - dr.x) / Math.max(320, w)) * 2.4;
                    dr.offset += da;
                    dr.v = da / Math.max(0.008, (now - dr.last) / 1000);
                    dr.x = e.clientX;
                    dr.last = now;
                }}
                onPointerUp={() => {
                    drag.current.active = false;
                    drag.current.momentum = Math.max(-6, Math.min(6, drag.current.v));
                }}
                onPointerCancel={() => {
                    drag.current.active = false;
                }}
            >
                <div ref={host} className="absolute inset-0" />
                {loaded < 4 ? <StageNote>Loading portraits…</StageNote> : null}
            </div>
        </Demo>
    );
}

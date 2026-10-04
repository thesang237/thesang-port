'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';

import { cn } from '@/utils/cn';

import { disposeFont, loadDisplayFont } from '../kit/assets';
import { Btn, Demo, Group, Segmented, Slider, StageNote, Toggle } from '../kit/controls';
import { createLinearOutput, gentle, overlayCamera } from '../kit/gl';
import { prefersReducedMotion, useParams, useThreeCanvas } from '../kit/loop';
import { CHAPTERS, ENGINE, type MsdfFont, type TitleText, Trail } from '../kit/source';
import { makeTitle, placeOnAnchor, titleUniforms } from '../kit/titles';

/**
 * The page's real TitleText, drawn over a transparent DOM heading exactly as the engine does. Timing
 * dials default to Engine.ts DRAW (wait 0.45 s, trace 2.4 s, fill from 1.9 s over 1.6 s, sine in-out,
 * no stagger). Toggle the anchor to see the invisible heading the title is placed on.
 */
const PRESETS = {
    library: CHAPTERS[1].title,
    models: CHAPTERS[2].title,
    cut: CHAPTERS[6].title,
    hero: CHAPTERS[0].title,
} as const;
type PresetId = keyof typeof PRESETS;
const D = ENGINE.draw;
const DEFAULTS = {
    preset: 'library' as PresetId,
    delay: D.delay as number,
    draw: D.draw as number,
    fillAt: D.fillAt as number,
    fill: D.fill as number,
    stagger: 0,
    ease: 'gentle' as 'gentle' | 'linear',
    anchor: false,
    scrub: false,
    t: 2,
};

export default function RevealLab() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const stage = useRef<HTMLDivElement>(null);
    const anchor = useRef<HTMLHeadingElement>(null);
    const read = useRef<HTMLSpanElement>(null);
    const clock = useRef({ t: prefersReducedMotion() ? 99 : 0 });
    const [status, setStatus] = useState('Loading the font atlas…');

    useThreeCanvas(
        host,
        ({ renderer, size, host: el }) => {
            const out = createLinearOutput({ samples: 2 });
            const overlay = new THREE.Scene();
            const cam = overlayCamera(1, 1);
            const trail = new Trail();
            let font: MsdfFont | null = null;
            let title: TitleText | null = null;
            let built = '';
            let alive = true;
            loadDisplayFont()
                .then((f) => {
                    if (!alive) return disposeFont(f);
                    font = f;
                    setStatus('');
                })
                .catch(() => setStatus('Could not load the atlas'));

            const fitAnchor = (lines: readonly string[]) => {
                const a = anchor.current;
                if (!a) return;
                const longest = Math.max(...lines.map((l) => l.length));
                const fontPx = Math.max(18, Math.min(76, (size.w * 0.84) / (0.53 * longest), (size.h * 0.78) / (0.987 * lines.length)));
                a.style.fontSize = `${fontPx.toFixed(1)}px`;
            };
            const rebuild = (id: PresetId) => {
                if (!font || !anchor.current) return;
                title?.dispose();
                if (title) overlay.remove(title.group);
                const lines = [...PRESETS[id]];
                fitAnchor(lines);
                title = makeTitle(font, lines, trail);
                overlay.add(title.group);
                placeOnAnchor(title, anchor.current, el, size.dpr);
                built = id;
            };

            // pointer: the title still scatters (chapter 05 is about this)
            const px = new THREE.Vector2(-1e4, -1e4);
            const zone = stage.current ?? el;
            const onMove = (e: PointerEvent) => {
                const r = el.getBoundingClientRect();
                px.set(e.clientX - r.left, e.clientY - r.top);
            };
            const onLeave = () => px.set(-1e4, -1e4);
            zone.addEventListener('pointermove', onMove);
            zone.addEventListener('pointerleave', onLeave);

            return {
                resize(w, h) {
                    out.setSize(w, h, size.dpr);
                    overlayCamera(w, h, cam);
                    if (title && anchor.current) {
                        fitAnchor(title.lines);
                        placeOnAnchor(title, anchor.current, el, size.dpr);
                    }
                },
                frame(time, dt) {
                    const prm = ref.current;
                    // the DOM heading re-renders with the new preset first, then the title is rebuilt on it
                    if (font && built !== prm.preset && anchor.current?.dataset.preset === prm.preset) rebuild(prm.preset);
                    const c = clock.current;
                    if (!prm.scrub) {
                        c.t += dt;
                        const total = prm.delay + Math.max(prm.draw, prm.fillAt + prm.fill);
                        if (c.t > total + 2.6 && !prefersReducedMotion()) c.t = 0;
                    } else c.t = prm.t;
                    if (title) {
                        const ease = prm.ease === 'gentle' ? gentle : (a: number, b: number, v: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));
                        const k = c.t - prm.delay;
                        title.draw = ease(0, prm.draw, k);
                        title.fill = ease(prm.fillAt, prm.fillAt + prm.fill, k);
                        titleUniforms(title).uStagger.value = prm.stagger;
                        title.update(time);
                        const over = title.fill > 0.9 && title.hits(px.x, px.y, 10);
                        if (over) trail.push(px.x, px.y);
                        trail.rest(px.x, px.y, over);
                        if (read.current) read.current.textContent = `t ${c.t.toFixed(2)} s · outline ${title.draw.toFixed(2)} · fill ${title.fill.toFixed(2)}`;
                    }
                    trail.update(dt);
                    out.begin(renderer, 0x050b08);
                    renderer.render(overlay, cam);
                    out.present(renderer);
                },
                dispose() {
                    alive = false;
                    zone.removeEventListener('pointermove', onMove);
                    zone.removeEventListener('pointerleave', onLeave);
                    title?.dispose();
                    disposeFont(font);
                    out.dispose();
                },
            };
        },
        [],
        { antialias: false, maxDpr: 2 },
    );

    return (
        <Demo
            title="Reveal lab: the real TitleText"
            stacked
            hint="It replays on its own. Change the timings, try a stagger, or switch on “scrub” and drag time by hand. Show the anchor to see the hidden heading."
            onReset={() => {
                reset();
                clock.current.t = 0;
            }}
            controls={
                <>
                    <Segmented label="title" options={(Object.keys(PRESETS) as PresetId[]).map((k) => ({ value: k, label: k }))} value={p.preset} onChange={(v) => set('preset', v)} />
                    <div className="flex flex-wrap gap-2">
                        <Btn
                            primary
                            onClick={() => {
                                set('scrub', false);
                                clock.current.t = 0;
                            }}
                        >
                            Replay
                        </Btn>
                    </div>
                    <Group title="Timing (s)">
                        <Slider label="wait" value={p.delay} min={0} max={2} step={0.05} onChange={(v) => set('delay', v)} help="Before anything draws (0.45)." />
                        <Slider
                            label="outline trace"
                            value={p.draw}
                            min={0.2}
                            max={6}
                            step={0.05}
                            onChange={(v) => set('draw', v)}
                            help="How long the hairline takes to run round each letter (2.4)."
                        />
                        <Slider
                            label="fill starts at"
                            value={p.fillAt}
                            min={0}
                            max={6}
                            step={0.05}
                            onChange={(v) => set('fillAt', v)}
                            help="When the fill begins, counted from the start of the trace (1.9)."
                        />
                        <Slider label="fill duration" value={p.fill} min={0.1} max={5} step={0.05} onChange={(v) => set('fill', v)} help="Grey → white (1.6)." />
                        <Slider
                            label="letter stagger"
                            value={p.stagger}
                            min={0}
                            max={0.4}
                            step={0.01}
                            onChange={(v) => set('stagger', v)}
                            help="0 = every letter at once (the page now). 0.12 = left → right, the earlier version."
                        />
                        <Segmented label="easing" options={['gentle', 'linear'] as const} value={p.ease} onChange={(v) => set('ease', v)} />
                    </Group>
                    <Group title="Look under it">
                        <Toggle label="show the DOM anchor" checked={p.anchor} onChange={(v) => set('anchor', v)} help="The transparent heading the engine measures, tinted red." />
                        <Toggle label="scrub time by hand" checked={p.scrub} onChange={(v) => set('scrub', v)} />
                        <Slider label="time" value={p.t} min={0} max={6} step={0.01} onChange={(v) => set('t', v)} format={(v) => `${v.toFixed(2)} s`} disabled={!p.scrub} />
                    </Group>
                </>
            }
        >
            <div ref={stage} className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/9]">
                <div ref={host} className="absolute inset-0" />
                <h2
                    ref={anchor}
                    data-preset={p.preset}
                    className={cn('cl-gl-anchor absolute left-[7%] top-1/2 -translate-y-1/2 leading-[0.987]', p.anchor && 'is-shown')}
                    aria-label={PRESETS[p.preset].join(' ')}
                >
                    {PRESETS[p.preset].map((l) => (
                        <span key={l} className="block">
                            {l}
                        </span>
                    ))}
                </h2>
                {status ? <StageNote>{status}</StageNote> : null}
                <span ref={read} className="cl-mono pointer-events-none absolute bottom-2 left-3 text-[10.5px] tabular-nums text-[var(--cl-dim)]" />
            </div>
        </Demo>
    );
}

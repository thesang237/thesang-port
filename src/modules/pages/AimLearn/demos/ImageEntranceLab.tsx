'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Btn, Demo, Group, Readout, Segmented, Slider, Toggle } from '../kit/controls';
import { EASE_LIST, type EaseName, EASES } from '../kit/eases';
import { gsap, ScrollTrigger } from '../kit/gsap';
import { useParams } from '../kit/loop';
import { GALLERY } from '../kit/source';

type Order = 'reading' | 'centre' | 'random' | 'columns';
type Trigger = 'play' | 'scroll';

// defaults = the site's own image entrance (scale 1.1 → 1.02 in 1.8s, fade 0.8s after 0.2s) + the house stagger (70 ms, capped)
const DEFAULTS = {
    from: 1.1,
    to: 1.02,
    settle: 1.8,
    ease: 'in-out-cubic' as EaseName,
    fade: 0.8,
    fadeDelay: 0.2,
    colour: true,
    step: 0.07,
    cap: true,
    order: 'reading' as Order,
    trigger: 'play' as Trigger,
};

const COLS = 4;
const ITEMS = GALLERY.flat()
    .filter((c): c is NonNullable<typeof c> => !!c)
    .slice(0, 12);

/** A seeded shuffle so “random” is the same on every visit (the web-motion rule for stagger). */
function seeded(n: number) {
    let s = 7;
    const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
    return Array.from({ length: n }, (_, i) => ({ i, r: rnd() }))
        .sort((a, b) => a.r - b.r)
        .map((x) => x.i);
}

const orderOf = (order: Order): number[] => {
    const n = ITEMS.length;
    const idx = Array.from({ length: n }, (_, i) => i);
    if (order === 'reading') return idx;
    if (order === 'columns') return [...idx].sort((a, b) => (a % COLS) - (b % COLS) || a - b);
    if (order === 'random') return seeded(n);
    const cx = (COLS - 1) / 2;
    const cy = (Math.ceil(n / COLS) - 1) / 2;
    return [...idx].sort((a, b) => Math.hypot((a % COLS) - cx, Math.floor(a / COLS) - cy) - Math.hypot((b % COLS) - cx, Math.floor(b / COLS) - cy));
};

/** Average colour of an image: the “colour first” placeholder. */
function averageColour(src: string): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            try {
                const c = document.createElement('canvas');
                c.width = c.height = 1;
                const g = c.getContext('2d');
                if (!g) throw new Error('no 2d');
                g.drawImage(img, 0, 0, 1, 1);
                const [r, gr, b] = g.getImageData(0, 0, 1, 1).data;
                resolve(`rgb(${r},${gr},${b})`);
            } catch {
                resolve('#c8bfb8');
            }
        };
        img.onerror = () => resolve('#c8bfb8');
        img.src = src;
    });
}

/** Images enter as a group: a colour block first, the photo fades in and settles from a slight zoom, in a staggered order. */
export default function ImageEntranceLab() {
    const { p, set, reset } = useParams(DEFAULTS);
    const box = useRef<HTMLDivElement>(null);
    const grid = useRef<HTMLDivElement>(null);
    const [colours, setColours] = useState<string[]>(() => ITEMS.map(() => '#c8bfb8'));
    const [run, setRun] = useState(0);

    useEffect(() => {
        let alive = true;
        Promise.all(ITEMS.map((c) => averageColour(c.img))).then((cs) => alive && setColours(cs));
        return () => {
            alive = false;
        };
    }, []);

    const ord = useMemo(() => orderOf(p.order), [p.order]);
    const step = p.cap ? Math.min(p.step, 0.49 / (ITEMS.length - 1)) : p.step;
    const total = (ITEMS.length - 1) * step + Math.max(p.settle, p.fadeDelay + p.fade);

    useEffect(() => {
        const root = grid.current;
        const scroller = box.current;
        if (!root || !scroller) return;
        const items = Array.from(root.querySelectorAll<HTMLElement>('[data-item]'));
        let timer = 0;
        const ctx = gsap.context(() => {
            const rank = new Map(items.map((el, i) => [el, ord.indexOf(i)]));
            const imgs = items.map((el) => el.querySelector('[data-img]'));
            const phs = items.map((el) => el.querySelector('[data-ph]'));
            gsap.set(imgs, { opacity: 0, scale: p.from });
            gsap.set(phs, { opacity: 1 });

            const play = (els: HTMLElement[]) => {
                const tl = gsap.timeline();
                [...els]
                    .sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0))
                    .forEach((el, k) => {
                        const at = k * step;
                        const img = el.querySelector('[data-img]');
                        const ph = el.querySelector('[data-ph]');
                        tl.to(img, { scale: p.to, duration: p.settle, ease: EASES[p.ease] }, at)
                            .to(img, { opacity: 1, duration: p.fade, ease: 'alInOutQuart' }, at + p.fadeDelay)
                            // the colour block leaves once the photo is solid (the site: 2.0s, over 0.2s)
                            .to(ph, { opacity: 0, duration: 0.2, ease: 'none' }, at + p.fadeDelay + p.fade + 0.2);
                    });
                return tl;
            };

            if (p.trigger === 'play') {
                timer = window.setTimeout(() => {
                    play(items);
                }, 150);
                return;
            }
            ScrollTrigger.batch(items, {
                scroller,
                start: 'top 92%',
                once: true,
                onEnter: (els) => {
                    play(els as HTMLElement[]);
                },
            });
        }, root);
        return () => {
            window.clearTimeout(timer);
            ctx.revert();
        };
    }, [p.from, p.to, p.settle, p.ease, p.fade, p.fadeDelay, step, ord, p.trigger, run]);

    useEffect(() => {
        if (p.trigger === 'scroll' && box.current) box.current.scrollTop = 0;
    }, [p.trigger, run]);

    return (
        <Demo
            title="Image entrance lab: colour first, photo second, staggered"
            hint="Press Replay. Each tile shows its own average colour, the photo fades in on top while settling from a slight zoom, and the tiles start one after another."
            onReset={() => {
                reset();
                setRun((r) => r + 1);
            }}
            controls={
                <>
                    <Group title="Each image">
                        <Slider label="start zoom" value={p.from} min={1} max={1.4} step={0.01} onChange={(v) => set('from', v)} format={(v) => `×${v.toFixed(2)}`} help="The site starts at ×1.1." />
                        <Slider
                            label="end zoom"
                            value={p.to}
                            min={1}
                            max={1.1}
                            step={0.01}
                            onChange={(v) => set('to', v)}
                            format={(v) => `×${v.toFixed(2)}`}
                            help="…and settles at ×1.02: never exactly 1, so it never looks “finished too early”."
                        />
                        <Slider label="settle time" value={p.settle} min={0.4} max={3} step={0.1} onChange={(v) => set('settle', v)} format={(v) => `${v.toFixed(1)}s`} />
                        <Segmented label="settle ease" options={EASE_LIST} value={p.ease} onChange={(v) => set('ease', v)} />
                        <Slider label="fade time" value={p.fade} min={0.2} max={2} step={0.1} onChange={(v) => set('fade', v)} format={(v) => `${v.toFixed(1)}s`} />
                        <Slider label="fade starts after" value={p.fadeDelay} min={0} max={1} step={0.05} onChange={(v) => set('fadeDelay', v)} format={(v) => `${v.toFixed(2)}s`} />
                    </Group>
                    <Group title="The group">
                        <Slider
                            label="stagger step"
                            value={p.step}
                            min={0}
                            max={0.3}
                            step={0.01}
                            onChange={(v) => set('step', v)}
                            format={(v) => `${Math.round(v * 1000)} ms`}
                            help="House rule: 70 ms between items."
                        />
                        <Toggle label="cap the whole group" checked={p.cap} onChange={(v) => set('cap', v)} help="Squeezes the step so the last tile starts within about 0.5s, however many tiles." />
                        <Segmented
                            label="order"
                            options={[
                                { value: 'reading', label: 'reading' },
                                { value: 'columns', label: 'columns' },
                                { value: 'centre', label: 'centre out' },
                                { value: 'random', label: 'random (seeded)' },
                            ]}
                            value={p.order}
                            onChange={(v) => set('order', v)}
                        />
                        <Segmented
                            label="when"
                            options={[
                                { value: 'play', label: 'on replay' },
                                { value: 'scroll', label: 'on scroll (batch)' },
                            ]}
                            value={p.trigger}
                            onChange={(v) => set('trigger', v)}
                        />
                    </Group>
                    <Toggle label="colour placeholder" checked={p.colour} onChange={(v) => set('colour', v)} help="Off: the tile is paper until the photo fades in (an empty hole)." />
                    <Btn primary onClick={() => setRun((r) => r + 1)}>
                        ▶ Replay
                    </Btn>
                    <Readout
                        items={[
                            { label: 'step used', value: `${Math.round(step * 1000)} ms` },
                            { label: 'whole entrance', value: `${total.toFixed(1)}s` },
                        ]}
                    />
                </>
            }
        >
            <div ref={box} data-lenis-prevent className="al-scrollbox overflow-y-auto bg-[#e7e4df]" style={{ height: p.trigger === 'scroll' ? 440 : undefined }}>
                <div className="al-mono sticky top-0 z-10 bg-[#e7e4df] px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-[#6b6862]">
                    {p.trigger === 'scroll' ? '↓ scroll: tiles enter in batches' : 'replay to watch the whole group'}
                </div>
                {p.trigger === 'scroll' && <div className="h-[420px]" />}
                <div ref={grid} className="grid grid-cols-4 gap-2 p-3">
                    {ITEMS.map((c, i) => (
                        <div key={c.img} data-item className="relative aspect-[3/4] overflow-hidden" style={{ background: p.colour ? undefined : '#e7e4df' }}>
                            <div data-ph className="absolute inset-0" style={{ background: colours[i], opacity: p.colour ? 1 : 0 }} />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img data-img src={c.img} alt={c.alt} className="relative h-full w-full object-cover" />
                        </div>
                    ))}
                </div>
                {p.trigger === 'scroll' && <div className="h-[260px]" />}
            </div>
        </Demo>
    );
}

'use client';

import { type CSSProperties, useEffect, useRef, useState } from 'react';

import { Btn, Demo, Group, Readout, Slider, Toggle } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { useParams, useTicker } from '../kit/loop';
import { blockReset, blockReveal } from '../kit/reveal';
import { GALLERY, GALLERY_TRAVEL, LN } from '../kit/source';

const DEFAULTS = { pin: 2500, early: true, depthX: 1, exp: 1.8, scrub: 0.15 };
const DARK = [0x22, 0x28, 0x1c];
const LIGHT = [0xf1, 0xf3, 0xe8];
const clamp01 = gsap.utils.clamp(0, 1);

/**
 * The pinned horizontal gallery at 1920×1030, scaled down. The real layout (x, y, w, h, depth) comes
 * straight from data.ts. A sticky stage stands in for the pin; captions reveal on a horizontal check.
 */
export default function GalleryLab() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const frame = useRef<HTMLDivElement>(null);
    const box = useRef<HTMLDivElement>(null);
    const section = useRef<HTMLDivElement>(null);
    const stage = useRef<HTMLDivElement>(null);
    const track = useRef<HTMLDivElement>(null);
    const out = useRef<Record<string, HTMLElement | null>>({});
    const done = useRef<boolean[]>([]);
    const st = useRef({ t: 0 });
    const [scale, setScale] = useState(0.4);

    useEffect(() => {
        const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / 1920));
        ro.observe(frame.current!);
        return () => ro.disconnect();
    }, []);

    const rearm = () => {
        done.current = [];
        const tr = track.current;
        if (!tr) return;
        const lines = Array.from(tr.querySelectorAll<HTMLElement>('.gl-cap'));
        blockReset(
            lines,
            lines.map((l) => l.querySelector<HTMLElement>('.ll-br-block')!),
        );
    };

    useTicker(frame, (_t, dt) => {
        const el = box.current;
        const sec = section.current;
        const tr = track.current;
        const stg = stage.current;
        if (!el || !sec || !tr || !stg) return;
        const { pin, early, depthX, exp, scrub } = ref.current;
        const s = el.clientWidth / 1920;
        const vh = el.clientHeight;
        const top = sec.offsetTop;
        // movement: from "section top at 50% of the viewport" (or at the top) to the end of the pin
        const start = early ? top - vh * 0.5 : top;
        const end = top + pin * s;
        const target = clamp01((el.scrollTop - start) / (end - start));
        const k = scrub <= 0 ? 1 : 1 - Math.exp((-3 * dt) / scrub);
        st.current.t += (target - st.current.t) * k;
        const x = -GALLERY_TRAVEL * st.current.t;
        tr.style.transform = `translateX(${x}px)`;
        tr.querySelectorAll<HTMLElement>('[data-depth]').forEach((it) => {
            const d = Number(it.dataset.depth);
            it.style.transform = d !== 1 ? `translateX(${x * (d - 1) * depthX}px)` : '';
        });
        // background: dark → light over the travel, eased out
        const f = 1 - Math.pow(1 - clamp01((-x - 700) / 2444), exp);
        const c = DARK.map((dk, i) => Math.round(dk + (LIGHT[i] - dk) * f));
        stg.style.backgroundColor = `rgb(${c.join(',')})`;
        stg.style.setProperty('--g-ink', f > 0.45 ? '#2a2b25' : '#d9ddd0');
        const theme = f > 0.4 ? 'light' : 'dark';
        // captions: reveal once when they cross 96% of the width (and are vertically on screen)
        const secTop = sec.getBoundingClientRect().top - el.getBoundingClientRect().top;
        tr.querySelectorAll<HTMLElement>('.gl-cap').forEach((cap, i) => {
            const item = GALLERY[Number(cap.dataset.i)];
            if (done.current[i] || item.x + x >= 1920 * 0.96 || secTop + item.y * s >= vh * 0.92) return;
            done.current[i] = true;
            blockReveal([cap], [cap.querySelector<HTMLElement>('.ll-br-block')!]);
        });
        const o = out.current;
        if (o.t) o.t.textContent = st.current.t.toFixed(3);
        if (o.x) o.x.textContent = `${Math.round(x)} px`;
        if (o.f) o.f.textContent = f.toFixed(2);
        if (o.theme) o.theme.textContent = theme;
    });

    const autoplay = () => {
        const el = box.current;
        if (!el) return;
        const to = el.scrollTop > el.scrollHeight / 2 ? 0 : el.scrollHeight - el.clientHeight;
        gsap.to(el, { scrollTop: to, duration: 6, ease: 'none' });
    };

    const stageH = 1030 * scale;
    const rd = (k: string) => (
        <span
            ref={(el) => {
                out.current[k] = el;
            }}
        />
    );

    return (
        <Demo
            title="Horizontal gallery — scroll down, travel sideways"
            hint="Scroll inside the frame (or Auto-scroll). The section pins while the photo track slides 3060 px to the left and the background fades from dark to light."
            onReset={() => {
                reset();
                rearm();
                box.current?.scrollTo({ top: 0 });
            }}
            controls={
                <>
                    <Btn primary onClick={autoplay}>
                        ⇵ Auto-scroll
                    </Btn>
                    <Group title="Travel">
                        <Slider
                            label="pin length"
                            value={p.pin}
                            min={600}
                            max={5000}
                            step={50}
                            onChange={(v) => set('pin', v)}
                            format={(v) => `${v} px`}
                            help="Vertical scroll spent on 3060 px of sideways travel. Source: 2500."
                        />
                        <Toggle
                            label="start moving before the pin"
                            checked={p.early}
                            onChange={(v) => set('early', v)}
                            help="moveStart: 'top 50%'. The track already drifts while the section is still rising."
                        />
                        <Slider
                            label="scrub"
                            value={p.scrub}
                            min={0}
                            max={1.5}
                            onChange={(v) => set('scrub', v)}
                            format={(v) => `${v.toFixed(2)} s`}
                            help="Source: 0.15 — the reference motion already had its own lag."
                        />
                    </Group>
                    <Group title="Depth & colour">
                        <Slider
                            label="depth ×"
                            value={p.depthX}
                            min={0}
                            max={25}
                            step={0.5}
                            onChange={(v) => set('depthX', v)}
                            help="Exaggerates each card’s data-depth (0.98 – 1.02). 1 = the source."
                        />
                        <Slider
                            label="colour ease"
                            value={p.exp}
                            min={0.5}
                            max={5}
                            onChange={(v) => set('exp', v)}
                            format={(v) => `1−(1−t)^${v.toFixed(1)}`}
                            help="How early the background brightens. Source: 1.8."
                        />
                    </Group>
                    <Btn onClick={rearm}>↻ Re-arm captions</Btn>
                    <Readout
                        items={[
                            { label: 'progress', value: rd('t'), color: 'var(--ll-lime)' },
                            { label: 'track x', value: rd('x') },
                            { label: 'colour f', value: rd('f') },
                            { label: 'header', value: rd('theme') },
                        ]}
                    />
                </>
            }
        >
            <div ref={frame} className="relative overflow-hidden" style={{ height: stageH }}>
                <div ref={box} data-lenis-prevent className="ll-scrollbox absolute inset-0 overflow-y-auto">
                    <div className="flex items-center justify-center" style={{ height: stageH, background: LN.dark }}>
                        <span className="ll-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ll-faint)]">↓ scroll — the manifesto ends here</span>
                    </div>
                    <div ref={section} style={{ height: stageH + p.pin * scale }}>
                        <div className="sticky top-0 overflow-hidden" style={{ height: stageH }}>
                            <div ref={stage} className="absolute left-0 top-0 origin-top-left overflow-hidden" style={{ width: 1920, height: 1030, transform: `scale(${scale})`, background: LN.dark }}>
                                <div ref={track} className="absolute inset-0 will-change-transform">
                                    {GALLERY.map((it, i) => {
                                        const style = { left: it.x, top: it.y, width: it.w, height: it.kind === 'quote' ? undefined : it.h } as CSSProperties;
                                        if (it.kind === 'chip')
                                            return (
                                                <div
                                                    key={i}
                                                    data-depth={it.depth}
                                                    className="absolute flex items-center justify-center rounded-md border border-current text-[20px] font-bold"
                                                    style={{ ...style, color: 'var(--g-ink, #d9ddd0)' }}
                                                >
                                                    1 ⚑
                                                </div>
                                            );
                                        if (it.kind === 'quote')
                                            return (
                                                <div
                                                    key={i}
                                                    data-depth={it.depth}
                                                    className="absolute text-[28px] leading-[1.25] tracking-[0.04em]"
                                                    style={{ ...style, color: 'var(--g-ink, #d9ddd0)' }}
                                                >
                                                    <span className="gl-cap ll-serif inline-block" data-i={i} style={{ '--br-text': 0 } as CSSProperties}>
                                                        <span className="ll-br-inner">
                                                            <span className="ll-br-text">{it.text?.map(([t]) => t).join('')}</span>
                                                            <span className="ll-br-block" style={{ background: LN.lime }} aria-hidden />
                                                        </span>
                                                    </span>
                                                </div>
                                            );
                                        return (
                                            <figure key={i} data-depth={it.depth} className="absolute m-0" style={style}>
                                                <figcaption className="absolute -top-6 left-0 text-[12px] font-bold" style={{ color: 'var(--g-ink, #d9ddd0)' }}>
                                                    <span className="gl-cap inline-block" data-i={i} style={{ '--br-text': 0 } as CSSProperties}>
                                                        <span className="ll-br-inner">
                                                            <span className="ll-br-text">{it.caption}</span>
                                                            <span className="ll-br-block" style={{ background: LN.lime }} aria-hidden />
                                                        </span>
                                                    </span>
                                                </figcaption>
                                                <div className="size-full overflow-hidden bg-[#dcddd4]">
                                                    {/* eslint-disable-next-line @next/next/no-img-element -- teaching copy, sized by the slot */}
                                                    <img
                                                        src={it.src}
                                                        alt=""
                                                        loading="lazy"
                                                        className="size-full object-cover"
                                                        style={{
                                                            objectPosition: it.pos,
                                                            transform: `scale(${it.zoom ?? 1})`,
                                                            transformOrigin: it.pos,
                                                            filter: it.tone === 'duo' ? 'grayscale(1) contrast(0.95)' : undefined,
                                                        }}
                                                    />
                                                </div>
                                            </figure>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-center" style={{ height: stageH * 0.5, background: '#eff0e8' }}>
                        <span className="ll-mono text-[10px] uppercase tracking-[0.16em] text-[#6d6f66]">On / Off track section</span>
                    </div>
                </div>
            </div>
        </Demo>
    );
}

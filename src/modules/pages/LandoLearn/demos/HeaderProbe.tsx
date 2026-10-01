'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/utils/cn';

import { Demo, Readout, Slider, Toggle } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { useParams } from '../kit/loop';
import { MenuBars, Monogram } from '../kit/source';

type Theme = 'light' | 'dark' | 'dim';
const SECTIONS: { name: string; theme: Theme; bg: string; h: number; ink: string }[] = [
    { name: 'Hero', theme: 'light', bg: '#fafbf6', h: 380, ink: '#1b1c17' },
    { name: 'Hero card (pinned)', theme: 'dark', bg: '#22281c', h: 260, ink: '#dde2d2' },
    { name: 'Manifesto', theme: 'dark', bg: '#22281c', h: 300, ink: '#dde2d2' },
    { name: 'Gallery (turns light)', theme: 'light', bg: '#e9eae1', h: 260, ink: '#1b1c17' },
    { name: 'On / Off track', theme: 'light', bg: '#eff0e8', h: 300, ink: '#1b1c17' },
    { name: 'Helmets', theme: 'dark', bg: '#111111', h: 340, ink: '#f1f3e8' },
    { name: 'On Track page', theme: 'dim', bg: '#111111', h: 300, ink: '#f1f3e8' },
];
const TONES: Record<Theme, { ink: string; btn: string; btnInk: string }> = {
    light: { ink: '#1b1c17', btn: 'transparent', btnInk: '#1b1c17' },
    dark: { ink: '#f1f3e8', btn: '#f1f3e8', btnInk: '#1b1c17' },
    dim: { ink: '#b5b7ae', btn: '#2a2c26', btnInk: '#f1f3e8' },
};

const DEFAULTS = { threshold: 24, duration: 0.5, probe: true };
const PROBE_Y = 30; // the header's middle line in this mini page (50 px on the real one)

/** The header reads the section under it on every scroll: compact after a few px, colours from data-header. */
export default function HeaderProbe() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const box = useRef<HTMLDivElement>(null);
    const header = useRef<HTMLDivElement>(null);
    const [state, setState] = useState({ y: 0, compact: false, theme: 'light' as Theme, name: 'Hero' });

    useEffect(() => {
        const el = box.current!;
        const probe = () => {
            const top = el.getBoundingClientRect().top;
            let hit = SECTIONS[0];
            el.querySelectorAll<HTMLElement>('[data-header]').forEach((s, i) => {
                const r = s.getBoundingClientRect();
                if (r.top - top <= PROBE_Y && r.bottom - top > PROBE_Y) hit = SECTIONS[i];
            });
            const compact = el.scrollTop > ref.current.threshold;
            setState((prev) =>
                prev.compact === compact && prev.theme === hit.theme && prev.name === hit.name && Math.abs(prev.y - el.scrollTop) < 4
                    ? prev
                    : { y: el.scrollTop, compact, theme: hit.theme, name: hit.name },
            );
        };
        el.addEventListener('scroll', probe, { passive: true });
        probe();
        return () => el.removeEventListener('scroll', probe);
    }, [ref]);

    // same tweens as shell/Header.tsx (sizes scaled to this mini header)
    useEffect(() => {
        const h = header.current;
        if (!h) return;
        const k = state.compact ? 1 : 0;
        const opts = { duration: p.duration, ease: 'power3.out' };
        gsap.to(h.querySelector('.hp-word'), { scale: 1 - 0.155 * k, ...opts });
        gsap.to(h.querySelector('.hp-store'), { width: 78 - 13 * k, height: 40 - 7 * k, ...opts });
        gsap.to(h.querySelector('.hp-menu'), { width: 40 - 7 * k, height: 40 - 7 * k, ...opts });
        gsap.to(h.querySelector('.hp-mono'), { autoAlpha: state.compact ? 0 : 1, duration: 0.3 });
    }, [state.compact, p.duration]);

    const tone = TONES[state.theme];

    return (
        <Demo
            title="Header probe — compact + theme"
            hint="Scroll the mini page. The header shrinks after a few pixels and takes the colours of whatever section sits under its middle line."
            onReset={reset}
            controls={
                <>
                    <Slider
                        label="compact after"
                        value={p.threshold}
                        min={0}
                        max={200}
                        step={1}
                        onChange={(v) => set('threshold', v)}
                        format={(v) => `${v} px`}
                        help="Source: 24 px — almost immediately."
                    />
                    <Slider label="duration" value={p.duration} min={0.1} max={1.5} onChange={(v) => set('duration', v)} format={(v) => `${v.toFixed(2)} s`} help="Source: 0.5 s power3.out." />
                    <Toggle label="show probe line" checked={p.probe} onChange={(v) => set('probe', v)} />
                    <Readout
                        items={[
                            { label: 'scrollY', value: Math.round(state.y) },
                            { label: 'compact', value: String(state.compact), color: state.compact ? 'var(--ll-lime)' : undefined },
                            { label: 'data-header', value: state.theme, color: 'var(--ll-lime)' },
                            { label: 'section', value: state.name },
                        ]}
                    />
                </>
            }
        >
            <div className="relative h-[420px] overflow-hidden">
                <div ref={header} className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between px-3 pt-2.5">
                    <div className="hp-word origin-top-left leading-[0.9] transition-colors duration-300" style={{ color: tone.ink }}>
                        <div className="ll-serif text-[20px]">ELLIS</div>
                        <div className="text-[20px] font-extrabold">MORROW</div>
                    </div>
                    <div className="hp-mono absolute left-1/2 top-3 w-6 -translate-x-1/2 transition-colors duration-300" style={{ color: tone.ink }}>
                        <Monogram />
                    </div>
                    <div className="flex items-start gap-1.5">
                        <span className="hp-store flex items-center justify-center rounded-md bg-[#cdff0b] text-[12px] font-extrabold text-[#1b1c17]" style={{ width: 78, height: 40 }}>
                            STORE
                        </span>
                        <span
                            className="hp-menu flex items-center justify-center rounded-lg border-2 transition-colors duration-300"
                            style={{ width: 40, height: 40, background: tone.btn, color: tone.btnInk, borderColor: state.theme === 'light' ? '#1b1c17' : tone.btn }}
                        >
                            <MenuBars className="size-7" />
                        </span>
                    </div>
                </div>
                {p.probe && (
                    <div className="pointer-events-none absolute inset-x-0 z-20 border-t border-dashed border-[var(--ll-warn)]" style={{ top: PROBE_Y }}>
                        <span className="ll-mono absolute left-1/2 top-0.5 -translate-x-1/2 bg-black/50 px-1 text-[9px] text-[var(--ll-warn)]">probe y</span>
                    </div>
                )}
                <div ref={box} data-lenis-prevent className="ll-scrollbox h-full overflow-y-auto">
                    {SECTIONS.map((s) => (
                        <div key={s.name} data-header={s.theme} className={cn('flex items-end px-4 pb-4')} style={{ height: s.h, background: s.bg, color: s.ink }}>
                            <span className="ll-mono text-[10.5px] uppercase tracking-[0.14em] opacity-70">{`${s.name} · data-header="${s.theme}"`}</span>
                        </div>
                    ))}
                </div>
            </div>
        </Demo>
    );
}

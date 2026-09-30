'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

import { SOCIALS } from '../data';
import { motion, useIglooUI } from '../store';
import { ambience } from '../utils/sound';

import { hoverScramble, scrambleIn } from './scramble';

const wrap = (i: number) => (i + SOCIALS.length) % SOCIALS.length;
const pad = (i: number) => String(i + 1).padStart(2, '0');

function Arrow({ dir, onClick }: { dir: -1 | 1; onClick: () => void }) {
    const ref = useRef<HTMLButtonElement>(null);
    const labelRef = useRef<HTMLSpanElement>(null);
    const word = dir < 0 ? 'PREV' : 'NEXT';

    // magnetic: the arrow leans toward the cursor while hovered
    const onMove = (e: React.MouseEvent) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        gsap.to(el.querySelector('.ig-arrow-inner'), {
            x: (e.clientX - (r.left + r.width / 2)) * 0.25,
            y: (e.clientY - (r.top + r.height / 2)) * 0.25,
            duration: 0.5,
            ease: 'power3.out',
        });
    };
    const onLeave = () => gsap.to(ref.current?.querySelector('.ig-arrow-inner') ?? [], { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.45)' });

    return (
        <button
            ref={ref}
            type="button"
            aria-label={dir < 0 ? 'Previous' : 'Next'}
            onClick={onClick}
            onMouseEnter={() => {
                ambience.tick(dir < 0 ? 1500 : 1700);
                hoverScramble(labelRef.current, word);
            }}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            className={`ig-arrow pointer-events-auto absolute top-1/2 -translate-y-1/2 p-6 ${dir < 0 ? 'left-[8%] sm:left-[16%]' : 'right-[8%] sm:right-[16%]'}`}
        >
            <span className="ig-arrow-inner relative flex flex-col items-center">
                <span className="ig-arrow-ring" aria-hidden>
                    <svg viewBox="0 0 48 48" width="48" height="48">
                        <circle cx="24" cy="24" r="22" pathLength={1} />
                    </svg>
                </span>
                <svg width="56" height="10" viewBox="0 0 56 10" fill="none" stroke="currentColor" strokeWidth="1.2" className={dir < 0 ? '' : 'rotate-180'}>
                    <path className="ig-arrow-shaft" d="M55 5H1" />
                    <path d="M1 5L6 1M1 5L6 9" />
                </svg>
                <span ref={labelRef} className="ig-arrow-label mt-2 block text-[9px] tracking-[0.2em]">
                    {word}
                </span>
            </span>
        </button>
    );
}

/** Neighbouring shape name: brightens, leans toward centre, re-decodes, underline draws. */
function SideLabel({ dir, text, onClick }: { dir: -1 | 1; text: string; onClick: () => void }) {
    const ref = useRef<HTMLButtonElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    return (
        <button
            ref={ref}
            type="button"
            onClick={onClick}
            onMouseEnter={() => {
                ambience.tick(dir < 0 ? 1350 : 1550);
                hoverScramble(textRef.current, text);
                gsap.to(ref.current, { opacity: 1, x: -dir * 6, duration: 0.5, ease: 'expo.out', overwrite: 'auto' });
            }}
            onMouseLeave={() => gsap.to(ref.current, { opacity: 0.7, x: 0, duration: 0.6, ease: 'expo.out', overwrite: 'auto' })}
            className={`ig-side pointer-events-auto hidden w-24 sm:block ${dir < 0 ? 'text-right' : 'text-left'}`}
        >
            <span key={text} ref={textRef} className={`ig-side-text ${dir < 0 ? 'is-prev' : 'is-next'}`}>
                {text}
            </span>
        </button>
    );
}

export default function SocialCarousel() {
    const social = useIglooUI((s) => s.social);
    const root = useRef<HTMLDivElement>(null);
    const labelRef = useRef<HTMLAnchorElement>(null);
    const countRef = useRef<HTMLSpanElement>(null);
    const barRef = useRef<HTMLSpanElement>(null);
    const lastDir = useRef(1);

    const go = (dir: -1 | 1) => {
        lastDir.current = dir;
        ambience.tick(dir > 0 ? 1600 : 1300);
        useIglooUI.getState().set({ social: wrap(useIglooUI.getState().social + dir) });
    };

    // label decode + side labels slide in from the direction of travel
    useEffect(() => {
        const el = root.current;
        if (!el) return;
        const ctx = gsap.context(() => {
            scrambleIn(labelRef.current, { text: SOCIALS[social].label, duration: 0.8 });
            scrambleIn(countRef.current, { text: `${pad(social)} / ${pad(SOCIALS.length - 1)}`, duration: 0.5 });
            gsap.fromTo('.ig-side', { x: 18 * lastDir.current, opacity: 0 }, { x: 0, opacity: 0.7, duration: 0.9, ease: 'expo.out', stagger: 0.05 });
            gsap.fromTo('.ig-current', { scale: 0.92 }, { scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.6)' });
        }, el);
        return () => ctx.revert();
    }, [social]);

    // morph progress bar follows the particles re-forming
    useEffect(() => {
        const tick = () => {
            if (barRef.current) barRef.current.style.transform = `scaleX(${motion.morph.toFixed(3)})`;
        };
        gsap.ticker.add(tick);
        return () => gsap.ticker.remove(tick);
    }, []);

    // keyboard
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (useIglooUI.getState().section !== 3 || useIglooUI.getState().detail >= 0) return;
            if (e.key === 'ArrowRight') go(1);
            if (e.key === 'ArrowLeft') go(-1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
        <div ref={root} className="ig-colony pointer-events-none invisible fixed inset-0 z-10 opacity-0">
            <Arrow dir={-1} onClick={() => go(-1)} />
            <Arrow dir={1} onClick={() => go(1)} />

            <div className="absolute bottom-[calc(var(--ig-gutter)+118px)] left-1/2 sm:bottom-[calc(var(--ig-gutter)+4px)] flex -translate-x-1/2 flex-col items-center gap-3 text-xs">
                <p className="ig-colony-hint hidden text-[10px] tracking-[0.08em] opacity-75 sm:block">move · sweep &nbsp;&nbsp; drag · spin &nbsp;&nbsp; click · shock</p>

                <div className="flex items-center gap-6">
                    <SideLabel dir={-1} text={SOCIALS[wrap(social - 1)].label} onClick={() => go(-1)} />
                    <a
                        ref={labelRef}
                        href={SOCIALS[social].href}
                        target="_blank"
                        rel="noreferrer"
                        onMouseEnter={() => {
                            ambience.tick(2200);
                            hoverScramble(labelRef.current, SOCIALS[useIglooUI.getState().social].label);
                        }}
                        className="ig-current ig-bracket pointer-events-auto relative min-w-[9.5rem] px-6 py-3 text-center font-bold"
                    >
                        {SOCIALS[social].label}
                    </a>
                    <SideLabel dir={1} text={SOCIALS[wrap(social + 1)].label} onClick={() => go(1)} />
                </div>

                <div className="flex w-[9.5rem] items-center gap-2 text-[10px] opacity-70">
                    <span ref={countRef} className="tabular-nums">
                        {pad(social)} / {pad(SOCIALS.length - 1)}
                    </span>
                    <span className="relative h-px flex-1 bg-white/25">
                        <span ref={barRef} className="absolute inset-0 origin-left bg-current" />
                    </span>
                </div>
            </div>
        </div>
    );
}

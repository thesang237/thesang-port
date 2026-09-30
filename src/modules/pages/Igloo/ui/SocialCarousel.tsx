'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

import { SOCIALS } from '../data';
import { useIglooUI } from '../store';
import { ambience } from '../utils/sound';

import { scrambleIn } from './scramble';

const wrap = (i: number) => (i + SOCIALS.length) % SOCIALS.length;

export default function SocialCarousel() {
    const social = useIglooUI((s) => s.social);
    const labelRef = useRef<HTMLAnchorElement>(null);
    const root = useRef<HTMLDivElement>(null);

    const go = (dir: number) => {
        ambience.tick(dir > 0 ? 1600 : 1300);
        useIglooUI.getState().set({ social: wrap(useIglooUI.getState().social + dir) });
    };

    useEffect(() => {
        scrambleIn(labelRef.current, { text: SOCIALS[social].label, duration: 0.7 });
        gsap.fromTo(root.current?.querySelectorAll('.ig-side') ?? [], { opacity: 0 }, { opacity: 0.45, duration: 0.6, stagger: 0.05 });
    }, [social]);

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
            <button type="button" aria-label="Previous" onClick={() => go(-1)} className="ig-arrow pointer-events-auto absolute left-[18%] top-1/2 -translate-y-1/2 p-4">
                <svg width="46" height="10" viewBox="0 0 46 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M45 5H1M1 5L6 1M1 5L6 9" />
                </svg>
            </button>
            <button type="button" aria-label="Next" onClick={() => go(1)} className="ig-arrow pointer-events-auto absolute right-[18%] top-1/2 -translate-y-1/2 p-4">
                <svg width="46" height="10" viewBox="0 0 46 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M1 5H45M45 5L40 1M45 5L40 9" />
                </svg>
            </button>

            <div className="absolute bottom-[calc(var(--ig-gutter)+8px)] left-1/2 flex -translate-x-1/2 items-center gap-6 text-xs">
                <button type="button" onClick={() => go(-1)} className="ig-side pointer-events-auto hidden w-24 truncate text-right opacity-40 md:block">
                    {SOCIALS[wrap(social - 1)].label}
                </button>
                <a
                    ref={labelRef}
                    href={SOCIALS[social].href}
                    target="_blank"
                    rel="noreferrer"
                    onMouseEnter={() => ambience.tick(2200)}
                    className="ig-bracket pointer-events-auto relative min-w-[9.5rem] px-6 py-3 text-center font-bold"
                >
                    {SOCIALS[social].label}
                </a>
                <button type="button" onClick={() => go(1)} className="ig-side pointer-events-auto hidden w-24 truncate text-left opacity-40 md:block">
                    {SOCIALS[wrap(social + 1)].label}
                </button>
            </div>
        </div>
    );
}

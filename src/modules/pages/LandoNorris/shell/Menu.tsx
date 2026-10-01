'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

import BlockReveal, { type BlockRevealHandle } from '@/components/motion-kit/BlockReveal';
import { gsap, useGSAP } from '@/components/motion-kit/gsap';
import { TransitionLink } from '@/components/motion-kit/PageTransition';
import RollingText, { type RollingTextHandle } from '@/components/motion-kit/RollingText';
import { useSmoothScroll } from '@/components/motion-kit/SmoothScroll';
import { usePathname } from '@/i18n/navigation';

import { IMG, NAV, SOCIALS, TEAM_LINE } from '../data';
import { Emblem } from '../graphics';
import LnImage from '../LnImage';
import { useLN } from '../store';

const MenuGL = dynamic(() => import('../gl/MenuGL'), { ssr: false });

// photo slots measured at 1920×1030 (x, y, w, h) — one per nav item
export const MENU_PHOTOS = [
    { src: IMG.portraitHelmet, x: 62, y: 130, w: 409, h: 444, pos: '50% 18%', zoom: 1.35 },
    { src: IMG.portrait, x: 537, y: -45, w: 409, h: 444, pos: '50% 22%', zoom: 1.5 },
    { src: IMG.profile, x: 62, y: 642, w: 409, h: 444, pos: '62% 25%', zoom: 1.15 },
    { src: IMG.scene, x: 537, y: 467, w: 409, h: 444, pos: '35% 60%', zoom: 1.2 },
];

// panel: SVG with a quadratic bottom (depth ≈ 7.4 % of height) scaled on Y from the top
// measured bottom-edge progress: open ≈ power1.out over 0.41s, close ≈ power1.in over 0.33s
const OPEN = 0.41;
const CLOSE = 0.25; // video-verified: ref edge 977→0 in ≈6 frames

export default function Menu() {
    const root = useRef<HTMLDivElement>(null);
    const open = useLN((s) => s.menuOpen);
    const lenis = useSmoothScroll();
    const pathname = usePathname();
    const current = Math.max(
        0,
        NAV.findIndex((n) => n.href === pathname.replace(/\/+$/, '')),
    );
    const [active, setActive] = useState<number>(current);
    const [mounted, setMounted] = useState(false);
    const rolls = useRef<Array<RollingTextHandle | null>>([]);
    const reveals = useRef<Array<BlockRevealHandle | null>>([]);
    const tl = useRef<gsap.core.Timeline | null>(null);

    // mount the WebGL layer on first open; follow route changes (adjust-state-during-render pattern)
    if (open && !mounted) setMounted(true);
    const [prevCurrent, setPrevCurrent] = useState(current);
    if (prevCurrent !== current) {
        setPrevCurrent(current);
        setActive(current);
    }

    useEffect(() => {
        if (open) lenis?.stop();
        else lenis?.start();
    }, [open, lenis]);

    useGSAP(
        () => {
            const q = gsap.utils.selector(root);
            tl.current?.kill();
            if (open) {
                const t = gsap.timeline();
                t.set(root.current, { autoAlpha: 1, pointerEvents: 'auto' })
                    .fromTo(q('.ln-menu-panel'), { scaleY: 0 }, { scaleY: 1, duration: OPEN, ease: 'power1.out' }, 0)
                    .fromTo(q('.ln-menu-contours'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.2)
                    .fromTo(q('.ln-menu-photo'), { '--clip': 0 }, { '--clip': 1, duration: 0.34, ease: 'power2.out', stagger: { each: 0.06, from: 'start' } }, 0.16)
                    .fromTo(q('.ln-menu-item-in'), { yPercent: 110 }, { yPercent: 0, duration: 0.26, ease: 'power3.out', stagger: 0.075 }, 0.38)
                    .fromTo(q('.ln-menu-strike'), { '--draw': 0 }, { '--draw': 1, duration: 0.4, ease: 'power2.out' }, 0.55)
                    .fromTo(q('.ln-menu-emblem'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 0.55)
                    .call(() => reveals.current.forEach((r, i) => void r?.play(i === 0 ? 0 : 0.04 + i * 0.05)), [], 0.57);
                tl.current = t;
            } else if (mounted) {
                const t = gsap.timeline({ onComplete: () => void gsap.set(root.current, { autoAlpha: 0, pointerEvents: 'none' }) });
                t.call(() => reveals.current.forEach((r) => void r?.reverse()), [], 0)
                    .to(q('.ln-menu-emblem'), { autoAlpha: 0, duration: 0.2 }, 0.1)
                    .to(q('.ln-menu-item-in'), { yPercent: 110, duration: 0.22, ease: 'power2.in', stagger: 0.04 }, 0.25)
                    .to(q('.ln-menu-photo'), { '--clip': 0, duration: 0.3, ease: 'power2.in', stagger: 0.04 }, 0.35)
                    .to(q('.ln-menu-contours'), { autoAlpha: 0, duration: 0.25 }, 0.5)
                    .to(q('.ln-menu-panel'), { scaleY: 0, duration: CLOSE, ease: 'power1.in' }, 0.57);
                tl.current = t;
            }
        },
        { scope: root, dependencies: [open] },
    );

    const onItemEnter = (i: number) => {
        rolls.current[i]?.enter();
        setActive(i);
    };
    const onItemLeave = (i: number) => {
        rolls.current[i]?.leave();
        setActive(current);
    };

    return (
        <div ref={root} className="ln-menu" data-open={open ? '1' : '0'} aria-hidden={!open}>
            <svg className="ln-menu-panel" viewBox="0 0 1920 1112" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 0H1920V1030Q960 1194 0 1030Z" fill="var(--ln-dark)" />
            </svg>
            <div className="ln-menu-contours" aria-hidden="true" />

            <div className="ln-menu-photos">
                {MENU_PHOTOS.map((p, i) => (
                    <div key={i} className="ln-menu-photo" data-menu-photo={i} data-active={active === i ? '1' : '0'} style={{ left: p.x, top: p.y, width: p.w, height: p.h }}>
                        {/* DOM fallback (hidden once the WebGL layer is ready) */}
                        <LnImage src={p.src} sizes="410px" style={{ objectPosition: p.pos, transform: `scale(${p.zoom})` }} />
                    </div>
                ))}
            </div>
            {mounted && <MenuGL photos={MENU_PHOTOS} active={active} open={open} />}

            <nav className="ln-menu-nav" aria-label="Main">
                {NAV.map((n, i) => (
                    <div key={n.label} className="ln-menu-item" data-current={i === current ? '1' : '0'}>
                        <TransitionLink
                            href={n.href}
                            className="ln-menu-item-in"
                            onMouseEnter={() => onItemEnter(i)}
                            onMouseLeave={() => onItemLeave(i)}
                            onClick={() => {
                                if (i === current) useLN.getState().set({ menuOpen: false });
                            }}
                        >
                            <RollingText
                                text={n.label}
                                self={false}
                                ref={(r) => {
                                    rolls.current[i] = r;
                                }}
                            />
                            {i === current && (
                                <svg className="ln-menu-strike" viewBox="0 0 260 24" preserveAspectRatio="none" aria-hidden="true">
                                    <path d="M0 13H40C58 13 62 5 78 5H176C192 5 196 16 212 16H260" pathLength={1} />
                                </svg>
                            )}
                        </TransitionLink>
                    </div>
                ))}
            </nav>

            <div className="ln-menu-emblem">
                <Emblem className="ln-menu-emblem-svg" />
            </div>
            <BlockReveal
                className="ln-menu-team"
                trigger="manual"
                split={false}
                ref={(r) => {
                    reveals.current[0] = r;
                }}
            >
                {TEAM_LINE}
            </BlockReveal>
            <BlockReveal
                className="ln-menu-biz"
                trigger="manual"
                split={false}
                ref={(r) => {
                    reveals.current[1] = r;
                }}
            >
                BUSINESS ENQUIRIES
            </BlockReveal>
            <div className="ln-menu-socials">
                {SOCIALS.map((s, i) => (
                    <BlockReveal
                        key={s}
                        as="span"
                        trigger="manual"
                        split={false}
                        ref={(r) => {
                            reveals.current[2 + i] = r;
                        }}
                    >
                        {s}
                    </BlockReveal>
                ))}
            </div>
        </div>
    );
}

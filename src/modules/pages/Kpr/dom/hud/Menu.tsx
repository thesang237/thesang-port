'use client';

import { useEffect, useRef } from 'react';

import { gsap, useGSAP } from '@/components/motion-kit/gsap';
import { useSmoothScroll } from '@/components/motion-kit/SmoothScroll';

import { MENU } from '../../data/copy';
import { useUi } from '../../scroll/useScrollStore';
import { Chevron, Close, KeeperMark, Marketplace } from '../icons';
import { LinkHover } from '../sections/Footer';
import { EASE_IN_OUT, EASE_OUT } from '../ui/reveal';
import { Hacky, scrambleTween } from '../ui/Text';

import { AudioBars } from './Hud';

/**
 * Menu: black notched panel from the left (two nested masks slide in opposite directions so the
 * content is uncovered, not pushed), page washes to white, links rise line by line and decode.
 * Hover: white block with a notched corner behind the link; active link: lime block + page number.
 */
export default function Menu() {
    const ref = useRef<HTMLDivElement>(null);
    const open = useUi((s) => s.menuOpen);
    const lenis = useSmoothScroll();
    const tl = useRef<gsap.core.Timeline | null>(null);
    const closeBtn = useRef<HTMLButtonElement>(null);

    useGSAP(
        () => {
            const root = ref.current!;
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const q = (s: string) => root.querySelectorAll<HTMLElement>(s);
            const t = gsap.timeline({ paused: true, defaults: { ease: EASE_OUT } });
            t.fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001, ease: 'none' }, 0);
            if (reduced) {
                t.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.16, ease: 'none' });
            } else {
                t.fromTo(q('.kpr-menu__underlay'), { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'none' }, 0)
                    .fromTo(q('.kpr-menu__maskOuter'), { xPercent: -100 }, { xPercent: 0, duration: 0.75, ease: EASE_IN_OUT }, 0)
                    .fromTo(q('.kpr-menu__maskInner'), { xPercent: 100 }, { xPercent: 0, duration: 0.75, ease: EASE_IN_OUT }, 0)
                    .fromTo(q('.kpr-menu__barOuter'), { yPercent: -100 }, { yPercent: 0, duration: 0.7, ease: EASE_IN_OUT }, 0.15)
                    .fromTo(q('.kpr-menu__barInner'), { yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: EASE_IN_OUT }, 0.15)
                    .fromTo(q('.kpr-menu__item .kpr-menu__label'), { yPercent: 105 }, { yPercent: 0, duration: 0.8, stagger: 0.06 }, 0.35)
                    .fromTo(q('.kpr-menu__fade'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.05 }, 0.55);
            }
            tl.current = t;
            return () => t.kill();
        },
        { scope: ref },
    );

    useEffect(() => {
        const t = tl.current;
        if (!t) return;
        if (open) {
            lenis?.stop();
            t.timeScale(1).play();
            ref.current?.querySelectorAll<HTMLElement>('.kpr-menu__item').forEach((el, i) =>
                setTimeout(
                    () => {
                        scrambleTween(el, 0.6);
                    },
                    350 + i * 60,
                ),
            );
            closeBtn.current?.focus({ preventScroll: true });
            const onKey = (e: KeyboardEvent) => e.key === 'Escape' && useUi.getState().set({ menuOpen: false });
            window.addEventListener('keydown', onKey);
            return () => window.removeEventListener('keydown', onKey);
        }
        t.timeScale(1.8).reverse();
        lenis?.start();
        if (t.progress() > 0) document.querySelector<HTMLElement>('.kpr-hud__burger')?.focus({ preventScroll: true });
    }, [open, lenis]);

    const close = () => useUi.getState().set({ menuOpen: false });

    return (
        <div ref={ref} className="kpr-menu" role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!open} inert={!open}>
            <div className="kpr-menu__underlay" onClick={close} aria-hidden="true" />
            <div className="kpr-menu__panel">
                <div className="kpr-menu__maskOuter">
                    <div className="kpr-menu__maskInner">
                        <div className="kpr-menu__content">
                            <div className="kpr-menu__section kpr-menu__nav">
                                <div className="kpr-menu__left kpr-cap2 kpr-menu__fade">
                                    <i className="kpr-dot" aria-hidden="true" />
                                    {MENU.discover}
                                </div>
                                <nav className="kpr-menu__right" aria-label="Site">
                                    {MENU.items.map((it) => (
                                        <a
                                            key={it.label}
                                            href="#"
                                            className={`kpr-menu__item ${it.active ? 'is-active' : ''}`}
                                            aria-current={it.active ? 'page' : undefined}
                                            onPointerEnter={(e) => scrambleTween(e.currentTarget, 0.45)}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                close();
                                            }}
                                            data-sfx
                                        >
                                            <span className="kpr-menu__bg" aria-hidden="true">
                                                <svg className="kpr-menu__corner" viewBox="0 0 20 20" preserveAspectRatio="none">
                                                    <path d="M20 0 V8 L8 20 H0 Z" />
                                                </svg>
                                            </span>
                                            <span className="kpr-menu__labelMask">
                                                <span className="kpr-menu__label">
                                                    <Hacky text={it.label} reveal={false} />
                                                </span>
                                            </span>
                                            <span className="kpr-menu__extra kpr-cap2" aria-hidden="true">
                                                {it.extra}
                                            </span>
                                        </a>
                                    ))}
                                </nav>
                            </div>
                            <div className="kpr-menu__section">
                                <div className="kpr-menu__left kpr-cap2 kpr-menu__fade">
                                    <i className="kpr-dot" aria-hidden="true" />
                                    {MENU.connect}
                                </div>
                                <div className="kpr-menu__right kpr-menu__socials kpr-menu__fade">
                                    {MENU.socials.map((s) => (
                                        <LinkHover key={s}>{s}</LinkHover>
                                    ))}
                                </div>
                            </div>
                            <div className="kpr-menu__section">
                                <div className="kpr-menu__left kpr-cap2 kpr-menu__fade">
                                    <i className="kpr-dot" aria-hidden="true" />
                                    {MENU.buy}
                                </div>
                                <div className="kpr-menu__right kpr-menu__fade kpr-menu__market">
                                    <Marketplace className="kpr-menu__marketIcon" />
                                    <LinkHover>{MENU.market}</LinkHover>
                                </div>
                            </div>
                            <div className="kpr-menu__section kpr-menu__misc kpr-cap2">
                                <div className="kpr-menu__left kpr-menu__fade">
                                    {MENU.region} <Chevron className="kpr-menu__chev" />
                                </div>
                                <div className="kpr-menu__right kpr-menu__fade kpr-menu__copy">{MENU.copyright}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="kpr-menu__bar">
                    <div className="kpr-menu__barOuter">
                        <div className="kpr-menu__barInner">
                            <button ref={closeBtn} type="button" className="kpr-menu__close" aria-label="Close menu" onClick={close} data-sfx>
                                <Close className="kpr-menu__closeIcon" />
                            </button>
                            <KeeperMark className="kpr-menu__mark" aria-hidden="true" />
                            <AudioBars className="kpr-menu__audio" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

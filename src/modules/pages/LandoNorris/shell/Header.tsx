'use client';

import { useEffect, useRef } from 'react';

import { gsap, useGSAP } from '@/components/motion-kit/gsap';
import { TransitionLink } from '@/components/motion-kit/PageTransition';
import { useSmoothScroll } from '@/components/motion-kit/SmoothScroll';

import { BagIcon, MenuBars, Monogram } from '../graphics';
import { useLN } from '../store';

/*
 * Measured: wordmark 24,25 → 196,103; monogram 937–983 × 34–80; STORE 1648–1804 × 24–103 (r 8);
 * menu 1818–1897 × 24–103 (2px border, r 10). Compact after scroll: wordmark ×0.845, buttons 130/66 px.
 */
export default function Header() {
    const root = useRef<HTMLElement>(null);
    const lenis = useSmoothScroll();
    const menuOpen = useLN((s) => s.menuOpen);
    const compact = useLN((s) => s.headerCompact);
    const theme = useLN((s) => s.headerTheme);

    useEffect(() => {
        if (!lenis) return;
        // theme = data-header of the deepest section whose box contains the header line (y = 50)
        const probe = () => {
            const st = useLN.getState();
            const c = lenis.scroll > 24;
            let theme = st.headerTheme;
            let best: HTMLElement | null = null;
            document.querySelectorAll<HTMLElement>('.ln-page [data-header]').forEach((el) => {
                const r = el.getBoundingClientRect();
                if (r.top <= 50 && r.bottom > 50 && (!best || best.contains(el) || r.top >= best.getBoundingClientRect().top)) best = el;
            });
            if (best) theme = ((best as HTMLElement).dataset.header as typeof theme) ?? 'light';
            if (c !== st.headerCompact || theme !== st.headerTheme) st.set({ headerCompact: c, headerTheme: theme });
        };
        lenis.on('scroll', probe);
        const id = window.setInterval(probe, 250); // pinned sections change theme without scrolling the element
        probe();
        return () => {
            lenis.off('scroll', probe);
            window.clearInterval(id);
        };
    }, [lenis]);

    useGSAP(
        () => {
            const k = compact ? 1 : 0;
            gsap.to('.ln-hd-word', { scale: 1 - 0.155 * k, duration: 0.5, ease: 'power3.out' });
            gsap.to('.ln-hd-store', { width: 156 - 26 * k, height: 79 - 13 * k, duration: 0.5, ease: 'power3.out' });
            gsap.to('.ln-hd-store-inner', { scale: 1 - 0.14 * k, duration: 0.5, ease: 'power3.out' });
            gsap.to('.ln-hd-menu', { width: 79 - 13 * k, height: 79 - 13 * k, duration: 0.5, ease: 'power3.out' });
        },
        { scope: root, dependencies: [compact] },
    );

    const monoHidden = compact || menuOpen;
    const tone = menuOpen ? 'dark' : theme;

    return (
        <header ref={root} className="ln-header" data-tone={tone} data-menu={menuOpen ? 'open' : 'closed'}>
            <TransitionLink href="/landonorris" className="ln-hd-word" aria-label="Ellis Morrow — home">
                <span className="ln-hd-first">ELLIS</span>
                <span className="ln-hd-last">MORROW</span>
            </TransitionLink>

            <div className="ln-hd-mono" data-hidden={monoHidden ? '1' : '0'}>
                <Monogram />
            </div>

            <div className="ln-hd-actions">
                <a className="ln-hd-store" href="#store" onClick={(e) => e.preventDefault()}>
                    <span className="ln-hd-store-inner">
                        <BagIcon className="ln-hd-bag" />
                        <span className="ln-hd-store-label">STORE</span>
                    </span>
                </a>
                <button
                    type="button"
                    className="ln-hd-menu"
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={menuOpen}
                    onClick={() => useLN.getState().set({ menuOpen: !useLN.getState().menuOpen })}
                >
                    <MenuBars className="ln-hd-bars" />
                    <svg className="ln-hd-x" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" aria-hidden="true">
                        <path d="M15 15l10 10M25 15 15 25" />
                    </svg>
                </button>
            </div>
        </header>
    );
}

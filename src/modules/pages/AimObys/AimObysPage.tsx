'use client';

import './aim.scss';

import { type MouseEvent, useCallback, useEffect, useRef } from 'react';

import { CustomEase, gsap, useGSAP } from '@/components/motion-kit/gsap';
import SmoothScroll, { useSmoothScroll } from '@/components/motion-kit/SmoothScroll';

import { applyTracks, EASE_PATH, elementProgress, type ElementTracks, sample, smooth } from './lib/ix';
import { setLottieProgress, useLottie } from './lib/useLottie';
import footerData from './lottie/footer.json';
import loadingData from './lottie/loading.json';
import scrollData from './lottie/scroll.json';
import About from './sections/About';
import Experiment from './sections/Experiment';
import Footer from './sections/Footer';
import Hero from './sections/Hero';
import Nav from './sections/Nav';
import Gallery from './shell/Gallery';
import Loader from './shell/Loader';
import MobileMenu from './shell/MobileMenu';
import Transition from './shell/Transition';
import {
    COL_2,
    COL_3,
    COUNTER,
    FADE_IN,
    HEADING_1,
    HEADING_2,
    LOGO_FRAME,
    LOGO_TRACKS,
    NAMES,
    PHONE_LOGO_FRAME,
    PHONE_LOGO_TRACKS,
    PHONE_LOGO_WRAP,
    RIGHT_FADE_IN,
    SLIDE_IMAGES,
    SLIDER,
    SLIDES,
} from './scenes';

if (typeof window !== 'undefined') {
    CustomEase.create('aimInOutCubic', EASE_PATH.inOutCubic);
    CustomEase.create('aimOutCubic', EASE_PATH.outCubic);
    CustomEase.create('aimInOutQuart', EASE_PATH.inOutQuart);
    CustomEase.create('aimInCubic', EASE_PATH.inCubic);
}

const LENIS = {};
const SMOOTHING = 70; // reference "smoothing" for both scroll scenes (phones: 60)
const PHONE = '(max-width: 479px)'; // the reference's "tiny" breakpoint: own layout, loader and logo scroll

function Page() {
    const root = useRef<HTMLDivElement>(null);
    const loadingEl = useRef<HTMLDivElement>(null);
    const scrollEl = useRef<HTMLDivElement>(null);
    const footerEl = useRef<HTMLDivElement>(null);
    const galleryEl = useRef<HTMLDivElement>(null);
    const transitionEl = useRef<HTMLDivElement>(null);
    const menuEl = useRef<HTMLDivElement>(null);
    const lenis = useSmoothScroll();

    const loading = useLottie(loadingEl, loadingData);
    const logo = useLottie(scrollEl, scrollData);
    const footer = useLottie(footerEl, footerData);

    const q = useCallback(<T extends HTMLElement = HTMLElement>(key: string) => root.current?.querySelector<T>(`[data-aim="${key}"]`) ?? null, []);
    const qa = useCallback(<T extends HTMLElement = HTMLElement>(key: string) => Array.from(root.current?.querySelectorAll<T>(`[data-aim="${key}"]`) ?? []), []);

    // ───────────── first load: loader → hero build (timings from the reference, ms → s) ─────────────
    useGSAP(
        () => {
            window.history.scrollRestoration = 'manual';
            window.scrollTo(0, 0);
            const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const phone = window.matchMedia(PHONE).matches;
            const heads = [1, 2, 3].map((i) => q(`hero-h-${i}`));
            gsap.set(heads, { yPercent: 110, y: 0 });
            // phones: the logo starts 3× larger and lower, and the hero text column fades in
            if (phone) {
                gsap.set(q('loading-lottie'), { scale: 3, y: '35vh' });
                gsap.set(q('hero-right'), { opacity: 0 });
            }

            const proxy = { p: 0 };
            const tl = gsap.timeline({ paused: true });
            tl.to(proxy, { p: 99.9, duration: 3.75, ease: 'none', onUpdate: () => setLottieProgress(loading.current, proxy.p) }, 0)
                .to(q('loader-bg'), { yPercent: -100, duration: 0.9, ease: 'aimInOutCubic' }, 1)
                .to(q('hero-bar'), { height: '3.19em', duration: 0.8, ease: 'aimInOutCubic' }, 3)
                .to(q('hero-logo'), { opacity: 1, duration: 0.5, ease: 'none' }, 3.2)
                .to(q('hero-line-1'), { width: '98%', duration: 1, ease: 'aimInOutCubic' }, 3.2)
                .to(heads[0], { yPercent: 0, duration: 1, ease: 'aimOutCubic' }, 3.6)
                .to(q('hero-nav'), { opacity: 1, duration: 0.4, ease: 'none' }, 3.6)
                .to(heads[1], { yPercent: 0, duration: 1, ease: 'aimOutCubic' }, 3.7)
                .to(q('hero-scroll'), { opacity: 1, duration: 0.4, ease: 'none' }, 3.7)
                .to(q('lottie-fixed'), { opacity: 1, duration: 0.1, ease: 'none' }, 3.7)
                .to(heads[2], { yPercent: 0, duration: 1, ease: 'aimOutCubic' }, 3.8)
                .to(q('hero-list'), { opacity: 1, duration: 0.4, ease: 'none' }, 3.8)
                .to(q('hero-line-3'), { height: '100%', duration: 1, ease: 'aimInOutCubic' }, 3.8)
                .to(q('loader'), { opacity: 0, duration: 0.5, ease: 'none' }, 4.4)
                .set(q('loader'), { display: 'none' }, 4.5);
            if (phone) {
                tl.to(q('loading-lottie'), { scale: 1, y: 0, duration: 1, ease: 'aimInOutCubic' }, 1)
                    .to(q('mnav-hero'), { opacity: 1, duration: 0.5, ease: 'none' }, 3.6)
                    .to(q('hero-right'), { opacity: 1, duration: 0.5, ease: 'none' }, 3.6);
            }
            tl.call(
                () => {
                    const content = q('content');
                    if (content) content.style.display = 'block';
                },
                [],
                phone ? 4.7 : 4.5,
            );

            // start once the fonts and the loading lottie are ready (the reference starts on window load)
            let started = false;
            const start = () => {
                if (started || !loading.current) return;
                started = true;
                // verification hook for the frame-by-frame comparison tooling
                if (window.location.search.includes('replay')) Object.assign(window, { __aimStart: performance.now() });
                if (reduce) tl.progress(1);
                else tl.play();
            };
            let fontsReady = false;
            document.fonts.ready.then(() => (fontsReady = true));
            const poll = () => {
                if (fontsReady && loading.current) start();
            };
            gsap.ticker.add(poll);
            return () => {
                gsap.ticker.remove(poll);
                tl.kill();
            };
        },
        { scope: root },
    );

    // ───────────── per-frame scroll scenes (smoothed like the reference) ─────────────
    useEffect(() => {
        const el = root.current;
        if (!el) return;
        const logoInner = q('lottie-scroll');
        const logoOuter = q('lottie-fixed');
        const phoneQuery = window.matchMedia(PHONE);
        const exp = q('exp');
        const content = q('content');
        const navFixed = q('nav-fixed');
        const footerSection = q('footer');

        const expTargets: [HTMLElement | null, ElementTracks][] = [
            [q('exp-slider'), SLIDER],
            [q('exp-col-2'), COL_2],
            [q('exp-col-3'), COL_3],
            [q('exp-h-1'), HEADING_1],
            [q('exp-h-2'), HEADING_2],
            [q('exp-btn'), FADE_IN],
            ...qa('exp-foot').map((n): [HTMLElement, ElementTracks] => [n, FADE_IN]),
            [q('exp-right'), RIGHT_FADE_IN],
            ...qa('exp-slide').map((n, i): [HTMLElement, ElementTracks] => [n, SLIDES[i]]),
            ...qa('exp-slide-img').map((n, i): [HTMLElement, ElementTracks] => [n, SLIDE_IMAGES[i]]),
            ...qa('exp-digit').map((n): [HTMLElement, ElementTracks] => [n, COUNTER]),
            ...qa('exp-name').map((n, i): [HTMLElement, ElementTracks] => [n, NAMES[i]]),
        ];

        let aimP = 0;
        let expP = 0;
        let lastFrame = -1;
        let lastAim = -1;
        let lastExp = -1;
        let navShown = false;
        let wasPhone: boolean | null = null;
        let footerIn = false;
        const footerProxy = { p: 0 };
        let footerTween: gsap.core.Tween | null = null;

        const tick = (_time: number, dt: number) => {
            const vh = window.innerHeight;
            const frames = Math.min(Math.max(dt / (1000 / 60), 0.25), 4); // the reference smooths once per 60 Hz frame
            const phone = phoneQuery.matches;
            const smoothed = (cur: number, target: number) => smooth(cur, target, phone ? 60 : SMOOTHING, frames);

            // crossing the phone breakpoint: drop the other layout's inline styles and redraw
            if (phone !== wasPhone) {
                wasPhone = phone;
                lastAim = lastExp = lastFrame = -1;
                if (logoOuter) logoOuter.style.transform = '';
                for (const [node] of expTargets) node?.style.removeProperty('transform');
                for (const [node, tracks] of expTargets) if (tracks.opacity) node?.style.removeProperty('opacity');
            }

            // logo: whole-page progress
            aimP = smoothed(aimP, elementProgress(el));
            if (aimP !== lastAim) {
                lastAim = aimP;
                const frame = sample(phone ? PHONE_LOGO_FRAME : LOGO_FRAME, aimP * 100);
                if (Math.abs(frame - lastFrame) > 0.001) {
                    lastFrame = frame;
                    setLottieProgress(logo.current, frame);
                }
                applyTracks(logoInner, phone ? PHONE_LOGO_TRACKS : LOGO_TRACKS, aimP * 100);
                if (phone) applyTracks(logoOuter, PHONE_LOGO_WRAP, aimP * 100);
            }

            // experiment section (desktop / tablet only — phones get a plain stacked layout)
            if (!phone && exp && content?.style.display !== 'none') {
                expP = smoothed(expP, elementProgress(exp));
                if (expP !== lastExp) {
                    lastExp = expP;
                    for (const [node, tracks] of expTargets) applyTracks(node, tracks, expP * 100);
                }
            }

            // pinned nav: in when the page body is 15 % into the viewport, out when it leaves it
            if (content && navFixed && content.style.display !== 'none') {
                const r = content.getBoundingClientRect();
                const inView = r.top < vh * 0.85 && r.bottom > vh * 0.15;
                const outOfView = r.top >= vh || r.bottom <= 0;
                if (!navShown && inView) {
                    navShown = true;
                    gsap.to(navFixed, { yPercent: 0, duration: 0.5, ease: 'aimOutCubic', overwrite: true });
                } else if (navShown && outOfView) {
                    navShown = false;
                    gsap.to(navFixed, { yPercent: -110, duration: 0.3, ease: 'none', overwrite: true });
                }
            }

            // footer logo: plays when the footer is in view (-10 %), rewinds fast when it leaves (-20 %)
            if (footerSection && content?.style.display !== 'none') {
                const r = footerSection.getBoundingClientRect();
                const enter = r.top < vh * 1.1 && r.bottom > -vh * 0.1;
                const leave = r.top > vh * 1.2 || r.bottom < -vh * 0.2;
                if (!footerIn && enter) {
                    footerIn = true;
                    footerTween?.kill();
                    footerTween = gsap.to(footerProxy, { p: 99, duration: 2.8, ease: 'none', onUpdate: () => setLottieProgress(footer.current, footerProxy.p) });
                } else if (footerIn && leave) {
                    footerIn = false;
                    footerTween?.kill();
                    footerTween = gsap.to(footerProxy, { p: 0, duration: 0.3, ease: 'none', onUpdate: () => setLottieProgress(footer.current, footerProxy.p) });
                }
            }
        };

        gsap.set(navFixed, { yPercent: -110, y: 0 });
        gsap.ticker.add(tick);
        return () => {
            gsap.ticker.remove(tick);
            footerTween?.kill();
        };
    }, [q, qa, logo, footer]);

    // ───────────── one-shot line reveals (about paragraph) ─────────────
    useEffect(() => {
        const lines = qa('about-line');
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (!e.isIntersecting) continue;
                    io.unobserve(e.target);
                    gsap.fromTo(e.target.firstElementChild, { yPercent: 100, y: 0 }, { yPercent: 0, duration: 0.9, ease: 'aimInOutCubic' });
                }
            },
            { rootMargin: '-15% 0px -15% 0px' },
        );
        lines.forEach((l) => io.observe(l));
        return () => io.disconnect();
    }, [qa]);

    // ───────────── phones: "Explore / Experiment" rise when they come into view (desktop scrubs them instead) ─────────────
    useEffect(() => {
        const phoneQuery = window.matchMedia(PHONE);
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (!e.isIntersecting || !phoneQuery.matches) continue;
                    io.unobserve(e.target);
                    gsap.fromTo(e.target.firstElementChild, { yPercent: 110, y: 0 }, { yPercent: 0, duration: 0.9, ease: 'aimInOutCubic' });
                }
            },
            { rootMargin: '10% 0px 10% 0px' },
        );
        root.current?.querySelectorAll('.aim-exp__hmask').forEach((m) => io.observe(m));
        return () => io.disconnect();
    }, []);

    // ───────────── navigation ─────────────
    const scrollToTarget = useCallback(
        (target: string | number) => (e: MouseEvent) => {
            e.preventDefault();
            if (lenis) lenis.scrollTo(target);
            else if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'smooth' });
            else document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
        },
        [lenis],
    );

    const busy = useRef(false);
    const onPage = useCallback(
        (e: MouseEvent<HTMLAnchorElement>) => {
            // The reference routes to /experiment and /about behind this wipe; this clone has only the index,
            // so the wipe covers, the page resets to the top, and the sheet lifts off again.
            e.preventDefault();
            const wrap = transitionEl.current;
            const shape = q('transition-shape');
            if (!wrap || !shape || busy.current) return;
            busy.current = true;
            gsap.set(wrap, { display: 'block' });
            gsap.timeline({ onComplete: () => void (busy.current = false) })
                .fromTo(shape, { yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: 'aimInOutQuart' })
                .call(() => {
                    lenis?.scrollTo(0, { immediate: true, force: true });
                    window.scrollTo(0, 0);
                })
                .to(shape, { yPercent: -100, duration: 0.9, ease: 'aimInOutCubic' }, '+=0.15')
                .set(wrap, { display: 'none' });
        },
        [lenis, q],
    );

    const galleryTl = useRef<gsap.core.Timeline | null>(null);
    const lastFocus = useRef<HTMLElement | null>(null);
    const openGallery = useCallback(
        (e: MouseEvent) => {
            e.preventDefault();
            const g = galleryEl.current;
            if (!g) return;
            lastFocus.current = document.activeElement as HTMLElement | null;
            lenis?.stop();
            galleryTl.current?.kill();
            gsap.set(g, { display: 'flex' });
            galleryTl.current = gsap
                .timeline()
                .fromTo(q('gallery-blur'), { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'aimInOutQuart' }, 0)
                .fromTo(q('gallery-cut'), { yPercent: 10, y: 0 }, { yPercent: 0, duration: 1, ease: 'aimInOutCubic' }, 0.3)
                .fromTo(q('gallery-popup'), { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power1.out' }, 0.4);
            q('gallery-close')?.focus({ preventScroll: true });
        },
        [lenis, q],
    );
    const closeGallery = useCallback(() => {
        const g = galleryEl.current;
        if (!g || g.style.display !== 'flex') return;
        galleryTl.current?.kill();
        galleryTl.current = gsap
            .timeline()
            .to(q('gallery-blur'), { opacity: 0, duration: 1.2, ease: 'aimInOutQuart' }, 0)
            .to(q('gallery-popup'), { opacity: 0, duration: 0.4, ease: 'power1.out' }, 0)
            .to(q('gallery-cut'), { yPercent: 10, duration: 1, ease: 'aimInOutCubic' }, 0.7)
            .set(g, { display: 'none' }, 1)
            .call(() => lenis?.start(), [], 1);
        lastFocus.current?.focus({ preventScroll: true });
    }, [lenis, q]);

    const menuTl = useRef<gsap.core.Timeline | null>(null);
    const openMenu = useCallback(
        (e: MouseEvent) => {
            e.preventDefault();
            const m = menuEl.current;
            if (!m) return;
            lastFocus.current = document.activeElement as HTMLElement | null;
            menuTl.current?.kill();
            const words = qa('mmenu-word');
            gsap.set(m, { display: 'flex' });
            menuTl.current = gsap
                .timeline()
                .fromTo(q('mmenu-bg'), { yPercent: -100, y: 0 }, { yPercent: 0, duration: 0.5, ease: 'aimInOutCubic' }, 0)
                .fromTo(words, { yPercent: 120, y: 0 }, { yPercent: 0, duration: 1, ease: 'aimInOutCubic', stagger: 0.1 }, 0)
                .fromTo(q('mmenu-close'), { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'none' }, 0.3)
                .fromTo(q('mmenu-desc'), { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'none' }, 0.5)
                .fromTo(q('mmenu-credit'), { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'none' }, 0.7);
            q('mmenu-close')?.focus({ preventScroll: true });
        },
        [q, qa],
    );
    const closeMenu = useCallback(() => {
        const m = menuEl.current;
        if (!m || m.style.display !== 'flex') return;
        menuTl.current?.kill();
        const words = qa('mmenu-word').reverse();
        menuTl.current = gsap
            .timeline()
            .to(words, { yPercent: 120, duration: 1, ease: 'aimInOutCubic', stagger: 0.1 }, 0)
            .to([q('mmenu-desc'), q('mmenu-credit')], { opacity: 0, duration: 0.3, ease: 'none' }, 0)
            .to(q('mmenu-close'), { opacity: 0, duration: 0.3, ease: 'none' }, 0.3)
            .to(q('mmenu-bg'), { yPercent: -100, duration: 0.5, ease: 'aimInCubic' }, 0.4)
            .set(m, { display: 'none' }, 1);
        lastFocus.current?.focus({ preventScroll: true });
    }, [q, qa]);
    // menu links: close the sheet, then do what the link does
    const onMenuIndex = useCallback(
        (e: MouseEvent) => {
            closeMenu();
            scrollToTarget(0)(e);
        },
        [closeMenu, scrollToTarget],
    );
    const onMenuPage = useCallback(
        (e: MouseEvent<HTMLAnchorElement>) => {
            closeMenu();
            onPage(e);
        },
        [closeMenu, onPage],
    );

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            closeGallery();
            closeMenu();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [closeGallery, closeMenu]);

    const nav = { onIndex: scrollToTarget(0), onPage, onGallery: openGallery, onMenu: openMenu };

    return (
        <div ref={root} className="aim">
            <div className="aim-wrap">
                <Nav variant="fixed" {...nav} />
                <Hero scrollLottieRef={scrollEl} onExplore={scrollToTarget('#Home-about')} {...nav} />
                <div className="aim-content" data-aim="content" style={{ display: 'none' }}>
                    <About />
                    <div className="aim-spacer" />
                    <Experiment onLearnMore={onPage} />
                    <Footer lottieRef={footerEl} />
                </div>
            </div>
            <Gallery ref={galleryEl} onClose={closeGallery} />
            <MobileMenu ref={menuEl} onClose={closeMenu} onIndex={onMenuIndex} onPage={onMenuPage} />
            <Loader lottieRef={loadingEl} />
            <Transition ref={transitionEl} />
        </div>
    );
}

export default function AimObysPage() {
    return (
        <SmoothScroll options={LENIS}>
            <Page />
        </SmoothScroll>
    );
}

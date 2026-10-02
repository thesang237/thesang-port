'use client';

import './kpr.scss';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { advance } from '@react-three/fiber';

import { CustomEase, gsap } from '@/components/motion-kit/gsap';
import SmoothScroll, { useSmoothScroll } from '@/components/motion-kit/SmoothScroll';

import { disposeAudio } from './dom/hud/audio';
import Cursor from './dom/hud/Cursor';
import Hud from './dom/hud/Hud';
import Intro from './dom/hud/Intro';
import Loader from './dom/hud/Loader';
import Menu from './dom/hud/Menu';
import TrailerPanel from './dom/hud/TrailerPanel';
import { CollectionIntro, Gallery } from './dom/sections/Collection';
import Footer from './dom/sections/Footer';
import Landing from './dom/sections/Landing';
import ProjectIntro from './dom/sections/ProjectIntro';
import Story from './dom/sections/Story';
import { Launch, Tableaux } from './dom/sections/Tableaux';
import { registerEases } from './dom/ui/reveal';
import { clearAnchors, measureAnchors } from './gl/layout';
import { clearFrame, runFrame } from './scroll/frame';
import { damp, navAt, RESTS, themeAt, TOTAL } from './scroll/timeline';
import { film, resetFilm, resetUi, useUi } from './scroll/useScrollStore';

const Stage = dynamic(() => import('./gl/Stage'), { ssr: false });
const TextureDebug = dynamic(() => import('./debug/TextureDebug'), { ssr: false });
const GlbDebug = dynamic(() => import('./debug/GlbDebug'), { ssr: false });
const FlipDebug = dynamic(() => import('./debug/FlipDebug'), { ssr: false });

const LENIS = { lerp: 0.09, wheelMultiplier: 0.9 };

const nearestRest = (t: number) => RESTS.reduce((a, b) => (Math.abs(b - t) < Math.abs(a - t) ? b : a), RESTS[0]);

/** The one clock: Lenis scroll → film.t (screens) → DOM updaters → R3F render. One RAF (gsap.ticker). */
function Clock({ cut }: { cut: React.RefObject<HTMLDivElement | null> }) {
    const lenis = useSmoothScroll();
    const track = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!lenis) return;
        registerEases(CustomEase);
        window.history.scrollRestoration = 'manual';
        lenis.scrollTo(0, { immediate: true });

        const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
        const setReduced = () => (film.reduced = mqReduce.matches);
        setReduced();
        mqReduce.addEventListener('change', setReduced);

        let lastW = 0;
        let lastH = 0;
        const measure = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            // ignore small height changes (mobile URL bar) so the film doesn't jump
            if (w !== lastW || Math.abs(h - lastH) > 140) {
                lastW = w;
                lastH = h;
                film.vw = w;
                film.vh = h;
                film.phone = w < 768;
                if (track.current) track.current.style.height = `${Math.round((TOTAL + 1) * h)}px`;
            }
            measureAnchors(document.querySelector('.kpr') ?? document, film.vw, film.vh);
            lenis.resize();
        };
        measure();
        void document.fonts.ready.then(measure);
        let raf = 0;
        const onResize = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(measure);
        };
        window.addEventListener('resize', onResize);

        const onPointer = (e: PointerEvent) => {
            film.px = (e.clientX / film.vw) * 2 - 1;
            film.py = -((e.clientY / film.vh) * 2 - 1);
        };
        window.addEventListener('pointermove', onPointer, { passive: true });

        // dev/testing conveniences: ?skip (auto-enter once loaded), ?at=12.5 (jump to a screen)
        const params = new URLSearchParams(window.location.search);
        const at = params.get('at');
        let pendingJump = at !== null ? Number(at) : null;

        let lastT = 0;
        let lastNav = useUi.getState().nav;
        let lastTheme = useUi.getState().theme;
        const tick = (time: number, deltaMs: number) => {
            const dt = Math.min(Math.max(deltaMs, 1) / 1000, 1 / 20);
            film.dt = dt;
            film.time += dt;
            if (pendingJump !== null && film.started) {
                lenis.scrollTo(pendingJump * film.vh, { immediate: true, force: true });
                pendingJump = null;
            }
            const t = Math.max(0, lenis.scroll / film.vh);
            film.t = t;
            const v = (t - lastT) / dt;
            lastT = t;
            film.vel = damp(film.vel, film.reduced ? 0 : v, 10, dt);
            const pointerK = film.reduced ? 0 : 1;
            film.spx = damp(film.spx, film.px * pointerK, 3.5, dt);
            film.spy = damp(film.spy, film.py * pointerK, 3.5, dt);

            if (film.reduced) {
                const r = nearestRest(Math.min(t, TOTAL));
                if (r !== film.view) {
                    film.view = r;
                    if (cut.current) gsap.fromTo(cut.current, { opacity: 1 }, { opacity: 0, duration: 0.16, ease: 'none' });
                }
            } else film.view = Math.min(t, TOTAL);

            const nav = navAt(film.view);
            const theme = film.covered ? 'light' : themeAt(film.view);
            if (nav !== lastNav || theme !== lastTheme) {
                lastNav = nav;
                lastTheme = theme;
                useUi.getState().set({ nav, theme });
            }
            runFrame();
            advance(time * 1000);
        };
        gsap.ticker.add(tick);

        return () => {
            gsap.ticker.remove(tick);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('pointermove', onPointer);
            mqReduce.removeEventListener('change', setReduced);
            cancelAnimationFrame(raf);
            window.history.scrollRestoration = 'auto';
        };
    }, [lenis, cut]);

    // ?skip: enter as soon as assets are ready (no sound) — used for screenshots and testing
    useEffect(() => {
        if (!new URLSearchParams(window.location.search).has('skip')) return;
        return useUi.subscribe((s) => {
            if (s.loaded && !s.entered) {
                film.intro = 1;
                film.started = true;
                s.set({ entered: true });
                lenis?.start();
            }
        });
    }, [lenis]);

    // the invisible track only gives the browser a scrollbar: (TOTAL + 1) screens
    return <div ref={track} className="kpr-track" aria-hidden="true" />;
}

function Film() {
    const cut = useRef<HTMLDivElement>(null);
    const entered = useUi((s) => s.entered);
    const skip = useSyncExternalStore(
        () => () => {},
        () => new URLSearchParams(window.location.search).has('skip'),
        () => false,
    );

    useEffect(() => {
        resetFilm();
        resetUi();
        return () => {
            clearFrame();
            clearAnchors();
            disposeAudio();
            resetFilm();
            resetUi();
        };
    }, []);

    return (
        <>
            <Clock cut={cut} />
            <div className="kpr-stage">
                <Stage />
            </div>
            <main className="kpr-ui">
                <Landing />
                <ProjectIntro />
                <Story />
                <CollectionIntro />
                <Gallery />
                <Tableaux />
                <Launch />
            </main>
            <div ref={cut} className="kpr-cut" aria-hidden="true" />
            <Hud />
            <Footer />
            <Menu />
            <TrailerPanel />
            <Cursor />
            {!skip && !entered && <Loader />}
            {!skip && <Intro />}
        </>
    );
}

const subscribe = () => () => {};
const getDebug = () => new URLSearchParams(window.location.search).get('debug');

export default function KprPage() {
    const debug = useSyncExternalStore(subscribe, getDebug, () => null);
    if (debug === 'textures') return <TextureDebug />;
    if (debug === 'glb') return <GlbDebug />;
    if (debug === 'flip') return <FlipDebug />;
    return (
        <div className="kpr" id="top">
            <SmoothScroll options={LENIS}>
                <Film />
            </SmoothScroll>
        </div>
    );
}

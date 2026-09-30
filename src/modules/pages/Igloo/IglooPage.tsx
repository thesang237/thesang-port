'use client';

import './igloo.scss';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { type LenisRef, ReactLenis, useLenis } from 'lenis/react';

import Experience from './canvas/Experience';
import Chrome from './ui/Chrome';
import CrystalHud from './ui/CrystalHud';
import DetailOverlay from './ui/DetailOverlay';
import Hero from './ui/Hero';
import Loader from './ui/Loader';
import SocialCarousel from './ui/SocialCarousel';
import TweakPanel from './ui/TweakPanel';
import { damp } from './utils/math';
import { ambience } from './utils/sound';
import { TIMELINE } from './data';
import { motion, resetMotion, useIglooUI } from './store';

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrambleTextPlugin, SplitText);

const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700', '800'], variable: '--font-ig-mono', display: 'swap' });

const sectionAt = (t: number) => (t < 1.8 ? 0 : t < 7.5 ? 1 : t < 11.2 ? 2 : t < 14.6 ? 3 : 0);

function Scroller() {
    const track = useRef<HTMLDivElement>(null);
    const lenis = useLenis();

    // lock scroll until the intro has played
    useEffect(() => {
        if (!lenis) return;
        window.history.scrollRestoration = 'manual';
        lenis.scrollTo(0, { immediate: true, force: true });
        if (!useIglooUI.getState().introDone) lenis.stop();
        const onScroll = () => {
            ScrollTrigger.update();
            motion.velocity = lenis.velocity;
            ambience.setIntensity(Math.abs(lenis.velocity) / 40);
        };
        lenis.on('scroll', onScroll);
        return () => lenis.off('scroll', onScroll);
    }, [lenis]);

    // ── master scroll timeline: every world + DOM layer on one clock ────────
    useGSAP(
        () => {
            const tl = gsap.timeline({ defaults: { ease: 'none' } });
            const io = 'power1.inOut';

            // 0 · igloo → shell cracks open, camera rises into the glow
            tl.to('.ig-hero', { autoAlpha: 0, y: -30, filter: 'blur(10px)', duration: 0.7, ease: 'power1.in' }, 0.15)
                .to(motion, { heroCam: 1, duration: 1.7, ease: io }, 0.2)
                .to(motion, { explode: 1, duration: 1.5 }, 0.3)
                .to(motion, { scene: 1, duration: 1.0, ease: io }, 1.3)

                // 1 · crystals drift up through the fog
                .fromTo(motion, { crystals: -0.8 }, { crystals: 0, duration: 0.7, ease: 'power2.out' }, 1.6)
                .to(motion, { crystals: 1, duration: 1.45, ease: 'power3.inOut' }, 2.4)
                .to(motion, { crystals: 2, duration: 1.45, ease: 'power3.inOut' }, 3.95)
                .to(motion, { crystals: 3, duration: 1.45, ease: 'power3.inOut' }, 5.5)
                .to(motion, { crystals: 3.8, duration: 0.6, ease: 'power2.in' }, 7.0)
                .fromTo('.ig-ghosts', { autoAlpha: 0, y: 80 }, { autoAlpha: 0.5, y: 0, duration: 0.8 }, 1.8)
                .to('.ig-ghosts', { y: -260, duration: 5.2 }, 2.6)
                .to('.ig-ghosts', { autoAlpha: 0, duration: 0.5 }, 7.2)
                .to(motion, { scene: 2, duration: 1.0, ease: io }, 7.2)

                // 2 · ring portal assembles, camera dives through
                .fromTo(motion, { rings: 0 }, { rings: 1, duration: 2.6 }, 7.4)
                .fromTo(motion, { dive: 0 }, { dive: 1, duration: 1.6 }, 9.8)
                .to(motion, { scene: 3, duration: 1.0, ease: io }, 10.8)

                // 3 · particle colony forms on the pedestal
                .fromTo(motion, { colonyCam: 0 }, { colonyCam: 1, duration: 1.8 }, 10.9)
                .fromTo(motion, { form: 0 }, { form: 1, duration: 1.6 }, 11.0)
                .fromTo('.ig-colony', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 12.3)
                .to('.ig-colony', { autoAlpha: 0, duration: 0.4 }, 13.9)

                // 4 · loop: debris flies back together into the igloo
                .to(motion, { scene: 4, duration: 1.0, ease: io }, 14.0)
                .to(motion, { explode: 0, duration: 1.4 }, 14.2)
                .to(motion, { heroCam: 0, duration: 1.5, ease: io }, 14.2)
                .to('.ig-hero', { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.6, ease: 'power1.out' }, 15.2)
                .set({}, {}, TIMELINE.total);

            const fill = document.querySelector('.ig-rail-fill');
            ScrollTrigger.create({
                trigger: track.current,
                start: 'top top',
                end: 'bottom bottom',
                animation: tl,
                scrub: true,
                onUpdate: (self) => {
                    motion.progress = self.progress;
                    const section = sectionAt(self.progress * TIMELINE.total);
                    if (useIglooUI.getState().section !== section) useIglooUI.getState().set({ section });
                    if (fill) gsap.set(fill, { scaleY: self.progress });
                },
            });
        },
        { dependencies: [] },
    );

    return <div ref={track} aria-hidden style={{ height: `${(TIMELINE.total + 1) * 100}vh` }} />;
}

function Inputs() {
    useEffect(() => {
        const onMove = (e: PointerEvent) => {
            motion.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
            motion.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
            motion.hasPointer = true;
        };
        const onClick = (e: MouseEvent) => {
            const ui = useIglooUI.getState();
            if ((e.target as HTMLElement).closest('button, a, [data-ig-ui]')) return;
            if (motion.hoverCrystal >= 0 && ui.detail < 0) {
                ambience.tick(1100);
                ui.set({ detail: motion.hoverCrystal });
            }
        };
        const tick = (_: number, dt: number) => {
            const d = dt / 1000;
            motion.pointerSmooth.x = damp(motion.pointerSmooth.x, motion.pointer.x, 3.5, d);
            motion.pointerSmooth.y = damp(motion.pointerSmooth.y, motion.pointer.y, 3.5, d);
            motion.velocity = damp(motion.velocity, 0, 2, d);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('click', onClick);
        gsap.ticker.add(tick);
        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('click', onClick);
            gsap.ticker.remove(tick);
            document.body.style.cursor = '';
        };
    }, []);
    return null;
}

export default function IglooPage() {
    const lenisRef = useRef<LenisRef | null>(null);
    const detailOpen = useIglooUI((s) => s.detail >= 0);

    useLayoutEffect(() => {
        resetMotion();
        if (process.env.NODE_ENV !== 'production') Object.assign(window, { __igloo: { motion, ui: useIglooUI } });
        useIglooUI.getState().set({ ready: false, introDone: false, section: 0, activeCrystal: -1, detail: -1, social: 0 });
        const update = (time: number) => lenisRef.current?.lenis?.raf(time * 1000);
        gsap.ticker.add(update);
        gsap.ticker.lagSmoothing(0);
        return () => {
            gsap.ticker.remove(update);
            gsap.ticker.lagSmoothing(500, 33);
            ambience.toggle(false);
        };
    }, []);

    return (
        <ReactLenis root ref={lenisRef} options={{ autoRaf: false, infinite: true, syncTouch: true, lerp: 0.085, wheelMultiplier: 0.85, touchMultiplier: 1.4 }}>
            <main className={`ig-root ${mono.variable} ${detailOpen ? 'is-detail' : ''}`}>
                <Experience />
                <Scroller />
                <Inputs />

                <Hero />
                <CrystalHud onOpen={(i) => useIglooUI.getState().set({ detail: i })} />
                <SocialCarousel />
                <Chrome />
                <TweakPanel />
                <DetailOverlay />
                <Loader onIntroEnd={() => lenisRef.current?.lenis?.start()} />
            </main>
        </ReactLenis>
    );
}

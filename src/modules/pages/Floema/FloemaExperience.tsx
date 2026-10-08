/* eslint-disable react-hooks/immutability -- SceneState is an imperative GSAP/Three runtime, mutated only outside React rendering. */
'use client';

import { useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';

import { AnimatedLink } from './components/AnimatedControl';
import { Intro } from './components/Intro';
import About from './pages/About';
import Collections from './pages/Collections';
import Home from './pages/Home';
import { ExperienceContext } from './context';
import { content, palette, type View, viewFromPath } from './data';
import { clamp, damp, gsap, motion, useGSAP } from './motion';
import { collectionIndex, collectionLimit, createScene } from './scene';

const Scene = dynamic(() => import('./canvas/Scene'), { ssr: false });

export default function FloemaExperience() {
    const pathname = usePathname();
    const router = useRouter();
    const [view, setView] = useState(() => viewFromPath(pathname));
    const [scene] = useState(createScene);
    const [ready, setReady] = useState(false);
    const [reduced, setReduced] = useState(false);
    const [canvasReady, setCanvasReady] = useState(false);
    const reportReady = useCallback(() => setCanvasReady(true), []);
    const reportFailure = useCallback(() => setCanvasReady(false), []);
    const root = useRef<HTMLDivElement>(null);
    const curtain = useRef<SVGSVGElement>(null);
    const path = useRef<SVGPathElement>(null);
    const pending = useRef<string | null>(null);
    const transition = useRef<gsap.core.Tween | null>(null);
    const dial = useRef({ progress: 0 });
    const base = pathname.slice(0, pathname.indexOf('/floema') + 7);
    const href = (destination: View) => base + (destination === 'home' ? '' : '/' + destination);

    const { contextSafe } = useGSAP(
        () => {
            const previous = { overflow: document.body.style.overflow, overscrollBehavior: document.body.style.overscrollBehavior };
            document.body.style.overflow = 'hidden';
            document.body.style.overscrollBehavior = 'none';
            const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
            const preference = () => {
                scene.reduced = mq.matches;
                setReduced(mq.matches);
            };
            preference();
            mq.addEventListener('change', preference);
            const resize = () => {
                scene.width = window.innerWidth;
                scene.height = window.innerHeight;
                scene.unit = scene.width / (scene.width < 768 ? 75 : 192);
            };
            resize();
            window.addEventListener('resize', resize);
            const tick = (_time: number, delta: number) => {
                if (!scene.ready || document.hidden) return;
                const dt = Math.min(delta / 1000, 0.05);
                if (!scene.reduced) scene.time += dt;
                if (scene.view === 'home') {
                    const home = scene.home;
                    if (!scene.reduced) {
                        home.target += home.direction * 120 * dt;
                        home.titleTarget += home.direction * 120 * dt;
                    }
                    home.speed = damp(home.speed, (home.target - home.current) * 0.001, 0.1, dt);
                    home.current = scene.reduced ? home.target : damp(home.current, home.target, 0.1, dt);
                    home.title = scene.reduced ? home.titleTarget : damp(home.title, home.titleTarget, 0.1, dt);
                } else if (scene.view === 'collections') {
                    const c = scene.collection;
                    c.target = clamp(c.target, -collectionLimit(scene), 0);
                    c.current = scene.reduced ? c.target : damp(c.current, c.target, 0.1, dt);
                    c.active = collectionIndex(scene);
                } else {
                    const a = scene.about;
                    a.target = clamp(a.target, 0, a.limit);
                    a.current = scene.reduced ? a.target : damp(a.current, a.target, 0.07, dt);
                    for (const gallery of a.galleries) {
                        if (scene.reduced) continue;
                        gallery.target -= gallery.direction * 60 * dt;
                        gallery.target += (a.current - a.target) * 0.1 * dt * 60;
                        gallery.offset = damp(gallery.offset, gallery.target, 0.1, dt);
                    }
                }
            };
            gsap.ticker.add(tick);
            return () => {
                Object.assign(document.body.style, previous);
                mq.removeEventListener('change', preference);
                window.removeEventListener('resize', resize);
                gsap.ticker.remove(tick);
            };
        },
        { scope: root },
    );

    const draw = (progress: number) => {
        const y = (1 - progress) * scene.height;
        const amplitude = (250 / Math.min(window.devicePixelRatio || 1, 2)) * Math.sin(progress * Math.PI);
        const points = Array.from({ length: 41 }, (_, i) => `${(i * scene.width) / 40},${y - Math.sin((i / 40) * Math.PI) * amplitude}`);
        path.current?.setAttribute('d', `M${scene.width},${scene.height} L0,${scene.height} L${points.join(' L')} Z`);
    };
    const cover = contextSafe((destination: View, onCovered: () => void) => {
        const svg = curtain.current;
        if (!svg) return onCovered();
        transition.current?.kill();
        svg.style.color = destination === 'about' ? palette.ink : palette.paper;
        gsap.set(svg, { autoAlpha: 1, rotation: 0 });
        dial.current.progress = 0;
        draw(0);
        transition.current = gsap.to(dial.current, {
            progress: 1,
            duration: reduced ? 0.12 : motion.wipe,
            ease: 'expo.inOut',
            onUpdate: () => draw(dial.current.progress),
            onComplete: onCovered,
        });
    });
    const navigate = contextSafe((destination: View) => {
        if (destination === view || pending.current) return;
        const url = href(destination);
        pending.current = url;
        router.prefetch(url);
        cover(destination, () => router.push(url, { scroll: false }));
    });

    // Keep the outgoing view mounted until covered, including browser history changes.
    useGSAP(
        () => {
            const destination = viewFromPath(pathname);
            if (destination === view) {
                // A rapid history reversal can return to the still-mounted outgoing view.
                if (pending.current && pending.current !== pathname) {
                    transition.current?.kill();
                    pending.current = pathname;
                    transition.current = gsap.to(dial.current, {
                        progress: 0,
                        duration: reduced ? 0.12 : 0.4,
                        ease: 'power2.out',
                        onUpdate: () => draw(dial.current.progress),
                        onComplete: () => {
                            pending.current = null;
                            gsap.set(curtain.current, { autoAlpha: 0 });
                        },
                    });
                }
                return;
            }
            if (pending.current === pathname) setView(destination);
            else {
                pending.current = pathname;
                cover(destination, () => setView(destination));
            }
        },
        { dependencies: [pathname], scope: root },
    );
    useGSAP(
        () => {
            scene.view = view;
            scene.collection.selected = -1;
            scene.collection.expansion = 0;
            scene.collection.visibility = 1;
            scene.collection.detailScroll = 0;
            if (view === 'about') {
                scene.about.current = 0;
                scene.about.target = 0;
            }
            if (!pending.current) return;
            transition.current?.kill();
            dial.current.progress = 1;
            gsap.set(curtain.current, { rotation: 180 });
            transition.current = gsap.to(dial.current, {
                progress: 0,
                duration: reduced ? 0.12 : motion.wipe,
                ease: 'expo.inOut',
                onUpdate: () => draw(dial.current.progress),
                onComplete: () => {
                    pending.current = null;
                    gsap.set(curtain.current, { autoAlpha: 0 });
                    root.current?.querySelector<HTMLElement>('[data-page-heading]')?.focus({ preventScroll: true });
                },
            });
        },
        { dependencies: [view], scope: root },
    );

    return (
        <ExperienceContext.Provider value={{ scene, ready, reduced, href, navigate }}>
            <div
                ref={root}
                className={`floema ${canvasReady && !reduced ? 'floema--webgl' : ''}`}
                data-view={view}
                style={{ background: palette[view], color: view === 'about' ? palette.ink : palette.paper }}
            >
                <a className="floema-skip" href="#floema-main">
                    Skip to content
                </a>
                <div className="floema-canvas" aria-hidden="true">
                    <Scene scene={scene} reduced={reduced} onReady={reportReady} onFailure={reportFailure} />
                </div>
                <nav className="floema-nav" aria-label="Floema navigation">
                    <a
                        className="floema-logo"
                        href={href('home')}
                        aria-label="Floema home"
                        onClick={(event) => {
                            if (!event.metaKey && !event.ctrlKey) {
                                event.preventDefault();
                                navigate('home');
                            }
                        }}
                    >
                        <span />
                    </a>
                    <AnimatedLink
                        className="floema-nav-link"
                        href={href(view === 'about' ? 'collections' : 'about')}
                        onClick={(event) => {
                            if (!event.metaKey && !event.ctrlKey) {
                                event.preventDefault();
                                navigate(view === 'about' ? 'collections' : 'about');
                            }
                        }}
                    >
                        {view === 'about' ? 'Collections' : 'About'}
                    </AnimatedLink>
                </nav>
                <main id="floema-main" className="floema-main">
                    {view === 'home' ? <Home /> : view === 'collections' ? <Collections /> : <About />}
                </main>
                <svg ref={curtain} className="floema-curtain" aria-hidden="true" width="100%" height="100%" preserveAspectRatio="none">
                    <path ref={path} fill="currentColor" />
                </svg>
                {!ready && (
                    <Intro
                        onComplete={() => {
                            scene.ready = true;
                            setReady(true);
                        }}
                        images={content.home.map((image) => image.src)}
                        reduced={reduced}
                    />
                )}
            </div>
        </ExperienceContext.Provider>
    );
}

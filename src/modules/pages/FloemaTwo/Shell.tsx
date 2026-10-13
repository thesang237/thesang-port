'use client';

import type { MouseEvent, ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Lenis from 'lenis';

import ConnectedPills from './ConnectedPills';
import { asset, collections, materials, products } from './data';
import { gsap, motion, ScrollTrigger } from './motion';

type Panel = { type: 'search' | 'products' | 'journal' | 'material' | 'product' | 'privacy'; index?: number; query?: string } | null;
type ExperienceContext = { reduced: boolean; navigate: (href: string) => void; scrollTo: (target: string | number) => void; openPanel: (panel: Panel) => void };
const Context = createContext<ExperienceContext | null>(null);
export const useFloema = () => useContext(Context)!;

export function Arrow({ direction = 'right' }: { direction?: 'right' | 'down' }) {
    return (
        <svg className="f2-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={direction === 'down' ? { transform: 'rotate(90deg)' } : undefined}>
            <path d="M3 12h17M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.65" />
        </svg>
    );
}
export function RouteLink({ href, children, className, ...props }: { href: string; children: ReactNode; className?: string; 'aria-label'?: string }) {
    const { navigate } = useFloema();
    return (
        <Link
            href={href}
            className={className}
            {...props}
            onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    navigate(href);
                }
            }}
        >
            {children}
        </Link>
    );
}

export default function FloemaShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const root = useRef<HTMLDivElement>(null);
    const content = useRef<HTMLDivElement>(null);
    const header = useRef<HTMLElement>(null);
    const nav = useRef<HTMLElement>(null);
    const intro = useRef<HTMLDivElement>(null);
    const progress = useRef<HTMLDivElement>(null);
    const scroller = useRef<Lenis | null>(null);
    const transition = useRef<gsap.core.Timeline | null>(null);
    const pending = useRef<string | null>(null);
    const [reduced, setReduced] = useState(false);
    const [panel, setPanel] = useState<Panel>(null);
    const sustainability = pathname.includes('sustainability');

    useEffect(() => {
        const media = matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReduced(media.matches);
        update();
        media.addEventListener('change', update);
        router.prefetch('/floema-2/home');
        router.prefetch('/floema-2/sustainability');
        return () => media.removeEventListener('change', update);
    }, [router]);

    useEffect(() => {
        if (reduced) return;
        const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, syncTouch: false, autoRaf: false, anchors: false });
        scroller.current = lenis;
        lenis.on('scroll', ScrollTrigger.update);
        const tick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        if (new URLSearchParams(location.search).has('debug')) Object.assign(window, { __floemaLenis: lenis });
        return () => {
            gsap.ticker.remove(tick);
            lenis.destroy();
            scroller.current = null;
            delete (window as Window & { __floemaLenis?: Lenis }).__floemaLenis;
        };
    }, [reduced]);

    const scrollTo = useCallback(
        (target: string | number) => {
            const element = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
            if (element === null) return;
            if (scroller.current) scroller.current.scrollTo(element, { duration: 1.25, offset: typeof target === 'string' ? -100 : 0 });
            else if (typeof element === 'number') window.scrollTo({ top: element, behavior: 'instant' });
            else element.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' });
        },
        [reduced],
    );

    const navigate = useCallback(
        (href: string) => {
            const [path, hash] = href.split('#');
            if (path === pathname) {
                if (hash) scrollTo(`#${hash}`);
                else scrollTo(0);
                return;
            }
            pending.current = href;
            setPanel(null);
            if (transition.current?.isActive()) return;
            scroller.current?.stop();
            transition.current = gsap.timeline().to(content.current, {
                opacity: 0,
                duration: reduced ? 0.1 : motion.exit,
                ease: 'power1.in',
                onComplete: () => {
                    router.push(pending.current!, { scroll: false });
                },
            });
        },
        [pathname, reduced, router, scrollTo],
    );

    useLayoutEffect(() => {
        const el = content.current;
        const head = header.current;
        if (!el || !head) return;
        head.dataset.tone = sustainability ? 'green' : 'paper';
        const isRouteChange = pending.current !== null;
        let timer: ReturnType<typeof setTimeout>;
        if (isRouteChange) {
            const target = pending.current!;
            pending.current = null;
            scroller.current?.scrollTo(0, { immediate: true, force: true });
            window.scrollTo(0, 0);
            gsap.set(el, { clearProps: 'transform' });
            transition.current = gsap.timeline().to(el, {
                opacity: 1,
                duration: reduced ? 0.15 : motion.enter,
                ease: motion.ease,
                onComplete: () => {
                    scroller.current?.start();
                    el.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
                    if (target.includes('#')) scrollTo(`#${target.split('#')[1]}`);
                },
            });
        }
        const ctx = gsap.context(() => {
            const sections = Array.from(el.querySelectorAll<HTMLElement>('[data-tone]'));
            sections.forEach((section) => {
                ScrollTrigger.create({
                    trigger: section,
                    start: 'top 85px',
                    end: 'bottom 85px',
                    onToggle: (self) => {
                        if (self.isActive) head.dataset.tone = section.dataset.tone;
                    },
                });
            });
            ScrollTrigger.create({
                start: 0,
                end: 'max',
                onUpdate: (self) => {
                    if (progress.current) progress.current.style.transform = `scaleY(${self.progress})`;
                },
            });
            if (!reduced)
                el.querySelectorAll<HTMLElement>('[data-reveal]').forEach((node) => {
                    gsap.fromTo(
                        node,
                        { y: 18, opacity: 0.05 },
                        { y: 0, opacity: 1, ease: motion.ease, duration: motion.reveal, scrollTrigger: { trigger: node, start: 'top 93%', toggleActions: 'play none none reverse' } },
                    );
                });
        }, el);
        document.fonts.ready.then(() => {
            timer = setTimeout(() => ScrollTrigger.refresh(), 120);
        });
        return () => {
            clearTimeout(timer);
            ctx.revert();
        };
    }, [pathname, reduced, scrollTo, sustainability]);

    useEffect(() => {
        const loader = intro.current;
        if (!loader) return;
        let seen = false;
        try {
            seen = sessionStorage.getItem('floema-two-intro') === 'seen';
        } catch {
            /* Storage may be disabled. */
        }
        if (seen || reduced) {
            gsap.set(loader, { display: 'none' });
            return;
        }
        scroller.current?.stop();
        const tl = gsap.timeline({ delay: 0.15 });
        tl.to(loader.querySelector('.f2-loader-line'), { scaleX: 1, duration: 0.7, ease: motion.ease })
            .to(loader, {
                opacity: 0,
                duration: 0.25,
                onComplete: () => {
                    loader.style.display = 'none';
                    try {
                        sessionStorage.setItem('floema-two-intro', 'seen');
                    } catch {
                        /* Storage can be disabled in private browsing. */
                    }
                    scroller.current?.start();
                },
            })
            .fromTo(content.current, { opacity: 0 }, { opacity: 1, duration: 0.35 });
        return () => {
            tl.kill();
            gsap.set(loader, { display: 'none' });
            scroller.current?.start();
        };
    }, [reduced]);

    useEffect(
        () => () => {
            transition.current?.kill();
        },
        [],
    );
    useEffect(() => {
        if (panel) scroller.current?.stop();
        else scroller.current?.start();
    }, [panel]);
    const value = useMemo(() => ({ reduced, navigate, scrollTo, openPanel: setPanel }), [reduced, navigate, scrollTo]);

    return (
        <Context.Provider value={value}>
            <div className="f2-root" ref={root}>
                <a className="f2-skip" href="#f2-main">
                    Skip to content
                </a>
                <header className="f2-header" ref={header} data-tone={sustainability ? 'green' : 'paper'}>
                    <div className="f2-brand-group">
                        <RouteLink href="/floema-2/home" className="f2-logo" aria-label="Floema home">
                            <span className="f2-logo-mark" aria-hidden="true">
                                ↖
                            </span>
                            loema<sup>®</sup>
                        </RouteLink>
                        <button className="f2-search-trigger" aria-label="Search products" onClick={() => setPanel({ type: 'search' })}>
                            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <circle cx="10" cy="10" r="6.7" stroke="currentColor" strokeWidth="1.65" />
                                <path d="m15 15 6 6" stroke="currentColor" strokeWidth="1.65" />
                            </svg>
                        </button>
                    </div>
                    <nav className="f2-nav" ref={nav} aria-label="Main navigation">
                        <button onClick={() => setPanel({ type: 'products' })}>
                            <span>Products</span>
                        </button>
                        <RouteLink href="/floema-2/home#about">
                            <span>About</span>
                        </RouteLink>
                        <RouteLink href="/floema-2/sustainability" className={sustainability ? 'is-active' : ''}>
                            <span>Sustainability</span>
                        </RouteLink>
                        <button onClick={() => setPanel({ type: 'journal' })}>
                            <span>Journal</span>
                        </button>
                        <ConnectedPills rootRef={nav} selector=":scope > a, :scope > button" />
                    </nav>
                    <span className="f2-language" title="English">
                        EN⌄
                    </span>
                </header>
                <div ref={content} className="f2-route-content">
                    {children}
                </div>
                <div className="f2-scroll-progress" aria-hidden="true">
                    <div ref={progress} />
                </div>
                <button className="f2-contact-button" aria-label="Explore Floema collections" onClick={() => setPanel({ type: 'products' })}>
                    <span>co</span>
                </button>
                <noscript>
                    <style>{`.f2-loader{display:none!important}`}</style>
                </noscript>
                <div ref={intro} className="f2-loader" aria-hidden="true">
                    <span className="f2-loader-word">
                        Floema<sup>®</sup>
                    </span>
                    <span className="f2-loader-line" />
                </div>
                {panel && <PanelDialog panel={panel} onClose={() => setPanel(null)} onPanel={setPanel} />}
            </div>
        </Context.Provider>
    );
}

function PanelDialog({ panel, onClose, onPanel }: { panel: NonNullable<Panel>; onClose: () => void; onPanel: (p: Panel) => void }) {
    const dialog = useRef<HTMLDialogElement>(null);
    const [query, setQuery] = useState(panel.query || '');
    const { reduced } = useFloema();
    useEffect(() => {
        const el = dialog.current!;
        const previous = document.activeElement as HTMLElement;
        el.showModal();
        const oldOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const tween = gsap.fromTo(el.querySelector('.f2-panel-inner'), { y: reduced ? 0 : 32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: motion.ease });
        return () => {
            tween.kill();
            el.close();
            document.body.style.overflow = oldOverflow;
            previous?.focus({ preventScroll: true });
        };
    }, [reduced]);
    const close = () => {
        gsap.to(dialog.current?.querySelector('.f2-panel-inner') || {}, { opacity: 0, y: reduced ? 0 : 16, duration: 0.18, onComplete: onClose });
    };
    const product = products[panel.index || 0];
    const material = materials[panel.index || 0];
    const title =
        panel.type === 'search'
            ? 'Find your next detail.'
            : panel.type === 'products'
              ? 'Spaces, thoughtfully made.'
              : panel.type === 'journal'
                ? 'Notes from the outdoors.'
                : panel.type === 'material'
                  ? material.name
                  : panel.type === 'privacy'
                    ? 'A little care for your privacy.'
                    : product.name;
    const filtered = products.filter((p) => `${p.name} ${p.collection}`.toLowerCase().includes(query.toLowerCase()));
    return (
        <dialog
            className="f2-panel"
            ref={dialog}
            aria-labelledby="f2-panel-title"
            onKeyDownCapture={(e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    close();
                }
            }}
            onCancel={(e) => {
                e.preventDefault();
                close();
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) close();
            }}
            data-lenis-prevent
        >
            <div className="f2-panel-inner">
                <div className="f2-panel-top">
                    <span>Floema®</span>
                    <button onClick={close} aria-label="Close dialog">
                        Close <span>×</span>
                    </button>
                </div>
                <h2 id="f2-panel-title">{title}</h2>
                {(panel.type === 'products' || panel.type === 'search') && (
                    <>
                        <label className="f2-search-field">
                            <span className="f2-sr-only">Search by product or collection</span>
                            <input autoFocus type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="A bench, a sign, a place to start…" />
                            <Arrow />
                        </label>
                        <div className="f2-filter-row">
                            <button onClick={() => setQuery('')}>All objects</button>
                            {collections.map((c) => (
                                <button key={c.slug} onClick={() => setQuery(c.name)}>
                                    {c.symbol} {c.name}
                                </button>
                            ))}
                        </div>
                        <div className="f2-search-results">
                            {filtered.map((p) => (
                                <button key={p.name} onClick={() => onPanel({ type: 'product', index: products.indexOf(p) })}>
                                    <img src={asset(p.image)} alt="" />
                                    <span>
                                        {p.name}
                                        <small>{p.collection} ↗</small>
                                    </span>
                                </button>
                            ))}
                            {filtered.length === 0 && <p>No objects found. Try “bench”, “sign”, or a collection name.</p>}
                        </div>
                    </>
                )}
                {panel.type === 'product' && (
                    <div className="f2-detail">
                        <img src={asset(product.image)} alt={product.name} />
                        <div>
                            <span className="f2-eyebrow">{product.collection} collection</span>
                            <p>A considered addition to everyday spaces. Designed for enduring use, easy maintenance, and a natural connection with its surroundings.</p>
                            <button
                                className="f2-button"
                                onClick={() => {
                                    setQuery(product.collection);
                                    onPanel({ type: 'products' });
                                }}
                            >
                                Explore the collection <Arrow />
                            </button>
                        </div>
                    </div>
                )}
                {panel.type === 'material' && (
                    <div className="f2-detail">
                        <img src={asset(material.swatch)} alt={material.name} />
                        <div>
                            <p>{material.text}</p>
                            <p>{material.detail}</p>
                        </div>
                    </div>
                )}
                {panel.type === 'journal' && (
                    <div className="f2-journal-grid">
                        {[
                            ['coast.webp', 'A closer connection to the landscape', 'Small interventions can make a place more welcoming while preserving the qualities that make it special.'],
                            ['forest.webp', 'Finding our way, together', 'Clear information invites more people to discover and enjoy our natural spaces.'],
                            ['workshop.webp', 'From material to meaning', 'An ongoing exploration of honest materials, thoughtful processes, and useful objects.'],
                        ].map(([image, title, text]) => (
                            <article key={title}>
                                <img src={asset(image)} alt="" />
                                <h3>{title}</h3>
                                <p>{text}</p>
                            </article>
                        ))}
                    </div>
                )}
                {panel.type === 'privacy' && (
                    <p className="f2-privacy-copy">
                        This private design study does not send form entries to an external service. The newsletter form remembers your interest in this browser only. No advertising trackers are added
                        by these pages.
                    </p>
                )}
            </div>
        </dialog>
    );
}

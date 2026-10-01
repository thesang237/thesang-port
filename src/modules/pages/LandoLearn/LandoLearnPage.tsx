'use client';

import { type ComponentType, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { type LenisRef, ReactLenis, useLenis } from 'lenis/react';

import { Link } from '@/i18n/navigation';
import { cn } from '@/utils/cn';

import { CARDS } from './content/cards';
import { type ChapterId, CHAPTERS } from './content/chapters';
import { Flashcards } from './kit/Flashcards';
import { gsap, ScrollTrigger, useGSAP } from './kit/gsap';
import { blockReveal } from './kit/reveal';

const Loading = () => (
    <div className="ll-mono flex h-[60vh] items-center justify-center text-[11px] uppercase tracking-[0.2em] text-[var(--ll-faint)]">
        <span className="animate-pulse">Loading chapter…</span>
    </div>
);

// Every chapter is its own bundle — you only download the demos you open.
const CHAPTER_VIEWS: Record<ChapterId, ComponentType> = {
    map: dynamic(() => import('./chapters/Map'), { ssr: false, loading: Loading }),
    timing: dynamic(() => import('./chapters/Timing'), { ssr: false, loading: Loading }),
    smooth: dynamic(() => import('./chapters/SmoothScroll'), { ssr: false, loading: Loading }),
    reveal: dynamic(() => import('./chapters/Reveal'), { ssr: false, loading: Loading }),
    micro: dynamic(() => import('./chapters/Micro'), { ssr: false, loading: Loading }),
    menu: dynamic(() => import('./chapters/Menu'), { ssr: false, loading: Loading }),
    pinned: dynamic(() => import('./chapters/Pinned'), { ssr: false, loading: Loading }),
    gallery: dynamic(() => import('./chapters/Gallery'), { ssr: false, loading: Loading }),
    webgl: dynamic(() => import('./chapters/WebGLLayer'), { ssr: false, loading: Loading }),
    shaders: dynamic(() => import('./chapters/Shaders'), { ssr: false, loading: Loading }),
    transitions: dynamic(() => import('./chapters/Transitions'), { ssr: false, loading: Loading }),
    perf: dynamic(() => import('./chapters/Performance'), { ssr: false, loading: Loading }),
    build: dynamic(() => import('./chapters/Build'), { ssr: false, loading: Loading }),
};

const HeroVisual = dynamic(() => import('./demos/HeroVisual'), { ssr: false });

const isChapter = (v: string): v is ChapterId => CHAPTERS.some((c) => c.id === v);

const chapterFromHash = (): ChapterId => {
    const h = typeof window === 'undefined' ? '' : window.location.hash.slice(1);
    return isChapter(h) ? h : 'map';
};

const readVisited = (): ChapterId[] => {
    try {
        const raw = JSON.parse(localStorage.getItem('ll-visited') ?? '[]') as string[];
        return raw.filter(isChapter);
    } catch {
        return [];
    }
};

// ─── Hero ───────────────────────────────────────────────────────────────────

function Hero({ onStart }: { onStart: () => void }) {
    const root = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            // the guide opens with the page's own signature: a block wipes across each title line
            const q = gsap.utils.selector(root);
            const lines = q('.ll-hero-line') as HTMLElement[];
            const blocks = q('.ll-hero-line .ll-br-block') as HTMLElement[];
            const tl = gsap.timeline({ delay: 0.25 });
            tl.add(blockReveal(lines, blocks, { stagger: 0.08 }), 0)
                .fromTo('.ll-hero-eyebrow', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0)
                .fromTo('.ll-hero-rule', { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'expo.inOut' }, 0.2)
                .from('.ll-hero-fade', { autoAlpha: 0, y: 14, duration: 0.8, ease: 'power3.out', stagger: 0.07 }, 0.45);
        },
        { scope: root },
    );

    return (
        <div ref={root} className="relative overflow-hidden border-b border-[var(--ll-line)]">
            <div className="ll-contours opacity-70 [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]" />
            <div className="relative mx-auto grid max-w-[1320px] items-center gap-10 px-[var(--ll-gutter)] pb-16 pt-28 sm:pb-24 sm:pt-36 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <div>
                    <p className="ll-hero-eyebrow ll-mono mb-6 text-[11px] uppercase tracking-[0.18em] text-[var(--ll-lime)] opacity-0">{'Case study — /landonorris'}</p>
                    <h1 className="mb-7 text-[clamp(44px,8vw,112px)] font-bold uppercase leading-[0.95] tracking-[-0.03em]">
                        <span className="ll-hero-line block">
                            <span className="ll-br-inner">
                                <span className="ll-br-text">
                                    <span className="ll-serif font-normal normal-case text-[var(--ll-lime)]">Ellis</span> Morrow,
                                </span>
                                <span className="ll-br-block bg-[var(--ll-lime)]" aria-hidden />
                            </span>
                        </span>
                        <span className="ll-hero-line block">
                            <span className="ll-br-inner">
                                <span className="ll-br-text">decoded.</span>
                                <span className="ll-br-block bg-[var(--ll-lime)]" aria-hidden />
                            </span>
                        </span>
                    </h1>
                    <span className="ll-hero-rule mb-7 block h-px w-24 origin-left bg-[var(--ll-lime)]" />
                    <p className="ll-hero-fade mb-8 max-w-[52ch] text-[clamp(17px,1.7vw,21px)] leading-relaxed text-[var(--ll-dim)]">
                        A designer’s field guide to the racing-driver page at <span className="text-[var(--ll-ink)]">/landonorris</span>: a motion clone rebuilt from a screen recording. Every
                        technique — the block wipes, the menu, the pinned scenes, the WebGL helmet reveal, the “4” page transition — is pulled apart, explained in plain words and rebuilt as a small
                        demo you can tweak.
                    </p>
                    <div className="ll-hero-fade flex flex-wrap items-center gap-3">
                        <button type="button" onClick={onStart} className="ll-btn ll-lime-btn ll-mono rounded-lg px-5 py-3 text-[12px] font-bold uppercase tracking-[0.14em]">
                            Start with the map ↓
                        </button>
                        <a
                            href="/landonorris"
                            target="_blank"
                            rel="noreferrer"
                            className="ll-btn ll-mono rounded-lg border border-[var(--ll-line-2)] px-4 py-3 text-[12px] uppercase tracking-[0.14em] text-[var(--ll-dim)] hover:text-[var(--ll-ink)]"
                        >
                            Open /landonorris ↗
                        </a>
                    </div>
                </div>
                <div className="ll-hero-fade relative aspect-square w-full max-w-[560px] justify-self-center lg:justify-self-end">
                    <HeroVisual />
                </div>
            </div>

            <div className="relative mx-auto grid max-w-[1320px] grid-cols-2 gap-px border-t border-[var(--ll-line)] px-[var(--ll-gutter)] sm:grid-cols-5">
                {[
                    ['0.1', 'lerp — measured from video'],
                    ['1', 'clock for everything'],
                    ['780px', 'of scroll for the hero pin'],
                    ['2', 'WebGL canvases'],
                    ['6', 'images — all 3D renders'],
                ].map(([n, l]) => (
                    <div key={l} className="ll-hero-fade py-6 pr-4">
                        <div className="text-[clamp(26px,3vw,36px)] font-semibold tracking-[-0.03em]">{n}</div>
                        <div className="ll-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--ll-faint)]">{l}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── How to use ─────────────────────────────────────────────────────────────

function HowTo() {
    return (
        <div className="mx-auto grid max-w-[1320px] gap-6 px-[var(--ll-gutter)] py-12 sm:grid-cols-3">
            {[
                ['01', 'Read the idea', 'Each chapter starts in plain words, with a “designer lens” that maps it to tools you know — Figma, After Effects.'],
                ['02', 'Play with the dials', 'Every demo has sliders. Break things on purpose: extreme values teach you what a dial really does.'],
                ['03', 'Lock it in', 'Flip the flashcards at the end of each chapter, then take the final quiz in chapter 12.'],
            ].map(([n, t, d]) => (
                <div key={n} className="flex gap-4">
                    <span className="ll-mono pt-1 text-[11px] text-[var(--ll-lime)]">{n}</span>
                    <div>
                        <div className="mb-1 font-semibold">{t}</div>
                        <p className="text-[14px] leading-relaxed text-[var(--ll-dim)]">{d}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Table of contents (per chapter) ────────────────────────────────────────

function Toc({ content, chapter }: { content: React.RefObject<HTMLDivElement | null>; chapter: ChapterId }) {
    const [items, setItems] = useState<{ id: string; label: string }[]>([]);
    const [current, setCurrent] = useState('');
    const lenis = useLenis();

    useEffect(() => {
        const el = content.current;
        if (!el) return;
        let io: IntersectionObserver | null = null;
        const scan = () => {
            const heads = Array.from(el.querySelectorAll<HTMLElement>('[data-toc]'));
            setItems(heads.map((h) => ({ id: h.dataset.toc ?? '', label: h.textContent ?? '' })));
            io?.disconnect();
            io = new IntersectionObserver(
                (entries) => {
                    entries.forEach((e) => e.isIntersecting && setCurrent((e.target as HTMLElement).dataset.toc ?? ''));
                },
                { rootMargin: '-20% 0px -70% 0px' },
            );
            heads.forEach((h) => io?.observe(h));
        };
        let t = 0;
        const mo = new MutationObserver(() => {
            window.clearTimeout(t);
            t = window.setTimeout(scan, 120);
        });
        mo.observe(el, { childList: true, subtree: true });
        scan();
        return () => {
            mo.disconnect();
            io?.disconnect();
            window.clearTimeout(t);
        };
    }, [content, chapter]);

    if (!items.length) return null;
    return (
        <nav aria-label="On this page" className="sticky top-32 hidden max-h-[calc(100vh-10rem)] overflow-y-auto lg:block">
            <div className="ll-mono mb-3 text-[10px] uppercase tracking-[0.18em] text-[var(--ll-faint)]">On this page</div>
            <ul className="space-y-1 border-l border-[var(--ll-line)]">
                {items.map((it) => (
                    <li key={it.id}>
                        <a
                            href={`#${it.id}`}
                            onClick={(e) => {
                                e.preventDefault();
                                lenis?.scrollTo(`#${it.id}`, { offset: -110, duration: 1.4 });
                            }}
                            className={cn(
                                '-ml-px block border-l py-1 pl-3 text-[12.5px] leading-snug transition-colors',
                                current === it.id ? 'border-[var(--ll-lime)] text-[var(--ll-ink)]' : 'border-transparent text-[var(--ll-faint)] hover:text-[var(--ll-dim)]',
                            )}
                        >
                            {it.label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

// ─── Page ───────────────────────────────────────────────────────────────────

function Guide() {
    // the guide is client-only, so the hash and localStorage can seed state directly
    const [active, setActive] = useState<ChapterId>(chapterFromHash);
    const [visited, setVisited] = useState<ChapterId[]>(() => {
        const v = readVisited();
        const a = chapterFromHash();
        return v.includes(a) ? v : [...v, a];
    });
    const anchor = useRef<HTMLDivElement>(null);
    const content = useRef<HTMLDivElement>(null);
    const tabsRef = useRef<HTMLDivElement>(null);
    const bar = useRef<HTMLSpanElement>(null);
    const lenis = useLenis(({ progress }) => {
        ScrollTrigger.update();
        if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
    });

    const open = useCallback((id: ChapterId) => {
        setActive(id);
        setVisited((v) => (v.includes(id) ? v : [...v, id]));
    }, []);

    // hash ↔ chapter (back/forward buttons, pasted links)
    useEffect(() => {
        const sync = () => {
            const h = window.location.hash.slice(1);
            if (isChapter(h)) open(h);
        };
        window.addEventListener('hashchange', sync);
        window.addEventListener('popstate', sync);
        return () => {
            window.removeEventListener('hashchange', sync);
            window.removeEventListener('popstate', sync);
        };
    }, [open]);

    // remember visited chapters
    useEffect(() => {
        try {
            localStorage.setItem('ll-visited', JSON.stringify(visited));
        } catch {
            /* private mode — progress just isn't remembered */
        }
    }, [visited]);

    // keep the active tab in view
    useEffect(() => {
        const tabs = tabsRef.current;
        const tab = tabs?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
        if (tabs && tab) tabs.scrollTo({ left: tab.offsetLeft - tabs.clientWidth / 2 + tab.clientWidth / 2, behavior: 'smooth' });
    }, [active]);

    // chapters load lazily and code blocks highlight async — re-measure scroll triggers whenever the content's height settles
    useEffect(() => {
        const el = content.current;
        if (!el) return;
        let t = 0;
        let last = 0;
        const ro = new ResizeObserver(([entry]) => {
            const h = Math.round(entry.contentRect.height);
            if (h === last) return;
            last = h;
            window.clearTimeout(t);
            t = window.setTimeout(() => ScrollTrigger.refresh(), 200);
        });
        ro.observe(el);
        return () => {
            ro.disconnect();
            window.clearTimeout(t);
        };
    }, [active]);

    const go = useCallback(
        (id: ChapterId) => {
            if (id !== active) window.history.pushState(null, '', `#${id}`);
            open(id);
            const el = anchor.current;
            if (el && lenis) {
                const top = el.getBoundingClientRect().top + window.scrollY;
                if (window.scrollY > top - 2) lenis.scrollTo(top, { immediate: true, force: true });
            }
        },
        [active, lenis, open],
    );

    const idx = CHAPTERS.findIndex((c) => c.id === active);
    const prev = CHAPTERS[idx - 1];
    const next = CHAPTERS[idx + 1];
    const View = CHAPTER_VIEWS[active];

    return (
        <>
            {/* top bar */}
            <div className="fixed inset-x-0 top-0 z-40 border-b border-[var(--ll-line)] bg-[rgba(23,26,18,0.78)] backdrop-blur-xl">
                <div className="mx-auto flex h-12 max-w-[1320px] items-center justify-between gap-4 px-[var(--ll-gutter)]">
                    <Link href="/landonorris" className="ll-mono flex shrink-0 items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[var(--ll-dim)] hover:text-[var(--ll-ink)]">
                        <span aria-hidden>←</span> /landonorris
                    </Link>
                    <div className="ll-mono min-w-0 truncate text-[11px] tracking-[0.12em] text-[var(--ll-faint)]">
                        <span className="text-[var(--ll-lime)]">{CHAPTERS[idx].n}</span> {CHAPTERS[idx].label}
                    </div>
                    <div className="ll-mono shrink-0 text-[11px] tabular-nums text-[var(--ll-faint)]">
                        {`${visited.length}/${CHAPTERS.length}`}
                        <span className="hidden sm:inline"> read</span>
                    </div>
                </div>
                <span ref={bar} className="absolute bottom-0 left-0 block h-px w-full origin-left scale-x-0 bg-[var(--ll-lime)]" />
            </div>

            <Hero onStart={() => lenis?.scrollTo(anchor.current ?? 0, { offset: 0, duration: 1.6 })} />
            <HowTo />

            {/* tabs */}
            <div ref={anchor} />
            <div className="sticky top-12 z-30 border-y border-[var(--ll-line)] bg-[rgba(23,26,18,0.9)] backdrop-blur-xl">
                <div ref={tabsRef} role="tablist" aria-label="Chapters" className="ll-tabs mx-auto flex max-w-[1320px] gap-1 overflow-x-auto px-[var(--ll-gutter)] py-2">
                    {CHAPTERS.map((c) => (
                        <button
                            key={c.id}
                            data-tab={c.id}
                            type="button"
                            role="tab"
                            aria-selected={active === c.id}
                            onClick={() => go(c.id)}
                            className={cn(
                                'll-tab ll-mono flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2 text-[11.5px]',
                                active === c.id && 'is-active ll-bracket',
                                visited.includes(c.id) && 'is-visited',
                            )}
                        >
                            <span className={active === c.id ? 'text-[var(--ll-lime)]' : ''}>{c.n}</span>
                            <span>{c.label}</span>
                            <span className="ll-tab-dot" aria-hidden />
                        </button>
                    ))}
                </div>
            </div>

            {/* chapter */}
            <div className="mx-auto grid max-w-[1320px] gap-12 px-[var(--ll-gutter)] pb-24 pt-14 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_200px]">
                <div ref={content} key={active} role="tabpanel" className="min-w-0">
                    <View />
                    <div className="mt-16 border-t border-[var(--ll-line)] pt-12">
                        <Flashcards key={active} cards={CARDS[active]} />
                    </div>
                    <nav className="mt-16 grid gap-3 sm:grid-cols-2" aria-label="Chapter navigation">
                        {prev ? (
                            <button
                                type="button"
                                onClick={() => go(prev.id)}
                                className="ll-btn group rounded-2xl border border-[var(--ll-line)] p-5 text-left hover:border-[var(--ll-line-2)] hover:bg-white/[0.02]"
                            >
                                <div className="ll-mono mb-2 text-[10px] uppercase tracking-[0.16em] text-[var(--ll-faint)]">← Previous · {prev.n}</div>
                                <div className="text-[18px] font-semibold tracking-[-0.01em]">{prev.label}</div>
                                <div className="text-[13px] text-[var(--ll-dim)]">{prev.blurb}</div>
                            </button>
                        ) : (
                            <span />
                        )}
                        {next && (
                            <button
                                type="button"
                                onClick={() => go(next.id)}
                                className="ll-btn group rounded-2xl border border-[rgba(205,255,11,0.25)] bg-[rgba(205,255,11,0.04)] p-5 text-right hover:border-[rgba(205,255,11,0.5)] sm:col-start-2"
                            >
                                <div className="ll-mono mb-2 text-[10px] uppercase tracking-[0.16em] text-[var(--ll-lime)]">Next · {next.n} →</div>
                                <div className="text-[18px] font-semibold tracking-[-0.01em]">{next.label}</div>
                                <div className="text-[13px] text-[var(--ll-dim)]">{next.blurb}</div>
                            </button>
                        )}
                    </nav>
                </div>
                <Toc content={content} chapter={active} />
            </div>

            <footer className="border-t border-[var(--ll-line)]">
                <div className="ll-mono mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3 px-[var(--ll-gutter)] py-8 text-[11px] text-[var(--ll-faint)]">
                    <span>Ellis Morrow, decoded — a study of /landonorris (src/modules/pages/LandoNorris)</span>
                    <span>Built with the same stack: Lenis · GSAP · three.js</span>
                </div>
            </footer>
        </>
    );
}

export default function LandoLearnPage() {
    const lenisRef = useRef<LenisRef | null>(null);

    // One clock: GSAP's ticker drives Lenis (exactly like motion-kit/SmoothScroll on the source page).
    useLayoutEffect(() => {
        const update = (time: number) => lenisRef.current?.lenis?.raf(time * 1000);
        gsap.ticker.add(update);
        gsap.ticker.lagSmoothing(0);
        return () => {
            gsap.ticker.remove(update);
            gsap.ticker.lagSmoothing(500, 33);
        };
    }, []);

    return (
        <ReactLenis root ref={lenisRef} options={{ autoRaf: false, lerp: 0.1 }}>
            <main className="ll-root">
                <Guide />
                <div className="ll-grain" aria-hidden />
            </main>
        </ReactLenis>
    );
}

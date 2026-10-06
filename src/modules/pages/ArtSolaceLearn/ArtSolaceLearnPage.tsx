'use client';

import { type ComponentType, type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { type LenisRef, ReactLenis, useLenis } from 'lenis/react';

import { Link } from '@/i18n/navigation';
import { cn } from '@/utils/cn';

import { CARDS } from './content/cards';
import { type ChapterId, CHAPTERS } from './content/chapters';
import { Flashcards } from './kit/Flashcards';
import { gsap, useGSAP } from './kit/gsap';
import { Grain } from './kit/ui';

const Loading = () => (
    <div className="sl-mono flex h-[60vh] items-center justify-center gap-2 text-[11px] uppercase text-[var(--sl-faint)]">
        <span className="sl-dot animate-pulse text-[var(--sl-rust)]" />
        Loading chapter…
    </div>
);

// Every chapter is its own bundle: you only download (and only run the canvases of) the chapter you open.
const CHAPTER_VIEWS: Record<ChapterId, ComponentType> = {
    map: dynamic(() => import('./chapters/Map'), { ssr: false, loading: Loading }),
    seeds: dynamic(() => import('./chapters/Seeds'), { ssr: false, loading: Loading }),
    traits: dynamic(() => import('./chapters/Traits'), { ssr: false, loading: Loading }),
    noise: dynamic(() => import('./chapters/Noise'), { ssr: false, loading: Loading }),
    ridge: dynamic(() => import('./chapters/Ridge'), { ssr: false, loading: Loading }),
    maps: dynamic(() => import('./chapters/Maps'), { ssr: false, loading: Loading }),
    warp: dynamic(() => import('./chapters/Warp'), { ssr: false, loading: Loading }),
    brush: dynamic(() => import('./chapters/Brush'), { ssr: false, loading: Loading }),
    shader: dynamic(() => import('./chapters/Shader'), { ssr: false, loading: Loading }),
    living: dynamic(() => import('./chapters/Living'), { ssr: false, loading: Loading }),
    type: dynamic(() => import('./chapters/SandType'), { ssr: false, loading: Loading }),
    strata: dynamic(() => import('./chapters/Strata'), { ssr: false, loading: Loading }),
    build: dynamic(() => import('./chapters/Build'), { ssr: false, loading: Loading }),
};

const HeroArt = dynamic(() => import('./demos/HeroArt'), { ssr: false });

const isChapter = (v: string): v is ChapterId => CHAPTERS.some((c) => c.id === v);

const chapterFromHash = (): ChapterId => {
    const h = typeof window === 'undefined' ? '' : window.location.hash.slice(1);
    return isChapter(h) ? h : 'map';
};

const VISITED_KEY = 'sl-visited';
const readVisited = (): ChapterId[] => {
    try {
        const raw = JSON.parse(localStorage.getItem(VISITED_KEY) ?? '[]') as string[];
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
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const q = gsap.utils.selector(root);
            // the copy settles in like the sand: top to bottom, softly
            gsap.timeline({ defaults: { ease: 'expo.out' } })
                .from(q('.sl-hero-line'), { yPercent: 105, duration: 1.4, stagger: 0.09 }, 0.1)
                .from(q('.sl-hero-fade'), { autoAlpha: 0, y: 12, duration: 1.2, stagger: 0.08 }, 0.5)
                .from(q('.sl-hero-stat'), { autoAlpha: 0, duration: 1, stagger: 0.06 }, 0.9);
        },
        { scope: root },
    );

    return (
        <div ref={root} className="relative border-b border-[var(--sl-line-2)]">
            <div className="mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-10 px-[var(--sl-gutter)] pb-14 pt-24 sm:pt-32 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
                <div>
                    <p className="sl-hero-fade sl-mono mb-7 flex items-center gap-2 text-[11px] uppercase text-[var(--sl-rust-ink)]">
                        <Grain />
                        {'A field guide · /art-solace'}
                    </p>
                    <h1 className="sl-head mb-8 text-[clamp(64px,10vw,148px)]" aria-label="Solace, decoded.">
                        <span className="block overflow-hidden pb-[0.06em]">
                            <span className="sl-hero-line block">Solace,</span>
                        </span>
                        <span className="block overflow-hidden pb-[0.06em]">
                            <span className="sl-hero-line block italic text-[var(--sl-rust-ink)]">decoded.</span>
                        </span>
                    </h1>
                    <p className="sl-hero-fade mb-9 max-w-[52ch] text-[clamp(17px,1.6vw,20px)] leading-relaxed text-[var(--sl-body)]">
                        A generative artwork made of about 400,000 grains of sand. Each grain asks one question, “am I in a dune, on its slope, or in the sky?”, and a dice roll decides if it stays.
                        This guide takes it apart, then moves the same ideas onto the GPU and makes three new pieces with them. The picture is the real code, drawing itself.
                    </p>
                    <div className="sl-hero-fade flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={onStart}
                            className="sl-btn sl-mono rounded-full border border-[var(--sl-ink)] bg-[var(--sl-ink)] px-5 py-3 text-[12px] uppercase text-[var(--sl-bg)] hover:bg-[#3a3540]"
                        >
                            Start with the map ↓
                        </button>
                        <a
                            href="/art-solace"
                            target="_blank"
                            rel="noreferrer"
                            className="sl-btn sl-mono rounded-full border border-[var(--sl-line-3)] px-4 py-3 text-[12px] uppercase text-[var(--sl-body)] hover:border-[var(--sl-ink)] hover:text-[var(--sl-ink)]"
                        >
                            Open /art-solace ↗
                        </a>
                    </div>
                </div>
                <div className="sl-hero-fade mx-auto w-full max-w-[520px]">
                    <HeroArt />
                </div>
            </div>

            <div className="mx-auto grid max-w-[1320px] grid-cols-2 border-t border-[var(--sl-line-2)] px-[var(--sl-gutter)] sm:grid-cols-5">
                {[
                    ['400k', 'grains per piece'],
                    ['1', 'seed decides everything'],
                    ['3', 'zones: core, slope, sky'],
                    ['18', 'palettes, 6 of them rare'],
                    ['0', 'outlines or fills'],
                ].map(([n, l]) => (
                    <div key={l} className="sl-hero-stat py-6 pr-4">
                        <div className="sl-serif text-[clamp(32px,3.4vw,46px)] leading-none">{n}</div>
                        <div className="sl-mono mt-2 text-[10.5px] uppercase text-[var(--sl-dim)]">{l}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── How to use ─────────────────────────────────────────────────────────────

function HowTo() {
    return (
        <div className="mx-auto grid max-w-[1320px] gap-6 px-[var(--sl-gutter)] py-12 sm:grid-cols-3">
            {[
                ['01', 'Read the idea', 'Each chapter starts in plain words, with a “designer lens” that maps it to tools you know: Figma, After Effects, a print studio.'],
                ['02', 'Play with the dials', 'Demos run the artwork’s real code and start at its real values. Break things on purpose: extreme values show what a dial really does.'],
                ['03', 'Lock it in', 'Flip the flashcards at the end of each chapter, then take the final quiz in chapter 12.'],
            ].map(([n, t, d]) => (
                <div key={n} className="flex gap-4">
                    <span className="sl-serif pt-0.5 text-[26px] leading-none text-[var(--sl-rust-ink)]">{n}</span>
                    <div>
                        <div className="mb-1 text-[17px] font-semibold">{t}</div>
                        <p className="text-[15px] leading-relaxed text-[var(--sl-dim)]">{d}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Table of contents (per chapter) ────────────────────────────────────────

function Toc({ content, chapter }: { content: RefObject<HTMLDivElement | null>; chapter: ChapterId }) {
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
            <div className="sl-mono mb-3 flex items-center gap-2 text-[10.5px] uppercase text-[var(--sl-faint)]">
                <span className="sl-dot" />
                On this page
            </div>
            <ul className="space-y-1 border-l border-[var(--sl-line-2)]">
                {items.map((it) => (
                    <li key={it.id}>
                        <a
                            href={`#${it.id}`}
                            onClick={(e) => {
                                e.preventDefault();
                                lenis?.scrollTo(`#${it.id}`, { offset: -110, duration: 1.4 });
                            }}
                            className={cn(
                                '-ml-px block border-l-2 py-1 pl-3 text-[13px] leading-snug transition-colors',
                                current === it.id ? 'border-[var(--sl-rust)] text-[var(--sl-ink)]' : 'border-transparent text-[var(--sl-faint)] hover:text-[var(--sl-body)]',
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
        if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
    });

    const open = useCallback((id: ChapterId) => {
        setActive(id);
        setVisited((v) => (v.includes(id) ? v : [...v, id]));
    }, []);

    const jumpToTabs = useCallback(() => {
        const el = anchor.current;
        if (!el || !lenis) return;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (window.scrollY > top - 2) lenis.scrollTo(top, { immediate: true, force: true });
    }, [lenis]);

    // hash ↔ chapter (back/forward buttons, pasted links, in-text chapter links)
    useEffect(() => {
        const sync = () => {
            const h = window.location.hash.slice(1);
            if (!isChapter(h)) return;
            open(h);
            jumpToTabs();
        };
        window.addEventListener('hashchange', sync);
        window.addEventListener('popstate', sync);
        return () => {
            window.removeEventListener('hashchange', sync);
            window.removeEventListener('popstate', sync);
        };
    }, [open, jumpToTabs]);

    // remember visited chapters
    useEffect(() => {
        try {
            localStorage.setItem(VISITED_KEY, JSON.stringify(visited));
        } catch {
            /* private mode: progress just isn't remembered */
        }
    }, [visited]);

    // keep the active tab in view
    useEffect(() => {
        const tabs = tabsRef.current;
        const tab = tabs?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
        if (tabs && tab) tabs.scrollTo({ left: tab.offsetLeft - tabs.clientWidth / 2 + tab.clientWidth / 2, behavior: 'smooth' });
    }, [active]);

    const go = useCallback(
        (id: ChapterId) => {
            if (id !== active) window.history.pushState(null, '', `#${id}`);
            open(id);
            jumpToTabs();
        },
        [active, open, jumpToTabs],
    );

    const idx = CHAPTERS.findIndex((c) => c.id === active);
    const prev = CHAPTERS[idx - 1];
    const next = CHAPTERS[idx + 1];
    const View = CHAPTER_VIEWS[active];

    return (
        <>
            {/* top bar */}
            <div className="fixed inset-x-0 top-0 z-40 border-b border-[var(--sl-line)] bg-[rgba(242,230,218,0.82)] backdrop-blur-xl">
                <div className="mx-auto flex h-12 max-w-[1320px] items-center justify-between gap-4 px-[var(--sl-gutter)]">
                    <Link href="/art-solace" className="sl-mono flex shrink-0 items-center gap-2 text-[11px] uppercase text-[var(--sl-dim)] hover:text-[var(--sl-ink)]">
                        <span aria-hidden>←</span> /art-solace
                    </Link>
                    <div className="sl-mono flex min-w-0 items-center gap-2 truncate text-[11px] uppercase text-[var(--sl-dim)]">
                        <Grain className="text-[var(--sl-rust)]" />
                        <span className="text-[var(--sl-ink)]">{CHAPTERS[idx].n}</span>
                        <span className="truncate">{CHAPTERS[idx].label}</span>
                    </div>
                    <div className="sl-mono shrink-0 text-[11px] tabular-nums text-[var(--sl-dim)]">
                        {`${visited.length}/${CHAPTERS.length}`}
                        <span className="hidden sm:inline"> read</span>
                    </div>
                </div>
                <span ref={bar} className="absolute bottom-0 left-0 block h-[2px] w-full origin-left scale-x-0 bg-[var(--sl-rust)]" />
            </div>

            <Hero onStart={() => lenis?.scrollTo(anchor.current ?? 0, { offset: 0, duration: 1.6 })} />
            <HowTo />

            {/* tabs */}
            <div ref={anchor} />
            <div className="sticky top-12 z-30 border-y border-[var(--sl-line)] bg-[rgba(242,230,218,0.92)] backdrop-blur-xl">
                <div ref={tabsRef} role="tablist" aria-label="Chapters" className="sl-tabs mx-auto flex max-w-[1320px] gap-0.5 overflow-x-auto px-[var(--sl-gutter)] py-1.5">
                    {CHAPTERS.map((c) => (
                        <button
                            key={c.id}
                            data-tab={c.id}
                            type="button"
                            role="tab"
                            aria-selected={active === c.id}
                            onClick={() => go(c.id)}
                            className={cn(
                                'sl-tab sl-mono flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2.5 text-[11.5px] uppercase',
                                active === c.id && 'is-active',
                                visited.includes(c.id) && 'is-visited',
                            )}
                        >
                            <Grain filled={active === c.id || visited.includes(c.id)} className={active === c.id ? 'text-[var(--sl-rust)]' : undefined} />
                            <span className="opacity-60">{c.n}</span>
                            <span>{c.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* chapter */}
            <div className="mx-auto grid max-w-[1320px] gap-12 px-[var(--sl-gutter)] pb-24 pt-14 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_200px]">
                <div ref={content} key={active} role="tabpanel" className="min-w-0">
                    <View />
                    <div className="mt-16 border-t border-[var(--sl-line-2)] pt-12">
                        <Flashcards key={active} cards={CARDS[active]} />
                    </div>
                    <nav className="mt-16 grid gap-3 sm:grid-cols-2" aria-label="Chapter navigation">
                        {prev ? (
                            <button
                                type="button"
                                onClick={() => go(prev.id)}
                                className="sl-btn group rounded-xl border border-[var(--sl-line-2)] bg-[var(--sl-panel)] p-5 text-left hover:border-[var(--sl-line-3)]"
                            >
                                <div className="sl-mono mb-2 text-[10.5px] uppercase text-[var(--sl-faint)]">← Previous · {prev.n}</div>
                                <div className="sl-serif text-[26px] leading-tight">{prev.label}</div>
                                <div className="text-[14px] text-[var(--sl-dim)]">{prev.blurb}</div>
                            </button>
                        ) : (
                            <span />
                        )}
                        {next && (
                            <button
                                type="button"
                                onClick={() => go(next.id)}
                                className="sl-btn group rounded-xl border border-[var(--sl-ink)] bg-[var(--sl-ink)] p-5 text-right text-[var(--sl-bg)] hover:bg-[#2c2930] sm:col-start-2"
                            >
                                <div className="sl-mono mb-2 text-[10.5px] uppercase text-[var(--sl-rust)]">Next · {next.n} →</div>
                                <div className="sl-serif text-[26px] leading-tight">{next.label}</div>
                                <div className="text-[14px] text-[#cbbfb3]">{next.blurb}</div>
                            </button>
                        )}
                    </nav>
                </div>
                <Toc content={content} chapter={active} />
            </div>

            <footer className="border-t border-[var(--sl-line-2)] bg-[var(--sl-bg-2)]">
                <div className="sl-mono mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3 px-[var(--sl-gutter)] py-8 text-[11px] uppercase text-[var(--sl-faint)]">
                    <span className="flex items-center gap-2">
                        <Grain />
                        Solace, decoded: a study of /art-solace (src/modules/pages/ArtSolace)
                    </span>
                    <span>Source: Canvas 2D · Guide demos: Canvas 2D, raw WebGL2, GSAP ticker, Lenis</span>
                </div>
            </footer>
        </>
    );
}

export default function ArtSolaceLearnPage() {
    const lenisRef = useRef<LenisRef | null>(null);

    // One clock: GSAP's ticker drives Lenis and every demo.
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
        <ReactLenis root ref={lenisRef} options={{ autoRaf: false, lerp: 0.09, wheelMultiplier: 0.9 }}>
            <main className="sl-root">
                <Guide />
                <div className="sl-grain" aria-hidden />
            </main>
        </ReactLenis>
    );
}

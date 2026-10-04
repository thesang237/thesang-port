'use client';

import { type ComponentType, type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { type LenisRef, ReactLenis, useLenis } from 'lenis/react';

import { Link } from '@/i18n/navigation';
import { cn } from '@/utils/cn';

import { CARDS } from './content/cards';
import { type ChapterId, CHAPTERS } from './content/chapters';
import { Flashcards } from './kit/Flashcards';
import { gsap, ScrollTrigger, useGSAP } from './kit/gsap';
import { Ring } from './kit/ui';

const Loading = () => (
    <div className="cl-mono flex h-[60vh] items-center justify-center gap-2 text-[11px] uppercase text-[var(--cl-faint)]">
        <span className="cl-dot animate-pulse text-[var(--cl-mint)]" />
        Loading chapter…
    </div>
);

// Every chapter is its own bundle — you only download (and only run the WebGL of) the chapter you open.
const CHAPTER_VIEWS: Record<ChapterId, ComponentType> = {
    map: dynamic(() => import('./chapters/Map'), { ssr: false, loading: Loading }),
    steps: dynamic(() => import('./chapters/Steps'), { ssr: false, loading: Loading }),
    story: dynamic(() => import('./chapters/Story'), { ssr: false, loading: Loading }),
    worlds: dynamic(() => import('./chapters/Worlds'), { ssr: false, loading: Loading }),
    titles: dynamic(() => import('./chapters/Titles'), { ssr: false, loading: Loading }),
    scatter: dynamic(() => import('./chapters/Scatter'), { ssr: false, loading: Loading }),
    camera: dynamic(() => import('./chapters/Camera'), { ssr: false, loading: Loading }),
    bokeh: dynamic(() => import('./chapters/Bokeh'), { ssr: false, loading: Loading }),
    strands: dynamic(() => import('./chapters/Strands'), { ssr: false, loading: Loading }),
    springs: dynamic(() => import('./chapters/Springs'), { ssr: false, loading: Loading }),
    fakes: dynamic(() => import('./chapters/Fakes'), { ssr: false, loading: Loading }),
    perf: dynamic(() => import('./chapters/Performance'), { ssr: false, loading: Loading }),
    build: dynamic(() => import('./chapters/Build'), { ssr: false, loading: Loading }),
};

const HeroTitle = dynamic(() => import('./demos/HeroTitle'), { ssr: false });

const isChapter = (v: string): v is ChapterId => CHAPTERS.some((c) => c.id === v);

const chapterFromHash = (): ChapterId => {
    const h = typeof window === 'undefined' ? '' : window.location.hash.slice(1);
    return isChapter(h) ? h : 'map';
};

const readVisited = (): ChapterId[] => {
    try {
        const raw = JSON.parse(localStorage.getItem('cl-visited') ?? '[]') as string[];
        return raw.filter(isChapter);
    } catch {
        return [];
    }
};

// ─── Hero ───────────────────────────────────────────────────────────────────

function Hero({ onStart }: { onStart: () => void }) {
    const root = useRef<HTMLDivElement>(null);
    const anchor = useRef<HTMLHeadingElement>(null);
    // if WebGL or the font atlas fails, the DOM heading simply shows itself
    const [glFailed, setGlFailed] = useState(false);

    useGSAP(
        () => {
            const q = gsap.utils.selector(root);
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            // copy follows the title's trace (the page's order: title, then body copy, then the CTA)
            gsap.timeline({ delay: 1.6, defaults: { ease: 'sine.inOut' } })
                .from(q('.cl-hero-fade'), { autoAlpha: 0, y: 14, duration: 1.2, stagger: 0.12 }, 0)
                .from(q('.cl-hero-stat'), { autoAlpha: 0, duration: 1.2, stagger: 0.08 }, 0.6);
        },
        { scope: root },
    );

    return (
        <div ref={root} className="cl-glow-bg relative overflow-hidden border-b border-[var(--cl-line-2)]">
            <HeroTitle anchor={anchor as RefObject<HTMLElement | null>} area={root as RefObject<HTMLElement | null>} onReady={(ok) => setGlFailed(!ok)} />
            <div className="pointer-events-none relative mx-auto max-w-[1320px] px-[var(--cl-gutter)] pb-14 pt-28 sm:pb-20 sm:pt-36">
                <p className="cl-hero-fade cl-mono mb-7 flex items-center gap-2 text-[11px] uppercase text-[var(--cl-mint)]">
                    <Ring arc={100} />
                    {'Case study · /corn'}
                </p>
                <h1 ref={anchor} className={cn('cl-gl-anchor mb-8 text-[clamp(56px,10.4vw,150px)] leading-[0.987]', glFailed && '!text-[var(--cl-ink)]')} aria-label="Grainline, decoded.">
                    <span className="block">GRAINLINE,</span>
                    <span className="block">DECODED.</span>
                </h1>
                <p className="cl-hero-fade mb-9 max-w-[54ch] text-[clamp(17px,1.7vw,21px)] leading-relaxed text-[var(--cl-body)]">
                    A designer’s field guide to <span className="text-[var(--cl-ink)]">/corn</span>, a chapter-by-chapter WebGL story. The stepped scroll, the slanted wipe, the titles that trace and
                    scatter, the bokeh, the DNA, the springy field: each piece pulled apart, explained in plain words and rebuilt as a demo you can break. The title above is the page’s own code. Sweep
                    it, or press and hold.
                </p>
                <div className="cl-hero-fade pointer-events-auto flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={onStart}
                        className="cl-btn cl-mono rounded-full border border-[var(--cl-mint)] bg-[var(--cl-mint)] px-5 py-3 text-[12px] uppercase text-[#04140c] hover:bg-[#8fffd8]"
                    >
                        Start with the map ↓
                    </button>
                    <a
                        href="/corn"
                        target="_blank"
                        rel="noreferrer"
                        className="cl-btn cl-mono rounded-full border border-[var(--cl-line-3)] px-4 py-3 text-[12px] uppercase text-[var(--cl-body)] hover:border-[var(--cl-mint)] hover:text-[var(--cl-mint)]"
                    >
                        Open /corn ↗
                    </a>
                </div>
            </div>

            <div className="pointer-events-none relative mx-auto grid max-w-[1320px] grid-cols-2 border-t border-[var(--cl-line-2)] px-[var(--cl-gutter)] sm:grid-cols-5">
                {[
                    ['9', 'scroll stops'],
                    ['5', '3D worlds, 1 canvas'],
                    ['1', 'number drives it all'],
                    ['16.7', 'ms a frame, measured'],
                    ['34', 'max draw calls a frame'],
                ].map(([n, l]) => (
                    <div key={l} className="cl-hero-stat py-6 pr-4">
                        <div className="cl-display text-[clamp(28px,3.2vw,40px)] leading-none">{n}</div>
                        <div className="cl-mono mt-2 text-[10.5px] uppercase text-[var(--cl-dim)]">{l}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── How to use ─────────────────────────────────────────────────────────────

function HowTo() {
    return (
        <div className="mx-auto grid max-w-[1320px] gap-6 px-[var(--cl-gutter)] py-12 sm:grid-cols-3">
            {[
                ['01', 'Read the idea', 'Each chapter starts in plain words, with a “designer lens” that maps it to tools you know: Figma, After Effects, a camera.'],
                ['02', 'Play with the dials', 'Every demo starts at the real page’s values. Break things on purpose: extreme values show what a dial really does.'],
                ['03', 'Lock it in', 'Flip the flashcards at the end of each chapter, then take the final quiz in chapter 12.'],
            ].map(([n, t, d]) => (
                <div key={n} className="flex gap-4">
                    <span className="cl-display pt-0.5 text-[20px] leading-none text-[var(--cl-mint)]">{n}</span>
                    <div>
                        <div className="mb-1 text-[17px] font-semibold">{t}</div>
                        <p className="text-[15px] leading-relaxed text-[var(--cl-dim)]">{d}</p>
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
            <div className="cl-mono mb-3 flex items-center gap-2 text-[10.5px] uppercase text-[var(--cl-faint)]">
                <span className="cl-dot" />
                On this page
            </div>
            <ul className="space-y-1 border-l border-[var(--cl-line-2)]">
                {items.map((it) => (
                    <li key={it.id}>
                        <a
                            href={`#${it.id}`}
                            onClick={(e) => {
                                e.preventDefault();
                                lenis?.scrollTo(`#${it.id}`, { offset: -110, duration: 1.4 });
                            }}
                            className={cn(
                                '-ml-px block border-l py-1 pl-3 text-[13px] leading-snug transition-colors',
                                current === it.id ? 'border-[var(--cl-mint)] text-[var(--cl-ink)]' : 'border-transparent text-[var(--cl-faint)] hover:text-[var(--cl-body)]',
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

    // hash ↔ chapter (back/forward buttons, pasted links, in-text chapter links)
    useEffect(() => {
        const sync = () => {
            const h = window.location.hash.slice(1);
            if (!isChapter(h)) return;
            open(h);
            const el = anchor.current;
            if (el && lenis) {
                const top = el.getBoundingClientRect().top + window.scrollY;
                if (window.scrollY > top - 2) lenis.scrollTo(top, { immediate: true, force: true });
            }
        };
        window.addEventListener('hashchange', sync);
        window.addEventListener('popstate', sync);
        return () => {
            window.removeEventListener('hashchange', sync);
            window.removeEventListener('popstate', sync);
        };
    }, [open, lenis]);

    // remember visited chapters
    useEffect(() => {
        try {
            localStorage.setItem('cl-visited', JSON.stringify(visited));
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
            <div className="fixed inset-x-0 top-0 z-40 border-b border-[var(--cl-line)] bg-[rgba(7,17,12,0.78)] backdrop-blur-xl">
                <div className="mx-auto flex h-12 max-w-[1320px] items-center justify-between gap-4 px-[var(--cl-gutter)]">
                    <Link href="/corn" className="cl-mono flex shrink-0 items-center gap-2 text-[11px] uppercase text-[var(--cl-dim)] hover:text-[var(--cl-ink)]">
                        <span aria-hidden>←</span> /corn
                    </Link>
                    <div className="cl-mono flex min-w-0 items-center gap-2 truncate text-[11px] uppercase text-[var(--cl-dim)]">
                        <Ring arc={((idx + 1) / CHAPTERS.length) * 100} className="text-[var(--cl-dim)]" />
                        <span className="text-[var(--cl-ink)]">{CHAPTERS[idx].n}</span>
                        <span className="truncate">{CHAPTERS[idx].label}</span>
                    </div>
                    <div className="cl-mono shrink-0 text-[11px] tabular-nums text-[var(--cl-dim)]">
                        {`${visited.length}/${CHAPTERS.length}`}
                        <span className="hidden sm:inline"> read</span>
                    </div>
                </div>
                <span ref={bar} className="absolute bottom-0 left-0 block h-px w-full origin-left scale-x-0 bg-[var(--cl-mint)]" />
            </div>

            <Hero onStart={() => lenis?.scrollTo(anchor.current ?? 0, { offset: 0, duration: 1.6 })} />
            <HowTo />

            {/* tabs */}
            <div ref={anchor} />
            <div className="sticky top-12 z-30 border-y border-[var(--cl-line)] bg-[rgba(7,17,12,0.9)] backdrop-blur-xl">
                <div ref={tabsRef} role="tablist" aria-label="Chapters" className="cl-tabs mx-auto flex max-w-[1320px] gap-0.5 overflow-x-auto px-[var(--cl-gutter)] py-1.5">
                    {CHAPTERS.map((c) => (
                        <button
                            key={c.id}
                            data-tab={c.id}
                            type="button"
                            role="tab"
                            aria-selected={active === c.id}
                            onClick={() => go(c.id)}
                            className={cn(
                                'cl-tab cl-mono flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2.5 text-[11.5px] uppercase',
                                active === c.id && 'is-active',
                                visited.includes(c.id) && 'is-visited',
                            )}
                        >
                            <Ring arc={active === c.id || visited.includes(c.id) ? 100 : 0} core={active === c.id} />
                            <span className="opacity-60">{c.n}</span>
                            <span>{c.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* chapter */}
            <div className="mx-auto grid max-w-[1320px] gap-12 px-[var(--cl-gutter)] pb-24 pt-14 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_200px]">
                <div ref={content} key={active} role="tabpanel" className="min-w-0">
                    <View />
                    <div className="mt-16 border-t border-[var(--cl-line-2)] pt-12">
                        <Flashcards key={active} cards={CARDS[active]} />
                    </div>
                    <nav className="mt-16 grid gap-3 sm:grid-cols-2" aria-label="Chapter navigation">
                        {prev ? (
                            <button
                                type="button"
                                onClick={() => go(prev.id)}
                                className="cl-btn group rounded-xl border border-[var(--cl-line-2)] bg-[var(--cl-panel)] p-5 text-left hover:border-[var(--cl-line-3)]"
                            >
                                <div className="cl-mono mb-2 text-[10.5px] uppercase text-[var(--cl-faint)]">← Previous · {prev.n}</div>
                                <div className="text-[19px] font-semibold">{prev.label}</div>
                                <div className="text-[14px] text-[var(--cl-dim)]">{prev.blurb}</div>
                            </button>
                        ) : (
                            <span />
                        )}
                        {next && (
                            <button
                                type="button"
                                onClick={() => go(next.id)}
                                className="cl-btn group rounded-xl border border-[rgba(85,255,194,0.4)] bg-[rgba(85,255,194,0.08)] p-5 text-right hover:bg-[rgba(85,255,194,0.14)] sm:col-start-2"
                            >
                                <div className="cl-mono mb-2 text-[10.5px] uppercase text-[var(--cl-mint)]">Next · {next.n} →</div>
                                <div className="text-[19px] font-semibold">{next.label}</div>
                                <div className="text-[14px] text-[var(--cl-dim)]">{next.blurb}</div>
                            </button>
                        )}
                    </nav>
                </div>
                <Toc content={content} chapter={active} />
            </div>

            <footer className="border-t border-[var(--cl-line)] bg-[#040a07]">
                <div className="cl-mono mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3 px-[var(--cl-gutter)] py-8 text-[11px] uppercase text-[var(--cl-faint)]">
                    <span className="flex items-center gap-2">
                        <Ring arc={100} />
                        Grainline, decoded — a study of /corn (src/modules/pages/Corn)
                    </span>
                    <span>Source: vanilla three.js · Guide: three.js, GSAP ticker, Lenis</span>
                </div>
            </footer>
        </>
    );
}

export default function CornLearnPage() {
    const lenisRef = useRef<LenisRef | null>(null);

    // One clock: GSAP's ticker drives Lenis and every demo (the page has one loop too: Engine.frame).
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
            <main className="cl-root">
                <Guide />
                <div className="cl-grain" aria-hidden />
            </main>
        </ReactLenis>
    );
}

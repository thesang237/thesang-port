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

const Loading = () => (
    <div className="kl-mono flex h-[60vh] items-center justify-center gap-2 text-[11px] uppercase text-[var(--kl-faint)]">
        <span className="kl-dot animate-pulse text-[var(--kl-lav)]" />
        Loading chapter…
    </div>
);

// Every chapter is its own bundle — you only download (and only run the WebGL of) the chapter you open.
const CHAPTER_VIEWS: Record<ChapterId, ComponentType> = {
    map: dynamic(() => import('./chapters/Map'), { ssr: false, loading: Loading }),
    clock: dynamic(() => import('./chapters/Clock'), { ssr: false, loading: Loading }),
    choreo: dynamic(() => import('./chapters/Choreo'), { ssr: false, loading: Loading }),
    shape: dynamic(() => import('./chapters/Shape'), { ssr: false, loading: Loading }),
    faces: dynamic(() => import('./chapters/Faces'), { ssr: false, loading: Loading }),
    painted: dynamic(() => import('./chapters/Painted'), { ssr: false, loading: Loading }),
    masks: dynamic(() => import('./chapters/Masks'), { ssr: false, loading: Loading }),
    pointer: dynamic(() => import('./chapters/Pointer'), { ssr: false, loading: Loading }),
    ring: dynamic(() => import('./chapters/Ring'), { ssr: false, loading: Loading }),
    flipbooks: dynamic(() => import('./chapters/Flipbooks'), { ssr: false, loading: Loading }),
    words: dynamic(() => import('./chapters/Words'), { ssr: false, loading: Loading }),
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
        const raw = JSON.parse(localStorage.getItem('kl-visited') ?? '[]') as string[];
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
            // the guide opens with the page's own text language: masked lines rise (strong out, 70 ms stagger)
            const q = gsap.utils.selector(root);
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (reduced) return;
            const tl = gsap.timeline({ delay: 0.2, defaults: { ease: 'expo.out' } });
            tl.from(q('.kl-hero-line > span'), { yPercent: 108, rotate: 2.5, duration: 0.95, stagger: 0.07 }, 0)
                .from(q('.kl-hero-eyebrow'), { autoAlpha: 0, duration: 0.4 }, 0)
                .from(q('.kl-hero-rule'), { scaleX: 0, duration: 1.3, ease: 'power4.inOut' }, 0.15)
                .from(q('.kl-hero-fade'), { autoAlpha: 0, y: 18, duration: 0.95, stagger: 0.07 }, 0.4);
        },
        { scope: root },
    );

    return (
        <div ref={root} className="relative overflow-hidden border-b border-[var(--kl-line-2)]">
            <div className="kl-grid-bg absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]" />
            <div className="relative mx-auto grid max-w-[1320px] items-center gap-10 px-[var(--kl-gutter)] pb-16 pt-28 sm:pb-24 sm:pt-36 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <div>
                    <p className="kl-hero-eyebrow kl-mono mb-6 flex items-center gap-2 text-[11px] uppercase text-[var(--kl-lav-deep)]">
                        <span className="kl-dot" />
                        {'Case study · /kpr'}
                    </p>
                    <h1 className="kl-head mb-7 text-[clamp(48px,8.4vw,120px)] uppercase leading-[0.88]">
                        <span className="kl-hero-line block overflow-hidden pb-[0.06em]">
                            <span className="inline-block origin-bottom-left">KPR,</span>
                        </span>
                        <span className="kl-hero-line block overflow-hidden pb-[0.06em]">
                            <span className="inline-block origin-bottom-left">
                                decoded<span className="text-[var(--kl-lav)]">.</span>
                            </span>
                        </span>
                    </h1>
                    <span className="kl-hero-rule mb-7 block h-px w-28 origin-left bg-[var(--kl-ink)]" />
                    <p className="kl-hero-fade mb-8 max-w-[52ch] text-[clamp(17px,1.7vw,21px)] leading-relaxed text-[var(--kl-dim)]">
                        A designer’s field guide to the story page at <span className="text-[var(--kl-ink)]">/kpr</span>: a one-film WebGL scroll story. The film clock, the notched cards, the painted
                        3D scenes, the ring, the wipes and the words are pulled apart, explained in plain words and rebuilt as small demos you can break.
                    </p>
                    <div className="kl-hero-fade flex flex-wrap items-center gap-3">
                        <button type="button" onClick={onStart} className="kl-btn kl-cut kl-mono bg-[var(--kl-black)] px-5 py-3 text-[12px] uppercase text-white hover:bg-[var(--kl-lav-deep)]">
                            Start with the map ↓
                        </button>
                        <a
                            href="/kpr"
                            target="_blank"
                            rel="noreferrer"
                            className="kl-btn kl-mono border border-[var(--kl-line-2)] px-4 py-3 text-[12px] uppercase text-[var(--kl-body)] hover:border-[var(--kl-black)] hover:text-[var(--kl-ink)]"
                        >
                            Open /kpr ↗
                        </a>
                    </div>
                </div>
                <div className="kl-hero-fade relative aspect-[5/4] w-full max-w-[560px] justify-self-center lg:justify-self-end">
                    <HeroVisual />
                </div>
            </div>

            <div className="relative mx-auto grid max-w-[1320px] grid-cols-2 border-t border-[var(--kl-line-2)] px-[var(--kl-gutter)] sm:grid-cols-5">
                {[
                    ['20.2', 'screens of film'],
                    ['1', 'clock for everything'],
                    ['1', 'shader for every card'],
                    ['6', 'painted 3D scenes'],
                    ['31', 'max draw calls a frame'],
                ].map(([n, l]) => (
                    <div key={l} className="kl-hero-fade py-6 pr-4">
                        <div className="kl-display text-[clamp(28px,3.2vw,40px)] leading-none">{n}</div>
                        <div className="kl-mono mt-2 text-[10.5px] uppercase text-[var(--kl-faint)]">{l}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── How to use ─────────────────────────────────────────────────────────────

function HowTo() {
    return (
        <div className="mx-auto grid max-w-[1320px] gap-6 px-[var(--kl-gutter)] py-12 sm:grid-cols-3">
            {[
                ['01', 'Read the idea', 'Each chapter starts in plain words, with a “designer lens” that maps it to tools you know: Figma, After Effects.'],
                ['02', 'Play with the dials', 'Every demo starts at the real page’s values. Break things on purpose: extreme values show what a dial really does.'],
                ['03', 'Lock it in', 'Flip the flashcards at the end of each chapter, then take the final quiz in chapter 12.'],
            ].map(([n, t, d]) => (
                <div key={n} className="flex gap-4">
                    <span className="kl-display pt-0.5 text-[20px] leading-none text-[var(--kl-lav)]">{n}</span>
                    <div>
                        <div className="mb-1 font-semibold tracking-[-0.02em]">{t}</div>
                        <p className="text-[14.5px] leading-relaxed text-[var(--kl-dim)]">{d}</p>
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
            <div className="kl-mono mb-3 flex items-center gap-2 text-[10.5px] uppercase text-[var(--kl-faint)]">
                <span className="kl-dot" />
                On this page
            </div>
            <ul className="space-y-1 border-l border-[var(--kl-line-2)]">
                {items.map((it) => (
                    <li key={it.id}>
                        <a
                            href={`#${it.id}`}
                            onClick={(e) => {
                                e.preventDefault();
                                lenis?.scrollTo(`#${it.id}`, { offset: -110, duration: 1.4 });
                            }}
                            className={cn(
                                '-ml-px block border-l-2 py-1 pl-3 text-[12.5px] leading-snug transition-colors',
                                current === it.id ? 'border-[var(--kl-ink)] text-[var(--kl-ink)]' : 'border-transparent text-[var(--kl-faint)] hover:text-[var(--kl-body)]',
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
            localStorage.setItem('kl-visited', JSON.stringify(visited));
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
            <div className="fixed inset-x-0 top-0 z-40 border-b border-[var(--kl-line-2)] bg-[rgba(243,242,238,0.82)] backdrop-blur-xl">
                <div className="mx-auto flex h-12 max-w-[1320px] items-center justify-between gap-4 px-[var(--kl-gutter)]">
                    <Link href="/kpr" className="kl-mono flex shrink-0 items-center gap-2 text-[11px] uppercase text-[var(--kl-dim)] hover:text-[var(--kl-ink)]">
                        <span aria-hidden>←</span> /kpr
                    </Link>
                    <div className="kl-mono flex min-w-0 items-center gap-2 truncate text-[11px] uppercase text-[var(--kl-dim)]">
                        <span className="kl-dot shrink-0 text-[var(--kl-lav)]" />
                        <span className="text-[var(--kl-ink)]">{CHAPTERS[idx].n}</span>
                        <span className="truncate">{CHAPTERS[idx].label}</span>
                    </div>
                    <div className="kl-mono shrink-0 text-[11px] tabular-nums text-[var(--kl-dim)]">
                        {`${visited.length}/${CHAPTERS.length}`}
                        <span className="hidden sm:inline"> read</span>
                    </div>
                </div>
                <span ref={bar} className="absolute bottom-0 left-0 block h-[2px] w-full origin-left scale-x-0 bg-[var(--kl-lav)]" />
            </div>

            <Hero onStart={() => lenis?.scrollTo(anchor.current ?? 0, { offset: 0, duration: 1.6 })} />
            <HowTo />

            {/* tabs */}
            <div ref={anchor} />
            <div className="sticky top-12 z-30 border-y border-[var(--kl-line-2)] bg-[rgba(243,242,238,0.92)] backdrop-blur-xl">
                <div ref={tabsRef} role="tablist" aria-label="Chapters" className="kl-tabs mx-auto flex max-w-[1320px] gap-1 overflow-x-auto px-[var(--kl-gutter)] py-2">
                    {CHAPTERS.map((c) => (
                        <button
                            key={c.id}
                            data-tab={c.id}
                            type="button"
                            role="tab"
                            aria-selected={active === c.id}
                            onClick={() => go(c.id)}
                            className={cn(
                                'kl-tab kl-mono flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2 text-[11.5px] uppercase',
                                active === c.id && 'is-active',
                                visited.includes(c.id) && 'is-visited',
                            )}
                        >
                            <span className="opacity-60">{c.n}</span>
                            <span>{c.label}</span>
                            <span className="kl-tab-dot" aria-hidden />
                        </button>
                    ))}
                </div>
            </div>

            {/* chapter */}
            <div className="mx-auto grid max-w-[1320px] gap-12 px-[var(--kl-gutter)] pb-24 pt-14 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_200px]">
                <div ref={content} key={active} role="tabpanel" className="min-w-0">
                    <View />
                    <div className="mt-16 border-t border-[var(--kl-line-2)] pt-12">
                        <Flashcards key={active} cards={CARDS[active]} />
                    </div>
                    <nav className="mt-16 grid gap-3 sm:grid-cols-2" aria-label="Chapter navigation">
                        {prev ? (
                            <button
                                type="button"
                                onClick={() => go(prev.id)}
                                className="kl-btn group border border-[var(--kl-line-2)] bg-[var(--kl-panel)] p-5 text-left hover:border-[var(--kl-black)]"
                            >
                                <div className="kl-mono mb-2 text-[10.5px] uppercase text-[var(--kl-faint)]">← Previous · {prev.n}</div>
                                <div className="text-[19px] font-semibold tracking-[-0.03em]">{prev.label}</div>
                                <div className="text-[13.5px] text-[var(--kl-dim)]">{prev.blurb}</div>
                            </button>
                        ) : (
                            <span />
                        )}
                        {next && (
                            <button
                                type="button"
                                onClick={() => go(next.id)}
                                className="kl-btn kl-cut group bg-[var(--kl-black)] p-5 text-right text-white hover:bg-[var(--kl-lav-deep)] sm:col-start-2"
                                style={{ ['--c' as string]: '16px' }}
                            >
                                <div className="kl-mono mb-2 text-[10.5px] uppercase text-[var(--kl-lime)]">Next · {next.n} →</div>
                                <div className="text-[19px] font-semibold tracking-[-0.03em]">{next.label}</div>
                                <div className="text-[13.5px] text-white/65">{next.blurb}</div>
                            </button>
                        )}
                    </nav>
                </div>
                <Toc content={content} chapter={active} />
            </div>

            <footer className="bg-[var(--kl-black)] text-white">
                <div className="kl-mono mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3 px-[var(--kl-gutter)] py-8 text-[11px] uppercase text-white/55">
                    <span className="flex items-center gap-2">
                        <span className="kl-dot text-[var(--kl-lime)]" />
                        KPR, decoded — a study of /kpr (src/modules/pages/Kpr)
                    </span>
                    <span>Same stack: Lenis · GSAP · three.js</span>
                </div>
            </footer>
        </>
    );
}

export default function KprLearnPage() {
    const lenisRef = useRef<LenisRef | null>(null);

    // One clock: GSAP's ticker drives Lenis (exactly like the source's Clock in KprPage.tsx).
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
            <main className="kl-root">
                <Guide />
                <div className="kl-grain" aria-hidden />
            </main>
        </ReactLenis>
    );
}

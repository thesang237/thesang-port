'use client';

import { type ComponentType, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { JetBrains_Mono } from 'next/font/google';
import { type LenisRef, ReactLenis, useLenis } from 'lenis/react';

import { Link } from '@/i18n/navigation';
import { cn } from '@/utils/cn';

import { CARDS } from './content/cards';
import { type ChapterId, CHAPTERS } from './content/chapters';
import { Flashcards } from './kit/Flashcards';
import { gsap, ScrollTrigger, SplitText, useGSAP } from './kit/gsap';

const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-il-mono', display: 'swap' });

const Loading = () => (
    <div className="il-mono flex h-[60vh] items-center justify-center text-[11px] uppercase tracking-[0.2em] text-[var(--il-faint)]">
        <span className="animate-pulse">Loading chapter…</span>
    </div>
);

// Every chapter is its own bundle — you only download the demos you open.
const CHAPTER_VIEWS: Record<ChapterId, ComponentType> = {
    map: dynamic(() => import('./chapters/Map'), { ssr: false, loading: Loading }),
    smooth: dynamic(() => import('./chapters/SmoothScroll'), { ssr: false, loading: Loading }),
    mapping: dynamic(() => import('./chapters/Mapping'), { ssr: false, loading: Loading }),
    timeline: dynamic(() => import('./chapters/Timeline'), { ssr: false, loading: Loading }),
    text: dynamic(() => import('./chapters/TextMotion'), { ssr: false, loading: Loading }),
    three: dynamic(() => import('./chapters/ThreeStage'), { ssr: false, loading: Loading }),
    objects: dynamic(() => import('./chapters/Objects'), { ssr: false, loading: Loading }),
    shaders: dynamic(() => import('./chapters/Shaders'), { ssr: false, loading: Loading }),
    worlds: dynamic(() => import('./chapters/Worlds'), { ssr: false, loading: Loading }),
    particles: dynamic(() => import('./chapters/Particles'), { ssr: false, loading: Loading }),
    interaction: dynamic(() => import('./chapters/Interaction'), { ssr: false, loading: Loading }),
    performance: dynamic(() => import('./chapters/Performance'), { ssr: false, loading: Loading }),
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
        const raw = JSON.parse(localStorage.getItem('il-visited') ?? '[]') as string[];
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
            // autoSplit re-splits when fonts finish loading (and on resize) — onSplit returns the reveal
            const split = SplitText.create('.il-hero-title', {
                type: 'lines',
                mask: 'lines',
                autoSplit: true,
                // eslint-disable-next-line @typescript-eslint/no-misused-promises -- SplitText wants the tween back so it can revert it on re-split
                onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.15 }),
            });
            const tl = gsap.timeline({ delay: 0.15 });
            tl.fromTo('.il-hero-eyebrow', { opacity: 0 }, { opacity: 1, duration: 1, ease: 'none', scrambleText: { text: '////// CASE STUDY — /igloo', chars: '!<>-_\\/[]{}=+*^?#01', speed: 0.7 } }, 0)
                .fromTo('.il-hero-rule', { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'expo.inOut' }, 0.2)
                .from('.il-hero-fade', { autoAlpha: 0, y: 14, duration: 0.9, ease: 'expo.out', stagger: 0.07 }, 0.45);
            return () => split.revert();
        },
        { scope: root },
    );

    return (
        <div ref={root} className="relative overflow-hidden border-b border-[var(--il-line)]">
            <div className="il-dots pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]" />
            <div className="relative mx-auto grid max-w-[1320px] items-center gap-10 px-[var(--il-gutter)] pb-16 pt-28 sm:pb-24 sm:pt-36 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <div>
                    <p className="il-hero-eyebrow il-mono mb-6 text-[11px] tracking-[0.18em] text-[var(--il-ice)] opacity-0">{'////// CASE STUDY — /igloo'}</p>
                    <h1 className="il-hero-title mb-7 text-[clamp(44px,8vw,112px)] font-semibold leading-[0.95] tracking-[-0.045em]">
                        Igloo,
                        <br />
                        decoded.
                    </h1>
                    <span className="il-hero-rule mb-7 block h-px w-24 origin-left bg-[var(--il-ice)]" />
                    <p className="il-hero-fade mb-8 max-w-[52ch] text-[clamp(17px,1.7vw,21px)] leading-relaxed text-[var(--il-dim)]">
                        A designer’s field guide to the scroll-driven WebGL page at <span className="text-[var(--il-ink)]">/igloo</span>. Every technique is pulled apart, explained in plain words, and
                        rebuilt as a small demo you can tweak. By the end you can plan and build a page like it.
                    </p>
                    <div className="il-hero-fade flex flex-wrap items-center gap-3">
                        <button type="button" onClick={onStart} className="il-btn il-bracket il-mono px-5 py-3 text-[12px] uppercase tracking-[0.14em] text-[var(--il-ink)] hover:bg-white/5">
                            Start with the map ↓
                        </button>
                        <a
                            href="/igloo"
                            target="_blank"
                            rel="noreferrer"
                            className="il-btn il-mono rounded-lg px-4 py-3 text-[12px] uppercase tracking-[0.14em] text-[var(--il-dim)] hover:text-[var(--il-ink)]"
                        >
                            Open /igloo ↗
                        </a>
                    </div>
                </div>
                <div className="il-hero-fade relative aspect-square w-full max-w-[560px] justify-self-center lg:justify-self-end">
                    <HeroVisual />
                </div>
            </div>

            <div className="relative mx-auto grid max-w-[1320px] grid-cols-2 gap-px border-t border-[var(--il-line)] px-[var(--il-gutter)] sm:grid-cols-5">
                {[
                    ['16', 'screens of scroll'],
                    ['1', 'clock for everything'],
                    ['4', '3D worlds'],
                    ['65,536', 'simulated particles'],
                    ['0', 'image, model or audio files'],
                ].map(([n, l]) => (
                    <div key={l} className="il-hero-fade py-6 pr-4">
                        <div className="text-[clamp(26px,3vw,36px)] font-semibold tracking-[-0.03em]">{n}</div>
                        <div className="il-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--il-faint)]">{l}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── How to use ─────────────────────────────────────────────────────────────

function HowTo() {
    return (
        <div className="mx-auto grid max-w-[1320px] gap-6 px-[var(--il-gutter)] py-12 sm:grid-cols-3">
            {[
                ['01', 'Read the idea', 'Each chapter starts in plain words, with a “designer lens” that maps it to tools you know — Figma, After Effects.'],
                ['02', 'Play with the dials', 'Every demo has sliders. Break things on purpose: extreme values teach you what a dial really does.'],
                ['03', 'Lock it in', 'Flip the flashcards at the end of each chapter, then take the final quiz in chapter 12.'],
            ].map(([n, t, d]) => (
                <div key={n} className="flex gap-4">
                    <span className="il-mono pt-1 text-[11px] text-[var(--il-ice)]">{n}</span>
                    <div>
                        <div className="mb-1 font-semibold">{t}</div>
                        <p className="text-[14px] leading-relaxed text-[var(--il-dim)]">{d}</p>
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
            <div className="il-mono mb-3 text-[10px] uppercase tracking-[0.18em] text-[var(--il-faint)]">On this page</div>
            <ul className="space-y-1 border-l border-[var(--il-line)]">
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
                                current === it.id ? 'border-[var(--il-ice)] text-[var(--il-ink)]' : 'border-transparent text-[var(--il-faint)] hover:text-[var(--il-dim)]',
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
            localStorage.setItem('il-visited', JSON.stringify(visited));
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
            <div className="fixed inset-x-0 top-0 z-40 border-b border-[var(--il-line)] bg-[rgba(10,13,19,0.72)] backdrop-blur-xl">
                <div className="mx-auto flex h-12 max-w-[1320px] items-center justify-between gap-4 px-[var(--il-gutter)]">
                    <Link href="/igloo" className="il-mono flex shrink-0 items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[var(--il-dim)] hover:text-[var(--il-ink)]">
                        <span aria-hidden>←</span> /igloo
                    </Link>
                    <div className="il-mono min-w-0 truncate text-[11px] tracking-[0.12em] text-[var(--il-faint)]">
                        <span className="text-[var(--il-ice)]">{CHAPTERS[idx].n}</span> {CHAPTERS[idx].label}
                    </div>
                    <div className="il-mono shrink-0 text-[11px] tabular-nums text-[var(--il-faint)]">
                        {`${visited.length}/${CHAPTERS.length}`}
                        <span className="hidden sm:inline"> read</span>
                    </div>
                </div>
                <span ref={bar} className="absolute bottom-0 left-0 block h-px w-full origin-left scale-x-0 bg-[var(--il-ice)]" />
            </div>

            <Hero onStart={() => lenis?.scrollTo(anchor.current ?? 0, { offset: 0, duration: 1.6 })} />
            <HowTo />

            {/* tabs */}
            <div ref={anchor} />
            <div className="sticky top-12 z-30 border-y border-[var(--il-line)] bg-[rgba(10,13,19,0.86)] backdrop-blur-xl">
                <div ref={tabsRef} role="tablist" aria-label="Chapters" className="il-tabs mx-auto flex max-w-[1320px] gap-1 overflow-x-auto px-[var(--il-gutter)] py-2">
                    {CHAPTERS.map((c) => (
                        <button
                            key={c.id}
                            data-tab={c.id}
                            type="button"
                            role="tab"
                            aria-selected={active === c.id}
                            onClick={() => go(c.id)}
                            className={cn(
                                'il-tab il-mono flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2 text-[11.5px]',
                                active === c.id && 'is-active il-bracket',
                                visited.includes(c.id) && 'is-visited',
                            )}
                        >
                            <span className={active === c.id ? 'text-[var(--il-ice)]' : ''}>{c.n}</span>
                            <span>{c.label}</span>
                            <span className="il-tab-dot" aria-hidden />
                        </button>
                    ))}
                </div>
            </div>

            {/* chapter */}
            <div className="mx-auto grid max-w-[1320px] gap-12 px-[var(--il-gutter)] pb-24 pt-14 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_200px]">
                <div ref={content} key={active} role="tabpanel" className="min-w-0">
                    <View />
                    <div className="mt-16 border-t border-[var(--il-line)] pt-12">
                        <Flashcards key={active} cards={CARDS[active]} />
                    </div>
                    <nav className="mt-16 grid gap-3 sm:grid-cols-2" aria-label="Chapter navigation">
                        {prev ? (
                            <button
                                type="button"
                                onClick={() => go(prev.id)}
                                className="il-btn group rounded-2xl border border-[var(--il-line)] p-5 text-left hover:border-[var(--il-line-2)] hover:bg-white/[0.02]"
                            >
                                <div className="il-mono mb-2 text-[10px] uppercase tracking-[0.16em] text-[var(--il-faint)]">← Previous · {prev.n}</div>
                                <div className="text-[18px] font-semibold tracking-[-0.01em]">{prev.label}</div>
                                <div className="text-[13px] text-[var(--il-dim)]">{prev.blurb}</div>
                            </button>
                        ) : (
                            <span />
                        )}
                        {next && (
                            <button
                                type="button"
                                onClick={() => go(next.id)}
                                className="il-btn group rounded-2xl border border-[rgba(148,219,255,0.25)] bg-[rgba(148,219,255,0.04)] p-5 text-right hover:border-[rgba(148,219,255,0.5)] sm:col-start-2"
                            >
                                <div className="il-mono mb-2 text-[10px] uppercase tracking-[0.16em] text-[var(--il-ice)]">Next · {next.n} →</div>
                                <div className="text-[18px] font-semibold tracking-[-0.01em]">{next.label}</div>
                                <div className="text-[13px] text-[var(--il-dim)]">{next.blurb}</div>
                            </button>
                        )}
                    </nav>
                </div>
                <Toc content={content} chapter={active} />
            </div>

            <footer className="border-t border-[var(--il-line)]">
                <div className="il-mono mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3 px-[var(--il-gutter)] py-8 text-[11px] text-[var(--il-faint)]">
                    <span>Igloo, decoded — a study of /igloo (src/modules/pages/Igloo)</span>
                    <span>Built with the same stack: Lenis · GSAP · three.js</span>
                </div>
            </footer>
        </>
    );
}

export default function IglooLearnPage() {
    const lenisRef = useRef<LenisRef | null>(null);

    // One clock: GSAP's ticker drives Lenis (exactly like the Igloo page).
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
        <ReactLenis root ref={lenisRef} options={{ autoRaf: false, lerp: 0.1, wheelMultiplier: 0.9 }}>
            <main className={`il-root ${mono.variable}`}>
                <Guide />
                <div className="il-grain" aria-hidden />
            </main>
        </ReactLenis>
    );
}

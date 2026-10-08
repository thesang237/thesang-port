'use client';
import { type ComponentType, useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Lenis from 'lenis';

import { chapterFromHash, type ChapterId, CHAPTERS, isChapter } from './content/chapters';
import { Flashcards } from './kit/Flashcards';
import { useReducedMotion } from './kit/loop';
import { gsap } from './kit/motion';
import { Artwork } from './kit/ui';

const loading = () => (
    <div className="fl-loading" role="status">
        Opening study…
    </div>
);
const VIEWS: Record<ChapterId, ComponentType> = {
    map: dynamic(() => import('./chapters/Map'), { ssr: false, loading }),
    motion: dynamic(() => import('./chapters/Motion'), { ssr: false, loading }),
    gestures: dynamic(() => import('./chapters/Gestures'), { ssr: false, loading }),
    loops: dynamic(() => import('./chapters/Loops'), { ssr: false, loading }),
    webgl: dynamic(() => import('./chapters/Webgl'), { ssr: false, loading }),
    hover: dynamic(() => import('./chapters/Hover'), { ssr: false, loading }),
    reveal: dynamic(() => import('./chapters/Reveal'), { ssr: false, loading }),
    collections: dynamic(() => import('./chapters/Collections'), { ssr: false, loading }),
    product: dynamic(() => import('./chapters/Product'), { ssr: false, loading }),
    about: dynamic(() => import('./chapters/About'), { ssr: false, loading }),
    routes: dynamic(() => import('./chapters/Routes'), { ssr: false, loading }),
    performance: dynamic(() => import('./chapters/Performance'), { ssr: false, loading }),
    build: dynamic(() => import('./chapters/Build'), { ssr: false, loading }),
};
function readVisited(): ChapterId[] {
    try {
        return (JSON.parse(localStorage.getItem('floema-learn-visited') ?? '[]') as string[]).filter(isChapter);
    } catch {
        return [];
    }
}
function Toc({ host, chapter }: { host: React.RefObject<HTMLDivElement | null>; chapter: ChapterId }) {
    const [items, setItems] = useState<{ id: string; label: string }[]>([]);
    const [current, setCurrent] = useState('');
    useEffect(() => {
        const element = host.current;
        if (!element) return;
        let observer: IntersectionObserver | undefined;
        const scan = () => {
            const headings = [...element.querySelectorAll<HTMLElement>('[data-toc]')];
            setItems(headings.map((heading) => ({ id: heading.id, label: heading.textContent ?? '' })));
            observer?.disconnect();
            observer = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) if (entry.isIntersecting) setCurrent(entry.target.id);
                },
                { rootMargin: '-20% 0px -65% 0px' },
            );
            headings.forEach((heading) => observer!.observe(heading));
        };
        const mutation = new MutationObserver((records) => {
            // Live demo readouts change text every frame; only rescan heading structure.
            const changed = records.some((record) =>
                [...record.addedNodes, ...record.removedNodes].some((node) => node instanceof Element && (node.matches('[data-toc]') || node.querySelector('[data-toc]'))),
            );
            if (changed) scan();
        });
        mutation.observe(element, { childList: true, subtree: true });
        const timer = window.setTimeout(scan, 0);
        return () => {
            clearTimeout(timer);
            mutation.disconnect();
            observer?.disconnect();
        };
    }, [host, chapter]);
    return (
        <aside className="fl-toc">
            <span className="fl-label">IN THIS CHAPTER</span>
            <nav aria-label="Chapter contents">
                {items.map((item) => (
                    <button key={item.id} className={current === item.id ? 'is-active' : ''} onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'instant', block: 'start' })}>
                        {item.label}
                    </button>
                ))}
            </nav>
            <p>Hover or tap a dotted term for a plain-language definition.</p>
            <a href="/floema" target="_blank" rel="noreferrer">
                Open the experience ↗
            </a>
        </aside>
    );
}
export default function Guide() {
    const [active, setActive] = useState(chapterFromHash);
    const [visited, setVisited] = useState(() => [...new Set([...readVisited(), chapterFromHash()])]);
    const tabs = useRef<HTMLDivElement>(null);
    const content = useRef<HTMLDivElement>(null);
    const progress = useRef<HTMLSpanElement>(null);
    const reduced = useReducedMotion();
    const lenisRef = useRef<Lenis | null>(null);
    const index = CHAPTERS.findIndex((chapter) => chapter.id === active);
    const chapter = CHAPTERS[index];
    const View = VIEWS[active];
    const scrollToChapters = useCallback(() => {
        const element = tabs.current;
        if (!element) return;
        const y = element.getBoundingClientRect().top + scrollY - 56;
        if (lenisRef.current) lenisRef.current.scrollTo(y, { immediate: true });
        else window.scrollTo({ top: y, behavior: 'instant' });
    }, []);
    const select = useCallback(
        (id: ChapterId, push = true) => {
            if (push) history.pushState(null, '', `#${id}`);
            setActive(id);
            setVisited((old) => (old.includes(id) ? old : [...old, id]));
            scrollToChapters();
        },
        [scrollToChapters],
    );
    useEffect(() => {
        if (isChapter(location.hash.slice(1))) scrollToChapters();
    }, [scrollToChapters]);
    useEffect(() => {
        const changed = () => select(chapterFromHash(), false);
        window.addEventListener('hashchange', changed);
        window.addEventListener('popstate', changed);
        return () => {
            window.removeEventListener('hashchange', changed);
            window.removeEventListener('popstate', changed);
        };
    }, [select]);
    useEffect(() => {
        try {
            localStorage.setItem('floema-learn-visited', JSON.stringify(visited));
        } catch {
            /* Reading remains available when storage is blocked. */
        }
    }, [visited]);
    useEffect(() => {
        const lenis = reduced ? null : new Lenis({ autoRaf: false, lerp: 0.1, anchors: false, smoothWheel: true });
        lenisRef.current = lenis;
        const tick = (time: number) => {
            lenis?.raf(time * 1000);
            if (progress.current) {
                const max = document.documentElement.scrollHeight - innerHeight;
                progress.current.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
            }
        };
        gsap.ticker.add(tick);
        return () => {
            gsap.ticker.remove(tick);
            lenis?.destroy();
            lenisRef.current = null;
        };
    }, [reduced]);
    useEffect(() => {
        const tab = tabs.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
        if (tab && tabs.current) {
            const strip = tab.parentElement!;
            strip.scrollLeft = tab.offsetLeft - strip.offsetLeft - 16;
        }
    }, [active]);
    return (
        <main className="fl-guide">
            <header className="fl-topbar">
                <a href="/floema" target="_blank" rel="noreferrer">
                    ↗ Floema
                </a>
                <span>DESIGN → CREATIVE DEV</span>
                <span>{visited.length} / 13 explored</span>
                <span ref={progress} className="fl-reading-progress" />
            </header>
            <section className="fl-hero">
                <div className="fl-container fl-hero-layout">
                    <div>
                        <span className="fl-label">A DESIGNER’S FIELD GUIDE</span>
                        <h1>
                            Floema,
                            <br />
                            <em>explained.</em>
                        </h1>
                        <p>From “how does that move?” to “I can build it.” Pull apart every interaction, learn the terms, and make the core ideas your own.</p>
                        <div className="fl-action-row">
                            <button className="fl-button fl-primary" onClick={scrollToChapters}>
                                Start with {chapter.label.toLowerCase()} ↓
                            </button>
                            <a href="/floema" target="_blank" rel="noreferrer">
                                See the original ↗
                            </a>
                        </div>
                    </div>
                    <div className="fl-hero-art" aria-hidden="true">
                        <div className="fl-orbit" />
                        <div className="fl-hero-photo">
                            <Artwork index={0} />
                        </div>
                        <div className="fl-hero-photo">
                            <Artwork index={1} />
                        </div>
                        <span className="fl-art-caption">INPUT → NUMBERS → PIXELS</span>
                        <span className="fl-art-coordinate">0.00 — 1.00</span>
                    </div>
                </div>
                <div className="fl-container fl-hero-meta">
                    <span>
                        <strong>13</strong> focused chapters
                    </span>
                    <span>
                        <strong>1</strong> idea at a time
                    </span>
                    <span>
                        <strong>39</strong> recall cards
                    </span>
                    <span>
                        <strong>∞</strong> possible remixes
                    </span>
                </div>
            </section>
            <div className="fl-container fl-howto">
                {[
                    ['01', 'See the idea', 'Plain words and a designer lens first.'],
                    ['02', 'Try the effect', 'Move a dial, compare, and break it on purpose.'],
                    ['03', 'Make it yours', 'Read the key lines, recall the rule, try a remix.'],
                ].map(([n, title, text]) => (
                    <div key={n}>
                        <span className="fl-label">{n}</span>
                        <div>
                            <h2>{title}</h2>
                            <p>{text}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div ref={tabs} className="fl-tabs-anchor">
                <div className="fl-container">
                    <div
                        role="tablist"
                        aria-label="Learning chapters"
                        className="fl-tabs"
                        onKeyDown={(event) => {
                            if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
                                event.preventDefault();
                                const next = event.key === 'Home' ? 0 : event.key === 'End' ? 12 : (index + (event.key === 'ArrowRight' ? 1 : 12)) % 13;
                                select(CHAPTERS[next].id);
                                tabs.current?.querySelector<HTMLButtonElement>(`[data-tab="${CHAPTERS[next].id}"]`)?.focus({ preventScroll: true });
                            }
                        }}
                    >
                        {CHAPTERS.map((item, n) => (
                            <button
                                key={item.id}
                                id={`fl-tab-${item.id}`}
                                data-tab={item.id}
                                role="tab"
                                aria-selected={active === item.id}
                                aria-controls="fl-panel"
                                tabIndex={active === item.id ? 0 : -1}
                                onClick={() => select(item.id)}
                                className={active === item.id ? 'is-active' : ''}
                            >
                                <span>{String(n).padStart(2, '0')}</span>
                                {item.label}
                                {visited.includes(item.id) && <i aria-label="Explored">·</i>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="fl-container fl-reading-layout">
                <div ref={content} id="fl-panel" role="tabpanel" aria-labelledby={`fl-tab-${active}`} tabIndex={0} key={active}>
                    <View />
                    <Flashcards cards={chapter.cards} />
                    <nav className="fl-chapter-nav" aria-label="Previous and next chapters">
                        {index > 0 ? (
                            <button onClick={() => select(CHAPTERS[index - 1].id)}>
                                <span className="fl-label">← PREVIOUS</span>
                                <strong>{CHAPTERS[index - 1].label}</strong>
                            </button>
                        ) : (
                            <span />
                        )}
                        {index < 12 && (
                            <button onClick={() => select(CHAPTERS[index + 1].id)}>
                                <span className="fl-label">NEXT →</span>
                                <strong>{CHAPTERS[index + 1].label}</strong>
                            </button>
                        )}
                    </nav>
                </div>
                <Toc host={content} chapter={active} />
            </div>
            <footer className="fl-footer fl-container">
                <span>Floema, explained. Learn the rule, then change the design.</span>
                <span>This guide uses one GSAP clock, wheel smoothing, and a short chapter reveal.</span>
            </footer>
        </main>
    );
}

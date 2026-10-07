'use client';
import { type ComponentType, type KeyboardEvent, type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { gsap } from 'gsap';
import { type LenisRef, ReactLenis, useLenis } from 'lenis/react';

import { Link } from '@/i18n/navigation';

import { type ChapterId, CHAPTERS, isChapter } from './content/chapters';
import Quiz from './demos/Quiz';
import { Flashcards } from './kit/ui';

const Loading = () => (
    <p className="cl-loading" role="status">
        Opening the study…
    </p>
);
const VIEWS: Record<ChapterId, ComponentType> = {
    map: dynamic(() => import('./chapters/Map'), { ssr: false, loading: Loading }),
    seeds: dynamic(() => import('./chapters/Seeds'), { ssr: false, loading: Loading }),
    terrain: dynamic(() => import('./chapters/Terrain'), { ssr: false, loading: Loading }),
    erosion: dynamic(() => import('./chapters/Erosion'), { ssr: false, loading: Loading }),
    carving: dynamic(() => import('./chapters/Carving'), { ssr: false, loading: Loading }),
    projection: dynamic(() => import('./chapters/Projection'), { ssr: false, loading: Loading }),
    light: dynamic(() => import('./chapters/Light'), { ssr: false, loading: Loading }),
    grain: dynamic(() => import('./chapters/Grain'), { ssr: false, loading: Loading }),
    life: dynamic(() => import('./chapters/Life'), { ssr: false, loading: Loading }),
    build: dynamic(() => import('./chapters/Build'), { ssr: false, loading: Loading }),
};
const HeroArt = dynamic(() => import('./demos/HeroArt'), { ssr: false });
const fromHash = (): ChapterId => {
    const id = window.location.hash.slice(1);
    return isChapter(id) ? id : 'map';
};
function visitedChapters() {
    try {
        const value = JSON.parse(localStorage.getItem('cantera-learn-visited') ?? '[]');
        return Array.isArray(value) ? value.filter((id): id is ChapterId => typeof id === 'string' && isChapter(id)) : [];
    } catch {
        return [];
    }
}

function Toc({ content, active }: { content: RefObject<HTMLDivElement | null>; active: ChapterId }) {
    const [items, setItems] = useState<{ id: string; label: string }[]>([]),
        [current, setCurrent] = useState('');
    const lenis = useLenis();
    useEffect(() => {
        const element = content.current;
        if (!element) return;
        let intersection: IntersectionObserver | undefined;
        const scan = () => {
            const headings = [...element.querySelectorAll<HTMLElement>('[data-toc]')];
            setItems(headings.map((h) => ({ id: h.dataset.toc!, label: h.textContent ?? '' })));
            intersection?.disconnect();
            intersection = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) if (entry.isIntersecting) setCurrent((entry.target as HTMLElement).dataset.toc!);
                },
                { rootMargin: '-20% 0px -60% 0px' },
            );
            headings.forEach((h) => intersection?.observe(h));
        };
        const mutation = new MutationObserver(scan);
        mutation.observe(element, { childList: true, subtree: true });
        scan();
        return () => {
            mutation.disconnect();
            intersection?.disconnect();
        };
    }, [content, active]);
    return (
        <nav className="cl-toc" aria-label="On this chapter">
            <span className="cl-label">In this study</span>
            {items.map((item) => (
                <a
                    key={item.id}
                    href={`#${item.id}`}
                    aria-current={current === item.id ? 'location' : undefined}
                    onClick={(event) => {
                        event.preventDefault();
                        const target = document.getElementById(item.id);
                        if (target)
                            lenis?.scrollTo(target, {
                                offset: -144,
                                immediate: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
                            });
                    }}
                >
                    {item.label}
                </a>
            ))}
            <span className="cl-toc-note">
                Read the idea.
                <br />
                Change one dial.
                <br />
                Name what changed.
            </span>
        </nav>
    );
}
function Guide() {
    const [active, setActive] = useState<ChapterId>(fromHash);
    const [visited, setVisited] = useState<ChapterId[]>(() => [...new Set([...visitedChapters(), fromHash()])]);
    const tabs = useRef<HTMLDivElement>(null),
        anchor = useRef<HTMLDivElement>(null),
        content = useRef<HTMLDivElement>(null),
        bar = useRef<HTMLSpanElement>(null);
    const lenis = useLenis(({ progress }) => {
        if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
    });
    const open = useCallback((id: ChapterId) => {
        setActive(id);
        setVisited((current) => (current.includes(id) ? current : [...current, id]));
    }, []);
    const go = useCallback(
        (id: ChapterId, scroll = true) => {
            if (id !== active) window.history.pushState(null, '', `#${id}`);
            open(id);
            if (scroll && anchor.current) lenis?.scrollTo(anchor.current, { offset: -64, immediate: true });
        },
        [active, open, lenis],
    );
    useEffect(() => {
        const sync = () => {
            const hash = window.location.hash.slice(1);
            if (hash && !isChapter(hash)) return;
            open(fromHash());
            if (anchor.current && window.scrollY > anchor.current.offsetTop) lenis?.scrollTo(anchor.current, { offset: -64, immediate: true });
        };
        window.addEventListener('hashchange', sync);
        window.addEventListener('popstate', sync);
        return () => {
            window.removeEventListener('hashchange', sync);
            window.removeEventListener('popstate', sync);
        };
    }, [open, lenis]);
    useEffect(() => {
        try {
            localStorage.setItem('cantera-learn-visited', JSON.stringify(visited));
        } catch {
            /* Storage is optional; progress remains in this visit. */
        }
    }, [visited]);
    useEffect(() => {
        const row = tabs.current,
            tab = row?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
        if (row && tab) row.scrollTo({ left: tab.offsetLeft - row.clientWidth / 2 + tab.clientWidth / 2, behavior: 'instant' });
    }, [active]);
    const index = CHAPTERS.findIndex((c) => c.id === active),
        chapter = CHAPTERS[index],
        View = VIEWS[active];
    const keyTabs = (event: KeyboardEvent<HTMLButtonElement>) => {
        const directions: Record<string, number> = {
            ArrowRight: (index + 1) % CHAPTERS.length,
            ArrowLeft: (index + CHAPTERS.length - 1) % CHAPTERS.length,
            Home: 0,
            End: CHAPTERS.length - 1,
        };
        if (!(event.key in directions)) return;
        event.preventDefault();
        const id = CHAPTERS[directions[event.key]].id;
        go(id);
        tabs.current?.querySelector<HTMLButtonElement>(`[data-tab="${id}"]`)?.focus();
    };
    return (
        <main className="cl-root">
            <a
                href="#cl-chapters"
                className="cl-skip"
                onClick={(event) => {
                    event.preventDefault();
                    if (anchor.current) lenis?.scrollTo(anchor.current, { offset: -64, immediate: true });
                    tabs.current?.querySelector<HTMLButtonElement>(`[data-tab="${active}"]`)?.focus();
                }}
            >
                Skip to chapters
            </a>
            <header className="cl-topbar">
                <div>
                    <Link href="/art-cantera">← /art-cantera</Link>
                    <span>
                        FIELD NOTES / {String(index).padStart(2, '0')} · {chapter.label}
                    </span>
                    <span>{visited.length}/10 explored</span>
                </div>
                <span ref={bar} className="cl-progress" />
            </header>
            <div className="cl-wrap cl-hero">
                <div>
                    <p className="cl-label">A field guide to generative stone / No. 02</p>
                    <h1>
                        <span>Cantera,</span>
                        <span>uncovered.</span>
                    </h1>
                    <p className="cl-hero-lead">
                        Grow a landscape. Carve a void.
                        <br />
                        Let a thousand small decisions
                        <br className="cl-desktop" /> leave their mark.
                    </p>
                    <p className="cl-hero-copy">
                        A designer’s guide to erosion, architectural cuts, parallel rays and the grain of a digital print. Take the art apart, then use its rules to make something of your own.
                    </p>
                    <div className="cl-actions">
                        <button type="button" className="cl-button cl-primary" onClick={() => go('map')}>
                            Enter the quarry ↓
                        </button>
                        <a href="/art-cantera" target="_blank" rel="noreferrer" className="cl-text-link">
                            Open the artwork ↗
                        </a>
                    </div>
                </div>
                <HeroArt />
            </div>
            <div className="cl-wrap cl-facts">
                {[
                    ['10', 'chapters to explore'],
                    ['2', 'eroded terrain fields'],
                    ['4', 'passes per print sample'],
                    ['0', 'image textures'],
                ].map(([value, label]) => (
                    <div key={label}>
                        <strong>{value}</strong>
                        <span className="cl-label">{label}</span>
                    </div>
                ))}
            </div>
            <div className="cl-wrap cl-how">
                {[
                    ['01', 'Read the shape', 'Plain words, then the equivalent in tools you already know.'],
                    ['02', 'Move the dials', 'Start with the source values. Exaggerate one rule and see what breaks.'],
                    ['03', 'Keep the idea', 'Recall cards after every chapter. A final quiz samples all ten.'],
                ].map(([number, title, description]) => (
                    <div key={number}>
                        <span className="cl-label">{number}</span>
                        <div>
                            <h2>{title}</h2>
                            <p>{description}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div ref={anchor} id="cl-chapters" className="cl-tab-anchor" />
            <div className="cl-tabbar">
                <div className="cl-wrap cl-tabs" ref={tabs} role="tablist" aria-label="Cantera chapters">
                    {CHAPTERS.map((c, i) => (
                        <button
                            id={`cl-tab-${c.id}`}
                            key={c.id}
                            type="button"
                            role="tab"
                            aria-selected={active === c.id}
                            aria-controls="cl-panel"
                            tabIndex={active === c.id ? 0 : -1}
                            data-tab={c.id}
                            data-visited={visited.includes(c.id)}
                            onClick={() => go(c.id)}
                            onKeyDown={keyTabs}
                        >
                            <span>{String(i).padStart(2, '0')}</span>
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="cl-wrap cl-reading">
                <div id="cl-panel" ref={content} role="tabpanel" tabIndex={0} aria-labelledby={`cl-tab-${active}`} key={active}>
                    <View />
                    <Flashcards cards={chapter.cards} />
                    {active === 'build' && <Quiz />}
                    <nav className="cl-next" aria-label="Adjacent chapters">
                        {index > 0 ? (
                            <button type="button" onClick={() => go(CHAPTERS[index - 1].id)}>
                                <span className="cl-label">← Previous study</span>
                                {CHAPTERS[index - 1].label}
                            </button>
                        ) : (
                            <span />
                        )}
                        {index < CHAPTERS.length - 1 ? (
                            <button type="button" onClick={() => go(CHAPTERS[index + 1].id)}>
                                <span className="cl-label">Next study →</span>
                                {CHAPTERS[index + 1].label}
                            </button>
                        ) : (
                            <a href="/art-cantera" target="_blank" rel="noreferrer">
                                <span className="cl-label">Return to the print ↗</span>Look with new eyes.
                            </a>
                        )}
                    </nav>
                </div>
                <Toc content={content} active={active} />
            </div>
            <footer className="cl-wrap cl-footer">
                <span className="cl-label">Cantera / field notes</span>
                <p>
                    This guide uses the same seed, noise, height-field, erosion and camera helpers as the artwork. Its small studies are teaching copies; only the open chapter is mounted. The living
                    study and smooth scroll share one clock.
                </p>
                <Link href="/art-solace/learn">Explore Solace’s field guide ↗</Link>
            </footer>
        </main>
    );
}
export default function ArtCanteraLearnPage() {
    const lenis = useRef<LenisRef>(null);
    const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const change = (event: MediaQueryListEvent) => setReduced(event.matches);
        media.addEventListener('change', change);
        const tick = (time: number) => lenis.current?.lenis?.raf(time * 1000);
        gsap.ticker.add(tick);
        return () => {
            gsap.ticker.remove(tick);
            media.removeEventListener('change', change);
        };
    }, []);
    return (
        <ReactLenis ref={lenis} root options={{ autoRaf: false, smoothWheel: !reduced, syncTouch: false }}>
            <Guide />
        </ReactLenis>
    );
}

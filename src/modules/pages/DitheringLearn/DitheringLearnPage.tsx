'use client';
import type { ComponentType, KeyboardEvent, RefObject } from 'react';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { gsap } from 'gsap';
import type { LenisRef } from 'lenis/react';
import { ReactLenis, useLenis } from 'lenis/react';

import { Link } from '@/i18n/navigation';

import { CARDS } from './content/cards';
import type { ChapterId } from './content/chapters';
import { CHAPTERS, isChapter } from './content/chapters';
import { Flashcards } from './kit/Flashcards';

const Loading = () => (
    <p className="dl-loading" role="status">
        Opening the printing press…
    </p>
);
const VIEWS: Record<ChapterId, ComponentType> = {
    map: dynamic(() => import('./chapters/Map'), { loading: Loading }),
    tone: dynamic(() => import('./chapters/Tone'), { loading: Loading }),
    ordered: dynamic(() => import('./chapters/Ordered'), { loading: Loading }),
    stipple: dynamic(() => import('./chapters/Stipple'), { loading: Loading }),
    halftone: dynamic(() => import('./chapters/Halftone'), { loading: Loading }),
    direction: dynamic(() => import('./chapters/Direction'), { loading: Loading }),
    palette: dynamic(() => import('./chapters/Palette'), { loading: Loading }),
    surface: dynamic(() => import('./chapters/Surface'), { loading: Loading }),
    runtime: dynamic(() => import('./chapters/Runtime'), { loading: Loading }),
    build: dynamic(() => import('./chapters/Build'), { loading: Loading }),
};
const HeroPrint = dynamic(() => import('./demos/HeroPrint'), { ssr: false });
const fromHash = (): ChapterId => {
    const id = window.location.hash.slice(1);
    return isChapter(id) ? id : 'map';
};
const readVisited = (): ChapterId[] => {
    try {
        const value: unknown = JSON.parse(localStorage.getItem('dither-guide-visited-v1') ?? '[]');
        return Array.isArray(value) ? value.filter((id): id is ChapterId => typeof id === 'string' && isChapter(id)) : [];
    } catch {
        return [];
    }
};
const subscribeMotion = (notify: () => void) => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    media.addEventListener('change', notify);
    return () => media.removeEventListener('change', notify);
};

function Toc({ content, active }: { content: RefObject<HTMLDivElement | null>; active: ChapterId }) {
    const [items, setItems] = useState<{ id: string; text: string }[]>([]);
    const [current, setCurrent] = useState('');
    const lenis = useLenis();
    useEffect(() => {
        const element = content.current;
        if (!element) return;
        let intersection: IntersectionObserver | null = null;
        let signature = '';
        const scan = () => {
            const headings = Array.from(element.querySelectorAll<HTMLElement>('[data-toc]'));
            const nextSignature = headings.map((h) => h.id).join('|');
            if (signature === nextSignature) return;
            signature = nextSignature;
            setItems(headings.map((h) => ({ id: h.id, text: h.dataset.toc ?? '' })));
            intersection?.disconnect();
            intersection = new IntersectionObserver(
                (entries) => {
                    entries.forEach((e) => {
                        if (e.isIntersecting) setCurrent(e.target.id);
                    });
                },
                { rootMargin: '-20% 0px -60% 0px' },
            );
            headings.forEach((h) => intersection?.observe(h));
        };
        const mutations = new MutationObserver(scan);
        mutations.observe(element, { childList: true, subtree: true });
        scan();
        return () => {
            mutations.disconnect();
            intersection?.disconnect();
        };
    }, [content, active]);
    return (
        <nav className="dl-toc" aria-label="On this chapter">
            <span className="dl-kicker">In this chapter</span>
            {items.map((item) => (
                <a
                    href={`#${item.id}`}
                    key={item.id}
                    aria-current={current === item.id ? 'location' : undefined}
                    onClick={(e) => {
                        e.preventDefault();
                        lenis?.scrollTo(`#${item.id}`, { offset: -144 });
                    }}
                >
                    {item.text}
                </a>
            ))}
            <p>
                Read the idea.
                <br />
                Break the demo.
                <br />
                Explain it back.
            </p>
        </nav>
    );
}
function Guide() {
    const [active, setActive] = useState<ChapterId>(fromHash);
    const [visited, setVisited] = useState<ChapterId[]>(() => [...new Set([...readVisited(), fromHash()])]);
    const anchor = useRef<HTMLDivElement>(null);
    const content = useRef<HTMLDivElement>(null);
    const tabs = useRef<HTMLDivElement>(null);
    const progress = useRef<HTMLSpanElement>(null);
    const lenis = useLenis(({ progress: amount }) => {
        if (progress.current) progress.current.style.transform = `scaleX(${amount})`;
    });
    const reduced = useSyncExternalStore(
        subscribeMotion,
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        () => true,
    );
    const open = useCallback((id: ChapterId) => {
        setActive(id);
        setVisited((v) => (v.includes(id) ? v : [...v, id]));
    }, []);
    const go = useCallback(
        (id: ChapterId) => {
            if (id !== active) window.history.pushState(null, '', `#${id}`);
            open(id);
            const element = anchor.current;
            if (element && element.getBoundingClientRect().top < 100) lenis?.scrollTo(element, { offset: -48, immediate: true });
        },
        [active, open, lenis],
    );
    useEffect(() => {
        const sync = () => {
            open(fromHash());
            const element = anchor.current;
            if (element && element.getBoundingClientRect().top < 100) lenis?.scrollTo(element, { offset: -48, immediate: true });
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
            localStorage.setItem('dither-guide-visited-v1', JSON.stringify(visited));
        } catch {
            /* Read progress remains local to this visit. */
        }
    }, [visited]);
    useEffect(() => {
        const row = tabs.current;
        const tab = row?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
        if (row && tab) row.scrollTo({ left: tab.offsetLeft - row.offsetLeft - row.clientWidth / 2 + tab.clientWidth / 2, behavior: reduced ? 'instant' : 'smooth' });
    }, [active, reduced]);
    const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % CHAPTERS.length;
        else if (event.key === 'ArrowLeft') next = (index + CHAPTERS.length - 1) % CHAPTERS.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = CHAPTERS.length - 1;
        else return;
        event.preventDefault();
        const id = CHAPTERS[next].id;
        go(id);
        tabs.current?.querySelector<HTMLElement>(`[data-tab="${id}"]`)?.focus();
    };
    const index = CHAPTERS.findIndex((c) => c.id === active);
    const View = VIEWS[active];
    return (
        <main className="dl-root print-ui">
            <header className="dl-topbar">
                <Link href="/dithering">← Back to the studio</Link>
                <span className="dl-kicker">Dithering / field notes</span>
                <span className="dl-kicker">{visited.length} / 10 explored</span>
                <span ref={progress} className="dl-progress" />
            </header>
            <div className="dl-hero dl-container">
                <div>
                    <p className="dl-kicker">An artist&apos;s field guide / WebGL printmaking</p>
                    <h1>
                        Small marks.
                        <br />
                        <em>Infinite images.</em>
                    </h1>
                    <p>
                        Take a smooth image apart. Rebuild it with dots, dust, lines and threads. Ten short chapters turn a shader into a printing language you can understand, break and make your own.
                    </p>
                    <div className="dl-actions">
                        <button type="button" onClick={() => lenis?.scrollTo(anchor.current ?? 0, { offset: -48, immediate: reduced })}>
                            Open the field notes ↓
                        </button>
                        <Link href="/dithering">Make a print ↗</Link>
                    </div>
                    <div className="dl-hero-index">
                        <span>09 print screens</span>
                        <span>10 live experiments</span>
                        <span>30 recall cards</span>
                    </div>
                </div>
                <HeroPrint />
            </div>
            <div className="dl-how dl-container">
                {[
                    ['01', 'Look closely', 'Plain words first. A designer lens connects the code to a print studio, Figma or After Effects.'],
                    ['02', 'Break the image', 'Move a dial to its extreme. Every lab uses the real print shader with a smaller, original teaching subject.'],
                    ['03', 'Make it yours', 'Recall the idea, take the final quiz, then leave with a complete recipe you can copy.'],
                ].map(([n, title, text]) => (
                    <div key={n}>
                        <span className="dl-kicker">{n}</span>
                        <h2>{title}</h2>
                        <p>{text}</p>
                    </div>
                ))}
            </div>
            <div ref={anchor} className="dl-tabs-anchor" />
            <div className="dl-tabs-bar">
                <div ref={tabs} role="tablist" aria-label="Field guide chapters" className="dl-tabs dl-container">
                    {CHAPTERS.map((chapter, i) => (
                        <button
                            key={chapter.id}
                            id={`tab-${chapter.id}`}
                            type="button"
                            role="tab"
                            data-tab={chapter.id}
                            tabIndex={active === chapter.id ? 0 : -1}
                            aria-selected={active === chapter.id}
                            aria-controls={`panel-${chapter.id}`}
                            onClick={() => go(chapter.id)}
                            onKeyDown={(e) => onTabKey(e, i)}
                        >
                            <span>{String(i).padStart(2, '0')}</span>
                            {chapter.label}
                            {visited.includes(chapter.id) && (
                                <span className="dl-read" aria-label="Visited">
                                    ·
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
            <div className="dl-reading dl-container">
                <div ref={content} key={active} role="tabpanel" tabIndex={0} id={`panel-${active}`} aria-labelledby={`tab-${active}`}>
                    <View />
                    <Flashcards cards={CARDS[active]} />
                    <nav className="dl-chapter-nav" aria-label="Chapter navigation">
                        {index > 0 ? (
                            <button type="button" onClick={() => go(CHAPTERS[index - 1].id)}>
                                <span className="dl-kicker">← Previous chapter</span>
                                <strong>{CHAPTERS[index - 1].label}</strong>
                            </button>
                        ) : (
                            <div />
                        )}
                        {index < CHAPTERS.length - 1 && (
                            <button type="button" onClick={() => go(CHAPTERS[index + 1].id)}>
                                <span className="dl-kicker">Next chapter →</span>
                                <strong>{CHAPTERS[index + 1].label}</strong>
                            </button>
                        )}
                    </nav>
                </div>
                <Toc content={content} active={active} />
            </div>
            <footer className="dl-footer dl-container">
                <p>Built from the studio&apos;s real pipeline. The guide shares one clock between smooth scrolling and visible demos; still labs render only when edited.</p>
                <p>
                    Original shader study:{' '}
                    <a href="https://github.com/niccolofanton/dithering-shader" target="_blank" rel="noreferrer">
                        niccolofanton ↗
                    </a>{' '}
                    ·{' '}
                    <a href="https://pmndrs.github.io/postprocessing/public/docs/" target="_blank" rel="noreferrer">
                        Postprocessing reference ↗
                    </a>
                </p>
            </footer>
        </main>
    );
}
function ScrollDriver({ driver }: { driver: RefObject<LenisRef | null> }) {
    useEffect(() => {
        const tick = (time: number) => {
            driver.current?.lenis?.raf(time * 1000);
        };
        gsap.ticker.add(tick);
        return () => gsap.ticker.remove(tick);
    }, [driver]);
    return null;
}
export default function DitheringLearnPage() {
    const driver = useRef<LenisRef>(null);
    const reduced = useSyncExternalStore(
        subscribeMotion,
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        () => true,
    );
    return (
        <ReactLenis root ref={driver} options={{ autoRaf: false, smoothWheel: !reduced }}>
            <ScrollDriver driver={driver} />
            <Guide />
        </ReactLenis>
    );
}

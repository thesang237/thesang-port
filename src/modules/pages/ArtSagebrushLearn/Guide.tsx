'use client';

import { type ComponentType, useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

import { Link } from '@/i18n/navigation';

import { type ChapterId, CHAPTERS, isChapter } from './content/chapters';

const Loading = () => (
    <p className="sg-loading" role="status">
        Preparing the workbench…
    </p>
);
const VIEWS: Record<ChapterId, ComponentType> = {
    map: dynamic(() => import('./chapters/Map'), { loading: Loading }),
    seeds: dynamic(() => import('./chapters/Seeds'), { loading: Loading }),
    terrain: dynamic(() => import('./chapters/Terrain'), { loading: Loading }),
    erosion: dynamic(() => import('./chapters/Erosion'), { loading: Loading }),
    light: dynamic(() => import('./chapters/Light'), { loading: Loading }),
    pen: dynamic(() => import('./chapters/Pen'), { loading: Loading }),
    plants: dynamic(() => import('./chapters/Plants'), { loading: Loading }),
    depth: dynamic(() => import('./chapters/Depth'), { loading: Loading }),
    studies: dynamic(() => import('./chapters/Studies'), { loading: Loading }),
    build: dynamic(() => import('./chapters/Build'), { loading: Loading }),
};
const readHash = (): ChapterId => {
    const hash = window.location.hash.slice(1);
    return isChapter(hash) ? hash : 'map';
};
const readVisited = (): ChapterId[] => {
    try {
        const saved: unknown = JSON.parse(localStorage.getItem('sagebrush-guide-visited') ?? '[]');
        return Array.isArray(saved) ? saved.filter((item): item is ChapterId => typeof item === 'string' && isChapter(item)) : [];
    } catch {
        return [];
    }
};
const scrollBehavior = (): ScrollBehavior => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth');

export default function Guide() {
    const [active, setActive] = useState<ChapterId>(readHash);
    const [visited, setVisited] = useState<ChapterId[]>(() => Array.from(new Set([...readVisited(), readHash()])));
    const [toc, setToc] = useState<{ id: string; label: string }[]>([]);
    const [section, setSection] = useState('');
    const content = useRef<HTMLDivElement>(null);
    const tabs = useRef<HTMLElement>(null);
    const progress = useRef<HTMLDivElement>(null);
    const select = useCallback((id: ChapterId, updateUrl = true) => {
        if (updateUrl && window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`);
        setActive(id);
        setVisited((previous) => (previous.includes(id) ? previous : [...previous, id]));
    }, []);
    const navigate = (id: ChapterId) => {
        select(id);
        tabs.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    };
    useEffect(() => {
        const sync = () => select(readHash(), false);
        window.addEventListener('hashchange', sync);
        window.addEventListener('popstate', sync);
        return () => {
            window.removeEventListener('hashchange', sync);
            window.removeEventListener('popstate', sync);
        };
    }, [select]);
    useEffect(() => {
        try {
            localStorage.setItem('sagebrush-guide-visited', JSON.stringify(visited));
        } catch {
            /* Reading still works if storage is disabled. */
        }
    }, [visited]);
    useEffect(() => {
        const selectedTab = tabs.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
        const rail = selectedTab?.parentElement;
        if (selectedTab && rail) rail.scrollTo({ left: selectedTab.offsetLeft - rail.offsetLeft - rail.clientWidth / 2 + selectedTab.clientWidth / 2 });
        const element = content.current;
        if (!element) return;
        let intersection: IntersectionObserver | undefined;
        const scan = () => {
            const sections = Array.from(element.querySelectorAll<HTMLElement>('[data-toc]'));
            setToc(sections.map((item) => ({ id: item.id, label: item.dataset.toc ?? '' })));
            intersection?.disconnect();
            intersection = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) if (entry.isIntersecting) setSection(entry.target.id);
                },
                { rootMargin: '-20% 0px -60% 0px' },
            );
            sections.forEach((item) => intersection?.observe(item));
        };
        scan();
        const observer = new MutationObserver(scan);
        observer.observe(element, { childList: true });
        return () => {
            observer.disconnect();
            intersection?.disconnect();
        };
    }, [active]);
    useEffect(() => {
        let max = 0;
        const update = () => {
            if (progress.current) progress.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
        };
        const measure = () => {
            max = document.documentElement.scrollHeight - window.innerHeight;
            update();
        };
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', measure);
        const observer = new ResizeObserver(measure);
        observer.observe(document.body);
        measure();
        return () => {
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', measure);
            observer.disconnect();
        };
    }, []);
    const index = CHAPTERS.findIndex((chapter) => chapter.id === active);
    const View = VIEWS[active];
    return (
        <main className="sg-root">
            <a className="sg-skip" href="#sg-chapters">
                Skip to chapters
            </a>
            <div className="sg-top">
                <Link href="/art-sagebrush">← The artwork</Link>
                <span className="sg-label">Sagebrush / Field notes 02</span>
                <span className="sg-label">{visited.length} / 10 explored</span>
                <div ref={progress} className="sg-progress" />
            </div>
            <header className="sg-hero">
                <div className="sg-hero-copy">
                    <p className="sg-label">A field guide to generative drawing</p>
                    <h1>
                        Sagebrush,
                        <br />
                        <em>in marks.</em>
                    </h1>
                    <p className="sg-hero-lead">
                        A landscape is a thousand small decisions.
                        <br />
                        Learn to make them your own.
                    </p>
                    <p className="sg-prose">
                        Follow the terrain, meet the pen, grow a forest. Ten chapters take apart the real artwork, then turn its most expressive rules into a studio for new ideas.
                    </p>
                    <div className="sg-actions">
                        <button type="button" className="sg-primary" onClick={() => navigate('map')}>
                            Open the field guide <span>↘</span>
                        </button>
                        <a href="/art-sagebrush?seed=42&noise=1337" target="_blank" rel="noreferrer">
                            See the living artwork ↗
                        </a>
                    </div>
                </div>
                <figure className="sg-hero-figure">
                    <div className="sg-art-frame">
                        <Image src="/all/sagebrush-field-guide.png" alt="Sagebrush: clusters of colorful ink marks form a forest on warm paper" fill sizes="(max-width: 800px) 100vw, 50vw" priority />
                        <span className="sg-art-note">Terrain / ink / chance</span>
                        <div className="sg-art-coordinate">
                            x 400
                            <br />y 400
                        </div>
                    </div>
                    <figcaption>
                        <span>Fig. 01 — The original Sagebrush study</span>
                        <span>Canvas 2D / seeded ink</span>
                    </figcaption>
                </figure>
            </header>
            <div className="sg-facts">
                <div>
                    <strong>03</strong>
                    <span>noise layers make the land</span>
                </div>
                <div>
                    <strong>40,000</strong>
                    <span>droplets edit the terrain</span>
                </div>
                <div>
                    <strong>01</strong>
                    <span>pen language ties it together</span>
                </div>
                <div>
                    <strong>∞</strong>
                    <span>directions to take it next</span>
                </div>
            </div>
            <div className="sg-how">
                <span className="sg-label">How to use this guide</span>
                <p>
                    <b>Read the idea.</b> Start in design language, then inspect the code.
                </p>
                <p>
                    <b>Break the demo.</b> Push a dial until the rule becomes visible.
                </p>
                <p>
                    <b>Make it stick.</b> Explain it back, then borrow it for a study.
                </p>
            </div>
            <nav ref={tabs} className="sg-tabs-wrap" id="sg-chapters" aria-label="Guide chapters">
                <div className="sg-tabs" role="tablist" aria-label="Sagebrush chapters">
                    {CHAPTERS.map((chapter, chapterIndex) => (
                        <button
                            key={chapter.id}
                            type="button"
                            role="tab"
                            id={`tab-${chapter.id}`}
                            aria-controls="sg-panel"
                            aria-selected={active === chapter.id}
                            tabIndex={active === chapter.id ? 0 : -1}
                            data-tab={chapter.id}
                            onClick={() => navigate(chapter.id)}
                            onKeyDown={(event) => {
                                const nextIndex =
                                    event.key === 'ArrowRight'
                                        ? (chapterIndex + 1) % CHAPTERS.length
                                        : event.key === 'ArrowLeft'
                                          ? (chapterIndex - 1 + CHAPTERS.length) % CHAPTERS.length
                                          : event.key === 'Home'
                                            ? 0
                                            : event.key === 'End'
                                              ? CHAPTERS.length - 1
                                              : -1;
                                if (nextIndex < 0) return;
                                event.preventDefault();
                                const next = CHAPTERS[nextIndex];
                                select(next.id);
                                document.getElementById(`tab-${next.id}`)?.focus();
                            }}
                        >
                            <span>{String(chapterIndex).padStart(2, '0')}</span>
                            {chapter.label}
                            <i aria-hidden="true">{visited.includes(chapter.id) ? '·' : ''}</i>
                        </button>
                    ))}
                </div>
            </nav>
            <div className="sg-layout">
                <div ref={content} role="tabpanel" id="sg-panel" aria-labelledby={`tab-${active}`} tabIndex={0} key={active} className="sg-chapter">
                    <View />
                    <div className="sg-pagination">
                        {index > 0 ? (
                            <button type="button" onClick={() => navigate(CHAPTERS[index - 1].id)}>
                                <span className="sg-label">← Previous chapter</span>
                                <strong>{CHAPTERS[index - 1].label}</strong>
                            </button>
                        ) : (
                            <span />
                        )}
                        {index < CHAPTERS.length - 1 ? (
                            <button type="button" onClick={() => navigate(CHAPTERS[index + 1].id)}>
                                <span className="sg-label">Next chapter →</span>
                                <strong>{CHAPTERS[index + 1].label}</strong>
                            </button>
                        ) : (
                            <button type="button" onClick={() => navigate('map')}>
                                <span className="sg-label">Return to the beginning ↗</span>
                                <strong>See the whole system again</strong>
                            </button>
                        )}
                    </div>
                </div>
                <aside className="sg-toc">
                    <span className="sg-label">On this page</span>
                    {toc.map((item, itemIndex) => (
                        <button
                            key={item.id}
                            type="button"
                            aria-current={section === item.id ? 'location' : undefined}
                            onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: scrollBehavior() })}
                        >
                            <span>0{itemIndex + 1}</span>
                            {item.label}
                        </button>
                    ))}
                    <p>
                        One rule at a time.
                        <br />
                        One study of your own.
                    </p>
                    <span className="sg-toc-mark" aria-hidden="true">
                        ✳
                    </span>
                </aside>
            </div>
            <footer className="sg-footer">
                <span>Sagebrush, in marks.</span>
                <p>A field guide made from the artwork’s own code.</p>
                <Link href="/art-solace/learn">Explore Solace, decoded ↗</Link>
            </footer>
        </main>
    );
}

'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

import { RouteLink } from '../FloemaTwo/Shell';

import { ScrollTrigger, useFloema } from './kit/runtime';
import { type ChapterId, chapters } from './catalog';
const loading = () => (
    <div className="f2l-chapter-loading" role="status">
        Opening the lab…
    </div>
);
const views = {
    map: dynamic(() => import('./chapters/Map'), { loading }),
    clock: dynamic(() => import('./chapters/Clock'), { loading }),
    scenes: dynamic(() => import('./chapters/Scenes'), { loading }),
    text: dynamic(() => import('./chapters/Text'), { loading }),
    depth: dynamic(() => import('./chapters/Depth'), { loading }),
    handoff: dynamic(() => import('./chapters/Handoff'), { loading }),
    materials: dynamic(() => import('./chapters/Materials'), { loading }),
    hover: dynamic(() => import('./chapters/Hover'), { loading }),
    transitions: dynamic(() => import('./chapters/Transitions'), { loading }),
    interaction: dynamic(() => import('./chapters/Interaction'), { loading }),
    performance: dynamic(() => import('./chapters/Performance'), { loading }),
    build: dynamic(() => import('./chapters/Build'), { loading }),
};
const fromHash = (): ChapterId => {
    const id = location.hash.slice(1);
    return chapters.find((c) => c.id === id)?.id || 'map';
};
export default function Guide() {
    const [active, setActive] = useState<ChapterId>(fromHash);
    const [visited, setVisited] = useState<ChapterId[]>(() => {
        try {
            const old = JSON.parse(localStorage.getItem('f2-learn-visited') || '[]');
            return Array.from(new Set([...(Array.isArray(old) ? old.filter((id) => chapters.some((c) => c.id === id)) : []), fromHash()]));
        } catch {
            return [fromHash()];
        }
    });
    const [toc, setToc] = useState<{ id: string; title: string }[]>([]);
    const [currentSection, setCurrentSection] = useState('');
    const panel = useRef<HTMLDivElement>(null);
    const rail = useRef<HTMLDivElement>(null);
    const progress = useRef<HTMLDivElement>(null);
    const initialHash = useRef(Boolean(location.hash));
    const { scrollTo, reduced } = useFloema();
    const jump = useCallback(
        (target: string | number) => {
            if (typeof target === 'number') return scrollTo(target);
            const element = document.querySelector<HTMLElement>(target);
            if (element) scrollTo(element.getBoundingClientRect().top + window.scrollY - 64 - (rail.current?.offsetHeight || 128) - 24);
        },
        [scrollTo],
    );
    const index = chapters.findIndex((c) => c.id === active);
    const View = views[active];
    useEffect(() => {
        const tab = document.getElementById(`f2l-tab-${active}`);
        const row = tab?.parentElement;
        if (tab && row && row.scrollWidth > row.clientWidth) row.scrollTo({ left: tab.offsetLeft - row.offsetLeft - 8, behavior: 'instant' });
    }, [active]);
    const choose = (id: ChapterId, focus = false) => {
        if (id !== active) {
            history.pushState(null, '', `#${id}`);
            setActive(id);
            setVisited((old) => (old.includes(id) ? old : [...old, id]));
        }
        if (rail.current && rail.current.getBoundingClientRect().top < 80) jump('#f2l-content');
        if (focus) document.getElementById(`f2l-tab-${id}`)?.focus({ preventScroll: true });
    };
    useEffect(() => {
        const sync = () => {
            const id = fromHash();
            setActive(id);
            setVisited((old) => (old.includes(id) ? old : [...old, id]));
            jump('#f2l-content');
        };
        addEventListener('hashchange', sync);
        addEventListener('popstate', sync);
        return () => {
            removeEventListener('hashchange', sync);
            removeEventListener('popstate', sync);
        };
    }, [jump]);
    useEffect(() => {
        try {
            localStorage.setItem('f2-learn-visited', JSON.stringify(visited));
        } catch {
            /* Reading works without storage. */
        }
    }, [visited]);
    useEffect(() => {
        const node = panel.current;
        if (!node) return;
        let observer: IntersectionObserver | undefined;
        let timer: ReturnType<typeof setTimeout>;
        const scan = () => {
            const headings = Array.from(node.querySelectorAll<HTMLElement>('[data-toc]'));
            setToc(headings.map((h) => ({ id: h.dataset.toc!, title: h.textContent || '' })));
            observer?.disconnect();
            observer = new IntersectionObserver(
                (entries) => {
                    const visible = entries.find((e) => e.isIntersecting);
                    if (visible) setCurrentSection((visible.target as HTMLElement).dataset.toc!);
                },
                { rootMargin: '-15% 0px -65% 0px' },
            );
            headings.forEach((h) => observer?.observe(h));
            if (initialHash.current && headings.length) {
                initialHash.current = false;
                jump('#f2l-content');
            }
        };
        const mutation = new MutationObserver((records) => {
            if (records.some((record) => Array.from(record.addedNodes).some((item) => item instanceof Element && (item.matches('[data-toc]') || item.querySelector('[data-toc]'))))) scan();
        });
        mutation.observe(node, { childList: true, subtree: true });
        const resize = new ResizeObserver(() => {
            clearTimeout(timer);
            timer = setTimeout(() => ScrollTrigger.refresh(), 100);
        });
        resize.observe(node);
        const raf = requestAnimationFrame(scan);
        return () => {
            cancelAnimationFrame(raf);
            mutation.disconnect();
            resize.disconnect();
            observer?.disconnect();
            clearTimeout(timer);
        };
    }, [active, jump]);
    useEffect(() => {
        const trigger = ScrollTrigger.create({
            start: 0,
            end: 'max',
            onUpdate: (self) => {
                if (progress.current) progress.current.style.transform = `scaleX(${self.progress})`;
            },
        });
        return () => trigger.kill();
    }, []);
    return (
        <main id="f2-main" className={`f2-learn ${reduced ? 'f2l-reduced' : ''}`}>
            <header className="f2l-topbar">
                <RouteLink href="/floema-2/home" className="f2l-back">
                    ↖ The experience
                </RouteLink>
                <span className="f2l-eyebrow f2l-top-title">FLOEMA / FIELD NOTES 02</span>
                <span className="f2l-status">
                    <i />
                    {visited.length} / 12 explored
                </span>
                <div className="f2l-reading-progress" ref={progress} />
            </header>
            <section className="f2l-hero">
                <div className="f2l-hero-copy">
                    <span className="f2l-eyebrow">AN INTERACTIVE DESIGN ENGINEERING GUIDE</span>
                    <h1 tabIndex={-1}>
                        From scroll
                        <br />
                        to <em>sensation.</em>
                    </h1>
                    <p>A beautiful experience is a series of understandable decisions. Take this one apart, change the numbers, and learn to build your own.</p>
                    <div className="f2l-hero-actions">
                        <button className="f2l-button f2l-primary" onClick={() => jump('#f2l-content')}>
                            Open the field guide <span>↘</span>
                        </button>
                        <a href="/floema-2/sustainability" target="_blank" rel="noreferrer">
                            See the source ↗
                        </a>
                    </div>
                    <div className="f2l-hero-facts">
                        <span>
                            <b>12</b>chapters
                        </span>
                        <span>
                            <b>14</b>interactive labs
                        </span>
                        <span>
                            <b>36</b>recall cards
                        </span>
                    </div>
                </div>
                <div className="f2l-hero-visual" aria-label="Exploded diagram showing interface, motion, and scene layers">
                    <span className="f2l-coordinate">FIG. 01 / THE VISIBLE & THE INVISIBLE</span>
                    <div className="f2l-orbit">
                        <div className="f2l-orbit-ring" />
                        <div className="f2l-diagram-plane f2l-plane-back">
                            <span>03 / SCENE</span>
                            <div className="f2l-wire-object">
                                <i />
                                <i />
                                <i />
                            </div>
                        </div>
                        <div className="f2l-diagram-plane f2l-plane-middle">
                            <span>02 / MOTION</span>
                            <div className="f2l-mini-curve" />
                        </div>
                        <div className="f2l-diagram-plane f2l-plane-front">
                            <span>01 / INTERFACE</span>
                            <strong>
                                Spaces
                                <br />
                                for people.
                            </strong>
                            <i>EXPLORE →</i>
                        </div>
                    </div>
                    <span className="f2l-coordinate f2l-coordinate-bottom">INPUT → PROGRESS → PIXELS</span>
                </div>
            </section>
            <section className="f2l-how">
                <span className="f2l-eyebrow">HOW TO USE THIS GUIDE</span>
                <div>
                    <b>01 / See it</b>
                    <p>Start with the visible result and a familiar design analogy.</p>
                </div>
                <div>
                    <b>02 / Break it</b>
                    <p>Push a dial too far. Find the limit, then reset to the source.</p>
                </div>
                <div>
                    <b>03 / Remember it</b>
                    <p>Read the short code. Close the answer. Explain it back.</p>
                </div>
            </section>
            <div className="f2l-chapter-rail" ref={rail}>
                <div className="f2l-rail-label">
                    <span className="f2l-eyebrow">THE FIELD GUIDE</span>
                    <span>{String(index + 1).padStart(2, '0')} / 12</span>
                </div>
                <nav role="tablist" aria-label="Guide chapters" className="f2l-tabs">
                    {chapters.map((c, i) => (
                        <button
                            key={c.id}
                            role="tab"
                            data-tab={c.id}
                            id={`f2l-tab-${c.id}`}
                            aria-controls="f2l-panel"
                            aria-selected={active === c.id}
                            tabIndex={active === c.id ? 0 : -1}
                            onClick={() => choose(c.id)}
                            onKeyDown={(e) => {
                                const next = e.key === 'ArrowRight' ? (i + 1) % 12 : e.key === 'ArrowLeft' ? (i + 11) % 12 : e.key === 'Home' ? 0 : e.key === 'End' ? 11 : -1;
                                if (next >= 0) {
                                    e.preventDefault();
                                    choose(chapters[next].id, true);
                                }
                            }}
                        >
                            <span>{String(i).padStart(2, '0')}</span>
                            {c.label}
                            {visited.includes(c.id) && <i aria-label="Explored" />}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="f2l-content" id="f2l-content">
                <aside className="f2l-toc">
                    <span className="f2l-eyebrow">IN THIS CHAPTER</span>
                    {toc.map((item, i) => (
                        <button key={item.id} className={item.id === currentSection ? 'is-current' : ''} onClick={() => jump(`#${item.id}`)}>
                            <span>0{i + 1}</span>
                            {item.title}
                        </button>
                    ))}
                    <div className="f2l-toc-note">This guide shares the source’s smooth-scroll clock. Each lab runs only while it’s visible.</div>
                </aside>
                <div ref={panel} id="f2l-panel" role="tabpanel" aria-labelledby={`f2l-tab-${active}`} tabIndex={0}>
                    <View key={active} />
                    <nav className="f2l-pagination" aria-label="Chapter navigation">
                        {index > 0 ? (
                            <button onClick={() => choose(chapters[index - 1].id)}>
                                <span>← PREVIOUS</span>
                                <strong>{chapters[index - 1].label}</strong>
                            </button>
                        ) : (
                            <div />
                        )}
                        {index < 11 && (
                            <button onClick={() => choose(chapters[index + 1].id)}>
                                <span>NEXT →</span>
                                <strong>{chapters[index + 1].label}</strong>
                            </button>
                        )}
                    </nav>
                </div>
            </div>
            <footer className="f2l-footer">
                <span>
                    Made to understand.
                    <br />
                    <b>Then made your own.</b>
                </span>
                <div>
                    <RouteLink href="/floema-2/home">Home experience ↗</RouteLink>
                    <RouteLink href="/floema-2/sustainability">Sustainability experience ↗</RouteLink>
                    <button onClick={() => scrollTo(0)}>Back to the beginning ↑</button>
                </div>
                <p>Local reference study · No data leaves this guide. Progress is saved in this browser.</p>
            </footer>
        </main>
    );
}

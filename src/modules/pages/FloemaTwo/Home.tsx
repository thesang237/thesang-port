'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { asset, collections } from './data';
import { clamp, createDials, gsap, motion, ScrollTrigger } from './motion';
import SceneLoader from './SceneLoader';
import { Footer, Pillars, PillButton } from './Shared';
import { Arrow, RouteLink, useFloema } from './Shell';

export default function Home() {
    const hero = useRef<HTMLElement>(null);
    const [active, setActive] = useState(true);
    const dialsRef = useRef(createDials());
    const { reduced, openPanel } = useFloema();
    useEffect(() => {
        const move = (e: PointerEvent) => {
            dialsRef.current.pointerX = (e.clientX / innerWidth) * 2 - 1;
            dialsRef.current.pointerY = (e.clientY / innerHeight) * 2 - 1;
        };
        window.addEventListener('pointermove', move, { passive: true });
        const trigger = ScrollTrigger.create({
            start: -1,
            end: () => innerHeight * 1.5,
            onToggle: (self) => setActive(self.isActive),
            onUpdate: (self) => {
                dialsRef.current.progress = clamp(self.scroll() / innerHeight);
                dialsRef.current.scrollVelocity = clamp(self.getVelocity() / 1000, 0, 4);
            },
        });
        return () => {
            window.removeEventListener('pointermove', move);
            trigger.kill();
        };
    }, [dialsRef]);
    return (
        <main id="f2-main" className={`f2-home ${reduced ? 'f2-reduced' : ''}`}>
            <section ref={hero} className="f2-home-hero" data-tone="paper">
                <SceneLoader mode="home" dialsRef={dialsRef} active={active} />
                <h1 tabIndex={-1}>
                    Spaces for people, made for
                    <br />
                    life.
                </h1>
            </section>
            <CollectionsFilm />
            <div className="f2-home-editorial">
                <section id="about" className="f2-about" data-tone="paper">
                    <div className="f2-about-statement" data-reveal>
                        <div className="f2-about-badge">
                            <span>
                                Floema®
                                <br />
                                Est. 2007
                            </span>
                            <img src={asset('workshop.webp')} alt="Machining a recycled material" loading="lazy" />
                        </div>
                        <h2>
                            Going beyond the expected is our calling. Lasting design brings imagination together with clear principles. We keep exploring, refining, and making—with care for each
                            detail and the world it becomes part of.
                        </h2>
                    </div>
                    <aside>
                        <div className="f2-section-label">Recent stories ↓</div>
                        <div className="f2-story-pair">
                            {[
                                ['coast.webp', 'A closer connection to the landscape'],
                                ['forest.webp', 'Finding our way, together'],
                            ].map(([image, title]) => (
                                <button key={image} className="f2-story" onClick={() => openPanel({ type: 'journal' })}>
                                    <div className="f2-image-crop">
                                        <img src={asset(image)} alt="" loading="lazy" />
                                    </div>
                                    <h3>{title}</h3>
                                    <Arrow />
                                </button>
                            ))}
                        </div>
                    </aside>
                </section>
                <section className="f2-featured" data-tone="paper">
                    <div className="f2-section-label">Recent additions ↓</div>
                    <div className="f2-featured-grid">
                        {[
                            ['bench.webp', 'Byside bench Plaza', 'Urban', 30],
                            ['tee-sign.webp', 'Palmer tee sign', 'Golf', 31],
                        ].map(([image, title, type, index]) => (
                            <button className="f2-product-card" key={image} onClick={() => openPanel({ type: 'product', index: Number(index) })}>
                                <div className="f2-product-card-meta">
                                    <span>{title}</span>
                                    <span>{type} ↗</span>
                                </div>
                                <img src={asset(String(image))} alt={String(title)} loading="lazy" />
                                <span className="f2-product-explore">
                                    Explore <Arrow />
                                </span>
                            </button>
                        ))}
                    </div>
                </section>
                <CollectionIndex />
                <section className="f2-home-quote" data-tone="green">
                    <div className="f2-quote-left">
                        <div className="f2-author">
                            <img src={asset('portrait.webp')} alt="Fernando Pinto" loading="lazy" />
                            <span>
                                Fernando Pinto<small>Managing Partner</small>
                            </span>
                        </div>
                        <p>We make outdoor objects that become a natural part of their surroundings. Durable materials, thoughtful details, and less maintenance leave more room for life.</p>
                        <h2 data-reveal>“Good design should feel right for people—and do right by the planet.”</h2>
                        <RouteLink href="/floema-2/sustainability" className="f2-text-link">
                            More on sustainability <Arrow />
                        </RouteLink>
                    </div>
                    <img className="f2-quote-landscape" src={asset('island.webp')} alt="A viewpoint on Berlengas Island, Portugal" loading="lazy" />
                </section>
                <Pillars />
                <Footer />
            </div>
        </main>
    );
}

function CollectionsFilm() {
    const track = useRef<HTMLElement>(null);
    const [active, setActive] = useState(0);
    const current = useRef(0);
    const { reduced, openPanel } = useFloema();
    useLayoutEffect(() => {
        if (reduced || !track.current) return;
        const node = track.current;
        const ctx = gsap.context(() => {
            const images = gsap.utils.toArray<HTMLElement>('.f2-collection-photo', node);
            gsap.set(images, { clipPath: 'inset(0% 0% 0% 0%)' });
            gsap.set(images.slice(1), { clipPath: 'inset(100% 0% 0% 0%)', visibility: 'visible' });
            const timeline = gsap.timeline({
                scrollTrigger: {
                    trigger: node,
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: true,
                    onUpdate: (self) => {
                        const index = Math.min(4, Math.floor(self.progress * 4 + 0.4));
                        if (current.current !== index) {
                            current.current = index;
                            setActive(index);
                        }
                        const line = node.querySelector<HTMLElement>('.f2-collection-progress');
                        if (line) line.style.transform = `scaleX(${self.progress})`;
                    },
                },
            });
            images.forEach((image, i) => {
                if (i > 0) timeline.fromTo(image, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.15, ease: 'none' }, (i - 0.6) / 4);
                timeline.fromTo(image.querySelector('img'), { yPercent: i === 0 ? 0 : -4 }, { yPercent: 0, duration: 0.25, ease: 'none' }, clamp((i - 0.6) / 4));
            });
            timeline.to({}, { duration: 0.001 }, 1);
        }, node);
        return () => ctx.revert();
    }, [reduced]);
    const item = collections[active];
    return (
        <section ref={track} id="collections" className="f2-collections-film" data-tone="photo">
            <div className="f2-collection-stage">
                {collections.map((collection, i) => (
                    <div className="f2-collection-photo" key={collection.slug} data-collection={collection.slug} style={reduced ? { display: i === active ? 'block' : 'none' } : undefined}>
                        <img src={asset(collection.image)} alt={`${collection.name} — ${collection.description}`} loading={i === 0 ? 'eager' : 'lazy'} />
                    </div>
                ))}
                <div className="f2-collection-rule">
                    <span className="f2-collection-progress" />
                </div>
                <span className="f2-made-to-last">Made to Last</span>
                <div className="f2-collection-heading" key={item.slug}>
                    <span className="f2-collection-number">0{active + 1}</span>
                    <div className="f2-collection-description">
                        <span className="f2-category-tag" style={{ background: item.color }}>
                            {item.symbol} {item.name}
                        </span>
                        <h2>{item.title}</h2>
                        <PillButton onClick={() => openPanel({ type: 'products', query: item.name })}>See {item.name} products</PillButton>
                    </div>
                </div>
                {'catalogue' in item && (
                    <button className="f2-catalogue" onClick={() => openPanel({ type: 'products', query: item.name })}>
                        <span>
                            {item.name}
                            <br />
                            Catalogue<small>Explore collection ↗</small>
                        </span>
                        <img src={asset(item.catalogue)} alt="" />
                    </button>
                )}
                <span className="f2-scroll-label">
                    Scroll to explore <span>↓</span>
                </span>
                {reduced && (
                    <div className="f2-accessible-collection-tabs">
                        {collections.map((c, i) => (
                            <button key={c.slug} aria-pressed={active === i} onClick={() => setActive(i)}>
                                {c.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function CollectionIndex() {
    const [hovered, setHovered] = useState<number | null>(null);
    const [frame, setFrame] = useState(0);
    const [visible, setVisible] = useState(false);
    const root = useRef<HTMLElement>(null);
    const { openPanel, reduced } = useFloema();
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
        if (root.current) observer.observe(root.current);
        return () => observer.disconnect();
    }, []);
    useEffect(() => {
        if (hovered === null || reduced || !visible) return;
        const timer = window.setInterval(() => {
            if (document.visibilityState === 'visible') setFrame((value) => (value + 1) % 6);
        }, motion.collectionCycle);
        return () => window.clearInterval(timer);
    }, [hovered, reduced, visible]);
    const select = (index: number) => {
        setHovered(index);
        setFrame(0);
    };
    return (
        <section ref={root} className="f2-collection-index" data-tone="paper">
            <span className="f2-section-label">The collections</span>
            <div
                className="f2-index-links"
                onMouseLeave={() => {
                    if (!root.current?.contains(document.activeElement)) setHovered(null);
                }}
            >
                {collections.map((c, i) => (
                    <button
                        key={c.slug}
                        className={hovered === i ? 'is-current' : ''}
                        onMouseEnter={() => select(i)}
                        onFocus={() => select(i)}
                        onBlur={(event) => {
                            if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) setHovered(null);
                        }}
                        onClick={() => openPanel({ type: 'products', query: c.name })}
                    >
                        <span>
                            {c.symbol} {c.name}
                        </span>
                        <span className="f2-index-preview" style={{ background: c.color }} aria-hidden="true">
                            {[0, 1, 2, 3, 4, 5].map((n) => (
                                <img key={n} src={asset(`product-${i * 6 + n}.webp`)} alt="" loading="lazy" className={(hovered === i ? frame : 0) === n ? 'is-visible' : ''} />
                            ))}
                        </span>
                        <span>({c.count})</span>
                    </button>
                ))}
            </div>
        </section>
    );
}

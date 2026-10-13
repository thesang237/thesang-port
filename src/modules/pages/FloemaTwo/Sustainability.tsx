'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { asset, materials } from './data';
import type { SceneDialsRef } from './motion';
import { clamp, createDials, gsap, ScrollTrigger } from './motion';
import SceneLoader from './SceneLoader';
import { Footer, Pillars } from './Shared';
import { Arrow, useFloema } from './Shell';

export default function Sustainability() {
    const root = useRef<HTMLElement>(null);
    const dialsRef = useRef(createDials());
    const [outlineActive, setOutlineActive] = useState(true);
    const [cubeActive, setCubeActive] = useState(false);
    const mode = cubeActive ? 'cube' : 'outline';
    const { reduced, scrollTo, openPanel } = useFloema();
    useEffect(() => {
        const move = (e: PointerEvent) => {
            dialsRef.current.pointerX = (e.clientX / innerWidth) * 2 - 1;
            dialsRef.current.pointerY = (e.clientY / innerHeight) * 2 - 1;
        };
        window.addEventListener('pointermove', move, { passive: true });
        return () => window.removeEventListener('pointermove', move);
    }, [dialsRef]);
    useLayoutEffect(() => {
        const el = root.current;
        if (!el) return;
        const ctx = gsap.context(() => {
            ScrollTrigger.create({
                trigger: '.f2-green-story',
                start: 'top top+=1',
                end: 'bottom top',
                onUpdate: (self) => {
                    dialsRef.current.progress = clamp(self.progress * 1.2);
                },
                onToggle: (self) => {
                    setOutlineActive(self.isActive);
                },
            });
            if (!reduced) {
                gsap.to('.f2-city-quote', {
                    opacity: 0,
                    ease: 'none',
                    scrollTrigger: { trigger: '.f2-charger-photo-track', start: 'top top', end: () => `+=${innerHeight * 0.2}`, scrub: true },
                });
                ScrollTrigger.create({
                    trigger: '.f2-charger-photo-track',
                    start: 'top bottom',
                    end: 'top top',
                    onUpdate: (self) => {
                        dialsRef.current.chargerMatch = self.progress;
                    },
                });
                gsap.fromTo(
                    '.f2-charger-photo',
                    { clipPath: 'inset(100% 0% 0% 0%)' },
                    {
                        clipPath: 'inset(0% 0% 0% 0%)',
                        ease: 'none',
                        scrollTrigger: { trigger: '.f2-charger-photo-track', start: 'top top', end: () => `+=${innerHeight}`, scrub: true },
                    },
                );
            }
            if (!reduced) gsap.to('.f2-outline-products', { yPercent: -100, ease: 'none', scrollTrigger: { trigger: '.f2-green-story', start: 'top top', end: () => innerHeight * 1.1, scrub: true } });
        }, el);
        return () => ctx.revert();
    }, [dialsRef, reduced]);
    return (
        <main className={`f2-sustainability ${reduced ? 'f2-reduced' : ''}`} id="f2-main" ref={root}>
            <div className="f2-sustain-canvas">
                <SceneLoader mode={mode} dialsRef={dialsRef} active={(outlineActive || cubeActive) && !reduced} />
            </div>
            <div className="f2-green-story" data-tone="green">
                <div className="f2-outline-products" aria-hidden="true">
                    <img className="f2-wire-table" src={asset('outline-table.svg')} alt="" />
                    <img className="f2-wire-chair" src={asset('outline-chair.svg')} alt="" />
                    <img className="f2-wire-bin" src={asset('outline-bin.svg')} alt="" />
                </div>
                <section className="f2-sustain-hero">
                    <h1 tabIndex={-1}>Built in Portugal. Made for life.</h1>
                    <p>
                        True sustainability brings timeless design
                        <br />
                        together with materials that endure.
                    </p>
                    <button className="f2-down" aria-label="Explore our principles" onClick={() => scrollTo('#principles')}>
                        <Arrow direction="down" />
                    </button>
                    {reduced && <img className="f2-static-charger" src={asset('outline-charger.svg')} alt="Wireframe drawing of an outdoor charging station" />}
                </section>
                <section className="f2-principle f2-principle-left" id="principles">
                    <div data-reveal>
                        <img src={asset('principle-design.svg')} alt="" />
                        <h2>We design, build, and bring to life products that work beautifully, today and for years to come.</h2>
                    </div>
                </section>
                <section className="f2-principle f2-principle-right">
                    <div data-reveal>
                        <img src={asset('principle-weather.svg')} alt="" />
                        <h2>Built for changing seasons, everyday use, and everything the outdoors brings.</h2>
                    </div>
                </section>
                <section className="f2-principle f2-principle-left">
                    <div data-reveal>
                        <img src={asset('principle-maintenance.svg')} alt="" />
                        <h2>A little less maintenance. A lot more life. Ready for the weather—and the future.</h2>
                    </div>
                </section>
                <section className="f2-city-quote">
                    <div data-reveal>
                        <span className="f2-quotation-mark">“</span>
                        <h2>The best cities make room for everyone. And the best places are the ones we shape together.</h2>
                        <p>
                            A shared belief
                            <br />
                            <span>Spaces for people</span>
                        </p>
                    </div>
                </section>
            </div>
            <ChargerPhotograph />
            <section className="f2-materials" data-tone="yellow">
                <div className="f2-material-intro">
                    <div className="f2-material-quote" data-reveal>
                        <div className="f2-author">
                            <img src={asset('portrait-materials.webp')} alt="Fernando Pinto" loading="lazy" />
                            <span>
                                Fernando Pinto<small>Managing Partner</small>
                            </span>
                        </div>
                        <h2>
                            <span className="f2-quote-indent" />
                            “We choose our raw materials with tomorrow in mind. Every solution should keep its purpose and character, through years of exposure to the elements and everyday life.”
                        </h2>
                    </div>
                </div>
                <Materials dialsRef={dialsRef} onActive={setCubeActive} />
            </section>
            <SeasonComparison />
            <section className="f2-integration" data-tone="paper">
                <h2 data-reveal>
                    We imagine spaces for everyone.
                    <br />
                    Clear signage <img src={asset('inline-sign.webp')} alt="" /> to find our way, <img src={asset('inline-bench.webp')} alt="" /> park benches for conversations, and equipment{' '}
                    <img src={asset('inline-play.webp')} alt="" /> for life outdoors.
                </h2>
                <div className="f2-integration-story">
                    <img src={asset('footer-chair.svg')} alt="Technical drawing of a chair" />
                    <div data-reveal>
                        <p>Our story began on Portugal’s walking trails, with a simple observation: better signage could help more people enjoy the places we love.</p>
                        <p className="f2-small">That idea grew into a way of thinking about public spaces—creating lasting objects that make everyday experiences a little better.</p>
                    </div>
                    <button className="f2-text-link" onClick={() => openPanel({ type: 'products' })}>
                        Explore our work <Arrow />
                    </button>
                </div>
            </section>
            <Pillars sustainability />
            <Footer sustainability />
        </main>
    );
}

function ChargerPhotograph() {
    const { openPanel } = useFloema();
    const [hotspot, setHotspot] = useState<number | null>(null);
    return (
        <section className="f2-charger-photo-track" data-tone="photo">
            <div className="f2-charger-photo">
                <img className="f2-charger-background" src={asset('charger-background.webp')} alt="A cyclist alongside an outdoor charging station" loading="lazy" />
                <div className="f2-charger-product">
                    <img className="f2-charger-real" src={asset('charger-front.webp')} alt="Frame e-bike charging station" loading="lazy" />
                    <div className="f2-hotspots">
                        {[
                            ['Universal charging', 'Two protected sockets for everyday charging.', 4, 28],
                            ['Shimano compatible', 'A dedicated connection, ready for the next ride.', 55, 91],
                            ['Bosch compatible', 'Integrated charging in a weather-resistant frame.', 76, 86],
                        ].map(([title, text, left, top], index) => (
                            <div className="f2-hotspot" key={String(title)} style={{ left: `${left}%`, top: `${top}%` }}>
                                <button
                                    onMouseEnter={() => setHotspot(index)}
                                    onMouseLeave={() => setHotspot(null)}
                                    onFocus={() => setHotspot(index)}
                                    onBlur={() => setHotspot(null)}
                                    onClick={() => setHotspot(hotspot === index ? null : index)}
                                    aria-label={String(title)}
                                    aria-expanded={hotspot === index}
                                >
                                    +
                                </button>
                                <div className="f2-hotspot-label" data-open={hotspot === index}>
                                    <strong>{title}</strong>
                                    <span>{text}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <button className="f2-catalogue" onClick={() => openPanel({ type: 'product', index: 0 })}>
                    <span>
                        <small className="f2-category-tag">Urban</small>E-bike charger
                        <br />
                        Frame<small>View product ↗</small>
                    </span>
                    <img src={asset('charger-cutout.webp')} alt="" />
                </button>
            </div>
        </section>
    );
}

function Materials({ dialsRef, onActive }: { dialsRef: SceneDialsRef; onActive: (value: boolean) => void }) {
    const track = useRef<HTMLDivElement>(null);
    const [index, setIndex] = useState(0);
    const current = useRef(0);
    const circleProgress = useRef<SVGCircleElement>(null);
    const { reduced, scrollTo, openPanel } = useFloema();
    const callback = useRef(onActive);
    useLayoutEffect(() => {
        callback.current = onActive;
    }, [onActive]);
    useLayoutEffect(() => {
        const node = track.current;
        if (!node || reduced) return;
        const trigger = ScrollTrigger.create({
            trigger: node,
            start: 'top bottom',
            end: 'bottom top',
            onToggle: (self) => callback.current(self.isActive),
            onUpdate: (self) => {
                const top = self.start + innerHeight - self.scroll();
                const bottom = self.end - self.scroll();
                dialsRef.current.cubeOffset = top > 0 ? top : bottom < innerHeight ? bottom - innerHeight : 0;
                const p = clamp(-top / Math.max(1, self.end - self.start - 2 * innerHeight));
                const next = Math.min(2, Math.floor(p * 3));
                dialsRef.current.material = next;
                if (current.current !== next) {
                    current.current = next;
                    setIndex(next);
                }
                if (circleProgress.current) circleProgress.current.style.strokeDashoffset = String(100 * (1 - p));
            },
        });
        return () => trigger.kill();
    }, [dialsRef, reduced]);
    const select = (next: number) => {
        if (reduced) {
            setIndex(next);
            dialsRef.current.material = next;
            return;
        }
        const node = track.current!;
        scrollTo(node.getBoundingClientRect().top + window.scrollY + ((next + 0.12) / 3) * (node.offsetHeight - innerHeight));
    };
    const drag = useRef<{ x: number; y: number } | null>(null);
    return (
        <div className="f2-material-track" ref={track} id="materials">
            <div className="f2-material-stage">
                <div className="f2-material-titles" role="tablist" aria-label="Materials">
                    {materials.map((material, i) => (
                        <button
                            key={material.name}
                            role="tab"
                            id={`f2-material-tab-${i}`}
                            aria-controls="f2-material-description"
                            aria-selected={i === index}
                            tabIndex={i === index ? 0 : -1}
                            onClick={() => select(i)}
                            onKeyDown={(e) => {
                                const next =
                                    e.key === 'Home'
                                        ? 0
                                        : e.key === 'End'
                                          ? materials.length - 1
                                          : e.key === 'ArrowRight' || e.key === 'ArrowDown'
                                            ? (i + 1) % materials.length
                                            : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
                                              ? (i + materials.length - 1) % materials.length
                                              : null;
                                if (next === null) return;
                                e.preventDefault();
                                select(next);
                                document.getElementById(`f2-material-tab-${next}`)?.focus({ preventScroll: true });
                            }}
                            className={i === index ? 'is-active' : ''}
                        >
                            <span aria-hidden="true">→</span>
                            {material.name}
                        </button>
                    ))}
                </div>
                <div className="f2-material-description" role="tabpanel" id="f2-material-description" aria-labelledby={`f2-material-tab-${index}`}>
                    <span>CHARACTERISTICS</span>
                    <p key={index}>{materials[index].text}</p>
                    <button className="f2-button" onClick={() => openPanel({ type: 'material', index })}>
                        Learn more <Arrow />
                    </button>
                </div>
                <div className="f2-material-orbit">
                    <svg viewBox="0 0 100 100" aria-hidden="true">
                        <circle cx="50" cy="50" r="49" />
                        <circle className="f2-orbit-progress" ref={circleProgress} cx="50" cy="50" r="49" pathLength="100" />
                    </svg>
                    {materials.map((m, i) => (
                        <button className={`f2-swatch f2-swatch-${i} ${index === i ? 'is-active' : ''}`} aria-label={`Select ${m.name}`} key={m.name} onClick={() => select(i)}>
                            <img src={asset(m.swatch)} alt="" />
                        </button>
                    ))}
                    {reduced && (
                        <div className="f2-reduced-material">
                            <img src={asset(materials[index].swatch)} alt={`${materials[index].name} texture`} />
                        </div>
                    )}
                </div>
                <div
                    className="f2-cube-drag"
                    role="group"
                    tabIndex={0}
                    aria-label="Rotate the material cube. Drag or use arrow keys."
                    onKeyDown={(e) => {
                        if (e.key.startsWith('Arrow')) {
                            e.preventDefault();
                            if (e.key === 'ArrowLeft') dialsRef.current.dragX -= 0.3;
                            if (e.key === 'ArrowRight') dialsRef.current.dragX += 0.3;
                            if (e.key === 'ArrowUp') dialsRef.current.dragY -= 0.3;
                            if (e.key === 'ArrowDown') dialsRef.current.dragY += 0.3;
                        }
                    }}
                    onPointerDown={(e) => {
                        if (reduced) return;
                        drag.current = { x: e.clientX, y: e.clientY };
                        dialsRef.current.dragging = true;
                        e.currentTarget.setPointerCapture(e.pointerId);
                    }}
                    onPointerMove={(e) => {
                        if (!drag.current) return;
                        dialsRef.current.dragX += (e.clientX - drag.current.x) * 0.008;
                        dialsRef.current.dragY += (e.clientY - drag.current.y) * 0.008;
                        drag.current = { x: e.clientX, y: e.clientY };
                    }}
                    onPointerUp={() => {
                        drag.current = null;
                        dialsRef.current.dragging = false;
                    }}
                    onPointerCancel={() => {
                        drag.current = null;
                        dialsRef.current.dragging = false;
                    }}
                >
                    <span>Drag to explore ↔</span>
                </div>
                <aside className="f2-material-aside">
                    <p>
                        At Floema, we want the environment on our side.
                        <br />
                        <br />
                        That means making objects that feel at home in their surroundings, using considered materials that stay useful for longer.
                    </p>
                    <img src={asset('bench-materials.webp')} alt="An outdoor bench made from recycled plastic and steel" loading="lazy" />
                </aside>
            </div>
        </div>
    );
}

function SeasonComparison() {
    const [split, setSplit] = useState(50);
    const { openPanel } = useFloema();
    return (
        <section className="f2-seasons" data-tone="photo" aria-label="Viewpoint in summer and winter">
            <img className="f2-season-photo" src={asset('viewpoint-summer.webp')} alt="The mountain viewpoint in summer" loading="lazy" />
            <div className="f2-season-winter" style={{ transform: `translateX(${split - 100}%)` }}>
                <img
                    className="f2-season-photo"
                    style={{ transform: `translateX(${100 - split}%)` }}
                    src={asset('viewpoint-winter.webp')}
                    alt="The same mountain viewpoint covered in snow"
                    loading="lazy"
                />
            </div>
            <div className="f2-season-copy" style={{ color: split > 24 ? '#241f21' : '#fff' }}>
                <h2>
                    Ecodesign
                    <br />
                    that
                    <br />
                    empowers
                </h2>
                <p>
                    Cabeço do Gralheiro viewpoint
                    <br />
                    Vale de Cambra, Portugal
                </p>
                <button className="f2-button" onClick={() => openPanel({ type: 'journal' })}>
                    Explore the project <Arrow />
                </button>
            </div>
            <div className="f2-season-divider" style={{ transform: `translateX(${split}vw)` }} aria-hidden="true">
                <span>↔</span>
            </div>
            <label className="f2-season-control">
                <span className="f2-sr-only">Compare seasons: amount of winter image</span>
                <input type="range" min="0" max="100" value={split} onChange={(e) => setSplit(Number(e.target.value))} aria-valuetext={`${split}% winter, ${100 - split}% summer`} />
            </label>
            <div className="f2-season-labels">
                <span>Winter</span>
                <span>Built for every season</span>
                <span>Summer</span>
            </div>
        </section>
    );
}

'use client';

import { type CSSProperties, useEffect, useRef } from 'react';

import { ICON_SEQUENCES, KERNEL_FACTS, LIBRARY, TESTS } from '../data/story';
import { useUi } from '../store';

/**
 * The three deep-dive modes the CTA rings open (the reference's "hotspots"). Headlines are transparent
 * DOM anchors the engine draws over in WebGL (`data-gl-hs`); everything else is real DOM:
 *
 * - Library: five rings ripple out from the kernel on a 25 s cycle, each carrying three animated DNA
 *   icons; the chosen icon of each ring sends a beam back into the kernel's ring as it passes halfway.
 * - Tests: "pick a condition" with five animated icon rings (the reference sprite sheets); picking one
 *   blends the field simulator into that weather over 2.5 s.
 * - Kernel: three facts on a dial; drag the kernel (or use the dots) to turn it.
 */

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Paint frame f of the 1200-frame icon set (3 sheets of 20 × 20 frames, 100 px in 2048 px). */
function paintFrame(el: HTMLElement, f: number) {
    const sheet = Math.floor(f / 400);
    const g = f % 400;
    el.style.backgroundImage = `url(/corn/tex/icons-${sheet}.webp)`;
    el.style.backgroundPosition = `${((g % 20) / 19.48) * 100}% ${(Math.floor(g / 20) / 19.48) * 100}%`;
}

/** One icon that plays its intro once, then loops, at 30 fps (reference SpriteAnimation). */
function Sprite({ seq, on, className, style }: { seq: string; on: boolean; className?: string; style?: CSSProperties }) {
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        const el = ref.current;
        const s = ICON_SEQUENCES[seq];
        if (!el || !s) return;
        if (!on || reduced()) {
            paintFrame(el, s.loop[0] + Math.floor((s.loop[1] - s.loop[0]) * 0.3));
            return;
        }
        let f = s.in[0];
        let loop = s.in[0] >= s.in[1];
        if (loop) f = s.loop[0];
        let last = performance.now();
        let acc = 0;
        let raf = 0;
        const tick = (now: number) => {
            acc += now - last;
            last = now;
            while (acc > 1000 / 30) {
                acc -= 1000 / 30;
                f++;
                if (!loop && f >= s.in[1]) {
                    loop = true;
                    f = s.loop[0];
                } else if (loop && f >= s.loop[1]) f = s.loop[0];
            }
            paintFrame(el, f);
            raf = requestAnimationFrame(tick);
        };
        paintFrame(el, f);
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [seq, on]);
    return <span ref={ref} className={`corn-sprite ${className ?? ''}`} style={style} aria-hidden />;
}

function CloseButton({ onClose, on, label }: { onClose: () => void; on: boolean; label: string }) {
    return (
        <button type="button" className="corn-hs__close" onClick={onClose} tabIndex={on ? 0 : -1} aria-label={label}>
            <svg viewBox="0 0 40 40" aria-hidden>
                <circle cx="20" cy="20" r="19" />
                <path d="M14 14 L26 26 M26 14 L14 26" />
            </svg>
        </button>
    );
}

// ── library ──────────────────────────────────────────────────────────────────

const RINGS = 5;
const R_MAX = 460;
const R_CORE = 128;
const CYCLE = 25;

type IconSpec = { angle: number; chosen: boolean };

function Infographic({ on }: { on: boolean }) {
    const svg = useRef<SVGSVGElement>(null);
    const icons = useRef<HTMLDivElement>(null);
    const spec = useRef<IconSpec[][]>(
        Array.from({ length: RINGS }, (_, r) => {
            const chosen = (r * 7 + 2) % 3;
            return Array.from({ length: 3 }, (_, n) => ({ angle: (n / 3) * 360 + (((r * 31 + n * 17) % 40) - 20), chosen: n === chosen }));
        }),
    );

    useEffect(() => {
        if (!on) return;
        const root = svg.current;
        const box = icons.current;
        if (!root || !box) return;
        const rings = Array.from(root.querySelectorAll<SVGCircleElement>('[data-ring]'));
        const beams = Array.from(root.querySelectorAll<SVGLineElement>('[data-beam]'));
        const arc = root.querySelector<SVGCircleElement>('[data-core-arc]');
        const iconEls = Array.from(box.querySelectorAll<HTMLElement>('[data-icon]'));
        const still = reduced();
        const t0 = performance.now();
        const fired = new Array(RINGS).fill(-1);
        let flash = 0;
        let raf = 0;
        const dna = ICON_SEQUENCES.dna.loop;
        const tick = (now: number) => {
            const time = (now - t0) / 1000 + 4;
            const u = window.innerWidth / 1920; // icons are DOM, laid out in reference px
            for (let r = 0; r < RINGS; r++) {
                // reference: progress cycles over 25 s, offset r / 5, eased in (sine); scale 0.1 → 1
                const raw = still ? 0.35 + r * 0.12 : (time / CYCLE + r / RINGS) % 1;
                const pr = 1 + Math.sin((Math.PI / 2) * raw - Math.PI / 2);
                const scale = 0.1 + 0.9 * pr;
                const alpha = Math.min(1, Math.max(0, (pr - 0.1) / 0.2)) * Math.min(1, Math.max(0, (1 - pr) / 0.3));
                const radius = R_MAX * scale;
                const rot = (r % 2 ? -1 : 1) * 0.08 * time + (Math.PI * r) / 3;
                rings[r].setAttribute('r', radius.toFixed(1));
                rings[r].style.opacity = (0.5 * alpha).toFixed(3);
                spec.current[r].forEach((ic, n) => {
                    const a = (ic.angle * Math.PI) / 180 + rot;
                    const x = Math.cos(a) * radius;
                    const y = Math.sin(a) * radius;
                    const el = iconEls[r * 3 + n];
                    el.style.transform = `translate(${(x * u).toFixed(1)}px, ${(y * u).toFixed(1)}px) scale(${(0.55 + 0.45 * scale).toFixed(3)})`;
                    el.style.opacity = alpha.toFixed(3);
                    if (!still) paintFrame(el.firstElementChild as HTMLElement, dna[0] + ((Math.floor(time * 30) + r * 29 + n * 11) % (dna[1] - dna[0])));
                    if (ic.chosen) {
                        // the chosen candidate beams back into the kernel's ring once it passes halfway
                        const cycle = Math.floor(time / CYCLE + r / RINGS);
                        if (pr > 0.5 && fired[r] !== cycle) {
                            fired[r] = cycle;
                            beams[r].dataset.t0 = String(time);
                            el.classList.add('is-chosen');
                        }
                        const bt = time - Number(beams[r].dataset.t0 ?? -99);
                        const k = Math.min(1, Math.max(0, bt));
                        const head = 1 - Math.pow(1 - k, 4); // easeOutQuart toward the core
                        const tail = Math.min(1, Math.max(0, (bt - 0.5) / 1));
                        const len = Math.max(0, radius - R_CORE);
                        const ux = Math.cos(a);
                        const uy = Math.sin(a);
                        const from = radius - len * (tail * tail);
                        const to = radius - len * head;
                        beams[r].setAttribute('x1', (ux * from).toFixed(1));
                        beams[r].setAttribute('y1', (uy * from).toFixed(1));
                        beams[r].setAttribute('x2', (ux * to).toFixed(1));
                        beams[r].setAttribute('y2', (uy * to).toFixed(1));
                        beams[r].style.opacity = bt < 1.6 && !still ? (alpha * 0.9).toFixed(3) : '0';
                        if (bt > 0.95 && bt < 1.0) flash = 1;
                        if (bt > 2.5) el.classList.remove('is-chosen');
                    }
                });
            }
            flash *= 0.96;
            if (arc) {
                arc.style.opacity = (0.25 + 0.75 * flash).toFixed(3);
                arc.style.strokeDasharray = `${(8 + 30 * flash).toFixed(1)} 100`;
                arc.style.transform = `rotate(${(time * 40) % 360}deg)`;
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [on]);

    return (
        <div className="corn-info" aria-hidden>
            <svg ref={svg} className="corn-info__svg" viewBox={`${-R_MAX - 60} ${-R_MAX - 60} ${2 * R_MAX + 120} ${2 * R_MAX + 120}`}>
                {Array.from({ length: RINGS }, (_, r) => (
                    <circle key={r} data-ring className="corn-info__ring" r={R_MAX * 0.5} />
                ))}
                {Array.from({ length: RINGS }, (_, r) => (
                    <line key={r} data-beam className="corn-info__beam" />
                ))}
                <circle className="corn-info__core" r={R_CORE} />
                <circle data-core-arc className="corn-info__core-arc" r={R_CORE + 6} pathLength={100} />
            </svg>
            <div ref={icons} className="corn-info__icons">
                {spec.current.flatMap((ring, r) =>
                    ring.map((_, n) => (
                        <div key={`${r}-${n}`} data-icon className="corn-info__icon">
                            <span className="corn-sprite" />
                        </div>
                    )),
                )}
            </div>
        </div>
    );
}

function Library({ on, onClose }: { on: boolean; onClose: () => void }) {
    return (
        <section className={`corn-hs corn-hs--library${on ? ' is-on' : ''}`} aria-hidden={!on} aria-label="The seed archive">
            <div className="corn-hs__copy">
                <h2 className="corn-gl-anchor corn-chapter__title" data-gl-hs="library">
                    {LIBRARY.title.map((l) => (
                        <span key={l}>{l}</span>
                    ))}
                </h2>
                <p className="corn-hs__body">{LIBRARY.body}</p>
            </div>
            <Infographic on={on} />
            <CloseButton onClose={onClose} on={on} label="Close the archive" />
        </section>
    );
}

// ── tests ────────────────────────────────────────────────────────────────────

function Tests({ on, onClose, onPick }: { on: boolean; onClose: () => void; onPick: (k: number) => void }) {
    const condition = useUi((s) => s.condition);
    const picking = condition < 0;
    return (
        <section className={`corn-hs corn-hs--tests${on ? ' is-on' : ''}${picking ? ' is-picking' : ''}`} aria-hidden={!on} aria-label="Field conditions">
            <div className="corn-hs__pick">
                <h2 className="corn-gl-anchor corn-chapter__title" data-gl-hs="tests">
                    {TESTS.title.map((l) => (
                        <span key={l}>{l}</span>
                    ))}
                </h2>
                <p className="corn-hs__label">{TESTS.pick}</p>
            </div>
            {TESTS.conditions.map((c, k) => (
                <div key={c.id} className={`corn-hs__cond${condition === k ? ' is-on' : ''}`} aria-hidden={condition !== k}>
                    <h2 className="corn-gl-anchor corn-chapter__title" data-gl-hs={`cond-${k}`}>
                        <span>{c.label}</span>
                    </h2>
                    <p className="corn-hs__body">{c.body}</p>
                </div>
            ))}
            <ul className="corn-icons" role="radiogroup" aria-label={TESTS.pick}>
                {TESTS.conditions.map((c, k) => (
                    <li key={c.id} style={{ '--k': k } as CSSProperties}>
                        <button
                            type="button"
                            role="radio"
                            aria-checked={condition === k}
                            className={`corn-icon${condition === k ? ' is-active' : ''}`}
                            onClick={() => onPick(k)}
                            tabIndex={on ? 0 : -1}
                        >
                            <svg className="corn-icon__ring" viewBox="0 0 120 120" aria-hidden>
                                <circle className="corn-icon__base" cx="60" cy="60" r="58" />
                                <circle className="corn-icon__arc" cx="60" cy="60" r="58" pathLength="100" />
                            </svg>
                            <Sprite seq={c.id} on={on} className="corn-icon__sprite" />
                            <span className="corn-icon__label">{c.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
            <CloseButton onClose={onClose} on={on} label="Close the tests" />
        </section>
    );
}

// ── kernel ───────────────────────────────────────────────────────────────────

function Facts({ on, onClose, onFact }: { on: boolean; onClose: () => void; onFact: (k: number) => void }) {
    const fact = useUi((s) => s.fact);
    const touched = useRef(false);
    const helpRef = useRef<HTMLParagraphElement>(null);
    useEffect(() => {
        if (!on) return;
        touched.current = false;
        helpRef.current?.classList.remove('is-gone');
        const down = (e: PointerEvent) => {
            const x0 = e.clientX;
            const move = (m: PointerEvent) => {
                if (Math.abs(m.clientX - x0) > 10 && !touched.current) {
                    touched.current = true;
                    helpRef.current?.classList.add('is-gone');
                }
            };
            const up = () => {
                window.removeEventListener('pointermove', move);
                window.removeEventListener('pointerup', up);
            };
            window.addEventListener('pointermove', move);
            window.addEventListener('pointerup', up);
        };
        window.addEventListener('pointerdown', down);
        return () => window.removeEventListener('pointerdown', down);
    }, [on]);
    return (
        <section className={`corn-hs corn-hs--kernel${on ? ' is-on' : ''}`} aria-hidden={!on} aria-label="The new class">
            {KERNEL_FACTS.facts.map((f, k) => (
                <div key={f.label} className={`corn-hs__cond${fact === k ? ' is-on' : ''}`} aria-hidden={fact !== k}>
                    <h2 className="corn-gl-anchor corn-chapter__title" data-gl-hs={`fact-${k}`}>
                        <span>{f.label}</span>
                    </h2>
                    <p className="corn-hs__body">{f.body}</p>
                </div>
            ))}
            <p ref={helpRef} className="corn-hs__help">
                <span className="corn-hs__help-arrow" aria-hidden>
                    ←
                </span>
                {KERNEL_FACTS.help}
                <span className="corn-hs__help-arrow" aria-hidden>
                    →
                </span>
            </p>
            <div className="corn-dots" role="tablist" aria-label="Facts">
                {KERNEL_FACTS.facts.map((f, k) => (
                    <button
                        key={f.label}
                        type="button"
                        role="tab"
                        aria-selected={fact === k}
                        aria-label={f.label}
                        className={`corn-dots__dot${fact === k ? ' is-on' : ''}`}
                        onClick={() => onFact(k)}
                        tabIndex={on ? 0 : -1}
                    />
                ))}
            </div>
            <CloseButton onClose={onClose} on={on} label="Close the new class" />
        </section>
    );
}

export default function Hotspots({ onClose, onPick, onFact }: { onClose: () => void; onPick: (k: number) => void; onFact: (k: number) => void }) {
    const hotspot = useUi((s) => s.hotspot);
    return (
        <>
            <Library on={hotspot === 'library'} onClose={onClose} />
            <Tests on={hotspot === 'tests'} onClose={onClose} onPick={onPick} />
            <Facts on={hotspot === 'kernel'} onClose={onClose} onFact={onFact} />
        </>
    );
}

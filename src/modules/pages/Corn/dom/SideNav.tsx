'use client';

import { type CSSProperties, useEffect, useRef, useState } from 'react';

import { CHAPTERS, sectionOf, SECTIONS } from '../data/story';
import { Timeline } from '../engine/Timeline';
import { useUi } from '../store';

/**
 * Right edge: one slot per section (science, field trials, outcome), 53 px apart around mid-height.
 * The current section's slot holds a ring whose track is cut into that section's scroll snaps and
 * whose arc fills with the scroll through the section (the engine writes the arc each frame,
 * `data-nav-arc`). On a section change the ring glides to the new slot and the section's name slides
 * in from the right; it rests, then slides out to the left (so does the previous one, at once).
 */
const LABEL_MS = 2800;
const timeline = new Timeline();
const SEGMENTS = SECTIONS.map((_, k) => timeline.segmentsOf(k));
const GAP = 7; // track gap between snaps, in % of the circumference (readable at 40 px)

type LabelState = 'pre' | 'in' | 'out' | 'reset';

export default function SideNav({ onGo }: { onGo: (chapter: number) => void }) {
    const nearest = useUi((s) => s.nearest);
    const menuOpen = useUi((s) => s.menuOpen);
    const section = sectionOf(nearest);
    const index = SECTIONS.findIndex((s) => s.id === section);
    const [labels, setLabels] = useState<LabelState[]>(() => SECTIONS.map(() => 'pre'));
    const prev = useRef(-1);

    useEffect(() => {
        const from = prev.current;
        prev.current = index;
        if (index === from) return;
        // the old name leaves to the left; the new one is placed on the right without a transition…
        setLabels((l) => l.map((st, k) => (k === from && st === 'in' ? 'out' : k === index ? 'reset' : st)));
        if (index < 0) return;
        // …then slides in on the next frame, rests, and leaves to the left
        let raf = requestAnimationFrame(() => {
            raf = requestAnimationFrame(() => setLabels((l) => l.map((st, k) => (k === index ? 'in' : st))));
        });
        const t = setTimeout(() => setLabels((l) => l.map((st, k) => (k === index && st === 'in' ? 'out' : st))), LABEL_MS);
        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(t);
        };
    }, [index]);

    const slot = Math.max(0, index);
    const n = SEGMENTS[slot];
    const dash = `${(100 / n - GAP).toFixed(2)} ${GAP}`;

    return (
        <nav className={`corn-nav${index >= 0 && !menuOpen ? ' is-on' : ''}`} aria-label="Sections">
            {SECTIONS.map((s, k) => (
                <span key={s.id} className={`corn-nav__label is-${labels[k]}`} style={{ '--slot': k } as CSSProperties} aria-hidden>
                    {s.label}
                </span>
            ))}
            <span className="corn-nav__ring" style={{ '--slot': slot } as CSSProperties} aria-hidden>
                <svg viewBox="0 0 40 40">
                    <circle className="corn-nav__track" cx="20" cy="20" r="17" pathLength="100" strokeDasharray={dash} strokeDashoffset={-GAP / 2} />
                    <circle data-nav-arc className="corn-nav__arc" cx="20" cy="20" r="17" pathLength="100" strokeDasharray="0 100" />
                    <circle className="corn-nav__core" cx="20" cy="20" r="2" />
                </svg>
            </span>
            {SECTIONS.map((s, i) => (
                <button
                    key={s.id}
                    type="button"
                    className={`corn-nav__dot${i === index ? ' is-current' : ''}`}
                    style={{ '--slot': i } as CSSProperties}
                    aria-label={s.label}
                    aria-current={i === index}
                    onClick={() => onGo(CHAPTERS.findIndex((c) => c.section === s.id))}
                />
            ))}
        </nav>
    );
}

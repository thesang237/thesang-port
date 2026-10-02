'use client';

import { useRef } from 'react';

import { STORY } from '../../data/copy';
import { VIDEOS } from '../../data/media';
import { ease, seg, W } from '../../scroll/timeline';
import { film } from '../../scroll/useScrollStore';
import { Caption, Hacky, Hair, Lines } from '../ui/Text';
import { useAct } from '../ui/useAct';

/**
 * Story rows over the GLB painting. The rows form one tall column that scrolls with the camera pan
 * (scrubbed), each row's text reveals when the row arrives. Row 4 frames the keeper symbol that the
 * logo wipe (WebGL, gl/LogoWipe.ts) resolves into.
 */
/** column offset (svh) at film screens t, smooth between keyframes */
const COLUMN: [number, number][] = [
    [5.0, 33],
    [5.7, 0],
    [6.1, -5],
    [6.75, -34],
    [7.35, -67],
    [8.3, -80],
    [9.0, -200],
];
function columnY(t: number) {
    if (t <= COLUMN[0][0]) return COLUMN[0][1];
    for (let i = 1; i < COLUMN.length; i++) {
        const [t1, y1] = COLUMN[i];
        const [t0, y0] = COLUMN[i - 1];
        if (t <= t1) return y0 + (y1 - y0) * ease.smooth(seg(t, t0, t1));
    }
    return COLUMN[COLUMN.length - 1][1];
}

/** each line: fades in over 0.35 screens and rises a little, the next one starts 0.14 screens later */
function scrubLines(root: HTMLElement, sel: string, t: number, start: number) {
    root.querySelectorAll<HTMLElement>(`${sel} .kpr-line > span`).forEach((el, i) => {
        const k = ease.out(seg(t, start + i * 0.14, start + i * 0.14 + 0.35));
        const o = k.toFixed(3);
        if (el.style.opacity !== o) {
            el.style.opacity = o;
            el.style.transform = `translate3d(0, ${((1 - k) * 0.25).toFixed(3)}em, 0)`;
        }
    });
}

/**
 * Lines that scroll up into view: each fades in while it travels from the bottom edge to 72 % of the
 * screen height. Positions come from one measurement (per viewport size) plus the known column
 * offset, so the frame loop never reads layout.
 */
const lineTops = new WeakMap<HTMLElement, { top: number; colY: number; vh: number }>();
function scrubLinesInView(root: HTMLElement, sel: string, t: number) {
    const vh = window.innerHeight;
    const colY = columnY(t);
    root.querySelectorAll<HTMLElement>(`${sel} .kpr-line > span`).forEach((el) => {
        let m = lineTops.get(el);
        if (!m || m.vh !== vh) {
            m = { top: el.getBoundingClientRect().top, colY, vh };
            lineTops.set(el, m);
        }
        const top = m.top + ((colY - m.colY) * vh) / 100;
        const k = ease.out(seg(top / vh, 1.0, 0.72));
        const o = k.toFixed(3);
        if (el.style.opacity !== o) {
            el.style.opacity = o;
            el.style.transform = `translate3d(0, ${((1 - k) * 0.25).toFixed(3)}em, 0)`;
        }
    });
}

export default function Story() {
    const ref = useRef<HTMLElement>(null);
    const r1 = useRef<HTMLDivElement>(null);
    const r2 = useRef<HTMLDivElement>(null);
    const r3 = useRef<HTMLDivElement>(null);
    const r4 = useRef<HTMLDivElement>(null);

    // whole section: visible over the painting
    useAct(ref, [W.storyOpen[1] - 0.1, W.storyOut[1]], (root) => {
        const t = film.view;
        const col = root.querySelector<HTMLElement>('.kpr-story__col')!;
        // the column drifts with the painting's camera (keyframes read off the reference recording):
        // row 1 rises from mid-screen and settles at the top, row 3 rises through the screen as the
        // camera goes down the mountains, row 4 is in place under the logo wipe
        col.style.transform = `translate3d(0, ${columnY(t)}svh, 0)`;
        // the two big headings fade in line by line with the scroll (and back out when scrolling up)
        scrubLines(root, '.kpr-story__h1a', t, 5.0);
        scrubLinesInView(root, '.kpr-story__h1b', t);
        // loading percent in the terminal block (only touches the DOM when the number changes)
        const pct = Math.round(seg(t, 5.0, 8.4) * 100);
        const el = root.querySelector<HTMLElement>('[data-pct]');
        if (el && el.dataset.pct !== String(pct)) {
            el.dataset.pct = String(pct);
            el.textContent = String(pct).padStart(2, '0');
        }
        // degrees readout follows the pointer a little
        const deg = root.querySelector<HTMLElement>('[data-deg]');
        if (deg) {
            const v = (33.8 + film.spx * 4).toFixed(1);
            if (deg.dataset.deg !== v) {
                deg.dataset.deg = v;
                deg.textContent = `${v}°`;
            }
        }
    });
    useAct(r1, [W.storyRow1[0], 7.45]);
    useAct(r2, W.storyRow2);
    useAct(r3, [6.4, 9.1]);
    useAct(r4, [W.storyRow4[0] + 0.1, W.storyRow4[1]]);

    return (
        <section ref={ref} className="kpr-sec kpr-story" aria-label="Story">
            <div className="kpr-story__col">
                <div ref={r1} className="kpr-story__row kpr-story__row1">
                    <Hair dir="h" className="kpr-story__top" />
                    <div className="kpr-story__main">
                        <Hair dir="v" className="kpr-story__vr" d={0.15} />
                        <div className="kpr-title1">
                            <Caption text={STORY.row1.index} className="kpr-title1__cap" d={0.1} />
                            <Lines lines={STORY.row1.lines} className="kpr-h1 kpr-story__h1a" indent scrub />
                        </div>
                    </div>
                    <div className="kpr-story__side">
                        <pre className="kpr-terminal kpr-cap3" data-r="fade" data-d="0.4">
                            {STORY.terminal.split('{p}')[0]}
                            <span data-pct="0">00</span>
                            {STORY.terminal.split('{p}')[1]}
                        </pre>
                    </div>
                </div>
                <div ref={r2} className="kpr-story__row kpr-story__row2">
                    <Hair dir="h" className="kpr-story__top" />
                    <div className="kpr-story__main">
                        <Hair dir="v" className="kpr-story__vr" d={0.1} />
                    </div>
                    <div className="kpr-story__side">
                        <div className="kpr-coords kpr-cap3">
                            <Hacky text={STORY.coords} d={0.2} />
                        </div>
                        <div className="kpr-degrees kpr-cap3" data-r="fade" data-d="0.35">
                            <i className="kpr-degrees__bar" aria-hidden="true">
                                <b />
                                <b />
                                <b />
                            </i>
                            <span data-deg="33.8">{STORY.degrees}</span>
                        </div>
                        <video className="kpr-topo" data-r="fade" data-d="0.5" loop muted playsInline preload="auto" aria-hidden="true">
                            <source src={VIDEOS.topo.hevc} type='video/mp4; codecs="hvc1"' />
                            <source src={VIDEOS.topo.webm} type="video/webm" />
                        </video>
                    </div>
                </div>
                <div ref={r3} className="kpr-story__row kpr-story__row3">
                    <Hair dir="h" className="kpr-story__top" />
                    <div className="kpr-story__side kpr-story__side--left">
                        <Hair dir="v" className="kpr-story__vr kpr-story__vr--right" d={0.1} />
                        <Hair dir="h" className="kpr-story__diag" d={0.25} />
                    </div>
                    <div className="kpr-story__main kpr-story__main--right">
                        <div className="kpr-title2">
                            <Caption text={STORY.row3.index} className="kpr-title1__cap" d={0.1} />
                            <Lines lines={STORY.row3.lines} className="kpr-h1 kpr-story__h1b" indent scrub />
                        </div>
                    </div>
                </div>
                <div ref={r4} className="kpr-story__row kpr-story__row4">
                    <Hair dir="h" className="kpr-story__top" />
                    <div className="kpr-story__side">
                        <Hair dir="v" className="kpr-story__vr kpr-story__vr--right" d={0.1} />
                    </div>
                    <div className="kpr-story__main kpr-story__main--sym">
                        <Hair dir="v" className="kpr-story__vr kpr-story__vr--right" d={0.15} />
                        <Caption text={STORY.symbol} className="kpr-story__symcap" d={0.4} />
                    </div>
                    <div className="kpr-story__side" />
                </div>
            </div>
        </section>
    );
}

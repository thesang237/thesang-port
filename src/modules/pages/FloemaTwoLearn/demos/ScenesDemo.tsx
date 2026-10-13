'use client';
import { useEffect, useRef } from 'react';

import { clamp, gsap, ScrollTrigger, useParams } from '../kit/runtime';
import { Demo, Landscape, Slider, Toggle } from '../kit/ui';
const defaults = { parallax: 4, broken: false };
export default function ScenesDemo() {
    const { p, set, reset } = useParams(defaults);
    const host = useRef<HTMLDivElement>(null);
    const track = useRef<HTMLDivElement>(null);
    const dial = useRef<HTMLInputElement>(null);
    const value = useRef<HTMLOutputElement>(null);
    const label = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        const el = host.current;
        const node = track.current;
        if (!el || !node) return;
        const ctx = gsap.context(() => {
            const images = Array.from(node.querySelectorAll<HTMLElement>('.f2l-film-photo'));
            gsap.set(images, { clipPath: 'inset(0% 0% 0% 0%)', yPercent: 0 });
            gsap.set(images.slice(1), p.broken ? { yPercent: 100 } : { clipPath: 'inset(100% 0% 0% 0%)' });
            const timeline = gsap.timeline({
                scrollTrigger: {
                    trigger: node,
                    scroller: el,
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: true,
                    onUpdate: (self) => {
                        if (dial.current) dial.current.value = String(self.progress * 100);
                        if (value.current) value.current.textContent = self.progress.toFixed(3);
                        if (label.current) label.current.textContent = `SHOT 0${Math.min(4, Math.floor(self.progress * 4 + 0.4)) + 1}`;
                    },
                },
            });
            images.forEach((image, i) => {
                if (i > 0)
                    timeline.fromTo(
                        image,
                        p.broken ? { yPercent: 100 } : { clipPath: 'inset(100% 0% 0% 0%)' },
                        { ...(p.broken ? { yPercent: 0 } : { clipPath: 'inset(0% 0% 0% 0%)' }), duration: 0.15, ease: 'none' },
                        (i - 0.6) / 4,
                    );
                timeline.fromTo(image.firstElementChild, { yPercent: i ? -p.parallax : 0 }, { yPercent: 0, duration: 0.25, ease: 'none' }, clamp((i - 0.6) / 4));
            });
            timeline.to({}, { duration: 0.001 }, 1);
        }, node);
        ScrollTrigger.refresh();
        return () => ctx.revert();
    }, [p.parallax, p.broken]);
    return (
        <Demo
            title="A five-shot scroll composition"
            hint="Scroll inside the picture, or drag the progress dial. Then scroll backward."
            reset={() => {
                reset();
                host.current?.scrollTo({ top: 0 });
            }}
            tryThis="Switch to moving the whole image. Then set parallax to 30%. Notice the difference between a growing window and a sliding photograph."
            controls={
                <>
                    <label className="f2l-slider">
                        <span>
                            Scroll progress<output ref={value}>0.000</output>
                        </span>
                        <input
                            ref={dial}
                            aria-label="Scroll progress"
                            type="range"
                            min="0"
                            max="100"
                            defaultValue="0"
                            step=".1"
                            onChange={(e) => {
                                const el = host.current;
                                if (el) el.scrollTop = (Number(e.target.value) / 100) * (el.scrollHeight - el.clientHeight);
                            }}
                        />
                        <small>Moves the real nested scroll position through its full track.</small>
                    </label>
                    <Slider label="Inner parallax" value={p.parallax} min={0} max={30} onChange={(v) => set('parallax', v)} help="The image moves this percentage while its mask reveals." suffix="%" />
                    <Toggle label="Move whole image (compare)" checked={p.broken} onChange={(v) => set('broken', v)} help="Replaces the source’s growing mask with a sliding panel." />
                    <p className="f2l-live-status">9 screens of track · 8 screens of travel</p>
                </>
            }
        >
            <div className="f2l-film-window" data-lenis-prevent ref={host} tabIndex={0} aria-label="Scroll inside this five-scene demonstration">
                <div ref={track} className="f2l-film-track">
                    <div className="f2l-film-sticky">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div className="f2l-film-photo" key={i}>
                                <div>
                                    <Landscape variant={i} />
                                </div>
                            </div>
                        ))}
                        <div className="f2l-film-copy">
                            <span ref={label}>SHOT 01</span>
                            <strong>
                                A place
                                <br />
                                to belong.
                            </strong>
                            <small>SCROLL HERE ↓</small>
                        </div>
                    </div>
                </div>
            </div>
        </Demo>
    );
}

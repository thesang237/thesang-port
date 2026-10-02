'use client';

import { useRef } from 'react';

import { COLLECTION, GALLERY } from '../../data/copy';
import { IMAGES, VIDEOS } from '../../data/media';
import { ease, seg, sub, W } from '../../scroll/timeline';
import { film } from '../../scroll/useScrollStore';
import { ArrowDown, DoubleArrow, Measure } from '../icons';
import { Caption, Hair, Lines } from '../ui/Text';
import { useAct } from '../ui/useAct';

/** Collection intro: vertical 10K counter, portrait anchor (WebGL card), crystal video, eye close-up. */
export function CollectionIntro() {
    const ref = useRef<HTMLElement>(null);
    useAct(ref, [W.collectionIn[0], W.galleryIn[0] + 0.55], (root) => {
        const t = film.view;
        const enter = 1 - ease.inOutStrong(seg(t, W.collectionIn[0], W.collectionIn[1] - 0.1));
        const leave = ease.inOutStrong(sub(t, W.galleryIn, 0, 0.6));
        const y = (enter - leave) * 100;
        root.style.setProperty('--kpr-slide', `${y}svh`);
        const n = Math.round(COLLECTION.count * ease.out(seg(t, 10.15, 10.95)));
        const count = root.querySelector<HTMLElement>('[data-count]')!;
        if (count.dataset.count !== String(n)) {
            count.dataset.count = String(n);
            count.textContent = String(n).padStart(2, '0');
        }
    });

    return (
        <section ref={ref} className="kpr-sec kpr-collection" aria-label="Collection">
            <div className="kpr-collection__left kpr-slide">
                <h2 className="kpr-count">
                    <span className="kpr-sr">{COLLECTION.count},000 collectibles</span>
                    <span aria-hidden="true" className="kpr-count__num">
                        <span data-count="0">00</span>
                        <span>{COLLECTION.unit}</span>
                    </span>
                </h2>
                <footer className="kpr-count__foot kpr-cap2">
                    <DoubleArrow className="kpr-count__arrows" />
                    <span>{COLLECTION.footer}</span>
                </footer>
            </div>
            <div className="kpr-collection__hero" data-gl-anchor="col-portrait">
                <Hair dir="v" className="kpr-collection__vr" d={0.4} />
            </div>
            <div className="kpr-collection__right kpr-slide">
                <div className="kpr-collection__crystal">
                    <Measure className="kpr-collection__measure" />
                    <video className="kpr-collection__video" loop muted playsInline preload="auto" aria-hidden="true">
                        <source src={VIDEOS.crystal.hevc} type='video/mp4; codecs="hvc1"' />
                        <source src={VIDEOS.crystal.webm} type="video/webm" />
                    </video>
                    <Hair dir="h" className="kpr-collection__hr" d={0.3} />
                    <Caption text={COLLECTION.crystal} className="kpr-collection__cap" d={0.5} />
                </div>
                <div className="kpr-collection__traits">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={IMAGES.faceTraits} alt="Close-up of a character's eye" className="kpr-collection__img" />
                    <Caption text={COLLECTION.traits} className="kpr-collection__cap kpr-collection__cap--in" d={0.6} />
                </div>
            </div>
        </section>
    );
}

/** Gallery: heading + body over lavender, ring anchor (WebGL ring), drag surface, centre-slot arrows. */
export function Gallery() {
    const ref = useRef<HTMLElement>(null);
    const drag = useRef({ active: false, x: 0, last: 0, v: 0 });

    useAct(ref, [W.galleryIn[0] + 0.45, W.galleryOut[1] - 0.2], (root) => {
        const t = film.view;
        const inK = 1 - ease.inOutStrong(sub(t, W.galleryIn, 0.4, 1));
        const outK = ease.inOutStrong(sub(t, W.galleryOut, 0, 0.7));
        root.style.setProperty('--kpr-slide', `${inK * 38 - outK * 60}svh`);
        root.style.setProperty('--kpr-out', String(outK));
        // momentum after a drag (frame-rate independent decay)
        const d = drag.current;
        if (!d.active && Math.abs(film.ringMomentum) > 1e-4) {
            film.ringDrag += film.ringMomentum * film.dt;
            film.ringMomentum *= Math.exp(-3 * film.dt);
        }
    });

    const onDown = (e: React.PointerEvent) => {
        drag.current = { active: true, x: e.clientX, last: performance.now(), v: 0 };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        film.ringMomentum = 0;
    };
    const onMove = (e: React.PointerEvent) => {
        const d = drag.current;
        if (!d.active) return;
        const dx = e.clientX - d.x;
        const now = performance.now();
        const da = (dx / Math.max(320, film.vw)) * 2.4;
        film.ringDrag += da;
        d.v = da / Math.max(0.008, (now - d.last) / 1000);
        d.x = e.clientX;
        d.last = now;
    };
    const onUp = () => {
        drag.current.active = false;
        film.ringMomentum = Math.max(-6, Math.min(6, drag.current.v));
    };

    return (
        <section ref={ref} className="kpr-sec kpr-gallery" aria-label="Gallery">
            <div className="kpr-gallery__tl kpr-slide">
                <div className="kpr-title1">
                    <Caption text={GALLERY.index} className="kpr-title1__cap" />
                    <Lines lines={GALLERY.lines} className="kpr-h1" indent d={0.08} />
                </div>
                <Hair dir="h" className="kpr-gallery__hr" d={0.2} />
            </div>
            <div className="kpr-gallery__tr kpr-slide">
                <Caption text={GALLERY.caption} className="kpr-gallery__cap" d={0.2} />
                <p className="kpr-body2" data-r="fade" data-d="0.3">
                    {GALLERY.body}
                </p>
                <Hair dir="h" className="kpr-gallery__hr" d={0.3} />
            </div>
            <div
                className="kpr-gallery__ring"
                data-gl-anchor="gallery-ring"
                data-cursor="drag"
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                role="img"
                aria-label="A ring of collectible character portraits. Drag to spin."
            >
                <ArrowDown className="kpr-gallery__arrow is-up" data-r="fade" data-d="0.5" />
                <ArrowDown className="kpr-gallery__arrow is-down" data-r="fade" data-d="0.55" />
            </div>
            <Hair dir="h" className="kpr-gallery__mid" d={0.4} />
        </section>
    );
}

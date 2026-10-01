'use client';

import { forwardRef, type MouseEvent } from 'react';

import { GALLERY } from '../data';

type Props = { onClose: (e: MouseEvent) => void };

// running [01]…[18] labels (spacer cells are skipped)
let count = 0;
const ROWS = GALLERY.map((row) => row.map((cell) => (cell ? { ...cell, n: ++count } : null)));
const TOTAL = count;

/** Full-screen gallery overlay (blurred page behind, 18 works in a 1fr / 2fr rhythm). Opened from [Gallery]. */
const Gallery = forwardRef<HTMLDivElement, Props>(function Gallery({ onClose }, ref) {
    return (
        <div ref={ref} className="aim-gallery" data-lenis-prevent role="dialog" aria-modal="true" aria-label="Gallery">
            <div className="aim-gallery__popup" data-aim="gallery-popup" data-lenis-prevent>
                <div className="aim-gallery__head">
                    <div className="aim-gallery__close">
                        <button type="button" className="aim-navlink" onClick={onClose} data-aim="gallery-close">
                            <span className="aim-t">[Close]</span>
                        </button>
                    </div>
                    <div className="aim-gallery__rule">
                        <p className="aim-t aim-gallery__label">Gallery:</p>
                    </div>
                </div>
                <div className="aim-gallery__cut" data-aim="gallery-cut" data-lenis-prevent>
                    <div className="aim-gallery__scroller" data-lenis-prevent>
                        {ROWS.map((row, r) => (
                            <div key={r} className="aim-gallery__row">
                                {row.map((cell, c) => {
                                    if (!cell) return <div key={c} className="aim-gallery__cell aim-gallery__cell--1 aim-gallery__cell--ghost" />;
                                    return (
                                        <figure key={c} className={`aim-gallery__cell aim-gallery__cell--${cell.wide ? 2 : 1}`}>
                                            <div className="aim-gallery__img">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={cell.img} alt={cell.alt} loading="lazy" />
                                            </div>
                                            <figcaption className="aim-t aim-gallery__label">[{String(cell.n).padStart(2, '0')}]</figcaption>
                                        </figure>
                                    );
                                })}
                            </div>
                        ))}
                        <div className="aim-gallery__rule aim-gallery__rule--counter">
                            <p className="aim-t aim-gallery__label">
                                {TOTAL} of {TOTAL}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="aim-gallery__blur" data-aim="gallery-blur" />
        </div>
    );
});

export default Gallery;

'use client';
import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import SplitType from 'split-type';

import { collectionsScrollRef } from '../canvas/CollectionsMedia';
import { collections, products } from '../data/content';
import { useButtonAnimation } from '../hooks/useButtonAnimation';
import { useLinkAnimation } from '../hooks/useLinkAnimation';
import { useFloemaStore } from '../store/floemaStore';
import { lerp } from '../utils/math';

export default function CollectionsPage() {
    const isPreloaded = useFloemaStore((s) => s.isPreloaded);
    const activeDetail = useFloemaStore((s) => s.activeDetail);
    const openDetail = useFloemaStore((s) => s.openDetail);
    const closeDetail = useFloemaStore((s) => s.closeDetail);
    const pageRef = useRef<HTMLDivElement>(null);
    const [activeCollection, setActiveCollection] = useState(0);
    const detailRefs = useRef<(HTMLDivElement | null)[]>([]);
    const splitRefs = useRef<(SplitType | null)[]>([]);

    useButtonAnimation(pageRef);
    useLinkAnimation(pageRef);

    // Animate detail panel in/out with rich staggered reveal
    useEffect(() => {
        detailRefs.current.forEach((el, i) => {
            if (!el) return;
            if (i === activeDetail) {
                el.style.pointerEvents = 'auto';
                // Fade wrapper in
                gsap.to(el, { autoAlpha: 1, duration: 0.6, ease: 'expo.out' });

                // Collection label
                const label = el.querySelector<HTMLElement>('.floema-detail__information__collection__text');
                if (label) {
                    gsap.fromTo(label, { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.8, delay: 0.1, ease: 'expo.out' });
                }

                // Title — split into chars
                const titleEl = el.querySelector<HTMLElement>('.floema-detail__information__title');
                if (titleEl) {
                    splitRefs.current[i]?.revert();
                    const split = new SplitType(titleEl, { types: 'chars' });
                    splitRefs.current[i] = split;
                    gsap.fromTo(split.chars ?? [], { yPercent: 120, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.8, stagger: 0.02, delay: 0.15, ease: 'expo.out' });
                }

                // Highlight icons + text
                const highlights = el.querySelectorAll<HTMLElement>('.floema-detail__information__highlight');
                gsap.fromTo(highlights, { xPercent: -20, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.7, stagger: 0.08, delay: 0.25, ease: 'expo.out' });

                // Info list items
                const items = el.querySelectorAll<HTMLElement>('.floema-detail__information__item');
                gsap.fromTo(items, { yPercent: 40, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.7, stagger: 0.06, delay: 0.3, ease: 'expo.out' });

                // Footer link
                const footerLink = el.querySelector<HTMLElement>('.floema-detail__information__footer');
                if (footerLink) {
                    gsap.fromTo(footerLink, { yPercent: 30, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, delay: 0.45, ease: 'expo.out' });
                }
            } else {
                el.style.pointerEvents = 'none';
                gsap.to(el, { autoAlpha: 0, duration: 0.4, ease: 'expo.in' });
                // Revert split
                splitRefs.current[i]?.revert();
                splitRefs.current[i] = null;
            }
        });
    }, [activeDetail]);

    function handleOpenDetail(index: number) {
        openDetail(index);
        const colIdx = Math.floor(index / (products.length / collections.length));
        setActiveCollection(Math.min(colIdx, collections.length - 1));
    }

    function handleCloseDetail() {
        closeDetail();
    }

    // Click on the canvas area → map to card index via current scroll position
    function handleCanvasClick(e: React.MouseEvent) {
        if (activeDetail !== null) return;
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const cardStepPx = 46.36 * rem; // (35.76rem card + 2×5.3rem padding)
        const offsetCards = (e.clientX - window.innerWidth / 2) / cardStepPx;
        const idx = Math.round(collectionsScrollRef.current + offsetCards);
        const clamped = Math.max(0, Math.min(idx, products.length - 1));
        handleOpenDetail(clamped);
    }

    return (
        <div ref={pageRef} style={{ position: 'absolute', inset: 0 }}>
            <div className={`floema-collections${isPreloaded ? ' active' : ''}${activeDetail !== null ? ' floema-collections--open' : ''}`}>
                <div className="floema-collections__wrapper">
                    {/* Vertical titles — infinite scroll */}
                    <CollectionsTitles activeCollection={activeCollection} onChangeCollection={setActiveCollection} />

                    {/* Gallery — visibility:hidden for layout only; click overlay handles interaction */}
                    <div className="floema-collections__gallery">
                        <div className="floema-collections__gallery__wrapper">
                            {products.map((product, i) => (
                                <div key={i} className="floema-collections__gallery__link">
                                    <figure className="floema-collections__gallery__media" data-index={String(Math.floor(i / (products.length / collections.length)))}>
                                        <img
                                            className="floema-collections__gallery__media__image"
                                            alt={product.image.alt}
                                            data-src={product.image.url}
                                            style={{ visibility: 'hidden', display: 'block', width: '100%', aspectRatio: '35.76/50.48' }}
                                        />
                                    </figure>
                                </div>
                            ))}
                        </div>
                        {/* Transparent click capture — sits above canvas, maps click → card index */}
                        <div style={{ position: 'absolute', inset: 0, zIndex: 2, cursor: 'pointer' }} onClick={handleCanvasClick} />
                    </div>

                    {/* Collection info text */}
                    <div className="floema-collections__content">
                        {collections.map((col, i) => (
                            <article key={i} className={`floema-collections__article${activeCollection === i ? ' active' : ''}`}>
                                <h2 className="floema-collections__article__title">
                                    <span className="floema-collections__article__title__text">{col.title} Collection</span>
                                </h2>
                                <p className="floema-collections__article__description">{col.description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detail panels — GSAP drives opacity via detailRefs */}
            {products.map((product, i) => (
                <div
                    key={i}
                    ref={(el) => {
                        detailRefs.current[i] = el;
                    }}
                    className="floema-detail"
                    style={{
                        background: product.background,
                        visibility: 'hidden',
                        opacity: 0,
                        pointerEvents: 'none',
                    }}
                >
                    <div className="floema-detail__wrapper">
                        <figure className="floema-detail__media">
                            <img className="floema-detail__media__image" alt={product.image.alt} src={product.image.url} onLoad={(e) => (e.target as HTMLImageElement).classList.add('loaded')} />
                        </figure>
                        <div className="floema-detail__information">
                            <p className="floema-detail__information__collection">
                                <span className="floema-detail__information__collection__text">{product.collection}</span>
                            </p>
                            <h1 className="floema-detail__information__title" dangerouslySetInnerHTML={{ __html: product.title.replace(' ', '<br />') }} />
                            <div className="floema-detail__information__content">
                                <div className="floema-detail__information__highlights">
                                    {product.highlights.map((h, j) => (
                                        <p key={j} className="floema-detail__information__highlight">
                                            <svg
                                                className={`floema-detail__information__highlight__icon floema-detail__information__highlight__icon--${h.icon}`}
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 40 40"
                                            >
                                                {h.icon === 'arrow' ? (
                                                    <>
                                                        <path stroke="#fff" d="M14.84,25.46l11.31-11.31" />
                                                        <path fill="#fff" d="M30.75,9.55l-0.66,2.36l-0.05,2.59l-1.93-2.31l-2.31-1.93l2.59-0.05L30.75,9.55z" />
                                                        <path fill="#fff" d="M10.25,30.05l0.66-2.36l0.05-2.59l1.93,2.31l2.31,1.93l-2.59,0.05L10.25,30.05z" />
                                                        <path fill="none" stroke="#fff" d="M20,0.5c10.77,0,19.5,8.73,19.5,19.5S30.77,39.5,20,39.5S0.5,30.77,0.5,20S9.23,0.5,20,0.5z" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <path
                                                            fill="#fff"
                                                            d="M24.26,9.87l-2.76,8.6l8.72-2.63l-8.16,4.13l8.15,4.26l-8.71-2.82l2.82,8.91l-4.26-8.34l-4.14,8.15l2.63-8.72l-8.6,2.75l8.15-4.2l-8.34-4.33l8.78,2.82l-2.82-8.78l4.33,8.34L24.26,9.87z"
                                                        />
                                                        <path fill="none" stroke="#fff" d="M20,0.5c10.77,0,19.5,8.73,19.5,19.5S30.77,39.5,20,39.5S0.5,30.77,0.5,20S9.23,0.5,20,0.5z" />
                                                    </>
                                                )}
                                            </svg>
                                            <span className="floema-detail__information__highlight__text">{h.text}</span>
                                        </p>
                                    ))}
                                </div>
                                <div className="floema-detail__information__list">
                                    {product.informations.map((info, j) => (
                                        <p key={j} className="floema-detail__information__item">
                                            <strong className="floema-detail__information__item__title">
                                                <span className="floema-detail__information__item__title__text">{info.label}</span>
                                            </strong>
                                            <span className="floema-detail__information__item__description">{info.description}</span>
                                        </p>
                                    ))}
                                </div>
                                <footer className="floema-detail__information__footer">
                                    <a className="floema-detail__information__link" href={product.linkUrl} target="_blank" rel="noreferrer" data-animation="link">
                                        <span>{product.linkText}</span>
                                    </a>
                                </footer>
                            </div>
                        </div>
                    </div>
                    <button className="floema-detail__button" onClick={handleCloseDetail} data-animation="button">
                        <span>Close</span>
                        <svg className="floema-detail__button__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 124 60">
                            <path fill="none" stroke="#fff" opacity="0.4" d="M62,0.5c33.97,0,61.5,13.21,61.5,29.5S95.97,59.5,62,59.5S0.5,46.29,0.5,30S28.03,0.5,62,0.5z" />
                            <path fill="none" stroke="#fff" d="M62,0.5c33.97,0,61.5,13.21,61.5,29.5S95.97,59.5,62,59.5S0.5,46.29,0.5,30S28.03,0.5,62,0.5z" />
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Vertical infinite-scroll collection titles
// ---------------------------------------------------------------------------
function CollectionsTitles({ activeCollection: _activeCollection, onChangeCollection: _onChangeCollection }: { activeCollection: number; onChangeCollection: (i: number) => void }) {
    const titlesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const titles = titlesRef.current;
        if (!titles) return;

        const items = Array.from(titles.querySelectorAll<HTMLElement>('.floema-collections__titles__label, .floema-collections__titles__title'));

        let scrollCurrent = 0;
        const scrollTarget = 0;
        const heightTotal = titles.getBoundingClientRect().height;
        let last = 0;
        let animId: number;

        const extras = items.map(() => 0);
        const heights = items.map((el) => el.getBoundingClientRect().height);
        const offsets = items.map((el) => el.getBoundingClientRect().top - titles.getBoundingClientRect().top);

        function update() {
            scrollCurrent = lerp(scrollCurrent, scrollTarget, 0.07);
            const direction = scrollCurrent < last ? 'down' : 'up';

            items.forEach((el, i) => {
                const pos = -scrollCurrent - extras[i];
                const offset = pos + offsets[i] + heights[i];
                if (direction === 'up' && offset < 0) extras[i] -= heightTotal;
                if (direction === 'down' && offset > heightTotal) extras[i] += heightTotal;
                el.style.transform = `translate3d(0, ${Math.floor(pos)}px, 0)`;
            });

            last = scrollCurrent;
            animId = requestAnimationFrame(update);
        }

        animId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animId);
    }, []);

    const titleHeights = [28.6, 45.1, 53.1, 28.8];

    return (
        <div className="floema-collections__titles" ref={titlesRef}>
            {[0, 1, 2].map((row) =>
                collections.map((col, i) => (
                    <React.Fragment key={`${row}-${i}`}>
                        <div className="floema-collections__titles__label">
                            <div className="floema-collections__titles__label__text">
                                Collection
                                <br />
                                {String(i + 1).padStart(2, '0')}
                            </div>
                        </div>
                        <div className="floema-collections__titles__title" style={{ height: `${titleHeights[i]}rem` }}>
                            <div className="floema-collections__titles__title__text">{col.title}</div>
                        </div>
                    </React.Fragment>
                )),
            )}
        </div>
    );
}

'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { collections } from '../data/content';
import { useButtonAnimation } from '../hooks/useButtonAnimation';
import { useFloemaStore } from '../store/floemaStore';
import { lerp } from '../utils/math';

export default function HomePage() {
    const isPreloaded = useFloemaStore((s) => s.isPreloaded);
    const params = useParams();
    const locale = params.locale as string;
    const pageRef = useRef<HTMLDivElement>(null);

    useButtonAnimation(pageRef);

    return (
        <div className={`floema-home${isPreloaded ? ' active' : ''}`} ref={pageRef}>
            <div className="floema-home__wrapper">
                {/* Vertical scrolling titles — pure DOM + rAF */}
                <VerticalTitles />

                {/* Gallery anchors — visibility:hidden, positions read by R3F HomeGallery */}
                <div className="floema-home__gallery" aria-hidden="true">
                    {Array.from({ length: 5 }, (_, i) => (
                        <figure key={i} className={`floema-home__gallery__media floema-home__gallery__media--${i + 1}`}>
                            <img
                                className="floema-home__gallery__media__image"
                                alt=""
                                data-src={`https://picsum.photos/seed/floema${i + 1}/600/800`}
                                style={{ visibility: 'hidden', display: 'block', width: '100%', aspectRatio: '3/4' }}
                            />
                        </figure>
                    ))}
                </div>

                {/* CTA */}
                <Link href={`/${locale}/floema/collections`} className="floema-home__link" data-animation="button">
                    <span>View Collections</span>
                    <svg className="floema-home__link__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 288 60">
                        <path stroke="#fff" opacity="0.4" fill="none" d="M144,0.5c79.25,0,143.5,13.21,143.5,29.5S223.25,59.5,144,59.5S0.5,46.29,0.5,30S64.75,0.5,144,0.5z" />
                        <path stroke="#fff" fill="none" d="M144,0.5c79.25,0,143.5,13.21,143.5,29.5S223.25,59.5,144,59.5S0.5,46.29,0.5,30S64.75,0.5,144,0.5z" />
                    </svg>
                </Link>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Vertical infinite-scroll titles
// ---------------------------------------------------------------------------
function VerticalTitles() {
    const titlesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const titles = titlesRef.current;
        if (!titles) return;

        const items = Array.from(titles.querySelectorAll<HTMLElement>('.floema-home__titles__label, .floema-home__titles__title'));

        const AUTO_SPEED = 2;
        let scrollCurrent = 0;
        let scrollTarget = 0;
        let last = 0;
        let animId: number;

        const extras = items.map(() => 0);
        const heights = items.map((el) => el.getBoundingClientRect().height);
        const offsets = items.map((el) => el.getBoundingClientRect().top - titles.getBoundingClientRect().top);
        const heightTotal = titles.getBoundingClientRect().height;

        function update() {
            scrollTarget += AUTO_SPEED;
            scrollCurrent = lerp(scrollCurrent, scrollTarget, 0.1);
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

        function onWheel(e: WheelEvent) {
            scrollTarget += e.deltaY * 0.5;
        }

        let touchStartY = 0;
        let touchStartScroll = 0;
        const onTouchStart = (e: TouchEvent) => {
            touchStartY = e.touches[0].clientY;
            touchStartScroll = scrollCurrent;
        };
        const onTouchMove = (e: TouchEvent) => {
            scrollTarget = touchStartScroll + (touchStartY - e.touches[0].clientY) * 2;
        };

        window.addEventListener('wheel', onWheel, { passive: true });
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        animId = requestAnimationFrame(update);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('wheel', onWheel);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
        };
    }, []);

    return (
        <div className="floema-home__titles" ref={titlesRef}>
            {collections.map((col, i) => (
                <React.Fragment key={i}>
                    <div className="floema-home__titles__label">
                        <div className="floema-home__titles__label__text">Collection {String(i + 1).padStart(2, '0')}</div>
                    </div>
                    <div className="floema-home__titles__title" style={{ height: [28.6, 45.1, 53.1, 28.8][i] + 'rem' }}>
                        <div className="floema-home__titles__title__text">{col.title}</div>
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
}

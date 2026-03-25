'use client';
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import SplitType from 'split-type';

import { aboutContent, aboutGallery } from '../data/content';
import { useHighlightAnimation } from '../hooks/useHighlightAnimation';
import { useLinkAnimation } from '../hooks/useLinkAnimation';
import { useFloemaStore } from '../store/floemaStore';

export default function AboutPage() {
    const isPreloaded = useFloemaStore((s) => s.isPreloaded);
    const pageRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useHighlightAnimation(pageRef);
    useLinkAnimation(pageRef);

    // Scroll-based parallax for [data-animation="parallax"] elements
    useEffect(() => {
        if (!wrapperRef.current) return;
        const els = Array.from(wrapperRef.current.querySelectorAll<HTMLElement>('[data-animation="parallax"]'));
        if (!els.length) return;

        let animId: number;
        function tick() {
            els.forEach((el) => {
                const rect = el.getBoundingClientRect();
                const viewH = window.innerHeight;
                const progress = (viewH - rect.top) / (viewH + rect.height);
                const shift = (progress - 0.5) * rect.height * 0.25;
                el.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0) scale(1.1)`;
            });
            animId = requestAnimationFrame(tick);
        }
        animId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animId);
    }, [isPreloaded]);

    // GSAP scroll-triggered paragraph reveals
    useLayoutEffect(() => {
        if (!wrapperRef.current) return;

        const paragraphEls = wrapperRef.current.querySelectorAll<HTMLElement>('[data-animation="paragraph"]');
        const cleanups: (() => void)[] = [];

        paragraphEls.forEach((el) => {
            const split = new SplitType(el, { types: 'lines,words' });
            const lines = split.lines ?? [];
            gsap.set(lines, { yPercent: 100, overflow: 'hidden' });

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) return;
                        gsap.to(lines, {
                            yPercent: 0,
                            duration: 1.5,
                            stagger: 0.1,
                            ease: 'expo.out',
                        });
                        observer.unobserve(entry.target);
                    });
                },
                { threshold: 0.1 },
            );

            observer.observe(el);
            cleanups.push(() => {
                observer.disconnect();
                split.revert();
            });
        });

        return () => cleanups.forEach((c) => c());
    }, [isPreloaded]);

    return (
        <div className={`floema-about${isPreloaded ? ' active' : ''}`} ref={pageRef}>
            <div className="floema-about__wrapper" ref={wrapperRef}>
                {/* Top gallery — rendered normally (visible images) */}
                <section className="floema-about__gallery">
                    <div className="floema-about__gallery__wrapper">
                        {aboutGallery.slice(0, 5).map((img, i) => (
                            <figure key={i} className="floema-about__gallery__media">
                                <img className="floema-about__gallery__media__image" alt={img.alt} src={img.url} onLoad={(e) => (e.target as HTMLImageElement).classList.add('loaded')} />
                            </figure>
                        ))}
                    </div>
                </section>

                {/* Body sections */}
                {aboutContent.map((section, i) => {
                    if (section.type === 'title') {
                        return (
                            <h2 key={i} className="floema-about__title" data-animation="paragraph">
                                {section.text}
                            </h2>
                        );
                    }
                    if (section.type === 'content') {
                        return (
                            <section key={i} className={`floema-about__content floema-about__content--${section.layout}`}>
                                <div className="floema-about__content__wrapper">
                                    <div className="floema-about__content__box">
                                        <p className="floema-about__content__label" data-animation="paragraph">
                                            {section.label}
                                        </p>
                                        <div className="floema-about__content__description" data-animation="paragraph">
                                            {section.description.split('\n').map((line, j) => (
                                                <p key={j}>{line}</p>
                                            ))}
                                        </div>
                                    </div>
                                    <figure className="floema-about__content__media">
                                        <div className="floema-about__content__media__wrapper" data-animation="parallax">
                                            <img
                                                className="floema-about__content__media__image"
                                                alt={section.image.alt}
                                                src={section.image.url}
                                                onLoad={(e) => (e.target as HTMLImageElement).classList.add('loaded')}
                                            />
                                        </div>
                                    </figure>
                                </div>
                            </section>
                        );
                    }
                    if (section.type === 'highlight') {
                        return (
                            <section key={i} className="floema-about__highlight">
                                <div className="floema-about__highlight__wrapper">
                                    <a className="floema-about__highlight__link" href={section.link} target="_blank" rel="noreferrer">
                                        {section.label && (
                                            <p className="floema-about__highlight__label" data-animation="paragraph">
                                                {section.label}
                                            </p>
                                        )}
                                        <h3 className="floema-about__highlight__title" data-animation="highlight">
                                            {section.title}
                                        </h3>
                                    </a>
                                    <div className="floema-about__highlight__medias">
                                        {section.images.map((img, j) => (
                                            <figure key={j} className="floema-about__highlight__media" data-animation="parallax">
                                                <img
                                                    className="floema-about__highlight__media__image"
                                                    alt={img.alt}
                                                    src={img.url}
                                                    onLoad={(e) => (e.target as HTMLImageElement).classList.add('loaded')}
                                                />
                                            </figure>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        );
                    }
                    if (section.type === 'gallery') {
                        return (
                            <section key={i} className="floema-about__gallery">
                                <div className="floema-about__gallery__wrapper">
                                    {/* WebGL arc gallery — images invisible, R3F renders them */}
                                    {section.images.map((img, j) => (
                                        <figure key={j} className="floema-about__gallery__media floema-about__gallery__media--webgl" style={{ width: '30.9rem', height: '43.7rem' }}>
                                            <img
                                                className="floema-about__gallery__media__image"
                                                data-src={img.url}
                                                alt=""
                                                style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', visibility: 'hidden' }}
                                            />
                                        </figure>
                                    ))}
                                </div>
                            </section>
                        );
                    }
                    return null;
                })}

                <footer className="floema-about__footer">
                    <div className="floema-about__footer__copyright">© 2024 Floema</div>
                    <div className="floema-about__footer__credits">
                        <a href="https://github.com" target="_blank" rel="noreferrer">
                            GitHub
                        </a>
                        {' · '}
                        <a href="#" target="_blank" rel="noreferrer">
                            Design by Floema
                        </a>
                    </div>
                </footer>
            </div>
        </div>
    );
}

/* eslint-disable @next/next/no-img-element -- Local images also back WebGL textures and must use the identical asset URL. */
/* eslint-disable react-hooks/immutability -- SceneState is an imperative GSAP/Three runtime, mutated only outside React rendering. */
'use client';
import { useEffect, useEffectEvent, useRef } from 'react';

import { useFloema } from '../context';
import { type Product } from '../data';
import { gsap, motion, useGSAP } from '../motion';

import { AnimatedLink, OvalButton } from './AnimatedControl';

function HighlightIcon({ kind }: { kind: string }) {
    return (
        <svg className="floema-detail-icon" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="19.5" fill="none" stroke="currentColor" />
            {kind === 'arrow' ? (
                <g data-icon-inner>
                    <path d="M14.84 25.46 26.15 14.15" stroke="currentColor" />
                    <path d="m30.75 9.55-.66 2.36-.05 2.59-1.93-2.31-2.31-1.93 2.59-.05ZM10.25 30.05l.66-2.36.05-2.59 1.93 2.31 2.31 1.93-2.59.05Z" fill="currentColor" />
                </g>
            ) : (
                <path
                    data-icon-inner
                    fill="currentColor"
                    d="m24.26 9.87-2.76 8.6 8.72-2.63-8.16 4.13 8.15 4.26-8.71-2.82 2.82 8.91-4.26-8.34-4.14 8.15 2.63-8.72-8.6 2.75 8.15-4.2-8.34-4.33 8.78 2.82-2.82-8.78 4.33 8.34Z"
                />
            )}
        </svg>
    );
}
function Words({ children }: { children: string }) {
    return (
        <span aria-label={children}>
            {children.split(' ').map((word, index) => (
                <span className="floema-word-mask" aria-hidden="true" key={index}>
                    <span data-detail-word>{word}&nbsp;</span>
                </span>
            ))}
        </span>
    );
}
export function ProductDetail({ product, onClose, closing }: { product: Product; onClose: () => void; closing: boolean }) {
    const { scene, reduced } = useFloema();
    const root = useRef<HTMLDivElement>(null);
    const image = useRef<HTMLDivElement>(null);
    const requestClose = useEffectEvent(onClose);
    // The dialog lifecycle and opener are stable across its exit animation.
    useEffect(() => {
        const opener = document.activeElement as HTMLElement | null;
        const element = root.current;
        element?.focus({ preventScroll: true });
        const key = (event: KeyboardEvent) => {
            if (event.key === 'Escape') requestClose();
            if (event.key !== 'Tab' || !element) return;
            const controls = [...element.querySelectorAll<HTMLElement>('a,button')];
            const first = controls[0];
            const last = controls.at(-1);
            if (event.shiftKey && (document.activeElement === first || document.activeElement === element)) {
                event.preventDefault();
                last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first?.focus();
            }
        };
        window.addEventListener('keydown', key);
        return () => {
            window.removeEventListener('keydown', key);
            opener?.focus({ preventScroll: true });
        };
    }, []);
    useGSAP(
        () => {
            const element = root.current;
            if (!element || !image.current) return;
            const measure = () => {
                if (!image.current) return;
                const rect = image.current.getBoundingClientRect();
                scene.collection.detail = { x: rect.x, y: rect.y + element.scrollTop, width: rect.width, height: rect.height };
            };
            measure();
            const observer = new ResizeObserver(measure);
            observer.observe(element);
            const titleLines = element.querySelectorAll('.floema-detail-title-line');
            const words = element.querySelectorAll('[data-detail-word]');
            const timeline = gsap.timeline({ delay: reduced ? 0 : 0.5 });
            timeline
                .fromTo(
                    element.querySelectorAll('[data-detail-reveal]'),
                    { yPercent: reduced ? 0 : 100, autoAlpha: 0 },
                    { yPercent: 0, autoAlpha: 1, duration: reduced ? 0.16 : 1, ease: motion.ease, stagger: 0.05 },
                    0,
                )
                .fromTo(titleLines, { yPercent: reduced ? 0 : 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: reduced ? 0.16 : 1.5, ease: 'expo.inOut', stagger: 0.2 }, 0)
                .fromTo(
                    element.querySelectorAll('.floema-detail-title-letter'),
                    { yPercent: reduced ? 0 : 100, autoAlpha: 0 },
                    { yPercent: 0, autoAlpha: 1, duration: reduced ? 0.16 : 1, ease: 'back.inOut', stagger: reduced ? 0 : 0.015 },
                    0.2,
                )
                .fromTo(words, { yPercent: reduced ? 0 : 100 }, { yPercent: 0, duration: reduced ? 0.16 : 1, ease: motion.ease, stagger: { amount: reduced ? 0 : 0.25 } }, 0.3)
                .fromTo(
                    element.querySelectorAll('.floema-detail-icon'),
                    { autoAlpha: 0, rotation: reduced ? 0 : 45 },
                    { autoAlpha: 1, rotation: 0, duration: reduced ? 0.16 : 1, ease: motion.ease, stagger: 0.1 },
                    0.3,
                )
                .fromTo(element.querySelectorAll('[data-icon-inner]'), { scale: reduced ? 1 : 0.5, transformOrigin: '50% 50%' }, { scale: 1, duration: reduced ? 0.16 : 1.5, ease: motion.ease }, 0.4);
            return () => observer.disconnect();
        },
        { scope: root },
    );
    return (
        <div
            ref={root}
            role="dialog"
            aria-modal="true"
            aria-labelledby="floema-product-title"
            tabIndex={-1}
            className={`floema-detail ${closing ? 'floema-detail--closing' : ''}`}
            onScroll={(event) => {
                scene.collection.detailScroll = event.currentTarget.scrollTop;
            }}
        >
            <div className="floema-detail-layout">
                <div ref={image} className="floema-detail-photo">
                    <img src={product.image.src} alt={product.title} />
                </div>
                <div className="floema-detail-information">
                    <p className="floema-detail-collection">
                        <span data-detail-reveal>{product.collection}</span>
                    </p>
                    <h1 id="floema-product-title" className="floema-detail-title" aria-label={product.title}>
                        {[product.title.split(' ')[0], product.title.split(' ').slice(1).join(' ')].map((line, index) => (
                            <span className="floema-detail-title-line" aria-hidden="true" key={index}>
                                {Array.from(line).map((letter, index) => (
                                    <span className="floema-detail-title-letter" key={index}>
                                        {letter}
                                    </span>
                                ))}
                            </span>
                        ))}
                    </h1>
                    <div className="floema-detail-content">
                        <div className="floema-detail-highlights">
                            {product.highlights.map((highlight, index) => (
                                <p key={index}>
                                    <HighlightIcon kind={highlight.icon} />
                                    <Words>{highlight.text}</Words>
                                </p>
                            ))}
                        </div>
                        <dl className="floema-detail-list">
                            {product.information.map((item) => (
                                <div key={item.label}>
                                    <dt>
                                        <span data-detail-reveal>{item.label}</span>
                                    </dt>
                                    <dd>
                                        <Words>{item.text}</Words>
                                    </dd>
                                </div>
                            ))}
                        </dl>
                        <div className="floema-detail-shop">
                            <span data-detail-reveal>
                                <AnimatedLink href={product.shop.href} target="_blank" rel="noopener noreferrer">
                                    {product.shop.label}
                                </AnimatedLink>
                                <span aria-hidden="true"> ↗</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <OvalButton className="floema-detail-close" onClick={onClose}>
                Close
            </OvalButton>
        </div>
    );
}

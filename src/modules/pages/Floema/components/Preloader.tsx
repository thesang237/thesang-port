'use client';
import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import SplitType from 'split-type';

import { aboutGallery, homeGallery, products } from '../data/content';
import { usePreloadTextures } from '../hooks/useTextureStore';

// All image URLs to preload on startup
const ALL_ASSETS = [...homeGallery.map((i) => i.url), ...aboutGallery.map((i) => i.url), ...products.map((p) => p.image.url)];

type Props = {
    onDone: () => void;
};

export default function Preloader({ onDone }: Props) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLParagraphElement>(null);
    const numberRef = useRef<HTMLSpanElement>(null);
    const [pct, setPct] = useState(0);
    const doneRef = useRef(false);

    // Animate title chars in on mount
    useGSAP(
        () => {
            if (!titleRef.current) return;
            const split = new SplitType(titleRef.current, { types: 'words,chars' });
            const chars = split.chars ?? [];

            gsap.set(titleRef.current, { autoAlpha: 1 });
            gsap.fromTo(chars, { autoAlpha: 0, y: '100%' }, { autoAlpha: 1, y: '0%', duration: 1, stagger: 0.015, ease: 'back.inOut' });

            return () => split.revert();
        },
        { scope: wrapperRef },
    );

    function handleProgress(loaded: number, total: number) {
        setPct(Math.round((loaded / total) * 100));
    }

    function handleComplete() {
        if (doneRef.current) return;
        doneRef.current = true;
        animateOut();
    }

    function animateOut() {
        if (!titleRef.current || !wrapperRef.current) return;
        const split = new SplitType(titleRef.current, { types: 'words,chars' });
        const chars = split.chars ?? [];

        const tl = gsap.timeline({
            delay: 0.5,
            onComplete: () => {
                onDone();
                split.revert();
            },
        });

        tl.to(chars, {
            autoAlpha: 0,
            y: '-100%',
            duration: 1,
            stagger: 0.015,
            ease: 'back.inOut',
        });
        tl.to(numberRef.current, { autoAlpha: 0, duration: 0.8 }, '<');
        tl.to(wrapperRef.current, { autoAlpha: 0, duration: 0.6 });
    }

    usePreloadTextures(ALL_ASSETS, handleProgress, handleComplete);

    return (
        <div className="floema-preloader" ref={wrapperRef}>
            <p className="floema-preloader__text" ref={titleRef} style={{ opacity: 0 }}>
                Built with obsession.
                <br />
                Made for beauty.
            </p>
            <div className="floema-preloader__number">
                <span className="floema-preloader__number__text" ref={numberRef}>
                    {pct}%
                </span>
            </div>
        </div>
    );
}

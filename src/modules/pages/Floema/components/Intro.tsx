'use client';

import { useRef } from 'react';

import { content } from '../data';
import { gsap, motion, useGSAP } from '../motion';

export function Intro({ images, onComplete, reduced }: { images: string[]; onComplete: () => void; reduced: boolean }) {
    const root = useRef<HTMLDivElement>(null);
    const number = useRef<HTMLSpanElement>(null);
    useGSAP(
        () => {
            let cancelled = false;
            const scope = root.current;
            if (!scope) return;
            const lines = scope.querySelectorAll('.floema-intro-line');
            const timeline = gsap.timeline();
            timeline.fromTo(lines, { autoAlpha: 0, yPercent: reduced ? 0 : 100 }, { autoAlpha: 1, yPercent: 0, duration: reduced ? 0.16 : motion.reveal, ease: 'expo.inOut', stagger: 0.2 });
            lines.forEach((line, index) => {
                timeline.fromTo(
                    line.querySelectorAll('.floema-intro-word'),
                    { autoAlpha: 0, yPercent: reduced ? 0 : 100 },
                    { autoAlpha: 1, yPercent: 0, duration: reduced ? 0.16 : 1, ease: 'back.inOut', stagger: reduced ? 0 : 0.015 },
                    reduced ? 0 : 0.2 + index * 0.2,
                );
            });
            let loaded = 0;
            const assets = [...new Set(images)];
            const requests = assets.map(
                (src) =>
                    new Promise<void>((resolve) => {
                        const image = new Image();
                        const finish = () => {
                            loaded++;
                            if (number.current) number.current.textContent = `${Math.round((loaded / assets.length) * 100)}%`;
                            resolve();
                        };
                        image.onload = finish;
                        image.onerror = finish;
                        image.src = src;
                    }),
            );
            let timeout: ReturnType<typeof setTimeout>;
            const deadline = new Promise<void>((resolve) => {
                timeout = setTimeout(resolve, 4000);
            });
            Promise.race([Promise.all(requests), deadline]).then(() => {
                if (cancelled) return;
                clearTimeout(timeout);
                if (number.current) number.current.textContent = '100%';
                timeline
                    .to({}, { duration: reduced ? 0.1 : 1 })
                    .to(lines, { autoAlpha: 0, yPercent: reduced ? 0 : -100, duration: reduced ? 0.16 : motion.reveal, ease: 'expo.inOut', stagger: 0.2 })
                    .to(number.current, { opacity: 0, duration: reduced ? 0.1 : 1 }, '<')
                    .to(scope, { autoAlpha: 0, duration: reduced ? 0.16 : 1, onComplete });
            });
            return () => {
                cancelled = true;
                clearTimeout(timeout);
                timeline.kill();
            };
        },
        { scope: root, dependencies: [reduced], revertOnUpdate: true },
    );
    return (
        <div ref={root} className="floema-intro" role="status" aria-label="Loading Floema">
            <p>
                {content.intro.split('\n').map((line) => (
                    <span className="floema-intro-mask" key={line}>
                        <span className="floema-intro-line">
                            {line.split(' ').map((word, index) => (
                                <span className="floema-intro-word" key={index}>
                                    {word}
                                    {index < line.split(' ').length - 1 ? '\u00a0' : ''}
                                </span>
                            ))}
                        </span>
                    </span>
                ))}
            </p>
            <div className="floema-intro-percent">
                <span ref={number}>0%</span>
            </div>
        </div>
    );
}

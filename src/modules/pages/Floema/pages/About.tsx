/* eslint-disable @next/next/no-img-element -- Local images also back WebGL textures and must use the identical asset URL. */
/* eslint-disable react-hooks/immutability -- SceneState is an imperative GSAP/Three runtime, mutated only outside React rendering. */
'use client';
import { useMemo, useRef } from 'react';
import { SplitText } from 'gsap/SplitText';

import { RichText } from '../components/RichText';
import { useFloema } from '../context';
import { content, type Photograph } from '../data';
import { useGesture } from '../hooks/useGesture';
import { clamp, gsap, mix, motion, useGSAP, wrap } from '../motion';

gsap.registerPlugin(SplitText);
function Gallery({ images }: { images: Photograph[] }) {
    return (
        <section className="floema-about-gallery" aria-label="Floema jewelry photography">
            <div className="floema-about-gallery-track">
                {images.map((image, index) => (
                    <figure key={index}>
                        <img src={image.src} alt={image.alt || 'Floema jewelry and craftsmanship'} />
                    </figure>
                ))}
            </div>
        </section>
    );
}
function Photograph({ image, className = '' }: { image: Photograph; className?: string }) {
    return (
        <figure className={`floema-about-photo ${className}`} data-parallax>
            <img src={image.src} alt={image.alt || 'Floema jewelry and craftsmanship'} />
        </figure>
    );
}
export default function About() {
    const { scene, reduced } = useFloema();
    const root = useRef<HTMLElement>(null);
    const wrapper = useRef<HTMLDivElement>(null);
    const revealed = useRef(new WeakSet<HTMLElement>());
    const handlers = useMemo(() => {
        let startY = 0;
        let starts: number[] = [];
        return {
            wheel: (_x: number, y: number) => {
                scene.about.target += y;
            },
            drag: (x: number, y: number, down: boolean) => {
                if (down) {
                    startY = scene.about.current;
                    starts = scene.about.galleries.map((g) => g.offset);
                } else {
                    scene.about.target = startY - y * (scene.width < 768 ? 3 : 1);
                    scene.about.galleries.forEach((g, index) => {
                        g.target = starts[index] + x;
                        if (Math.abs(x) > 1) g.direction = x > 0 ? -1 : 1;
                    });
                }
            },
            key: (key: string) => {
                if (key === 'Home') scene.about.target = 0;
                else if (key === 'End') scene.about.target = scene.about.limit;
                else scene.about.target += (['ArrowUp', 'PageUp'].includes(key) ? -1 : 1) * (key.startsWith('Page') ? scene.height * 0.8 : 100);
            },
        };
    }, [scene]);
    useGesture(root, handlers);
    useGSAP(
        () => {
            const element = wrapper.current;
            if (!element) return;
            const photos = [...element.querySelectorAll<HTMLElement>('[data-parallax]')].map((element) => ({ element, image: element.querySelector('img')!, top: 0, height: 0 }));
            const galleries = [...element.querySelectorAll<HTMLElement>('.floema-about-gallery')];
            scene.about.galleries = galleries.map((element) => ({ top: 0, images: element.querySelectorAll('figure').length, offset: 0, target: 0, direction: 1 }));
            const splits: SplitText[] = [];
            const reveals: { element: HTMLElement; animation: gsap.core.Tween; top: number; height: number; played: boolean }[] = [];
            const measure = () => {
                scene.about.limit = Math.max(0, element.offsetHeight - scene.height);
                const offset = element.getBoundingClientRect().top;
                for (const photo of photos) {
                    const rect = photo.element.getBoundingClientRect();
                    photo.top = rect.top - offset;
                    photo.height = rect.height;
                }
                galleries.forEach((gallery, index) => {
                    scene.about.galleries[index].top = gallery.getBoundingClientRect().top - offset;
                });
                for (const reveal of reveals) {
                    const rect = reveal.element.getBoundingClientRect();
                    reveal.top = rect.top - offset;
                    reveal.height = rect.height;
                }
            };
            element.querySelectorAll<HTMLElement>('[data-about-reveal]').forEach((block) => {
                const split = SplitText.create(block, {
                    type: 'lines',
                    deepSlice: false,
                    aria: block.querySelector('a') || block.hasAttribute('aria-label') ? 'none' : 'auto',
                    mask: 'lines',
                    autoSplit: true,
                    onSplit(self) {
                        if (block.hasAttribute('aria-label')) self.lines.forEach((line) => line.setAttribute('aria-hidden', 'true'));
                        const animation = gsap.fromTo(
                            self.lines,
                            { yPercent: reduced ? 0 : 100, opacity: reduced ? 0 : 1 },
                            { yPercent: 0, opacity: 1, duration: reduced ? 0.16 : motion.reveal, ease: motion.ease, stagger: motion.lineStagger, paused: true },
                        );
                        const previous = reveals.find((item) => item.element === block);
                        if (previous) {
                            previous.animation.kill();
                            previous.animation = animation;
                            if (previous.played) animation.progress(1).pause();
                        } else {
                            const played = revealed.current.has(block);
                            if (played) animation.progress(1).pause();
                            reveals.push({ element: block, animation, top: 0, height: 0, played });
                        }
                        measure();
                        return undefined;
                    },
                });
                splits.push(split);
            });
            element.querySelectorAll<HTMLElement>('[data-highlight]').forEach((block) => {
                reveals.push({
                    element: block,
                    animation: gsap.fromTo(
                        block,
                        { opacity: 0, scale: reduced ? 1 : 1.2 },
                        { opacity: 1, scale: 1, duration: reduced ? 0.16 : motion.reveal, delay: reduced ? 0 : 0.5, ease: 'expo.out', paused: true },
                    ),
                    top: 0,
                    height: 0,
                    played: revealed.current.has(block),
                });
            });
            reveals.forEach((reveal) => {
                if (reveal.played) reveal.animation.progress(1).pause();
            });
            measure();
            const observer = new ResizeObserver(measure);
            observer.observe(element);
            window.addEventListener('resize', measure);
            const tick = () => {
                if (!scene.ready) return;
                const scroll = scene.about.current;
                element.style.transform = `translate3d(0,${-Math.round(scroll)}px,0)`;
                for (const photo of photos) {
                    const progress = clamp((photo.top - scroll + photo.height) / (scene.height + photo.height), 0, 1);
                    const amount = scene.width < 1024 ? 10 : 50;
                    photo.image.style.transform = reduced ? '' : `translate3d(0,${mix(amount, -amount, progress)}px,0) scale(${mix(1, 1.15, progress)})`;
                }
                galleries.forEach((gallery, index) => {
                    const state = scene.about.galleries[index];
                    const step = 38.9 * scene.unit;
                    gallery.querySelectorAll<HTMLElement>('figure').forEach((photo, i) => {
                        const x = wrap(i * step + 4 * scene.unit + state.offset, -34.9 * scene.unit, step * state.images - 34.9 * scene.unit);
                        photo.style.transform = `translate3d(${x}px,0,0) rotate(${reduced ? 0 : ((x + 15.45 * scene.unit - scene.width / 2) / scene.width) * 36}deg)`;
                    });
                });
                for (const reveal of reveals) {
                    const visible = reveal.top < scroll + scene.height && reveal.top + reveal.height > scroll;
                    if (visible && !reveal.played) {
                        reveal.played = true;
                        revealed.current.add(reveal.element);
                        reveal.element.dataset.revealed = 'true';
                        reveal.animation.play();
                    }
                }
            };
            gsap.ticker.add(tick);
            return () => {
                observer.disconnect();
                window.removeEventListener('resize', measure);
                gsap.ticker.remove(tick);
                reveals.forEach((reveal) => {
                    reveal.animation.kill();
                });
                splits.forEach((split) => split.revert());
                scene.about.galleries = [];
            };
        },
        { scope: root, dependencies: [reduced], revertOnUpdate: true },
    );
    return (
        <section className="floema-about" ref={root} aria-label="About Floema">
            <h1 className="floema-sr-only" data-page-heading tabIndex={-1}>
                About Floema
            </h1>
            <div className="floema-about-content" ref={wrapper}>
                {content.about.map((section, index) => {
                    if (section.type === 'gallery') return <Gallery images={section.images} key={index} />;
                    if (section.type === 'title')
                        return (
                            <h2 className="floema-about-title" aria-label={section.text.replace(/\n/g, ' ')} data-about-reveal key={index}>
                                {section.text.split('\n').map((line, i) => (
                                    <span key={i}>
                                        {line}
                                        {i < section.text.split('\n').length - 1 && <br />}
                                    </span>
                                ))}
                            </h2>
                        );
                    if (section.type === 'content')
                        return (
                            <section className={`floema-story floema-story--${index} floema-story--${section.side}`} key={index}>
                                <div className="floema-story-layout">
                                    <div className="floema-story-copy">
                                        <h3 data-about-reveal>{section.label}</h3>
                                        <div>
                                            <RichText paragraphs={section.description} />
                                        </div>
                                    </div>
                                    <Photograph image={section.image} />
                                </div>
                            </section>
                        );
                    return (
                        <section className={`floema-highlight ${index === 3 ? 'floema-highlight--brand' : ''}`} key={index}>
                            <div className="floema-highlight-layout">
                                <a href={section.href || undefined} target={section.href ? '_blank' : undefined} rel="noopener noreferrer" className="floema-highlight-link">
                                    {section.label && <p data-about-reveal>{section.label}</p>}
                                    <h3>
                                        <span data-highlight>{section.title}</span>
                                    </h3>
                                </a>
                                {section.images.map((image, i) => (
                                    <Photograph key={i} image={image} />
                                ))}
                            </div>
                        </section>
                    );
                })}
                <footer className="floema-footer">
                    <p>{content.footer.copyright}</p>
                    <div>
                        <RichText paragraphs={content.footer.credits} reveal={false} />
                    </div>
                </footer>
            </div>
        </section>
    );
}

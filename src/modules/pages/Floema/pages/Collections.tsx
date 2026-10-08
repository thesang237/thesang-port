/* eslint-disable @next/next/no-img-element -- Local images also back WebGL textures and must use the identical asset URL. */
'use client';
import { useMemo, useRef, useState } from 'react';

import { ProductDetail } from '../components/ProductDetail';
import { titleCycle, titleHeights, VerticalTitles } from '../components/VerticalTitles';
import { useFloema } from '../context';
import { content, numbers } from '../data';
import { useGesture } from '../hooks/useGesture';
import { clamp, gsap, motion, useGSAP } from '../motion';
import { cardPose, collectionLimit, collectionStep } from '../scene';

export default function Collections() {
    const { scene, reduced } = useFloema();
    const root = useRef<HTMLElement>(null);
    const [selected, setSelected] = useState(-1);
    const [activeCollection, setActiveCollection] = useState(0);
    const [closing, setClosing] = useState(false);
    const { contextSafe } = useGSAP({ scope: root });
    const open = contextSafe((index: number) => {
        if (scene.collection.selected >= 0 || index !== scene.collection.active) return;
        scene.collection.selected = index;
        scene.collection.detailScroll = 0;
        setSelected(index);
        setClosing(false);
        gsap.to(scene.collection, { expansion: 1, duration: reduced ? 0.16 : motion.flip, ease: 'expo.inOut', overwrite: true });
        gsap.to(scene.collection, { visibility: 0, duration: motion.fade, overwrite: 'auto' });
    });
    const close = contextSafe(() => {
        if (scene.collection.selected < 0) return;
        setClosing(true);
        gsap.to(scene.collection, {
            expansion: 0,
            duration: reduced ? 0.16 : motion.flip,
            ease: 'expo.inOut',
            overwrite: 'auto',
            onComplete: () => {
                scene.collection.selected = -1;
                setSelected(-1);
                setClosing(false);
            },
        });
        gsap.to(scene.collection, { visibility: 1, delay: reduced ? 0 : 0.5, duration: motion.fade, overwrite: 'auto' });
    });
    const handlers = useMemo(() => {
        let start = 0;
        return {
            wheel: (x: number, y: number) => {
                if (scene.collection.selected < 0) scene.collection.target -= Math.abs(x) > Math.abs(y) ? x : y;
            },
            drag: (x: number, _y: number, down: boolean) => {
                if (scene.collection.selected >= 0) return;
                if (down) start = scene.collection.current;
                else scene.collection.target = start + x;
            },
            key: (key: string) => {
                if (scene.collection.selected >= 0) return;
                if (key === 'Home') scene.collection.target = 0;
                else if (key === 'End') scene.collection.target = -collectionLimit(scene);
                else scene.collection.target += (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(key) ? 1 : -1) * collectionStep(scene);
            },
        };
    }, [scene]);
    // Gesture handlers only cover the gallery; the detail keeps native scrolling on phones.
    const gallery = useRef<HTMLDivElement>(null);
    useGesture(gallery, handlers);
    useGSAP(
        () => {
            const buttons = [...(root.current?.querySelectorAll<HTMLButtonElement>('.floema-product') ?? [])];
            const titles = root.current?.querySelector<HTMLElement>('.floema-titles');
            const copies = [...(root.current?.querySelectorAll<HTMLElement>('.floema-collection-copy') ?? [])];
            const copyLines = copies.map((copy) => [...copy.querySelectorAll<HTMLElement>('h2 > span, .floema-copy-line > span')]);
            let copyTransition: gsap.core.Timeline | undefined;
            let lastCollection = -1;
            const showCopy = contextSafe((index: number, initial: boolean) => {
                copyTransition?.kill();
                const outgoing = copies.filter((_, i) => i !== index);
                const exit = initial || reduced ? 0 : 0.35 + Math.max(0, ...copyLines.map((lines) => lines.length - 1)) * 0.04;
                copyTransition = gsap.timeline();
                if (!initial) {
                    copyLines.forEach((lines, i) => {
                        if (i !== index) copyTransition!.to(lines, { y: 0, yPercent: -110, duration: reduced ? 0 : 0.35, stagger: reduced ? 0 : 0.04, ease: 'power2.in', overwrite: true }, 0);
                    });
                }
                copyTransition
                    .set(outgoing, { autoAlpha: 0 }, exit)
                    .set(copies[index], { autoAlpha: 1 }, exit)
                    .fromTo(copyLines[index], { y: 0, yPercent: 110 }, { y: 0, yPercent: 0, duration: reduced ? 0.16 : 1, stagger: reduced ? 0 : 0.06, ease: motion.ease, overwrite: true }, exit);
            });
            const tick = () => {
                const group = content.products[scene.collection.active].collectionIndex;
                if (group !== lastCollection) {
                    showCopy(group, lastCollection < 0);
                    lastCollection = group;
                    setActiveCollection(group);
                }
                buttons.forEach((button, index) => {
                    const pose = cardPose(scene, index);
                    button.style.transform = `translate3d(${pose.x}px,${pose.y}px,0) rotate(${-pose.rotation}rad)`;
                    button.style.opacity = String(pose.opacity);
                    button.dataset.active = String(index === scene.collection.active);
                });
                if (titles) {
                    let before = 0;
                    let y = 0;
                    for (let index = 0; index < content.collections.length; index++) {
                        const count = content.products.filter((product) => product.collectionIndex === index).length;
                        const length = count * collectionStep(scene) - (index === 0 || index === content.collections.length - 1 ? 5.3 * scene.unit : 0);
                        y += (titleHeights[index] + 16) * scene.unit * clamp((-scene.collection.current - before) / length, 0, 1);
                        before += length;
                    }
                    titles.style.transform = `translate3d(-50%,${-titleCycle * scene.unit - y + scene.height / 2}px,0)`;
                }
            };
            gsap.ticker.add(tick);
            return () => {
                gsap.ticker.remove(tick);
                gsap.killTweensOf(scene.collection);
                copyTransition?.kill();
            };
        },
        { scope: root, dependencies: [reduced], revertOnUpdate: true },
    );
    return (
        <section ref={root} className="floema-collections">
            <h1 className="floema-sr-only" data-page-heading tabIndex={-1}>
                Floema collections
            </h1>
            <div ref={gallery} className={`floema-collection-gallery ${selected >= 0 && !closing ? 'is-open' : ''}`} inert={selected >= 0}>
                <VerticalTitles repeat={3} />
                <div className="floema-products" aria-label="Jewelry gallery">
                    {content.products.map((product, index) => (
                        <button
                            key={`${product.id}-${index}`}
                            className="floema-product"
                            aria-label={`View ${product.title} — ${content.collections[product.collectionIndex].title}`}
                            onClick={() => open(index)}
                            onFocus={() => {
                                scene.collection.target = -index * collectionStep(scene);
                            }}
                        >
                            <img src={product.image.src} alt={product.title} />
                        </button>
                    ))}
                </div>
                <div className="floema-collection-descriptions">
                    {content.collections.map((collection, index) => (
                        <article key={collection.title} className={`floema-collection-copy ${index === activeCollection ? 'is-active' : ''}`} aria-hidden={index !== activeCollection}>
                            <h2>
                                <span>{collection.title} Collection</span>
                            </h2>
                            <p>
                                {collection.description.split('\n').map((line, i) => (
                                    <span className="floema-copy-line" key={i}>
                                        <span>{line}</span>
                                    </span>
                                ))}
                            </p>
                        </article>
                    ))}
                </div>
                <div className="floema-collection-mobile">
                    <span>
                        Collection
                        <br />
                        {numbers[activeCollection]}
                    </span>
                    <h2>{content.collections[activeCollection].title}</h2>
                </div>
            </div>
            {selected >= 0 && <ProductDetail product={content.products[selected]} onClose={close} closing={closing} />}
        </section>
    );
}

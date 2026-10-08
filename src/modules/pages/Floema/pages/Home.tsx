/* eslint-disable @next/next/no-img-element -- Local images also back WebGL textures and must use the identical asset URL. */
/* eslint-disable react-hooks/immutability -- SceneState is an imperative GSAP/Three runtime, mutated only outside React rendering. */
'use client';
import { useMemo, useRef } from 'react';

import { AnimatedLink } from '../components/AnimatedControl';
import { titleCycle, VerticalTitles } from '../components/VerticalTitles';
import { useFloema } from '../context';
import { content } from '../data';
import { useGesture } from '../hooks/useGesture';
import { gsap, useGSAP, wrap } from '../motion';
import { homeLayout, homeY } from '../scene';

export default function Home() {
    const { scene, href, navigate } = useFloema();
    const root = useRef<HTMLElement>(null);
    const handlers = useMemo(() => {
        let start = 0;
        let title = 0;
        return {
            wheel: (_x: number, y: number) => {
                scene.home.target += y;
                scene.home.titleTarget += y * 0.5;
                if (y) scene.home.direction = Math.sign(y);
            },
            drag: (_x: number, y: number, down: boolean) => {
                if (down) {
                    start = scene.home.current;
                    title = scene.home.title;
                } else {
                    scene.home.target = start + y;
                    scene.home.titleTarget = title - y * 2;
                }
            },
            key: (key: string) => {
                const delta = key === 'ArrowUp' ? -100 : 100;
                scene.home.target += delta;
                scene.home.titleTarget += delta;
                scene.home.direction = Math.sign(delta);
            },
        };
    }, [scene]);
    useGesture(root, handlers);
    useGSAP(
        () => {
            const title = root.current?.querySelector<HTMLElement>('.floema-titles');
            const images = [...(root.current?.querySelectorAll<HTMLElement>('.floema-home-photo') ?? [])];
            let layout = homeLayout(scene);
            let measuredWidth = scene.width;
            const resize = () => {
                layout = homeLayout(scene);
            };
            window.addEventListener('resize', resize);
            const tick = () => {
                if (!title || !scene.ready || document.hidden) return;
                if (measuredWidth !== scene.width) {
                    layout = homeLayout(scene);
                    measuredWidth = scene.width;
                }
                title.style.transform = `translate3d(-50%,${-wrap(scene.home.title, 0, titleCycle * scene.unit)}px,0)`;
                images.forEach((image, index) => {
                    const rect = layout.rects[index];
                    image.style.width = `${rect.width}px`;
                    image.style.height = `${rect.height}px`;
                    image.style.transform = `translate3d(${rect.x}px,${homeY(scene, rect, layout.total)}px,0) rotate(${Math.sin(index * 12.9898) * 5.4}deg)`;
                });
            };
            gsap.ticker.add(tick);
            return () => {
                gsap.ticker.remove(tick);
                window.removeEventListener('resize', resize);
            };
        },
        { scope: root },
    );
    return (
        <section ref={root} className="floema-home" aria-label="Floema collections">
            <h1 className="floema-sr-only" tabIndex={-1} data-page-heading>
                Floema — handmade jewelry
            </h1>
            <div className="floema-home-photos" aria-hidden="true">
                {[...content.home, ...content.home].map((image, index) => (
                    <img className="floema-home-photo" key={index} src={image.src} alt="" />
                ))}
            </div>
            <VerticalTitles repeat={3} />
            <div className="floema-home-shade" />
            <AnimatedLink
                className="floema-discover"
                oval
                href={href('collections')}
                onClick={(event) => {
                    if (!event.metaKey && !event.ctrlKey) {
                        event.preventDefault();
                        navigate('collections');
                    }
                }}
            >
                {content.button}
            </AnimatedLink>
        </section>
    );
}

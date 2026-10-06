'use client';

import { useEffect, useRef, useState } from 'react';

import { prefersReducedMotion } from '../kit/loop';
import { buildScene, randomSeed, SEEDS } from '../kit/source';

/** The real artwork, drawing itself: the same buildScene() and drawFrame() as /art-solace. */
export default function HeroArt() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [seed, setSeed] = useState<string>(SEEDS.hero);
    const [info, setInfo] = useState('');

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        const size = Math.round(canvas.getBoundingClientRect().width) || 480;
        canvas.width = size * 2;
        canvas.height = size * 2;
        ctx.setTransform(2, 0, 0, 2, 0, 0);
        const scene = buildScene(seed, size);
        ctx.fillStyle = scene.paper;
        ctx.fillRect(0, 0, size, size);
        const label = `${scene.traits.Palette} · ${scene.traits.Dunes} dune${scene.traits.Dunes > 1 ? 's' : ''} · ${scene.traits.Brush}`;

        let frame = 0;
        let raf = 0;
        const instant = prefersReducedMotion();
        const tick = () => {
            do {
                if (!scene.drawFrame(ctx, frame)) break;
                frame++;
            } while (instant);
            setInfo(`${label} · frame ${frame}/${scene.totalFrames}`);
            if (frame < scene.totalFrames) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [seed]);

    return (
        <figure className="pointer-events-auto">
            <canvas ref={canvasRef} className="aspect-square w-full shadow-[0_30px_80px_-30px_rgba(30,28,33,0.45)]" aria-label="The Solace artwork drawing itself" role="img" />
            <figcaption className="sl-mono mt-3 flex flex-wrap items-center justify-between gap-2 text-[10.5px] uppercase text-[var(--sl-dim)]">
                <span className="truncate">{`seed “${seed.slice(0, 12)}${seed.length > 12 ? '…' : ''}” · ${info}`}</span>
                <button
                    type="button"
                    onClick={() => setSeed(randomSeed())}
                    className="sl-btn shrink-0 rounded-full border border-[var(--sl-line-3)] px-2.5 py-1 hover:border-[var(--sl-ink)] hover:text-[var(--sl-ink)]"
                >
                    New seed ↻
                </button>
            </figcaption>
        </figure>
    );
}

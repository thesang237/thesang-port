'use client';

import { useEffect, useRef, useState } from 'react';

import { createRenderer } from './art/renderer';
import { PAPER_COLOR } from './art/settings';
import { createWorld } from './art/world';

/** Seeds in the URL make a piece shareable without changing the random default. */
function readSeed(name: string) {
    const value = new URLSearchParams(window.location.search).get(name);
    return value !== null && /^\d{1,8}$/.test(value) ? Number(value) : Math.floor(Math.random() * 100000000);
}

export function ArtSagebrushPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<'loading' | 'drawing' | 'done' | 'error'>('loading');

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        let frame = 0;
        let disposed = false;
        const size = Math.min(window.innerWidth, window.innerHeight);
        canvas.width = size;
        canvas.height = size;
        ctx.fillStyle = PAPER_COLOR;
        ctx.fillRect(0, 0, size, size);

        // Yield so the loading label can paint. Construction still runs on the main thread.
        const timer = window.setTimeout(() => {
            try {
                const seed = readSeed('seed');
                const noiseSeed = readSeed('noise');
                canvas.dataset.seed = String(seed);
                canvas.dataset.noiseSeed = String(noiseSeed);
                const world = createWorld(seed, noiseSeed);
                const renderer = createRenderer(ctx, world, seed, noiseSeed);
                setStatus('drawing');
                const draw = () => {
                    if (disposed) return;
                    if (!document.hidden && renderer.step().done) {
                        setStatus('done');
                        return;
                    }
                    frame = requestAnimationFrame(draw);
                };
                frame = requestAnimationFrame(draw);
            } catch (error) {
                console.error('Unable to create Sagebrush artwork', error);
                setStatus('error');
            }
        }, 50);
        return () => {
            disposed = true;
            clearTimeout(timer);
            cancelAnimationFrame(frame);
        };
    }, []);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#212121]">
            <canvas ref={canvasRef} data-status={status} aria-label="Sagebrush: a generative ink landscape" style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            {(status === 'loading' || status === 'error') && (
                <div className="absolute inset-0 flex items-center justify-center" role="status">
                    <span className="text-[#dfd8ce] text-sm tracking-widest uppercase opacity-60">{status === 'error' ? 'Unable to draw. Please reload.' : 'Generating…'}</span>
                </div>
            )}
        </div>
    );
}

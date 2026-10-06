'use client';

// The page: one square canvas, the scene drawn into it frame by frame, and the debug panel (D).
// The artwork itself lives in ./art (start with README.md).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { randomSeed } from './art/random';
import { type ArtOverrides, buildScene } from './art/scene';
import { DebugPanel } from './debug/DebugPanel';
import { initialDebugOpen, initialSeed, persistDebugOpen, persistSeed, shareLink } from './debug/seed';

// fixed pixel density, as in the original (p5 pixelDensity(2)): the grain looks the same on every screen
const DPR = 2;

const canvasSide = () => Math.min(window.innerWidth, window.innerHeight);

export default function ArtSolacePage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const progress = useRef('');

    const [{ seed, locked }, setSeedState] = useState(initialSeed);
    const [debugOpen, setDebugOpen] = useState(initialDebugOpen);
    const [animate, setAnimate] = useState(true);
    // overrides travel as a JSON string, so an identical set of overrides never triggers a redraw
    const [overridesKey, setOverridesKey] = useState('{}');
    const [size, setSize] = useState(canvasSide);
    const [redrawCount, setRedrawCount] = useState(0);

    // everything is decided up front (a fresh scene per draw: drawing consumes its random stream)
    const scene = useMemo(
        () => buildScene(seed, size, JSON.parse(overridesKey) as ArtOverrides),
        // animate and redrawCount aren't read here, but each restart needs a fresh random stream
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [seed, size, overridesKey, animate, redrawCount],
    );
    const [finished, setFinished] = useState<typeof scene | null>(null);
    const done = finished === scene;

    // ── seed actions ──
    const changeSeed = useCallback((next: string) => setSeedState((s) => ({ ...s, seed: next })), []);
    const newSeed = useCallback(() => changeSeed(randomSeed()), [changeSeed]);
    const setLock = useCallback((next: boolean) => setSeedState((s) => ({ ...s, locked: next })), []);
    useEffect(() => persistSeed({ seed, locked }), [seed, locked]);
    useEffect(() => persistDebugOpen(debugOpen), [debugOpen]);

    const savePng = useCallback(() => {
        canvasRef.current?.toBlob((blob) => {
            if (!blob) return;
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `solace-${seed.slice(0, 10)}.png`;
            a.click();
            URL.revokeObjectURL(a.href);
        });
    }, [seed]);
    const copyLink = useCallback(() => void navigator.clipboard?.writeText(shareLink(seed)), [seed]);

    // ── keyboard: D panel · R new seed · L lock · S save ──
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const typing = e.target instanceof Element && e.target.closest('input, textarea, select');
            if (e.metaKey || e.ctrlKey || e.altKey || typing) return;
            const k = e.key.toLowerCase();
            if (k === 'd') setDebugOpen((o) => !o);
            else if (k === 'r') newSeed();
            else if (k === 'l') setSeedState((s) => ({ ...s, locked: !s.locked }));
            else if (k === 's') savePng();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [newSeed, savePng]);

    // ── resize: redraw the same seed at the new size ──
    useEffect(() => {
        let t = 0;
        const onResize = () => {
            window.clearTimeout(t);
            t = window.setTimeout(() => setSize(canvasSide()), 200);
        };
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('resize', onResize);
            window.clearTimeout(t);
        };
    }, []);

    // ── pour the sand in ──
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        canvas.width = size * DPR;
        canvas.height = size * DPR;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx.fillStyle = scene.paper;
        ctx.fillRect(0, 0, size, size);

        let frame = 0;
        let raf = 0;
        const tick = () => {
            // animate: one frame per screen refresh (the build-up is part of the piece); otherwise all at once
            do {
                if (!scene.drawFrame(ctx, frame)) break;
                frame++;
            } while (!animate);
            progress.current = `${Math.min(frame, scene.totalFrames)} / ${scene.totalFrames} frames`;
            if (frame < scene.totalFrames) raf = requestAnimationFrame(tick);
            else setFinished(scene);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [scene, size, animate]);

    return (
        <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: scene.paper }}>
            <canvas ref={canvasRef} style={{ display: 'block' }} aria-label={`Solace: ${scene.traits.Dunes} dunes, ${scene.traits.Palette} palette`} role="img" />
            {debugOpen && (
                <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-[11px] leading-snug" style={{ color: scene.params.ink, opacity: 0.6 }}>
                    {`${locked ? '🔒' : '🎲'} ${seed.slice(0, 16)}${seed.length > 16 ? '…' : ''} · ${done ? 'done' : 'drawing'}`}
                    <br />
                    {'D panel · R new seed · L lock · S save'}
                </div>
            )}
            <DebugPanel
                visible={debugOpen}
                seed={seed}
                locked={locked}
                animate={animate}
                scene={scene}
                progress={progress}
                onSeed={changeSeed}
                onLock={setLock}
                onAnimate={setAnimate}
                onNewSeed={newSeed}
                onRedraw={() => setRedrawCount((n) => n + 1)}
                onSave={savePng}
                onCopyLink={copyLink}
                onOverrides={setOverridesKey}
            />
        </div>
    );
}

'use client';

import styles from './cantera.module.scss';

import { useEffect, useRef, useState } from 'react';

import { Link } from '@/i18n/navigation';

import { DEFAULT_HASH, isHash, randomHash } from './art/random.js';
import { renderSize } from './art/scene.js';
import { useCanteraCanvas } from './useCanteraCanvas';

function initialHash() {
    if (typeof window === 'undefined') return DEFAULT_HASH;
    const hash = new URLSearchParams(window.location.search).get('seed');
    return hash && isHash(hash) ? hash : randomHash();
}
function sizeFromViewport() {
    if (typeof window === 'undefined') return renderSize(720, 1280);
    const query = new URLSearchParams(window.location.search);
    const dimension = (key: string, fallback: number) => {
        const value = Number(query.get(key));
        return Number.isFinite(value) && value >= 18 && value <= 4096 ? value : fallback;
    };
    return renderSize(dimension('w', window.innerWidth), dimension('h', window.innerHeight));
}

function Artwork({ hash, animate }: { hash: string; animate: boolean }) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const [size] = useState(sizeFromViewport);
    const { progress, error } = useCanteraCanvas(canvas, hash, size.width, size.height, animate);
    return (
        <>
            <canvas ref={canvas} aria-label="Cantera: an eroded stone landscape carved into architectural volumes" className={styles.canvas} />
            {(progress < 1 || error) && (
                <p className={styles.status} role="status">
                    {error || (progress === 0 ? 'Growing terrain…' : `Printing stone · ${Math.round(progress * 100)}%`)}
                </p>
            )}
        </>
    );
}
export function ArtCanteraPage() {
    const [hash, setHash] = useState(initialHash);
    const [animate, setAnimate] = useState(() => typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const change = (event: MediaQueryListEvent) => {
            if (event.matches) setAnimate(false);
        };
        media.addEventListener('change', change);
        return () => media.removeEventListener('change', change);
    }, []);
    const regenerate = () => {
        const next = randomHash();
        const url = new URL(window.location.href);
        url.searchParams.set('seed', next);
        window.history.replaceState(null, '', url);
        setHash(next);
    };
    return (
        <main className={styles.page}>
            <Artwork key={hash} hash={hash} animate={animate} />
            <nav className={styles.tools} aria-label="Artwork controls">
                <Link href="/art-cantera/learn">Explore the techniques ↗</Link>
                <button type="button" onClick={() => setAnimate(!animate)} aria-pressed={animate}>
                    {animate ? 'Pause life' : 'Play life'}
                </button>
                <button type="button" onClick={regenerate}>
                    New seed
                </button>
                <a href={`?seed=${hash}`} title="Open this seed again">
                    {hash.slice(2, 10)}
                </a>
            </nav>
        </main>
    );
}

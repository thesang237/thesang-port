'use client';
import { useRef } from 'react';

import { DEFAULT_HASH } from '../../ArtCantera/art/random.js';
import { useCanteraCanvas } from '../../ArtCantera/useCanteraCanvas';
export default function HeroArt() {
    const canvas = useRef<HTMLCanvasElement>(null);
    const report = useCanteraCanvas(canvas, DEFAULT_HASH, 270, 480, false, true);
    return (
        <figure className="cl-original">
            <div>
                <canvas ref={canvas} aria-label="Cantera artwork drawn by the original refactored renderer" />
                {report.progress < 1 && <span role="status">{report.error || (report.progress ? `Printing · ${Math.round(report.progress * 100)}%` : 'Growing terrain…')}</span>}
            </div>
            <figcaption>
                <span>Original renderer · fixed seed</span>
                <span>CPU / 2D canvas</span>
            </figcaption>
        </figure>
    );
}

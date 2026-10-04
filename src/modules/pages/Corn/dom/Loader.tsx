'use client';

import { useEffect, useState } from 'react';

import { useUi } from '../store';

import Logo from './Logo';

/**
 * Black loader (reference 0–2 s): an outlined logo whose filled copy is revealed with the progress,
 * the percentage, and a line under it. When loading is done it holds for a beat, fades, and hands
 * over to the intro (`onDone`).
 */
export default function Loader({ onDone }: { onDone: () => void }) {
    const progress = useUi((s) => s.progress);
    const started = useUi((s) => s.started);
    const [shown, setShown] = useState(0);
    const [leaving, setLeaving] = useState(false);

    // the counter eases toward the real progress so it never jumps
    useEffect(() => {
        let raf = 0;
        const step = () => {
            setShown((v) => {
                const next = v + (progress - v) * 0.12 + (progress > v ? 0.002 : 0);
                return Math.min(progress, next);
            });
            raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [progress]);

    useEffect(() => {
        if (shown < 0.999 || leaving) return;
        const hold = setTimeout(() => setLeaving(true), 200);
        return () => clearTimeout(hold);
    }, [shown, leaving]);

    useEffect(() => {
        if (!leaving) return;
        const t = setTimeout(onDone, 450);
        return () => clearTimeout(t);
    }, [leaving, onDone]);

    if (started && !leaving) return null;
    const pct = Math.round(shown * 100);
    return (
        <div className={`corn-loader${leaving ? ' is-leaving' : ''}`} role="status" aria-live="polite">
            <div className="corn-loader__logo">
                <Logo outline />
                <span className="corn-loader__fill" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}>
                    <Logo />
                </span>
            </div>
            <div className="corn-loader__pct">{pct}%</div>
            <div className="corn-loader__line">Preparing the field.</div>
        </div>
    );
}

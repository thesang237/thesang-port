'use client';

import { useMemo, useState } from 'react';

import { Btn, Demo, Segmented } from '../kit/controls';
import { hashSeed, makeGaussian, sfc32 } from '../kit/source';

const BINS = 48;
const RANGE = 4; // −4 … +4

/** The art's makeGaussian() vs plain next(): histograms of the same number of samples. */
export default function GaussLab() {
    const [n, setN] = useState('5000');
    const [batch, setBatch] = useState(0);
    const count = Number(n);

    const { uniform, bell, inOne } = useMemo(() => {
        const next = sfc32(...hashSeed(`gauss-${batch}`));
        const gaussian = makeGaussian(next);
        const uniform = new Array(BINS).fill(0);
        const bell = new Array(BINS).fill(0);
        let inOne = 0;
        for (let i = 0; i < count; i++) {
            // plain next(), spread over the same −4..4 range so both fit one chart
            uniform[Math.floor(next() * BINS)]++;
            const g = gaussian();
            if (Math.abs(g) < 1) inOne++;
            const b = Math.floor(((g + RANGE) / (2 * RANGE)) * BINS);
            if (b >= 0 && b < BINS) bell[b]++;
        }
        return { uniform, bell, inOne: inOne / count };
    }, [count, batch]);

    const max = Math.max(...uniform, ...bell);

    return (
        <Demo
            title="Flat randomness vs a bell curve"
            hint="Grey: next(), every value equally likely. Ink: gaussian(), piled up in the middle. The rust band is −1…1."
            controls={
                <>
                    <Segmented label="Samples" options={['500', '5000', '50000']} value={n} onChange={setN} />
                    <Btn onClick={() => setBatch((b) => b + 1)}>Resample ↻</Btn>
                    <p className="text-[13.5px] leading-relaxed text-[var(--sl-body)]">
                        <strong>{`${(inOne * 100).toFixed(1)} %`}</strong> of the bell values landed between −1 and 1 (the maths says 68.3 %).
                    </p>
                </>
            }
        >
            <div className="p-4 sm:p-6">
                <svg viewBox={`0 0 ${BINS * 10} 200`} className="h-[240px] w-full" preserveAspectRatio="none" role="img" aria-label="Histogram of uniform and bell-curve samples">
                    <rect x={((RANGE - 1) / (2 * RANGE)) * BINS * 10} y={0} width={(2 / (2 * RANGE)) * BINS * 10} height={200} fill="rgba(222,132,113,0.16)" />
                    {uniform.map((c, i) => (
                        <rect key={`u${i}`} x={i * 10 + 1} y={200 - (c / max) * 190} width={8} height={(c / max) * 190} fill="rgba(30,28,33,0.16)" />
                    ))}
                    {bell.map((c, i) => (
                        <rect key={`b${i}`} x={i * 10 + 2.5} y={200 - (c / max) * 190} width={5} height={(c / max) * 190} fill="var(--sl-ink)" />
                    ))}
                    <line x1={BINS * 5} x2={BINS * 5} y1={0} y2={200} stroke="var(--sl-rust-ink)" strokeDasharray="4 4" />
                </svg>
                <div className="sl-mono mt-2 flex justify-between text-[10px] text-[var(--sl-faint)]">
                    <span>−4</span>
                    <span>0</span>
                    <span>+4</span>
                </div>
            </div>
        </Demo>
    );
}

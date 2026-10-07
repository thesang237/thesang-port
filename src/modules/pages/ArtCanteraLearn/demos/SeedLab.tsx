'use client';
import { useCallback, useState } from 'react';

import { LocalRandom, PAPER } from '../kit/art';
import { useStudyCanvas } from '../kit/canvas';
import { Choice, Dial, Lab } from '../kit/ui';

export default function SeedLab() {
    const [seed, setSeed] = useState(19),
        [extra, setExtra] = useState(0);
    const [mode, setMode] = useState<'Shared stream' | 'Separate streams'>('Separate streams');
    const draw = useCallback(
        (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            ctx.fillStyle = PAPER;
            ctx.fillRect(0, 0, w, h);
            const random = new LocalRandom(seed),
                local = new LocalRandom(seed);
            const drawPanel = (left: number, stream: LocalRandom) => {
                const cell = Math.min((w / 2 - 40) / 10, (h - 80) / 12);
                for (let y = 0; y < 12; y++)
                    for (let x = 0; x < 10; x++) {
                        const value = stream.next();
                        ctx.fillStyle = value > 0.7 ? '#9a4e33' : value > 0.35 ? '#c9beb0' : '#35302b';
                        ctx.fillRect(left + x * cell, (h - cell * 12) / 2 + y * cell, cell - 2, cell - 2);
                    }
            };
            drawPanel(16, random);
            for (let i = 0; i < extra; i++) random.next();
            drawPanel(w / 2 + 16, mode === 'Shared stream' ? random : local);
            ctx.fillStyle = '#65594b';
            ctx.font = '11px monospace';
            ctx.fillText('FORM', 16, h - 16);
            ctx.fillText('DETAIL', w / 2 + 16, h - 16);
        },
        [seed, extra, mode],
    );
    const canvas = useStudyCanvas(draw);
    return (
        <Lab
            title="Same dice, same print"
            hint="Add extra draws. Separate streams protect detail from changes in form."
            reset={() => {
                setSeed(19);
                setExtra(0);
                setMode('Separate streams');
            }}
            note="This study uses the source's Alea LocalRandom. TokenRandom separately alternates two warmed SFC32 streams from the full artwork hash."
            controls={
                <>
                    <Dial label="Seed" help="A repeatable starting state for the dice." value={seed} min={1} max={99} onChange={setSeed} />
                    <Choice label="Random ownership" options={['Shared stream', 'Separate streams'] as const} value={mode} onChange={setMode} />
                    <Dial label="Extra form draws" help="Consume more dice before detail is drawn. Shared detail shifts." value={extra} min={0} max={40} onChange={setExtra} />
                </>
            }
        >
            <canvas ref={canvas} aria-label="Two seeded mosaics showing random stream independence" />
        </Lab>
    );
}

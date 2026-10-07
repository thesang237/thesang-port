'use client';
import { useCallback, useMemo, useState } from 'react';

import { cube, drawField, PAPER, studyField } from '../kit/art';
import { useStudyCanvas } from '../kit/canvas';
import { Choice, Code, Dial, Lab } from '../kit/ui';

const PRESETS = {
    'Tidal ink': { drops: 8000, frequency: 0.025, void: 0.3 },
    'Impossible arcade': { drops: 0, frequency: 0.025, void: 0.5 },
    'Engraved atlas': { drops: 3000, frequency: 0.045, void: 0.2 },
};
type Preset = keyof typeof PRESETS;
export default function RecipeLab() {
    const [preset, setPreset] = useState<Preset>('Tidal ink'),
        [seed, setSeed] = useState(19),
        [amount, setAmount] = useState(1),
        [message, setMessage] = useState('');
    const options = PRESETS[preset];
    const field = useMemo(() => {
        const f = studyField(seed, options.frequency, 3);
        if (options.drops) f.erode(Math.round(options.drops * amount), 0.05, 40, 0.2, 0.05, false, 0.025, 0, 0.025, 0);
        return f;
    }, [seed, options, amount]);
    const draw = useCallback(
        (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            if (preset === 'Tidal ink') {
                drawField(ctx, w, h, field, 1.2, true);
                return;
            }
            ctx.fillStyle = PAPER;
            ctx.fillRect(0, 0, w, h);
            if (preset === 'Impossible arcade') {
                for (let y = 5; y >= 0; y--)
                    for (let x = 5; x >= 0; x--)
                        for (let z = 0; z < 5; z++) if (z >= Math.min(4, Math.round(amount * 2)) || (x + seed) % 3 === 0 || (y + seed) % 3 === 0) cube(ctx, (x - 3) * 8, (y - 3) * 8, z * 8, 8, w, h);
                return;
            }
            const size = Math.min(w, h) - 48,
                left = (w - size) / 2,
                top = (h - size) / 2;
            for (let y = 0; y < 64; y++)
                for (let x = 0; x < 64; x++) {
                    const level = field.sample(x, y, true)[2],
                        curvature = field.curvature(x, y, 6);
                    const contour = Math.abs(((level * 22) % 1) - 0.5) < 0.09;
                    const shade = contour ? 45 : Math.max(85, Math.min(240, 185 + curvature * 100 * amount));
                    ctx.fillStyle = `rgb(${shade},${shade * 0.94},${shade * 0.85})`;
                    ctx.fillRect(left + (x * size) / 64, top + (y * size) / 64, size / 64 + 0.5, size / 64 + 0.5);
                }
        },
        [preset, field, amount, seed],
    );
    const canvas = useStudyCanvas(draw);
    const recipe = JSON.stringify(
        {
            study: preset,
            seed,
            grid: 65,
            frequency: options.frequency,
            droplets: Math.round(options.drops * amount),
            inertia: 0.05,
            lifetime: 40,
            depositRate: 0.2,
            erosionRate: 0.05,
            amount,
        },
        null,
        2,
    );
    return (
        <>
            <Lab
                title="Choose a rule. Make it yours."
                hint="Pick a brief, change the seed, and exaggerate the defining mark."
                reset={() => {
                    setPreset('Tidal ink');
                    setSeed(19);
                    setAmount(1);
                    setMessage('');
                }}
                note="These are new teaching artworks, built from Cantera's real height field, erosion and camera helpers. They are recipes for the study, not overrides to the original token traits."
                controls={
                    <>
                        <Choice label="Creative brief" options={Object.keys(PRESETS) as Preset[]} value={preset} onChange={setPreset} />
                        <Dial label="Seed" help="Keeps every preview and recipe reproducible." value={seed} min={1} max={99} onChange={setSeed} />
                        <Dial
                            label="Gesture amount"
                            help={
                                preset === 'Tidal ink'
                                    ? 'Scales the number of droplets.'
                                    : preset === 'Impossible arcade'
                                      ? 'At zero the arcade becomes a solid mass.'
                                      : 'Exaggerates curvature contrast.'
                            }
                            value={amount}
                            min={0}
                            max={2}
                            step={0.1}
                            onChange={setAmount}
                        />
                        <button
                            type="button"
                            className="cl-button"
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(recipe);
                                    setMessage('Recipe copied.');
                                } catch {
                                    setMessage('Select and copy the recipe below.');
                                }
                            }}
                        >
                            Copy recipe ↗
                        </button>
                        <p role="status">{message}</p>
                    </>
                }
            >
                <canvas ref={canvas} aria-label="Creative generative artwork recipe preview" />
            </Lab>
            <Code file="Your study recipe · JSON">{recipe}</Code>
        </>
    );
}

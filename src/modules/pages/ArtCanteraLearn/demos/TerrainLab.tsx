'use client';
import { useCallback, useMemo, useState } from 'react';

import { drawField, studyField } from '../kit/art';
import { useStudyCanvas } from '../kit/canvas';
import { Choice, Dial, Lab } from '../kit/ui';

/** Same height-field and erosion methods as the artwork; smaller grids for immediate feedback. */
export default function TerrainLab({ erosion = false, engraving = false }: { erosion?: boolean; engraving?: boolean }) {
    const [frequency, setFrequency] = useState(0.025);
    const [layers, setLayers] = useState(3);
    const [drops, setDrops] = useState(erosion ? 3000 : 0);
    const [inertia, setInertia] = useState(0.05);
    const [relief, setRelief] = useState(1);
    const [view, setView] = useState<'Relief' | 'Ink' | 'Curvature'>(engraving ? 'Curvature' : 'Relief');
    const field = useMemo(() => {
        const next = studyField(19, frequency, layers);
        if (drops) next.erode(drops, inertia, 40, 0.2, 0.05, false, 0.025, 0, 0.025, 0);
        return next;
    }, [frequency, layers, drops, inertia]);
    const draw = useCallback(
        (context: CanvasRenderingContext2D, width: number, height: number) => {
            if (view !== 'Curvature') {
                drawField(context, width, height, field, relief, view === 'Ink');
                return;
            }
            context.fillStyle = '#f3ede3';
            context.fillRect(0, 0, width, height);
            const cell = Math.min((width - 48) / 64, (height - 48) / 64);
            const left = (width - 64 * cell) / 2,
                top = (height - 64 * cell) / 2;
            for (let x = 0; x < 64; x++)
                for (let y = 0; y < 64; y++) {
                    const c = field.curvature(x, y, 6) * relief;
                    const shade = Math.max(30, Math.min(240, 160 + c * 160));
                    context.fillStyle = `rgb(${shade},${shade * 0.95},${shade * 0.86})`;
                    context.fillRect(left + x * cell, top + y * cell, cell + 0.2, cell + 0.2);
                }
        },
        [field, relief, view],
    );
    const canvas = useStudyCanvas(draw);
    const reset = () => {
        setFrequency(0.025);
        setLayers(3);
        setDrops(erosion ? 3000 : 0);
        setInertia(0.05);
        setRelief(1);
        setView(engraving ? 'Curvature' : 'Relief');
    };
    return (
        <Lab
            title={erosion ? 'Water leaves a memory' : engraving ? 'An engraved atlas' : 'A landscape from numbers'}
            hint={erosion ? 'Move droplets from 0 to 12,000. Look for valleys opening.' : 'Change the view. The grid and the ink are the same landscape.'}
            reset={reset}
            note="Teaching scale: 65 × 65 samples. The artwork grows to 785 × 785; its erosion stages use 15k, 70k and 100k droplets per terrain."
            controls={
                <>
                    <Choice label="Read the field as" options={['Relief', 'Ink', 'Curvature'] as const} value={view} onChange={setView} />
                    <Dial
                        label="Noise frequency"
                        help="Higher values fit more hills into the same space. Source layer: 0.025."
                        value={frequency}
                        min={0.006}
                        max={0.1}
                        step={0.001}
                        onChange={setFrequency}
                    />
                    <Dial label="Noise layers" help="Overlapping scales add small detail to the large silhouette." value={layers} min={1} max={6} onChange={setLayers} />
                    {(erosion || engraving) && (
                        <>
                            <Dial label="Droplets" help="Each drop moves sediment downhill. Reduced here for a responsive study." value={drops} min={0} max={12000} step={500} onChange={setDrops} />
                            <Dial label="Inertia" help="0 follows the current slope. 1 keeps its old direction. Source: 0.05." value={inertia} min={0} max={1} step={0.05} onChange={setInertia} />
                        </>
                    )}
                    <Dial
                        label={view === 'Curvature' ? 'Mark contrast' : 'Relief height'}
                        help="Exaggerates height or curvature without adding more detail."
                        value={relief}
                        min={0}
                        max={3}
                        step={0.1}
                        onChange={setRelief}
                    />
                </>
            }
        >
            <canvas ref={canvas} aria-label="Interactive eroded height field" />
        </Lab>
    );
}

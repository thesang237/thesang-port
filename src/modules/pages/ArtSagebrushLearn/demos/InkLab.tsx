'use client';

import { useCallback, useState } from 'react';

import { InkEllipse, InkStroke } from '../../ArtSagebrush/art/brush';
import { cv, vnorm } from '../../ArtSagebrush/art/math';
import { createNoise } from '../../ArtSagebrush/art/noise';
import { buildPalettes, type InkColor } from '../../ArtSagebrush/art/palette';
import { createPlantBuilders } from '../../ArtSagebrush/art/plants';
import { createRandom } from '../../ArtSagebrush/art/random';
import { useDrawing } from '../kit/canvas';
import { Demo, Slider } from '../kit/controls';

const DEFAULTS = { speed: 1, attraction: 0.02, wobble: 0.2, weight: 2.5, alpha: 64, seed: 42, height: 65, spacing: 1.5, specimens: 3 };
export default function InkLab({ mode = 'pen' }: { mode?: 'pen' | 'plants' | 'lettering' }) {
    const [params, setParams] = useState(DEFAULTS);
    const [playing, setPlaying] = useState(false);
    const [complete, setComplete] = useState(false);
    const finished = useCallback(() => setComplete(true), []);
    const [revision, setRevision] = useState(0);
    const [bush, setBush] = useState(false);
    const set = (key: keyof typeof DEFAULTS, value: number) => {
        setComplete(false);
        setParams((previous) => ({ ...previous, [key]: value }));
    };
    const setup = useCallback(
        (ctx: CanvasRenderingContext2D) => {
            // Revision is an explicit replay key. No external state is captured by the loop.
            void revision;
            const noise = createNoise(1337),
                random = createRandom(params.seed);
            ctx.fillStyle = '#e8e2d6';
            ctx.fillRect(0, 0, 720, 460);
            const strokes: InkStroke[] = [];
            if (mode === 'plants') {
                const palette = buildPalettes().treePalettes[5];
                const builders = createPlantBuilders({
                    rng: random,
                    noise,
                    shapes: strokes,
                    treePaletteColor: (brightness) => palette[Math.max(0, Math.min(palette.length - 1, Math.floor(brightness * palette.length)))],
                    lgt: vnorm(cv(0.866, -0.5)),
                    hMap: Array.from({ length: 10 }, () => Array(10).fill(0.5)),
                });
                for (let specimen = 0; specimen < params.specimens; specimen++) {
                    const x = (specimen - (params.specimens - 1) / 2) * 70;
                    if (bush) builders.addBush(x, 0, specimen, 0.7, params.height, 4, 4);
                    else builders.addTree(x, 0, specimen, 0.7, params.height);
                }
                ctx.setTransform(2, 0, 0, 2, 360, 390);
            } else if (mode === 'lettering') {
                // New composition, same source pen. Each stroke follows a compact path.
                const paths = [
                    [
                        [-115, 35],
                        [-115, -35],
                    ],
                    [
                        [-70, 35],
                        [-70, -35],
                        [-20, 35],
                        [-20, -35],
                    ],
                    [
                        [25, 35],
                        [25, -35],
                    ],
                    [
                        [75, -35],
                        [25, 0],
                        [80, 35],
                    ],
                ];
                paths.forEach((points) => {
                    const stroke = new InkStroke();
                    stroke.points = points.map(([x, y]) => ({ x, y }));
                    stroke.pen = cv(points[0][0], points[0][1]);
                    strokes.push(stroke);
                });
                ctx.setTransform(2.2, 0, 0, 2.2, 380, 230);
            } else {
                const stroke = new InkEllipse(0, 0, 55, 30, params.spacing, false);
                strokes.push(stroke);
                ctx.setTransform(3.5, 0, 0, 3.5, 360, 220);
            }
            if (mode !== 'plants')
                strokes.forEach((stroke) => {
                    stroke.setMaxV(params.speed);
                    stroke.setAcc(params.attraction);
                    stroke.setWobble(params.wobble);
                    stroke.setWeight(params.weight);
                    stroke.setDensity(2);
                    stroke.setColor([42, 69, 48, params.alpha] as InkColor);
                });
            // Show the ideal score as a faint underdrawing even before playback starts.
            ctx.save();
            ctx.strokeStyle = 'rgba(42,69,48,0.16)';
            ctx.lineWidth = 0.25;
            strokes.forEach((stroke) => {
                ctx.save();
                ctx.translate(stroke.x, stroke.y);
                ctx.rotate(stroke.angle);
                ctx.beginPath();
                stroke.points.forEach((point, index) => {
                    if (index === 0) ctx.moveTo(point.x, point.y);
                    else ctx.lineTo(point.x, point.y);
                });
                ctx.stroke();
                ctx.restore();
            });
            ctx.restore();
            const transform = ctx.getTransform();
            ctx.resetTransform();
            let index = 0;
            const drawRandom = createRandom(params.seed + 1);
            return {
                step() {
                    const start = performance.now();
                    let steps = 0;
                    ctx.setTransform(transform);
                    while (index < strokes.length && steps < 2000) {
                        if (strokes[index].update(ctx, noise, drawRandom) === 'done') index++;
                        steps++;
                        if (steps % 32 === 0 && performance.now() - start > 6) break;
                    }
                    ctx.resetTransform();
                    return index === strokes.length;
                },
            };
        },
        [params, mode, bush, revision],
    );
    const canvas = useDrawing(setup, playing, finished);
    const title = mode === 'plants' ? 'The botanical specimen bench' : mode === 'lettering' ? 'Ink without a landscape' : 'The score and the performance';
    return (
        <Demo
            title={title}
            hint="The faint line is the ideal path. Press Draw to let the source pen interpret it. Changing a dial starts a fresh study."
            onReset={() => {
                setComplete(false);
                setParams(DEFAULTS);
                setBush(false);
                setPlaying(false);
                setRevision((value) => value + 1);
            }}
            controls={
                <>
                    <button type="button" className="sg-primary" disabled={complete} onClick={() => setPlaying(!playing)}>
                        {complete ? 'Drawing complete' : playing ? 'Pause drawing' : 'Draw / resume'}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setComplete(false);
                            setPlaying(true);
                            setRevision((value) => value + 1);
                        }}
                    >
                        Clear & replay
                    </button>
                    {mode === 'plants' ? (
                        <>
                            <Slider
                                label="Specimens"
                                help="A new atlas composition: repeat the source plant grammar across one sheet."
                                value={params.specimens}
                                min={1}
                                max={5}
                                onChange={(value) => set('specimens', value)}
                            />
                            <Slider
                                label="Plant height"
                                help="Source tree height spans 10–80 artwork units. The plant uses the original branch and leaf grammar."
                                value={params.height}
                                min={10}
                                max={80}
                                onChange={(value) => set('height', value)}
                            />
                            <Slider label="Specimen seed" help="Same grammar, another branching structure." value={params.seed} min={0} max={100} onChange={(value) => set('seed', value)} />
                            <button
                                type="button"
                                aria-pressed={bush}
                                onClick={() => {
                                    setComplete(false);
                                    setBush(!bush);
                                }}
                            >
                                {bush ? 'Grow a tree' : 'Grow a scrub clump'}
                            </button>
                            <p className="sg-note">Tree and scrub studies use the source’s own brush settings. This isolates the grammar from terrain placement.</p>
                        </>
                    ) : (
                        <>
                            {mode === 'pen' && (
                                <Slider
                                    label="Hatch spacing"
                                    help="Source ground paths sample 1–2 units apart. Wider spacing reveals the zigzag underneath the ink."
                                    value={params.spacing}
                                    min={0.5}
                                    max={8}
                                    step={0.5}
                                    onChange={(value) => set('spacing', value)}
                                />
                            )}
                            <Slider
                                label="Speed limit"
                                help="Maximum travel per simulation step. Source ground strokes use 1."
                                value={params.speed}
                                min={0.2}
                                max={4}
                                step={0.1}
                                onChange={(value) => set('speed', value)}
                            />
                            <Slider
                                label="Attraction"
                                help="How strongly the pen chases its next target. Source: 0.02."
                                value={params.attraction}
                                min={0.005}
                                max={0.1}
                                step={0.005}
                                onChange={(value) => set('attraction', value)}
                            />
                            <Slider
                                label="Wobble"
                                help="Random force on the pen, not random displacement of the path. Source: 0.2."
                                value={params.wobble}
                                min={0}
                                max={0.8}
                                step={0.05}
                                onChange={(value) => set('wobble', value)}
                            />
                            <Slider
                                label="Brush width"
                                help="Diameter of the cloud of dots around the pen. Source: 2.5."
                                value={params.weight}
                                min={0.5}
                                max={12}
                                step={0.5}
                                onChange={(value) => set('weight', value)}
                            />
                            <Slider
                                label="Ink alpha"
                                help="Source: 64 out of 255. Opaque ink hides the build-up of overlapping marks."
                                value={params.alpha}
                                min={16}
                                max={255}
                                onChange={(value) => set('alpha', value)}
                            />
                        </>
                    )}
                </>
            }
        >
            <canvas ref={canvas} width={720} height={460} aria-label={title} />
            <p className="sg-readout" role="status">
                {complete ? 'Study complete. Clear & replay to watch the same seed again.' : 'Source InkStroke · persistent seeded stream · 6 ms / frame budget · pauses off screen'}
            </p>
        </Demo>
    );
}

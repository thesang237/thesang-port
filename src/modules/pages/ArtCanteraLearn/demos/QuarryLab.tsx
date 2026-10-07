'use client';
import { useCallback, useState } from 'react';

import { cube, LocalRandom, PAPER, projectStudy } from '../kit/art';
import { useStudyCanvas } from '../kit/canvas';
import { Choice, Dial, Lab } from '../kit/ui';

export default function QuarryLab({ projection = false, pipeline = false }: { projection?: boolean; pipeline?: boolean }) {
    const [cut, setCut] = useState(0.38);
    const [seed, setSeed] = useState(19);
    const [turn, setTurn] = useState(-45);
    const [tilt, setTilt] = useState(45);
    const [stage, setStage] = useState(5);
    const [mode, setMode] = useState<'Quarry' | 'Arcade' | 'Monolith'>('Quarry');
    const [grounded, setGrounded] = useState(true);
    const draw = useCallback(
        (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            ctx.fillStyle = PAPER;
            ctx.fillRect(0, 0, w, h);
            const random = new LocalRandom(seed);
            const cells = new Set<string>();
            const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
            for (let x = 0; x < 7; x++)
                for (let y = 0; y < 7; y++)
                    for (let z = 0; z < 6; z++) {
                        const carve = mode === 'Arcade' ? (x + seed) % 3 === 1 && z < Math.round(cut * 8) : mode === 'Monolith' ? Math.hypot(x - 3, y - 3) < cut * 5 && z < 5 : random.next() < cut;
                        const height = pipeline && stage === 1 ? 5 : 2 + Math.round(2 * Math.sin(x * 0.7) + Math.cos(y * 0.6));
                        if (z <= height && (!carve || (pipeline && stage < 3))) cells.add(key(x, y, z));
                    }
            const supported = new Set<string>();
            const frontier: string[] = [];
            for (let x = 0; x < 7; x++)
                for (let y = 0; y < 7; y++)
                    if (cells.has(key(x, y, 0))) {
                        const k = key(x, y, 0);
                        supported.add(k);
                        frontier.push(k);
                    }
            // Teaching copy: plain six-neighbour reachability. The source also respects terrain boundaries and flat tops.
            for (let i = 0; i < frontier.length; i++) {
                const [x, y, z] = frontier[i].split(',').map(Number);
                for (const [dx, dy, dz] of [
                    [1, 0, 0],
                    [-1, 0, 0],
                    [0, 1, 0],
                    [0, -1, 0],
                    [0, 0, 1],
                    [0, 0, -1],
                ]) {
                    const k = key(x + dx, y + dy, z + dz);
                    if (cells.has(k) && !supported.has(k)) {
                        supported.add(k);
                        frontier.push(k);
                    }
                }
            }
            const angle = (turn * Math.PI) / 180,
                elevation = (tilt * Math.PI) / 180;
            const visible = grounded && (!pipeline || stage >= 4) ? supported : cells;
            const ordered = [...visible].map((k) => k.split(',').map(Number)).sort((a, b) => projectStudy(a, w, h, angle, elevation)[2] - projectStudy(b, w, h, angle, elevation)[2]);
            for (const [x, y, z] of ordered) cube(ctx, (x - 3.5) * 8, (y - 3.5) * 8, z * 8, 8, w, h, angle, elevation, pipeline && stage >= 5);
            ctx.fillStyle = '#5b5148';
            ctx.font = '11px monospace';
            ctx.fillText(`${visible.size} cells · ${cells.size - supported.size} ungrounded`, 16, h - 16);
        },
        [cut, seed, turn, tilt, mode, grounded, stage, pipeline],
    );
    const canvas = useStudyCanvas(draw);
    return (
        <Lab
            title={projection ? 'A camera for a print' : pipeline ? 'From ground to carved object' : 'Compose the empty space'}
            hint={projection ? 'Rotate the camera. Parallel edges stay parallel.' : 'Try Monolith, then widen the void. Watch the structure change.'}
            reset={() => {
                setCut(0.38);
                setSeed(19);
                setTurn(-45);
                setTilt(45);
                setStage(5);
                setMode('Quarry');
                setGrounded(true);
            }}
            note="Teaching sculpture: 7 × 7 × 6 cells. Source cells are 8 world units; original carving joins offset axis segments and clears their bounding volumes."
            controls={
                <>
                    {pipeline && (
                        <Dial
                            label="Build stage"
                            help={['', '1 · Solid block', '2 · Height silhouette', '3 · Carved voids', '4 · Grounded cells', '5 · Surface color'][stage]}
                            value={stage}
                            min={1}
                            max={5}
                            onChange={setStage}
                        />
                    )}
                    <Choice label="Artistic rule" options={['Quarry', 'Arcade', 'Monolith'] as const} value={mode} onChange={setMode} />
                    <Dial label="Void amount" help="Teaching dial for removed space; the source uses noise thresholds of 0.4 or 0.6." value={cut} min={0} max={0.9} step={0.02} onChange={setCut} />
                    <Dial label="Seed" help="A new local stream rearranges cuts while keeping the rule." value={seed} min={1} max={99} onChange={setSeed} />
                    {projection && (
                        <>
                            <Dial label="Camera turn" help="Source diagonal view: −45°. The front view uses 0°." value={turn} min={-85} max={0} onChange={setTurn} />
                            <Dial label="Camera tilt" help="Source: 45°. A low angle hides the rooftops." value={tilt} min={5} max={85} onChange={setTilt} />
                        </>
                    )}
                    <button type="button" className="cl-button" aria-pressed={grounded} onClick={() => setGrounded(!grounded)}>
                        {grounded ? 'Grounding on' : 'Grounding off'}
                    </button>
                </>
            }
        >
            <canvas ref={canvas} aria-label="Interactive orthographic carved block sculpture" />
        </Lab>
    );
}

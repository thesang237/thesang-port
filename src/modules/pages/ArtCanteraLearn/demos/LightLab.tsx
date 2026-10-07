'use client';
import { useCallback, useState } from 'react';

import { LocalRandom, PAPER } from '../kit/art';
import { useStudyCanvas } from '../kit/canvas';
import { Choice, Dial, Lab } from '../kit/ui';

export default function LightLab({ grain = false }: { grain?: boolean }) {
    const [spread, setSpread] = useState(0.2),
        [samples, setSamples] = useState(2),
        [passes, setPasses] = useState(1),
        [sun, setSun] = useState(35);
    const [mode, setMode] = useState<'Light rays' | 'Print'>('Print');
    const draw = useCallback(
        (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            ctx.fillStyle = PAPER;
            ctx.fillRect(0, 0, w, h);
            const random = new LocalRandom(19);
            const ground = h * 0.72,
                top = h * 0.29,
                left = w * 0.28,
                right = w * 0.43;
            const slope = Math.tan((sun * Math.PI) / 180);
            if (mode === 'Light rays') {
                ctx.fillStyle = '#777065';
                ctx.fillRect(left, top, right - left, ground - top);
                for (let i = 0; i < samples; i++) {
                    const raySlope = slope + (random.next() - 0.5) * spread * 3;
                    ctx.beginPath();
                    ctx.moveTo(right, top);
                    ctx.lineTo(right + (ground - top) / raySlope, ground);
                    ctx.strokeStyle = '#9a4e3370';
                    ctx.stroke();
                }
                ctx.strokeStyle = '#292724';
                ctx.beginPath();
                ctx.moveTo(16, ground);
                ctx.lineTo(w - 16, ground);
                ctx.stroke();
                return;
            }
            const image = ctx.createImageData(240, Math.max(1, Math.round((h / w) * 240)));
            for (let y = 0; y < image.height; y++)
                for (let x = 0; x < image.width; x++) {
                    const screenX = (x * w) / image.width;
                    const screenY = (y * h) / image.height;
                    let brightness = 0;
                    for (let s = 0; s < samples * passes; s++) {
                        const raySlope = slope + (random.next() - 0.5) * spread * 3;
                        const shadowEnd = right + (ground - top) / Math.max(0.05, raySlope);
                        const block = screenX >= left && screenX <= right && screenY >= top && screenY <= ground;
                        const shadow = screenY > ground && screenX > right && screenX < shadowEnd + (screenY - ground) * 0.4;
                        brightness += block ? 0.4 : shadow ? 0.27 : 0.92;
                    }
                    brightness /= samples * passes;
                    const noise = grain ? ((random.next() - 0.5) * 0.5) / Math.sqrt(passes) : 0;
                    const tone = Math.max(0, Math.min(1, brightness + noise));
                    const i = 4 * (y * image.width + x);
                    image.data[i] = tone * 244;
                    image.data[i + 1] = tone * 229;
                    image.data[i + 2] = tone * 210;
                    image.data[i + 3] = 255;
                }
            // putImageData ignores the DPR transform. Use a small raster then scale it to the stage.
            const buffer = document.createElement('canvas');
            buffer.width = image.width;
            buffer.height = image.height;
            buffer.getContext('2d')?.putImageData(image, 0, 0);
            ctx.drawImage(buffer, 0, 0, w, h);
        },
        [spread, samples, passes, sun, mode, grain],
    );
    const canvas = useStudyCanvas(draw);
    return (
        <Lab
            title={grain ? 'A print built by averaging' : 'A shadow is many questions'}
            hint="Switch to rays to see the construction. Raise spread to soften the shadow."
            reset={() => {
                setSpread(0.2);
                setSamples(2);
                setPasses(1);
                setSun(35);
                setMode('Print');
            }}
            note="Teaching cross-section. The source casts two jittered shadow rays per hit, then averages the print across four interleaved passes per sample."
            controls={
                <>
                    <Choice label="Look inside" options={['Print', 'Light rays'] as const} value={mode} onChange={setMode} />
                    <Dial label="Sun angle" help="Changes how far the shadow travels. This is a teaching view of the source's rotated light vector." value={sun} min={10} max={75} onChange={setSun} />
                    <Dial label="Light spread" help="Source horizontal jitter width: 0.2 radians. 0 produces a sharp edge." value={spread} min={0} max={0.6} step={0.02} onChange={setSpread} />
                    <Dial label="Rays per point" help="Source: 2. More questions smooth out random shadow samples." value={samples} min={1} max={8} onChange={setSamples} />
                    {grain && (
                        <Dial label="Accumulated samples" help="Averages more prints; the source covers pixels in four checkerboard offsets." value={passes} min={1} max={20} onChange={setPasses} />
                    )}
                </>
            }
        >
            <canvas ref={canvas} aria-label="Soft shadow and progressive print sampling experiment" />
        </Lab>
    );
}

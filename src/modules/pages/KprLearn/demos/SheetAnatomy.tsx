'use client';

import { useEffect, useRef, useState } from 'react';

import { Btn, Demo, Readout, Slider } from '../kit/controls';
import { useParams, useTicker } from '../kit/loop';
import { IMAGES, loadAtlas } from '../kit/source';

type Frame = { x: number; y: number; w: number; h: number; name: string };
const DEFAULTS = { fps: 56, frame: 0, playing: true };

/**
 * Chapter 09: header-sprite.webp (the opening's barcode) and its TexturePacker JSON, read with the
 * source's own loadAtlas(). Left: the whole sheet with the current frame outlined. Right: that frame.
 */
export default function SheetAnatomy() {
    const host = useRef<HTMLDivElement>(null);
    const sheetCv = useRef<HTMLCanvasElement>(null);
    const frameCv = useRef<HTMLCanvasElement>(null);
    const [frames, setFrames] = useState<Frame[]>([]);
    const img = useRef<HTMLCanvasElement | null>(null);
    const { p, set, ref, reset } = useParams({ ...DEFAULTS, playing: !window.matchMedia('(prefers-reduced-motion: reduce)').matches });
    const clock = useRef(0);
    const [shown, setShown] = useState(0);

    useEffect(() => {
        let alive = true;
        const im = new Image();
        im.src = IMAGES.headerSprite;
        Promise.all([loadAtlas('/kpr/tex/header-sprite.json'), im.decode()])
            .then(([atlas]) => {
                if (!alive) return;
                // the page only uses the sheet's alpha, drawn in one colour (black for the opening)
                const tint = document.createElement('canvas');
                tint.width = im.width;
                tint.height = im.height;
                const g = tint.getContext('2d')!;
                g.drawImage(im, 0, 0);
                g.globalCompositeOperation = 'source-in';
                g.fillStyle = '#0c0c0e';
                g.fillRect(0, 0, tint.width, tint.height);
                img.current = tint;
                const { w: W, h: H } = atlas.size;
                // loadAtlas returns GL uvs (y flipped); turn them back into sheet pixels for 2D drawing
                setFrames(atlas.frames.map((f) => ({ x: f.u * W, y: (1 - f.v - f.h) * H, w: f.w * W, h: f.h * H, name: f.name })));
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);

    const draw = (i: number) => {
        const im = img.current;
        const f = frames[i];
        if (!im || !f) return;
        const a = sheetCv.current!.getContext('2d')!;
        const S = sheetCv.current!.width;
        a.fillStyle = '#efedf8';
        a.fillRect(0, 0, S, S);
        a.drawImage(im, 0, 0, S, S);
        const k = S / im.width;
        a.strokeStyle = '#5b4daa';
        a.lineWidth = 3;
        a.strokeRect(f.x * k - 1.5, f.y * k - 1.5, f.w * k + 3, f.h * k + 3);
        a.fillStyle = 'rgba(192,251,80,0.45)';
        a.fillRect(f.x * k, f.y * k, f.w * k, f.h * k);
        const b = frameCv.current!.getContext('2d')!;
        const FW = frameCv.current!.width;
        const FH = frameCv.current!.height;
        b.fillStyle = '#ffffff';
        b.fillRect(0, 0, FW, FH);
        b.imageSmoothingEnabled = false;
        b.drawImage(im, f.x, f.y, f.w, f.h, 0, 0, FW, FH);
    };

    useTicker(host, (_t, dt) => {
        if (!frames.length) return;
        const d = ref.current;
        if (d.playing) clock.current = (clock.current + dt * d.fps) % frames.length;
        else clock.current = d.frame;
        const i = Math.floor(clock.current);
        draw(i);
        if (i !== shown) setShown(i);
    });

    const f = frames[shown];
    return (
        <Demo
            title="Anatomy of a sprite sheet — header-sprite.webp"
            hint="131 frames of 220 × 124 px packed into one 2048 px image. The player only moves a rectangle across the sheet."
            onReset={reset}
            controls={
                <>
                    <Btn primary onClick={() => set('playing', !p.playing)}>
                        {p.playing ? '❚❚ Pause' : '▶ Play'}
                    </Btn>
                    <Slider
                        label="frame"
                        value={p.playing ? shown : p.frame}
                        min={0}
                        max={Math.max(1, frames.length - 1)}
                        step={1}
                        onChange={(v) => {
                            set('playing', false);
                            set('frame', v);
                        }}
                    />
                    <Slider label="fps" value={p.fps} min={4} max={120} step={1} onChange={(v) => set('fps', v)} help="The opening plays this sheet at 56 fps." />
                    <Readout
                        items={[
                            { label: 'frame', value: f ? `${shown + 1}/${frames.length}` : '—', color: '#c0fb50' },
                            { label: 'x, y', value: f ? `${f.x}, ${f.y}` : '—' },
                            { label: 'size', value: f ? `${f.w}×${f.h}` : '—' },
                            { label: 'file', value: f ? f.name.replace('.png', '') : '—' },
                        ]}
                    />
                </>
            }
        >
            <div ref={host} className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:p-6">
                <figure>
                    <canvas ref={sheetCv} width={640} height={640} className="block aspect-square w-full" aria-label="The whole sprite sheet, current frame highlighted" role="img" />
                    <figcaption className="kl-mono mt-2 text-[10.5px] uppercase text-[var(--kl-dim)]">The sheet (2048 × 2048)</figcaption>
                </figure>
                <figure className="self-center">
                    <canvas ref={frameCv} width={660} height={372} className="block aspect-[220/124] w-full border border-[var(--kl-line-2)]" aria-label="The current frame, enlarged" role="img" />
                    <figcaption className="kl-mono mt-2 text-[10.5px] uppercase text-[var(--kl-dim)]">One frame, enlarged 3× (pixelated on purpose)</figcaption>
                </figure>
            </div>
        </Demo>
    );
}

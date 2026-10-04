'use client';

import { Demo, Segmented, Slider } from '../kit/controls';
import { useParams } from '../kit/loop';

/**
 * What goes into one world's picture, pulled apart — real captures of the DNA stop: the scene (here only
 * the background card), the fx layer (the DNA strands and bokeh, seen through the reference camera), then
 * the titles in screen pixels. Engine.renderWorld draws them in
 * this order into the same render target, clearing only the depth between layers.
 */
const DEFAULTS = { explode: 0.65, view: 'angle' as 'angle' | 'front' };

export default function LayerStack() {
    const { p, set, reset } = useParams(DEFAULTS);
    const e = p.explode;
    const angled = p.view === 'angle';
    const layers = [
        { k: 'scene', label: '1 · scene: the background card', sub: 'render(world.scene, world.camera)' },
        { k: 'fx', label: '2 · fx: DNA strands + bokeh', sub: 'clearDepth → render(world.fx, world.fxCamera)' },
        { k: 'overlay', label: '3 · overlay: the title', sub: 'clearDepth → render(world.overlay, overlayCam)' },
    ];
    return (
        <Demo
            title="Inside one world’s picture"
            hint="Pull the layers apart. Each world draws these three passes into its own render target; the composite then only sees the flat result."
            onReset={reset}
            controls={
                <>
                    <Slider label="explode" value={p.explode} min={0} max={1} step={0.01} onChange={(v) => set('explode', v)} help="0 = the flat picture the composite receives." />
                    <Segmented label="view" options={['angle', 'front'] as const} value={p.view} onChange={(v) => set('view', v)} />
                </>
            }
        >
            <div className="cl-scrollbox overflow-x-auto" data-lenis-prevent>
                <div className="flex min-w-[560px] items-center justify-center px-6 py-10" style={{ perspective: '1600px' }}>
                    <div
                        className="relative aspect-[1920/994] w-[min(86%,640px)]"
                        style={{ transformStyle: 'preserve-3d', transform: angled ? 'rotateX(52deg) rotateZ(-28deg)' : 'none', transition: 'transform 0.9s var(--cl-ease)' }}
                    >
                        {layers.map((l, i) => (
                            <div
                                key={l.k}
                                className="absolute inset-0 overflow-hidden rounded-md"
                                style={{
                                    transform: `translateZ(${i * e * 150}px)`,
                                    outline: e > 0.05 ? '1px solid rgba(85,255,194,0.45)' : 'none',
                                    transition: 'transform 0.25s',
                                }}
                            >
                                {l.k === 'scene' && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src="/corn-learn/stops/layer_scene.webp" alt="" className="size-full object-cover" />
                                )}
                                {l.k === 'fx' && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src="/corn-learn/stops/layer_fx.webp" alt="" className="size-full object-cover" />
                                )}
                                {l.k === 'overlay' && (
                                    <div className="cl-display absolute left-[8%] top-[30%] text-[clamp(16px,3.4vw,34px)] leading-[0.99] text-white">
                                        <span className="block">IT STARTS WITH</span>
                                        <span className="block">A DEEP LIBRARY.</span>
                                    </div>
                                )}
                                <span
                                    className="cl-mono absolute bottom-1.5 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[9.5px] uppercase text-[var(--cl-mint)]"
                                    style={{ opacity: e > 0.15 ? 1 : 0, transition: 'opacity 0.3s' }}
                                >
                                    {l.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="grid gap-2 border-t border-[var(--cl-line)] p-4 sm:grid-cols-3">
                {layers.map((l) => (
                    <div key={l.k}>
                        <div className="cl-mono text-[10.5px] uppercase text-[var(--cl-mint)]">{l.label}</div>
                        <div className="cl-mono text-[11px] text-[var(--cl-dim)]">{l.sub}</div>
                    </div>
                ))}
            </div>
        </Demo>
    );
}

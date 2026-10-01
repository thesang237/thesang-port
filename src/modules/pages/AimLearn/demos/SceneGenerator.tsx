'use client';

import { useState } from 'react';

import { Btn, Demo, Group, Segmented, Slider } from '../kit/controls';
import { useParams } from '../kit/loop';
import { type Key, sample } from '../kit/source';

type Prop = 'opacity' | 'y' | 'x' | 'scale';

type Layer = { id: string; name: string; prop: Prop; start: number; end: number };

const FROM_TO: Record<Prop, [number, number]> = { opacity: [0, 1], y: [100, 0], x: [-100, 0], scale: [0.6, 1] };
const GSAP_PROP: Record<Prop, [string, string]> = {
    opacity: ['opacity: 0', 'opacity: 1'],
    y: ['yPercent: 100', 'yPercent: 0'],
    x: ['xPercent: -100', 'xPercent: 0'],
    scale: ['scale: 0.6', 'scale: 1'],
};

const DEFAULTS = {
    pin: 'sticky' as 'sticky' | 'gsap',
    screens: 6,
    smoothing: 70,
    progress: 40,
    layers: [
        { id: 'a', name: 'photo', prop: 'y' as Prop, start: 0, end: 25 },
        { id: 'b', name: 'heading', prop: 'opacity' as Prop, start: 20, end: 40 },
        { id: 'c', name: 'card', prop: 'scale' as Prop, start: 35, end: 70 },
    ] as Layer[],
};

/** GSAP's scrub is a catch-up time in seconds: convert the page's per-frame smoothing to the time it needs to cover 97% of a jump. */
const scrubSeconds = (smoothing: number) => {
    const keep = 1 - Math.max(1 - smoothing / 100, 0.01);
    return keep <= 0 ? 0 : Math.max(0.05, Math.round((Math.log(0.03) / Math.log(keep) / 60) * 100) / 100);
};

const keysOf = (l: Layer): Key[] => [
    [l.start, FROM_TO[l.prop][0]],
    [Math.max(l.end, l.start + 1), FROM_TO[l.prop][1]],
];

const style = (l: Layer, at: number) => {
    const v = sample(keysOf(l), at);
    return l.prop === 'opacity' ? { opacity: v } : l.prop === 'y' ? { transform: `translateY(${v}%)` } : l.prop === 'x' ? { transform: `translateX(${v}%)` } : { transform: `scale(${v})` };
};

/** A tiny “After Effects for scroll”: three layers, a start and end for each, and the code that reproduces it. */
export default function SceneGenerator() {
    const { p, set } = useParams(DEFAULTS);
    const [copied, setCopied] = useState(false);

    const setLayer = (id: string, patch: Partial<Layer>) =>
        set(
            'layers',
            p.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        );

    const trackCode = p.layers.map((l) => `const ${l.name}: Key[] = [[${l.start}, ${FROM_TO[l.prop][0]}], [${Math.max(l.end, l.start + 1)}, ${FROM_TO[l.prop][1]}]]   // ${l.prop}`).join('\n');
    const scrub = p.smoothing === 0 ? 'true' : String(scrubSeconds(p.smoothing));
    const trigger =
        p.pin === 'sticky'
            ? `{ trigger: '.track', start: 'top top', end: 'bottom bottom', scrub: ${scrub} }   // scrub ≈ smoothing ${p.smoothing}`
            : `{ trigger: '.stage', start: 'top top', end: '+=${p.screens * 100}%', pin: true, scrub: ${scrub} }   // scrub ≈ smoothing ${p.smoothing}`;
    const gsapCode = `gsap.timeline({
  scrollTrigger: ${trigger},
  defaults: { ease: 'none' },            // scroll is the playhead: no curve
})
${p.layers.map((l) => `  .fromTo('.${l.name}', { ${GSAP_PROP[l.prop][0]} }, { ${GSAP_PROP[l.prop][1]}, duration: ${Math.max(l.end, l.start + 1) - l.start} }, ${l.start})`).join('\n')}
// timeline units = percent of the scroll: duration 100 = the whole track`;
    const cssCode =
        p.pin === 'sticky'
            ? `.track { height: ${p.screens * 100}vh; }                 /* the scroll you spend */\n.stage { position: sticky; top: 0; height: 100vh; }       /* the stage that stays */`
            : `.stage { height: 100vh; }          /* GSAP adds a pin-spacer ${p.screens * 100}vh tall around it */`;

    const copy = () => {
        void navigator.clipboard.writeText(`${cssCode}\n\n${trackCode}\n\n${gsapCode}`).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
        });
    };

    return (
        <Demo
            title="Scene generator: three layers, one progress, copyable code"
            hint="Choose what each layer does and when. Drag the preview progress to check it, then copy the CSS, the page-style tracks and the GSAP version."
            onReset={() => {
                set('layers', DEFAULTS.layers);
                set('screens', DEFAULTS.screens);
                set('smoothing', DEFAULTS.smoothing);
                set('pin', DEFAULTS.pin);
            }}
            controls={
                <>
                    <Segmented
                        label="pin with"
                        options={[
                            { value: 'sticky', label: 'CSS sticky' },
                            { value: 'gsap', label: 'GSAP pin' },
                        ]}
                        value={p.pin}
                        onChange={(v) => set('pin', v)}
                    />
                    <Slider
                        label="track length"
                        value={p.screens}
                        min={3}
                        max={12}
                        step={1}
                        onChange={(v) => set('screens', v)}
                        format={(v) => `${v * 100}vh`}
                        help="The page: 1000vh. Longer = slower, more patience needed."
                    />
                    <Slider label="smoothing" value={p.smoothing} min={0} max={95} step={1} onChange={(v) => set('smoothing', v)} help="The page: 70." />
                    {p.layers.map((l) => (
                        <Group key={l.id} title={`layer · ${l.name}`}>
                            <Segmented options={['y', 'x', 'opacity', 'scale'] as const} value={l.prop} onChange={(v) => setLayer(l.id, { prop: v })} />
                            <Slider label="starts at" value={l.start} min={0} max={95} step={1} onChange={(v) => setLayer(l.id, { start: v, end: Math.max(l.end, v + 1) })} format={(v) => `${v}%`} />
                            <Slider label="ends at" value={l.end} min={1} max={100} step={1} onChange={(v) => setLayer(l.id, { end: Math.max(v, l.start + 1) })} format={(v) => `${v}%`} />
                        </Group>
                    ))}
                </>
            }
        >
            <div className="space-y-4 bg-[var(--al-bg-2)] p-4">
                <div className="relative aspect-[16/9] overflow-hidden border border-[var(--al-ink)] bg-[#e7e4df]">
                    <div className="absolute left-[6%] top-[12%] h-[70%] w-[34%] overflow-hidden">
                        <div className="h-full w-full bg-[#ef5a1f]" style={style(p.layers[0], p.progress)} />
                    </div>
                    <div className="al-display absolute left-[45%] top-[16%] text-[clamp(22px,4vw,44px)] tracking-[-0.03em] text-[#141414]" style={style(p.layers[1], p.progress)}>
                        Heading
                    </div>
                    <div className="absolute bottom-[10%] right-[8%] h-[34%] w-[34%] bg-[#141414]" style={style(p.layers[2], p.progress)} />
                </div>
                <Slider label="preview progress" value={p.progress} min={0} max={100} step={1} onChange={(v) => set('progress', v)} format={(v) => `${v}%`} />
                <div className="relative h-12 border border-[var(--al-line-2)]" aria-hidden>
                    {p.layers.map((l, i) => (
                        <span
                            key={l.id}
                            className="al-mono absolute flex h-3.5 items-center overflow-hidden pl-1 text-[9px] text-white"
                            style={{ left: `${l.start}%`, width: `${Math.max(1, l.end - l.start)}%`, top: i * 15, background: ['var(--al-accent)', 'var(--al-blue)', 'var(--al-ink)'][i] }}
                        >
                            {l.name}
                        </span>
                    ))}
                    <span className="absolute inset-y-[-3px] w-[2px] bg-[var(--al-accent-ink)]" style={{ left: `${p.progress}%` }} />
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span className="al-mono text-[10px] uppercase tracking-[0.16em] text-[var(--al-faint)]">generated code</span>
                    <Btn onClick={copy}>{copied ? '✓ copied' : 'Copy all'}</Btn>
                </div>
                <pre className="al-code al-scrollbox max-h-[360px] overflow-auto bg-[#141414] p-4 text-[12px] leading-relaxed text-[#e7e4df]">
                    <code className="al-mono whitespace-pre">{`${cssCode}\n\n${trackCode}\n\n${gsapCode}`}</code>
                </pre>
            </div>
        </Demo>
    );
}

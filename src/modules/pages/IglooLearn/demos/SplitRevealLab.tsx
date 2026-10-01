'use client';

import { useRef, useState } from 'react';

import { Btn, Demo, Group, Segmented, Slider, Toggle } from '../kit/controls';
import { gsap, SplitText, useGSAP } from '../kit/gsap';
import { useParams } from '../kit/loop';

type Split = 'lines' | 'words' | 'chars';
type Params = { split: Split; mask: boolean; y: number; rotate: number; blur: number; stagger: number; duration: number; ease: string };

const PRESETS: Record<string, { text: string; p: Params }> = {
    'Igloo manifesto': {
        text: 'Our mission is to build the next generation of consumer brands at the intersection of Community, AI, and crypto.',
        p: { split: 'lines', mask: true, y: 110, rotate: 0, blur: 0, stagger: 0.07, duration: 0.9, ease: 'expo.out' },
    },
    'Igloo caption': {
        text: 'Companies we build, back, and keep cold-stored until they are ready to melt the internet.',
        p: { split: 'words', mask: true, y: 120, rotate: 4, blur: 0, stagger: 0.025, duration: 1, ease: 'expo.out' },
    },
    'Char cascade': {
        text: 'Find us in the cold.',
        p: { split: 'chars', mask: true, y: 100, rotate: 0, blur: 0, stagger: 0.02, duration: 0.8, ease: 'power4.out' },
    },
    'Soft focus': {
        text: 'Community, AI and crypto converging into a single core.',
        p: { split: 'words', mask: false, y: 30, rotate: 0, blur: 12, stagger: 0.05, duration: 1.2, ease: 'power3.out' },
    },
};

const DEFAULT = PRESETS['Igloo caption'].p;

/** SplitText playground: every dial of a masked text reveal. */
export default function SplitRevealLab() {
    const { p, set, ref } = useParams<Params>(DEFAULT);
    const [text, setText] = useState(PRESETS['Igloo caption'].text);
    const [preset, setPreset] = useState('Igloo caption');
    const [run, setRun] = useState(0);
    const stage = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            const P = ref.current;
            const el = stage.current?.querySelector('.srl-text');
            if (!el) return;
            const split = SplitText.create(el, { type: P.split === 'lines' ? 'lines' : P.split === 'words' ? 'lines,words' : 'lines,words,chars', mask: P.mask ? 'lines' : undefined });
            const targets = P.split === 'lines' ? split.lines : P.split === 'words' ? split.words : split.chars;
            gsap.from(targets, {
                yPercent: P.y,
                rotate: P.rotate,
                filter: P.blur ? `blur(${P.blur}px)` : undefined,
                opacity: P.mask ? 1 : 0,
                duration: P.duration,
                ease: P.ease,
                stagger: P.stagger,
                delay: 0.15,
            });
            return () => split.revert();
        },
        { scope: stage, dependencies: [run, text, p], revertOnUpdate: true },
    );

    const apply = (name: string) => {
        const pr = PRESETS[name];
        setPreset(name);
        setText(pr.text);
        (Object.keys(pr.p) as (keyof Params)[]).forEach((k) => set(k, pr.p[k] as never));
    };

    return (
        <Demo
            title="Split & reveal lab"
            hint="Pick a preset, then break it: remove the mask, switch lines → chars, crank the stagger. Every change replays."
            onReset={() => apply('Igloo caption')}
            controls={
                <>
                    <Group title="Preset">
                        <Segmented options={Object.keys(PRESETS)} value={preset} onChange={apply} />
                    </Group>
                    <Group title="Split">
                        <Segmented label="split into" options={['lines', 'words', 'chars'] as const} value={p.split} onChange={(v) => set('split', v)} />
                        <Toggle
                            label="mask (overflow: hidden per line)"
                            checked={p.mask}
                            onChange={(v) => set('mask', v)}
                            help="On: text rises out of an invisible slot. Off: it floats in from nowhere."
                        />
                    </Group>
                    <Group title="Motion">
                        <Slider label="from y (%)" value={p.y} min={0} max={200} step={1} onChange={(v) => set('y', v)} help="110 = just below the mask line." />
                        <Slider
                            label="from rotate (°)"
                            value={p.rotate}
                            min={-20}
                            max={20}
                            step={0.5}
                            onChange={(v) => set('rotate', v)}
                            help="Igloo captions tilt 4° — words feel tossed, not slid."
                        />
                        <Slider label="from blur (px)" value={p.blur} min={0} max={24} step={1} onChange={(v) => set('blur', v)} />
                        <Slider label="stagger (s)" value={p.stagger} min={0} max={0.2} step={0.005} onChange={(v) => set('stagger', v)} />
                        <Slider label="duration (s)" value={p.duration} min={0.2} max={2.5} step={0.05} onChange={(v) => set('duration', v)} />
                        <Segmented label="ease" options={['expo.out', 'power4.out', 'power3.out', 'back.out(1.7)', 'none'] as const} value={p.ease} onChange={(v) => set('ease', v)} />
                    </Group>
                </>
            }
        >
            <div ref={stage} className="flex min-h-[380px] flex-col justify-between gap-6 p-6 sm:p-10">
                <div className="flex items-center justify-between gap-3">
                    <span className="il-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--il-ice)]">{`////// ${preset}`}</span>
                    <Btn primary onClick={() => setRun((r) => r + 1)}>
                        ↻ Replay
                    </Btn>
                </div>
                <p key={`${text}-${p.split}-${p.mask}`} className="srl-text max-w-[22ch] text-[clamp(26px,3.6vw,46px)] font-semibold leading-[1.08] tracking-[-0.03em]">
                    {text}
                </p>
                <label className="block">
                    <span className="il-mono mb-1 block text-[10px] uppercase tracking-[0.14em] text-[var(--il-faint)]">Your text</span>
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full rounded-lg border border-[var(--il-line-2)] bg-black/25 px-3 py-2 text-[14px] text-[var(--il-ink)] outline-none focus:border-[var(--il-ice)]"
                    />
                </label>
            </div>
        </Demo>
    );
}

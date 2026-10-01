'use client';

import { useEffect, useRef, useState } from 'react';

import { ambience } from '@/modules/pages/Igloo/utils/sound';

import { Btn, Demo, Slider, Toggle } from '../kit/controls';

const TICKS = [
    { label: 'close', f: 900 },
    { label: 'shock', f: 700 },
    { label: 'prev', f: 1300 },
    { label: 'rail', f: 1500 },
    { label: 'next', f: 1600 },
    { label: 'open', f: 1900 },
    { label: 'label', f: 2200 },
    { label: 'tweak', f: 2300 },
];

/** Igloo's generated soundscape — the real engine from utils/sound.ts. */
export default function SoundLab() {
    const [on, setOn] = useState(false);
    const [vel, setVel] = useState(0);
    const [freq, setFreq] = useState(1800);

    const wasOn = useRef(false);
    // only touch the AudioContext if the user turned sound on (autoplay rules)
    useEffect(
        () => () => {
            if (wasOn.current) ambience.toggle(false);
        },
        [],
    );
    useEffect(() => {
        if (on) ambience.setIntensity(vel);
    }, [vel, on]);

    return (
        <Demo
            title="Sound lab — no audio files"
            hint="Turn sound on (headphones recommended). Hover the tick buttons; drag “scroll speed” to hear the wind filter open like on Igloo."
            controls={
                <>
                    <Toggle
                        label="ambience (wind + drones)"
                        checked={on}
                        onChange={(v) => {
                            ambience.toggle(v);
                            wasOn.current = wasOn.current || v;
                            setOn(v);
                        }}
                        help="Brown noise through a band-pass filter (wind), a slow LFO sweeping it (gusts), and three detuned sine drones."
                    />
                    <Slider label="scroll speed → wind" value={vel} min={0} max={1} onChange={setVel} help="On Igloo: |lenis.velocity| / 40 → filter resonance Q. Scroll faster, the wind whistles." />
                    <Slider label="custom tick pitch (Hz)" value={freq} min={200} max={4000} step={10} onChange={setFreq} />
                    <div className="flex flex-wrap gap-2">
                        <Btn onClick={() => ambience.tick(freq)}>Tick</Btn>
                        <Btn onClick={() => ambience.whoosh()}>Whoosh (shape change)</Btn>
                    </div>
                    {!on && <p className="text-[12px] text-[var(--il-warn)]">Sound is off — ticks are silent until you enable ambience, just like on the page.</p>}
                </>
            }
        >
            <div className="grid h-full min-h-[300px] grid-cols-2 gap-px bg-[var(--il-line)] sm:grid-cols-4">
                {TICKS.map((t) => (
                    <button
                        key={t.label}
                        type="button"
                        onMouseEnter={() => ambience.tick(t.f)}
                        onClick={() => ambience.tick(t.f)}
                        className="il-mono flex flex-col items-center justify-center gap-1 bg-[var(--il-panel)] p-4 text-[11px] text-[var(--il-dim)] transition-colors hover:bg-[var(--il-panel-2)] hover:text-[var(--il-ink)]"
                    >
                        <span className="text-[13px] text-[var(--il-ink)]">{t.label}</span>
                        <span className="tabular-nums text-[var(--il-ice)]">{`${t.f} Hz`}</span>
                    </button>
                ))}
            </div>
        </Demo>
    );
}

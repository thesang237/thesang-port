'use client';

import { useState } from 'react';

import { MANIFESTO } from '@/modules/pages/Igloo/data';

import { Demo, Segmented, Slider } from '../kit/controls';
import { useParams } from '../kit/loop';
import { smoothstep } from '../kit/math';

const DEFAULTS = { soft: 0.12, dim: 0.14, style: 'opacity' as 'opacity' | '+ blur' | '+ rise' };

/**
 * Reading on rails: each word owns a position along the scroll. As progress
 * passes it, the word lights up. No timeline — just a mapping per word.
 */
export default function ScrubWords() {
    const { p, set, reset } = useParams(DEFAULTS);
    const [prog, setProg] = useState(0.35);
    const words = MANIFESTO.split(' ');
    const n = words.length;

    return (
        <Demo
            title="Scroll-scrubbed reading"
            hint="Scroll inside the box. Each word has its own trigger point; softness decides how many words are “in progress” at once."
            onReset={reset}
            controls={
                <>
                    <Slider
                        label="softness"
                        value={p.soft}
                        min={0.01}
                        max={0.6}
                        onChange={(v) => set('soft', v)}
                        help="Width of each word’s fade window. Small = a crisp typewriter; large = a gentle wash."
                    />
                    <Slider label="dim level" value={p.dim} min={0} max={0.6} onChange={(v) => set('dim', v)} help="How visible unread words are. 0.1–0.2 invites reading ahead." />
                    <Segmented label="style" options={['opacity', '+ blur', '+ rise'] as const} value={p.style} onChange={(v) => set('style', v)} />
                    <div className="il-mono rounded-lg border border-[var(--il-line)] bg-black/25 p-3 text-[10.5px] leading-relaxed text-[var(--il-dim)]">
                        {`at = i / (n − 1)`}
                        <br />
                        {`p′ = progress × (1 + soft)`}
                        <br />
                        {`a = smoothstep(at − soft, at, p′)`}
                        <br />
                        {`opacity = dim + (1 − dim) × a`}
                    </div>
                </>
            }
        >
            <div
                data-lenis-prevent
                className="il-scrollbox relative h-[380px] overflow-y-auto"
                onScroll={(e) => {
                    const el = e.currentTarget;
                    setProg(el.scrollTop / (el.scrollHeight - el.clientHeight));
                }}
                ref={(el) => {
                    if (el && !el.dataset.init) {
                        el.dataset.init = '1';
                        el.scrollTop = 0.35 * (el.scrollHeight - el.clientHeight);
                    }
                }}
            >
                <div className="h-[1500px]">
                    <div className="sticky top-0 flex h-[380px] flex-col justify-center px-6 sm:px-10">
                        <div className="il-mono mb-5 text-[10px] uppercase tracking-[0.18em] text-[var(--il-ice)]">{'////// Manifesto'}</div>
                        <p className="text-[clamp(22px,3vw,34px)] font-semibold leading-[1.18] tracking-[-0.025em]">
                            {words.map((w, i) => {
                                const at = i / (n - 1);
                                const a = smoothstep(at - p.soft, at, prog * (1 + p.soft));
                                const o = p.dim + (1 - p.dim) * a;
                                return (
                                    <span
                                        key={i}
                                        className="inline-block"
                                        style={{
                                            opacity: o,
                                            filter: p.style === '+ blur' ? `blur(${((1 - a) * 6).toFixed(2)}px)` : undefined,
                                            transform: p.style === '+ rise' ? `translateY(${((1 - a) * 14).toFixed(1)}px)` : undefined,
                                        }}
                                    >
                                        {w}&nbsp;
                                    </span>
                                );
                            })}
                        </p>
                        <div className="mt-6 h-px w-full bg-white/10">
                            <div className="h-full origin-left bg-[var(--il-ice)]" style={{ transform: `scaleX(${prog})` }} />
                        </div>
                        <div className="il-mono mt-2 text-[10px] tabular-nums text-[var(--il-faint)]">{`progress ${prog.toFixed(3)}`}</div>
                    </div>
                </div>
            </div>
        </Demo>
    );
}

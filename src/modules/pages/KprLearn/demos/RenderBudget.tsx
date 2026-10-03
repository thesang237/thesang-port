'use client';

import { useMemo, useState } from 'react';

import { Demo, Readout, Slider } from '../kit/controls';
import { mapX, mapY } from '../kit/plot';
import { TOTAL } from '../kit/source';

import { actAt, isShown, sampleAt, type XCard } from './xray';

const END = TOTAL + 1;
const N = 420;
const HERO_FACES = ['landing', 'story', 'collection'] as const;

/**
 * Teaching copy of NotchedCard.apply's "needs" rule: a visible card renders the painted scene on the face
 * that is showing, plus the next face while the card is nearly edge-on (|cos ry| < 0.35).
 */
function scenesAt(cards: XCard[]) {
    const out = new Set<string>();
    for (const c of cards) {
        if (!isShown(c)) continue;
        if (c.group === 'hero') {
            const turn = Math.abs(c.s.ry);
            const k = Math.min(2, Math.round(turn / Math.PI));
            out.add(HERO_FACES[k]);
            if (Math.abs(Math.cos(turn)) < 0.35) {
                const next = turn > k * Math.PI ? k + 1 : k - 1;
                if (next >= 0 && next <= 2) out.add(HERO_FACES[next]);
            }
        }
        if (c.group === 'keep' || c.group === 'factions' || c.group === 'world') out.add(c.group);
    }
    return out;
}

/** Chapter 11: how many of the six painted scenes actually render, across the whole film. */
export default function RenderBudget() {
    const [t, setT] = useState(4.65);
    const series = useMemo(
        () =>
            Array.from({ length: N + 1 }, (_, i) => {
                const tt = (END * i) / N;
                const cards = sampleAt(tt);
                return { t: tt, scenes: scenesAt(cards).size, cards: cards.filter(isShown).length };
            }),
        [],
    );
    const now = sampleAt(t);
    const scenes = [...scenesAt(now)];
    const cards = now.filter(isShown).length;
    const G = { w: 640, h: 180 };
    const maxCards = Math.max(...series.map((s) => s.cards));
    const line = (key: 'scenes' | 'cards', max: number) => series.map((s, i) => `${i ? 'L' : 'M'}${mapX(s.t, G.w, 0, END).toFixed(1)},${mapY(s[key], G.h, 0, max).toFixed(1)}`).join('');

    return (
        <Demo
            title="Render budget — painted scenes per frame"
            hint="The black line is how many of the six 3D paintings render on each frame of the film. Lavender is how many cards are visible."
            onReset={() => setT(4.65)}
            controls={
                <>
                    <Slider label="film t" value={t} min={0} max={END} step={0.01} onChange={setT} />
                    <Readout
                        items={[
                            { label: 'act', value: actAt(t) },
                            { label: 'cards visible', value: cards },
                            { label: 'scenes rendered', value: `${scenes.length} / 6`, color: '#c0fb50' },
                        ]}
                    />
                    <p className="kl-mono text-[11px] text-[var(--kl-ink)]">{scenes.length ? scenes.join(' + ') : 'none (flat images only)'}</p>
                    <p className="text-[11.5px] leading-snug text-[var(--kl-dim)]">Two at once only happens while a card is near edge-on, so the next face is ready before it comes round.</p>
                </>
            }
        >
            <div className="p-4 sm:p-6">
                <svg viewBox={`-26 -10 ${G.w + 36} ${G.h + 34}`} className="w-full" role="img" aria-label="Scenes rendered and cards visible over the film">
                    {[0, 1, 2, 3].map((v) => (
                        <g key={v}>
                            <line x1={0} x2={G.w} y1={mapY(v, G.h, 0, 3)} y2={mapY(v, G.h, 0, 3)} stroke="rgba(0,0,0,0.07)" />
                            <text x={-8} y={mapY(v, G.h, 0, 3) + 4} fontSize={10} textAnchor="end" fontFamily="ui-monospace" fill="#8a8a94">
                                {v}
                            </text>
                        </g>
                    ))}
                    {[0, 5, 10, 15, 20].map((v) => (
                        <text key={v} x={mapX(v, G.w, 0, END)} y={G.h + 16} fontSize={10} textAnchor="middle" fontFamily="ui-monospace" fill="#8a8a94">
                            {v}
                        </text>
                    ))}
                    <path d={line('cards', maxCards)} fill="none" stroke="#b9b4e8" strokeWidth={1.5} />
                    <path d={line('scenes', 3)} fill="none" stroke="#0c0c0e" strokeWidth={2} />
                    <line x1={mapX(t, G.w, 0, END)} x2={mapX(t, G.w, 0, END)} y1={0} y2={G.h} stroke="#5b4daa" strokeDasharray="3 3" />
                    <text x={G.w} y={-1} fontSize={10} textAnchor="end" fontFamily="ui-monospace" fill="#8a8a94">
                        {`if every scene rendered: 6 · cards peak at ${maxCards}`}
                    </text>
                </svg>
            </div>
        </Demo>
    );
}

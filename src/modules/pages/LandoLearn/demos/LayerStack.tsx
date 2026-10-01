'use client';

import { type ReactNode, useState } from 'react';

import { cn } from '@/utils/cn';

import { Demo, Slider, Toggle } from '../kit/controls';
import { FOUR_BOX, FOUR_PATH, IMG, MenuBars, SIGNATURE_BIG } from '../kit/source';

type Layer = { id: string; name: string; z: string; note: string; color: string; art: ReactNode };

const four = `translate(160 90) scale(0.9) skewX(${FOUR_BOX.skew}) translate(${-FOUR_BOX.origin[0]} ${-FOUR_BOX.origin[1]})`;

const LAYERS: Layer[] = [
    {
        id: 'card',
        name: 'Hero card (DOM)',
        z: 'z 2 · in page',
        color: '#f1f3e8',
        note: 'A plain <img> of the portrait on the light hero background. It is the first paint and the fallback; it hides once WebGL has drawn one frame.',
        art: (
            <div className="absolute inset-0 overflow-hidden bg-[#fafbf6]">
                {/* eslint-disable-next-line @next/next/no-img-element -- tiny illustration */}
                <img src={IMG.portrait} alt="" className="absolute bottom-0 left-1/2 w-[120%] max-w-none -translate-x-1/2" />
            </div>
        ),
    },
    {
        id: 'herogl',
        name: 'Hero canvas (WebGL)',
        z: 'z 3 · in page',
        color: '#a8d8b0',
        note: 'Transparent canvas above the card. Redraws the card with contour lines, reveals the helmet where the pointer trail is, and loops the wireframe glass helmet.',
        art: (
            <svg viewBox="0 0 320 180" className="absolute inset-0 size-full">
                <circle cx="200" cy="80" r="34" fill="rgba(168,216,176,0.25)" stroke="#a8d8b0" strokeDasharray="3 3" />
                <ellipse cx="160" cy="62" rx="36" ry="42" fill="none" stroke="#a8d8b0" strokeWidth="0.8" />
                <ellipse cx="160" cy="62" rx="18" ry="42" fill="none" stroke="#a8d8b0" strokeWidth="0.6" />
                <path d="M124 62h72M128 42h64M130 82h60" stroke="#a8d8b0" strokeWidth="0.6" />
            </svg>
        ),
    },
    {
        id: 'herotext',
        name: 'Signature + race card',
        z: 'z 30 · in page',
        color: '#cdff0b',
        note: 'SVG strokes drawn by the pinned timeline, the “next race” card and the message label. They sit above the canvas so WebGL never covers text.',
        art: (
            <svg viewBox="0 0 900 800" className="absolute inset-[8%] size-[84%]" fill="none" stroke="#cdff0b" strokeWidth="14" strokeLinecap="round">
                {SIGNATURE_BIG.map((d, i) => (
                    <path key={i} d={d} />
                ))}
            </svg>
        ),
    },
    {
        id: 'menu',
        name: 'Menu (panel + photos + canvas)',
        z: 'z 65 · fixed',
        color: '#d6ad5a',
        note: 'A full-screen layer: curved dark panel, four photo slots, the menu WebGL canvas that paints them duotone, the nav. Invisible (autoAlpha 0) when closed.',
        art: (
            <svg viewBox="0 0 320 180" className="absolute inset-0 size-full">
                <path d="M0 0H320V160Q160 190 0 160Z" fill="#22281c" />
                {[
                    [14, 22],
                    [94, -6],
                    [14, 104],
                    [94, 76],
                ].map(([x, y], i) => (
                    <rect key={i} x={x} y={y} width="68" height="74" fill="#3b4533" stroke="#d6ad5a" strokeWidth="0.6" />
                ))}
                {['HOME', 'ON TRACK', 'OFF TRACK', 'CALENDAR'].map((t, i) => (
                    <text key={t} x="190" y={50 + i * 24} fill="#f1f3e8" fontSize="16" fontWeight="800" fontFamily="var(--ll-sans)">
                        {t}
                    </text>
                ))}
            </svg>
        ),
    },
    {
        id: 'header',
        name: 'Header',
        z: 'z 70 · fixed',
        color: '#b5b7ae',
        note: 'Above the menu on purpose: its menu button turns into the × that closes the menu. Its colours flip with the section underneath.',
        art: (
            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-[4%]">
                <div className="leading-none text-[#f1f3e8]">
                    <div className="ll-serif text-[15px]">ELLIS</div>
                    <div className="text-[15px] font-extrabold">MORROW</div>
                </div>
                <div className="flex gap-1">
                    <span className="rounded bg-[#cdff0b] px-2 py-1 text-[9px] font-extrabold text-[#171a12]">STORE</span>
                    <span className="flex size-6 items-center justify-center rounded border border-[#f1f3e8] text-[#f1f3e8]">
                        <MenuBars className="size-5" />
                    </span>
                </div>
            </div>
        ),
    },
    {
        id: 'overlay',
        name: 'Overlay (lime + “4” mask)',
        z: 'z 100001 · fixed',
        color: '#cdff0b',
        note: 'The top of everything: preloader and route transition. A lime rectangle with a “4”-shaped hole that grows until the whole page shows through.',
        art: (
            <svg viewBox="0 0 320 180" className="absolute inset-0 size-full">
                <defs>
                    <mask id="ll-stack-four">
                        <rect width="320" height="180" fill="white" />
                        <path d={FOUR_PATH} transform={four} fill="black" />
                    </mask>
                </defs>
                <rect width="320" height="180" fill="#cdff0b" mask="url(#ll-stack-four)" />
            </svg>
        ),
    },
];

/** The page's layers pulled apart in 3D, bottom (page) to top (overlay). */
export default function LayerStack() {
    const [explode, setExplode] = useState(0.8);
    const [hidden, setHidden] = useState<string[]>([]);
    const [hover, setHover] = useState<string | null>('overlay');
    const toggle = (id: string) => setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));
    const note = LAYERS.find((l) => l.id === hover);

    return (
        <Demo
            title="Exploded layer stack"
            hint="Drag “explode” to pull the layers apart. Hover a layer name to see what lives there; switch layers off to see what they cover."
            onReset={() => {
                setExplode(0.8);
                setHidden([]);
            }}
            controls={
                <>
                    <Slider label="explode" value={explode} min={0} max={1} onChange={setExplode} help="0 = what you see on screen (flat). 1 = every layer pulled apart in depth." />
                    <div className="space-y-2">
                        {[...LAYERS].reverse().map((l) => (
                            <div key={l.id} onMouseEnter={() => setHover(l.id)}>
                                <Toggle label={`${l.name}`} checked={!hidden.includes(l.id)} onChange={() => toggle(l.id)} help={l.z} />
                            </div>
                        ))}
                    </div>
                </>
            }
            footer={
                note && (
                    <p className="text-[13.5px] leading-relaxed text-[var(--ll-dim)]">
                        <span className="font-semibold" style={{ color: note.color }}>{`${note.name} — `}</span>
                        {note.note}
                    </p>
                )
            }
        >
            <div className="ll-stack relative flex h-[420px] items-center justify-center overflow-hidden sm:h-[500px]">
                <div
                    className="relative aspect-[16/9] w-[62%]"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: `rotateX(${explode * 56}deg) rotateZ(${explode * -32}deg) translateY(${explode * 40}px)`,
                        transition: 'transform 0.6s var(--ll-ease)',
                    }}
                >
                    {LAYERS.map((l, i) => (
                        <div
                            key={l.id}
                            onMouseEnter={() => setHover(l.id)}
                            className={cn('absolute inset-0 overflow-hidden rounded-md border transition-opacity duration-300', hidden.includes(l.id) ? 'opacity-0' : 'opacity-100')}
                            style={{
                                transform: `translateZ(${i * explode * 62}px)`,
                                borderColor: hover === l.id ? l.color : 'rgba(241,243,232,0.18)',
                                background: i === 0 ? undefined : 'rgba(23,26,18,0.08)',
                                transition: 'transform 0.6s var(--ll-ease), opacity 0.3s, border-color 0.3s',
                            }}
                        >
                            {l.art}
                            <span className="ll-mono absolute bottom-1 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-[#f1f3e8]" style={{ opacity: explode > 0.2 ? 1 : 0 }}>
                                {l.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </Demo>
    );
}

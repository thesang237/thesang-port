'use client';

import { type ReactNode, useState } from 'react';

import { cn } from '@/utils/cn';

import { Demo } from '../kit/controls';
import { hoverScramble } from '../kit/scramble';

type Recipe = { name: string; where: string; demo: ReactNode; css: string };

const RECIPES: Recipe[] = [
    {
        name: 'Bracket expand',
        where: 'Close, Tweak, social label',
        demo: <span className="il-bracket il-hv-bracket il-mono inline-block px-5 py-2.5 text-[12px] text-[var(--il-ink)]">[ Close ]</span>,
        css: `/* 8 tiny gradients = 4 corners, so the text can scramble freely */
.bracket {
  --b: 8px; --w: 1px;
  background:
    linear-gradient(currentColor 0 0) top left / var(--b) var(--w),
    linear-gradient(currentColor 0 0) top left / var(--w) var(--b),
    /* … same for the other 3 corners … */;
  background-repeat: no-repeat;
  transition: padding .5s cubic-bezier(.16, 1, .3, 1);
}
.bracket:hover { --b: 14px; padding-inline: 1.9rem; }`,
    },
    {
        name: 'Underline from the near side',
        where: 'Neighbouring carousel names',
        demo: (
            <span className="flex gap-8">
                <span className="il-hv-underline il-mono text-[12px] text-[var(--il-ink)]" style={{ '--origin': 'right' } as React.CSSProperties}>
                    ← LinkedIn
                </span>
                <span className="il-hv-underline il-mono text-[12px] text-[var(--il-ink)]" style={{ '--origin': 'left' } as React.CSSProperties}>
                    Medium →
                </span>
            </span>
        ),
        css: `.side::after {
  content: ''; position: absolute; inset: auto 0 -3px 0; height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transition: transform .5s cubic-bezier(.16, 1, .3, 1);
}
.side.is-prev::after { transform-origin: right; } /* grows toward centre */
.side.is-next::after { transform-origin: left; }
.side:hover::after   { transform: scaleX(1); }`,
    },
    {
        name: 'Light sweep',
        where: 'Active social channel',
        demo: <span className="il-bracket il-hv-sweep il-mono inline-block px-6 py-3 text-[12px] font-bold text-[var(--il-ink)]">X / Twitter</span>,
        css: `.current { position: relative; overflow: hidden; }
.current::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,.22) 50%, transparent 70%);
  transform: translateX(-120%);
}
.current:hover::before {
  transform: translateX(120%);
  transition: transform .8s cubic-bezier(.65, 0, .35, 1); /* only animates IN */
}`,
    },
    {
        name: 'Ring draws around arrow',
        where: 'Prev / Next arrows',
        demo: (
            <span className="il-hv-ring relative inline-flex size-16 items-center justify-center text-[var(--il-ink)]">
                <svg viewBox="0 0 48 48" className="absolute inset-0 size-full">
                    <circle className="il-hv-ring-circle" cx="24" cy="24" r="22" pathLength={1} fill="rgba(255,255,255,0.05)" stroke="currentColor" strokeWidth="1" />
                </svg>
                <svg width="36" height="10" viewBox="0 0 36 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path className="il-hv-ring-shaft" d="M35 5H1" />
                    <path d="M1 5L6 1M1 5L6 9" />
                </svg>
            </span>
        ),
        css: `circle { stroke-dasharray: 1; stroke-dashoffset: 1;       /* pathLength="1" */
         transform: rotate(-90deg); transform-origin: center;
         transition: stroke-dashoffset .7s cubic-bezier(.65, 0, .35, 1); }
.arrow:hover circle { stroke-dashoffset: 0; }
.shaft { transform-box: fill-box; transform-origin: left center;
         transition: transform .6s cubic-bezier(.16, 1, .3, 1); }
.arrow:hover .shaft { transform: scaleX(1.3); }  /* the arrow "stretches" */`,
    },
    {
        name: 'Rail item reveal',
        where: 'Section rail on the right',
        demo: (
            <span className="il-hv-rail il-mono flex items-center gap-3 text-[11px] text-[var(--il-ink)]">
                <span className="il-hv-rail-label">Portal</span>
                <span className="il-hv-rail-dot block size-[6px] border border-current" />
            </span>
        ),
        css: `.rail-label { opacity: 0; transform: translateX(6px);
              transition: opacity .4s, transform .5s cubic-bezier(.16, 1, .3, 1); }
.rail-item:hover .rail-label, .is-active .rail-label { opacity: 1; transform: none; }
.is-active .rail-dot { background: currentColor; transform: rotate(45deg) scale(1.2); }`,
    },
    {
        name: 'Hover re-decode',
        where: 'Every label, arrows, Tweak',
        demo: <ScrambleWord />,
        css: `// ui/scramble.ts — quick re-decode of the label on mouseenter
export function hoverScramble(el, text) {
  if (!el || gsap.isTweening(el)) return;   // never stack scrambles
  gsap.to(el, { duration: 0.42, ease: 'none',
    scrambleText: { text: text ?? el.textContent, chars: GLYPHS, speed: 1.2, revealDelay: 0.05 } });
}`,
    },
];

function ScrambleWord() {
    return (
        <span className="il-mono cursor-default text-[13px] font-bold tracking-[0.2em] text-[var(--il-ink)]" onMouseEnter={(e) => hoverScramble(e.currentTarget, 'NEXT')}>
            NEXT
        </span>
    );
}

/** The small hover recipes that make Igloo’s UI feel precise. */
export default function MicroHovers() {
    const [sel, setSel] = useState(0);
    return (
        <Demo title="Micro-hovers — the UI details" hint="Hover each tile to feel it. Click a tile to see its CSS. All of them share one ease: cubic-bezier(.16, 1, .3, 1).">
            <div className="grid gap-px bg-[var(--il-line)] sm:grid-cols-3">
                {RECIPES.map((r, i) => (
                    <button
                        key={r.name}
                        type="button"
                        onClick={() => setSel(i)}
                        className={cn('flex min-h-[150px] flex-col items-center justify-between gap-4 bg-[var(--il-panel)] p-4 text-center transition-colors', sel === i && 'bg-[var(--il-panel-2)]')}
                    >
                        <span className="il-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: sel === i ? 'var(--il-ice)' : 'var(--il-faint)' }}>
                            {r.name}
                        </span>
                        <span className="flex flex-1 items-center">{r.demo}</span>
                        <span className="text-[11.5px] text-[var(--il-faint)]">{r.where}</span>
                    </button>
                ))}
            </div>
            <pre className="il-mono il-scrollbox overflow-x-auto border-t border-[var(--il-line)] bg-black/30 p-4 text-[11.5px] leading-relaxed text-[#cfeeff]">{RECIPES[sel].css}</pre>
        </Demo>
    );
}

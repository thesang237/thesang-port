'use client';

import { Demo } from '../kit/controls';

const Word = ({ fix }: { fix: boolean }) => (
    <div className="overflow-hidden border border-dashed border-[var(--al-accent-ink)]" style={{ paddingBottom: fix ? '0.14em' : 0, marginBottom: fix ? '-0.14em' : 0, height: '0.915em' }}>
        <div className="al-display tracking-[-0.03em]" style={{ lineHeight: 0.915 }}>
            gypsy jug
        </div>
    </div>
);

/** Why the page’s mask boxes are taller than their text (and cancel the extra with a negative margin). */
export default function DescenderDemo() {
    return (
        <Demo
            title="Descenders: why the mask needs room"
            hint="Both masks are as tall as one line at line-height 0.915. Left: the tails of g, p, y are clipped. Right: padding adds room, a negative margin cancels it in the layout."
        >
            <div className="grid gap-px bg-[var(--al-line-2)] sm:grid-cols-2">
                {[false, true].map((fix) => (
                    <div key={String(fix)} className="bg-[#e7e4df] p-6 text-[#141414]" style={{ fontSize: 'clamp(40px,6vw,76px)' }}>
                        <div className="al-mono mb-3 text-[10px] uppercase tracking-[0.14em] text-[#6b6862]">{fix ? 'padding-bottom .14em + margin-bottom −.14em' : 'mask = line-height'}</div>
                        <Word fix={fix} />
                        <div className="al-mono mt-4 text-[10px] text-[#6b6862]">{fix ? 'tails intact, next line sits exactly where it did' : 'tails cut off'}</div>
                    </div>
                ))}
            </div>
        </Demo>
    );
}

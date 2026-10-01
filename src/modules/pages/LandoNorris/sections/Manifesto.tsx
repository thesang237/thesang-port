'use client';

import BlockReveal from '@/components/motion-kit/BlockReveal';

import { MANIFESTO, TEAM_LINE } from '../data';
import { Emblem } from '../graphics';

/* Measured: emblem 910–1010 × ~690–740, caption y≈773 (12px), text 146px / line pitch 128px, centred. */
export default function Manifesto() {
    return (
        <section className="ln-manifesto" data-header="dark">
            <div className="ln-contours" />
            <div className="ln-mf-emblem">
                <Emblem className="ln-mf-emblem-svg" />
                <BlockReveal as="p" className="ln-mf-team" split={false} start="top 95%">
                    {TEAM_LINE}
                </BlockReveal>
            </div>
            <BlockReveal as="h2" className="ln-mf-text" perLine stagger={0} start="top 96%">
                {MANIFESTO.map((line, i) => (
                    <span key={i} className={i === MANIFESTO.length - 1 ? 'ln-mf-line ln-mf-last' : 'ln-mf-line'}>
                        {line.map(([t, serif], k) =>
                            serif ? (
                                <em key={k} className="ln-serif ln-lime-serif">
                                    {t}
                                </em>
                            ) : (
                                <span key={k}>{t}</span>
                            ),
                        )}
                        {i < MANIFESTO.length - 1 && <br />}
                    </span>
                ))}
            </BlockReveal>
        </section>
    );
}

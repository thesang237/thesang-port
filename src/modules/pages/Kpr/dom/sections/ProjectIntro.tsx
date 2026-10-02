'use client';

import { useRef } from 'react';

import { INTRO } from '../../data/copy';
import { sub, W } from '../../scroll/timeline';
import { film, useUi } from '../../scroll/useScrollStore';
import { Play } from '../icons';
import { Caption, Hair, Lines } from '../ui/Text';
import { useAct } from '../ui/useAct';

/**
 * Project intro: index + two-line heading, body bottom-left, and three empty anchors that place the
 * WebGL cards (small landscape, character, tall trailer). The play button sits over the trailer card.
 */
export default function ProjectIntro() {
    const ref = useRef<HTMLElement>(null);
    useAct(ref, [W.introCardsIn[0] + 0.6, W.introOut[0] + 0.35], (root) => {
        // the trailer button and captions leave with the cards
        const k = sub(film.view, W.introOut, 0, 0.3);
        root.style.setProperty('--kpr-out', String(k));
    });

    return (
        <section ref={ref} className="kpr-sec kpr-intro" id="project" aria-label="Project">
            <div className="kpr-intro__grid" aria-hidden="true">
                <Hair dir="v" className="kpr-intro__v1" d={0.1} />
                <Hair dir="h" className="kpr-intro__h1" d={0.2} />
                <Hair dir="v" className="kpr-intro__v2" d={0.3} />
            </div>
            <div className="kpr-title1 kpr-intro__title">
                <Caption text={INTRO.index} className="kpr-title1__cap" />
                <Lines lines={INTRO.lines} className="kpr-h1" indent d={0.1} />
            </div>

            <div className="kpr-intro__small" data-gl-anchor="intro-small">
                <Caption text={INTRO.side} className="kpr-intro__smallcap" d={0.6} />
            </div>
            <div className="kpr-intro__char" data-gl-anchor="intro-char">
                <Caption text={INTRO.hero} className="kpr-intro__charcap" d={0.7} />
            </div>
            <div className="kpr-intro__tall" data-gl-anchor="intro-tall">
                <button type="button" className="kpr-play kpr-out" data-r="fade" data-d="0.8" aria-label="Play trailer" onClick={() => useUi.getState().set({ trailerOpen: true })}>
                    <Play className="kpr-play__icon" />
                </button>
                <Caption text={INTRO.trailer} className="kpr-intro__tallcap kpr-out" d={0.9} />
            </div>

            <p className="kpr-intro__body kpr-body1" data-r="fade" data-d="0.45">
                {INTRO.body}
            </p>
        </section>
    );
}

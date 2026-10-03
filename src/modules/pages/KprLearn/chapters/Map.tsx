'use client';

import FilmXray from '../demos/FilmXray';
import Pipeline from '../demos/Pipeline';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function Map() {
    return (
        <>
            <ChapterHead
                n="00"
                kicker="The map"
                title="One scroll number runs the whole show."
                lead={
                    <>
                        /kpr feels like a short animated film you steer with the scroll wheel. Under the hood there is no list of animations at all: there is one number, the film time, and a set of
                        formulas that turn that number into every card, word and colour on screen.
                    </>
                }
            />

            <Section id="layers" n="00.1" title="What you are looking at">
                <P>
                    Nothing on the page actually scrolls past you. The paintings and cards live on <strong>one WebGL canvas fixed to the screen</strong>. The text sections are also fixed, stacked on
                    top of each other, and simply fade in and out. The scrollbar belongs to an empty, invisible “track” that is 23 screens tall: its only job is to give your wheel something to move.
                </P>
                <Table
                    head={['Layer (back to front)', 'What it holds', 'Moves by']}
                    rows={[
                        ['Canvas (fixed)', 'Every notched card, the painted 3D scenes, the gallery ring, the logo wipe', 'the film clock → choreography'],
                        ['Text sections (fixed, stacked)', 'Headings, captions, terminal, the 10K counter…', 'enter/leave their window → reveal timelines'],
                        ['HUD frame (fixed)', 'Top bar, nav, progress bar, side rail', 'theme light/dark per moment'],
                        ['Track (invisible)', 'Nothing, just height', 'your wheel'],
                        ['Footer (in flow)', 'The black footer that slides over at the end', 'normal scrolling'],
                        ['Overlays', 'Menu, cursor, loader, the opening', 'clicks and timers'],
                    ]}
                />
                <Lens>
                    Think of an After Effects comp where the <strong>scroll bar is the playhead</strong>. The canvas is one big pre-comp; the text sections are layers whose in/out points sit on the
                    same timeline. Scrolling down plays the comp; scrolling up scrubs it backwards.
                </Lens>
                <KeyIdea>The page doesn’t scroll; the film plays. The scrollbar is only a playhead.</KeyIdea>
            </Section>

            <Section id="frame" n="00.2" title="One frame, in order">
                <P>
                    About 60 times a second the same short routine runs. It reads the smoothed scroll, converts it to film time, and lets everything else read that time. There is one{' '}
                    <Term k="ticker">ticker</Term> for all of it: the smooth scroll, the cards, the text and the WebGL render all happen on the same beat, so nothing can drift apart.
                </P>
                <Pipeline />
                <Code file="src/modules/pages/Kpr/KprPage.tsx (Clock, trimmed)" highlight={['tFromScroll', 'runFrame', 'advance']}>
                    {`const tick = (time, deltaMs) => {
    const dt = Math.min(deltaMs / 1000, 1 / 20);
    const t = Math.max(0, tFromScroll(lenis.scroll / film.vh)); // pixels → screens → film time
    film.t = t;
    film.vel = damp(film.vel, (t - lastT) / dt, 10, dt);         // scroll speed (for effects)
    film.spx = damp(film.spx, film.px, 3.5, dt);                // smoothed pointer
    film.view = film.reduced ? nearestRest(t) : t;              // reduced motion snaps to stills

    useUi.getState().set({ nav: navAt(film.view), theme: themeAt(film.view) }); // only when changed
    runFrame();          // DOM updaters: reveals, counters, scrubbed styles
    advance(time * 1000); // React Three Fiber renders this frame (frameloop="never")
};
gsap.ticker.add(tick);`}
                </Code>
                <Callout tone="meta">
                    This guide runs the same way: Lenis is driven by GSAP’s ticker, and every demo’s animation hooks into that one ticker and pauses itself when scrolled off screen.
                </Callout>
                <KeyIdea>One clock reads the scroll; everything else reads the clock.</KeyIdea>
            </Section>

            <Section id="xray" n="00.3" title="The whole film at a glance">
                <P>
                    The demo below runs the page’s <strong>real</strong> choreography function, with no WebGL at all: it asks “where is every card at time t?” and draws the answers as flat shapes.
                    Scrub slowly from 0 to 21 and watch the hero card: it opens full screen, shrinks into a card, grows again, turns over to become the story, shrinks into a sliver, turns again into
                    the 10K portrait and finally drops into the ring.
                </P>
                <FilmXray />
                <TryThis
                    items={[
                        'Scrub from 3.8 to 5.2 slowly: the hero turns half way (girl → story) while it opens to full screen. Watch the label change at the edge-on moment.',
                        'Park on 12.6 and look at the ring: 26 cards, the front ones wide, the side ones narrow because they are turned.',
                        'Drag fast back and forth over 13.9–16.4: the tableau handoffs reverse perfectly, because nothing remembers where it was.',
                        'Watch the theme strip above the tracks: the HUD switches between white text (over paintings) and black text (over white and lavender).',
                    ]}
                />
                <KeyIdea>Same time in, same picture out: that is why the film can play backwards.</KeyIdea>
            </Section>

            <Section id="words" n="00.4" title="A vocabulary bridge">
                <P>The rest of the guide uses these words. Each pair means the same thing on both sides of the design–code handoff.</P>
                <Table
                    mono={[1]}
                    head={['Design word', 'Code word', 'Meaning']}
                    rows={[
                        ['Playhead', 'film.t', 'Where we are in the film, in screens'],
                        ['Layer in/out points', 'W.introOut = [3.85, 5.05]', 'When one movement starts and ends'],
                        ['Keyframe progress', 'seg(t, window)', '0 → 1 through a window'],
                        ['Easing curve', 'ease.inOutStrong', 'How progress speeds up and slows down'],
                        ['Layer properties', 'CardState', 'x, y, w, h, turns, notch, opacity… for one card'],
                        ['Folder-tab shape', 'notch / chamfer', 'The stepped cut and the 45° corner'],
                        ['Pre-comp', 'PaintedScene', 'A 3D painting rendered into an image'],
                        ['Smooth follow', 'damp(…, λ, dt)', 'Ease toward a moving target, frame-rate safe'],
                    ]}
                />
                <P>
                    Two more words worth knowing now: a <Term k="screen">screen</Term> is one viewport height of scrolling, and a <Term k="window">window</Term> is a [start, end] pair in screens.
                    Chapter 01 is all about them.
                </P>
            </Section>

            <Section id="files" n="00.5" title="Where things live">
                <Table
                    mono={[0]}
                    head={['Folder', 'What’s inside']}
                    rows={[
                        ['scroll/', 'The film clock (timeline.ts), the film object and UI store, the per-frame DOM registry'],
                        ['gl/', 'The canvas (Stage.tsx), choreography, the card shader and class, painted scenes, flipbooks, loaders'],
                        ['dom/sections/', 'One file per act: Landing, ProjectIntro, Story, Collection, Tableaux, Footer'],
                        ['dom/ui/', 'Text pieces (lines, captions, decode), reveals, the button outline'],
                        ['dom/hud/', 'Loader, opening, HUD, menu, cursor, audio'],
                        ['data/', 'Copy and the media manifest (paintings, flipbooks, images)'],
                    ]}
                />
                <Callout tone="tip">
                    The source has a written study log at <C>src/modules/pages/Kpr/NOTES.md</C>: timings read off the reference video, measured sizes, and every decision. Read it next to this guide.
                </Callout>
                <Where
                    files={[
                        { path: 'Kpr/KprPage.tsx', note: 'Clock + layers' },
                        { path: 'Kpr/scroll/timeline.ts' },
                        { path: 'Kpr/scroll/useScrollStore.ts' },
                        { path: 'Kpr/gl/choreo.ts' },
                        { path: 'Kpr/NOTES.md' },
                    ]}
                />
            </Section>
        </>
    );
}

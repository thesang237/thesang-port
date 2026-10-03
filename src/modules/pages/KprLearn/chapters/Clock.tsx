'use client';

import EaseGallery from '../demos/EaseGallery';
import WarpGraph from '../demos/WarpGraph';
import WindowMapper from '../demos/WindowMapper';
import { C, Callout, Card, ChapterHead, Code, Grid, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function Clock() {
    return (
        <>
            <ChapterHead
                n="01"
                kicker="Film clock"
                title="Time is measured in screens."
                lead={
                    <>
                        Before any card can move, the page needs a timeline. /kpr writes its whole storyboard as start and end points in “screens of scroll”, then maps every value from those windows
                        with four tiny functions.
                    </>
                }
            />

            <Section id="screens" n="01.1" title="Why screens, not pixels or seconds">
                <P>
                    A <Term k="screen">screen</Term> is one viewport height of scrolling. If the hero card turns between 4.2 and 5.1 screens, it turns over the same share of your scroll on a laptop
                    and on a 4K monitor. Pixels would change with the monitor; seconds don’t exist, because the visitor decides the speed.
                </P>
                <Code file="src/modules/pages/Kpr/scroll/timeline.ts (trimmed)" highlight={['introOut', 'story:', 'glyph']}>
                    {`export const W = {
    landingToCard: [0.9, 2.0],   // painting → notched card
    introCardsIn:  [1.8, 2.75],
    introOut:      [3.85, 5.05], // hero grows, leans, turns onto the story
    story:         [4.6, 9.9],
    glyph:         [8.35, 9.05], // the logo wipe
    galleryIn:     [11.25, 12.15],
    keepIn:        [13.95, 14.95],
    handoff1:      [15.45, 16.35],
    launchIn:      [18.3, 19.2],
    // …
};
export const TOTAL = 20.2; // the film is 20.2 screens long`}
                </Code>
                <Lens>
                    <C>W</C> is your storyboard pinned to a timeline: each entry is a layer’s in and out point. The numbers came from timing the reference video (NOTES.md has the table: “video 47–55 s
                    → screens 4.0–5.0”).
                </Lens>
                <KeyIdea>Write the storyboard first, as windows in screens. Everything else reads those windows.</KeyIdea>
            </Section>

            <Section id="mapping" n="01.2" title="Normalise, clamp, ease, lerp">
                <P>
                    Every moving value on the page is built from the same four steps. <strong>seg</strong> turns the clock into <Term k="progress">progress</Term> through a window (and clamps it to
                    0…1). <strong>sub</strong> takes a slice of a window, so several values can share one window but start at different moments. An <Term k="ease">ease</Term> bends that progress.{' '}
                    <Term k="lerp">lerp</Term> turns it into pixels, radians or anything else.
                </P>
                <WindowMapper />
                <Code file="src/modules/pages/Kpr/scroll/timeline.ts" highlight={['seg =', 'sub =']}>
                    {`export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a, b, k) => a + (b - a) * k;
/** progress of t through window w */
export const seg = (t, [a, b]) => clamp01((t - a) / (b - a));
/** progress through the f0…f1 slice of window w */
export const sub = (t, w, f0, f1) => seg(t, [w[0] + (w[1] - w[0]) * f0, w[0] + (w[1] - w[0]) * f1]);

// in choreo.ts, the hero growing and leaning in the first 45 % of introOut:
const a = io(sub(t, W.introOut, 0, 0.45));
r = { ...r, w: r.w * (1 + 0.14 * a), h: r.h * (1 + 0.14 * a) };`}
                </Code>
                <TryThis
                    items={[
                        'Move “slice from” to 0.5 and “slice to” to 0.55: the card now jumps in a tiny part of the window. That is how a value “snaps” on purpose.',
                        'Switch the ease to linear and scrub: the move feels mechanical, like a slider, not a camera.',
                        'Set from = to: the window still runs, nothing moves. Windows are just time; values decide what happens.',
                    ]}
                />
                <KeyIdea>seg → sub → ease → lerp: four small steps make every value on the page.</KeyIdea>
            </Section>

            <Section id="warp" n="01.3" title="The scroll warp: same film, different pace">
                <P>
                    After the film was timed, some parts felt slow to scroll through. Rather than re-time 30 windows, the source added a <strong>warp</strong>: a curve that decides how many screens of{' '}
                    <em>real scrolling</em> each stretch of film takes. The windows stay exactly as they were; only the pace changes.
                </P>
                <WarpGraph />
                <Code file="src/modules/pages/Kpr/scroll/timeline.ts (WARP)" highlight={['[2.0, 1.25]', '[9.7, 7.55]']}>
                    {`// [film t, scroll s] knots; straight lines in between
const WARP = [
    [0, 0],
    [2.0, 1.25],              // hero: 2 film screens in 1.25 screens of scroll (1.6×)
    [4.15, 2.6],              // intro: 2.15 in 1.35 (1.6×)
    [8.35, 6.8],              // story: 1×
    [9.7, 7.55],              // keeper-symbol beat: 1.35 in 0.75 (1.8×)
    [18.3, 7.55 + 8.6],       // collection → world: 1×
    [TOTAL, 16.15 + 1.9 * 0.55], // launch: 1.8×
];
export const tFromScroll = (s) => interp(s, 1, 0); // scroll → film
export const scrollFromT = (t) => interp(t, 0, 1); // film → scroll (nav jumps use this)`}
                </Code>
                <Grid>
                    <Card kicker="Without a warp" title="Re-time everything">
                        To make the hero 1.6× quicker you would shift every window after it, then fix the overlaps they create downstream.
                    </Card>
                    <Card kicker="With a warp" title="One knot" tint>
                        Move one knot of the curve. Film windows, rests, theme switches and nav targets are untouched, because they all live in film time.
                    </Card>
                </Grid>
                <TryThis
                    items={[
                        'Turn the warp off and drag through the first two screens: the hero hangs around much longer before becoming a card.',
                        'Find the steepest part of the curve (around film 8.4–9.7): that is the logo beat, deliberately quick.',
                    ]}
                />
                <KeyIdea>Time the film once; tune its pace with a separate scroll curve.</KeyIdea>
            </Section>

            <Section id="eases" n="01.4" title="Linear clock, eased values">
                <P>
                    The clock itself is never eased: your hand already gives the scroll its rhythm, and Lenis adds weight. Each value gets its own ease inside its own window instead, so a card can
                    slide with a heavy in-out while its notch opens with a quick out.
                </P>
                <EaseGallery />
                <Table
                    mono={[1]}
                    head={['Use on the page', 'Ease', 'Feels like']}
                    rows={[
                        ['Card moves, turns, handoffs', 'inOutStrong (io)', 'heavy, cinematic: a camera move'],
                        ['Story camera pan, second turn', 'inOut', 'steady, smooth'],
                        ['Text rises, counter', 'outStrong / kpr.out', 'snappy arrival, long settle'],
                        ['Elements leaving', 'in', 'accelerates away'],
                        ['The clock itself', 'linear', 'your hand'],
                    ]}
                />
                <Callout tone="tip">
                    The eases are plain formulas (polynomials and an exponential), not bezier curves, because they run hundreds of times per frame inside the choreography. A cubic-bezier solver would
                    be slower and give nearly the same shape.
                </Callout>
                <KeyIdea>Never ease the clock; ease each value inside its own window.</KeyIdea>
                <Where
                    files={[
                        { path: 'Kpr/scroll/timeline.ts', note: 'W, WARP, seg, sub, ease, damp' },
                        { path: 'Kpr/gl/choreo.ts', note: 'where they are used' },
                        { path: 'Kpr/NOTES.md', note: 'video → screens table' },
                    ]}
                />
            </Section>
        </>
    );
}

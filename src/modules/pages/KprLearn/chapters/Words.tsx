'use client';

import AnchorLab from '../demos/AnchorLab';
import ButtonLab from '../demos/ButtonLab';
import RevealLab from '../demos/RevealLab';
import { C, Callout, Card, ChapterHead, Code, Grid, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function Words() {
    return (
        <>
            <ChapterHead
                n="10"
                kicker="Words over WebGL"
                title="HTML does the type, and tells the canvas where to go."
                lead={
                    <>
                        All the text on /kpr is real HTML sitting above the canvas: selectable, readable by screen readers, set in real fonts. The HTML also decides where the WebGL cards go, and its
                        reveals are the page’s timed “beats”.
                    </>
                }
            />

            <Section id="anchors" n="10.1" title="Empty boxes that place the cards">
                <P>
                    In the intro, the three cards sit in a layout with a heading and body text. Instead of hard-coding pixel positions, the HTML contains <strong>empty boxes</strong> in a normal CSS
                    grid, each marked <C>data-gl-anchor</C>. The page measures them once (and again on resize or when fonts load) and the choreography reads those measurements. CSS layout is the
                    source of truth; the canvas follows it.
                </P>
                <AnchorLab />
                <Code file="src/modules/pages/Kpr/gl/layout.ts" highlight={['getBoundingClientRect', 'Never measured']}>
                    {`/** DOM drives the GL layout. Never measured inside the frame loop. */
export function measureAnchors(root, vw, vh) {
    root.querySelectorAll('[data-gl-anchor]').forEach((el) => {
        const r = el.getBoundingClientRect();
        // convert to stage coordinates: origin at the viewport centre, y up, 1 unit = 1 px
        anchors[el.dataset.glAnchor] = { x: r.left + r.width / 2 - vw / 2, y: vh / 2 - (r.top + r.height / 2), w: r.width, h: r.height };
    });
}
// choreo.ts: an anchor, or a fallback in viewport fractions if it isn't on the page
const r = anchor('intro-small', vw, vh, [0.073, 0.323, 0.148, 0.155]);`}
                </Code>
                <Lens>
                    The anchors are placeholder frames in a Figma auto-layout: you design the layout with empty rectangles, then something else (here, the WebGL card) snaps to them. Change the layout
                    and everything snapped to it moves along.
                </Lens>
                <TryThis
                    items={[
                        'Drag the viewport width down to 45 %: the grid reflows and the cards follow, because they read the boxes.',
                        'Switch to “every frame”: the cards look the same, but the readout jumps to ~180 layout reads a second. On a busy page that is dropped frames.',
                    ]}
                />
                <KeyIdea>Let CSS lay out empty boxes; measure them only when the layout changes.</KeyIdea>
            </Section>

            <Section id="reveals" n="10.2" title="Reveals: enter plays, leave reverses">
                <P>
                    Each text section has a window on the film clock. When the clock enters it, the section’s reveal timeline plays forward; when it leaves, the timeline reverses at 2.2× speed and
                    then hides the section. The reveal itself is written as <strong>data attributes</strong> on the HTML (“this caption types on”, “these lines rise”), and one function turns them into
                    a timeline.
                </P>
                <RevealLab />
                <Code file="src/modules/pages/Kpr/dom/ui/reveal.ts (trimmed)" highlight={["case 'lines'", 'timeScale(2.2).reverse()']}>
                    {`case 'lines':   // masked line rise (children .kpr-line > span)
    tl.fromTo(lines, { yPercent: 108, rotate: 2.5 }, { yPercent: 0, rotate: 0, duration: 0.95, stagger: 0.07 }, at);
case 'chars':   // per-character type-on, the dot blinks first
    tl.fromTo(chars, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, stagger: Math.min(0.035, 0.6 / chars.length) }, at + 0.08);
case 'hline':   // hairline draws
    tl.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: EASE_IN_OUT }, at);

// actWatcher: called every frame, acts only when the clock crosses the window's edges
if (now) tl.timeScale(1).play();
else { tl.eventCallback('onReverseComplete', hide); tl.timeScale(2.2).reverse(); }`}
                </Code>
                <Table
                    mono={[0]}
                    head={['Preset', 'Value', 'Feels like']}
                    rows={[
                        ['kpr.out', 'cubic-bezier(0.16, 1, 0.3, 1)', 'text arrives fast, settles long'],
                        ['text duration', '0.95 s, 70 ms stagger', 'a confident line-by-line'],
                        ['hairlines', '1.3 s, kpr.inOut', 'slow draw, like a plotter'],
                        ['exit', 'reverse × 2.2', 'gets out of the way quickly'],
                    ]}
                />
                <TryThis
                    items={[
                        'Press Enter, then Leave half way through: the reveal turns around from wherever it is. No jump.',
                        'Drag in and out quickly several times: it never stacks up, because it is one timeline going forward or backward.',
                    ]}
                />
                <Callout tone="tip">
                    The two big story headings are the exception: their lines are <em>scrubbed</em> with the scroll (each line fades over 0.35 screens, 0.14 apart), because they move with the
                    painting’s camera. Timed beats for things that sit still; scrubbed motion for things that travel.
                </Callout>
                <KeyIdea>Write reveals as attributes, play them on enter, reverse them faster on leave.</KeyIdea>
            </Section>

            <Section id="details" n="10.3" title="Small details: decode, hover block, the cut button">
                <P>
                    Three micro-interactions carry the HUD language. <strong>Decode text</strong> scrambles through glyphs into the real word: a hidden copy keeps the width so nothing jumps. The{' '}
                    <strong>link hover</strong> slides a block in from the left behind the label and flips its colour. The <strong>button</strong> has a 45° cut corner that morphs into a rounded one
                    on hover.
                </P>
                <ButtonLab />
                <Grid>
                    <Card kicker="Decode" title="scrambleTween(el, 0.8)">
                        Each letter gets a random moment (plus a left-to-right bias) to lock in; until then it shows a random glyph from <C>{'!<>-_\\/[]{}—=+*^?#01…'}</C>.
                    </Card>
                    <Card kicker="Hover block" title="translateX(−101% → 0)" tint>
                        The guide’s chapter tabs use the same trick: hover one and watch the black block slide in behind the label.
                    </Card>
                </Grid>
                <Code file="src/modules/pages/Kpr/dom/ui/BtnFrame.tsx (trimmed)" highlight={['const c = r + (cut - r) * k', 'k, duration']}>
                    {`// one SVG path at the button's real size; the corner is a cubic that blends
// from a quarter circle (k = 0) to a straight 45° line (k = 1)
const c = r + (cut - r) * k;              // how far the corner reaches along each edge
const m = (a, b) => a + (b - a) * k;
const c1x = m(W, W - c / 3), c1y = m(H - c + 0.552 * c, H - (2 * c) / 3);
// hover: tween k to 0 in 0.5 s (fill switches instantly in CSS)
gsap.to(st, { k, duration: 0.5, ease: 'power2.inOut', onUpdate: draw });`}
                </Code>
                <Callout tone="meta">Hover the real button above: it is the source’s own component, imported into the guide unchanged.</Callout>
                <KeyIdea>One path, one number: morph the corner by blending its control points.</KeyIdea>
                <P>
                    Every animated text piece is <C>aria-hidden</C> and paired with a visually hidden plain sentence, so a screen reader reads the words once, normally. See the{' '}
                    <Term k="reducedMotion">reduced motion</Term> rules in chapter 11.
                </P>
                <Where
                    files={[
                        { path: 'Kpr/gl/layout.ts', note: 'anchors' },
                        { path: 'Kpr/dom/ui/reveal.ts', note: 'buildReveal, actWatcher' },
                        { path: 'Kpr/dom/ui/Text.tsx', note: 'Lines, Caption, Hacky, scramble' },
                        { path: 'Kpr/dom/ui/BtnFrame.tsx' },
                        { path: 'Kpr/dom/sections/Story.tsx', note: 'scrubLines' },
                    ]}
                />
            </Section>
        </>
    );
}

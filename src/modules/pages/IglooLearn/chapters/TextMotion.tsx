'use client';

import DrawLines from '../demos/DrawLines';
import MicroHovers from '../demos/MicroHovers';
import ScrambleLab from '../demos/ScrambleLab';
import SplitRevealLab from '../demos/SplitRevealLab';
import { C, Callout, Card, ChapterHead, Code, Grid, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function TextMotionChapter() {
    return (
        <article>
            <ChapterHead
                n="04"
                kicker="Text motion"
                title="Text that rises, decodes and draws itself."
                lead={
                    <>
                        Igloo’s type is small, bold and monospaced — the motion is what makes it feel alive. Three families of text animation do all the work, and each is a handful of lines with
                        GSAP’s <Term k="splittext">SplitText</Term> and ScrambleText plugins.
                    </>
                }
            />

            <Section id="families" n="4.1" title="Three families, one voice">
                <Grid cols={3}>
                    <Card kicker="Family 1" title="Masked rise">
                        Lines or words slide up out of an invisible slot. Used for the manifesto and section captions. Feels editorial and confident.
                    </Card>
                    <Card kicker="Family 2" title="Decode / scramble" accent="var(--il-lilac)">
                        Characters flicker through glyphs and lock in left to right. Used for every HUD label, the loader and hover states. Feels like a terminal receiving a signal.
                    </Card>
                    <Card kicker="Family 3" title="Draw-on lines" accent="var(--il-mint)">
                        Rules, leader lines, the logo and arrow rings draw themselves. Gives the text a technical, blueprint-like frame.
                    </Card>
                </Grid>
                <Lens>
                    Think of these as three “motion styles” in a design system, like text styles. Every piece of copy on the page gets exactly one of them (sometimes two combined), and nothing else.
                    That restraint is why it feels designed rather than decorated.
                </Lens>
            </Section>

            <Section id="split" n="4.2" title="Masked rise with SplitText">
                <P>
                    SplitText wraps each line, word or character in its own <C>{'<div>'}</C>. With <C>{"mask: 'lines'"}</C> it also wraps each line in a <Term k="mask">mask</Term> — a box with
                    overflow hidden. Start each piece at <C>yPercent: 110</C> (just below its mask) and tween it to 0. The text appears to rise out of a slot.
                </P>
                <SplitRevealLab />
                <Code file="ui/Hero.tsx + ui/Chrome.tsx → Caption" highlight={['mask', 'yPercent']}>{`// manifesto: whole lines rise, then each line also decodes
const split = SplitText.create('.ig-manifesto', { type: 'lines', mask: 'lines' });
tl.from(split.lines, { yPercent: 110, duration: 0.9, ease: 'expo.out', stagger: 0.07 }, 0.25);

// captions: words rise with a 4° tilt — tossed, not slid
const split = SplitText.create(body, { type: 'lines,words', mask: 'lines' });
tl.from(split.words, { yPercent: 120, rotate: 4, duration: 1, ease: 'expo.out', stagger: 0.025 }, 0.1);

return () => split.revert(); // always restore the original text on cleanup`}</Code>
                <Table
                    head={['Split by', 'Stagger', 'Feel', 'Use for']}
                    mono={[0, 1]}
                    rows={[
                        ['lines', '0.06–0.1', 'calm, editorial', 'paragraphs, manifestos'],
                        ['words', '0.02–0.04', 'lively, conversational', 'captions, short statements'],
                        ['chars', '0.01–0.03', 'loud, typographic', 'one big title word — never paragraphs'],
                    ]}
                />
                <TryThis
                    items={[
                        'Turn the mask off on the “Igloo caption” preset — the words now float in from nowhere. The mask is what makes it feel crafted.',
                        'Switch to chars with a 0.08 stagger. Count how long a sentence takes. That’s why Igloo never splits paragraphs into characters.',
                    ]}
                />
                <Callout tone="warn" title="Fonts first">
                    SplitText measures lines, so split <em>after</em> the web font has loaded or line breaks will be wrong. Use <C>autoSplit: true</C> with an <C>onSplit()</C> callback (this page’s
                    hero title does), or wait for <C>document.fonts.ready</C>.
                </Callout>
            </Section>

            <Section id="scramble" n="4.3" title="Decode: text that receives a signal">
                <P>
                    The ScrambleText plugin replaces characters with random glyphs, then locks the real ones in from left to right. Igloo wraps it in three helpers: <C>scrambleIn</C> for reveals,{' '}
                    <C>hoverScramble</C> for hovers, and <C>scrambleOut</C> for exits. The character set is part of the brand voice: slashes, brackets and binary read as “data”.
                </P>
                <ScrambleLab />
                <Code file="ui/scramble.ts" highlight={['GLYPHS', 'revealDelay']}>{`export const GLYPHS = '!<>-_\\\\/[]{}=+*^?#01ABCDEFXZ';

/** Decode an element's text from noise. */
export function scrambleIn(el, opts = {}) {
    const text = opts.text ?? el.dataset.text ?? el.textContent ?? '';
    return gsap.fromTo(el, { opacity: 0 }, {
        opacity: 1,
        duration: opts.duration ?? Math.min(1.6, 0.35 + text.length * 0.018), // longer text, longer decode — capped
        ease: 'none',
        scrambleText: { text, chars: GLYPHS, revealDelay: 0.15, speed: 0.7 },
    });
}`}</Code>
                <Callout>
                    The real text lives in a <C>data-text</C> attribute and the element starts empty. That way the layout never flashes the final copy before the decode begins.
                </Callout>
            </Section>

            <Section id="lines" n="4.4" title="Lines that draw themselves">
                <P>
                    Two tricks cover every line on Igloo. For SVG, set <C>pathLength=&quot;1&quot;</C> so any path — however long — measures exactly 1. Then <C>stroke-dasharray: 1</C> and animate{' '}
                    <C>stroke-dashoffset</C> from 1 (hidden) to 0 (drawn). For straight rules, use a 1px-tall div and animate <C>scaleX</C> from 0 to 1; the <C>transform-origin</C> decides which end
                    it grows from.
                </P>
                <DrawLines />
                <Code file="ui/Chrome.tsx + ui/CrystalHud.tsx">{`// logo draws itself, then the chrome fades in
tl.fromTo('.ig-logo-stroke', { strokeDasharray: 120, strokeDashoffset: 120 },
                             { strokeDashoffset: 0, duration: 1.4, ease: 'expo.inOut', stagger: 0.08 });

// HUD: rules grow from their anchored side, leader lines draw at the same time
tl.fromTo('.ig-rule',   { scaleX: 0 },           { scaleX: 1, duration: 0.8, ease: 'expo.out', stagger: 0.1 }, 0.1);
tl.fromTo('.ig-leader', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7, ease: 'expo.inOut', stagger: 0.1 }, 0);

<path className="ig-leader" pathLength={1} d="M -150 -196 L -72 -118" />`}</Code>
                <KeyIdea>Draw-on = pathLength 1 + dashoffset 1 → 0. Rules = scaleX 0 → 1 with the right transform-origin.</KeyIdea>
            </Section>

            <Section id="recipe" n="4.5" title="The caption recipe: combining all three">
                <P>
                    A section caption on Igloo is all three families in one 1.1-second timeline: the tag decodes, the rule draws from the right, and the body words rise. You saw it live in the pinned
                    section of chapter 03.
                </P>
                <Code file="ui/Chrome.tsx → Caption">{`useGSAP(() => {
    const split = SplitText.create(body, { type: 'lines,words', mask: 'lines' });
    const tl = gsap.timeline();
    tl.add(scrambleIn(tag, { text: '////// 01 — Portfolio', duration: 0.8 }), 0)          // decode
      .fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'expo.inOut' }, 0)       // draw
      .from(split.words, { yPercent: 120, rotate: 4, duration: 1, ease: 'expo.out', stagger: 0.025 }, 0.1); // rise
    return () => split.revert();
}, { scope: root });`}</Code>
            </Section>

            <Section id="hovers" n="4.6" title="Micro-hovers: the precision layer">
                <P>
                    Hover states are where a page feels expensive or cheap. Igloo’s are all CSS transitions with one shared ease — <C>cubic-bezier(.16, 1, .3, 1)</C>, a strong ease-out — plus the
                    re-decode for labels.
                </P>
                <MicroHovers />
                <Where files={[{ path: 'igloo.scss', note: 'all hover recipes' }, { path: 'ui/scramble.ts' }, { path: 'ui/SocialCarousel.tsx' }]} />
                <Callout tone="warn" title="Accessibility">
                    SplitText adds <C>aria-label</C> to the parent so screen readers read the sentence, not fragments. Always <C>revert()</C> on unmount, hide decorative glyph text with{' '}
                    <C>aria-hidden</C>, and under <C>prefers-reduced-motion</C> skip decodes and show the final text.
                </Callout>
            </Section>
        </article>
    );
}

'use client';

import BlockRevealLab from '../demos/BlockRevealLab';
import TriggerModes from '../demos/TriggerModes';
import { C, Callout, Card, ChapterHead, Code, Grid, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function RevealChapter() {
    return (
        <article>
            <ChapterHead
                n="03"
                kicker="Block reveal"
                title="A block wipes in, the text appears, the block wipes out."
                lead={
                    <>
                        If the site has a signature, it’s this. Almost every piece of text — headlines, captions, menu links, buttons — appears behind a solid bar that sweeps across it. Once you see
                        how it’s built, you’ll notice it takes only three moves and one trick.
                    </>
                }
            />

            <Section id="anatomy" n="3.1" title="Anatomy of the wipe">
                <P>
                    Each line of text gets a coloured block laid exactly over it. The block starts at <C>scaleX: 0</C>, pinned to the left edge. It grows to cover the line (0.24 s). While the line is
                    fully covered, the text switches on underneath — you never see it pop. Then the block’s <Term k="origin">transform-origin</Term> jumps to the right edge and it shrinks away (0.30
                    s), uncovering the text from left to right.
                </P>
                <BlockRevealLab />
                <TryThis
                    items={[
                        <>Turn off “flip origin”: the block shrinks back to the left. The motion now reads as a blink, not a sweep — the trick is that one line.</>,
                        <>Set hold to 0.4: you start to notice the solid bars. At 0.05 they’re almost subliminal.</>,
                        <>Set stagger to 0 and then to 0.3. Zero feels mechanical; 0.3 feels like reading. The source’s 0.06–0.08 is fast enough to feel like one gesture.</>,
                        <>Try the ease “none”. The block moves at a constant speed and loses its snap.</>,
                    ]}
                />
                <Lens>
                    In After Effects this is a solid layer with a track matte, keyframed on Scale X: 0 → 100% with the anchor on the left, then the anchor moved to the right and Scale X back to 0%.
                    The text layer’s opacity has a hold keyframe from 0 to 100 at the exact frame the solid covers it.
                </Lens>
                <Code file="src/components/motion-kit/BlockReveal.tsx" lang="ts" highlight={["'--br-text': 1", "transformOrigin: '100% 50%'"]}>{`const lineTl = (line, block, at, tl) =>
    tl
        .set(line, { '--br-text': 0 }, at)
        .fromTo(block, { scaleX: 0, transformOrigin: '0% 50%' },
                       { scaleX: 1, duration: GROW, ease: 'power2.inOut' }, at)
        .set(line, { '--br-text': 1 }, at + GROW)                          // text on, while hidden
        .set(block, { transformOrigin: '100% 50%' }, at + GROW + HOLD)     // the trick
        .to(block, { scaleX: 0, duration: RETRACT, ease: 'power2.inOut' }, at + GROW + HOLD);`}</Code>
                <KeyIdea>Grow from the left, switch the text on while it’s hidden, flip the anchor, shrink to the right.</KeyIdea>
            </Section>

            <Section id="split" n="3.2" title="Finding the lines">
                <P>
                    A paragraph doesn’t know where its lines break — that depends on the font, the width and the screen. <Term k="splittext">SplitText</Term> measures it and wraps each rendered line
                    in its own element. The source then wraps each line again: an inline-block <C>.br-inner</C> holding the text and the block, so the block is exactly as wide as the words (not the
                    whole column).
                </P>
                <Code
                    file="src/components/motion-kit/BlockReveal.tsx"
                    lang="ts"
                    highlight={['autoSplit: true', 'onSplit']}
                >{`// line > span.br-inner (inline-block, relative) > [span.br-text, span.br-block]
splitter = SplitText.create(el, {
    type: 'lines',
    linesClass: 'br-line',
    autoSplit: true,                       // re-split when fonts load or the width changes
    onSplit: (self) => {
        wrap(self.lines);                  // add the inner wrapper + the block to every line
        if (el.dataset.revealed === '1') gsap.set(self.lines, { '--br-text': 1 }); // keep shown text shown
    },
});`}</Code>
                <P>
                    The text’s visibility is a <Term k="cssvar">CSS variable</Term>: <C>.br-text {'{ opacity: var(--br-text) }'}</C>. Setting one variable on the line is cheaper and cleaner than
                    tweening opacity on every word.
                </P>
                <Callout tone="warn">
                    Split lines are measured with the current font. If the web font arrives later, the lines are wrong — that’s why <C>autoSplit</C> matters, and why the re-split keeps
                    already-revealed text visible (<C>data-revealed</C>).
                </Callout>
            </Section>

            <Section id="triggers" n="3.3" title="When does it fire?">
                <P>
                    The same component reveals text in four situations, chosen with a prop. Most text uses <C>scroll</C>: play once, when the element’s top crosses 92% of the screen height. The
                    manifesto uses <C>perLine</C>, so each of its seven giant lines waits for its own moment.
                </P>
                <TriggerModes />
                <Table
                    head={['trigger', 'Fires', 'Used for']}
                    rows={[
                        [<C key="a">scroll</C>, 'once, when the block’s top passes start (default top 92%)', 'section titles, body copy, captions'],
                        [<C key="b">scroll + perLine</C>, 'once per line, as each line enters', 'the manifesto (7 lines, 146 px type)'],
                        [<C key="c">mount</C>, 'as soon as it appears in the DOM', '—'],
                        [<C key="d">manual</C>, 'when code calls ref.play() / ref.reverse()', 'menu links, hero race card, gallery captions, On Track page'],
                    ]}
                />
                <TryThis
                    items={[
                        <>Switch to perLine and scroll slowly: lines reveal one by one exactly as they cross the dashed line.</>,
                        <>Drag start to 50%: text now waits until it’s half-way up — you’ll see blank space first. That’s why 92% is the default: it fires just as text arrives.</>,
                    ]}
                />
            </Section>

            <Section id="reverse" n="3.4" title="Hiding it again">
                <P>
                    The menu has to hide its text when it closes. <C>reverse()</C> runs the same moves mirrored: the block comes back <em>from the right</em>, the text switches off, the block leaves
                    to the left. It’s shorter (×0.8 and ×0.7) and more tightly staggered (half), because exits should be quick (chapter 01). Try “Hide” in the lab above.
                </P>
            </Section>

            <Section id="color" n="3.5" title="The colour follows the section">
                <Grid>
                    <Card kicker="Dark sections" title="Lime block · #CDFF0B">
                        Hero card, manifesto, gallery captions, menu, footer.
                    </Card>
                    <Card kicker="Light sections" title="Near-black block · #1E1F1A" accent="var(--ll-gold)">
                        On/Off track, store, partners, socials.
                    </Card>
                </Grid>
                <P>
                    It’s only a prop — <C>{'<BlockReveal color="#1e1f1a">'}</C> — but it’s a system decision: the block is always the section’s <em>highest-contrast</em> colour, so the wipe reads even
                    at 0.24 s.
                </P>
                <KeyIdea>One reveal, used everywhere, with two colours. Consistency is what makes it feel like a brand, not an effect.</KeyIdea>
                <Where
                    files={[
                        { path: 'motion-kit/BlockReveal.tsx' },
                        { path: 'sections/Manifesto.tsx', note: 'perLine' },
                        { path: 'shell/Menu.tsx', note: 'manual + reverse' },
                        { path: 'lando.scss', note: '.br, .br-block' },
                    ]}
                />
            </Section>
        </article>
    );
}

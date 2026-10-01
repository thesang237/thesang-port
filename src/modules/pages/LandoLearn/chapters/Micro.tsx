'use client';

import HeaderProbe from '../demos/HeaderProbe';
import MarqueeLab from '../demos/MarqueeLab';
import RollingLab from '../demos/RollingLab';
import TooltipFollow from '../demos/TooltipFollow';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Term, TryThis, Where } from '../kit/ui';

export default function MicroChapter() {
    return (
        <article>
            <ChapterHead
                n="04"
                kicker="Micro-interactions"
                title="Small motions that answer your hand."
                lead={
                    <>
                        The big scenes get the attention, but the page feels alive because of the small things: letters that roll when you hover, a header that shrinks and changes colour under you,
                        logos that never stop drifting, a label that chases the cursor. Each is under 60 lines of code.
                    </>
                }
            />

            <Section id="rolling" n="4.1" title="Rolling text">
                <P>
                    Every menu and footer link rolls on hover. Each letter sits in its own one-line window (<C>overflow: hidden</C>). Inside, a column holds the letter and — hanging just below it — a
                    copy. On hover, every column slides up by 100% of a line, one after another (<Term k="stagger">stagger</Term> 0.018 s), so the word seems to flip letter by letter.
                </P>
                <RollingLab />
                <TryThis
                    items={[
                        <>Set stagger to 0: the whole word moves as one block — it reads as a slot machine, not a roll.</>,
                        <>Try stagger from “center” and ease “back.inOut(2)”. Fun, but the source stays with plain power3.inOut: the site’s personality is precise, not bouncy.</>,
                        <>
                            Hover in and out fast. Nothing fights, because each new tween uses <C>overwrite: true</C>.
                        </>,
                    ]}
                />
                <Code file="src/components/motion-kit/RollingText.tsx" highlight={['yPercent: to', 'rt-b']}>{`const run = (to: number) => {
    const chars = root.current?.querySelectorAll('.rt-col');
    gsap.to(chars, { yPercent: to, duration, ease: 'power3.inOut', stagger, overwrite: true });
};
// enter → run(-100), leave → run(0)

{Array.from(text).map((ch, i) => (
    <span className="rt-char">              {/* the window: overflow hidden */}
        <span className="rt-col">
            <span className="rt-a">{ch}</span>
            <span className="rt-b">{ch}</span>  {/* absolute, top: 100% — waits below */}
        </span>
    </span>
))}`}</Code>
                <Callout tone="tip" title="Accessibility">
                    Screen readers would read every letter twice. The source puts <C>aria-label</C> with the whole word on the wrapper and <C>aria-hidden</C> on the letters.
                </Callout>
            </Section>

            <Section id="header" n="4.2" title="A header that reads the page">
                <P>
                    Scroll 24 px and the header compacts: the wordmark scales to 0.845, the buttons shrink, the centre monogram fades. Separately, every section carries{' '}
                    <C>data-header=&quot;light|dark|dim&quot;</C>. On every scroll the header checks which section sits under its middle line and takes that theme — dark text on light sections, light
                    text on dark ones.
                </P>
                <HeaderProbe />
                <Code file="src/modules/pages/LandoNorris/shell/Header.tsx" lang="ts" highlight={['r.top <= 50', 'setInterval']}>{`const probe = () => {
    const c = lenis.scroll > 24;                       // compact after 24 px
    let best = null;
    document.querySelectorAll('.ln-page [data-header]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= 50 && r.bottom > 50) best = el;   // the section under the header line
    });
    const theme = best?.dataset.header ?? 'light';
    if (c !== st.headerCompact || theme !== st.headerTheme) st.set({ headerCompact: c, headerTheme: theme });
};
lenis.on('scroll', probe);
const id = window.setInterval(probe, 250);   // pinned sections change theme without moving`}</Code>
                <Lens>It’s a component with variants (light / dark / dim × default / compact) — and instead of you switching variants, the page does it based on what’s behind the header.</Lens>
                <Callout tone="warn">
                    Pinned sections don’t move while you scroll, but they can change colour — the gallery goes from dark to light while pinned. A scroll-only check could miss that, so the header also
                    re-checks four times a second. The gallery simply rewrites its own <C>data-header</C> as its background fades.
                </Callout>
            </Section>

            <Section id="marquee" n="4.3" title="The endless logo strip">
                <P>
                    The partner logos drift left forever. The trick is to render the row <strong>twice</strong>. The track moves left at 40 px/s; the moment it has moved exactly one copy’s width, it
                    jumps back by that width. Because copy B now sits exactly where copy A was, the jump is invisible.
                </P>
                <MarqueeLab />
                <Code file="src/components/motion-kit/Marquee.tsx" lang="ts" highlight={['% half', 'ticker.add']}>{`const tick = (_t, dt) => {
    const v = velocityBoost ? Math.abs(window.__lenis?.velocity ?? 0) * velocityBoost : 0;
    x -= ((speed + v) * dt) / 1000;
    if (half > 0) x = ((x % half) - half) % half;     // wrap at one copy's width
    track.style.transform = \`translate3d(\${x}px,0,0)\`;
};
gsap.ticker.add(tick);   // same clock as the scroll — pauses with the page`}</Code>
                <TryThis
                    items={[
                        <>Turn on x-ray and slow the speed to 10: watch copy B slide into copy A’s place at the wrap.</>,
                        <>Add some velocity boost and press Kick: the strip surges and settles, like scroll momentum.</>,
                    ]}
                />
            </Section>

            <Section id="tooltip" n="4.4" title="A label that chases the cursor">
                <P>
                    On the On/Off track section, a small label follows your pointer over the lime buttons. It isn’t glued to the cursor: each mouse move starts a new 0.25 s <C>power3.out</C> tween
                    toward it, which replaces the previous one. The label lags a hair behind, which reads as weight.
                </P>
                <TooltipFollow />
                <KeyIdea>Micro-interactions reuse the same tools as the big scenes — a tween, a stagger, a clock — just shorter and closer to the hand.</KeyIdea>
                <Where files={[{ path: 'motion-kit/RollingText.tsx' }, { path: 'shell/Header.tsx' }, { path: 'motion-kit/Marquee.tsx' }, { path: 'sections/OnOffTrack.tsx', note: 'tooltip' }]} />
            </Section>
        </article>
    );
}

'use client';

import MenuXRay from '../demos/MenuXRay';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function MenuChapter() {
    return (
        <article>
            <ChapterHead
                n="05"
                kicker="Menu choreography"
                title="Nine tracks, one second, and an exit that isn’t a rewind."
                lead={
                    <>
                        Opening the menu looks like one gesture. It’s actually a small film: a curved panel drops, four photos wipe in, the links rise, a lime stroke draws under the current page, and
                        six labels block-reveal — all overlapping, all in about one second. It’s the clearest example on the page of choreography.
                    </>
                }
            />

            <Section id="xray" n="5.1" title="The choreography, frame by frame">
                <P>
                    Everything lives on one GSAP <Term k="timeline">timeline</Term>. Each element gets a start time (the “position” number) — not a delay chained after the previous one. That’s what
                    lets the pieces overlap: photos start at 0.16 s, before the panel (0.41 s) has even finished.
                </P>
                <MenuXRay />
                <TryThis
                    items={[
                        <>Scrub to 0.2 s: the panel is only half down, but the first photo is already clipping in. The overlap is what makes it feel fast.</>,
                        <>Set the nav stagger to 0 — the four links arrive as one block. At 0.2 they queue up like a list. 0.075 is in between: one gesture with rhythm.</>,
                        <>Push the panel open time to 1.2 s. Every other track stays where it was, so the links now appear before the panel covers them. Timing is relational.</>,
                        <>Hover a link in the stage: its photo switches from duotone to colour.</>,
                    ]}
                />
                <Code file="src/modules/pages/LandoNorris/shell/Menu.tsx" highlight={[".fromTo(q('.ln-menu-panel')", 'stagger: 0.075', '.call(']}>{`const t = gsap.timeline();
t.set(root.current, { autoAlpha: 1, pointerEvents: 'auto' })
 .fromTo(q('.ln-menu-panel'),   { scaleY: 0 },      { scaleY: 1, duration: 0.41, ease: 'power1.out' }, 0)
 .fromTo(q('.ln-menu-contours'),{ autoAlpha: 0 },   { autoAlpha: 1, duration: 0.4 }, 0.2)
 .fromTo(q('.ln-menu-photo'),   { '--clip': 0 },    { '--clip': 1, duration: 0.34, ease: 'power2.out', stagger: 0.06 }, 0.16)
 .fromTo(q('.ln-menu-item-in'), { yPercent: 110 },  { yPercent: 0, duration: 0.26, ease: 'power3.out', stagger: 0.075 }, 0.38)
 .fromTo(q('.ln-menu-strike'),  { '--draw': 0 },    { '--draw': 1, duration: 0.4, ease: 'power2.out' }, 0.55)
 .fromTo(q('.ln-menu-emblem'),  { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 0.55)
 .call(() => reveals.current.forEach((r, i) => r?.play(i === 0 ? 0 : 0.04 + i * 0.05)), [], 0.57);`}</Code>
                <Lens>
                    This is an After Effects comp where every layer’s in-point is set by hand. The numbers at the end of each line (0, 0.2, 0.16, 0.38…) are the in-points; <C>stagger</C> is “sequence
                    layers” with an offset.
                </Lens>
            </Section>

            <Section id="panel" n="5.2" title="The curved panel">
                <P>
                    The dark panel isn’t a rectangle. It’s an SVG path whose bottom edge is a quadratic curve — <C>Q960 1194</C> pulls the middle 82 px below the corners. The SVG is stretched to the
                    screen (<C>preserveAspectRatio=&quot;none&quot;</C>) and scaled on Y from the top, so as it drops, the curve grows with it — it reads like a sheet of fabric falling, not a box
                    sliding.
                </P>
                <Code file="src/modules/pages/LandoNorris/shell/Menu.tsx" lang="tsx" highlight={['Q960 1194']}>{`<svg className="ln-menu-panel" viewBox="0 0 1920 1112" preserveAspectRatio="none">
    <path d="M0 0H1920V1030Q960 1194 0 1030Z" fill="var(--ln-dark)" />
</svg>
/* .ln-menu-panel { height: 108%; transform-origin: 50% 0; transform: scaleY(0); } */`}</Code>
                <TryThis items={[<>Set the curve depth to 0: a flat blind. Then to 300: a droopy curtain. 82 px is enough to feel organic without looking like a shape.</>]} />
            </Section>

            <Section id="exit" n="5.3" title="Closing is choreographed too">
                <P>
                    The lazy way to close a menu is <C>timeline.reverse()</C>. The source doesn’t: it builds a <em>separate</em> close timeline. The order flips (text leaves first, the panel last),
                    the eases flip to <C>.in</C>, and everything is shorter. Reversing would make you wait for the panel to finish before the links even start leaving.
                </P>
                <Table
                    head={['Track', 'Open', 'Close']}
                    rows={[
                        ['Block reveals', '0.57 s, grow → retract', '0 s, reverse() (block returns from the right)'],
                        ['Nav items', '0.38 s, rise 110% → 0, power3.out, stagger 0.075', '0.25 s, drop 0 → 110%, power2.in, stagger 0.04'],
                        ['Photos', '0.16 s, --clip 0 → 1, power2.out, stagger 0.06', '0.35 s, --clip 1 → 0, power2.in, stagger 0.04'],
                        ['Panel', '0 s, scaleY 0 → 1, power1.out, 0.41 s', '0.57 s, scaleY 1 → 0, power1.in, 0.25 s'],
                    ]}
                />
                <KeyIdea>Last in, first out: the exit plays the story backwards in order, but with its own eases and shorter times.</KeyIdea>
            </Section>

            <Section id="clip" n="5.4" title="Photos revealed through a CSS variable">
                <P>
                    Each photo slot has <C>clip-path: inset(0 0 calc((1 − var(--clip)) × 100%) 0)</C>. The timeline tweens <C>--clip</C> from 0 to 1, which wipes the photo down. The neat part: the
                    photos are actually drawn by a WebGL canvas (for the duotone effect in chapter 09), and the WebGL layer reads the <em>same</em> <C>--clip</C> value from the DOM every frame. One
                    tween drives both.
                </P>
                <Code file="src/modules/pages/LandoNorris/gl/MenuGL.tsx" lang="ts" highlight={['--clip']}>{`// every frame, for each photo plane:
it.u.clip.value = parseFloat(it.el.style.getPropertyValue('--clip') || '0');
// …and in the shader: pixels below the clip line are discarded
If(yDown.greaterThan(u.clip), () => { Discard(); });`}</Code>
                <Callout tone="tip" title="Designer habit">
                    A <Term k="cssvar">CSS variable</Term> is a great hand-off point: one number that any layer — CSS, SVG or WebGL — can read. Design one “progress” value per element, not one
                    animation per layer.
                </Callout>
            </Section>

            <Section id="lock" n="5.5" title="While the menu is open">
                <P>
                    Three small rules: smooth scroll stops (<C>lenis.stop()</C>) so the page can’t move behind the menu; the menu layer is <C>aria-hidden</C> and <Term k="autoalpha">autoAlpha 0</Term>{' '}
                    when closed so it can’t be clicked or read; the header stays <em>above</em> the menu (z 70 vs 65) so its button can become the close ×. And the menu’s WebGL layer only mounts on
                    the first open, and keeps rendering for 1.2 s after closing so the exit stays visible — then stops.
                </P>
                <Where files={[{ path: 'shell/Menu.tsx' }, { path: 'gl/MenuGL.tsx' }, { path: 'shell/Header.tsx' }, { path: 'lando.scss', note: '.ln-menu-*' }]} />
            </Section>
        </article>
    );
}

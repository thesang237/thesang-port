'use client';

import PinnedStory from '../demos/PinnedStory';
import TimelineBuilder from '../demos/TimelineBuilder';
import { C, Callout, Card, ChapterHead, Code, Grid, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function TimelineChapter() {
    return (
        <article>
            <ChapterHead
                n="03"
                kicker="Scroll timeline"
                title="One master timeline, scrubbed by scroll."
                lead={
                    <>
                        Chapter 02 mapped one value at a time. With a dozen values across four scenes that gets messy fast. GSAP’s <Term k="timeline">timeline</Term> lets you place every move at an
                        exact time — then <Term k="scrolltrigger">ScrollTrigger</Term> hands the playhead to the scroll bar.
                    </>
                }
            />

            <Section id="two-ways" n="3.1" title="Two ways to animate on scroll">
                <Grid>
                    <Card kicker="Most sites" title="Many small triggers" accent="var(--il-dim)">
                        Each element gets its own ScrollTrigger: “when this card enters, fade it in”. Easy for independent sections. Hard when moves must overlap, hand off between scenes, or reverse
                        perfectly.
                    </Card>
                    <Card kicker="Igloo" title="One master timeline">
                        One timeline 16 units long holds <em>everything</em>, and one ScrollTrigger scrubs it. Overlaps are exact, the whole film reverses when you scroll up, and the loop back to the
                        start is just more tweens at the end.
                    </Card>
                </Grid>
                <KeyIdea>Design the film once on a timeline. Let scroll be the playhead.</KeyIdea>
                <Lens>
                    This is literally an After Effects composition. Each <C>tl.to()</C> is a keyframe pair on a layer, the third argument is where the bar starts, and ScrollTrigger replaces the
                    spacebar with your scroll wheel.
                </Lens>
            </Section>

            <Section id="units" n="3.2" title="Timeline units = screens of scroll">
                <P>
                    GSAP durations are normally seconds. When a timeline is scrubbed, seconds stop meaning time and start meaning <strong>distance</strong>. Igloo makes that explicit: the timeline is
                    16 units, the scroll track is <C>(16 + 1) × 100vh</C> tall, and the trigger runs from the top of the track to its bottom. So <strong>1 unit = 1 screen of scrolling</strong>. A
                    1.45-unit crystal move takes one and a half flicks of the wheel.
                </P>
                <Code file="IglooPage.tsx → Scroller (trimmed)" highlight={['position', 'scrub: true', 'set({}, {}, TIMELINE.total)']}>{`const tl = gsap.timeline({ defaults: { ease: 'none' } });

//   what           to                          length  position (in screens)
tl.to('.ig-hero', { autoAlpha: 0, y: -30, filter: 'blur(10px)', duration: 0.7 }, 0.15)
  .to(motion,     { heroCam: 1, duration: 1.7, ease: 'power1.inOut' },          0.2)
  .to(motion,     { explode: 1, duration: 1.5 },                                0.3)
  .to(motion,     { scene: 1,   duration: 1.0, ease: 'power1.inOut' },          1.3)
  .to(motion,     { crystals: 1, duration: 1.45, ease: 'power3.inOut' },        2.4)
  // … rings, dive, colony, and the loop back …
  .set({}, {}, TIMELINE.total); // pad the timeline to exactly 16 units

ScrollTrigger.create({
    trigger: track.current,          // the invisible (16 + 1) × 100vh div
    start: 'top top',
    end: 'bottom bottom',
    animation: tl,
    scrub: true,                     // playhead = scroll progress, no extra lag
});

return <div ref={track} style={{ height: \`\${(TIMELINE.total + 1) * 100}vh\` }} />;`}</Code>
                <Callout>
                    Why <C>(16 + 1)</C>? The trigger ends when the track’s bottom meets the viewport’s bottom, so the last screen of height is “used up” by the viewport itself. 17 screens tall = 16
                    screens of travel.
                </Callout>
            </Section>

            <Section id="builder" n="3.3" title="Build one: a four-screen timeline">
                <P>
                    Here is the whole pattern at small scale. Scroll inside the box. The tracks on the right are the same numbers used in the code below them. Change <strong>scrub</strong> to see the
                    difference between a playhead glued to scroll and one that catches up.
                </P>
                <TimelineBuilder />
                <Table
                    head={['Setting', 'Igloo', 'Why']}
                    mono={[0, 1]}
                    rows={[
                        ['scrub', 'true', 'Lenis already smooths scroll. Adding scrub smoothing on top would feel like double inertia — floaty and late.'],
                        ['defaults.ease', "'none'", 'A linear playhead keeps scroll honest. Character is added per tween (power3.inOut for the carousel snaps).'],
                        ['position param', 'absolute numbers', 'Every tween is placed at an exact screen, so the storyboard is readable straight from the code.'],
                        ['.set({}, {}, 16)', 'padding', 'Guarantees the timeline is exactly 16 long, so progress × 16 = the storyboard time.'],
                    ]}
                />
                <TryThis
                    items={[
                        'Set overlap to 0 and scroll slowly: there is a “dead” moment between title and orb. Put 0.4 back — one continuous move.',
                        'Switch the default ease to power2.inOut. Scroll feels sticky because each tween now slows at both ends.',
                    ]}
                />
            </Section>

            <Section id="numbers" n="3.4" title="Tween numbers, not only elements">
                <P>
                    GSAP can animate any property of any JavaScript object, not just CSS. Igloo tweens a plain object called <C>motion</C>. The timeline writes it; the 3D worlds read it inside their
                    render loop. HTML layers (<C>.ig-hero</C>, <C>.ig-ghosts</C>) sit on the <em>same</em> timeline, so text and 3D can never drift apart.
                </P>
                <Code file="store.ts + canvas/IglooWorld.tsx">{`// store.ts — dials, written by the timeline
export const motion = { scene: 0, explode: 0, heroCam: 0, crystals: -0.8, rings: 0, dive: 0, form: 0, … };

// IglooWorld.tsx — read every frame, turned into 3D
useFrame(() => {
    const rise = easeInOutCubic(motion.heroCam);
    camera.position.copy(HERO_POS).lerp(RISE_POS, rise);   // camera rail
    fog.density = lerp(0.021, 0.06, motion.explode);       // fog thickens as it cracks
    // … every brick reads motion.explode (chapter 02) …
});`}</Code>
                <KeyIdea>The timeline never touches three.js. It only turns dials. Worlds read dials. That separation is what makes the page easy to re-choreograph.</KeyIdea>
            </Section>

            <Section id="pinned" n="3.5" title="Feel it: a real pinned section">
                <P>
                    This block is pinned to the page for three screens. Scroll the page (not a box) — it holds still while one scrubbed timeline assembles, aligns and dives through the rings. The
                    caption decodes a new line per act, the rail fills, and the 3D-ish rings tilt: a miniature of Igloo’s act 2.
                </P>
                <PinnedStory />
            </Section>

            <Section id="bridge" n="3.6" title="onUpdate: the bridge to the UI">
                <P>
                    Some things shouldn’t be scrubbed — a caption that decodes should play at its own pace, even if you stop scrolling halfway. Igloo computes the current <strong>section</strong> in
                    ScrollTrigger’s <C>onUpdate</C>, and only tells React when that number changes. The caption component is keyed by section, so it remounts and plays its reveal from scratch.
                </P>
                <Code
                    file="IglooPage.tsx + ui/Chrome.tsx"
                    highlight={['!== section', 'key={section}']}
                >{`const sectionAt = (t: number) => (t < 1.8 ? 0 : t < 7.5 ? 1 : t < 11.2 ? 2 : t < 14.6 ? 3 : 0);

ScrollTrigger.create({
    …,
    onUpdate: (self) => {
        motion.progress = self.progress;
        const section = sectionAt(self.progress * TIMELINE.total);
        // 60 updates a second, but React only hears about the 4 changes
        if (useIglooUI.getState().section !== section) useIglooUI.getState().set({ section });
        gsap.set(railFill, { scaleY: self.progress });   // cheap, direct DOM write
    },
});

// Chrome.tsx — remount per section so the reveal replays cleanly
{CAPTIONS[section] && <Caption key={section} {...CAPTIONS[section]} />}`}</Code>
                <Table
                    head={['Kind of change', 'Drive it with', 'Example on Igloo']}
                    rows={[
                        ['Continuous, reversible', 'scrubbed timeline', 'camera, explode, crystals, rings, hero fade'],
                        ['Discrete “chapter” events', 'onUpdate → state change', 'captions, rail dot, active crystal, Tweak button'],
                        ['Direct visual echo of progress', 'onUpdate → direct style write', 'scroll rail fill (scaleY)'],
                        ['Time-based flourish', 'its own gsap.timeline()', 'caption decode, HUD scramble, particle morph'],
                    ]}
                />
            </Section>

            <Section id="jump" n="3.7" title="Jump links: scroll to a moment">
                <P>
                    Because 1 unit = 1 screen, “go to the portal” is just “scroll to 8.1 screens”. The rail buttons call Lenis with a long ease-out, so the jump itself becomes a fast-forward through
                    the film rather than a cut.
                </P>
                <Code file="ui/Chrome.tsx">{`const SECTIONS = [{ label: 'Igloo', at: 0 }, { label: 'Portfolio', at: 2.2 }, { label: 'Portal', at: 8.1 }, { label: 'Colony', at: 12.4 }];

const jump = (at: number) =>
    lenis.scrollTo(at * window.innerHeight, { duration: 2.4, easing: (t) => 1 - Math.pow(1 - t, 4) });`}</Code>
                <Where
                    files={[
                        { path: 'IglooPage.tsx', note: 'Scroller' },
                        { path: 'data.ts', note: 'TIMELINE, SECTIONS' },
                        { path: 'ui/Chrome.tsx', note: 'Caption, rail' },
                    ]}
                />
            </Section>
        </article>
    );
}

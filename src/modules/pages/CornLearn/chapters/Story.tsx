'use client';

import StoryXray from '../demos/StoryXray';
import WindowMapper from '../demos/WindowMapper';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Term, TryThis, Where } from '../kit/ui';

export default function Story() {
    return (
        <>
            <ChapterHead
                n="02"
                kicker="One number"
                title="Every frame asks one question. Where is the story?"
                lead={
                    <>
                        The scroller gives a step. The timeline turns it into the <Term k="pos">story position</Term>, a number from 0 (hero) to 9 (hero again). From that one number the engine decides
                        everything visible this frame: which worlds draw, how they meet, where each camera is, whether a title or a paragraph shows.
                    </>
                }
            />

            <Section id="pos" n="01 · Step → story" title="From steps to chapters">
                <P>
                    <C>Timeline.toStory(step)</C> walks back to the chapter the step belongs to. Inside the chapter’s dwell steps the story position stays on the chapter (4.0) and the{' '}
                    <Term k="dwell">dwell</Term> climbs 0 → 1. In the move step the story position climbs (4.0 → 5.0) and the dwell stays at 1. So the fraction of the story position always means one
                    thing: how far the move to the next chapter is.
                </P>
                <Code file="engine/Timeline.ts · toStory()" highlight={['if (u <= d)', 'pos: i + (u - d)']}>
                    {`toStory(step: number) {
    if (step >= this.total) return { pos: LAST + 1, dwell: 0 };     // the loop: hero again
    let i = LAST;
    while (i > 0 && step < this.starts[i]) i--;                     // which chapter owns this step
    const u = step - this.starts[i];                                // steps into it
    const d = this.dwells[i];
    if (u <= d) return { pos: i, dwell: d ? u / d : 0 };            // dwelling: story holds
    return { pos: i + (u - d), dwell: 1 };                          // moving to chapter i + 1
}`}
                </Code>
                <Lens>
                    The story position is the playhead of a comp whose keyframes are the chapters. The dwell is a second, smaller playhead that runs only while the big one is parked on a keyframe: the
                    camera drifts while the title holds.
                </Lens>
                <KeyIdea>floor(pos) = the chapter you are in; the fraction = how far the move to the next one is; dwell = the scroll spent inside the chapter.</KeyIdea>
            </Section>

            <Section id="xray" n="02 · One frame" title="What one frame decides">
                <P>
                    Scrub the step below. The engine looks at <C>floor(pos)</C> and the next chapter: if they live in different worlds, it draws both and cuts with the wipe (or blends if the next
                    chapter says <C>enter: &apos;blend&apos;</C>). If they share a world, it draws that one world and lets the world blend its own stops. Title, copy and the side-nav ring all read the
                    same number.
                </P>
                <StoryXray />
                <TryThis
                    items={[
                        <>Drag from step 0 to 1. The story position stays at 0 while dwell climbs: that’s the hero’s dwell step. From 1 to 2 the wipe plays.</>,
                        <>Drag slowly through step 3 → 4 (DNA to network): one world, an in-world blend, no wipe.</>,
                        <>Find the stalk (steps 8 → 10): two dwell steps, so the camera has room to walk down the plant. The “Field trials” ring fills over 5 snaps.</>,
                        <>Watch “copy shown”: it switches on a little before each stop lands (within 0.22), not after.</>,
                    ]}
                />
                <KeyIdea>Different worlds → two renders and a wipe or blend; same world → one render that blends its own stops.</KeyIdea>
            </Section>

            <Section id="windows" n="03 · Windows" title="Windows are the page’s keyframes">
                <P>
                    How does a number from 0 to 9 become “the pot rises” or “the title fades”? Almost always with a <Term k="smoothstep">smoothstep window</Term>: <C>smooth(a, b, v)</C> is 0 before a,
                    1 after b, and eases in between. Time-based moves (the title trace) use a sine version, <C>gentle</C>. Change a and b and you’ve moved the keyframes; nothing else needs to know.
                </P>
                <WindowMapper />
                <Code file="engine/worlds/World.ts + Engine.ts" highlight={['t * t * (3 - 2 * t)', 'Math.cos']}>
                    {`export const smooth = (a: number, b: number, v: number) => {
    const t = clamp01((v - a) / (b - a));
    return t * t * (3 - 2 * t);                 // soft start, soft end
};
const gentle = (a, b, v) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01((v - a) / (b - a)));

// examples from the worlds
setFade(this.helixWrap, 1 - smooth(0.45, 1.0, s));   // DNA fades as the network arrives
const potIn = smooth(1.42, 2, s);                      // the pot rises into its stop`}
                </Code>
                <TryThis
                    items={[
                        <>Pick “Wipe progress” and set a = 0, b = 1. The wipe would start the instant you touch the wheel: less decisive.</>,
                        <>Pick “Pot rises in” and drag a down to 1.0: the pot would arrive during the network’s own step, stepping on its moment.</>,
                        <>Switch any window to linear: the start and end become visible corners.</>,
                    ]}
                />
                <KeyIdea>smooth(a, b, v) is a keyframe pair with easy ease, placed on the story instead of on time.</KeyIdea>
            </Section>

            <Section id="local" n="04 · Local and dwell" title="Each world gets its own clock">
                <P>
                    Worlds don’t read the story position directly. Each gets a <C>FrameCtx</C> with <C>local</C> (the story position measured from the world’s first chapter, so the science world sees
                    0, 1, 2 for its three stops) and <C>dwell</C>. That makes a world reusable: it only knows “my stop 0, my stop 1”, never “chapter 3”.
                </P>
                <Code file="engine/worlds/World.ts · FrameCtx + Engine.renderWorld (trimmed)" highlight={['local = pos', 'dwell:']}>
                    {`export type FrameCtx = {
    time: number; dt: number;
    ptr: THREE.Vector2;      // smoothed pointer, −1..1
    local: number;           // story position from this world's first chapter
    dwell: number;           // 0 → 1 inside the current chapter
    w: number; h: number; dpr: number; ptrActive: boolean;
};

let local = pos - this.firstChapter.get(id)!;
world.update({ time, dt, ptr, local, dwell, w, h, dpr, ptrActive });

// ScienceWorld: the dwell carries every scroll move on, so the scene never sits still
const s = local + 0.4 * dwell;`}
                </Code>
                <Callout tone="tip" title="A design rule hiding in one line">
                    <C>s = local + 0.4 · dwell</C> means the helix keeps rising and turning while you scroll inside its chapter, and the motion hands over to the next stop without reversing. The brief
                    was “scenes must never sit still while scrolling”.
                </Callout>
                <KeyIdea>Worlds see only local (my stops) and dwell (my in-chapter scroll), so each world can be built and tested alone.</KeyIdea>
            </Section>

            <Section id="copy" n="05 · The rest" title="Copy, titles and the ring use the same number">
                <P>
                    Body copy shows while the story is within 0.22 of its stop, so it arrives as the move lands. A chapter’s title starts tracing once the move into it is about 70 % done (distance
                    under 0.28) and fades out between 0.3 and 0.6 chapters away, late enough that a wipe cuts it rather than fading it first. The side-nav ring is the section’s progress through its
                    snaps.
                </P>
                <Code file="engine/Engine.ts · updateNav() (runs every frame, no React)" highlight={['setAttribute']}>
                    {`private updateNav() {
    const sec = this.timeline.section(this.scroller.pos);
    const p = sec.index < 0 ? 0 : sec.progress;
    if (Math.abs(p - this.navP) < 0.0005) return;          // skip tiny changes
    this.navP = p;
    this.navArc ??= document.querySelector('[data-nav-arc]');
    this.navArc?.setAttribute('stroke-dasharray', \`\${(p * 100).toFixed(2)} 100\`);
}`}
                </Code>
                <KeyIdea>Copy within 0.22 of a stop, titles from 70 % of the move in, the ring = section progress: all from the same story number.</KeyIdea>
                <Where
                    files={[
                        { path: 'engine/Timeline.ts', note: 'toStory, section' },
                        { path: 'engine/Engine.ts', note: 'tick, renderWorld, updateTitles, updateNav' },
                        { path: 'engine/worlds/World.ts', note: 'FrameCtx, smooth, damp' },
                        { path: 'dom/SideNav.tsx', note: 'the ring' },
                    ]}
                />
            </Section>
        </>
    );
}

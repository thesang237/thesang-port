'use client';

import { useMemo } from 'react';

import SpringVsDamp from '../demos/SpringVsDamp';
import StepLab from '../demos/StepLab';
import { CHAPTERS, Timeline } from '../kit/source';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function Steps() {
    const tl = useMemo(() => new Timeline(), []);
    return (
        <>
            <ChapterHead
                n="01"
                kicker="Steps"
                title="The page never scrolls. It moves one step at a time."
                lead={
                    <>
                        On /corn one wheel notch or one swipe carries you one shot further, then the picture glides to rest. There is no scrollbar and no long page: the browser’s scroll is switched
                        off and replaced by a number that moves in whole <Term k="step">steps</Term> on a spring.
                    </>
                }
            />

            <Section id="why" n="01 · Why" title="Switch the browser’s scroll off">
                <P>
                    A normal page scrolls as far and as fast as your hand. Flick hard and you fly past three transitions in a blur. /corn wants every shot to play, at its own pace. So the engine
                    catches the wheel, touch and keys on the window, cancels the browser’s default scroll, and uses the input only as a <em>request</em>: “one step further, please”.
                </P>
                <Code file="engine/Engine.ts · bind() and Scroller.onWheel (trimmed)" highlight={['passive: false', 'preventDefault']}>
                    {`window.addEventListener('wheel', this.scroller.onWheel, { passive: false });
window.addEventListener('touchmove', this.scroller.onTouchMove, { passive: true });
window.addEventListener('keydown', this.onKey);

onWheel = (e: WheelEvent) => {
    e.preventDefault();                                   // the page itself never moves
    const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY; // line-mode mice → px
    this.nudge(clamp(dy / WHEEL_PER_STEP, -MAX_EVENT, MAX_EVENT));
};`}
                </Code>
                <Lens>
                    A presentation clicker: each click advances one slide and the transition always plays in full. Except here the transition follows your hand while you scroll, and only “clicks” into
                    place when you let go.
                </Lens>
                <KeyIdea>Input doesn’t move the page; it asks for a step. The engine decides how the story gets there.</KeyIdea>
            </Section>

            <Section id="target" n="02 · Target" title="Your hand moves a target, the view follows it">
                <P>
                    There are two numbers. The <strong>target</strong> is where you asked to go: each wheel event adds its delta divided by 420 px, so one ordinary notch is about one step. The{' '}
                    <strong>view</strong> (<C>pos</C>) is where the story actually is; it chases the target. Two limits keep a hard flick civilised: one event can add at most 0.32 of a step, and the
                    target can never run more than 2.1 steps ahead of the view.
                </P>
                <StepLab />
                <TryThis
                    items={[
                        <>Give the pad one tiny nudge and stop. It springs back: you didn’t pass the 10 % commit line.</>,
                        <>Press “Hard flick”. The target jumps about 2 steps ahead (the lead limit), the view takes its time.</>,
                        <>Drop “wheel px per step” to 80: now one notch skips several shots. That’s why the source uses 420.</>,
                        <>Turn off “settle on whole steps”: you get an ordinary smooth scroll that can stop half way through a transition.</>,
                    ]}
                />
                <KeyIdea>Two numbers: the target (your request) and the view (the story). Limits on the target keep every transition watchable.</KeyIdea>
            </Section>

            <Section id="settle" n="03 · Settle" title="Let go, and it lands on a step">
                <P>
                    When no input has arrived for 170 ms, the scroller rounds the target to a whole step. It isn’t plain rounding: it leans toward the direction you were going. Scrolling down,
                    anything past 10 % of the next step commits forward; scrolling up, the same in reverse. A small, decisive gesture is enough to move on, and an accidental touch springs back.
                </P>
                <Code file="engine/Scroller.ts · update() (settle)" highlight={['forward =', 'COMMIT']}>
                    {`// input over: settle on a whole step, biased toward the direction of travel
if (this.lastInput && performance.now() - this.lastInput > IDLE_MS) {
    this.lastInput = 0;
    const base = Math.floor(this.target);
    const frac = this.target - base;
    const forward = this.dir > 0 ? frac > COMMIT : frac > 1 - COMMIT;  // COMMIT = 0.1
    this.target = base + (forward ? 1 : 0);
}`}
                </Code>
                <Table
                    head={['Setting', 'Value', 'What it feels like']}
                    mono={[1]}
                    rows={[
                        ['Wheel per step', '420 px', 'One ordinary notch = one shot'],
                        ['Max per event', '0.32 step', 'Huge trackpad deltas can’t skip chapters'],
                        ['Lead', '2.1 steps', 'A hard flick reaches the next chapter, never three'],
                        ['Idle', '170 ms', 'Lift your finger and it lands right away'],
                        ['Commit', '10 %', 'Small intent moves on; accidents spring back'],
                    ]}
                />
                <KeyIdea>After 170 ms of silence the target snaps to a whole step, leaning the way you were going (10 % is enough).</KeyIdea>
            </Section>

            <Section id="spring" n="04 · Spring" title="A spring, not an ease">
                <P>
                    The view follows the target on a <Term k="spring">critically damped spring</Term>. Every frame it accelerates toward the target and brakes with its own speed: it starts softly,
                    keeps its momentum if you scroll again mid-move, and lands without overshooting. Most sites use a <Term k="damp">damp</Term> instead (close a share of the gap each frame), which
                    leaves at full speed: quick, but it reads as a jolt.
                </P>
                <SpringVsDamp />
                <Code file="engine/Scroller.ts · update() (spring)" highlight={['const acc', 'W_SETTLE']}>
                    {`// critically damped spring, integrated in small steps (stable at any frame rate)
const w = this.lastInput ? W_FOLLOW : W_SETTLE;   // 3.4 while scrolling, 2.5 while landing
const n = Math.max(1, Math.ceil(dt / (1 / 120)));
const h = dt / n;
for (let i = 0; i < n; i++) {
    const acc = w * w * (this.target - this.pos) - 2 * w * this.vel;
    this.vel += acc * h;
    this.pos += this.vel * h;
}`}
                </Code>
                <TryThis
                    items={[
                        <>Set the frame rate to 30, then 144. Spring and damp keep their curve; the naive lerp crawls at 30 and rushes at 144.</>,
                        <>Push spring ω to 10: it becomes snappy, close to damp. The page’s 2.5 is deliberately slow (the brief: “slower, gentler, premium”).</>,
                        <>Compare the slopes at time 0: the spring’s curve starts flat. That flat start is the “soft start” you feel on /corn.</>,
                    ]}
                />
                <KeyIdea>A critically damped spring eases in and lands without bounce; ω 3.4 while you scroll, 2.5 to land (≈ 1.6 s).</KeyIdea>
            </Section>

            <Section id="steps-story" n="05 · Steps ≠ chapters" title="A chapter owns more than one step">
                <P>
                    Steps are not chapters. Each chapter keeps some <Term k="dwell">dwell</Term> steps for itself, where the copy stays and the 3D scene keeps travelling (the camera walks down the
                    stalk, the field pans), then one step that carries the story to the next chapter. The default dwell is 1; the stalk has 2 because the camera walks down the whole plant; the footer
                    stops have 0.
                </P>
                <Code file="engine/Timeline.ts · constructor" highlight={['s += d + 1']}>
                    {`readonly starts: number[] = [];                       // step where each chapter arrives
readonly dwells = CHAPTERS.map((c) => c.dwell ?? 1);
constructor() {
    let s = 0;
    this.dwells.forEach((d) => {
        this.starts.push(s);
        s += d + 1;                                          // its dwell steps + the move out
    });
    this.total = s;                                          // one past the end = the hero again
}`}
                </Code>
                <Table
                    head={['Chapter', 'Dwell', 'Arrives at step', 'Leaves at step']}
                    mono={[1, 2, 3]}
                    rows={CHAPTERS.map((c, i) => [c.id, String(tl.dwells[i]), String(tl.starts[i]), String(tl.starts[i] + tl.dwells[i])])}
                />
                <Callout tone="tip" title="Two special cases">
                    Step {tl.total} (one past the footer) is the hero again: when the scroller lands there it jumps back to 0, so the story loops. And while a deep-dive mode is open, the engine sets{' '}
                    <C>scroller.enabled = false</C>: the wheel does nothing until you close it.
                </Callout>
                <Callout tone="warn" title="What could be better">
                    A stepped scroll needs a reduced-motion path (jump between stops with a fade) and a phone layout; both are still open on the source page.
                </Callout>
                <KeyIdea>A chapter owns its dwell steps plus one move step; the table above is computed by the page’s own Timeline.</KeyIdea>
                <Where
                    files={[
                        { path: 'engine/Scroller.ts', note: 'target, settle, spring' },
                        { path: 'engine/Timeline.ts', note: 'steps ↔ chapters' },
                        { path: 'engine/Engine.ts', note: 'bind(), onKey' },
                        { path: 'data/story.ts', note: 'dwell per chapter' },
                    ]}
                />
            </Section>
        </>
    );
}

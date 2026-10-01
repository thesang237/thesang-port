'use client';

import EaseGallery from '../demos/EaseGallery';
import FrameFit from '../demos/FrameFit';
import { C, Callout, Card, ChapterHead, Code, Grid, KeyIdea, Lens, P, Section, Steps, Table, Term, TryThis, Where } from '../kit/ui';

export default function TimingChapter() {
    return (
        <article>
            <ChapterHead
                n="01"
                kicker="Timing from video"
                title="Motion is numbers you can measure."
                lead={
                    <>
                        The clone had no source code to copy — only a two-minute screen recording. Every duration, delay and <Term k="ease">ease</Term> on the page was measured from that video, frame
                        by frame. This is the most useful reverse-engineering skill in the whole guide, and you can do it with any site you admire.
                    </>
                }
            />

            <Section id="method" n="1.1" title="The method: frames in, numbers out">
                <P>
                    A video is a flipbook. At 30 frames per second, each frame is <strong>1/30 s ≈ 33 ms</strong>. If a block takes seven frames to grow across a line, it grows in about 0.23 s.
                    Measure where things are on each frame, and the shape of those numbers tells you the ease.
                </P>
                <Steps
                    items={[
                        <>Record the reference at a fixed size (here 1920 × 1030, 30 fps). Note the scroll and cursor you used.</>,
                        <>Export frames around each moment (ffmpeg) and name them by time: frame n → t = start + (n − 1) / 30.</>,
                        <>Measure one thing per frame: an edge position, a bounding box, how much of the screen a colour covers.</>,
                        <>Turn counts into seconds (7 frames → 0.23 s) and fit an ease to the shape — the next demo.</>,
                        <>Rebuild, record the clone the same way, compare side by side. Repeat until frames line up (here within ~1 frame).</>,
                    ]}
                />
                <Lens>
                    It is exactly what you do when you study a reference in After Effects: step through frame by frame (Page Down), note where a layer is on each frame, and rebuild the keyframes and
                    graph editor curve until yours overlays the original.
                </Lens>
            </Section>

            <Section id="frames" n="1.2" title="Frames to seconds">
                <P>
                    The source code keeps the measurements next to the numbers they produced. The block reveal, for example, says: <em>“block grows in ~7 frames, holds ~2, retracts in ~9”</em>. At 30
                    fps that becomes the three constants below.
                </P>
                <Table
                    head={['Measured', 'Frames @30fps', 'Seconds', 'Constant in code']}
                    rows={[
                        ['Block grows across a line', '7', '0.23', 'GROW = 0.24'],
                        ['Block holds before leaving', '2', '0.07', 'HOLD = 0.05'],
                        ['Block retracts', '9', '0.30', 'RETRACT = 0.3'],
                        ['Menu panel drops', '≈ 12', '0.41', 'OPEN = 0.41'],
                        ['Nav items start apart', '≈ 2.25', '0.075', 'stagger: 0.075'],
                        ['Monogram tick repeats', '29', '0.97', 'repeatDelay: 0.8 (+0.17)'],
                    ]}
                    mono={[1, 2, 3]}
                />
                <Code
                    file="src/components/motion-kit/BlockReveal.tsx"
                    lang="ts"
                    highlight={['GROW', 'RETRACT']}
                >{`// measured in the reference: block grows in ~7 frames, holds ~2, retracts in ~9 (30 fps)
const GROW = 0.24;
const HOLD = 0.05;
const RETRACT = 0.3;`}</Code>
                <Callout tone="tip" title="Designer habit">
                    Write the measurement next to the value, in the file or in your spec. Six months later, “0.24” means nothing — “7 frames in the reference” tells you why it’s right and how to
                    re-check it.
                </Callout>
            </Section>

            <Section id="fit" n="1.3" title="Fitting an ease to measured frames">
                <P>
                    Durations are easy; <strong>eases</strong> need a fit. The preloader’s “4” window was measured by how much of the screen showed through it on each frame. Area grows with the square
                    of the size, so the demo plots √area — the glyph’s scale. Two traps are marked: the first frame is smaller than the noise, and the last two frames are <strong>clipped</strong> —
                    the glyph already touches the screen edge, so its visible area stops growing even though the glyph doesn’t.
                </P>
                <FrameFit />
                <TryThis
                    items={[
                        <>
                            Keep <C>expo.in</C>, press Auto-fit: the duration lands near <strong>0.53 s</strong> — the source uses 0.51.
                        </>,
                        <>
                            Try <C>none</C> and <C>power2.out</C> and auto-fit them. Their error stays high: linear and “out” can’t make that shape.
                        </>,
                        <>Now include the clipped frames and fit again. A different ease “wins” — because the data is lying, not the ease. Always know which frames to trust.</>,
                        <>Turn off the log scale: exponential growth hides as a hockey stick. On a log scale it is a straight line.</>,
                    ]}
                />
                <KeyIdea>Fit the ease to the clean frames, then confirm by eye side by side. Numbers narrow it down; your eye makes the call.</KeyIdea>
            </Section>

            <Section id="vocabulary" n="1.4" title="The site’s ease vocabulary">
                <P>
                    The whole page uses only a handful of eases. That restraint is part of why it feels coherent: panels use <C>power1</C> (gentle), text uses <C>power2</C>/<C>power3</C> (snappier),
                    the zoom uses <C>expo.in</C>, and anything tied to scroll uses <C>none</C> — because the scroll wheel (and Lenis) already provides the feel.
                </P>
                <EaseGallery />
                <TryThis
                    items={[
                        <>Turn on slow motion and compare “Menu panel opens” with “Menu panel closes”. Same object, opposite curves.</>,
                        <>Watch the expo.in dot: it seems to wait, then jump. On a scale, that jump reads as a steady camera push (chapter 10).</>,
                    ]}
                />
            </Section>

            <Section id="asymmetry" n="1.5" title="Arrive with .out, leave with .in">
                <P>
                    The menu opens with <C>power1.out</C> over 0.41 s and closes with <C>power1.in</C> over 0.25 s. Arriving things decelerate into place, so your eye can land on them; leaving things
                    accelerate away, and faster, because nobody wants to wait for something to disappear.
                </P>
                <Grid>
                    <Card kicker="Open — arrive" title="power1.out · 0.41 s">
                        Fast start, soft landing. The panel is readable as soon as it stops.
                    </Card>
                    <Card kicker="Close — leave" title="power1.in · 0.25 s" accent="var(--ll-warn)">
                        Slow start, fast exit, ~40% shorter. It gets out of the way.
                    </Card>
                </Grid>
                <KeyIdea>Entrances ease out and take their time; exits ease in and are quicker.</KeyIdea>
            </Section>

            <Section id="compare" n="1.6" title="How close is close enough?">
                <P>
                    The clone was checked by replaying the same scroll and cursor path with a headless browser, recording it, and comparing it to the reference frame by frame with{' '}
                    <Term k="ssim">SSIM</Term>. Key moments land within about one frame. The similarity score (0.65 on key frames) is capped by the placeholder 3D renders — the structure and timing
                    match; the photos can’t.
                </P>
                <Table
                    head={['Check', 'Result']}
                    rows={[
                        ['Key-frame timing', 'within ~1 frame (33 ms)'],
                        ['SSIM, 54 key frames', '0.653'],
                        ['SSIM, full 3 669-frame video', '0.588 (0.94 on the preloader, 0.44 on the helmets photo)'],
                        ['Smooth scroll decay', '×0.55 per 0.1 s → lerp 0.1 (next chapter)'],
                    ]}
                    mono={[1]}
                />
                <Where
                    files={[
                        { path: '.clone-analysis/SPEC.md', note: 'timeline + animation catalogue' },
                        { path: '.clone-analysis/four_growth.json', note: '“4” growth per frame' },
                        { path: 'motion-kit/BlockReveal.tsx' },
                        { path: 'shell/Overlay.tsx' },
                        { path: 'shell/Menu.tsx' },
                    ]}
                />
            </Section>
        </article>
    );
}

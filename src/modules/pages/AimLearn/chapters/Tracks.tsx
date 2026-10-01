'use client';

import SmoothingLab from '../demos/SmoothingLab';
import TrackXRay from '../demos/TrackXRay';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function TracksChapter() {
    return (
        <article>
            <ChapterHead
                n="03"
                kicker="Scroll tracks"
                title="Scroll is the playhead, and every track is linear."
                lead={
                    <>
                        The logo that falls apart as you scroll isn’t a video and isn’t a time-based animation. It is a vector animation file whose playhead you drag with the scroll bar, plus two
                        numbers (scale and opacity) read from lists of <Term k="keyframe">keyframes</Term>. This chapter is the whole mechanism.
                    </>
                }
            />

            <Section id="tracks" n="3.1" title="A track is a list of keyframes">
                <P>
                    A <Term k="track">track</Term> says: “at 10% of the scroll the value is 37, at 17% it is 61, at 22% it is 99”. Before the first keyframe and after the last, the value simply holds.
                    Ask the track “what is the value at 14%?” and it fills in the answer between the neighbours. That one function, <C>sample(keys, progress)</C>, is the engine.
                </P>
                <TrackXRay />
                <TryThis
                    items={[
                        <>
                            Press the 22% button: the logo has just finished falling into three pillars. Press 35%: it has zoomed ×4 and faded out. Between 23% and 34% nothing changes: the “hold” that
                            keeps the black screen on show.
                        </>,
                        <>Look at the opacity row: the logo is fully visible until 34%, then fully gone by 35%. A one-percent fade is a cut with a hint of softness.</>,
                        <>
                            Set “ease on the first key” to out-cubic: all three rows bend. Now set “ease on later keys” to anything: nothing changes. That is the engine’s rule, and the reason this
                            page’s tracks are all linear.
                        </>,
                    ]}
                />
                <Code
                    file="src/modules/pages/AimObys/scenes.ts"
                    lang="ts"
                    highlight={['LOGO_FRAME', '[22, 99]', '[19, 1]', '[23, 4]']}
                >{`// whole-page progress, 0–100. Values hold before the first key and after the last.
export const LOGO_FRAME: Key[] = [[0, 0], [10, 37], [17, 61], [22, 99], [100, 99]]   // Lottie frame, % of the file
export const LOGO_TRACKS = {
    scale:   [[19, 1], [23, 4]],      // zooms ×4 into a black screen
    opacity: [[34, 1], [35, 0]],      // then disappears
}`}</Code>
                <Table
                    head={['Moment', 'Page progress', 'Scroll at 1920×994', 'What you see']}
                    rows={[
                        ['Falling starts', '0%', '0px', 'The logo cracks apart as soon as you scroll'],
                        ['Pillars', '22%', '3 253px', 'The last frame: three tall pillars'],
                        ['Zoom begins / ends', '19% → 23%', '2 810 → 3 401px', 'Scale 1 → ×4 into black'],
                        ['Gone', '34% → 35%', '5 028 → 5 176px', 'A one-percent fade to nothing'],
                    ]}
                    mono={[1, 2]}
                />
                <Lens>Exactly an After Effects layer with keyframes on “Time Remap”, Scale and Opacity, except the timeline’s x axis is scroll distance instead of seconds.</Lens>
                <KeyIdea>A track is a list of [position, value] keyframes. sample() fills in between; before the first and after the last it holds.</KeyIdea>
            </Section>

            <Section id="linear" n="3.2" title="Linear on purpose">
                <P>
                    The page’s interaction system lets you put a curve on keyframes, and the original designers did (in the data, almost every key carries one). But the engine only reads a curve from
                    a track’s <strong>first</strong> keyframe, and uses it for every segment. Curves set on later keys do nothing. The clone found this out by comparing against the original: so every
                    scrubbed track in the clone is linear.
                </P>
                <Callout tone="tip" title="This is the right default anyway">
                    When scroll is the playhead, the scroll position, the wheel and the smoothing already shape the motion. A curve on top finishes each move early and leaves a stretch of dead scroll.
                    Curves belong on <em>timed</em> animations (the hero lines, the overlays), not on scrubbed ones.
                </Callout>
                <KeyIdea>For scroll-linked motion use no curve. Save your easing curves for animations that run on a clock.</KeyIdea>
            </Section>

            <Section id="smoothing" n="3.3" title="Smoothing: the playhead chases the scroll">
                <P>
                    If the animation jumped to the exact scroll position every frame, a mouse wheel (which scrolls in steps) would make it stutter. So the playhead <em>chases</em> the target: each
                    frame it closes a fixed share of the gap. The page uses smoothing <strong>70</strong>, meaning 30% per 60Hz frame, so about 10 frames (a sixth of a second) to settle 97% of the
                    way.
                </P>
                <SmoothingLab />
                <TryThis
                    items={[
                        <>Set smoothing to 0: the orange line follows the black exactly, no glide. Set it to 95: it takes over a second to arrive and feels disconnected from your hand.</>,
                        <>Switch between 30, 60 and 120 fps with smoothing 70. The orange line doesn’t move; the blue one does. A naive “30% per frame” is twice as fast on a 120Hz screen.</>,
                    ]}
                />
                <Code file="src/modules/pages/AimObys/lib/ix.ts" lang="ts" highlight={['** frames']}>{`// move toward the target; \`frames\` = how many 60Hz frames this tick represents
export function smooth(current: number, target: number, smoothing: number, frames = 1) {
    const keep = (1 - Math.max(1 - smoothing / 100, 0.01)) ** frames   // 0.7 per frame at smoothing 70
    return target + (current - target) * keep
}`}</Code>
                <KeyIdea>Smoothing closes a share of the gap each frame. Raise the share to the power of elapsed 60Hz frames so the glide lasts the same time on every screen.</KeyIdea>
            </Section>

            <Section id="lottie" n="3.4" title="Scrubbing a vector animation file">
                <P>
                    The falling logo is a <Term k="lottie">Lottie</Term> file: a handful of black blocks keyframed in After Effects. The page never plays it. It sets it to a frame, using the track
                    above: <C>frame = totalFrames × value / 100</C>, sub-frames included, so the animation moves smoothly between frames. Because the frame comes from a track, you can bend time: the
                    whole fall happens in the first 22% of the scroll, then the file rests on its last frame.
                </P>
                <Code
                    file="src/modules/pages/AimObys/AimObysPage.tsx"
                    lang="ts"
                    highlight={['sample(LOGO_FRAME', 'applyTracks']}
                >{`aimP = smoothed(aimP, elementProgress(el))             // 0..1 of the page, smoothed
const frame = sample(LOGO_FRAME, aimP * 100)            // 0..99 (% of the file)
setLottieProgress(logo.current, frame)                  // anim.goToAndStop(totalFrames * frame / 100, true)
applyTracks(logoInner, LOGO_TRACKS, aimP * 100)         // scale and opacity on the wrapper`}</Code>
                <Callout tone="tip" title="Phones get a different set of tracks">
                    On a phone the logo only half breaks apart (frame 0 → 32%), zooms ×1.6, drifts down 15em, then flies up and out. Same engine, different keyframe lists, switched by a media query
                    that the ticker reads live, so rotating a tablet mid-scroll works.
                </Callout>
                <Where
                    files={[
                        { path: 'AimObys/scenes.ts', note: 'LOGO_* and PHONE_LOGO_* tracks' },
                        { path: 'AimObys/lib/ix.ts', note: 'sample, applyTracks, smooth' },
                        { path: 'AimObys/lib/useLottie.ts', note: 'setLottieProgress' },
                        { path: 'AimObys/lottie/scroll.json', note: 'the Lottie file' },
                    ]}
                />
            </Section>
        </article>
    );
}

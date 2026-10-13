'use client';
import Chapter, { type Lesson } from '../Chapter';
import Demo from '../demos/ClockDemo';
const lesson: Lesson = {
    idea: 'When a wheel gesture stops, the page finishes a small, controlled glide. Lenis keeps the browser’s scroll position as the source of truth while smoothing the journey toward the latest target. GSAP supplies its time, and ScrollTrigger reads the updated position.',
    lens: 'The target is your keyframe. The visible position is a follower that keeps closing the gap. A lighter follower catches up quickly; a heavier one takes longer. This is timing, not a different destination.',
    term: 'damping',
    steps: [
        'Create one Lenis instance with autoRaf disabled. The source uses lerp 0.085, smoothWheel true, and syncTouch false.',
        'Feed GSAP’s time into lenis.raf. Multiply seconds by 1000 because Lenis expects milliseconds.',
        'Forward Lenis scroll events to ScrollTrigger.update, and remove both the ticker callback and the Lenis instance on cleanup.',
    ],
    fragile:
        'Double clocks create confusing timing bugs. Do not run autoRaf and your own GSAP ticker together. Avoid smoothing an already smoothed progress value again unless that delay is intentional.',
    ship: 'The guide inherits the source’s Lenis instance, so it never creates a second document scroller. In the lab, the damped follower uses the same 0.085 default; touch and reduced-motion reading remain direct. The official integration also documents lag-smoothing considerations for projects with a dedicated GSAP clock.',
    remember: [
        'One shared clock keeps scroll and animation in the same moment.',
        'Smoothing changes how you arrive, not where you arrive.',
        'Respect the time units at each library boundary.',
        'Keep native scrolling available and turn smoothing off for reduced motion.',
    ],
    code: "const lenis = new Lenis({\n    lerp: 0.085, smoothWheel: true,\n    syncTouch: false, autoRaf: false, anchors: false,\n});\nlenis.on('scroll', ScrollTrigger.update);\nconst tick = (time: number) => lenis.raf(time * 1000);\ngsap.ticker.add(tick);",
    file: 'Shell.tsx',
    lines: [3, 5, 6],
    sources: ['Shell.tsx', 'motion.ts'],
    docs: [
        {
            label: 'Lenis: GSAP integration',
            href: 'https://github.com/darkroomengineering/lenis#gsap-scrolltrigger',
        },
    ],
};
export default function ClockChapter() {
    return (
        <>
            <Chapter id="clock" lesson={lesson}>
                <Demo />
            </Chapter>
        </>
    );
}

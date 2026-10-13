'use client';
import Chapter, { type Lesson } from '../Chapter';
import Demo from '../demos/BuildDemo';
import Quiz from '../Quiz';
const lesson: Lesson = {
    idea: 'A convincing experience starts as a sequence of decisions, not a list of effects. Decide what the visitor sees, what stays still, what changes with scroll, and how each scene ends. Then turn that storyboard into explicit ranges and controls.',
    lens: 'Write the motion version of a component specification. Your storyboard is the design file; the progress ranges are its keyframes; the dials are the properties a developer can expose for tuning.',
    term: 'progress',
    steps: [
        'Collect reference moments at a known viewport. Build a table of inputs, layers, start/end values, timing, holds, and reverse behavior.',
        'Ship the static page and accessible controls first. Add one scene at a time, with one owner per property and a fallback for every important visual.',
        'Compare matching moments, test fast input and scroll reversal, then measure complete journeys. Tune the largest mismatch before polishing tiny details.',
    ],
    fragile:
        'Adding more motion does not fix weak composition. A polished demo can still fail when fonts load, routes change, focus moves, or the visitor requests reduced motion. Include those conditions in the storyboard.',
    ship: 'The generator produces a small starter specification and a GSAP scroll timeline you can copy. It is a starting point for your own content, not a replacement for measurement. Finish with the pooled recall quiz; missed answers link back to their chapters.',
    remember: [
        'Specify the relationship between input and result before choosing an effect.',
        'A useful motion plan contains numbers another person can test.',
        'Build static, wire behavior, add motion, compare, and measure.',
        'You understand an effect when you can change it without breaking its intent.',
    ],
    code: "gsap.registerPlugin(ScrollTrigger, CustomEase);\nCustomEase.create('floema-out', '0.22,1,0.36,1');\nexport const clamp = (n: number, a = 0, b = 1) =>\n    Math.min(b, Math.max(a, n));",
    file: 'motion.ts',
    lines: [2, 3, 4],
    sources: ['motion.ts', 'README.md', 'Home.tsx', 'Sustainability.tsx'],
    docs: [
        {
            label: 'GSAP reference',
            href: 'https://gsap.com/docs/v3/',
        },
        {
            label: 'Three.js manual',
            href: 'https://threejs.org/manual/',
        },
    ],
};
export default function BuildChapter() {
    return (
        <>
            <Chapter id="build" lesson={lesson}>
                <Demo />
            </Chapter>
            <Quiz />
        </>
    );
}

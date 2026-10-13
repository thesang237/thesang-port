'use client';
import Chapter, { type Lesson } from '../Chapter';
import Demo from '../demos/ScenesDemo';
const lesson: Lesson = {
    idea: 'The collection sequence holds a full-screen stage while the document continues moving. Each new picture grows into view from the bottom, because its visible container is changing. The photograph itself moves only a little, creating depth without losing its place.',
    lens: 'The scroll bar is the playhead of a five-shot composition. Each mask is an animated crop in After Effects. The image underneath has a second, much smaller position track.',
    term: 'scrub',
    steps: [
        'Give the track 900vh and the sticky stage one viewport of height. That leaves eight viewports of useful travel.',
        'Normalize the traveled distance to 0–1. The source starts each new mask at (i − 0.6) / 4 and reveals it over 0.15 timeline units.',
        'Keep image panels anchored. Animate their clip-path and give the inner image 20% overscan so its 4% parallax cannot expose a seam.',
    ],
    fragile:
        'Parent movement and inner movement are easy to confuse. Moving the entire photo at the reveal speed makes it look like a sliding card. A mask must also rewind correctly when the visitor scrolls upward.',
    ship: 'The lab uses a real nested scroll container and ScrollTrigger; its progress dial scrolls that container. The source’s captions change only at collection boundaries. Refresh trigger measurements after fonts, assets, and layout sizes settle.',
    remember: [
        'A tall track gives time; a sticky stage gives the composition somewhere to stay.',
        'The mask moves far while the picture moves a little.',
        'Linear scrubbed tracks keep scroll distance predictable.',
        'Measure boundaries again whenever the layout changes.',
    ],
    code: "timeline.fromTo(image,\n    { clipPath: 'inset(100% 0% 0% 0%)' },\n    { clipPath: 'inset(0% 0% 0% 0%)',\n      duration: 0.15, ease: 'none' },\n    (i - 0.6) / 4,\n);",
    file: 'Home.tsx',
    lines: [2, 3, 5],
    sources: ['Home.tsx', 'styles.css'],
    docs: [
        {
            label: 'GSAP: ScrollTrigger',
            href: 'https://gsap.com/docs/v3/Plugins/ScrollTrigger/',
        },
    ],
};
export default function ScenesChapter() {
    return (
        <>
            <Chapter id="scenes" lesson={lesson}>
                <Demo />
            </Chapter>
        </>
    );
}

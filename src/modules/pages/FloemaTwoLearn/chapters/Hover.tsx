'use client';
import Chapter, { type Lesson } from '../Chapter';
import Demo from '../demos/HoverDemo';
const lesson: Lesson = {
    idea: 'The navigation feels connected because a small SVG surface stretches between real HTML controls. The revised interaction keeps the first piece anchored and pushes later pieces right. In the collection index, a narrow preview grows sideways while images cycle inside it.',
    lens: 'Imagine a row of Figma components with flexible connectors between them. The labels keep their shape; the connector absorbs the stretch. The collection preview is a frame with fixed height and changing width.',
    term: 'ref',
    steps: [
        'Measure each control once and on resize. Draw the rounded pills and curved necks in one SVG; keep the native buttons and links above it.',
        'Animate only the gaps beside the hovered item. Sum the preceding gaps to push later pieces right. Use overwrite so rapid pointer changes never queue.',
        'For previews, animate the small box from 5vw to 25vw at a fixed 14.5vw height. Cycle six images every 850ms only while the row is active and visible.',
    ],
    fragile:
        'Rightward expansion needs breathing room before the language control. Measuring inside every pointer event can also create layout work. The source caches dimensions and reserves enough header space for two opened necks.',
    ship: 'The live pill lab is a teaching copy, with adjustable separation and duration. The preview lab demonstrates the explicitly requested width animation on a small contained element; do not generalize that choice to large page layouts. Focus gets equivalent feedback and reduced motion stops cycling.',
    remember: [
        'Animate the connection while keeping the label readable.',
        'Anchor the first piece and add each preceding gap to move right.',
        'Interrupt hover motion instead of replaying old intentions.',
        'Expressive interaction still needs focus support, cleanup, and space to expand.',
    ],
    code: 'shifts[i] = items.slice(0, i).reduce(\n    (sum, _, j) => sum + gaps[`gap${j}`], 0,\n);\nitems[i].style.transform = `translateX(${shifts[i]}px)`;',
    file: 'ConnectedPills.tsx',
    lines: [1, 2, 4],
    sources: ['ConnectedPills.tsx', 'Home.tsx', 'Shared.tsx', 'styles.css'],
};
export default function HoverChapter() {
    return (
        <>
            <Chapter id="hover" lesson={lesson}>
                <Demo />
            </Chapter>
        </>
    );
}

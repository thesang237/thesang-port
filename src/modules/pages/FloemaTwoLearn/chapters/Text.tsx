'use client';
import Chapter, { type Lesson } from '../Chapter';
import Demo from '../demos/TextDemo';
const lesson: Lesson = {
    idea: 'Content feels composed when its pieces do not arrive at exactly the same instant. On the collection slides, the category badge comes first, then the headline, then the action. Their short offsets imply a reading order without making the interface wait.',
    lens: 'In a Figma prototype, these are staggered component entrances. In After Effects, they are three layers with slightly offset in-points and the same position and opacity curves.',
    term: 'progress',
    steps: [
        'Start with real, readable DOM text. The general reveal travels 18px and lasts 700ms with cubic-bezier(0.22, 1, 0.36, 1).',
        'Offset the collection badge by 60ms, the headline by 140ms, and the CTA by 240ms. Keep the whole group feeling like a single event.',
        'When a collection changes, key the content by its slug so its entrance starts cleanly. For reduced motion, remove travel and delay.',
    ],
    fragile:
        'If you split a sentence into letters, preserve a single accessible reading copy and wait for fonts before measuring lines. This source mostly reveals complete blocks, so it avoids that complexity.',
    ship: 'Replay must interrupt the previous animation instead of queuing another one. The lab uses the source’s real smooth-out ease and explicit source delays by default. The stagger dial adds or removes the separation without altering the final layout.',
    remember: [
        'The reading order should be visible in the entrance order.',
        'A small offset can create hierarchy without a dramatic effect.',
        'One curve and short travel make a group feel coherent.',
        'Readable text and immediate actions matter more than the reveal.',
    ],
    code: '.f2-collection-description > * {\n    animation: f2-fade-up 0.7s var(--f2-ease) both;\n}\n/* Badge, headline, action */\n/* animation-delay: 0.06s / 0.14s / 0.24s */',
    file: 'styles.css',
    lines: [2, 5],
    sources: ['Home.tsx', 'Shell.tsx', 'motion.ts', 'styles.css'],
};
export default function TextChapter() {
    return (
        <>
            <Chapter id="text" lesson={lesson}>
                <Demo />
            </Chapter>
        </>
    );
}

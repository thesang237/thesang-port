'use client';
import Chapter, { type Lesson } from '../Chapter';
import Demo from '../demos/TransitionsDemo';
const lesson: Lesson = {
    idea: 'Clicking a page link starts a short departure. Navigation happens when the old content is faded out; the new content then arrives. The persistent navigation holds its place, giving the visitor a stable reference.',
    lens: 'In an edit, the cut happens between shots, not while both are still competing. The persistent header is the frame around the film; only the content inside it changes.',
    term: 'DOM',
    steps: [
        'Intercept ordinary internal clicks while preserving modified clicks that open a new tab. Record the latest destination and stop smooth scrolling.',
        'Fade the old route out over 240ms, then ask the router to navigate. Do not navigate at the start of the exit.',
        'Reset scroll, fade in over 560ms, resume the scroller, and focus the new heading. Keep the content wrapper free of transforms.',
    ],
    fragile:
        'A transform on the route wrapper changes how fixed descendants are positioned. An opacity-only transition avoids the canvas-sizing bug found during this build. Rapid clicks should update the pending destination without starting overlapping exits.',
    ship: 'The lab is a controlled simulation: it never navigates you away from the guide. Reduced motion shortens the fades and removes travel. The source also handles Back navigation, restores dialog focus, and runs its initial loader once per session.',
    remember: [
        'Exit, navigate, enter: each phase has one clear responsibility.',
        'The route changes at the invisible seam between the two fades.',
        'Keep the persistent frame stable while the content changes.',
        'A transition is complete only when scrolling and focus work again.',
    ],
    code: "transition.current = gsap.timeline().to(content.current, {\n    opacity: 0,\n    duration: reduced ? 0.1 : motion.exit,\n    ease: 'power1.in',\n    onComplete: () => {\n        router.push(pending.current!, { scroll: false });\n    },\n});",
    file: 'Shell.tsx',
    lines: [2, 3, 6],
    sources: ['Shell.tsx', 'motion.ts', 'SceneLoader.tsx'],
};
export default function TransitionsChapter() {
    return (
        <>
            <Chapter id="transitions" lesson={lesson}>
                <Demo />
            </Chapter>
        </>
    );
}

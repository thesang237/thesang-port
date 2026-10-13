'use client';
import Chapter, { type Lesson } from '../Chapter';
import Demo from '../demos/MapDemo';
const lesson: Lesson = {
    idea: 'The page feels like one continuous composition, but its text, images, controls, and 3D objects have separate jobs. A tall document supplies the distance. Scroll and pointer input become numbers. HTML, CSS, GSAP, and Three.js each render the part they are best at.',
    lens: 'Think of an After Effects composition with editable Figma layers on top. The canvas is the filmed scene; headings and buttons are the interface. A single set of control values keeps them in agreement.',
    term: 'DOM',
    steps: [
        'Study the recording at its original viewport. Mark the grid, each scene’s start and end, and what stays still. The source uses a 42px gutter at 1920px.',
        'Build the semantic page in its final reading order. Give every image an aspect ratio and every interactive element a real button or link.',
        'Add a mutable dials object between input and rendering. Assign one owner to each animated property before adding fine motion.',
    ],
    fragile:
        'The layers can look correct in isolation and still disagree when combined. A transformed ancestor can change a fixed canvas’s coordinate system; a late-loading font can change scroll distances.',
    ship: 'The source uses one R3F canvas per page and a persistent shell for navigation and smooth scrolling. This guide reuses that shell’s clock and pure motion helpers, while its labs are deliberately small teaching copies with neutral diagrams.',
    remember: [
        'Separate the layers by responsibility, then connect them with shared numbers.',
        'A layer stack explains what is moving and what must stay anchored.',
        'Get the static composition right before choreographing it.',
        'A good architecture makes the fallback a simpler version of the same story.',
    ],
    code: 'export const createDials = (): SceneDials => ({\n    progress: 0, scrollVelocity: 0, chargerMatch: 0,\n    cubeOffset: 0, material: 0,\n    pointerX: 0, pointerY: 0,\n    dragX: 0, dragY: 0, dragging: false,\n});',
    file: 'motion.ts',
    lines: [2, 3],
    sources: ['Shell.tsx', 'Home.tsx', 'Sustainability.tsx', 'Scene.tsx', 'motion.ts', 'styles.css'],
};
export default function MapChapter() {
    return (
        <>
            <Chapter id="map" lesson={lesson}>
                <Demo />
            </Chapter>
        </>
    );
}

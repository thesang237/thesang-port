'use client';
import Chapter, { type Lesson } from '../Chapter';
import Demo from '../demos/InteractionDemo';
const lesson: Lesson = {
    idea: 'The seasonal comparison looks custom, but a native range input controls its value. Hotspot labels respond to hover, focus, and click. The visible treatment can be expressive because the behavior underneath remains familiar.',
    lens: 'Create one component state, then connect several triggers to it. Mouse hover, keyboard focus, and a tap should lead to the same useful information rather than different versions of the interface.',
    term: 'DOM',
    steps: [
        'Keep a single split value for the comparison. Move the crop and counter-move its inner picture so both landscapes stay aligned.',
        'Label the range input and expose its value in words. Arrow keys should change the split without a custom gesture system.',
        'Use real buttons for hotspots. Reflect their open state with aria-expanded, and make the same information available on focus and click.',
    ],
    fragile:
        'Hover-only content disappears on touch devices and is unreachable by keyboard. A dialog that closes visually but leaves scrolling locked is also broken; focus and cleanup belong to the interaction, not to an optional polish pass.',
    ship: 'The two labs below use neutral drawings and native inputs. Try them without a mouse. In the source, search is local, dialogs restore focus and close with Escape, and the newsletter explicitly says that its confirmation is stored only in the browser.',
    remember: [
        'One state can serve several input methods.',
        'Use native controls for their behavior, then design their appearance.',
        'The keyboard path should reach the same result as the pointer path.',
        'Include cleanup and focus restoration in the interaction specification.',
    ],
    code: '<div style={{ transform: `translateX(${split - 100}%)` }}>\n    <img style={{ transform: `translateX(${100 - split}%)` }} />\n</div>\n<input type="range" min="0" max="100" value={split}\n    onChange={(event) => setSplit(Number(event.target.value))} />',
    file: 'Sustainability.tsx',
    lines: [1, 2, 5],
    sources: ['Sustainability.tsx', 'Shell.tsx', 'Shared.tsx'],
};
export default function InteractionChapter() {
    return (
        <>
            <Chapter id="interaction" lesson={lesson}>
                <Demo />
            </Chapter>
        </>
    );
}

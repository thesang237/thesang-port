'use client';
import Chapter, { type Lesson } from '../Chapter';
import Demo from '../demos/HandoffDemo';
const lesson: Lesson = {
    idea: 'A line drawing becomes a photographed object without changing its apparent place. The wireframe first grows and turns into a front view. Then a fixed photograph is uncovered by a mask, with both layers sharing the same outer edges.',
    lens: 'Think of a match cut. Put two shots on top of one another, align their silhouettes, and wipe between them. The transition succeeds before you animate the wipe: it succeeds in the alignment.',
    term: 'orthographic',
    steps: [
        'Read the real model’s bounding box and the photograph’s aspect ratio. The source photo is 1064:1689, centered, 90vh tall, with its top at 10vh.',
        'Convert that photo width into the model’s scale. Align top and center in the orthographic camera, and finish its turn before the seam arrives.',
        'Overlap the photo track with the last green viewport. Reveal the photo with clip-path while both layers remain fixed in screen space.',
    ],
    fragile:
        'An apparently tiny scale error becomes obvious along the seam. Compare the same scroll position and viewport, and switch off pointer influence during the final alignment. The real photo includes a few pixels of edge padding.',
    ship: 'The neutral lab demonstrates the same alignment problem with a simplified station silhouette. Turn on the ghost overlay to inspect both versions simultaneously. The source computes width from the real model bounds rather than tuning an unrelated scale by eye.',
    remember: [
        'A convincing handoff is an alignment problem before it is an animation problem.',
        'One silhouette exposes both scale and position errors.',
        'Complete the camera alignment before uncovering the photograph.',
        'Use shared measurements instead of independent magic numbers.',
    ],
    code: 'const photoWidth = viewport.height * 0.9 * (1064 / 1689);\nconst matchedHeight = (photoWidth / model.frontWidth) * model.height;\nmodel.root.scale.setScalar(h / model.height);\nmodel.root.position.y = THREE.MathUtils.lerp(\n    storyY, viewport.height * 0.4 - matchedHeight / 2, match,\n);',
    file: 'Scene.tsx',
    lines: [1, 2, 5],
    sources: ['Scene.tsx', 'Sustainability.tsx', 'styles.css'],
};
export default function HandoffChapter() {
    return (
        <>
            <Chapter id="handoff" lesson={lesson}>
                <Demo />
            </Chapter>
        </>
    );
}

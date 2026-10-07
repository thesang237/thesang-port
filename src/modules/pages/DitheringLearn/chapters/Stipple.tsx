'use client';
import type { Lesson } from '../content/types';
import { LessonView } from '../kit/ui';
const lesson: Lesson = {
    id: 'stipple',
    lead: 'A repeatable random threshold turns a smooth shape into a cloud of ink. The seed changes the arrangement without changing the subject.',
    idea: 'Ordered screens reveal their repeating tile. Stipple trades that visible repetition for a grainy field of independent marks. At a given brightness, more or fewer cells survive. If those random numbers change every frame, the ink crawls; if they depend only on cell position and a seed, the image holds still.',
    lens: 'Think of a dissolve mask with its evolution frozen. The seed is the chosen mask arrangement, not an animation timer. A new seed gives another print from the same plate.',
    mechanism:
        'cellHash folds the integer cell coordinate and a seed into a repeatable number between 0 and 1. The brightness is compared with that number. No time value enters this function. This is white-noise thresholding; it is not blue-noise sampling or error diffusion, so local clumps are an expected part of its texture.',
    code: 'float cellHash(vec2 p, float seed) {\n    return fract(sin(dot(p, vec2(127.1, 311.7)) + seed * 17.17) * 43758.5453);\n}\n// In printThreshold:\nif (pattern < 3.5) return cellHash(floor(p), seed);',
    file: 'src/modules/pages/Dithering/dithering-shader/patterns.glsl.ts',
    highlight: ['floor(p)', 'seed *'],
    lab: {
        title: 'Ink dust over a landscape',
        hint: 'Change the seed, then change the cell size. Notice which changes the composition.',
        subject: 2,
        settings: {
            pattern: 3,
            cellSize: 2,
            ink: '#25352e',
            paper: '#e9e6cc',
            colorMode: 1,
            contrast: 1.3,
        },
        dials: ['seed', 'cellSize', 'threshold', 'softness'],
    },
    tries: [
        'Change only the seed: the landscape stays in place while the dust rearranges.',
        'Raise Cell size to 20. The delicate dust turns into a field of chunky independent decisions.',
        'Set Tone bias to −0.5. Ink fills the image; randomness alone does not guarantee a balanced composition.',
    ],
    application:
        'Make a weather map without drawing literal clouds: a slow landscape field plus small stable stipple can feel like mist, erosion or aerial dust. Hold the seed across a series for continuity. Change it only when you want the texture itself to become a different edition.',
    remembers: [
        'A seed changes the texture arrangement, not the source composition.',
        'Position plus seed produces stable randomness.',
        'Density still depends on tone, even when the arrangement is random.',
        'Frozen randomness is a material; animated randomness is an event.',
    ],
    sources: ['dithering-shader/patterns.glsl.ts', 'settings.ts'],
};
export default function Chapter() {
    return <LessonView lesson={lesson} />;
}

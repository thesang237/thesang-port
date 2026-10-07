'use client';
import type { Lesson } from '../content/types';
import { LessonView } from '../kit/ui';
const lesson: Lesson = {
    id: 'ordered',
    lead: 'A repeating tile of thresholds can imitate a continuous shadow with only ink and paper. The size of the tile and the size of each mark are different decisions.',
    idea: 'From a distance you see gray. Up close you see a regular arrangement of dark and light cells. A Bayer matrix orders which positions become light first as brightness rises. A 4 × 4 matrix gives sixteen threshold positions; an 8 × 8 gives sixty-four.',
    lens: 'Imagine a tiny component repeated across a Figma artboard. Every copy has the same sixteen cells. Instead of adjusting opacity, you switch on more cells inside the component to suggest a lighter tone.',
    mechanism:
        'The inspector below imports bayerThreshold from the studio. The shader builds the same ranks from coordinate bits rather than a nested lookup table. The half-step offset avoids thresholds exactly at 0 and 1. Cell size changes the printed screen; Sample size groups the source image into blocks. Large samples lose detail even if the screen stays fine.',
    code: 'vec2 pair = mod(p, 2.0);\nfloat digit = 2.0 * mod(pair.x + pair.y, 2.0) + pair.y;\nrank = rank * 4.0 + digit;\np = floor(p / 2.0);',
    file: 'src/modules/pages/Dithering/dithering-shader/patterns.glsl.ts',
    highlight: ['rank ='],
    lab: {
        title: 'The screen and the source are different grids',
        hint: 'Compare matrix sizes at the same Cell size. Then raise Sample size.',
        subject: 0,
        dials: ['cellSize', 'pixelSize', 'levels'],
        patterns: [0, 1, 2],
    },
    tries: [
        'Use 2 × 2 and Cell size 16: the repeating structure becomes intentionally brutal.',
        'Switch to 8 × 8 without changing Cell size. The full repeating tile becomes larger, even though each mark stays the same size.',
        'Set Sample size to 24, then return it to 1. Watch source detail change independently of the print grid.',
    ],
    application:
        'Use an ordered screen where repetition is part of the concept: a game-like interface, a computational poster or a machine-made landscape. Avoid confusing a finer threshold hierarchy with a smaller mark. A tiny 2 × 2 screen can feel subtler than a huge 8 × 8 screen.',
    remembers: [
        'Gray can be a spatial mixture of ink and paper.',
        'A Bayer rank controls when a cell turns light.',
        'Cell size describes marks; Sample size describes the input image.',
        'Choose repetition deliberately, rather than treating it as a defect.',
    ],
    sources: ['dithering-shader/patterns.glsl.ts', 'math.ts', 'dithering-shader/DitheringShader.ts'],
};
export default function Chapter() {
    return <LessonView lesson={lesson} />;
}

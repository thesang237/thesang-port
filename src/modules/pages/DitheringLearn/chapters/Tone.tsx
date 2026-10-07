'use client';
import type { Lesson } from '../content/types';
import { LessonView } from '../kit/ui';
const lesson: Lesson = {
    id: 'tone',
    lead: 'Before choosing a mark, decide how much ink the image needs. A correct brightness measurement keeps colour from flattening into one clipped value.',
    idea: 'A green light feels brighter than a blue light with the same RGB channel value. Treating them identically loses information. The original shader added red, green and blue; even midgray could exceed 1. The refactored version uses a weighted brightness value, then maps that value into marks.',
    lens: 'This is the Curves or Levels stage of a print workflow. Exposure moves the whole image. Contrast pushes away from middle gray. Midtone lift bends the curve while keeping the endpoints. Work on the tonal hierarchy before you choose the paper.',
    mechanism:
        'The shader multiplies RGB by 2 raised to Exposure, applies contrast around 0.5, then a power curve and bias. Weighted luminance uses 0.2126 red, 0.7152 green and 0.0722 blue. These coefficients are used on the linear RGB passed between render targets. The print threshold rounds the shaped brightness into a small number of levels.',
    code: 'color *= exp2(exposure);\ncolor = (color - 0.5) * contrast + 0.5;\nreturn clamp(pow(max(color, vec3(0.0)), vec3(1.0 / gamma)) + threshold, 0.0, 1.0);',
    file: 'src/modules/pages/Dithering/dithering-shader/DitheringShader.ts',
    highlight: ['exp2', 'pow'],
    lab: {
        title: 'The tone before the ink',
        hint: 'Start with Exposure. Use the colour field to see why channel weights matter.',
        subject: 4,
        dials: ['exposure', 'contrast', 'gamma', 'threshold', 'levels'],
    },
    tries: [
        'Turn Contrast to 0. Every position now has the same tone, so the screen carries all visible structure.',
        'Set Exposure to +3. Observe the clipped region; a print cannot restore detail already lost to white.',
        'Reset, then raise Midtone lift while holding the black and white endpoints in view.',
    ],
    application:
        'For a quiet atmospheric landscape, use fewer deep blacks and lift midtones. For a graphic poster, push contrast until the shape reads at thumbnail size. A coloured subject may need a different tone recipe from a neutral one, even when the pattern stays the same.',
    remembers: [
        'Brightness must preserve differences between colours.',
        'Shape the source tone before measuring the coverage.',
        'A threshold screen cannot recover clipped input detail.',
        'Tone establishes the composition; texture expresses it.',
    ],
    sources: ['dithering-shader/DitheringShader.ts', 'settings.ts'],
};
export default function Chapter() {
    return <LessonView lesson={lesson} />;
}

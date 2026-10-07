'use client';
import type { Lesson } from '../content/types';
import { LessonView } from '../kit/ui';
const lesson: Lesson = {
    id: 'build',
    lead: 'Start with a subject, choose the marks that support it, then shape the ink and paper. Finish with one material cue and a recipe you can explain.',
    idea: 'A good generative print is a small set of related decisions. Decide what the image should feel like before adjusting all the dials. An orderly screen suggests a machine. A stable stipple suggests dust. A woven screen suggests construction. The same source field can become any of them.',
    lens: 'Write a one-sentence art direction, as you would for a moodboard. Then choose the source, the mark vocabulary, the tonal hierarchy and the material. Each technical parameter should serve one of those choices.',
    mechanism:
        'The recipe below exports a complete DitherSettings object. Use it as new DitheringEffect(recipe), or put it in PRINT_PRESETS for the studio. The procedural subject settings belong to this teaching lab and are not part of the print recipe. To invent a new screen, add a threshold function and pattern ID, then test black, white and a smooth ramp before a complex scene.',
    code: 'const print = new DitheringEffect();\n// Reuse the effect when a recipe changes:\nprint.setSettings(dither);',
    file: 'src/modules/pages/Dithering/pipeline.ts',
    highlight: ['setSettings'],
    lab: {
        title: 'Compose your own print',
        hint: 'Choose a subject inside Teaching image, choose a screen, then copy the recipe.',
        subject: 3,
        settings: {
            pattern: 7,
            cellSize: 7,
            stretch: 1.4,
            colorMode: 1,
            ink: '#30294e',
            paper: '#d1d6bb',
        },
        dials: ['cellSize', 'angle', 'stretch', 'exposure', 'levels', 'grain'],
        patterns: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        palette: true,
        recipe: true,
    },
    tries: [
        'Brief: “a lunar atlas engraved in copper.” Choose orbital subject, directional marks, warm paper and restrained grain.',
        'Brief: “a woven map of an imaginary river.” Use landscape or ribbons, Woven, a long mark stretch and two contrasting inks.',
        'Break the composition: make the marks too coarse and the palette too close. Restore readability using only two settings.',
    ],
    application:
        'Try three editions with the same scene: ordered, stippled and woven. Write down why each screen suits or fights the subject. Keep the defaults and seed with the exported recipe so another artist can reproduce your decisions. Test on a phone before sharing, then use the recall test below to explain the system without looking at the code.',
    remembers: [
        'Begin with an artistic intent, then choose parameters that support it.',
        'A reusable print recipe is independent of the teaching subject.',
        'Make a small number of deliberate changes you can explain.',
        'You understand an effect when you can predict how it will break.',
    ],
    sources: ['settings.ts', 'dithering-shader/patterns.glsl.ts', 'dithering-shader/DitheringEffect.ts', 'README.md'],
};
export default function Chapter() {
    return <LessonView lesson={lesson} />;
}

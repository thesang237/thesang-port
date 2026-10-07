'use client';
import type { Lesson } from '../content/types';
import { LessonView } from '../kit/ui';
const lesson: Lesson = {
    id: 'palette',
    lead: 'The same coverage can print in any two colours. Separate the decision about where ink goes from the decision about what that ink looks like.',
    idea: 'A black-and-white print becomes a duotone by assigning colours to its dark and light values. The spatial pattern stays the same. More tone levels introduce intermediate blends between the two colours. Source colour takes another path: it quantizes red, green and blue independently.',
    lens: 'This is a gradient map applied after a monochrome texture. The ink and paper are its endpoints. Inverting coverage swaps which parts of the image approach each endpoint, rather than inverting the RGB values of the chosen paints.',
    mechanism:
        'The grayscale mode uses the quantized brightness as all three channels. Ink/paper mode mixes two linear colour uniforms with that brightness. Source colour quantizes each channel against the same screen. Three converts CSS hex colours into linear uniforms, and the composer converts the final output for display; applying another manual gamma correction would change the intended colour.',
    code: 'vec3 printed = vec3(tone);\nif (colorMode > 0.5 && colorMode < 1.5) printed = mix(ink, paper, tone);\nif (colorMode > 1.5) {\n    printed = vec3(quantizeTone(source.r, screen), quantizeTone(source.g, screen), quantizeTone(source.b, screen));\n    if (invert > 0.5) printed = 1.0 - printed;\n}',
    file: 'src/modules/pages/Dithering/dithering-shader/DitheringShader.ts',
    highlight: ['mix(ink, paper, tone)'],
    lab: {
        title: 'A palette is a material decision',
        hint: 'Start in Ink & paper. Change the endpoints, then compare Source colour.',
        subject: 1,
        settings: {
            colorMode: 1,
        },
        dials: ['levels', 'threshold', 'strength'],
        palette: true,
    },
    tries: [
        'Choose two nearly identical colours. The pattern survives mathematically but becomes difficult to see.',
        'Raise Tone levels to 8. The print gains intermediate colours; it is no longer a strictly two-colour result.',
        'Switch to Source colour, then choose Colour field in Teaching image. Compare the independent RGB decisions.',
    ],
    application:
        'Make a small edition with one plate and several papers. Navy on peach, forest on cream and violet on gray can carry the same composition with different associations. Evaluate the pair in grayscale as well: similar luminance can hide a detailed screen even when the hues seem far apart.',
    remembers: [
        'Coverage and colour are separate decisions.',
        'A duotone is a palette mapping over the quantized brightness.',
        'More levels add intermediate colours between ink and paper.',
        'Colour contrast needs a tonal contrast to keep marks legible.',
    ],
    sources: ['dithering-shader/DitheringShader.ts', 'dithering-shader/DitheringEffect.ts', 'settings.ts'],
};
export default function Chapter() {
    return <LessonView lesson={lesson} />;
}

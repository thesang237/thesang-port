'use client';
import type { Lesson } from '../content/types';
import { LessonView } from '../kit/ui';
const lesson: Lesson = {
    id: 'surface',
    lead: 'A print can feel like paper, glass or an old display. The order of the treatment tells you whether you are bending the image or changing its surface.',
    idea: 'Lens warp bends the image before its brightness is evaluated. Colour separation samples different channels at slightly different positions. Paper grain, scanlines and edge falloff happen after the ink is chosen. These effects can suggest a material without adding more scene geometry.',
    lens: 'Separate lens effects from finishing effects in an After Effects comp. Distorting the precomp changes the thing being printed. Adding a grain layer after a gradient map changes the finished paper.',
    mechanism:
        'The radial warp multiplies the centred UV by a factor based on its squared distance. Red and blue samples offset in opposite directions. Coordinates are clamped inside the texture to avoid reading outside the image. Grain is seeded and stable. Scanlines are periodic in CSS pixels; vignette uses distance from the frame centre.',
    code: 'vec2 centered = uv - 0.5;\nuv = 0.5 + centered * (1.0 + warp * dot(centered, centered) * 4.0);\nfloat block = max(1.0, pixelSize * pixelRatio);\nuv = (floor(uv * resolution / block) + 0.5) * block / resolution;\nvec2 split = vec2(aberration * pixelRatio / resolution.x, 0.0);',
    file: 'src/modules/pages/Dithering/dithering-shader/DitheringShader.ts',
    highlight: ['warp *', 'vec2 split'],
    lab: {
        title: 'A worn phosphor landscape',
        hint: 'Warp the lens, add scanlines, then trade paper grain against source detail.',
        subject: 2,
        settings: {
            pattern: 2,
            colorMode: 1,
            ink: '#102b23',
            paper: '#b2e8bf',
            scanlines: 0.4,
            warp: 0.2,
            vignette: 0.4,
        },
        dials: ['warp', 'aberration', 'grain', 'scanlines', 'vignette'],
        palette: true,
    },
    tries: [
        'Set Lens warp to −0.6, then +0.6. Inspect what happens near the edges.',
        'Use Source colour and Colour field to make colour separation most visible.',
        'Max out Grain and Scanline depth. Decide which treatment should be reduced so the landscape still reads.',
    ],
    application:
        'Build an archival radar landscape with restrained green ink, slight lens curvature and scanlines. Alternatively, remove the lens effects and keep only a little stable grain for a risograph-like paper print. Choose one material story; piling every finish on top can erase the subject.',
    remembers: [
        'Lens effects change the input; surface effects change the print.',
        'Warping and colour offsets happen before the ink decision.',
        'Finishing effects should remain subordinate to the image.',
        'A coherent material story is more expressive than a stack of strong effects.',
    ],
    sources: ['dithering-shader/DitheringShader.ts', 'settings.ts'],
};
export default function Chapter() {
    return <LessonView lesson={lesson} />;
}

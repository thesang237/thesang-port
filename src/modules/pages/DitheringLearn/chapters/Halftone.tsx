'use client';
import type { Lesson } from '../content/types';
import { LessonView } from '../kit/ui';
const lesson: Lesson = {
    id: 'halftone',
    lead: 'An image can be described by circles that grow and touch. The shape is read from the area of ink, not a circle’s opacity.',
    idea: 'Tiny dots describe a light region; wider dots describe a darker region. Our screen is an idealized digital halftone: each cell has a center, and distance from that center decides which pixels get ink. Close to black, dots join until the whole cell is filled.',
    lens: 'Imagine resizing a circle in every cell of a print grid while keeping its centre fixed. Brightness supplies the size. You are changing geometric coverage rather than fading the circles.',
    mechanism:
        'fract(p) isolates the position inside a cell. Subtracting 0.5 places the centre at zero. The dot product gives squared distance, so coverage grows with area rather than linearly with radius. The shared shader reverses this distance threshold for ink-centered marks. Mark stretch makes the circles elliptical; rotation changes the screen’s alignment.',
    code: 'vec2 local = fract(p) - 0.5;\nif (pattern < 4.5) return clamp(dot(local, local) * 2.0, 0.0, 1.0);',
    file: 'src/modules/pages/Dithering/dithering-shader/patterns.glsl.ts',
    highlight: ['dot(local, local)'],
    lab: {
        title: 'Orbital press',
        hint: 'Scale the dots, then stretch them into an elliptical print screen.',
        subject: 1,
        settings: {
            pattern: 4,
            cellSize: 9,
            angle: 30,
            colorMode: 1,
            ink: '#263149',
            paper: '#efbfa0',
            gamma: 1.3,
        },
        dials: ['cellSize', 'stretch', 'angle', 'softness', 'gamma'],
    },
    tries: [
        'Raise Cell size to 24. Check whether the satellite still reads; the print can become coarser than the subject.',
        'Set Mark stretch to 3. The dots become elliptical while the moon remains round.',
        'Raise Edge softness to 0.2. The sharp print becomes an airbrushed field with transitional tones.',
    ],
    application:
        'Build a planetary poster series using a shared orbital composition and different screen angles. Combine navy ink and peach paper for a warm print, or keep black and white for a more mechanical feeling. Keep typography in the DOM, outside the shader, so small labels remain crisp and accessible.',
    remembers: [
        'Halftone describes brightness through mark area.',
        'Squared distance makes dot growth relate to area.',
        'Mark stretch transforms the screen without transforming the subject.',
        'A print screen must remain fine enough to preserve the story.',
    ],
    sources: ['dithering-shader/patterns.glsl.ts', 'dithering-shader/DitheringShader.ts', 'settings.ts'],
};
export default function Chapter() {
    return <LessonView lesson={lesson} />;
}

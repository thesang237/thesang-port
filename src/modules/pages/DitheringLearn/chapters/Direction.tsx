'use client';
import type { Lesson } from '../content/types';
import { LessonView } from '../kit/ui';
const lesson: Lesson = {
    id: 'direction',
    lead: 'Parallel lines, crossing lines and alternating threads can all carry the same image. The direction of the marks changes how its form feels.',
    idea: 'A line screen has one dominant gesture. Crosshatch adds a second direction in the dark regions. Woven marks alternate direction from cell to cell. Contour bands follow changes in brightness, producing a topographic illusion without calculating true geometric contour lines.',
    lens: 'Treat the pattern like the direction of brush strokes in an illustration. The image supplies the form; the strokes supply the energy. Rotating the screen is like rotating a hatch swatch inside a clipping mask.',
    mechanism:
        'The line screen measures distance to the local horizontal centre line. Crosshatch takes the smaller distance to either centre line, producing a cross. Woven alternates which axis it uses according to cell parity. Rotation and stretch transform the screen coordinates before any of these functions run. Contour is a separate artistic tone-band treatment, not edge extraction.',
    code: 'if (pattern < 5.5) return min(abs(local.x), abs(local.y)) * 2.0;\nif (pattern < 6.5) return abs(local.y) * 2.0;\nif (pattern < 7.5) {\n    float weave = mod(floor(p.x) + floor(p.y), 2.0);\n    return mix(abs(local.x), abs(local.y), weave) * 2.0;\n}',
    file: 'src/modules/pages/Dithering/dithering-shader/patterns.glsl.ts',
    highlight: ['min(abs', 'float weave'],
    lab: {
        title: 'Engraving a folded field',
        hint: 'Switch between hatching, lines, weave and contour. Rotate each screen.',
        subject: 3,
        settings: {
            pattern: 5,
            cellSize: 5,
            angle: 35,
            colorMode: 1,
            ink: '#502819',
            paper: '#efdec6',
            grain: 0.04,
        },
        dials: ['cellSize', 'angle', 'stretch', 'threshold'],
        patterns: [5, 6, 7, 8],
    },
    tries: [
        'Set Line screen to 0°, then 90°. The same folds feel horizontal, then vertical.',
        'Use Woven with Cell size 18: the alternating thread direction becomes a visible construction.',
        'Switch to Contour and push Tone bias. Notice that bands follow the tonal field, not the 3D geometry.',
    ],
    application:
        'Make a textile study from sine ribbons, or an engraved terrain from the landscape field. A line screen can become the visual identity of a whole series. Use a restrained palette first; strong colour can distract from whether the direction actually supports the form.',
    remembers: [
        'The gesture of marks changes the reading of a form.',
        'Each screen is a different distance or threshold function.',
        'Tone bands resemble contours without extracting geometric contours.',
        'A simple directional rule can become a recognizable artistic language.',
    ],
    sources: ['dithering-shader/patterns.glsl.ts', 'dithering-shader/DitheringShader.ts'],
};
export default function Chapter() {
    return <LessonView lesson={lesson} />;
}

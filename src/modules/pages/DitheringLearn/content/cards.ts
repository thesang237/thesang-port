import type { ChapterId } from './chapters';
import type { Card } from './types';
export const CARDS: Record<ChapterId, Card[]> = {
    map: [
        {
            q: 'What does the print shader know about the helmet?',
            a: 'Only its rendered image. It does not read the geometry or camera.',
        },
        {
            q: 'Why can glow before printing differ from glow after?',
            a: 'Before changes brightness and therefore coverage. After changes the finished marks.',
        },
        {
            q: 'What should a slider update?',
            a: 'Existing uniforms or effect properties, rather than creating a new composer or pass.',
        },
    ],
    tone: [
        {
            q: 'Why was adding RGB a problem?',
            a: 'The sum reaches 3 and clips midtones; pure red, green and blue all produce the same sum.',
        },
        {
            q: 'What does one positive exposure stop do?',
            a: 'It doubles the linear source colour before the print decision.',
        },
        {
            q: 'Why adjust contrast before the palette?',
            a: 'Coverage determines the light/dark structure; a colour choice cannot fix a lost tonal hierarchy.',
        },
    ],
    ordered: [
        {
            q: 'How many threshold positions are in a 4 × 4 matrix?',
            a: 'Sixteen; they determine the order in which its cells turn light.',
        },
        {
            q: 'What is the difference between Cell size and Sample size?',
            a: 'Cell size scales the print screen. Sample size pixelates the source image.',
        },
        {
            q: 'Why offset each rank by half a step?',
            a: 'It keeps thresholds inside the range, away from exact black and white endpoints.',
        },
    ],
    stipple: [
        {
            q: 'Why does this stipple stay still?',
            a: 'Its hash reads cell position and seed, not time.',
        },
        {
            q: 'Is the stipple blue noise?',
            a: 'No. It is seeded white-noise thresholding, which can produce clumps.',
        },
        {
            q: 'What changes when you change only the seed?',
            a: 'The threshold arrangement changes while the image and its tone remain the same.',
        },
    ],
    halftone: [
        {
            q: 'What does fract(p) isolate?',
            a: 'The local coordinate within one repeating cell.',
        },
        {
            q: 'Why use squared distance for a dot screen?',
            a: 'A circle’s area grows with radius squared, so squared distance is a useful coverage threshold.',
        },
        {
            q: 'Does screen rotation rotate the moon?',
            a: 'No. Only the coordinates used by the print pattern rotate.',
        },
    ],
    direction: [
        {
            q: 'What creates the woven alternation?',
            a: 'The parity of the cell’s x plus y coordinate selects the mark direction.',
        },
        {
            q: 'What does crosshatch measure?',
            a: 'The minimum distance to either of two crossing cell-centre lines.',
        },
        {
            q: 'Is Contour a geometric contour extractor?',
            a: 'No. It is a repeating tonal screen that creates a topographic-looking effect.',
        },
    ],
    palette: [
        {
            q: 'What does Ink & paper mode do?',
            a: 'It maps the quantized tone to a blend between two chosen colours.',
        },
        {
            q: 'Why can two different hues hide the pattern?',
            a: 'Their luminance may be too similar to reveal the mark boundaries.',
        },
        {
            q: 'How does Source colour differ?',
            a: 'It quantizes each RGB channel independently rather than mapping one grayscale coverage value.',
        },
    ],
    surface: [
        {
            q: 'Does grain affect the brightness used for coverage?',
            a: 'No. In this pipeline it is added after the ink colours are chosen.',
        },
        {
            q: 'Why clamp warped sample coordinates?',
            a: 'To keep sampling inside the source texture and prevent unintended edge reads.',
        },
        {
            q: 'Where is colour separation easiest to see?',
            a: 'On a coloured source in Source colour mode, because red and blue are sampled separately.',
        },
    ],
    runtime: [
        {
            q: 'What happens to pixel count when DPR doubles?',
            a: 'It becomes four times larger because both dimensions double.',
        },
        {
            q: 'What should happen when a demo leaves the viewport?',
            a: 'Its repeated rendering stops. It can render a still frame when a setting changes.',
        },
        {
            q: 'Which resources need explicit cleanup in a vanilla demo?',
            a: 'The composer and effects, geometry, material, renderer, observers, listeners and ticker callback; the context is released too.',
        },
    ],
    build: [
        {
            q: 'What is the smallest contract for a new screen?',
            a: 'A function that maps cell position to a threshold between 0 and 1, plus a registered pattern ID.',
        },
        {
            q: 'Why test a ramp before a complex subject?',
            a: 'It reveals coverage, endpoint and banding problems without scene lighting hiding them.',
        },
        {
            q: 'What belongs in a reproducible print recipe?',
            a: 'All print settings, including pattern, scale, tone, palette, seed and surface; subject settings remain separate.',
        },
    ],
};

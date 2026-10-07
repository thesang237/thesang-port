'use client';
import type { Lesson } from '../content/types';
import { LessonView } from '../kit/ui';
const lesson: Lesson = {
    id: 'runtime',
    lead: 'A fast print shader can still become an expensive page if it redraws while hidden or recreates GPU resources on every edit.',
    idea: 'Render density is a sampling budget. A 2× image has twice the pixels in each dimension, so it has four times the pixel work of 1×. Large screens can be expensive even with one mesh. The studio caps density; the guide only mounts one chapter and disposes its GPU resources when you leave it.',
    lens: 'Imagine a precomp that renders only when it is in view. A slider edits the precomp’s existing settings instead of rebuilding the whole project. That is the same distinction between changing a value and allocating a new resource.',
    mechanism:
        'The demo reports renderer counters, physical resolution and the shared ticker rate. The bench repeats renders while visible so you can inspect the workload. IntersectionObserver gates the ticker; hidden documents pause it. ResizeObserver owns dimensions. A static demo draws once after a dial changes. The active chapter unmounts its renderer, composer, geometry and material, then releases the WebGL context.',
    code: "setSettings(settings: DitherSettings): void {\n    for (const [key, value] of Object.entries(settings)) {\n        const uniform = this.uniforms.get(key);\n        if (!uniform) continue;\n        if (typeof value === 'string') (uniform.value as Color).set(value);\n        else uniform.value = typeof value === 'boolean' ? Number(value) : value;\n    }\n}",
    file: 'src/modules/pages/Dithering/dithering-shader/DitheringEffect.ts',
    highlight: ['uniform.value'],
    lab: {
        title: 'A visible rendering budget',
        hint: 'Change density and watch the physical resolution. Toggle glow to compare draw counts.',
        subject: 1,
        dials: ['cellSize', 'pixelSize'],
        bench: true,
        glow: true,
    },
    tries: [
        'Compare 1× and 2×. The physical dimensions double; the apparent printed mark size should not.',
        'Toggle each glow. More draw calls appear even though the subject is unchanged.',
        'Scroll this lab offscreen, then return. The frame counter should stop while hidden; tab changes should leave one active demo context.',
    ],
    application:
        'For a gallery of prints, render still previews and activate the full lab only when someone edits a piece. Keep text in the DOM. Reduce density before you simplify the artistic screen. GPU counters describe resource use; ticker fps is not a GPU timing query and cannot certify frame time on every device.',
    remembers: [
        'Doubling render density quadruples pixel work.',
        'Change values in existing uniforms instead of recreating GPU effects.',
        'Only visible work should consume continuous rendering time.',
        'Measure on the actual device before claiming a performance budget.',
    ],
    sources: ['PostProcessing.tsx', 'pipeline.ts', 'dithering-shader/DitheringEffect.ts'],
};
export default function Chapter() {
    return <LessonView lesson={lesson} />;
}

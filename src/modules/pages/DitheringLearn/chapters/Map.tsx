'use client';
import type { Lesson } from '../content/types';
import { LessonView } from '../kit/ui';
const lesson: Lesson = {
    id: 'map',
    lead: 'A smooth 3D image goes in. A field of deliberate marks comes out. The useful separation is between making an image and deciding how to print it.',
    idea: 'The helmet is a subject, not the dithering algorithm. A render target holds the image of that subject. The next pass can treat a helmet, a sphere, a landscape or a gradient exactly the same way. Select the stages below to follow the image through the small printing press.',
    lens: 'Think of an After Effects precomp passed through a stack of effects. The precomp is the scene image. The screen is a print texture applied to its brightness, and the palette is the colour treatment after that texture has decided where the marks go.',
    mechanism:
        'The renderer first draws the scene. Optional glow changes this image before the print. The print pass samples that result, shapes its tone and evaluates a threshold at each screen position. A second glow can soften the finished marks. Keeping those passes in a fixed graph means sliders change values rather than rebuilding GPU resources.',
    code: 'composer.addPass(new RenderPass(scene, camera));\ncomposer.addPass(beforePass);\ncomposer.addPass(printPass);\ncomposer.addPass(afterPass);',
    file: 'src/modules/pages/Dithering/pipeline.ts',
    highlight: ['printPass'],
    lab: {
        title: 'From continuous image to print',
        hint: 'Drag Print mix from 0 to 1. Then change the image inside Teaching image.',
        subject: 1,
        dials: ['strength', 'cellSize'],
        glow: true,
    },
    tries: [
        'Set Print mix to 0: the smooth procedural image is the input to the print shader.',
        'Raise Cell size to 24: the subject stays recognizable while its printing vocabulary becomes obvious.',
        'Enable glow before, then after printing. Before changes the ink decisions; after softens the marks.',
    ],
    application:
        'Use this separation to build a coherent series: keep one print recipe while changing the subject. An orbital poster, a folded ribbon and a terrain can share the same visual language. In the studio, replace the helmet with a knot or a faceted moon without rewriting the print shader.',
    remembers: [
        'The print only needs an image, not the scene that made it.',
        'Pass order changes the result because each pass reads the previous image.',
        'Print mix is a useful way to inspect what the treatment contributes.',
        'A reusable printing language lets different subjects feel like one series.',
    ],
    sources: ['Scene.tsx', 'pipeline.ts', 'dithering-shader/DitheringShader.ts'],
};
export default function Chapter() {
    return <LessonView lesson={lesson} />;
}

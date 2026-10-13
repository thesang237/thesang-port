'use client';
import Chapter, { type Lesson } from '../Chapter';
import Demo from '../demos/MaterialsDemo';
const lesson: Lesson = {
    idea: 'The rotating cube makes the material feel tangible. A broad, soft highlight suggests a rough surface; a sharper reflection suggests a smoother one. Changing the material swaps texture maps and surface settings while its colour settles smoothly.',
    lens: 'The mesh is the object’s shape; the material is its finish. Think of applying different rendered material presets to the same product mockup, under one consistent studio light rig.',
    term: 'normal',
    steps: [
        'Load the model once and share its geometry. Create the materials you own, and keep the lighting stable so comparisons remain meaningful.',
        'Set colour textures to sRGB and normal maps to non-colour data. The source uses roughness 0.85 / 0.85 / 0.5 and metalness 0.08 / 0.08 / 0.62.',
        'Pointer drag writes rotation offsets; the frame loop damps toward them. Keyboard arrow keys add the same offsets. Dispose your materials and environment texture when leaving.',
    ],
    fragile:
        'Metal without something to reflect often looks black. A normal map cannot repair a poor silhouette, and treating it as a colour image gives incorrect shading. Avoid creating new materials in every frame.',
    ship: 'The lab uses a neutral cube and a small studio environment, preserving the source’s response values. It supports drag and arrow keys, and starts with a still frame until you choose Play. The production scene also combines subtle time rotation with pointer influence.',
    remember: [
        'Stable lighting makes a material comparison meaningful.',
        'Roughness spreads a reflection; metalness changes its character.',
        'Input changes numbers, and the frame loop changes the object.',
        'Own your GPU resources and release exactly what you create.',
    ],
    code: 'model.body.roughness = index === 2 ? 0.5 : 0.85;\nmodel.body.metalness = index === 2 ? 0.62 : 0.08;\nmodel.body.map = index === 0 ? maps[0] : index === 1 ? maps[3] : null;\nmodel.body.normalMap = index === 0 ? maps[1] : index === 2 ? maps[2] : null;\nmodel.body.needsUpdate = true;',
    file: 'Scene.tsx',
    lines: [1, 2, 5],
    sources: ['Scene.tsx', 'Sustainability.tsx', 'SceneLoader.tsx'],
};
export default function MaterialsChapter() {
    return (
        <>
            <Chapter id="materials" lesson={lesson}>
                <Demo />
            </Chapter>
        </>
    );
}

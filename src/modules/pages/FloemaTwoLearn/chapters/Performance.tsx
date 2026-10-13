'use client';
import Chapter, { type Lesson } from '../Chapter';
import Demo from '../demos/PerformanceDemo';
const lesson: Lesson = {
    idea: 'Smoothness comes from doing the right amount of work at the right time. Invisible 3D scenes stop rendering; geometry and textures are reused; React updates labels only when the selected item changes. The visitor sees the composition, not the effort behind it.',
    lens: 'Your frame has a time budget, just as a layout has a space budget. At 60fps it is about 16.7ms. Reduce unnecessary layers before compressing the meaningful ones.',
    term: 'DPR',
    steps: [
        'Measure the whole page on a real GPU. Record frame intervals, draw calls, geometry and texture counts, plus browser errors.',
        'Cap DPR, reuse resources, and avoid per-frame allocations. Keep continuous values in refs; change React state only for discrete UI changes.',
        'Pause offscreen and hidden scenes. On unmount, remove tickers and observers, dispose owned resources, and release the WebGL context.',
    ],
    fragile:
        'An idle screenshot is not a performance test. A hidden preview may pause requestAnimationFrame, while software-rendered headless Chrome can produce misleading GPU results. Also distinguish a simulated budget estimate from a measured frame interval.',
    ship: 'Local production measurements for these source pages were around 16.7ms median and 16.8ms p95 on Apple M4 / ANGLE Metal. The hero has 22 planes, the wireframe uses 10 draw calls, and the material cube uses 2. These are observations from this machine, not universal promises. The lab clearly separates live counters from its pixel-cost estimate.',
    remember: [
        'Measure the work you actually ship, including scrolling and interaction.',
        'DPR changes pixel cost quadratically, not linearly.',
        'Stopping invisible work is often more useful than optimizing it.',
        'Performance claims need a device, a scenario, and a measurement.',
    ],
    code: "<Canvas\n    dpr={[1, 1.5]}\n    frameloop={active ? 'always' : 'never'}\n    gl={{ alpha: true, antialias: true,\n          powerPreference: 'high-performance', stencil: false }}\n/>",
    file: 'Scene.tsx',
    lines: [2, 3],
    sources: ['Scene.tsx', 'SceneLoader.tsx', 'Home.tsx', 'Sustainability.tsx'],
    docs: [
        {
            label: 'R3F: scaling performance',
            href: 'https://r3f.docs.pmnd.rs/advanced/scaling-performance',
        },
    ],
};
export default function PerformanceChapter() {
    return (
        <>
            <Chapter id="performance" lesson={lesson}>
                <Demo />
            </Chapter>
        </>
    );
}

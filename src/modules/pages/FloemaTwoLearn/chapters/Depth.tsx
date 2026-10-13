'use client';
import Chapter, { type Lesson } from '../Chapter';
import Demo from '../demos/DepthDemo';
const lesson: Lesson = {
    idea: 'The hero images approach the viewer along fixed lanes. They grow and spread outward because the camera has perspective, not because each image wanders around. Scrolling down adds energy; stopping lets the extra speed settle away.',
    lens: 'Put a flat image card in a 3D After Effects composition, then bring it toward the camera on the Z axis. Its X and Y stay fixed. The lens does the apparent scaling.',
    term: 'perspective',
    steps: [
        'Place a perspective camera at z = 20 with a 35° field of view. Build flat textured planes at measured positions.',
        'Advance distance using elapsed time. The source’s cruise speed is 1.4; scroll adds progress × 2 and velocity × 5, smoothed with damping 5.',
        'Recycle distances between 4 and 30. Fade over the last 2 units near the camera and 3 units at the far end to hide the wrap.',
    ],
    fragile:
        'Animating every card’s scale and screen position separately makes matching depth difficult. Very wide fields of view stretch the edges; a hard wrap makes cards visibly pop back into the distance.',
    ship: 'The lab uses neutral procedural cards with the source’s camera and speed values. Dials feed a frame loop, not React state per frame. The real hero contains 22 planes and caps DPR at 1.5; a separate DOM heading remains legible above the scene.',
    remember: [
        'Approaching the camera is enough to make an object grow.',
        'Keep the lanes fixed so acceleration reads as forward travel.',
        'Fade the recycle boundary before wrapping the distance.',
        'Let the camera project the scene; keep your UI in the DOM.',
    ],
    code: 'dials.scrollVelocity *= Math.exp(-4 * dt);\nconst targetSpeed = motion.heroCruise\n    + dials.progress * 2\n    + dials.scrollVelocity * motion.heroBoost;\ntravel.speed = THREE.MathUtils.damp(\n    travel.speed, targetSpeed, 5, dt,\n);\ntravel.distance += travel.speed * dt;',
    file: 'Scene.tsx',
    lines: [1, 5, 8],
    sources: ['Scene.tsx', 'Home.tsx', 'data.ts', 'motion.ts'],
};
export default function DepthChapter() {
    return (
        <>
            <Chapter id="depth" lesson={lesson}>
                <Demo />
            </Chapter>
        </>
    );
}

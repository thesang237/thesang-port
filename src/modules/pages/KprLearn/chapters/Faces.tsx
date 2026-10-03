'use client';

import FaceFlip from '../demos/FaceFlip';
import PixelStage from '../demos/PixelStage';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, TryThis, Where } from '../kit/ui';

export default function Faces() {
    return (
        <>
            <ChapterHead
                n="04"
                kicker="Three faces"
                title="One card can show three pictures."
                lead={
                    <>
                        The hero card starts as the girl, turns over to become the story painting, then turns again to become the 10K portrait. A flat plane only has two sides, so the trick is to
                        change the picture on the side you can’t see.
                    </>
                }
            />

            <Section id="swap" n="04.1" title="Swap the side that faces away">
                <P>
                    A card keeps a list of faces in turning order. At rest it shows face 1 on its front. As it turns past 90°, you start seeing its back, which already holds face 2. By the time it has
                    turned 270°, the front faces away from you again, so the card quietly puts face 3 there before it comes round. Every half turn moves one step along the list.
                </P>
                <FaceFlip />
                <Code file="src/modules/pages/Kpr/gl/NotchedCard.ts (apply, trimmed)" highlight={['Math.round(turn / Math.PI)', "this.bind('F'", "this.bind('B'"]}>
                    {`// which faces are front / back right now: every half turn moves one step along \`faces\`
const turn = Math.abs(s.ry);
const k = Math.round(turn / Math.PI);   // 0 at rest, 1 after one half turn, 2 after two…
const even = k % 2 === 0;
this.bind('F', faces[even ? k : k + 1]); // the plane's front side
this.bind('B', faces[even ? k + 1 : k]); // the plane's back side
// the hero: card().setFaces(painted('landing'), painted('story'), painted('collection'))`}
                </Code>
                <Lens>
                    It’s the old stage trick of changing the backdrop while the audience looks at the other side of the revolving set. In Figma terms: a component with three variants, where the swap
                    is hidden by the turn.
                </Lens>
                <TryThis
                    items={[
                        'Turn off “swap the hidden face” and drag to 360°: you land on picture 1 again. That is a normal two-sided card.',
                        'Watch the readout while dragging slowly past 270°: “front slot” changes from girl to portrait while you are looking at the back.',
                        'Switch on single-sided and drag past 90°: the card disappears. The gallery ring uses this to make cards vanish by turning.',
                    ]}
                />
                <Callout tone="tip">
                    The back face is mirrored in the shader (<C>uv.x = 1 − uv.x</C>), so it reads the right way round. The outline is evaluated in what you see, so the notch that was top left before
                    the turn is still top left after it.
                </Callout>
                <KeyIdea>A turn hides a swap: change the picture on the side that faces away.</KeyIdea>
            </Section>

            <Section id="stage" n="04.2" title="A 3D stage measured in pixels">
                <P>
                    To turn cards in real perspective while still placing them from HTML boxes, the canvas uses a perspective camera solved so that the plane at depth 0 shows exactly one viewport of
                    height: <strong>one world unit is one CSS pixel</strong>. A card 400 units wide is 400 px wide on screen when it faces you. The camera distance then only decides how dramatic the
                    perspective is when the card turns or moves in depth.
                </P>
                <PixelStage />
                <Code file="src/modules/pages/Kpr/gl/Stage.tsx + gl/layout.ts" highlight={['cam.fov', 'stageDistance =']}>
                    {`export const stageDistance = (vh) => Math.max(1100, vh * 1.25);

function fitPixelCamera(cam, w, h) {
    const d = stageDistance(h);
    cam.position.set(0, 0, d);
    cam.fov = THREE.MathUtils.radToDeg(2 * Math.atan(h / 2 / d)); // h pixels visible at z = 0
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
}`}
                </Code>
                <TryThis
                    items={[
                        'Drag the camera distance to 250 with the turn at 60°: the near edge balloons. That fisheye is what a short lens does.',
                        'Drag it to 5000: the turn looks almost flat, like a scaleX animation. The source’s 1125 sits in between: dramatic but not distorted.',
                        'Push the depth to −320 (what the hero does during its second turn): the card shrinks and the turn feels like it swings away from you.',
                    ]}
                />
                <KeyIdea>Solve the camera so 1 unit = 1 pixel; then 3D and HTML layout speak the same units.</KeyIdea>
                <Where
                    files={[
                        { path: 'Kpr/gl/NotchedCard.ts', note: 'faces, single(), apply' },
                        { path: 'Kpr/gl/materials/notched.ts', note: 'mirrored back, uSingle' },
                        { path: 'Kpr/gl/Stage.tsx', note: 'fitPixelCamera' },
                        { path: 'Kpr/gl/layout.ts', note: 'stageDistance' },
                    ]}
                />
            </Section>
        </>
    );
}

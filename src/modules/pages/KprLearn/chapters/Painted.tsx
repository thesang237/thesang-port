'use client';

import PaintedLab from '../demos/PaintedLab';
import StoryScrub from '../demos/StoryScrub';
import { C, Callout, Card, ChapterHead, Code, Grid, KeyIdea, Lens, P, Section, Steps, Table, Term, TryThis, Where } from '../kit/ui';

export default function Painted() {
    return (
        <>
            <ChapterHead
                n="05"
                kicker="Painted scenes"
                title="The paintings are tiny 3D sets."
                lead={
                    <>
                        The illustrations inside the cards look flat, but move the pointer and the girl’s head turns slightly against the sky. Each painting is a small 3D scene: painted cut-outs at
                        different depths, filmed by its own camera.
                    </>
                }
            />

            <Section id="planes" n="05.1" title="Cut-outs at different depths">
                <P>
                    Each painting is a <Term k="gltf">GLB file</Term> made by the original studio: the sky on a far plane, the jacket and hair on nearer planes, and for the characters a real head mesh
                    with the painting projected onto it. Because the planes sit at different distances, moving the camera makes near things shift more than far things. That is true parallax, not a 2D
                    trick.
                </P>
                <PaintedLab />
                <Steps
                    items={[
                        <>
                            Load the GLB. Swap every material for an <strong>unlit</strong> one: the paint already contains its light and shadow.
                        </>,
                        <>
                            Draw the planes back to front using an order number the artists stored in each plane (<C>extras.order</C>).
                        </>,
                        <>
                            Each frame, move the scene’s own camera (pointer orbit, zoom, baked clip) and render the scene into a <Term k="renderTarget">render target</Term>.
                        </>,
                        <>That image becomes the texture of the card. The card never knows it is showing 3D.</>,
                    ]}
                />
                <Code file="src/modules/pages/Kpr/gl/PaintedScene.ts (render, trimmed)" highlight={['setRenderTarget(this.target)', 'premultiply', 'setViewOffset']}>
                    {`// pointer: the camera orbits a pivot in front of it, so the painting turns rather than slides
this.pivot.copy(rig.position).addScaledVector(forward, this.pivotDist);
this.e.set(v.py * this.orbit[1] * travel, -v.px * this.orbit[0] * travel, 0, 'YXZ');
this.q.setFromEuler(this.e);
this.off.copy(rig.position).sub(this.pivot).applyQuaternion(this.q);
rig.position.copy(this.pivot).add(this.off);
rig.quaternion.premultiply(this.q);
// zoom into a focus point with a view offset (keeps the true perspective of the planes)
camera.setViewOffset(W * z, H * z, offsetX, offsetY, W, H);
// render into the texture the card shows
renderer.setRenderTarget(this.target);
renderer.render(this.scene, this.camera);`}
                </Code>
                <Lens>
                    Exactly a <strong>multiplane camera</strong> (old Disney) or After Effects 3D layers with a camera: flat artwork at different Z, one camera. The render target is a pre-comp: the
                    whole 3D set rendered, then used as a single layer inside the card.
                </Lens>
                <TryThis
                    items={[
                        'Set the pivot distance to 0.3: the camera now spins around a point right in front of the lens, and the whole painting slides together. Push it to 8: near planes swing wildly.',
                        'Choose “Landing close-up” (zoom 3.1): the girl’s face fills the frame. That is the page’s opening shot. The same file, cropped with a view offset.',
                        'Raise yaw to 0.4 and move the pointer to the edge: you start to see the edges of the cut-outs. The source keeps it at 0.1 so the illusion holds.',
                    ]}
                />
                <KeyIdea>Parallax comes from real depth: flat paintings at different distances, one camera.</KeyIdea>
            </Section>

            <Section id="zoom" n="05.2" title="Zoom by cropping, not by scaling">
                <P>
                    The landing shot is the same painting as the intro card, just much closer. Scaling the rendered image up 3× would blur it and flatten the depth. Instead the camera renders only a
                    window of a 3× bigger virtual frame, using a <Term k="viewOffset">view offset</Term>. The planes keep their true perspective and the paint stays sharp.
                </P>
                <Grid>
                    <Card kicker="Scale the image" title="Blurry and flat">
                        A 1440 px texture shown at 3× has a third of the detail, and all planes grow together: no parallax left.
                    </Card>
                    <Card kicker="View offset (the page)" title="Sharp and deep" tint>
                        The scene renders at full resolution for the cropped area; near planes still shift more than far ones. Zoomed views also orbit less: travel ÷ zoom^0.65.
                    </Card>
                </Grid>
                <KeyIdea>To zoom into 3D, crop the camera’s frame; don’t scale the picture.</KeyIdea>
            </Section>

            <Section id="clip" n="05.3" title="A baked camera move, steered by scroll">
                <P>
                    The story painting has a camera animation built into its file, 10.4 seconds long. The page never plays it in time. Every frame it computes where along the clip the camera should
                    be, from the film clock, and jumps there. The mapping isn’t straight: it lingers on the clouds, travels steadily down the mountains, and lands on the two figures while the logo
                    wipe plays.
                </P>
                <StoryScrub />
                <Code file="src/modules/pages/Kpr/gl/choreo.ts + PaintedScene.ts" highlight={['storyProgress', 'mixer.setTime']}>
                    {`export function storyProgress(t) {
    return 0.12 * ease.smooth(seg(t, 5.0, 6.4))   // drift over the clouds with row 1
         + 0.5  * inOut(seg(t, 6.2, 8.3))          // down the mountains with row 3
         + 0.3  * inOut(seg(t, 8.3, 9.15));        // land on the figures (≈ 0.92 of the clip)
}
// PaintedScene.render
this.mixer.setTime(progress * this.duration);      // jump, never play`}
                </Code>
                <TryThis
                    items={[
                        'Turn off the curve and scrub: the camera crawls at one steady speed and arrives at the figures too late for the logo beat.',
                        'Find the flat part of the curve around t = 6.0–6.2: the camera nearly rests between the clouds and the mountains, while the heading reads.',
                    ]}
                />
                <Callout tone="tip">
                    The hair and cloth planes in this file have no paint: they play flipbooks (animated sprite sheets). This demo hides them; chapter 09 shows how flipbooks work.
                </Callout>
                <KeyIdea>A baked animation becomes scrollable when you set its time instead of playing it.</KeyIdea>
            </Section>

            <Section id="files" n="05.4" title="The six scenes">
                <Table
                    mono={[0]}
                    head={['File', 'Shows', 'Pointer orbit (yaw, pitch) · pivot']}
                    rows={[
                        ['landing-2048.glb', 'The girl: hero front face (landing → intro card)', '0.1, 0.065 · 3'],
                        ['project-2048.glb', 'The story: hero back face, baked camera clip', '0.025, 0.015 · 1.4'],
                        ['collection-2048.glb', 'The 10K portrait (cleared to lavender)', '0.06, 0.04 · 3'],
                        ['tableaux-keep-2048.glb', 'The Keep (girl very close to the camera)', '0.012, 0.008 · 0.45'],
                        ['tableaux-factions-2048.glb', 'Factions, with energy flipbooks', '0.03, 0.02 · 1.3'],
                        ['tableaux-universe-2048.glb', 'The World, with magic and beams', '0.03, 0.02 · 1.5'],
                    ]}
                />
                <P>
                    Notice how the orbit gets smaller when the subject is close to the camera (The Keep): the pivot is set to roughly the subject’s distance, so the subject stays put while the
                    background swings. Chapter 11 explains why only one or two of these six render on any frame.
                </P>
                <Where
                    files={[
                        { path: 'Kpr/gl/PaintedScene.ts' },
                        { path: 'Kpr/data/media.ts', note: 'PAINTINGS: orbit, pivot, fx' },
                        { path: 'Kpr/gl/choreo.ts', note: 'storyProgress, zooms' },
                        { path: 'Kpr/debug/GlbDebug.tsx', note: '/kpr?debug=glb&name=landing' },
                    ]}
                />
            </Section>
        </>
    );
}

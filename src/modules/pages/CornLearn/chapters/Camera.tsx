'use client';

import MatcapLab from '../demos/MatcapLab';
import OrbitLab from '../demos/OrbitLab';
import RelitLab from '../demos/RelitLab';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function Camera() {
    return (
        <>
            <ChapterHead
                n="06"
                kicker="Camera & light"
                title="The camera leans toward you. The light follows."
                lead={
                    <>
                        Every scene on /corn reacts to the pointer: the world tilts a little as if you were peering round it, and on the hero the light on the cob slides with your hand. None of it
                        uses real-time lights. It’s a camera trick and two lighting tricks baked into textures.
                    </>
                }
            />

            <Section id="orbit" n="01 · Orbit" title="The camera circles, the subject stays put">
                <P>
                    Each world <Term k="orbit">orbits</Term> its camera around a pivot (the cob, the kernel, the stalk). Turning around the subject is what gives the feeling of depth: near things
                    swing more than far ones. But orbiting alone would drag the subject toward the centre of the screen, and the layout puts the cob right of centre, the kernel at the right edge. So
                    the camera also uses a <Term k="lensShift">lens shift</Term>: it slides the picture inside the lens so the pivot stays exactly on its designed spot.
                </P>
                <OrbitLab />
                <Code file="engine/worlds/World.ts · orbit()" highlight={['setViewOffset', 'lookAt']}>
                    {`protected orbit(pivot: THREE.Vector3, dist: number, yaw: number, pitch: number) {
    const cam = this.camera as THREE.PerspectiveCamera;
    const cp = Math.cos(pitch);
    cam.position.set(pivot.x + Math.sin(yaw) * cp * dist, pivot.y + Math.sin(pitch) * dist, pivot.z + Math.cos(yaw) * cp * dist);
    cam.lookAt(pivot);                                  // always facing the subject
    const { x: w, y: h } = this.size;
    // lens shift: keep the pivot at this.lens (reference px), not at the centre
    cam.setViewOffset(w, h, (-(this.lens.x - 960) / 1920) * w, (-(this.lens.y - 497) / 994) * h, w, h);
}`}
                </Code>
                <Lens>
                    A shift lens on an architecture camera: the camera can point straight at the building while the building sits high in the frame, without the verticals tilting. Here the “building”
                    is the cob, and the frame position is the layout grid.
                </Lens>
                <TryThis
                    items={[
                        <>Switch to “orbit, no shift” and move the pointer: the subject jumps to the centre and the layout breaks.</>,
                        <>Switch to “pan”: everything slides together. No depth, it looks like a flat picture moving.</>,
                        <>Push yaw to 1.2 rad: dramatic, but the subject turns too far and you lose the composition. 0.3 is a nudge.</>,
                    ]}
                />
                <KeyIdea>Orbit for depth, lens shift for composition: the subject stays on its layout spot while the world turns around it.</KeyIdea>
            </Section>

            <Section id="pointer" n="02 · The pointer" title="Small, smoothed and everywhere">
                <P>
                    The engine stores the pointer once as <Term k="ndc">−1 to 1</Term> and smooths it (<C>damp</C>, λ 3). Every world turns it into a small orbit: at most 0.3 rad of yaw and 0.15 of
                    pitch at the screen edge, smoothed again at λ 4 so the camera trails your hand. The bokeh layer has its own camera that slides (not turns) up to 0.75 units toward the pointer. Two
                    layers moving differently is what sells the depth.
                </P>
                <Code file="engine/Engine.ts + worlds/World.ts (trimmed)" highlight={['damp(this.ptr.x', 'TILT', 'slide']}>
                    {`// Engine: once per frame
this.ptr.x = damp(this.ptr.x, this.ptrTarget.x, 3, dt);
this.ptr.y = damp(this.ptr.y, this.ptrTarget.y, 3, dt);

// every world
export const TILT = { yaw: 0.3, pitch: 0.15 };
this.yaw = damp(this.yaw, ptr.x * TILT.yaw + scrollMove, 4, dt);

// the bokeh camera slides toward the pointer (World.updateFx)
const tx = ctx.ptr.x * slide + this.fxOffset.x;   // slide = 0.75
c.position.x += (tx - c.position.x) * k;`}
                </Code>
                <KeyIdea>One smoothed pointer, two cameras: the scene orbits (±0.3 / ±0.15 rad), the bokeh slides (±0.75). Different moves = depth.</KeyIdea>
            </Section>

            <Section id="scrollcam" n="03 · Scroll moves" title="The scroll moves the camera too">
                <P>
                    On top of the pointer, every world maps its <C>local</C> and <C>dwell</C> to a camera move. That’s why scenes never sit still while you scroll: the camera is always travelling
                    somewhere.
                </P>
                <Table
                    head={['World', 'While you dwell', 'As it leaves']}
                    rows={[
                        ['Hero', 'Travels down the cob, turns a little, the husk starts to open', 'Swings round the cob, pushes in, the leaves peel open'],
                        ['Science', 'Helix rises and twists; network climbs; pot rises', 'Hands over to the next stop without reversing'],
                        ['Stalk', 'Walks down the plant to the soil (two dwell steps)', 'Carries on to the ground'],
                        ['Plots', 'Pans along the field and tilts', 'Pitches further down'],
                        ['Kernel', 'Turns and rises; molecule columns climb past', 'Rises into the footer, the horizon dims'],
                    ]}
                />
                <Code file="engine/worlds/HeroWorld.ts · update() (camera)" highlight={['s * 0.55', 'this.orbit']}>
                    {`this.yaw = damp(this.yaw, ptr.x * 0.3 + s * 0.55 + dw * 0.3, 4, dt);   // pointer + scroll
this.pitch = damp(this.pitch, 0.03 + ptr.y * 0.15 - Math.abs(s) * 0.08 + dw * 0.05, 4, dt);
this.lens.set(1050 - s * 60 - dw * 40, 548 - Math.max(0, s) * 140 + Math.max(0, -s) * 90 - dw * 85);
this.orbit(PIVOT, 26 + 3 * (1 - e) - Math.abs(s) * 5 - dw * 2.5, this.yaw, this.pitch);`}
                </Code>
                <KeyIdea>Pointer and scroll add into the same yaw, pitch, distance and lens: one orbit call serves both.</KeyIdea>
            </Section>

            <Section id="relit" n="04 · Baked light" title="Light that follows you, with no lights">
                <P>
                    The cob and its husk are painted cards (flat textured shapes) with their lighting <Term k="baked">baked</Term> in, four times: lit from the top-left, top-right, bottom-left and
                    bottom-right. The shader mixes the four by a 2D light position that comes from the pointer and the cob’s own turn. Four texture reads and two mixes: the cheapest “dynamic” light
                    there is. The cards are drawn without depth testing, in the order the artist stored in the file, with <Term k="premultiplied">premultiplied</Term> soft edges.
                </P>
                <RelitLab />
                <Code file="engine/worlds/shared.ts · relitMaterial() fragment" lang="glsl" highlight={['vec3 top', 'mix(top, bot']}>
                    {`float a = texture2D(tAlpha, vUv).r;
if (a < 0.004) discard;
vec3 top = mix(texture2D(tTL, vUv).rgb, texture2D(tTR, vUv).rgb, uLight.x);
vec3 bot = mix(texture2D(tBL, vUv).rgb, texture2D(tBR, vUv).rgb, uLight.x);
// atlases are premultiplied on black: divide by alpha, then normal blending
gl_FragColor = vec4(mix(top, bot, uLight.y) * uExposure / a, a);`}
                </Code>
                <TryThis
                    items={[
                        <>Click through the four bakes: each is a complete, hand-lit painting.</>,
                        <>Turn “depth test” on: leaves start cutting into each other along their soft edges. That’s why the page turns it off.</>,
                        <>Turn off “artist’s draw order”: front and back leaves swap. With no depth test, order is the only thing deciding who covers whom.</>,
                    ]}
                />
                <KeyIdea>Four baked lightings mixed by one 2D light position: the light “follows” the pointer for the price of four texture reads.</KeyIdea>
            </Section>

            <Section id="matcap" n="05 · Matcap" title="The kernel’s studio light is a picture of a ball">
                <P>
                    The kernel uses a <Term k="matcap">matcap</Term>: a small image of a lit sphere. For every pixel, the shader works out which way the surface faces relative to the camera and reads
                    the colour of the sphere point facing the same way. The kernel layers two: a multiply matcap for the shading, a colour burn for rich shadows, then a screen matcap for the rim and
                    sheen. Like the reference, the blend maths runs on display values.
                </P>
                <MatcapLab />
                <Code file="engine/worlds/KernelWorld.ts · kernelMaterial() fragment" lang="glsl" highlight={['base * mult', 'burn(', '1.0 - (1.0 - c)']}>
                    {`vec3 base = toDisplay(texture2D(tMap, vUv).rgb);
vec3 mult = toDisplay(texture2D(tMult, vN).rgb);        // vN = sphere-map uv from the normal
vec3 scr = toDisplay(texture2D(tScreen, vN).rgb) * uGlow;
vec3 c = base * mult;                                    // multiply
vec3 cb = vec3(0.27, 0.88, 0.97);
c = mix(c, vec3(burn(c.r, cb.r), burn(c.g, cb.g), burn(c.b, cb.b)), 0.3);  // colour burn 30 %
c = 1.0 - (1.0 - c) * (1.0 - scr);                       // screen
gl_FragColor = vec4(pow(c, vec3(2.2)) * uFade, 1.0);     // back to linear`}
                </Code>
                <Callout tone="tip" title="Figma blend modes, in a shader">
                    Multiply, colour burn and screen are the same formulas as the layer blend modes you know. The difference: they run per pixel against a picture that is looked up by the surface
                    direction, so the “lighting” turns with the object.
                </Callout>
                <KeyIdea>Albedo × multiply matcap → colour burn 30 % → screen matcap: blend modes against a picture of a lit ball.</KeyIdea>
                <Where
                    files={[
                        { path: 'engine/worlds/World.ts', note: 'orbit, updateFx, TILT' },
                        { path: 'engine/worlds/HeroWorld.ts', note: 'light mapping, cards' },
                        { path: 'engine/worlds/shared.ts', note: 'relitMaterial' },
                        { path: 'engine/worlds/KernelWorld.ts', note: 'kernelMaterial' },
                    ]}
                />
            </Section>
        </>
    );
}

'use client';

import DuotoneLab from '../demos/DuotoneLab';
import GlassHelmetLab from '../demos/GlassHelmetLab';
import TrailRevealLab from '../demos/TrailRevealLab';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Steps, Term, TryThis, Where } from '../kit/ui';

export default function ShadersChapter() {
    return (
        <article>
            <ChapterHead
                n="09"
                kicker="Shader effects"
                title="Paint the helmet on, drain the colour out, drop a glass dome."
                lead={
                    <>
                        Three effects give the page its tactile, slightly uncanny feel. Each one is a small <Term k="shader">shader</Term> — a recipe run for every pixel at once — fed by a handful of
                        numbers from JavaScript. None of them needs 3D models or heavy assets: two photos, a canvas and some maths.
                    </>
                }
            />

            <Section id="trail" n="9.1" title="The trail reveal">
                <P>
                    Move your cursor over the hero and the driver’s helmet appears under it, with a liquid, wobbling edge that closes up behind you after about a second. It’s two layers of the same
                    framing — portrait, and portrait wearing the helmet — and a black-and-white <strong>mask</strong> that decides which one shows. The mask is painted, live, on a tiny 2D canvas.
                </P>
                <TrailRevealLab />
                <TryThis
                    items={[
                        <>Turn on “mask only” and move slowly, then fast. With the speed gate on, slow moves barely paint: only a real gesture leaves a trace.</>,
                        <>Set noise amount to 0: the edge becomes a clean soft circle — nice, but it looks like a spotlight, not liquid.</>,
                        <>Set edge softness to 0.3: the edge turns into a foggy gradient. 0.03 is the sweet spot between crisp and jagged.</>,
                        <>Push decay to 0.1: the blob vanishes almost at once. At 0.003 it lingers like wet paint.</>,
                    ]}
                />
                <Steps
                    items={[
                        <>
                            <strong>Paint the trail.</strong> Every frame, a soft white dot is stamped along the pointer’s path on a quarter-size canvas — stronger when the pointer moves fast.
                        </>,
                        <>
                            <strong>Fade it.</strong> Every frame, the whole canvas is covered with black at 1.8% opacity, so old strokes sink back to black in about 0.9 s.
                        </>,
                        <>
                            <strong>Wobble it.</strong> In the shader, noise that drifts over time is added to the trail value.
                        </>,
                        <>
                            <strong>Threshold it.</strong> <C>smoothstep(0.40, 0.43, trail + noise × 0.17)</C> turns the blurry value into a crisp, organic edge.
                        </>,
                        <>
                            <strong>Mix.</strong> <C>mix(portrait, helmet, mask)</C> — 0 shows the face, 1 shows the helmet.
                        </>,
                    ]}
                />
                <Code
                    file="src/modules/pages/LandoNorris/gl/HeroGL.tsx"
                    lang="ts"
                    highlight={['mx_noise_float', 'smoothstep(0.4, 0.43', 'mix(base, helm, m)']}
                >{`// TSL (three.js shading language), per pixel:
const tr = texture(trail.t, screenUv).r;                         // the painted trail, 0…1
const n  = mx_noise_float(vec3(P.mul(0.0105), time.mul(0.35)));  // drifting noise
const m  = smoothstep(0.4, 0.43, tr.add(n.mul(0.17)));           // crisp, wobbly mask
const col = mix(base, helm, m);                                  // face → helmet

// JS, per frame, on the trail canvas:
ctx.fillStyle = \`rgba(0,0,0,\${TRAIL_DECAY})\`;                  // 0.018: fade everything a little
ctx.fillRect(0, 0, c.width, c.height);
const strength = Math.min(1, Math.max(0, (dist / TRAIL_SCALE - 3) / 25)); // speed gate
// …stamp radial gradients (radius 200 px) along the path, alpha 0.55 × strength`}</Code>
                <Lens>
                    Photoshop version: two layers, a layer mask on the top one, and you paint the mask with a big soft white brush that slowly fades back to black. Then run Threshold with a little
                    noise so the brush edge goes hard and liquid.
                </Lens>
                <KeyIdea>Paint a blurry mask cheaply, then make the edge sharp and alive in the shader: noise + a narrow smoothstep.</KeyIdea>
            </Section>

            <Section id="duotone" n="9.2" title="Duotone photos that flood with colour">
                <P>
                    The menu’s photos rest in a green duotone and bloom into colour when you hover their link. The shader measures each pixel’s brightness (<Term k="luma">luma</Term>) and maps it
                    between two colours — dark green for shadows, pale sage for highlights. A single number, <C>active</C>, mixes from that duotone to the real colour. While it’s changing, a sine wave
                    pushes rows sideways — a ripple that is strongest half-way and gone at both ends.
                </P>
                <DuotoneLab />
                <TryThis
                    items={[
                        <>
                            Go manual and drag “active” slowly: the ripple peaks at exactly 0.5 — that’s <C>a × (1 − a) × 4</C>.
                        </>,
                        <>Set the shadows to deep blue and the highlights to orange. Same photo, a new brand. Duotones are a cheap way to make mismatched photos feel like one set.</>,
                        <>Slide --clip: the same number the menu timeline animates (chapter 05).</>,
                    ]}
                />
                <Code
                    file="src/modules/pages/LandoNorris/gl/MenuGL.tsx"
                    lang="ts"
                    highlight={['wobble', 'luma', 'mix(duo, c, u.active)']}
                >{`const wobble = u.active.mul(u.active.oneMinus()).mul(4.0);        // 0 → 1 → 0
const dx = sin(yDown.mul(38.0).add(u.active.mul(9.0))).mul(0.018).mul(wobble);
const t4 = texture(tex, shiftedUv);
const luma = dot(c, vec3(0.299, 0.587, 0.114));
const duo = mix(color(0x283024), color(0xd2d6c3), smoothstep(0.0, 1.05, luma));
return vec4(mix(duo, c, u.active), 1);

// JS: hover in fast, out slow
gsap.to(it.state, { a: on ? 1 : 0, duration: on ? 0.18 : 0.45, ease: on ? 'power2.out' : 'power2.inOut' });`}</Code>
                <Callout tone="tip" title="Designer habit">
                    <C>x × (1 − x) × 4</C> is a handy shape: a bump that is 0 at the start, 1 in the middle, 0 at the end. Use it for anything that should only happen <em>during</em> a transition — a
                    ripple, a blur, a scale overshoot.
                </Callout>
            </Section>

            <Section id="glass" n="9.3" title="The glass helmet loop">
                <P>
                    Look closely at the hero while you’re not moving: a faint wireframe helmet drops onto the driver’s head once per second. It’s a sphere squashed into a helmet shape, drawn as lines
                    (40 top-to-rim meridians, 16 rings), rotating slowly, fading out toward its rim. Its loop is pure maths on the clock: fade in over the first 22%, drop with an ease-out over the
                    first 60%, fade out from 55% to 90%.
                </P>
                <GlassHelmetLab />
                <Code
                    file="src/modules/pages/LandoNorris/gl/HeroGL.tsx"
                    lang="ts"
                    highlight={['const ph', 'const drop']}
                >{`const ph = (t % 1.0) / 1.0;                                    // loop phase 0 → 1
const fadeIn = Math.min(1, ph / 0.22);
const fadeOut = 1 - Math.min(1, Math.max(0, (ph - 0.55) / 0.35));
u.glass.value = REDUCED ? 0 : fadeIn * fadeOut * visible;      // decorative: off for reduced motion
const drop = 1 - Math.pow(1 - Math.min(1, ph / 0.6), 3);        // ease-out cubic
glass.grp.position.set(cx - W / 2, -(cy - H / 2) + (1 - drop) * 90 * s, 10);
glass.lines.rotation.set(0.32, t * 0.25, 0);`}</Code>
                <TryThis items={[<>Pause and scrub the phase. Then push max opacity to 1: impressive for a second, then tiring. At 0.42 it’s something you notice on the third look.</>]} />
                <KeyIdea>A loop is just a phase from 0 to 1. Give each property its own window of that phase and an ease — like the stroke windows in chapter 06.</KeyIdea>
                <Where files={[{ path: 'gl/HeroGL.tsx', note: 'trail + glass' }, { path: 'gl/MenuGL.tsx', note: 'duotone + ripple' }, { path: 'gl/heroState.ts' }]} />
            </Section>
        </article>
    );
}

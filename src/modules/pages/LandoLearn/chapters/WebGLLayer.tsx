'use client';

import CoverFitLab from '../demos/CoverFitLab';
import DomSyncLab from '../demos/DomSyncLab';
import { C, Callout, Card, ChapterHead, Code, Grid, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function WebGLLayerChapter() {
    return (
        <article>
            <ChapterHead
                n="08"
                kicker="The WebGL layer"
                title="A transparent canvas that shadows the page, box by box."
                lead={
                    <>
                        The helmet reveal and the duotone menu photos can’t be done with CSS alone. So the page puts a transparent WebGL canvas over the layout and draws its own copies of a few images
                        — exactly where the real HTML boxes are, every frame. The HTML stays the source of truth for layout; WebGL only paints.
                    </>
                }
            />

            <Section id="why" n="8.1" title="Why draw an image twice?">
                <P>
                    CSS can blend, filter and mask, but it can’t do per-pixel logic that changes over time: “show the helmet photo where the cursor has been, with a wobbly liquid edge”. A{' '}
                    <Term k="shader">shader</Term> can. The page uses WebGL for exactly three effects and nothing else:
                </P>
                <Grid cols={3}>
                    <Card kicker="Hero canvas" title="Trail reveal">
                        The helmet version of the portrait shows through where the pointer passed.
                    </Card>
                    <Card kicker="Hero canvas" title="Glass helmet">
                        A wireframe dome drops onto the head every second.
                    </Card>
                    <Card kicker="Menu canvas" title="Duotone photos">
                        Green duotone → full colour with a ripple on hover.
                    </Card>
                </Grid>
                <KeyIdea>Use WebGL only where CSS can’t reach. Everything else — layout, text, most images — stays plain HTML.</KeyIdea>
            </Section>

            <Section id="sync" n="8.2" title="Planes that follow DOM boxes">
                <P>
                    The canvas uses an <Term k="ortho">orthographic camera</Term> set up in CSS pixels, with (0, 0) at the canvas centre and +y pointing up. Each frame, the WebGL code asks the browser
                    where the real HTML box is (<C>getBoundingClientRect()</C>), then moves and stretches a 1 × 1 plane onto it. Because the HTML box does the layout — responsive CSS, scroll, pinning,
                    the menu’s clip — the WebGL copy is always in the right place.
                </P>
                <DomSyncLab />
                <TryThis
                    items={[
                        <>Switch to “every 250 ms” and scroll: the plane stutters behind the card. Now “once”: it stays where it was and the illusion breaks completely.</>,
                        <>Turn off the DOM image: with per-frame sync you can’t tell that what you see is a canvas.</>,
                    ]}
                />
                <Code file="src/modules/pages/LandoNorris/gl/HeroGL.tsx" lang="ts" highlight={['getBoundingClientRect', 'card.position.set']}>{`useFrame((state) => {
    const el = document.querySelector('[data-gl-hero]');           // the real HTML card
    const canvasRect = state.gl.domElement.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const x = r.left - canvasRect.left;
    const y = r.top - canvasRect.top;
    card.scale.set(r.width, r.height, 1);                           // 1×1 plane → box size
    card.position.set(x + r.width / 2 - W / 2, -(y + r.height / 2 - H / 2), 0);  // top-left → centre, y flipped
});`}</Code>
                <Lens>
                    It’s like a “component instance” living on a separate layer that’s constrained to a frame on the main artboard. Resize or move the frame, and the instance follows — because it
                    reads the frame’s position, it never stores its own.
                </Lens>
            </Section>

            <Section id="fallback" n="8.3" title="The HTML image paints first">
                <P>
                    Under each WebGL plane there’s still a normal image. It shows during loading, it shows if WebGL fails, and it’s what the first paint contains. When the WebGL layer has drawn its
                    first frame, it sets <C>data-gl=&quot;1&quot;</C> on the HTML copy and CSS hides it (<C>visibility: hidden</C>). No blank flash, no broken page without WebGL.
                </P>
                <Code file="HeroGL.tsx · lando.scss" lang="tsx" highlight={['data-gl']}>{`<Scene onFirstFrame={() => document.querySelector('.ln-hero-card-dom')?.setAttribute('data-gl', '1')} />

/* .ln-hero-card-dom[data-gl='1'] { visibility: hidden; } */`}</Code>
                <Callout tone="tip" title="Designer habit">
                    Always design the “no WebGL” frame. Here it’s the plain portrait on the contour background — which is also the first thing anyone sees.
                </Callout>
            </Section>

            <Section id="cover" n="8.4" title="object-fit: cover, in a shader">
                <P>
                    A plane stretches its texture to fit. To crop like CSS <C>object-fit: cover</C> (plus <C>object-position</C> and a zoom), the menu shader turns every pixel’s position in the box
                    into a position inside the image with two numbers: a <strong>scale</strong> and an <strong>offset</strong>. JavaScript computes them from the box size; the shader just multiplies
                    and adds.
                </P>
                <CoverFitLab />
                <Code
                    file="src/modules/pages/LandoNorris/gl/MenuGL.tsx"
                    lang="ts"
                    highlight={['Math.max', 'u.scale', 'u.offset']}
                >{`const s = Math.max(r.width / it.iw, r.height / it.ih);   // cover: the larger of the two ratios
const dw = it.iw * s;  const dh = it.ih * s;              // drawn image size
const ox = (r.width - dw) * px;  const oy = (r.height - dh) * py;   // object-position
it.u.scale.value.set(r.width / (z * dw), r.height / (z * dh));
it.u.offset.value.set(((r.width / 2) * (1 - 1 / z) - ox) / dw, ((r.height / 2) * (1 - 1 / z) - oy) / dh);
// shader: iuv = uv * scale + offset`}</Code>
                <TryThis items={[<>Pick “profile” (a tall image) and make the box very wide. Then slide focus y: you decide which horizontal strip of the face survives the crop.</>]} />
            </Section>

            <Section id="webgpu" n="8.5" title="WebGPU, TSL and the WebGL fallback">
                <P>
                    The source’s canvas is a React Three Fiber canvas running three.js’s <Term k="webgpu">WebGPURenderer</Term>: WebGPU where the browser has it, WebGL2 otherwise — automatically. Its
                    shaders are written in <Term k="tsl">TSL</Term>, three.js’s JavaScript shading language, which compiles to either backend. The demos in this guide use plain WebGL and GLSL for
                    simplicity; the maths is identical.
                </P>
                <Table
                    head={['Idea', 'TSL (source)', 'GLSL (these demos)']}
                    rows={[
                        ['Read a texture', <C key="a">texture(tex, uv)</C>, <C key="b">texture2D(map, uv)</C>],
                        ['Blend two colours', <C key="c">mix(a, b, t)</C>, <C key="d">mix(a, b, t)</C>],
                        ['A value from JS', <C key="e">uniform(0)</C>, <C key="f">uniform float x;</C>],
                        ['Flip y', <C key="g">uv().y.oneMinus()</C>, <C key="h">1.0 - vUv.y</C>],
                        ['Soft threshold', <C key="i">smoothstep(a, b, x)</C>, <C key="j">smoothstep(a, b, x)</C>],
                    ]}
                />
                <Code file="src/components/motion-kit/WebGLCanvas.tsx" highlight={['WebGPURenderer', 'dpr', 'frameloop']}>{`<Canvas
    flat
    dpr={[1, 2]}                                   // never render more than 2× pixels
    orthographic
    camera={{ zoom: 1, position: [0, 0, 500] }}    // 1 unit = 1 CSS pixel
    frameloop={active ? 'always' : 'never'}        // paused when off screen
    gl={async (props) => {
        const renderer = new THREE.WebGPURenderer({ canvas: props.canvas, antialias: true, alpha: true });
        await renderer.init();                     // falls back to WebGL2 when WebGPU is missing
        renderer.toneMapping = THREE.NoToneMapping; // keep sRGB colours exact
        return renderer;
    }}
/>`}</Code>
                <KeyIdea>WebGL here is a paint layer: HTML decides where, the shader decides what each pixel looks like.</KeyIdea>
                <Where files={[{ path: 'motion-kit/WebGLCanvas.tsx' }, { path: 'gl/HeroGL.tsx' }, { path: 'gl/MenuGL.tsx' }, { path: 'sections/HeroSequence.tsx', note: '[data-gl-hero]' }]} />
            </Section>
        </article>
    );
}

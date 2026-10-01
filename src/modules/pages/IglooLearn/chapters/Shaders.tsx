'use client';

import GpuSnow from '../demos/GpuSnow';
import IceCrystal from '../demos/IceCrystal';
import PaletteLab from '../demos/PaletteLab';
import PixelPainter from '../demos/PixelPainter';
import { C, Callout, Card, ChapterHead, Code, Grid, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function ShadersChapter() {
    return (
        <article>
            <ChapterHead
                n="07"
                kicker="Shaders"
                title="Painting every pixel at once."
                lead={
                    <>
                        The ice, the fog transitions, the glitches, the snow and the particle glow are all <Term k="shader">shaders</Term>: tiny programs that run on the graphics card. They look like
                        maths, but the ideas are the ones you use every day — gradients, masks, blend modes and noise textures.
                    </>
                }
            />

            <Section id="what" n="7.1" title="What a shader actually is">
                <P>
                    Imagine a plugin that runs once for <em>every single pixel</em> of the canvas, all at the same time, and has to answer one question: <strong>“what colour am I?”</strong> It only
                    knows its own position and a handful of values you send it — the time, the scroll progress, the mouse. That is a <Term k="fragment">fragment shader</Term>.
                </P>
                <Lens>
                    A shader is a blend mode you write yourself. Photoshop’s “Screen” is a formula applied to every pixel; so is a gradient map; so is a vignette. In a shader you write that formula,
                    and because it runs on thousands of GPU cores in parallel, it’s fast enough to animate at 60fps.
                </Lens>
                <PixelPainter />
                <KeyIdea>A fragment shader answers “what colour am I?” for every pixel, using only its position and a few shared values (uniforms).</KeyIdea>
            </Section>

            <Section id="parts" n="7.2" title="The parts of a shader, in plain words">
                <Grid>
                    <Card kicker="Vertex shader" title="Moves the shape">
                        Runs once per corner (vertex) of a mesh and decides where it lands on screen. The crystal’s slice glitch and all snow motion happen here.
                    </Card>
                    <Card kicker="Fragment shader" title="Paints the surface" accent="var(--il-lilac)">
                        Runs once per pixel the mesh covers and decides its colour. Ice, fog, glow, grain happen here.
                    </Card>
                </Grid>
                <Table
                    head={['Word', 'Plain meaning', 'Igloo example']}
                    mono={[0]}
                    rows={[
                        ['uniform', 'A dial, same value for every pixel this frame', 'uTime, uHover, uT (transition), uMouse'],
                        ['attribute', 'Per-vertex data stored in the geometry', 'position, aSeed (snow), aBary (crystal edges)'],
                        ['varying', 'A value handed from vertex → fragment, blended across the triangle', 'vN (normal), vWPos (world position)'],
                        ['uv', 'Position across a surface or screen, 0..1', 'the compositor’s full-screen uv'],
                        ['mix(a, b, t)', 'lerp — blend two colours', 'fog colour ↔ scene'],
                        ['smoothstep', 'Soft 0→1 ramp (chapter 02)', 'every mask, glow and dissolve'],
                        ['fract / mod', 'Wrap a number back to 0 → repeating patterns', 'dot grid, falling snow, scanlines'],
                    ]}
                />
                <Code file="how JavaScript talks to a shader" highlight={['uniforms']}>{`const material = new THREE.ShaderMaterial({
    vertexShader, fragmentShader,
    uniforms: { uTime: { value: 0 }, uHover: { value: 0 } },   // the dials
});

// every frame — the only per-frame work on the CPU
material.uniforms.uTime.value = elapsed;
material.uniforms.uHover.value = damp(material.uniforms.uHover.value, isHovered ? 1 : 0, 6, dt);`}</Code>
            </Section>

            <Section id="crystal" n="7.3" title="Dissecting the ice crystal">
                <P>
                    The portfolio crystals don’t use any built-in material. Their shader fakes everything you associate with ice, each ingredient a few lines: seeing through it (refraction), milky
                    depth (noise), a glowing rim (<Term k="fresnel">fresnel</Term>), a soap-bubble shimmer (iridescence), bright facet edges and a frosty, crushed base.
                </P>
                <IceCrystal />
                <Code file="canvas/CrystalWorld.tsx — crystal fragment shader (core)" lang="glsl" highlight={['fres', 'irid']}>{`vec3 N = normalize(vN);
vec3 V = normalize(cameraPosition - vWPos);
float fres = pow(1.0 - abs(dot(N, V)), 2.2);             // 0 facing you, 1 at the silhouette

vec3 col = envGrad(refract(-V, N, 0.76)) * 0.55          // look *through* the ice
         + envGrad(reflect(-V, N)) * 0.25 * (0.4 + fres); // and a reflection on top

float cloud = fbm3(vObj * 1.6 + uTime * 0.05) * 0.5 + 0.5;
col = mix(col, vec3(0.2, 0.23, 0.29), cloud * 0.35);     // milky inside

vec3 irid = 0.5 + 0.5 * cos(6.28318 * (fres * 1.6 + vObj.y * 0.25 + vec3(0.0, 0.33, 0.67)));
col += irid * smoothstep(0.15, 0.75, fres) * (0.28 + uHover * 0.5);  // rainbow rim

float edge = min(min(vBary.x, vBary.y), vBary.z);           // distance to nearest triangle edge
col += (1.0 - smoothstep(0.0, fwidth(edge) * 1.6, edge)) * (0.45 + uHover * 0.6);`}</Code>
                <TryThis
                    items={[
                        'Set everything to 0, then raise one dial at a time. Refraction + fresnel alone already read as “glass”.',
                        'Crank fresnel power to 6: only the silhouette glows — very “rim light”.',
                        'Switch the backdrop to dark: the same shader reads colder and more jewel-like.',
                    ]}
                />
            </Section>

            <Section id="palette" n="7.4" title="Rainbows from one line: cosine palettes">
                <P>
                    Igloo’s iridescence, the rainbow streaks in transitions and the particle tints all come from one formula popularised by Inigo Quilez. A cosine wave per colour channel, each shifted
                    a little: smooth, looping, and tunable with four numbers. It is the gradient tool of shader land.
                </P>
                <PaletteLab />
            </Section>

            <Section id="snow" n="7.5" title="Moving thousands of things: the vertex shader">
                <P>
                    Snow is a single <C>THREE.Points</C> object. Each flake is created once with a random position and a random seed. After that, JavaScript never touches them again — it only sends
                    the time. The vertex shader computes each flake’s fall, wraps it back to the top with <C>mod()</C>, adds a personal sway, and shrinks it with distance.
                </P>
                <GpuSnow />
                <Code file="canvas/Snow.tsx — vertex shader" lang="glsl" highlight={['mod(']}>{`attribute float aSeed;                             // 0..1, one per flake
void main() {
    vec3 p = position;
    float t = uTime * uSpeed * (0.6 + aSeed * 0.8);       // every flake falls at its own speed
    p.y = mod(p.y - t + uHeight * 0.5, uHeight) - uHeight * 0.5;  // fall … then wrap to the top
    p.x += sin(uTime * 0.6 + aSeed * 40.0) * 0.35;        // personal sway
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.5 + aSeed) * (12.0 / -mv.z);      // perspective: far = small
}`}</Code>
                <KeyIdea>Anything that moves by a formula (time, seed, position) should move in a shader. JavaScript only updates the dials.</KeyIdea>
            </Section>

            <Section id="patch" n="7.6" title="Patching a built-in material">
                <P>
                    Writing a full lit material from scratch is a lot of work. For the snowy bricks and ground, Igloo keeps three.js’s standard (lit, shadowed) material and <em>injects</em> a few
                    lines into it with <C>onBeforeCompile</C>: noise that slightly varies the colour and bumps the surface normal. Every brick gets its own grain because the noise is seeded by its
                    instance number.
                </P>
                <Code file="canvas/snowMaterial.ts (trimmed)" highlight={['onBeforeCompile', 'gl_InstanceID']}>{`const mat = new THREE.MeshStandardMaterial(params);
mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\\n vNoiseP = position * vec3(2.2, 1.4, 1.0) + float(gl_InstanceID) * 3.17;');
    shader.fragmentShader = shader.fragmentShader
        .replace('#include <color_fragment>',
            '#include <color_fragment>\\n float snowGrain = snowH(vNoiseP);\\n diffuseColor.rgb *= 0.94 + 0.08 * snowGrain;')
        .replace('#include <normal_fragment_maps>', /* bump the normal by the grain’s slope */);
};`}</Code>
                <Callout>
                    This is the sweet spot for most projects: keep the built-in lighting and shadows, add one custom idea. Libraries like <C>three-custom-shader-material</C> (already installed in this
                    repo) make it even easier.
                </Callout>
                <Where files={[{ path: 'canvas/CrystalWorld.tsx' }, { path: 'canvas/Snow.tsx' }, { path: 'canvas/snowMaterial.ts' }, { path: 'utils/glsl.ts', note: 'noise' }]} />
            </Section>
        </article>
    );
}

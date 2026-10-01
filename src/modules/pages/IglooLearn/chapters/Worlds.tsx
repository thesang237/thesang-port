'use client';

import { useState } from 'react';

import { WORLD_COLORS, WORLD_NAMES, worldWeights } from '../content/iglooTimeline';
import CompositorLab from '../demos/CompositorLab';
import { Demo, Slider } from '../kit/controls';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

function SceneDial() {
    const [scene, setScene] = useState(1.35);
    const w = worldWeights(scene);
    const a = Math.floor(((scene % 4) + 4) % 4);
    return (
        <Demo title="The scene dial — one float picks two worlds" hint="Drag the dial. The whole number says which world is leaving; the fraction says how far the next one has arrived.">
            <div className="space-y-5 p-5">
                <Slider label="motion.scene" value={scene} min={0} max={4} step={0.01} onChange={setScene} />
                <div className="grid grid-cols-4 gap-2">
                    {WORLD_NAMES.map((n, i) => (
                        <div
                            key={n}
                            className="rounded-xl border p-3 transition-colors"
                            style={{
                                borderColor: w[i] > 0 ? `${WORLD_COLORS[i]}88` : 'var(--il-line)',
                                background: `${WORLD_COLORS[i]}${Math.round(w[i] * 40)
                                    .toString(16)
                                    .padStart(2, '0')}`,
                            }}
                        >
                            <div className="il-mono text-[10px]" style={{ color: w[i] > 0 ? WORLD_COLORS[i] : 'var(--il-faint)' }}>{`world ${i}`}</div>
                            <div className="text-[15px] font-semibold">{n}</div>
                            <div className="il-mono mt-2 text-[11px] tabular-nums text-[var(--il-dim)]">{`${Math.round(w[i] * 100)}%`}</div>
                            <div className="il-mono text-[10px] text-[var(--il-faint)]">{w[i] > 0 ? 'rendered' : 'skipped'}</div>
                        </div>
                    ))}
                </div>
                <div className="il-mono rounded-lg border border-[var(--il-line)] bg-black/25 p-3 text-[11px] leading-relaxed text-[var(--il-dim)]">
                    {`a = floor(${scene.toFixed(2)}) = ${a} → ${WORLD_NAMES[a]} · b = ${(a + 1) % 4} → ${WORLD_NAMES[(a + 1) % 4]} · t = ${(scene - Math.floor(scene)).toFixed(2)}  →  final = mix(A, B, t)`}
                </div>
            </div>
        </Demo>
    );
}

export default function WorldsChapter() {
    return (
        <article>
            <ChapterHead
                n="08"
                kicker="Transitions & post FX"
                title="Four worlds, one compositor pass."
                lead={
                    <>
                        How do you cross-fade between two completely different 3D scenes — with fog rolling in, the lens warping and a glitch at the seam? You film each scene to an offscreen image,
                        then let one full-screen shader mix the two images. That shader is also where all the “camera” effects live.
                    </>
                }
            />

            <Section id="precomp" n="8.1" title="Render to an image first">
                <P>
                    Normally three.js draws a scene straight to the screen. Instead, Igloo draws each visible world into a <Term k="rendertarget">render target</Term> — an invisible image the size of
                    the screen. Then a single rectangle covering the whole screen samples those images in a shader and outputs the final pixel.
                </P>
                <Lens>
                    Each world is a pre-comp. The compositor is the main comp with an adjustment layer on top: it blends the pre-comps and adds lens effects to everything at once. Because the blend
                    happens on flat images, the two worlds never need to know about each other.
                </Lens>
                <Code file="canvas/Compositor.tsx (the render loop, trimmed)" highlight={['setRenderTarget', 'gl.render(quad']}>{`useFrame((state, delta) => {
    const s = ((motion.scene % 4) + 4) % 4;
    const a = worlds[Math.floor(s)];            // leaving world
    const b = worlds[(Math.floor(s) + 1) % 4];  // arriving world
    const t = s - Math.floor(s);                // blend amount

    gl.setRenderTarget(rtA); gl.render(a.scene, a.camera);          // pre-comp A
    if (t > 0.0005) { gl.setRenderTarget(rtB); gl.render(b.scene, b.camera); } // pre-comp B (only mid-transition)
    gl.setRenderTarget(null);

    u.tA.value = rtA.texture; u.tB.value = rtB.texture; u.uT.value = t;
    u.uVel.value = damp(u.uVel.value, motion.velocity / 40, 6, delta);   // scroll speed → glitch
    gl.render(quad, quadCam);                                           // one full-screen pass
}, 1); // priority 1: take over R3F's own render`}</Code>
            </Section>

            <Section id="dial" n="8.2" title="One dial chooses the worlds">
                <P>
                    <C>motion.scene</C> is a single float the timeline moves from 0 to 4. The whole part picks the leaving world, the fraction is the blend. At 1.0 exactly, only the crystals render;
                    at 1.35, crystals are 65% and rings 35%. At 4 it wraps back to 0 — the loop.
                </P>
                <SceneDial />
            </Section>

            <Section id="lab" n="8.3" title="The compositor, effect by effect">
                <P>
                    Here is a working copy of Igloo’s compositor with two real worlds — the igloo and a crystal. Every effect is behind its own dial. Most of them are multiplied by{' '}
                    <C>mid = sin(t · π)</C>, which is 0 at both ends and 1 in the middle: the lens only goes wild <em>during</em> the transition, then settles.
                </P>
                <CompositorLab />
                <TryThis
                    items={[
                        'Turn noise dissolve off: a plain cross-fade looks like a slideshow. On: it looks like fog rolling through.',
                        'Set whiteout to 0 and watch the halfway point — you can see both worlds overlapping. Whiteout hides the seam in weather.',
                        'Pull scroll speed up. On Igloo this comes from Lenis velocity: flick the wheel and the image tears a little.',
                        'Drag detail overlay to 1: that is what happens behind the text when you open a portfolio item.',
                    ]}
                />
            </Section>

            <Section id="effects" n="8.4" title="What each effect is, in one line">
                <Table
                    head={['Effect', 'How', 'When']}
                    rows={[
                        ['Noise dissolve', 'Blend mask = smoothstep around drifting fbm noise', 'Transitions'],
                        ['Whiteout fog', 'mix(colour, fog grey, mid × noise)', 'Mid-transition'],
                        ['Barrel warp', 'uv += c × |c|² × mid — pushes the edges outward', 'Mid-transition'],
                        ['Glitch bands', 'Random rows shift sideways, re-rolled 14× per second', 'Mid-transition, fast scroll'],
                        ['Chromatic aberration', 'Sample R, G, B at slightly different offsets from centre', 'Mid-transition, scroll, detail'],
                        ['Rainbow streaks', 'Stretched noise × cosine palette', 'Mid-transition'],
                        ['Bloom', 'Bright parts of lower-resolution mip levels, added back', 'Always'],
                        ['Vignette', 'Darken by distance from centre (smoothstep)', 'Always'],
                        ['Grain', 'Random ±1.75% per pixel, re-seeded every frame', 'Always'],
                        ['Detail blur', 'Blend to a dark slate + a very blurred mip of the scene', 'Portfolio overlay'],
                    ]}
                />
                <KeyIdea>
                    Post effects multiplied by sin(t·π) only exist during a transition. The rest of the time the image is calm — that contrast is what makes the transition feel like an event.
                </KeyIdea>
            </Section>

            <Section id="cheap" n="8.5" title="Why it’s fast">
                <Table
                    head={['Trick', 'Saves']}
                    rows={[
                        ['Only the one or two visible worlds are rendered', 'Up to half the GPU work, every frame'],
                        ['Worlds with weight 0 skip their useFrame logic entirely', 'All CPU work for hidden scenes'],
                        ['Bloom from mipmaps instead of a blur pass', 'Several extra full-screen passes'],
                        ['Canvas antialias off; MSAA (samples: 4) on the render targets', 'Anti-aliasing happens once, where it matters'],
                        ['HalfFloat targets', 'HDR values (> 1) survive until the final pass for bloom'],
                        ['Everything in one fragment shader', 'One pass instead of an effect-composer chain'],
                    ]}
                />
                <Callout>
                    The mipmap bloom is a lovely hack: a mipmap is a chain of half-size copies of the image that the GPU generates almost for free. Level 3 is 1/8 size — effectively a blur. Read it
                    back, keep only what’s brighter than white, add it on top.
                </Callout>
                <Where files={[{ path: 'canvas/Compositor.tsx' }, { path: 'store.ts', note: 'worldWeight()' }, { path: 'canvas/Experience.tsx', note: 'antialias: false' }]} />
            </Section>
        </article>
    );
}

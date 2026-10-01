'use client';

import { ACTS } from '../content/iglooTimeline';
import LayerStack from '../demos/LayerStack';
import PipelineDiagram from '../demos/PipelineDiagram';
import TimelineXRay from '../demos/TimelineXRay';
import { C, Callout, ChapterHead, Code, Grid, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function MapChapter() {
    return (
        <article>
            <ChapterHead
                n="00"
                kicker="The map"
                title="One scroll bar runs the whole show."
                lead={
                    <>
                        Before learning any single effect, get the big picture. The Igloo page looks like a film with four scenes. Under the hood it is one number — how far you have scrolled — feeding
                        one timeline, which sets a dozen dials that every 3D object reads.
                    </>
                }
            />

            <Section id="one-sentence" n="0.1" title="The one-sentence version">
                <P>
                    The page is <strong>16 screens</strong> of invisible scroll track. Your scroll position becomes a <Term k="progress">playhead</Term> from 0 to 16. A single master{' '}
                    <Term k="timeline">timeline</Term> — think of an After Effects comp — turns that playhead into about twelve numbers, like <C>explode</C>, <C>crystals</C> or <C>dive</C>. Four 3D
                    worlds and a few text layers do nothing but <em>read those numbers every frame</em> and draw themselves accordingly.
                </P>
                <KeyIdea>Scroll doesn’t animate things. Scroll moves a playhead; the playhead turns dials; everything else reads the dials.</KeyIdea>
                <Lens>
                    You already know this model. In a Figma prototype, a single “scroll” can drive Smart Animate between frames. In After Effects, dragging the playhead scrubs every layer at once. The
                    Igloo page is that playhead, bound to your scroll wheel.
                </Lens>
            </Section>

            <Section id="pipeline" n="0.2" title="The pipeline, from wheel to pixels">
                <P>
                    Every frame (60 times a second) the same chain runs. Hover the boxes: each one is a technique with its own chapter later. Notice the dashed line — one shared clock ticks everything
                    so the text, the scroll and the 3D never drift out of sync.
                </P>
                <PipelineDiagram />
            </Section>

            <Section id="storyboard" n="0.3" title="The storyboard: five acts">
                <P>
                    Designers of pages like this storyboard in <strong>screens of scroll</strong>, not seconds. Here is the Igloo storyboard, measured in viewport heights. Each act is a separate 3D
                    “world” with its own scene and camera; the last act flies back to the first so the page loops forever.
                </P>
                <Grid cols={3}>
                    {ACTS.map((a) => (
                        <div key={a.n} className="rounded-2xl border border-[var(--il-line)] bg-[var(--il-panel)] p-5">
                            <div className="il-mono mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.14em]">
                                <span style={{ color: a.color }}>{`Act ${a.n}`}</span>
                                <span className="text-[var(--il-faint)]">{`${a.from} → ${a.to} screens`}</span>
                            </div>
                            <div className="mb-2 text-[18px] font-semibold tracking-[-0.01em]">{a.name}</div>
                            <p className="mb-3 text-[13.5px] leading-relaxed text-[var(--il-dim)]">{a.see}</p>
                            <div className="h-1 overflow-hidden rounded-full bg-white/5">
                                <div className="h-full rounded-full" style={{ marginLeft: `${(a.from / 16) * 100}%`, width: `${((a.to - a.from) / 16) * 100}%`, background: a.color }} />
                            </div>
                        </div>
                    ))}
                </Grid>
            </Section>

            <Section id="xray" n="0.4" title="X-ray: the real timeline, scrubbable">
                <P>
                    This is the actual choreography, transcribed from <C>IglooPage.tsx</C>. Rows in white are <strong>dials</strong> read by the 3D worlds; italic rows are <strong>HTML layers</strong>{' '}
                    animated on the same timeline. Notice how acts overlap: the crystals start rising (1.6) before the igloo has fully left (2.3). Overlaps are what make it feel like one continuous
                    shot instead of slides.
                </P>
                <TimelineXRay />
                <TryThis
                    items={[
                        'Park the playhead at 1.8. Two worlds are rendering at once — that is the cross-fade moment.',
                        'Find the three “snaps” of the crystal carousel (2.4, 3.95, 5.5). Each uses power3.inOut, so the carousel parks on each crystal.',
                        'Load the live page and scrub. Compare what you see with the dial values.',
                    ]}
                />
            </Section>

            <Section id="layers" n="0.5" title="The layers: a fixed stack over one canvas">
                <P>
                    Nothing on the page actually scrolls past you. Every visible layer is <C>position: fixed</C>. The only thing that moves is an empty, very tall div — it gives the browser a
                    scrollbar to track. This is the most common structure for “scrollytelling” WebGL sites.
                </P>
                <LayerStack />
                <Code file="IglooPage.tsx (simplified)">{`<ReactLenis root options={{ lerp: 0.085, infinite: true }}>
  <main className="ig-root">
    <Experience />     {/* fixed <canvas>: all 3D worlds + compositor */}
    <Scroller />       {/* empty div, (16 + 1) × 100vh tall — the scroll track */}
    <Inputs />         {/* pointer + click listeners, no DOM */}

    <Hero />           {/* fixed text layers, z-10 … z-40 */}
    <CrystalHud />
    <SocialCarousel />
    <Chrome />
    <DetailOverlay />
    <Loader />
  </main>
</ReactLenis>`}</Code>
            </Section>

            <Section id="vocab" n="0.6" title="Vocabulary bridge: design words ↔ code words">
                <P>Most of the “scary” words are things you already use under another name. Hover any dotted word in this guide for a plain definition.</P>
                <Table
                    head={['You say', 'The code says', 'What it is']}
                    mono={[1]}
                    rows={[
                        ['Composition / timeline', 'gsap.timeline()', 'A container of animations placed at exact times.'],
                        ['Two keyframes + curve', 'tween: tl.to(obj, { x: 1, ease })', 'Animate values from A to B over a duration.'],
                        ['Playhead', 'progress (0 → 1)', 'Where you are in the animation, as a percentage.'],
                        ['Graph editor curve', 'ease: "expo.out"', 'How speed changes over the tween.'],
                        ['Artboard', 'THREE.Scene', 'The container everything sits in.'],
                        ['Camera / viewport', 'PerspectiveCamera', 'What you see, and with which lens.'],
                        ['Component instances', 'InstancedMesh', 'One master shape drawn many times, each with overrides.'],
                        ['Pre-comp', 'render target', 'Render something to an image, use it later.'],
                        ['Adjustment layer', 'post-processing pass', 'An effect applied to the whole finished frame.'],
                        ['Expression / blend mode', 'shader (GLSL)', 'A tiny program that computes every pixel.'],
                        ['Design token', 'uniform', 'A value fed into a shader, the same for every pixel.'],
                        ['Smart Animate', 'lerp / damp', 'Blend smoothly between two states.'],
                        ['Prototype trigger', 'event listener', '“On hover / on click / on scroll, do …”'],
                    ]}
                />
            </Section>

            <Section id="files" n="0.7" title="Where everything lives">
                <P>
                    The source is small — about 4,600 lines in <C>src/modules/pages/Igloo</C>. You will not need to read it all; each chapter points at the exact file. Here is the map.
                </P>
                <Code file="src/modules/pages/Igloo/" lang="bash">{`IglooPage.tsx        # Lenis setup, the master scroll timeline, pointer input
store.ts             # "motion" dials (plain object) + UI state (zustand)
data.ts              # copy, portfolio items, TIMELINE.total = 16
tweaks.ts            # live-tunable parameters for the Tweak panel
canvas/
  Experience.tsx     # the <Canvas>, environment light, mounts the worlds
  useWorld.ts        # each world = its own scene + camera, registered by index
  IglooWorld.tsx     # act 0: instanced bricks, terrain, inner light, intro network
  CrystalWorld.tsx   # act 1: ice crystal shader, carousel, HUD projection
  RingsWorld.tsx     # act 2: lathe-built ring segments, core, dive tunnel
  ParticleWorld.tsx  # act 3: 65k particles, pedestal, input → simulation
  colonySim.ts       # GPGPU physics (springs, energy, cursor, shockwave)
  shapes.ts          # penguin / X / M / cloud sampled into points
  Compositor.tsx     # blends two worlds + all post effects in one pass
  Snow.tsx, snowMaterial.ts
ui/
  Hero, Chrome, CrystalHud, DetailOverlay, SocialCarousel, Loader, TweakPanel
  scramble.ts        # the text "decode" helpers
utils/
  math.ts            # clamp, lerp, damp, smoothstep, eases, seeded rng, noise
  glsl.ts            # hash + simplex noise for shaders
  sound.ts           # generated wind, drones and UI ticks (Web Audio)`}</Code>
                <Where files={[{ path: 'IglooPage.tsx', note: 'start here' }, { path: 'store.ts' }, { path: 'canvas/Compositor.tsx' }]} />
                <Callout tone="meta">
                    This guide runs on the same stack: Lenis for smooth scroll, GSAP’s ticker as the single clock, ScrollTrigger for the scroll demos and vanilla three.js for the 3D ones.
                </Callout>
            </Section>
        </article>
    );
}

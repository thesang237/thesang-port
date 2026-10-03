'use client';

import LogoWipeLab from '../demos/LogoWipeLab';
import SheetAnatomy from '../demos/SheetAnatomy';
import WordmarkLab from '../demos/WordmarkLab';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function Flipbooks() {
    return (
        <>
            <ChapterHead
                n="09"
                kicker="Flipbooks & wipes"
                title="Hand-made animation, played from one image."
                lead={
                    <>
                        Not everything on /kpr is code-driven motion. Hair blowing, energy beams, the barcode wipe and the keeper symbol were animated frame by frame by artists, then packed into
                        sprite sheets. The page plays them like flipbooks.
                    </>
                }
            />

            <Section id="sheets" n="09.1" title="Many frames, one picture">
                <P>
                    A <Term k="flipbook">flipbook</Term> is a grid of frames saved as one big image. Loading one image is far cheaper than loading a hundred, and the graphics card keeps it in memory
                    once. To animate, the player shows one rectangle of the sheet at a time; the <Term k="atlas">atlas</Term> JSON written by the packing tool lists where each frame sits.
                </P>
                <SheetAnatomy />
                <Code file="src/modules/pages/Kpr/gl/SpriteSheet.ts (trimmed)" highlight={['rect.xy + vUv * rect.zw', 'setFrame']}>
                    {`// fragment shader: sample only this frame's rectangle of the sheet
vec4 c = texture2D(map, rect.xy + vUv * rect.zw);

// each frame: pick the rectangle (and sheet, for books split over several images)
setFrame(i) {
    const f = book.frames[i % book.frames.length];
    mat.uniforms.map.value = book.textures[f.sheet];
    mat.uniforms.rect.value.copy(f.rect);
},
setTime(seconds) { this.setFrame((seconds + offset) * book.fps); }`}
                </Code>
                <Table
                    mono={[0, 2]}
                    head={['Flipbook', 'Plays on', 'Sheets · fps']}
                    rows={[
                        ['maleHair / femaleHair / femaleCloth', 'The two figures in the story painting', '2–3 · 20'],
                        ['kai, ship, beam', 'The Keep (beams added on top)', '3–5 · 24'],
                        ['energyLeft / energyRight', 'Factions', '2 · 24'],
                        ['magic, beam', 'The World', '1–5 · 24'],
                        ['logo-anim-low-res', 'The barcode → keeper symbol wipe', '1 · 48'],
                        ['header-sprite', 'The opening barcode', '1 · 56'],
                    ]}
                />
                <Lens>
                    It’s an image sequence exported from After Effects as a contact sheet. The atlas JSON is the list of crop rectangles. Effect planes inside the painted scenes have no paint of their
                    own: their material is swapped for a flipbook player.
                </Lens>
                <KeyIdea>A flipbook is one image and a list of rectangles; animating means moving the rectangle.</KeyIdea>
            </Section>

            <Section id="wipe" n="09.2" title="The logo wipe: crisp from a tiny sheet">
                <P>
                    Late in the story, rows of pills and crosses flood the screen, drop out, and leave the keeper symbol, which then rides the story card as it shrinks and turns. The frames are only
                    220 × 124 px, stretched over the whole screen. Drawn as-is they’d be a blur. The shader <Term k="threshold">thresholds</Term> the soft edge instead, so every shape stays sharp at
                    any size.
                </P>
                <LogoWipeLab />
                <Code file="src/modules/pages/Kpr/gl/LogoWipe.ts + gl/Stage.tsx" highlight={['smoothstep(0.5 - uSoft', 'armed ?']}>
                    {`// fragment: turn the soft low-res alpha into a crisp edge about 1.6 screen px wide
float a = texture2D(uMap, frameUv).a;
a = smoothstep(0.5 - uSoft, 0.5 + uSoft, a);

// Stage.tsx: its own clock once the film passes 8.35, holding on the symbol (frame 92)
const armed = t >= W.glyph[0];
logoClock.frame = armed
    ? Math.min(LOGO_LAST, logoClock.frame + film.dt * 48)
    : Math.max(0, logoClock.frame - film.dt * 48 * 2.5);  // scroll back: rewind 2.5× faster
b.logo.update(logoClock.frame, vw, vh, logoRide.x, 0, logoRide.squash, …);`}
                </Code>
                <TryThis
                    items={[
                        'Turn off “crisp threshold”: the pills turn to mush. Same frames, same size, only the edge treatment changed.',
                        'Switch to “scroll-scrubbed” and stop half way: the wipe freezes mid-beat, which looks broken. That is why the page lets it finish on its own.',
                        'With “own clock”, drag past 8.35 and straight back: it rewinds quickly instead of snapping off.',
                        'Drag “squash” toward 0: that is the symbol turning with the story card (|cos ry|).',
                    ]}
                />
                <Callout tone="tip">Reduced motion skips the beat entirely: the symbol is shown on its last frame as soon as the film passes 8.35.</Callout>
                <KeyIdea>Upscale low-res shapes with a threshold, not with blur; let short beats finish on their own clock.</KeyIdea>
            </Section>

            <Section id="opening" n="09.3" title="The opening: build, open, break">
                <P>
                    After “enter”, the black barcode (the header sprite) fills the screen while the KPR wordmark builds left to right in slanted pieces. A slit opens in the middle and widens into the
                    girl painting. Over the painting the letters turn white, because a white copy of the logo is clipped to the opening card. Then the logo breaks apart and the landing words arrive.
                    All of it takes about 4.3 seconds.
                </P>
                <WordmarkLab />
                <Code file="src/modules/pages/Kpr/dom/hud/Intro.tsx (trimmed)" highlight={['on: fx * 0.7', 'clipPath']}>
                    {`// the wordmark is cut into slanted pieces (an SVG mask), each with a moment to appear and to vanish
for (let c = 0; c < COLS; c++)
    for (let r = 0; r < ROWS; r++)
        out.push({ x, y, on: fx * 0.7 + rnd() * 0.3, off: rnd() * 0.75 + (1 - fx) * 0.25 });

// timeline (s from the click): barcode, logo build, card opens, logo breaks, page arrives
const T = { barcode: 0.05, build: [0.3, 1.5], open: [2.1, 3.45], breakUp: [3.2, 4.2], enter: 4.15 };

// the white copy only shows over the opening card (its rect comes from the choreography)
white.style.clipPath = \`inset(\${top}px \${right}px \${bottom}px \${left}px)\`;`}
                </Code>
                <TryThis
                    items={[
                        'Set the columns to 4 and rows to 1: big chunky slabs, and you can see the left-to-right order.',
                        'Drag “card opens” slowly: the letters inside the card turn white as the card passes behind them.',
                        'Set slant to 0: square pieces look like a loading grid. The 28° slant ties the logo to the cards’ diagonal cuts.',
                    ]}
                />
                <P>
                    The real one uses the KPR wordmark path from the reference; this demo uses a neutral word. The card opening is the same <C>introRect</C> curve that drives the hero card in WebGL,
                    so the DOM clip and the canvas card line up exactly.
                </P>
                <KeyIdea>One rectangle drives both the WebGL card and the DOM clip, so the two layers stay in register.</KeyIdea>
                <Where
                    files={[
                        { path: 'Kpr/gl/SpriteSheet.ts' },
                        { path: 'Kpr/gl/LogoWipe.ts' },
                        { path: 'Kpr/gl/loaders.ts', note: 'loadAtlas' },
                        { path: 'Kpr/dom/hud/Intro.tsx', note: 'the opening' },
                        { path: 'Kpr/debug/FlipDebug.tsx', note: '/kpr?debug=flip&sheets=kai-0' },
                    ]}
                />
            </Section>
        </>
    );
}

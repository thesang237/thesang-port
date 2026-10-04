'use client';

import MsdfXray from '../demos/MsdfXray';
import RevealLab from '../demos/RevealLab';
import { C, Callout, Card, ChapterHead, Code, Grid, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function Titles() {
    return (
        <>
            <ChapterHead
                n="04"
                kicker="GPU titles"
                title="The letters are drawn from a map of distances."
                lead={
                    <>
                        The big titles on /corn trace their own outlines, fill from grey to white and burst into dots under your pointer. HTML text can’t do any of that. So the titles are drawn by the
                        GPU from a special font image, while a hidden HTML heading underneath keeps the layout and the accessibility honest.
                    </>
                }
            />

            <Section id="why" n="01 · Why" title="Why not just use HTML text?">
                <Grid>
                    <Card kicker="HTML text" title="Crisp, selectable, accessible">
                        Perfect for reading. But a letter is one solid shape: you can’t draw only its outline, reveal the outline along its path, or melt part of a letter into floating dots.
                    </Card>
                    <Card kicker="This page" title="HTML for meaning, WebGL for the look" tint>
                        A transparent heading in the same face does layout, wrapping and screen readers. The engine measures it and draws a WebGL title on top, where every pixel of every letter is
                        programmable.
                    </Card>
                </Grid>
                <KeyIdea>HTML keeps the meaning (layout, selection, screen readers); WebGL takes over the look.</KeyIdea>
            </Section>

            <Section id="msdf" n="02 · The atlas" title="A font made of distances">
                <P>
                    The headline face lives in an <Term k="atlas">atlas</Term>: one image with every letter. It isn’t a picture of the letters, it’s an <Term k="msdf">MSDF</Term>: each pixel stores
                    how far it is from the letter’s edge, in three colour channels. The median of the three gives the signed distance (above 0.5 inside, below outside). Because the edge is rebuilt
                    from distances, a 512 px image stays razor sharp on a 4K screen, and the same data gives you the fill, a hairline outline, a bolder or thinner weight.
                </P>
                <MsdfXray />
                <Code file="engine/text/TitleText.ts · quadFrag (first lines)" lang="glsl" highlight={['float sd', 'float line']}>
                    {`float median(vec3 c) { return max(min(c.r, c.g), min(max(c.r, c.g), c.b)); }
float sd = (median(texture2D(uAtlas, vUv).rgb) - 0.5) * uPxRange;  // px from the edge, + inside
float fill = clamp(sd + 0.5, 0.0, 1.0);                             // 1 px soft edge
float line = 1.0 - smoothstep(0.35, 1.25, abs(sd));                 // ≈ 1.5 px hairline`}
                </Code>
                <TryThis
                    items={[
                        <>Zoom to 14× in “fill”, then switch to “bitmap”: same atlas, but sampled like an ordinary image the edge becomes stairs.</>,
                        <>Push weight to +0.2: a bold face from the same file. That’s how one atlas can serve several weights.</>,
                        <>Open “atlas” on the % sign: where the three channels disagree you see colour, and that’s what keeps the corners sharp.</>,
                    ]}
                />
                <KeyIdea>An MSDF stores distance to the edge; threshold it at 0.5 for a crisp fill, keep a thin band around 0.5 for an outline.</KeyIdea>
            </Section>

            <Section id="anchor" n="03 · The anchor" title="The browser lays it out, WebGL draws it">
                <P>
                    Every title is a real heading in <C>dom/Story.tsx</C>, set in a vector copy of the same face and coloured transparent: a <Term k="anchor">DOM anchor</Term>. On every resize the
                    engine reads its position and font size, rebuilds the WebGL letters at the matching cap height and places them so the caps line up exactly. The font size is the cap height divided
                    by 0.7 (the face’s cap is 700/1000 em) and the cap top sits 0.169 cap below the line top.
                </P>
                <Code file="engine/Engine.ts · measureTitles() (trimmed)" highlight={['getBoundingClientRect', '0.169']}>
                    {`for (const slot of this.titles) {
    slot.anchor ??= document.querySelector(slot.selector);   // [data-gl-title="3"]
    const cap = slot.cap * (this.w / 1920);                   // 68 px at 1920 wide
    slot.title.build(cap, this.dpr);                          // letters at that size
    const r = slot.anchor.getBoundingClientRect();
    const x = slot.center ? r.left + (r.width - slot.title.layout.width) / 2 : r.left;
    slot.baseY = r.top + 0.169 * cap;                         // cap top inside the line box
    slot.title.setOrigin(x, slot.baseY);
}`}
                </Code>
                <Lens>
                    A hidden guide layer in Figma that the artwork is snapped to. Move the guide (change the copy, resize the window) and the artwork follows; delete the artwork (no WebGL) and the
                    text is still there.
                </Lens>
                <Callout tone="meta">
                    The hero at the top of this guide works the same way: “Grainline, decoded.” is a transparent <C>h1</C>, and the page’s own TitleText is drawn on it with <C>placeOnAnchor()</C>. If
                    WebGL fails, the heading simply becomes visible.
                </Callout>
                <KeyIdea>A transparent heading in the same face is the source of truth for position and size; the GL title is placed on it at every resize.</KeyIdea>
            </Section>

            <Section id="reveal" n="04 · The reveal" title="The outline traces, then the fill arrives">
                <P>
                    Each letter’s outline appears to draw itself. A second image, <C>gradient-map.png</C>, stores for every outline pixel how far along the letter’s path it is (0 → 1). The shader
                    shows the hairline where that value is below the progress. Then the fill fades in from grey to white while the outline fades out. Timing is set in seconds, not scroll: a title
                    starts once its chapter is about 70 % arrived and plays at its own pace.
                </P>
                <RevealLab />
                <Code file="engine/text/TitleText.ts · quadFrag (reveal)" lang="glsl" highlight={['drawn =', 'mix(vec3(0.62)']}>
                    {`float lp = letter(uDraw);                                  // this letter's own progress (stagger)
float drawn = smoothstep(pathPos - 0.02, pathPos, lp) * step(0.001, lp);
float lf = letter(uFill);
float body = fill * lf * (1.0 - open);                     // open = the pointer field (chapter 05)
float outline = max(line * drawn * (1.0 - lf * lf), fieldLine);
vec3 col = mix(vec3(0.62), vec3(1.0), smoothstep(0.35, 1.0, lf));   // grey → white`}
                </Code>
                <Table
                    head={['Setting', 'Value', 'What it feels like']}
                    mono={[1]}
                    rows={[
                        ['Wait', '0.45 s', 'The move lands before the title starts'],
                        ['Outline trace', '2.4 s, sine in-out', 'Slow, hand-drawn, no hard start or stop'],
                        ['Fill', 'from 1.9 s over 1.6 s', 'Overlaps the trace’s end: one gesture, not two steps'],
                        ['Stagger', '0 (all letters together)', 'Calm and slow (a later pass dropped the 0.12 left-to-right stagger)'],
                    ]}
                />
                <TryThis
                    items={[
                        <>Set the stagger to 0.12: the earlier left-to-right version. Livelier, but it fights the slow camera moves.</>,
                        <>Set “fill starts at” beyond the trace (3 s): the outline finishes, pauses, then fills. Two separate events instead of one.</>,
                        <>Switch the easing to linear and scrub: the trace starts and stops abruptly.</>,
                        <>Show the anchor and change the title: the red heading and the GL letters always match.</>,
                    ]}
                />
                <KeyIdea>Outline where path position &lt; progress, then fill grey → white: 0.45 s wait, 2.4 s trace, fill from 1.9 s over 1.6 s.</KeyIdea>
            </Section>

            <Section id="layout" n="05 · Layout" title="Letters placed from a table">
                <P>
                    The atlas comes with a table (BMFont JSON): for each character, its rectangle in the image, its offset and how far to advance the pen. <C>layoutLines()</C> walks the text with that
                    table and produces one quad per letter; all the letters of a title are one <Term k="instancing">instanced</Term> mesh, one draw call. The headline atlas actually shipped without
                    its table, so the clone rebuilt it by measuring the reference: ink boxes from the atlas, spacing from the hero title.
                </P>
                <Code file="engine/text/msdf.ts · layoutLines() (trimmed)" highlight={['pen += ch.xadvance']}>
                    {`const s = capPx / font.cap;                        // atlas px → screen px
for (const chr of text) {
    const ch = font.chars.get(chr.charCodeAt(0));
    glyphs.push({
        x: (pen + ch.xoffset) * s,
        y: line * lineGap * capPx + (ch.yoffset - (font.base - font.cap)) * s,
        w: ch.width * s, h: ch.height * s,
        uv: [ch.x / size, ch.y / size, (ch.x + ch.width) / size, (ch.y + ch.height) / size],
    });
    pen += ch.xadvance;                                  // move the pen to the next letter
}`}
                </Code>
                <Callout tone="warn" title="A limit to design around">
                    The rebuilt face only has A–Z, 0–9 and . , ! ? % $ - [ ]. No lowercase, no apostrophes. The chapter titles in this guide follow the same rule because they use the same face.
                </Callout>
                <KeyIdea>A metrics table + one quad per letter in one instanced mesh: a whole title is a single draw call.</KeyIdea>
                <Where
                    files={[
                        { path: 'engine/text/msdf.ts', note: 'load, layout, sample points' },
                        { path: 'engine/text/TitleText.ts', note: 'shaders, reveal' },
                        { path: 'engine/Engine.ts', note: 'measureTitles, updateTitles' },
                        { path: 'dom/Story.tsx', note: 'the anchors' },
                        { path: 'public/corn/tex/gradient-map.png', note: 'path positions' },
                    ]}
                />
            </Section>
        </>
    );
}

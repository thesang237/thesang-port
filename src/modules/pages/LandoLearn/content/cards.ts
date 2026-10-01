import type { ChapterId } from './chapters';

export type Flashcard = { q: string; a: string };

/** "Lock it in" cards at the end of every chapter — pooled for the final quiz. */
export const CARDS: Record<ChapterId, Flashcard[]> = {
    map: [
        {
            q: 'What drives almost every animation on the page?',
            a: 'The scroll position. Lenis smooths it, GSAP’s ticker is the one clock, ScrollTrigger maps scroll ranges onto timelines, and the timelines write CSS, CSS variables or WebGL uniforms.',
        },
        {
            q: 'Why is heroState a plain object instead of React state?',
            a: 'Scroll changes it 60 times a second. GSAP writes it and the WebGL frame loop reads it — no React re-render in between.',
        },
        {
            q: 'How does the hero know the preloader has finished?',
            a: 'The overlay fires a custom window event, “ln:enter”, as the “4” window passes scale 1.3; the hero listens and plays its block reveals.',
        },
        { q: 'Which layer sits on top of everything, and why?', a: 'The lime overlay (preloader + route transition). It must cover the header and menu while the route swaps underneath.' },
    ],
    timing: [
        { q: 'At 30 fps, how long is one frame, and what does “grows in 7 frames” mean in seconds?', a: '1/30 s ≈ 0.033 s. Seven frames ≈ 0.23 s — the block reveal’s GROW is 0.24 s.' },
        {
            q: 'The “4” grew 41 → 85 → 182 → 261 → 405 … px per frame. Which ease fits, and why?',
            a: 'expo.in. Each frame multiplies the size by roughly the same factor — that’s exponential growth, which is exactly what expo.in produces on a scale.',
        },
        {
            q: 'Why does the menu open with power1.out but close with power1.in?',
            a: 'Things that arrive should decelerate into place (out); things that leave should accelerate away (in). Same distance, opposite feel.',
        },
        {
            q: 'What does an SSIM of 0.65 between clone and reference tell you?',
            a: 'Layout, timing and structure match well; the gap is mostly the placeholder 3D renders versus real photos, not the motion.',
        },
    ],
    smooth: [
        {
            q: 'What does lerp 0.1 mean for smooth scroll?',
            a: 'Every frame the visible scroll moves 10% of the remaining distance to the target. At 60 fps that leaves ×0.55 of the distance after 0.1 s — the value measured in the video.',
        },
        {
            q: 'Why drive Lenis from gsap.ticker instead of its own requestAnimationFrame?',
            a: 'One clock. Scroll, ScrollTrigger and every tween update in the same frame, in the same order, so pinned scenes never lag a frame behind.',
        },
        { q: 'What does the menu do to smooth scroll when it opens?', a: 'lenis.stop() — the page can’t scroll behind the open menu. lenis.start() when it closes.' },
        { q: 'What happens to Lenis under reduced motion?', a: 'smoothWheel is turned off: the wheel scrolls natively with no easing, but ScrollTrigger still runs through Lenis.' },
    ],
    reveal: [
        {
            q: 'Describe the block reveal in three beats.',
            a: 'A solid block grows across the line from the left (0.24 s), the text switches on underneath, the block retracts toward the right (0.30 s) after a 0.05 s hold.',
        },
        { q: 'What single change makes the block leave to the right instead of back to the left?', a: 'Flipping transform-origin from “0% 50%” to “100% 50%” before shrinking scaleX back to 0.' },
        { q: 'Lime or dark block — how does the site choose?', a: 'By section: lime on dark sections, near-black #1E1F1A on light sections. It’s just the color prop.' },
        { q: 'What does perLine do?', a: 'Gives every line its own ScrollTrigger, so a tall paragraph like the manifesto reveals line by line as each line enters, not all at once.' },
    ],
    micro: [
        {
            q: 'How does rolling text work?',
            a: 'Every character is a column holding two copies in a one-line-tall window. On hover each column slides up 100% (stagger 0.018 s, 0.42 s power3.inOut) to show the copy.',
        },
        {
            q: 'How does the header know whether to be light or dark?',
            a: 'Each section carries data-header="light|dark". On every scroll the header finds the section under y = 50 px and takes its theme.',
        },
        { q: 'Why is the marquee content rendered twice?', a: 'The track moves left and wraps at exactly half its width; the second copy fills the gap, so the loop is seamless.' },
        {
            q: 'Why does the header also check its theme on a 250 ms interval?',
            a: 'Inside pinned sections the colour changes while the section itself doesn’t move, so scroll events alone can miss it.',
        },
    ],
    menu: [
        { q: 'How is the curved bottom edge made?', a: 'An SVG path with a quadratic curve (Q) in a stretched viewBox, scaled on Y from the top. The curve scales with the panel.' },
        {
            q: 'Name the opening order of the menu.',
            a: 'Panel (0) → photos clip in (0.16, stagger 0.06) → contours fade (0.2) → nav items rise (0.38, stagger 0.075) → strike + emblem (0.55) → block reveals (0.57).',
        },
        {
            q: 'Why is closing not the opening played backwards?',
            a: 'It reverses the order (text first, panel last) but uses ease-in and shorter times, so it leaves quickly. Reversing would make the panel wait for everything.',
        },
        {
            q: 'How do the WebGL photos know how far the clip reveal has got?',
            a: 'The timeline tweens a CSS variable --clip on each DOM slot; the WebGL frame reads it and discards pixels below that line.',
        },
    ],
    pinned: [
        {
            q: 'How far do you scroll during the hero → card pin, and what changes?',
            a: '780 px. The card goes from full screen to 630 × 405, the image scales 1 → 0.68 and darkens toward #22281C, marquee rows drift, the signature draws.',
        },
        {
            q: 'Why darken with p^1.3 × 0.87 instead of p?',
            a: 'The power curve keeps the start bright and makes most of the darkening happen late; 0.87 stops short of solid green so the image never disappears.',
        },
        { q: 'What does scrub: 0.35 add?', a: '0.35 s of catch-up: the scene eases toward the scroll position instead of snapping to it, on top of Lenis’s own smoothing.' },
        {
            q: 'How are the signature strokes sequenced?',
            a: 'Each path gets its own window inside the pinned timeline: starts at 0.30, 0.72, 0.90, 0.97 — later strokes are shorter, like a real pen.',
        },
    ],
    gallery: [
        {
            q: 'How does a vertical scroll become horizontal movement?',
            a: 'The section pins for 2500 px while a scrubbed tween moves the track’s x from 0 to −3060 px. Scroll distance in, sideways distance out.',
        },
        { q: 'What does data-depth="1.02" do?', a: 'That card moves 2% faster than the track (x × (depth − 1) extra), a subtle parallax that makes the flat row feel layered.' },
        {
            q: 'Why does the gallery use its own reveal check instead of ScrollTrigger?',
            a: 'Items move sideways inside a pinned section, so their vertical position never changes. The check compares each item’s x with 96% of the viewport width.',
        },
        {
            q: 'How does the background go from dark to light?',
            a: 'Inside onUpdate: f = 1 − (1 − t)^1.8 over the travel, and each RGB channel is mixed from #22281C to #F1F3E8 with f. The header theme flips at f > 0.4.',
        },
    ],
    webgl: [
        {
            q: 'How does a WebGL plane line up with a DOM element?',
            a: 'Every frame it reads the element’s getBoundingClientRect() and sets the mesh position and scale in pixel units (orthographic camera, 1 unit = 1 CSS px).',
        },
        {
            q: 'Why keep a DOM <img> under the WebGL plane?',
            a: 'It’s the fallback and the first paint. Once the first WebGL frame renders, data-gl="1" hides it — no blank flash, and it still works without WebGL.',
        },
        { q: 'What does the WebGLCanvas do if WebGPU is missing?', a: 'WebGPURenderer falls back to its WebGL2 backend automatically; the TSL materials compile to either.' },
        { q: 'How does the shader do “object-fit: cover”?', a: 'It computes where the image sits in pixels (imgOrigin, imgSize) and turns each pixel’s position into a UV inside that box.' },
    ],
    shaders: [
        {
            q: 'Where does the trail reveal’s shape come from?',
            a: 'A quarter-resolution 2D canvas. Soft white dots are stamped along the pointer path; every frame a translucent black fill fades them. The canvas is a texture.',
        },
        { q: 'Why add noise before the threshold?', a: 'smoothstep(0.40, 0.43, trail + noise × 0.17) turns the soft blob into a crisp but wobbly, liquid edge that keeps moving over time.' },
        { q: 'How does the duotone photo work?', a: 'Compute luma, map it between two colours (#283024 → #D2D6C3), then mix toward the real colour by an “active” value tweened on hover.' },
        { q: 'Why does the ripple peak mid-transition?', a: 'Its strength is a(1 − a) × 4: zero at both ends (0 and 1), maximum 1 at a = 0.5.' },
    ],
    transitions: [
        {
            q: 'How does the “4” window reveal the page?',
            a: 'An SVG mask: a white rectangle (shows lime) with a black “4” (hides lime). Scaling the black glyph from tiny to 60× opens a window in the lime.',
        },
        { q: 'Why scale from S1/1024 to S1 with expo.in?', a: 'The size doubles at a steady rate (10 doublings), so the zoom feels constant-speed to the eye and punches through at the end.' },
        {
            q: 'List the transition steps in order.',
            a: 'exit (lime covers) → router.push → wait for the pathname to change + 2 frames → reset scroll + ScrollTrigger.refresh() → enter (window grows).',
        },
        {
            q: 'Why wait two animation frames after the pathname changes?',
            a: 'The new page must mount and lay out before anything is measured or revealed; revealing earlier shows a half-built page or wrong pin positions.',
        },
    ],
    perf: [
        { q: 'What keeps the hero canvas cheap when you scroll past it?', a: 'An IntersectionObserver sets frameloop to “never” while the hero is off screen — no rendering at all.' },
        {
            q: 'What do the loader and route transition do under reduced motion?',
            a: 'No zoom: the lime layer simply fades in and out. The glass-helmet loop and marquees stop; text is still revealed.',
        },
        { q: 'How were leaks checked?', a: 'Five home ↔ on-track round trips: ScrollTriggers return to 0, canvases stay at 1–2, window listeners and heap stay flat.' },
        { q: 'Which CSS properties do the animations stick to, and why?', a: 'transform and opacity (plus clip/mask). They skip layout and paint, so the browser can hit 16.7 ms per frame.' },
    ],
    build: [
        { q: 'What is the first thing to write before any code?', a: 'A choreography sheet: every element, when it starts, how long, which ease, which trigger (time, scroll range, hover, route).' },
        { q: 'Which three motion-kit pieces carry most of this site?', a: 'SmoothScroll (Lenis on the ticker), BlockReveal (the text signature) and a pinned, scrubbed timeline per scene.' },
        { q: 'Name the three triggers used across the page.', a: 'Time (preloader, menu, hovers), scroll ranges (pins, scrubs, enter-once reveals) and events (ln:enter, route change).' },
    ],
};

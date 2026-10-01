/**
 * Plain-language dictionary. Hover any dashed-underlined word in the guide to see its entry.
 * `lens` = how a designer might already think about it.
 */
export type GlossaryEntry = { term: string; plain: string; lens?: string };

export const GLOSSARY: Record<string, GlossaryEntry> = {
    em: {
        term: 'em',
        plain: 'A length that means “one text-size”. If the text size is 20px, 1em is 20px and 5em is 100px. Change the text size and every em-based length follows.',
        lens: 'Like Figma’s “scale” on a whole frame: change one number and everything resizes together.',
    },
    vw: {
        term: 'vw',
        plain: 'One percent of the window width. At a 1920px-wide window 1vw is 19.2px. Used for text size, it makes a design shrink and grow with the window like an image.',
        lens: 'A frame that scales to fit the screen, instead of one that re-flows.',
    },
    hairline: {
        term: 'hairline',
        plain: 'A 1px rule used as structure: it separates areas instead of a box or a shadow. Editorial sites lean on these to organise a page.',
        lens: 'The thin keylines in a print layout grid.',
    },
    mask: {
        term: 'mask (overflow: hidden)',
        plain: 'A box that hides whatever sticks out of it. Text is moved down out of the box, then slides up into view: it looks like it rises from behind an invisible edge.',
        lens: 'A clipping mask in Figma or a track matte in After Effects.',
    },
    translate: {
        term: 'translate',
        plain: 'Moving an element without changing the layout around it. Cheap for the browser, so it is the main way things move. yPercent: 100 means “down by its own height”.',
        lens: 'Moving a layer with the move tool: nothing else on the canvas reflows.',
    },
    stagger: {
        term: 'stagger',
        plain: 'Starting a group of motions one after another with a small gap instead of all at once, so the group reads as one gesture.',
        lens: 'Offsetting layers in After Effects by a few frames.',
    },
    ease: {
        term: 'easing',
        plain: 'A curve that reshapes motion so it speeds up, slows down or both. The page uses just three: out-cubic, in-out-cubic, in-out-quart.',
        lens: 'The graph editor in After Effects, or the curve in Figma Smart Animate.',
    },
    progress: {
        term: 'progress',
        plain: 'A number from 0 to 1 (or 0 to 100%) saying how far through something you are. Scroll progress, animation progress, a slider: all the same idea.',
        lens: 'The playhead position as a percentage of the timeline.',
    },
    keyframe: {
        term: 'keyframe',
        plain: 'A value pinned to a moment. Between two keyframes the value is filled in; before the first and after the last it stays put.',
        lens: 'Exactly an After Effects keyframe, but the “time” axis is scroll distance.',
    },
    track: {
        term: 'track',
        plain: 'The list of keyframes for one property of one element, for example “logo scale: 1 at 19%, 4 at 23%”.',
        lens: 'One property row in an After Effects layer.',
    },
    smoothing: {
        term: 'smoothing',
        plain: 'Letting the animation chase the scroll position instead of snapping to it. Every frame it closes a fixed share (30% here) of the remaining gap, so wheel steps glide.',
        lens: 'A follow-through on the playhead, like “wiggle” made calm.',
    },
    scrub: {
        term: 'scrub',
        plain: 'Tying an animation’s playhead to the scroll position instead of to time. Scroll down and it plays forward, scroll up and it plays backwards.',
        lens: 'Dragging the playhead in After Effects: the scroll bar is the playhead.',
    },
    pin: {
        term: 'pin',
        plain: 'Holding an element still on screen while the page keeps scrolling behind it, for a set distance. What happens during that distance is the scene.',
        lens: 'A “fixed” layer in a Figma prototype, but only for part of the scroll.',
    },
    sticky: {
        term: 'position: sticky',
        plain: 'The browser’s own way to pin: an element scrolls normally until it reaches an edge, then sticks there until its parent ends. No JavaScript, no wrapper.',
        lens: 'A layer pinned to the top with “scroll behaviour: fixed” inside a tall frame.',
    },
    scrolltrigger: {
        term: 'ScrollTrigger',
        plain: 'GSAP’s plugin that watches the scroll position. It can start an animation when an element enters (“top 85%”), scrub one, or pin an element.',
        lens: 'Figma’s “while scrolling” triggers, with exact pixel ranges.',
    },
    spacer: {
        term: 'pin spacer',
        plain: 'When GSAP pins an element it wraps it in an extra box as tall as the pin distance, so the rest of the page waits. Turn it off and the next section slides over the pinned one.',
    },
    placeholder: {
        term: 'colour placeholder',
        plain: 'A flat colour, picked from the photo, shown where the photo will appear. The photo then fades in on top, so there is never an empty hole while it loads.',
        lens: 'The blurred or flat colour Medium and Pinterest show before an image arrives.',
    },
    odometer: {
        term: 'odometer',
        plain: 'A counter made of a tall strip of digits seen through a one-digit window. Moving the strip up shows the next number.',
        lens: 'The mechanical counter on a car dashboard.',
    },
    overlay: {
        term: 'overlay',
        plain: 'A layer that opens on top of the page (gallery, menu) and is removed again. The page behind should stop scrolling while it is open.',
        lens: 'A modal frame on top of the page in Figma.',
    },
    timeline: {
        term: 'timeline',
        plain: 'A GSAP object that holds many animations at exact positions on one clock, so you can play, reverse or scrub them together.',
        lens: 'An After Effects composition.',
    },
    lenis: {
        term: 'Lenis',
        plain: 'A small library that makes mouse-wheel scrolling glide instead of jumping in steps. It still scrolls the normal page, so everything else keeps working.',
    },
    lottie: {
        term: 'Lottie',
        plain: 'A vector animation exported from After Effects as a small JSON file and played in the browser. You can set it to any frame, which is how scroll can play it.',
        lens: 'A rendered After Effects comp you can drag the playhead of from code.',
    },
    reduced: {
        term: 'reduced motion',
        plain: 'An operating-system setting for people who get dizzy from movement. Good pages respond by removing travel, scaling and scrubbing and keeping only short fades.',
    },
};

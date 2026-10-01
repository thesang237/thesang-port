import type { ChapterId } from './chapters';

export type Flashcard = { q: string; a: string };

/** "Lock it in" cards at the end of every chapter, pooled for the final quiz. */
export const CARDS: Record<ChapterId, Flashcard[]> = {
    map: [
        {
            q: 'What number drives almost every animation on the page?',
            a: 'The scroll position, turned into a progress number from 0 to 1. Each scene reads it and writes transforms and opacity.',
        },
        {
            q: 'Name the seven scenes in order.',
            a: 'Loader → hero build → logo breaks apart and falls → about lines → rising photos and heading → the photo deck → the footer logo build.',
        },
        {
            q: 'Which two scenes are scrubbed by scroll and which are played once?',
            a: 'Scrubbed: the logo fall and the pinned photo stage. Played once at a trigger: the loader, the hero build, the about lines and the footer logo.',
        },
        { q: 'Why is one clock important?', a: 'Smooth scroll, ScrollTrigger and every tween update in the same frame, so a pinned scene never lags a frame behind the scroll.' },
    ],
    layout: [
        {
            q: 'What does “body font-size: 1vw” do to the whole layout?',
            a: '1em becomes 1% of the window width, so every em-based size (type, gutters, bars) scales with the window like one image. At 1920px, 1em = 19.2px.',
        },
        {
            q: 'Why does the phone layout use bigger em multipliers (hero 9.6em, not 5.69em)?',
            a: '1vw is only 3.75px on a 375px phone, so the same multipliers would be unreadable. The phone sets its own, larger ones.',
        },
        {
            q: 'How does the page structure itself without boxes or shadows?',
            a: 'Hairlines (1px rules) in the near-black ink, a thick 3.19em bar, big empty areas, and a 32.8% / 66.3% two-column split.',
        },
        {
            q: 'Why does the page wrapper use overflow: clip instead of hidden?',
            a: 'Hidden makes the wrapper a scroll container and silently breaks position: sticky inside it. Clip hides the overflow without breaking sticky.',
        },
    ],
    masks: [
        { q: 'Describe a mask reveal in two parts.', a: 'A wrapper with overflow: hidden and a fixed height, and an inner line starting at translateY(100%) that rises to 0.' },
        {
            q: 'What are the hero line numbers?',
            a: 'Start at 110% down, rise to 0 in about 1s with out-cubic, each line 100ms after the previous.',
        },
        {
            q: 'The about lines and the “Explore Experiment” heading use the same mask. What differs?',
            a: 'The driver. About lines play once in 0.9s when they cross the 15% line; the heading is scrubbed, rising between 23% and 30% of the stage’s scroll.',
        },
        {
            q: 'Why are the big heading masks 9.2em tall with a −0.8em bottom margin?',
            a: 'The mask needs extra room so letter descenders (g, p, y) are not clipped; the negative margin cancels the extra space in the layout.',
        },
    ],
    tracks: [
        {
            q: 'What is a scroll track?',
            a: 'A list of keyframes for one property: positions as a percentage of the scroll range, with a value at each. Before the first and after the last the value holds.',
        },
        {
            q: 'Why does this page keep every scroll track linear?',
            a: 'Its engine only uses a custom curve when it sits on a track’s first keyframe, so curves set on later keys do nothing. The scroll pacing is the ease anyway.',
        },
        {
            q: 'What does smoothing 70 mean?',
            a: 'Each 60Hz frame the animation closes 30% of the gap to the scroll position, so after 10 frames only about 3% is left: a glide of a fraction of a second.',
        },
        {
            q: 'How does scroll play a Lottie file?',
            a: 'Scroll progress is mapped to a frame number by a track (0→0, 10%→37, 17%→61, 22%→99) and the file is set to that frame, sub-frames included.',
        },
    ],
    pinned: [
        {
            q: 'What are the two parts of the pinned stage?',
            a: 'A tall track (1000vh) that creates the scroll distance, and a 100vh sticky stage inside it that stays on screen while the track scrolls past.',
        },
        { q: 'Roughly how long is the whole stage scene in scroll?', a: 'About ten screens: the stage is stuck for the track height minus one screen, so around 90% of the track’s progress.' },
        {
            q: 'GSAP pin versus position: sticky: when would you choose each?',
            a: 'Sticky when the stage is a plain block with no transformed ancestors (simplest, no wrapper). GSAP pin when you need a spacer, a start/end inside a nested scroller, or to pin something sticky cannot.',
        },
        {
            q: 'How does the photo deck change slides?',
            a: 'Each slide’s track moves it up 100vh over a 10% range (35→45, 45→55 … 75→85) over the previous one, with the counter and name highlight changing in step.',
        },
    ],
    images: [
        {
            q: 'What is the “colour first, photo second” rule?',
            a: 'A flat colour sampled from the photo sits behind it, then the photo fades in and settles from a slight zoom, so no empty hole is ever visible.',
        },
        { q: 'What are the entrance numbers?', a: 'Scale 1.1 → 1.02 over 1.8s in-out-cubic, opacity 0 → 1 over 0.8s starting 0.2s later, then the placeholder fades out at 2.0s.' },
        {
            q: 'What is the cover-and-zoom trick in the deck?',
            a: 'The slide underneath keeps zooming (1 → 1.2) while the next one slides up over it, so the whole stage feels like it is always moving.',
        },
        { q: 'How should a group of images be staggered?', a: '70ms between items in reading order, capped so the last starts within about half a second; random only for decoration.' },
    ],
    interact: [
        { q: 'How does the underline swap work?', a: 'Two lines: the visible one slides out to the right while a second waits off-left and slides in. On leave they run back. 500ms in, 400ms out.' },
        {
            q: 'Why can’t CSS transitions and GSAP both move the same element?',
            a: 'Both write transform, so they fight and offsets stack (a CSS 10% plus a GSAP yPercent). One owner per element: set the start values in GSAP too.',
        },
        {
            q: 'List the gallery overlay’s open sequence.',
            a: 'Blurred backdrop fades in over 1.2s, the photo panel rises from 10% over 1s after 0.3s, the content fades in over 1.4s after 0.4s. Smooth scroll is stopped.',
        },
        { q: 'What does the page wipe do in order?', a: 'A black sheet rises over the page (0.7s), the page resets while hidden, then the sheet leaves through the top (0.9s).' },
    ],
    build: [
        {
            q: 'In what order should you build a scroll page?',
            a: 'Static layout in HTML first, then tokens, then one scene at a time (trigger, then timeline), then hovers and overlays, then polish and reduced motion.',
        },
        { q: 'What three things must you check at the end?', a: 'Reload halfway down, scroll up and down fast and slow, and reduced motion on.' },
        { q: 'Why build the page so it works without the motion?', a: 'If scripts fail or motion is reduced the content must still be there: hide things before a reveal only when JavaScript runs.' },
    ],
};

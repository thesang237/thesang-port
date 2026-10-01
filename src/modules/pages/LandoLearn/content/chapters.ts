export const CHAPTERS = [
    { id: 'map', n: '00', label: 'The map', blurb: 'How one scroll wheel runs the whole page' },
    { id: 'timing', n: '01', label: 'Timing from video', blurb: 'Measuring motion frame by frame, fitting eases' },
    { id: 'smooth', n: '02', label: 'Smooth scroll', blurb: 'Lenis, lerp 0.1 and the one clock' },
    { id: 'reveal', n: '03', label: 'Block reveal', blurb: 'The signature text wipe, piece by piece' },
    { id: 'micro', n: '04', label: 'Micro-interactions', blurb: 'Rolling text, header states, marquee, tooltip' },
    { id: 'menu', n: '05', label: 'Menu choreography', blurb: 'A curved panel and nine staggered tracks' },
    { id: 'pinned', n: '06', label: 'Pinned scenes', blurb: 'Hero → card, scrubbed, with a drawn signature' },
    { id: 'gallery', n: '07', label: 'Horizontal gallery', blurb: 'Vertical scroll, sideways travel, colour scrub' },
    { id: 'webgl', n: '08', label: 'The WebGL layer', blurb: 'Canvas planes that follow DOM boxes' },
    { id: 'shaders', n: '09', label: 'Shader effects', blurb: 'Trail reveal, duotone ripple, glass helmet' },
    { id: 'transitions', n: '10', label: 'Page transitions', blurb: 'Preloader, the growing “4”, exit → swap → enter' },
    { id: 'perf', n: '11', label: 'Performance & a11y', blurb: 'Pausing, reduced motion, leak checks' },
    { id: 'build', n: '12', label: 'Build your own', blurb: 'Recipe, choreography sheet and final quiz' },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]['id'];

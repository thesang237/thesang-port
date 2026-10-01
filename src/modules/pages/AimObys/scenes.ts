/**
 * Scroll keyframes, copied from the reference page's interaction data.
 * Percentages are of the scroll range (see ix.ts → elementProgress). Every track is linear: the reference sets its
 * curves on later keys, which its engine ignores (only a curve on a track's first key is used).
 */
import type { ElementTracks, Key } from './lib/ix';

// ── whole page: the logo lottie (0 → 99 % of its frames), then it zooms ×4 into a black screen and vanishes
export const LOGO_FRAME: Key[] = [
    [0, 0],
    [10, 37],
    [17, 61],
    [22, 99],
    [100, 99],
];
export const LOGO_TRACKS: ElementTracks = {
    scale: [
        [19, 1],
        [23, 4],
    ],
    opacity: [
        [34, 1],
        [35, 0],
    ],
};

// ── "Explore Experiment" section (1000vh)
export const SLIDER: ElementTracks = {
    xUnit: '%',
    yUnit: 'vh',
    x: [
        [0, -203],
        [12, -203],
        [13, -203],
        [30, 0],
    ],
    y: [
        [0, 100],
        [12, 0],
        [13, 0],
        [30, 0],
    ],
};

const riseCol = (start: number, endX: number): ElementTracks => ({
    xUnit: '%',
    yUnit: 'vh',
    x: [
        [start, 0],
        [12, 0],
        [13, 0],
        [30, endX],
    ],
    y: [
        [start, 100],
        [12, 0],
        [13, 0],
        [30, 0],
    ],
});
export const COL_2 = riseCol(3, 110);
export const COL_3 = riseCol(6, 40);

export const HEADING_1: ElementTracks = {
    y: [
        [23, 120],
        [30, 0],
    ],
};
export const HEADING_2: ElementTracks = {
    y: [
        [25, 120],
        [30, 0],
    ],
};
export const FADE_IN: ElementTracks = {
    opacity: [
        [28, 0],
        [30, 1],
    ],
};
export const RIGHT_FADE_IN: ElementTracks = {
    opacity: [
        [28, 0],
        [31, 1],
    ],
};

// slides 2–6 move up over the previous one
export const SLIDES: ElementTracks[] = [
    {},
    {
        yUnit: 'vh',
        y: [
            [35, 0],
            [45, -100],
        ],
    },
    {
        yUnit: 'vh',
        y: [
            [45, 0],
            [55, -100],
        ],
    },
    {
        yUnit: 'vh',
        y: [
            [55, 0],
            [65, -100],
        ],
    },
    {
        yUnit: 'vh',
        y: [
            [65, 0],
            [75, -100],
        ],
    },
    {
        yUnit: 'vh',
        y: [
            [75, 0],
            [85, -100],
        ],
    },
];

// photo inside each slide: fades in while its slide travels, then slowly zooms while the next one covers it
export const SLIDE_IMAGES: ElementTracks[] = [
    {
        scale: [
            [35, 1],
            [45, 1.2],
        ],
    },
    {
        opacity: [
            [35, 0],
            [45, 1],
        ],
        scale: [
            [45, 1],
            [55, 1.2],
        ],
    },
    {
        opacity: [
            [45, 0],
            [55, 1],
        ],
        scale: [
            [55, 1],
            [65, 1.2],
        ],
    },
    {
        opacity: [
            [55, 0],
            [65, 1],
        ],
        scale: [
            [65, 1],
            [75, 1.2],
        ],
    },
    {
        opacity: [
            [65, 0],
            [75, 1],
        ],
        scale: [
            [75, 1],
            [85, 1.2],
        ],
    },
    {
        opacity: [
            [75, 0],
            [85, 1],
        ],
    },
];

export const COUNTER: ElementTracks = {
    yUnit: 'em',
    y: [
        [40, 0],
        [45, -1.6],
        [50, -1.6],
        [55, -3.15],
        [60, -3.15],
        [65, -4.74],
        [73, -4.74],
        [75, -6.28],
        [80, -6.28],
        [85, -7.86],
    ],
};

export const NAMES: ElementTracks[] = [
    {
        opacity: [
            [41, 1],
            [43, 0.4],
        ],
    },
    {
        opacity: [
            [43, 0.4],
            [45, 1],
            [51, 0.4],
        ],
    },
    {
        opacity: [
            [53, 0.4],
            [55, 1],
            [61, 1],
            [65, 0.4],
        ],
    },
    {
        opacity: [
            [63, 0.4],
            [65, 1],
            [71, 1],
            [75, 0.4],
        ],
    },
    {
        opacity: [
            [70, 0.4],
            [75, 1],
            [81, 1],
            [85, 0.4],
        ],
    },
    {
        opacity: [
            [83, 0.4],
            [85, 1],
        ],
    },
];

// ── phones (≤ 479px): the logo only half breaks apart while zooming ×1.6 and drifting down, then flies up and out
export const PHONE_LOGO_FRAME: Key[] = [
    [0, 0],
    [16, 32],
];
export const PHONE_LOGO_TRACKS: ElementTracks = {
    scale: [
        [0, 1],
        [16, 1.6],
    ],
    opacity: [
        [40, 1],
        [41, 0],
    ],
};
export const PHONE_LOGO_WRAP: ElementTracks = {
    yUnit: 'em',
    y: [
        [0, 0],
        [16, 15],
        [26, 15],
        [40, -200],
    ],
};

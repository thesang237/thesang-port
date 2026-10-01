// Page copy and image list, taken from the reference page.

export const IMG = (name: string) => `/aim-obys/img/${name}.webp`;

export const NAV_TITLE = 'AI Modernism of Kharkiv [Ukraine]';
export const NAV_CREDIT = 'Obys Agency ©2025';

export const MODERNISTS = ['E01: Anatol Petrytskiy', 'E02: Vasyl Ermilov', 'E03: Oleksandr Khvostenko-Khvostov', 'E04: Borys Kosarev', 'E05: Vadym Meller'];

export const HERO_LINES = ['AIM—', 'AI Modernism', 'Of Kharkiv'];

// [text, footnote] per visual line (the reference breaks the paragraph by hand)
export const ABOUT_PART_1: [string, string?, string?][] = [
    ['This AI experiment delves into a'],
    ['contemporary reimagining of the Kharkiv '],
    ['Modernism', '[*]', ' movement from 1910 to '],
    ['1930. Drawing inspiration from the avant-'],
    ['garde artists and intellectuals of that era, '],
    ['we employ cutting-edge artificial', '[**]', ' '],
    ['intelligence techniques to reinterpret and'],
    ['garde artists and intellectuals of that era, '],
    ['revive their visionary ideas.'],
];

export const ABOUT_PART_2: [string, string?, string?][] = [
    ['By leveraging modern technology, we', '[***]', ' '],
    ['aim to uncover new perspectives on the '],
    ['artistic, architectural, and cultural legacy'],
    ['of Kharkiv Modernism.'],
];

// phones get the paragraph unbroken (copy as in the reference's phone version; "[…]" parts are footnote marks)
export const ABOUT_PHONE: string[][] = [
    [
        'This AI experiment delves into a contemporary reimagining of the Kharkiv Modernism',
        '[*]',
        ' movement from 1910 to 1930. Drawing inspiration from the avant-garde artists and intellectuals of that era, we employs cutting-edge artificial',
        '[**]',
        ' intelligence techniques to reinterpret and garde artists and revive their visionary ideas.',
    ],
    ['By leveraging modern technology, we', '[***]', ' aim to uncover new perspectives on the artistic, architectural, and cultural legacy of Kharkiv Modernism.'],
];

export const NOTES = [
    { text: '[*] — Collective name 1910-30 Kharkiv’s artists' },
    { text: '[**] — Main visual AI tool is', link: { label: 'Midjourney', href: 'https://www.midjourney.com/home' } },
    { text: '[***] — Experiment produced by', link: { label: 'Obys', href: 'https://obys.agency/' } },
];

// three columns that rise out of the black
export const RISE = { left: IMG('home-slider-1'), mid: IMG('home-slider-7'), right: IMG('Kosarev-art-1-10') };

export const FEATURED = [
    { name: 'Suprematista', img: IMG('home-slider-1'), bg: '#a72805' },
    { name: 'Buntesglas', img: IMG('home-slider-2'), bg: '#c8bfb8' },
    { name: 'Vierensee', img: IMG('home-slider-3'), bg: '#b09fad' },
    { name: 'Formen', img: IMG('home-slider-4'), bg: '#5a5653' },
    { name: 'Sesselbaa', img: IMG('home-slider-5'), bg: '#c12a1e' },
    { name: 'Salzfeld', img: IMG('home-slider-5-1'), bg: '#b5ada2' },
];

export const FOOTER_TEXT = 'An AI Experiment Based on the Kharkiv Modernism';
export const FOOTER_CREDIT = 'Obys Agency ©2023';

type Cell = { img: string; alt: string; wide?: boolean } | null;

// gallery overlay rows (null = the invisible spacer cell the reference uses to keep the rhythm)
export const GALLERY: Cell[][] = [
    [
        { img: IMG('Petrytskiy-art-1-6'), alt: 'Anatol Petrytskiy' },
        { img: IMG('Petrytskiy-art-1-2'), alt: 'Anatol Petrytskiy', wide: true },
    ],
    [{ img: IMG('Petrytskiy-art-2-2'), alt: 'Anatol Petrytskiy' }, { img: IMG('Ermilov-art-1-2'), alt: 'Vasyl Ermilov' }, null],
    [
        { img: IMG('Ermilov-art-2-2'), alt: 'Vasyl Ermilov', wide: true },
        { img: IMG('Ermilov-art-1-6'), alt: 'Vasyl Ermilov' },
    ],
    [
        { img: IMG('Khvostenko-art-1-6'), alt: 'Oleksandr Khvostenko-Khvostov' },
        { img: IMG('Khvostenko-art-1-2'), alt: 'Oleksandr Khvostenko-Khvostov', wide: true },
    ],
    [{ img: IMG('Khvostenko-art-2-2'), alt: 'Oleksandr Khvostenko-Khvostov' }, { img: IMG('Khvostenko-art-2-6'), alt: 'Oleksandr Khvostenko-Khvostov' }, null],
    [
        { img: IMG('Kosarev-art-1-2'), alt: 'Borys Kosarev', wide: true },
        { img: IMG('Kosarev-art-1-6'), alt: 'Borys Kosarev' },
    ],
    [
        { img: IMG('Kosarev-art-1-10'), alt: 'Borys Kosarev' },
        { img: IMG('home-slider-4'), alt: 'Formen', wide: true },
    ],
    [{ img: IMG('Meller-art-1-2'), alt: 'Vadym Meller' }, { img: IMG('Meller-art-1-10'), alt: 'Vadym Meller' }, null],
    [
        { img: IMG('Meller-art-2-2'), alt: 'Vadym Meller', wide: true },
        { img: IMG('Meller-art-1-6'), alt: 'Vadym Meller' },
    ],
];

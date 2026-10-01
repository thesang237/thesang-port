// Original placeholder copy for the clone. Same line counts / rhythm as the reference, different words.
// Fictional driver: "Ellis Morrow". No real names, teams or partner brands.

export const ASSET = (name: string) => `/landonorris/${name}`;

export const IMG = {
    portrait: ASSET('portrait.webp'),
    portraitHelmet: ASSET('portrait-helmet.webp'),
    profile: ASSET('profile.webp'),
    helmet: ASSET('helmet.webp'),
    scene: ASSET('scene.webp'),
    back: ASSET('back.webp'),
    contours: ASSET('contours.svg'),
};

export const NAV = [
    { label: 'HOME', href: '/landonorris' },
    { label: 'ON TRACK', href: '/landonorris/on-track' },
    { label: 'OFF TRACK', href: '/landonorris' },
    { label: 'CALENDAR', href: '/landonorris' },
] as const;

export const SOCIALS = ['TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'TWITCH'] as const;

export const TEAM_LINE = 'TEAM ORBIT SINCE 2019';

export const MARQUEE = {
    serif: 'A FIRST WIN ON HOME TARMAC — ',
    sans: 'A WEEKEND I WILL CARRY FOREVER — ',
};

// [text, serif?] per line — serif words are lime
export const MANIFESTO: Array<Array<[string, boolean]>> = [
    [
        ['RETHINKING', true],
        [' LIMITS,', false],
    ],
    [
        ['CHASING EVERY ', false],
        ['WIN,', true],
    ],
    [['GIVING IT EVERYTHING', false]],
    [['ALL WAYS. BUILDING A', false]],
    [
        ['LEGACY', true],
        [' IN RACING', false],
    ],
    [['ON AND OFF THE', false]],
    [['TRACK.', false]],
];

export type GalleryItem = {
    kind: 'img' | 'quote' | 'chip';
    caption?: string;
    src?: string;
    pos?: string; // object-position
    tone?: 'color' | 'duo';
    x: number; // px from the track start
    y: number; // px from the top of the viewport
    w: number;
    h: number;
    depth: number; // parallax multiplier (1 = track speed)
    text?: Array<[string, boolean]>; // quote words: [text, emphasised]
    zoom?: number;
    dark?: boolean;
};

// Layout measured from the reference frames at 1920×1030. x = position on the horizontal track (offset 0 =
// before the track starts moving), y = top in the pinned viewport. Total travel ≈ 3144px.
export const GALLERY_TRAVEL = 3060;
export const GALLERY: GalleryItem[] = [
    { kind: 'img', caption: 'DOHA, 2024', src: IMG.portrait, pos: '50% 22%', zoom: 1.9, tone: 'color', x: 1181, y: 107, w: 278, h: 344, depth: 1 },
    { kind: 'img', caption: 'AWARDS NIGHT, 2024', src: IMG.back, pos: '50% 18%', zoom: 1.15, tone: 'duo', x: 1329, y: 598, w: 302, h: 302, depth: 1.02 },
    {
        kind: 'quote',
        x: 1807,
        y: 92,
        w: 360,
        h: 120,
        depth: 1,
        text: [
            ['It never matters ', false],
            ['where', true],
            [' you begin, it\u2019s ', false],
            ['how', true],
            [' far you push from there.', false],
        ],
    },
    { kind: 'img', caption: 'MIAMI, 2024', src: IMG.scene, pos: '62% 45%', zoom: 1.25, tone: 'color', x: 1807, y: 374, w: 674, h: 612, depth: 1 },
    { kind: 'img', caption: 'MONACO, 2023', src: IMG.profile, pos: '60% 25%', zoom: 1.2, tone: 'duo', x: 2591, y: 107, w: 227, h: 215, depth: 0.98 },
    { kind: 'img', caption: 'SILVERSTONE, 2025', src: IMG.helmet, pos: '50% 50%', zoom: 1.35, tone: 'color', x: 2754, y: 538, w: 327, h: 296, depth: 1, dark: true },
    { kind: 'chip', x: 2754, y: 857, w: 117, h: 46, depth: 1 },
    { kind: 'img', caption: 'RIVERSIDE, 2024', src: IMG.portraitHelmet, pos: '50% 30%', zoom: 1.7, tone: 'color', x: 3242, y: 702, w: 221, h: 272, depth: 1.02 },
    { kind: 'img', caption: 'SPRING GALA, 2024', src: IMG.back, pos: '50% 35%', zoom: 1.3, tone: 'duo', x: 3462, y: 189, w: 213, h: 213, depth: 0.98 },
    { kind: 'img', caption: 'BARCELONA, 2024', src: IMG.scene, pos: '78% 40%', zoom: 1.6, tone: 'color', x: 3830, y: 127, w: 628, h: 628, depth: 1 },
    { kind: 'quote', x: 3830, y: 826, w: 560, h: 90, depth: 1, text: [['Ever since my first laps in a kart at seven, I\u2019ve chased that dream with everything I\u2019ve got.', false]] },
    { kind: 'img', caption: 'PODIUM, 2025', src: IMG.profile, pos: '40% 20%', zoom: 1.4, tone: 'duo', x: 4614, y: 686, w: 180, h: 256, depth: 1 },
];

export const ON_OFF = [
    { top: 'ON', bottom: 'TRACK', body: 'Latest results, season stats\nand moments from trackside.', tip: 'On Track Page', href: '/landonorris/on-track', align: 'right' as const },
    { top: 'OFF', bottom: 'TRACK', body: 'Campaigns, shoots and other such\npromotional stories for fans', tip: 'Off Track Page', href: '/landonorris', align: 'left' as const },
];

export const HELMETS_COPY = 'From bold signature patterns to one-off specials, Ellis has always treated every helmet as a canvas worth remembering.';

// label, year, livery filter (css) — all from one helmet render
export const HELMETS: Array<{ name: string; year: string; filter: string; photo?: boolean }> = [
    { name: 'Season', year: '2025', filter: 'none' },
    { name: 'Night Glitter', year: '2025', filter: 'grayscale(1) brightness(1.15) contrast(1.1)' },
    { name: 'Tokyo', year: '2025', filter: 'hue-rotate(40deg) saturate(1.2)', photo: true },
    { name: 'Chrome', year: '2024', filter: 'grayscale(1) brightness(1.45)' },
    { name: 'Porcelain', year: '2024', filter: 'grayscale(0.7) sepia(0.4) brightness(1.3)' },
    { name: 'Sunset', year: '2024', filter: 'hue-rotate(-60deg) saturate(1.6)' },
    { name: 'Neon', year: '2024', filter: 'hue-rotate(200deg) saturate(1.5)' },
    { name: 'Dark Mode', year: '2024', filter: 'brightness(0.55) saturate(0.4)', photo: true },
    { name: 'Rose', year: '2023', filter: 'hue-rotate(250deg) saturate(1.3)' },
    { name: 'Las Vegas', year: '2023', filter: 'hue-rotate(-85deg) saturate(1.4) brightness(0.8)' },
    { name: 'Mirror', year: '2023', filter: 'grayscale(1) brightness(1.3) contrast(1.4)' },
    { name: 'Summer', year: '2023', filter: 'hue-rotate(-25deg) saturate(1.5) brightness(1.1)', photo: true },
    { name: 'Hoops', year: '2022', filter: 'hue-rotate(-70deg) saturate(2)' },
    { name: 'Season', year: '2021', filter: 'hue-rotate(15deg)' },
    { name: 'Crayon', year: '2020', filter: 'grayscale(0.85) brightness(1.4)', photo: true },
    { name: 'Season', year: '2019', filter: 'hue-rotate(100deg) saturate(1.3)' },
];

export const STORE_COPY = 'Celebrate this incredible moment with a collection made for the fans who never stopped believing. Wear it, frame it, keep it forever.';

export const PARTNERS_COPY = 'Ellis is proud to collaborate with a range of partners, who share his passion for performance across a range of industries.';

export const PARTNERS = ['NORTHWIND', 'halcyon', 'VERTEX', 'PULSAR', 'Oktave', 'LUMEN&CO', 'ARCADIA', 'kinetik', 'HELIX', 'orbit'];

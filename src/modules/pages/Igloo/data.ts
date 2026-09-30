export type PortfolioItem = {
    code: string;
    name: string;
    date: string;
    temp: [number, number];
    logo: 'penguin' | 'ip' | 'abstract' | 'classified';
    shape: 'rock' | 'prism' | 'cube' | 'shard';
    summary: string[];
    discover: string;
    visit: string;
};

export const PORTFOLIO: PortfolioItem[] = [
    {
        code: 'PORTFOLIO_CO_01',
        name: 'PUDGY PENGUINS',
        date: '03.02.2020',
        temp: [35.17, 1.76],
        logo: 'penguin',
        shape: 'rock',
        summary: [
            'A collection of ten thousand penguins that grew from a small on-chain experiment into one of the most recognisable characters on the internet — plush toys on retail shelves, billions of views, a community that behaves more like a colony than an audience.',
            'The brand treats every holder as a co-owner of the story: characters are licensed back to the community, merchandise flows into the real world, and every new release is designed to be shared rather than hoarded.',
        ],
        discover: '[X] ↗',
        visit: '[website] ↗',
    },
    {
        code: 'PORTFOLIO_CO_02',
        name: 'OVERPASS',
        date: '06.01.2023',
        temp: [30.12, -1.05],
        logo: 'ip',
        shape: 'prism',
        summary: [
            'A licensing layer for digital characters. Holders submit the IP they own, brands browse a curated pool of it, and a deal that once took lawyers and months settles in a few clicks with the original owner paid along the way.',
            'It turns every collectible into a potential product line and gives companies a clean, auditable path to work with communities instead of around them.',
        ],
        discover: '[X] ↗',
        visit: '[website] ↗',
    },
    {
        code: 'PORTFOLIO_CO_03',
        name: 'ABSTRACT',
        date: '06.28.2024',
        temp: [24.37, -4.24],
        logo: 'abstract',
        shape: 'cube',
        summary: [
            'A consumer-first chain built so that the people using an app never need to know a chain is involved. Wallets are created in the background, fees are abstracted away and onboarding takes the same time as signing up for any other product.',
            'The goal is simple: make on-chain apps feel like apps, and let creators ship experiences for audiences that have never touched a seed phrase.',
        ],
        discover: '[X] ↗',
        visit: '[website] ↗',
    },
    {
        code: 'PORTFOLIO_CO_04',
        name: 'CLASSIFIED',
        date: '██.██.2026',
        temp: [18.9, 2.31],
        logo: 'classified',
        shape: 'shard',
        summary: [
            'Signal is still encrypted. What we can say: a new consumer brand forming at the edge of community, AI and crypto — currently in cold storage and thawing on schedule.',
            'Keep scrolling. The colony will be the first to know.',
        ],
        discover: '[—] ↗',
        visit: '[soon] ↗',
    },
];

export const SOCIALS = [
    { label: 'LinkedIn', href: 'https://www.linkedin.com', shape: 'penguin' },
    { label: 'X / Twitter', href: 'https://x.com', shape: 'x' },
    { label: 'Medium', href: 'https://medium.com', shape: 'm' },
] as const;

export const MANIFESTO = 'Our mission is to build the next generation of consumer brands at the intersection of Community, AI, and crypto.';

/** Master-timeline durations. One unit = one viewport height of scroll. */
export const TIMELINE = {
    total: 16,
} as const;

export const SECTIONS = [
    { id: 'igloo', label: 'Igloo', at: 0 },
    { id: 'portfolio', label: 'Portfolio', at: 2.2 },
    { id: 'portal', label: 'Portal', at: 8.1 },
    { id: 'colony', label: 'Colony', at: 12.4 },
] as const;

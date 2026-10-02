/** All text on /kpr. Structure, line counts and caption style follow the reference; wording is placeholder. */

export const NAV = [
    { id: 'project', label: 'Project' },
    { id: 'keep', label: 'The Keep' },
    { id: 'factions', label: 'Factions' },
    { id: 'world', label: 'The World' },
] as const;
export type NavId = (typeof NAV)[number]['id'];

export const MENU = {
    discover: 'Discover',
    items: [
        { label: 'Story', extra: 'Page\n001', active: true },
        { label: 'Protocol', extra: 'Page\n002' },
        { label: 'Journal', extra: 'Page\n003' },
        { label: 'Media', extra: 'Page\n004' },
        { label: 'Gallery', extra: 'Page\n005' },
        { label: 'About', extra: 'Page\n006' },
    ],
    connect: 'Connect',
    socials: ['Twitter', 'Discord'],
    buy: 'Buy on',
    market: 'Marketplace',
    region: 'US-EN',
    copyright: '© 2026',
};

export const LANDING = {
    body: 'A study of a story-first brand built around shared myth-making. The world is unfinished on purpose: a living tale with blank pages left for whoever arrives next.',
    words: [
        { sub: '01H', word: 'Hold' },
        { sub: '02S', word: 'Shelter' },
        { sub: '03R', word: 'Reinvent' },
    ],
    scroll: 'Scroll',
};

export const INTRO = {
    index: '001',
    lines: ['A world you know… bent', 'toward another road.'],
    body: 'Sealed inside the last safe district, you watch a city try very hard not to come apart.',
    side: 'Field footage',
    hero: 'Lead character',
    trailer: 'Trailer V.004',
};

export const STORY = {
    row1: { index: '002', lines: ['You are a Warden: a carrier', 'of force and change in this', 'place.'] },
    terminal: '//Booting\nWarden Archive\n\nLoading...[{p}%]\n\nRegion_Data\nTrait_Matrix\nRelay Messages',
    coords: 'N 35°27.37\nE 139°38.57',
    degrees: '33.8°',
    row3: { index: '003', lines: ['What do you do with that', 'force? Will you choose to', 'guard it or break it? To give', 'or to take?'] },
    symbol: 'Wardens\nSymbol',
};

export const COLLECTION = {
    count: 10,
    unit: 'k',
    footer: 'First Collection',
    crystal: 'Core Shard',
    traits: 'Eyes of the soul',
    portrait: 'Collector 0001',
};

export const GALLERY = {
    index: '004',
    lines: ['10,000 one-of-a-kind', 'painted characters.'],
    caption: 'First Collection',
    body: 'Each Warden is assembled from a library of more than four hundred hand-painted parts. Every piece is a small belonging that carries the world’s founding ideas: change, welcome and imagination.',
};

export const TABLEAUX = {
    keep: { index: '001', title: 'The Keep', lines: ['The final archive of everything known. The Keep', 'is where every story ends up. A place to', 'wonder at, defend, and fight over.'] },
    factions: { index: '002', title: 'Factions', lines: ['One world, two camps. Split on belief,', 'bound by purpose.'] },
    world: { index: '003', title: 'The World', lines: ['Finding the core, the planet’s first source of power,', 'began an age everyone called golden.', 'Or so they told themselves.'] },
    hold: 'Click & hold',
};

export const LAUNCH = {
    word: 'KEEPERS',
    caption: 'Become a Warden',
    body: 'Which road will you cut as you become the keeper of your own ending?',
    cta: 'Enter the world',
    cards: ['The World', 'Factions', 'The Keep'],
};

export const FOOTER = {
    console: '// booting\nnew files in archive\n\n    core_53815.jpg\n    audio_log_2018116.wav\n\nopen console for access...',
    discover: 'Discover more',
    links: ['Story', 'Journal', 'Media', 'Gallery', 'About', 'Careers'],
    join: 'Join the conversation',
    socials: ['Twitter', 'Discord'],
    details: 'More details',
    contact: 'Contact us at',
    email: 'hello@example.com',
    brandbook: 'Download brand book',
    legal: ['Privacy Policy', 'Terms of Service', 'Legal License'],
    region: 'EN',
    copyright: '© 2026',
};

export const LOADER = {
    label: 'Loading',
    files: [
        'HTTPS://EXAMPLE.COM/ARCHIVE/GRADE-3/HORN_OF_VITALITY/DURABILITY',
        'HTTPS://EXAMPLE.COM/WARDENS/TRAITS/EYES/SET_04/VARIANT_11',
        'HTTPS://EXAMPLE.COM/WORLD/REGION/CRATER/LAYER_02',
        'HTTPS://EXAMPLE.COM/AUDIO/AMBIENT/KEEP_LOOP_A',
        'HTTPS://EXAMPLE.COM/CORE/SHARD/REACTION/FX_001',
        'HTTPS://EXAMPLE.COM/FACTIONS/NORTH/ROSTER/0042',
        'HTTPS://EXAMPLE.COM/ARCHIVE/MAPS/TOPO/LANDING',
        'HTTPS://EXAMPLE.COM/WARDENS/HAIR/SHEET_01',
    ],
    sound: 'Enter with sound',
    silent: 'Enter without sound',
    cta: 'Click to enable sound',
};

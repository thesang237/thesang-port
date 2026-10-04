/**
 * The story, one entry per scroll stop. Copy is original (study clone); the shape follows the
 * reference: 1 hero, 6 chapters in 3 sections, 1 footer stop.
 * Headline glyphs available in the reconstructed display face: A–Z 0–9 . , ! ? % $ - [ ]
 * (no apostrophes, no lowercase).
 */

import type { HotspotId } from '../store';

export type WorldId = 'hero' | 'science' | 'stalk' | 'plots' | 'kernel';
export type SectionId = 'science' | 'trials' | 'outcome';

export type Chapter = {
    id: string;
    world: WorldId;
    section?: SectionId;
    /** Headline lines (WebGL MSDF text). */
    title: string[];
    body?: string;
    cta?: string;
    /** How this stop arrives from the previous one: a slanted wipe or a cross-fade inside one world. */
    enter: 'wipe' | 'blend';
    /** CTA ring centre in reference px (1920 × 994). */
    ctaAt?: [number, number];
    /** The deep-dive mode the CTA opens. */
    hotspot?: HotspotId;
    /**
     * Scroll segments inside the chapter before it leaves (default 1): each one is a snap where the
     * scene travels on (mostly vertically) while the copy stays. 0 = the next scroll leaves at once.
     */
    dwell?: number;
};

export const BRAND = 'GRAINLINE';

export const SECTIONS: { id: SectionId; label: string }[] = [
    { id: 'science', label: 'SCIENCE' },
    { id: 'trials', label: 'FIELD TRIALS' },
    { id: 'outcome', label: 'OUTCOME' },
];

export const HERO = {
    title: 'GRAIN. REENGINEERED.',
    subtitle: 'From lab bench to open field, a new way of growing better seed.',
    hint: 'SCROLL TO EXPLORE',
};

export const CHAPTERS: Chapter[] = [
    { id: 'hero', world: 'hero', title: [HERO.title], enter: 'wipe' },
    {
        id: 'library',
        world: 'science',
        section: 'science',
        title: ['IT STARTS WITH', 'A DEEP LIBRARY.'],
        body: 'Decades of collected seed lines sit behind every new variety. Each season we cross them into fresh combinations, and every one can be traced back to the very first breeding records.',
        cta: 'BROWSE THE ARCHIVE',
        ctaAt: [1342, 493],
        hotspot: 'library',
        enter: 'wipe',
    },
    {
        id: 'models',
        world: 'science',
        section: 'science',
        title: ['SIMULATIONS', 'THIN OUT THE', 'CANDIDATES.'],
        body: 'Before anything is planted, models score millions of possible crosses and set aside the ones unlikely to thrive in the conditions growers actually face.',
        enter: 'blend',
    },
    {
        id: 'breeders',
        world: 'science',
        section: 'science',
        title: ['BREEDERS', 'SHARPEN THE', 'SHORTLIST.'],
        body: 'Faster breeding tools have cut years from the development cycle. Cleaner parent lines give a clearer read on how each one performs, so the list shrinks sooner.',
        enter: 'blend',
    },
    {
        id: 'outside',
        world: 'stalk',
        section: 'trials',
        title: ['THEN IT GOES', 'OUTSIDE.'],
        body: 'Real soil, real weather. Promising lines are planted across hundreds of research plots, where trial teams record how each one copes with whatever the season brings.',
        cta: 'RUN THE TESTS',
        ctaAt: [262, 838],
        hotspot: 'tests',
        // the camera walks down the whole plant to the soil: two segments
        dwell: 2,
        enter: 'wipe',
    },
    {
        id: 'trials',
        world: 'plots',
        section: 'trials',
        title: ['TRIALS,', 'MORE TRIALS AND', 'EVEN MORE TRIALS.'],
        body: 'Another year of pre-release trials in more places and more conditions. Leading varieties, rival seed and new candidates grow side by side, so only the strongest reach a grower.',
        enter: 'wipe',
    },
    {
        id: 'cut',
        world: 'kernel',
        section: 'outcome',
        title: ['FEWER THAN', '1 IN 10,000', 'MAKE THE CUT.'],
        body: 'These are the survivors: the lines that cleared every simulation, lab check, field trial and breeder review on their way into the bag. Meet the newest class.',
        cta: 'MEET THE NEW CLASS',
        ctaAt: [1360, 262],
        hotspot: 'kernel',
        enter: 'wipe',
    },
    // footer: the link list draws in low on the screen, then scrolls up before the hero wipes back in
    { id: 'footer', world: 'kernel', section: 'outcome', title: [], enter: 'blend', dwell: 0 },
    { id: 'footer-more', world: 'kernel', section: 'outcome', title: [], enter: 'blend', dwell: 0 },
];

export const FOOTER_LINKS = ['GET THE NEWSLETTER', 'FIND A LOCAL ADVISOR', 'LEGAL AND TRADEMARKS', 'LISTEN TO THE PODCAST', 'VISIT THE MAIN SITE'];
export const LEGAL_LINKS = ['Terms of use', 'Privacy', 'Cookie settings', 'Accessibility'];
export const MENU_BUTTONS = ['GET THE NEWSLETTER', 'FIND A LOCAL ADVISOR', 'LEGAL AND TRADEMARKS'];
export const MENU_LINK = 'LISTEN TO THE PODCAST';

export const LAST = CHAPTERS.length - 1;
export const FOOTER = CHAPTERS.findIndex((c) => c.id === 'footer');
export const sectionOf = (i: number) => CHAPTERS[i]?.section;

// ── deep-dive modes (the reference's "hotspots"), copy in my own words ─────────────

export const LIBRARY = {
    title: ['OUT OF BILLIONS,', 'WE KEEP THE BEST.'],
    body: 'A century of careful record keeping means every line in the archive arrives with its family tree. Breeders trace each candidate back to its roots and keep only the few most likely to lift a harvest. That is where every new variety begins.',
};

export const TESTS = {
    title: ['YOUR GROUND.', 'YOUR WEATHER.'],
    pick: 'PICK A CONDITION',
    conditions: [
        { id: 'wind', label: 'WIND', body: 'A mobile wind rig drives gusts through the plots at key moments of the season, to see which stalks and roots stand their ground.' },
        { id: 'drought', label: 'DROUGHT', body: 'Some plots are kept deliberately dry. Lines that hold their yield when the water runs short move ahead; the rest stay behind.' },
        { id: 'disease', label: 'DISEASE', body: 'Leaf blights and wilts are tracked plot by plot, season after season, and resistance is scored before a line goes any further.' },
        { id: 'soil', label: 'SOIL', body: 'Clay, loam, sand: every candidate grows across different soils, so growers get placement advice that fits their own fields.' },
        { id: 'density', label: 'DENSITY', body: 'Seed goes in at several planting rates, to find the balance between how many plants a field holds and how well each one does.' },
    ],
};

/** Frames of each condition's icon in the reference's sprite sheets (icons-0/1/2: 20 × 20 frames of 100 px). */
export const ICON_SEQUENCES: Record<string, { in: [number, number]; loop: [number, number] }> = {
    disease: { in: [0, 48], loop: [48, 149] },
    drought: { in: [150, 240], loop: [240, 299] },
    density: { in: [300, 354], loop: [354, 449] },
    soil: { in: [450, 503], loop: [503, 599] },
    wind: { in: [600, 637], loop: [637, 749] },
    dna: { in: [751, 751], loop: [751, 988] },
};

export const KERNEL_FACTS = {
    help: 'DRAG THE KERNEL',
    facts: [
        { label: 'YIELD', body: 'Across three seasons of on-farm trials, the newest class has delivered a clear yield lead over the varieties it replaces.' },
        { label: 'CONSISTENCY', body: 'Predictions run through thousands of simulated seasons, then two years of late-stage trials, so performance holds year after year.' },
        { label: 'PROTECTION', body: 'Protection above and below ground, balanced against agronomic strength, so the plant spends its energy on the ear.' },
    ],
};

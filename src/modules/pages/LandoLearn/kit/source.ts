// Read-only re-exports of the source's pure data and graphics, so demo numbers match the real page exactly.
export { GALLERY, GALLERY_TRAVEL, IMG, MANIFESTO, MARQUEE, NAV, PARTNERS, SOCIALS, TEAM_LINE } from '@/modules/pages/LandoNorris/data';
export { Emblem, FOUR_BOX, FOUR_PATH, HookArrow, LoopArrow, MenuBars, Monogram, ReturnArrow, TrackMap } from '@/modules/pages/LandoNorris/graphics';
export { SCRIPT_COLLABS, SCRIPT_ON, SIGNATURE_BIG, SIGNATURE_SMALL } from '@/modules/pages/LandoNorris/scribbles';
export { PartnerLogo } from '@/modules/pages/LandoNorris/sections/PartnerLogo';

/** Source colours (sampled from the reference video, lando.scss tokens). */
export const LN = {
    lime: '#cdff0b',
    dark: '#22281c',
    black: '#111111',
    light: '#f1f3e8',
    hero: '#fafbf6',
    ink: '#1b1c17',
    paper: '#dbe1d3',
    sub: '#b5b7ae',
    limeSerif: '#b8d43a',
    blockLight: '#1e1f1a',
} as const;

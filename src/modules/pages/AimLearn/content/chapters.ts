export const CHAPTERS = [
    { id: 'map', n: '00', label: 'The map', blurb: 'One scroll position runs seven scenes' },
    { id: 'layout', n: '01', label: 'Layout', blurb: 'The whole page is fractions of the window width' },
    { id: 'masks', n: '02', label: 'Mask reveals', blurb: 'Lines rise out of invisible windows' },
    { id: 'tracks', n: '03', label: 'Scroll tracks', blurb: 'Scroll is the playhead; every track is linear' },
    { id: 'pinned', n: '04', label: 'Pinned stage', blurb: 'A tall track, a sticky stage, layers on one progress' },
    { id: 'images', n: '05', label: 'Images in motion', blurb: 'Colour first, photo second, one gesture' },
    { id: 'interact', n: '06', label: 'Hovers & overlays', blurb: 'Small swaps, big sheets, one owner per element' },
    { id: 'build', n: '07', label: 'Build your own', blurb: 'Recipe, a scene generator and the final quiz' },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]['id'];

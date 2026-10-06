export const CHAPTERS = [
    { id: 'map', n: '00', label: 'The map', blurb: 'Seed in, 400,000 grains of sand out' },
    { id: 'seeds', n: '01', label: 'Seeds', blurb: 'Same word, same artwork, forever' },
    { id: 'traits', n: '02', label: 'Traits & rarity', blurb: 'How 18 palettes and 10 traits get their odds' },
    { id: 'noise', n: '03', label: 'Noise & bells', blurb: 'Two kinds of randomness that look natural' },
    { id: 'ridge', n: '04', label: 'Ridge walk', blurb: 'Two sine waves walk down a dune' },
    { id: 'maps', n: '05', label: 'Boundary maps', blurb: 'Diagonal stripes decide core, slope or sky' },
    { id: 'warp', n: '06', label: 'Warp & unwarp', blurb: 'Bend the picture, then ask backwards' },
    { id: 'brush', n: '07', label: 'Sand brush', blurb: 'Probability is the only paint' },
    { id: 'shader', n: '08', label: 'Into the shader', blurb: 'The same art on the GPU, live' },
    { id: 'living', n: '09', label: 'Living dunes', blurb: 'Explore: wind moves through the sand' },
    { id: 'type', n: '10', label: 'Sand type', blurb: 'Explore: words and images made of grains' },
    { id: 'strata', n: '11', label: 'Strata', blurb: 'Explore: warped noise sliced into rock' },
    { id: 'build', n: '12', label: 'Build your own', blurb: 'Recipe, the debug panel, final quiz' },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]['id'];

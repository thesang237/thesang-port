/**
 * Plain-language dictionary. Hover any dotted-underlined word in the guide to see its entry.
 * `lens` = how a designer might already think about it.
 */
export type GlossaryEntry = { term: string; plain: string; lens?: string };

export const GLOSSARY: Record<string, GlossaryEntry> = {
    seed: {
        term: 'seed',
        plain: 'The text a piece is grown from. Every random choice in the artwork comes from it, so the same seed always gives the same picture.',
        lens: 'A file name that is also the whole file.',
    },
    hash: {
        term: 'hash',
        plain: 'A recipe that scrambles any text into a fixed set of numbers. Change one letter and the numbers change completely; same text, same numbers, always.',
        lens: 'A fingerprint: tiny, unique, and you can’t rebuild the hand from it.',
    },
    stream: {
        term: 'random stream',
        plain: 'A seeded generator: call it and you get the next number, call it again and you get the one after. It never repeats in practice, and it always produces the same list for the same seed.',
        lens: 'A shuffled deck you deal from the top. Same shuffle, same cards, same order.',
    },
    fxhash: {
        term: 'fxhash',
        plain: 'A platform for long-form generative art: each mint gets a random hash, and the artwork must turn that hash into one unique, repeatable piece. fxrand() is its seeded random function.',
    },
    trait: {
        term: 'trait',
        plain: 'A named feature of a piece (Palette: Mars, Dunes: 12). Collectors read them like a label; rare traits make rare pieces.',
        lens: 'A variant property in a Figma component, chosen by dice.',
    },
    bag: {
        term: 'weighted bag',
        plain: 'A list you pick from at random where some entries appear several times. An entry listed three times is three times as likely.',
        lens: 'A raffle where some names have more tickets.',
    },
    whiteNoise: {
        term: 'white noise',
        plain: 'A fresh random value at every point, unrelated to its neighbours. Looks like TV static.',
    },
    perlin: {
        term: 'Perlin noise',
        plain: 'Smooth randomness: random slopes on a grid, blended so neighbouring points get similar values. Looks like hills, clouds or marble.',
        lens: 'Turbulent Displace / Fractal Noise in After Effects.',
    },
    smootherstep: {
        term: 'smootherstep',
        plain: 'An S-shaped 0 → 1 curve (6t⁵ − 15t⁴ + 10t³) that starts and ends flat, so grid cells join without visible creases.',
        lens: 'An ease-in-out with zero speed at both ends.',
    },
    gaussian: {
        term: 'bell curve (Gaussian)',
        plain: 'Random values that cluster around the middle: most land near 0, few far away. About 68 % fall between −1 and 1.',
        lens: 'Spray paint: dense in the centre, thinning out at the edges.',
    },
    octave: {
        term: 'octave',
        plain: 'One layer of noise. Each extra octave is twice as fine and half as strong, adding detail on top of the big shapes.',
        lens: 'Big brush, then smaller brushes for detail.',
    },
    fbm: {
        term: 'fBm (fractal noise)',
        plain: 'Several octaves of noise added together: big hills with smaller bumps on them, like real terrain.',
    },
    sine: {
        term: 'sine wave',
        plain: 'A smooth up-and-down. Frequency = how many waves, amplitude = how tall, phase = where along the wave you start.',
        lens: 'The Wiggle expression, but perfectly regular.',
    },
    ridge: {
        term: 'ridge walk',
        plain: 'The path traced from a dune’s peak downward, one small step at a time, swaying with two sine waves. It becomes the dune’s crest.',
    },
    stripe: {
        term: 'stripe (key)',
        plain: 'One thin diagonal band through the picture. Every point belongs to one \\ stripe and one / stripe; the stripe number is its “key”.',
    },
    keyRes: {
        term: 'key resolution',
        plain: 'How many stripes fit in one unit of height. More stripes = a finer, smoother dune edge; fewer = a stepped, chunky one.',
        lens: 'Resolution of a halftone screen.',
    },
    boundaryMap: {
        term: 'boundary map',
        plain: 'A lookup table: stripe number → the height where the ridge first crossed that stripe. Two per dune, one per diagonal direction.',
    },
    zone: {
        term: 'zone (shade)',
        plain: 'The answer a point gets: dark core, lit slope or sky. Each zone has its own chance of being drawn.',
    },
    modelSpace: {
        term: 'model space',
        plain: 'The flat, undistorted world the dunes are built in, before the picture is bent.',
        lens: 'The artboard before a Warp effect.',
    },
    warp: {
        term: 'warp',
        plain: 'Moving every point of a picture by a formula: here a sine wave (wavy horizon) and a power curve (depth squeeze).',
        lens: 'Envelope distort / Mesh Warp.',
    },
    pull: {
        term: 'pull (inverse mapping)',
        plain: 'Instead of pushing shapes onto the canvas, start from each canvas point and ask where it came from. No gaps, no doubles.',
        lens: 'A displacement map: every output pixel looks up its source.',
    },
    powerCurve: {
        term: 'power curve',
        plain: 'y raised to a power. Below 1 it stretches the top and squeezes the bottom (or the reverse above 1), like perspective.',
        lens: 'A curves adjustment on position instead of brightness.',
    },
    stipple: {
        term: 'stippling',
        plain: 'Making tone from dots: more dots read as darker. Here the number of dots comes from a probability per zone.',
        lens: 'Pointillism, halftone, a mezzotint screen.',
    },
    density: {
        term: 'draw chance (density)',
        plain: 'The probability a dot is kept. 1 = every dot drawn (solid), 0.1 = one in ten (a light speckle).',
    },
    alphaStack: {
        term: 'opacity stacking',
        plain: 'Semi-transparent dots on top of each other get darker: k dots of opacity α give 1 − (1 − α)^k.',
        lens: 'Multiply layers of the same translucent ink.',
    },
    fragment: {
        term: 'fragment shader',
        plain: 'A small program the GPU runs for every pixel at the same time. It gets the pixel’s position and returns its colour.',
        lens: 'A formula layer that paints each pixel by itself.',
    },
    uniform: {
        term: 'uniform',
        plain: 'A value handed to a shader from the page, the same for every pixel in a frame: a dial, the time, a colour.',
        lens: 'An exposed property on a component.',
    },
    texture: {
        term: 'texture',
        plain: 'An image (or any grid of numbers) the shader can read by position. Here also used to carry data, not pictures.',
    },
    bake: {
        term: 'baking',
        plain: 'Working something out once in advance and storing the result, so the fast part only has to look it up.',
        lens: 'Pre-rendering a comp instead of re-rendering it every preview.',
    },
    gpuHash: {
        term: 'hash function (GPU)',
        plain: 'A formula that turns a position into a random-looking number. The GPU can’t share one random stream between pixels, so each pixel asks “the random number at this place”.',
    },
    domainWarp: {
        term: 'domain warping',
        plain: 'Bending the coordinates you feed into noise using more noise. Simple noise becomes marbled, folded, geological.',
        lens: 'Turbulent Displace applied to the input of Fractal Noise.',
    },
    fract: {
        term: 'fract / floor',
        plain: 'floor(x) keeps the whole part (which band), fract(x) keeps the fraction (where inside the band). Together they slice any smooth value into repeating bands.',
        lens: 'Posterize, plus the gradient inside each step.',
    },
    lambda: {
        term: 'expected tries (λ)',
        plain: 'On average how many of the art’s dots land in one dot-sized cell. About 0.58: most cells get none or one.',
    },
};

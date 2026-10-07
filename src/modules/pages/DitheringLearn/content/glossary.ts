/** Plain-language bridge; hover, focus, or tap a dotted term to read it. */
export const GLOSSARY: Record<string, string> = {
    'render target': 'An offscreen image the GPU can read in another pass. Think of an After Effects precomp.',
    'render targets': 'Offscreen images passed between GPU effects, like precomps in a composition.',
    uniform: 'A shared shader setting. A slider writes it once; every output pixel reads the same value.',
    uniforms: 'Shared shader settings: one value is available to every output pixel.',
    uv: 'A position on an image, with each axis normalized from 0 to 1.',
    dpr: 'Device pixel ratio: physical pixels per CSS pixel. Doubling it quadruples the pixel count.',
    luminance: 'A weighted measure of brightness, accounting for the different contributions of red, green and blue.',
    threshold: 'The cutoff a brightness value must cross before a pixel becomes paper instead of ink.',
    seed: 'A fixed number that selects a repeatable random arrangement.',
    'fragment shader': 'A small GPU program deciding the colour of each output pixel.',
};

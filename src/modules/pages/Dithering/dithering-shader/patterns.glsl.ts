/**
 * Pure screen functions: position (in cells) -> a threshold in [0, 1].
 * No scene, textures or time. To add a print, implement its threshold here
 * and append an ID to PATTERNS in settings.ts and printThreshold below.
 */
export const PATTERN_GLSL = /* glsl */ `
float cellHash(vec2 p, float seed) {
    return fract(sin(dot(p, vec2(127.1, 311.7)) + seed * 17.17) * 43758.5453);
}

// Each larger Bayer matrix interleaves a new pair of x/y bits.
float bayerRank(vec2 p, float size) {
    p = mod(floor(p), size);
    float rank = 0.0;
    for (int bit = 0; bit < 3; bit++) {
        if (exp2(float(bit)) < size) {
            vec2 pair = mod(p, 2.0);
            float digit = 2.0 * mod(pair.x + pair.y, 2.0) + pair.y;
            rank = rank * 4.0 + digit;
            p = floor(p / 2.0);
        }
    }
    return (rank + 0.5) / (size * size);
}

float printThreshold(vec2 p, float pattern, float seed, float brightness) {
    if (pattern < 0.5) return bayerRank(p, 2.0);
    if (pattern < 1.5) return bayerRank(p, 4.0);
    if (pattern < 2.5) return bayerRank(p, 8.0);
    if (pattern < 3.5) return cellHash(floor(p), seed);

    vec2 local = fract(p) - 0.5;
    // Squared radius controls dot area; the circle reaches the cell corners.
    if (pattern < 4.5) return clamp(dot(local, local) * 2.0, 0.0, 1.0);
    if (pattern < 5.5) return min(abs(local.x), abs(local.y)) * 2.0;
    if (pattern < 6.5) return abs(local.y) * 2.0;
    if (pattern < 7.5) {
        float weave = mod(floor(p.x) + floor(p.y), 2.0);
        return mix(abs(local.x), abs(local.y), weave) * 2.0;
    }
    // A tonal screen rather than a spatial screen: bands follow the source.
    return fract(brightness * 12.0 + 0.15 * sin(p.x * 0.25));
}
`;

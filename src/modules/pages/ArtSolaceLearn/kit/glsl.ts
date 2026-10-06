// Shared GLSL for the shader chapters. Each block is plain text pasted into a fragment shader.

/**
 * Hash: a random-looking number for any point, the same every frame. The GPU's stand-in for the
 * art's seeded random stream: instead of "the next number", ask "the number at this place".
 * (Dave Hoskins, "Hash without Sine", MIT.)
 */
export const HASH = /* glsl */ `
float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}
float hash13(vec3 p3) {
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
}
vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
}
`;

/** Gradient noise (Perlin's idea in 2D): smooth hills, about -0.7..0.7. Plus fbm: octaves of it stacked. */
export const NOISE = /* glsl */ `
float gnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0); // the same smootherstep as the art's Perlin
    float a = dot(hash22(i) * 2.0 - 1.0, f);
    float b = dot(hash22(i + vec2(1.0, 0.0)) * 2.0 - 1.0, f - vec2(1.0, 0.0));
    float c = dot(hash22(i + vec2(0.0, 1.0)) * 2.0 - 1.0, f - vec2(0.0, 1.0));
    float d = dot(hash22(i + vec2(1.0, 1.0)) * 2.0 - 1.0, f - vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p, int octaves) {
    float sum = 0.0, amp = 0.5;
    for (int i = 0; i < 8; i++) {
        if (i >= octaves) break;
        sum += amp * gnoise(p);
        p = p * 2.03 + vec2(17.1, 9.2); // each octave: twice as fine, half as strong
        amp *= 0.5;
    }
    return sum;
}
`;

/** The art's unwarp(), line for line (warp.ts). y is down, like the canvas. */
export const UNWARP = /* glsl */ `
uniform float uVC;      // verticalCompression
uniform float uAmpY;    // warpAmplY
uniform float uFreqY;   // warpFreqY
uniform float uPhaseY;  // warpPhaseY
uniform float uFlip;    // 1 = mirrored

vec2 unwarp(vec2 c) {
    float lo = pow(0.05, uVC), hi = pow(1.05, uVC);
    float y = pow(mix(lo, hi, c.y), 1.0 / uVC) - 0.05;   // undo the depth squeeze
    y -= uAmpY * sin(uPhaseY + uFreqY * c.x);            // undo the wavy horizon
    float x = uFlip > 0.5 ? 1.0 - c.x : c.x;             // undo the mirror
    return vec2(x, y);
}
`;

/**
 * The art's shade test (dunes.ts › shadeOfPeak) on the GPU. The boundary maps were baked into a
 * texture (see bake.ts): uMeta holds 2 texels per dune, uEdges every edge height in one long row
 * wrapped at EDGE_W.
 */
export const DUNES = /* glsl */ `
uniform highp sampler2D uEdges;
uniform highp sampler2D uMeta;
uniform int uCount;
uniform float uSway;       // Dancers: sideways sway (0.15 in the art)
uniform float uSwayPhase;  // moves the sway over time (Living dunes)
uniform float uSkew;       // -amount, 0 or +amount
const float EDGE_W = 4096.0;

float edgeAt(float offset, float minKey, float count, float key) {
    float i = key - minKey;
    if (i < 0.0 || i >= count) return 0.0;  // a stripe the ridge never crossed
    float idx = offset + i;
    return texelFetch(uEdges, ivec2(int(mod(idx, EDGE_W)), int(idx / EDGE_W)), 0).r;
}

// 0 = dark core, 1 = lit slope, 2 = sky. which = the dune that claimed the point (-1 for sky).
int shadeAt(vec2 p, out int which) {
    which = -1;
    for (int i = 0; i < 256; i++) {
        if (i >= uCount) break;
        vec4 a = texelFetch(uMeta, ivec2(i * 2, 0), 0);     // slope, keyRes, leftMin, leftCount
        vec4 b = texelFetch(uMeta, ivec2(i * 2 + 1, 0), 0); // rightMin, rightCount, leftOffset, rightOffset
        vec2 c = p;
        c.x += uSway * sin(12.0 * c.y + uSwayPhase);
        c.x += uSkew * c.y;
        float leftKey = floor((c.y - a.x * c.x) * a.y);
        float rightKey = floor((c.y + a.x * c.x) * a.y);
        float left = edgeAt(b.z, a.z, a.w, leftKey);
        if (p.y <= left) left = 0.0;
        float right = edgeAt(b.w, b.x, b.y, rightKey);
        if (p.y <= right) right = 0.0;
        if (right > left) { which = i; return 0; }
        if (left > right) { which = i; return 1; }
    }
    return 2;
}
`;

/**
 * Sand without a loop over dots: split the canvas into dot-sized cells and ask each cell how many
 * of the art's dots would have landed in it (λ = expected tries per cell, 4 hashed tries), each
 * kept with the zone's draw chance. k kept dots of opacity α stack to 1 − (1 − α)^k.
 */
export const GRAIN = /* glsl */ `
uniform float uDotSize;      // one dot, as a fraction of the canvas (0.0012)
uniform float uTries;        // expected dots tried per cell (≈ 0.58 in the art)
uniform float uInkAlpha;     // one dot's opacity, 0..1
uniform float uGrainSeed;    // change it to re-throw every grain

float inkAt(vec2 c, float density) {
    vec2 cell = floor(c / uDotSize);
    float kept = 0.0;
    for (int s = 0; s < 4; s++) {
        float h = hash13(vec3(cell, uGrainSeed + float(s) * 19.19));
        kept += step(h, density * uTries * 0.25);
    }
    // (max: pow(0.0, 0.0) is undefined on GPUs, and fully opaque ink would hit it when no dot landed)
    return 1.0 - pow(max(1.0 - uInkAlpha, 1e-4), kept);
}
`;

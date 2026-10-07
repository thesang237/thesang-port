import { PATTERN_GLSL } from './patterns.glsl';

/**
 * Read in order: sample -> tone -> screen -> levels -> palette -> surface.
 * Resolution is physical pixels; pixelRatio keeps marks in CSS pixels.
 * Adapted from niccolofanton's original dithering-shader experiment.
 */
const ditheringShader = /* glsl */ `
uniform vec2 resolution;
uniform float pixelRatio;
uniform float pattern;
uniform float cellSize;
uniform float pixelSize;
uniform float angle;
uniform float stretch;
uniform float softness;
uniform float seed;
uniform float levels;
uniform float exposure;
uniform float contrast;
uniform float gamma;
uniform float threshold;
uniform float strength;
uniform float colorMode;
uniform vec3 ink;
uniform vec3 paper;
uniform float invert;
uniform float warp;
uniform float aberration;
uniform float grain;
uniform float scanlines;
uniform float vignette;

${PATTERN_GLSL}

vec3 sampleImage(vec2 uv) {
    vec2 centered = uv - 0.5;
    uv = 0.5 + centered * (1.0 + warp * dot(centered, centered) * 4.0);
    float block = max(1.0, pixelSize * pixelRatio);
    // Sample the center of a block, not its lower-left corner.
    uv = (floor(uv * resolution / block) + 0.5) * block / resolution;
    vec2 split = vec2(aberration * pixelRatio / resolution.x, 0.0);
    vec2 inset = 0.5 / resolution;
    return vec3(
        texture2D(inputBuffer, clamp(uv + split, inset, 1.0 - inset)).r,
        texture2D(inputBuffer, clamp(uv, inset, 1.0 - inset)).g,
        texture2D(inputBuffer, clamp(uv - split, inset, 1.0 - inset)).b
    );
}

vec3 shapeTone(vec3 color) {
    color *= exp2(exposure);
    color = (color - 0.5) * contrast + 0.5;
    return clamp(pow(max(color, vec3(0.0)), vec3(1.0 / gamma)) + threshold, 0.0, 1.0);
}

float quantizeTone(float brightness, float screen) {
    float bands = max(levels - 1.0, 1.0);
    float scaled = clamp(brightness, 0.0, 1.0) * bands;
    float base = floor(scaled);
    float coverage = smoothstep(screen - softness, screen + softness, fract(scaled));
    float result = (base + coverage) / bands;
    if (brightness <= 0.0) return 0.0;
    if (brightness >= 1.0) return 1.0;
    return result;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 source = shapeTone(sampleImage(uv));
    float brightness = dot(source, vec3(0.2126, 0.7152, 0.0722));
    vec2 p = (uv - 0.5) * resolution / (cellSize * pixelRatio);
    float radians = angle * 0.01745329252;
    p = mat2(cos(radians), -sin(radians), sin(radians), cos(radians)) * p;
    p.x /= stretch;
    float screen = printThreshold(p, pattern, seed, brightness);
    // Radial thresholds turn low brightness into circular ink marks.
    if (pattern >= 3.5 && pattern < 7.5) screen = 1.0 - screen;
    float tone = quantizeTone(brightness, screen);
    if (invert > 0.5) tone = 1.0 - tone;

    vec3 printed = vec3(tone);
    if (colorMode > 0.5 && colorMode < 1.5) printed = mix(ink, paper, tone);
    if (colorMode > 1.5) {
        printed = vec3(quantizeTone(source.r, screen), quantizeTone(source.g, screen), quantizeTone(source.b, screen));
        if (invert > 0.5) printed = 1.0 - printed;
    }
    printed += (cellHash(floor(uv * resolution / pixelRatio), seed + 43.0) - 0.5) * grain;
    printed *= 1.0 - scanlines * 0.35 * step(0.5, fract(uv.y * resolution.y / (2.0 * pixelRatio)));
    printed *= 1.0 - vignette * smoothstep(0.15, 0.7, length(uv - 0.5));
    outputColor = vec4(mix(inputColor.rgb, clamp(printed, 0.0, 1.0), strength), inputColor.a);
}
`;
export default ditheringShader;

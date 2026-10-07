/** Original teaching subjects. This creates an image; the real studio shader prints it. */
export const FIELD_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
export const FIELD_FRAGMENT = /* glsl */ `
varying vec2 vUv;
uniform vec2 size;
uniform float subject;
uniform float phase;
uniform float frequency;
void main() {
    vec2 p = (vUv - 0.5) * vec2(size.x / size.y, 1.0);
    vec3 color = vec3(vUv.x);
    if (subject > 0.5 && subject < 1.5) {
        // An eclipsed moon, an orbital ring and a tiny satellite.
        float moon = 1.0 - smoothstep(0.235, 0.24, length(p - vec2(-0.08, 0.025)));
        float light = clamp(0.2 + dot(normalize(vec3(p + vec2(0.08, -0.025), 0.18)), normalize(vec3(-1.0, 0.8, 0.5))), 0.0, 1.0);
        float ring = 1.0 - smoothstep(0.005, 0.012, abs(length(p * vec2(0.8, 1.8)) - 0.36));
        float satellite = 1.0 - smoothstep(0.035, 0.04, length(p - vec2(0.29 * cos(phase), 0.29 * sin(phase))));
        color = vec3(mix(0.93, light, moon) - ring * 0.6 - satellite * 0.65);
    }
    if (subject > 1.5 && subject < 2.5) {
        float landscape = sin(p.x * frequency + phase + sin(p.y * 7.0)) * 0.18;
        float ridge = smoothstep(-0.03, 0.03, p.y - landscape);
        color = vec3(mix(0.2 + 0.15 * sin(p.y * 22.0 + p.x * 9.0), 0.65 + p.y * 0.6, ridge));
    }
    if (subject > 2.5 && subject < 3.5) {
        float ribbon = 0.5 + 0.5 * sin(p.x * frequency + sin(p.y * 7.0 + phase) * 3.0);
        color = vec3(ribbon * (0.65 + 0.35 * cos(p.y * 6.0)));
    }
    if (subject > 3.5) {
        color = 0.5 + 0.5 * cos(vec3(0.0, 2.1, 4.2) + vUv.x * 6.283 + phase);
        color *= 0.3 + 0.7 * vUv.y;
    }
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    #include <colorspace_fragment>
}
`;

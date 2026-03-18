precision mediump float;

uniform float uTime;
uniform vec2 uResolution;

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
  vec2 uv = vUv;

  // Animated noise field
  float t = uTime * 0.15;
  float n1 = noise(uv * 3.0 + t);
  float n2 = noise(uv * 6.0 - t * 0.7 + 1.5);
  float n = n1 * 0.6 + n2 * 0.4;

  // Dark gradient base
  vec3 darkBase = vec3(0.02, 0.02, 0.04);
  vec3 accentColor = vec3(0.15, 0.08, 0.35);
  vec3 highlightColor = vec3(0.05, 0.18, 0.4);

  // Vignette
  float dist = length(uv - 0.5) * 1.6;
  float vignette = 1.0 - smoothstep(0.3, 1.2, dist);

  // Combine
  vec3 color = mix(darkBase, accentColor, n * 0.4 * vignette);
  color = mix(color, highlightColor, (1.0 - n) * 0.2 * vignette);

  // Scanlines
  float scanline = sin(uv.y * 200.0) * 0.015;
  color += scanline;

  gl_FragColor = vec4(color, 1.0);
}

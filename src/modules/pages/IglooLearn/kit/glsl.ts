// The same GLSL snippets the Igloo shaders share (hash + simplex noise + fbm).
export { HASH, SNOISE } from '@/modules/pages/Igloo/utils/glsl';

/** Full-screen triangle-pair vertex shader: paints straight into clip space. */
export const QUAD_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

/** Regular mesh vertex shader that passes uv through. */
export const UV_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

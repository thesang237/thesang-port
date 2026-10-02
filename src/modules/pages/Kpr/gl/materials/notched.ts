'use client';

import * as THREE from 'three';

/**
 * The signature KPR frame: a rounded rectangle with a stepped "folder tab" notch cut from one
 * corner (45° chamfered step), and an optional 45° corner cut. Built as an SDF in pixel units so it
 * stays crisp at any size and every parameter can animate.
 *
 * A card has two faces. The front shows `uMapF`, the back `uMapB` (mirrored so it reads the right way
 * round once the card has turned). Each face is cover-fitted, zoomed around a focus point and shifted
 * by the pointer parallax. The shape is evaluated in viewer space on both faces, so a notch set for
 * "top right" is top right whichever face is showing. `uSingle` = 1 hides the back entirely.
 */

const vertex = /* glsl */ `
    uniform float uSkew;
    uniform float uBend;
    varying vec2 vUv;
    void main() {
        vUv = uv;
        vec3 p = position;
        p.x += p.y * uSkew;
        p.z += (1.0 - pow(abs(p.x * 2.0), 2.0)) * uBend;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
`;

const fragment = /* glsl */ `
    uniform vec2 uSize;
    uniform float uRadius;
    uniform vec4 uNotch;      // corner (0 TL, 1 TR, 2 BR, 3 BL), axis (0 along the horizontal edge, 1 vertical), length, depth
    uniform vec4 uNotch2;     // a second notch, same layout (depth 0 = off)
    uniform vec2 uLook;       // the picture's own turn inside the frame (yaw, pitch; flat images only)
    uniform vec2 uChamfer;    // corner, size
    uniform sampler2D uMapF;
    uniform sampler2D uMapB;
    uniform vec4 uFace;       // front on, back on, front aspect, back aspect
    uniform vec3 uBaseF;
    uniform vec3 uBaseB;
    uniform float uSingle;
    uniform float uZoom;
    uniform vec2 uFocus;
    uniform vec2 uParallax;
    uniform vec4 uWash;
    uniform float uOpacity;
    uniform float uChroma;
    uniform float uTime;
    uniform float uGrain;
    uniform float uFlickAmt;
    uniform float uDim;
    uniform sampler2D uNoise;
    uniform sampler2D uFlick;
    uniform vec4 uEdge;       // rgb + width (px) of an inner rim light, 0 = off
    uniform float uAlphaMap;  // 1 = the front texture's own alpha also cuts the card (baked shapes, text)
    varying vec2 vUv;

    float sdRoundBox(vec2 p, vec2 b, float r) {
        vec2 q = abs(p) - b + r;
        return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
    }
    float smax(float a, float b, float k) {
        float h = max(k - abs(a - b), 0.0) / max(k, 1e-4);
        return max(a, b) + h * h * k * 0.25;
    }
    // mirror p so that the given corner sits at +x,+y
    vec2 toCorner(vec2 p, float c) {
        if (c < 0.5) return vec2(-p.x, p.y);
        if (c < 1.5) return p;
        if (c < 2.5) return vec2(p.x, -p.y);
        return -p;
    }

    // one folder-tab notch: the cut is the region "above the step line and right of the 45° step",
    // with its own corner rounded (k), in the corner's local frame
    float notchCut(vec2 p, vec2 hs, vec4 n, float k) {
        vec2 q = toCorner(p, n.x);
        vec2 h = hs;
        if (n.y > 0.5) { q = q.yx; h = h.yx; }
        float len = min(n.z, h.x * 2.0);
        float a = q.y - (h.y - n.w);                                  // above the step line
        float b = ((q.x + q.y) - (h.x - len + h.y)) * 0.70710678;    // right of the 45° step
        return -smax(-a, -b, k); // smooth min: > 0 inside the cut
    }

    // every corner rounded: convex ones by the box radius, the joints the notch and the corner cut make
    // (including the obtuse 135° ones) by a smooth max
    float shape(vec2 p, vec2 hs) {
        float r = min(uRadius, min(hs.x, hs.y));
        float d = sdRoundBox(p, hs, r);
        // the joints are rounded about as much as the corners, but never more than the step is deep
        // (or the straight edges of the notch would melt into a wave)
        if (uNotch.w > 0.01) {
            float k = min(r * 1.1, uNotch.w * 0.75);
            d = smax(d, notchCut(p, hs, uNotch, k), k);
        }
        if (uNotch2.w > 0.01) {
            float k = min(r * 1.1, uNotch2.w * 0.75);
            d = smax(d, notchCut(p, hs, uNotch2, k), k);
        }
        // 45° corner cut
        if (uChamfer.y > 0.01) {
            vec2 q = toCorner(p, uChamfer.x);
            float c = ((q.x + q.y) - (hs.x + hs.y - uChamfer.y)) * 0.70710678;
            float k = min(r * 1.1, uChamfer.y * 0.5);
            d = smax(d, c, k);
        }
        return d;
    }

    vec3 face(sampler2D map, float on, vec3 base, vec2 puv) {
        if (on < 0.5) return base;
        vec4 c = texture2D(map, puv);
        return mix(base, c.rgb, c.a);
    }

    void main() {
        bool back = !gl_FrontFacing;
        if (back && uSingle > 0.5) discard;
        vec2 uv = back ? vec2(1.0 - vUv.x, vUv.y) : vUv;

        vec2 hs = uSize * 0.5;
        vec2 p = (uv - 0.5) * uSize;
        float d = shape(p, hs);
        float aa = max(fwidth(d), 1e-3);
        float mask = 1.0 - smoothstep(-aa * 0.5, aa * 0.5, d);
        if (mask * uOpacity <= 0.0) discard;

        // cover-fit the face into the card, then zoom around the focus point
        float ca = uSize.x / max(uSize.y, 1.0);
        float fa = back ? uFace.w : uFace.z;
        vec2 region = ca > fa ? vec2(1.0, fa / ca) : vec2(ca / fa, 1.0);
        region /= uZoom;
        vec2 c = (uv - 0.5) * region;
        // flat images turn inside the frame: a perspective warp (the picture plane yawed/pitched behind
        // the card) instead of a slide, so the near side grows and the far side shrinks
        float w = 1.0 + c.x * uLook.x + c.y * uLook.y;
        vec2 puv = uFocus + c / w + uParallax;

        vec3 col;
        if (back) {
            col = face(uMapB, uFace.y, uBaseB, puv);
            if (uChroma > 0.0005) col.r = face(uMapB, uFace.y, uBaseB, puv + (uv - 0.5) * uChroma).r;
        } else {
            if (uAlphaMap > 0.5) {
                mask *= texture2D(uMapF, puv).a;
                if (mask * uOpacity <= 0.002) discard;
            }
            col = face(uMapF, uFace.x, uBaseF, puv);
            if (uChroma > 0.0005) col.r = face(uMapF, uFace.x, uBaseF, puv + (uv - 0.5) * uChroma).r;
        }

        // inner rim (used on the sliver edges while a card swings)
        if (uEdge.w > 0.0) col = mix(col, uEdge.rgb, (1.0 - smoothstep(0.0, uEdge.w, -d)) * 0.6);

        col = mix(col, uWash.rgb, uWash.a);
        col *= 1.0 - uDim;

        // film grain + flicker (noise.webp / flick.webp from the reference)
        vec2 nuv = gl_FragCoord.xy / 512.0 + vec2(fract(uTime * 13.7), fract(uTime * 7.3));
        float n = texture2D(uNoise, nuv).r - 0.5;
        float fl = texture2D(uFlick, vec2(fract(uTime * 0.37), 0.5)).r - 0.5;
        col += n * uGrain;
        col *= 1.0 + fl * uFlickAmt;

        gl_FragColor = vec4(col, mask * uOpacity);
        #include <colorspace_fragment>
    }
`;

export type NotchedUniforms = {
    uSize: { value: THREE.Vector2 };
    uRadius: { value: number };
    uNotch: { value: THREE.Vector4 };
    uNotch2: { value: THREE.Vector4 };
    uLook: { value: THREE.Vector2 };
    uChamfer: { value: THREE.Vector2 };
    uMapF: { value: THREE.Texture | null };
    uMapB: { value: THREE.Texture | null };
    uFace: { value: THREE.Vector4 };
    uBaseF: { value: THREE.Color };
    uBaseB: { value: THREE.Color };
    uSingle: { value: number };
    uZoom: { value: number };
    uFocus: { value: THREE.Vector2 };
    uParallax: { value: THREE.Vector2 };
    uWash: { value: THREE.Vector4 };
    uOpacity: { value: number };
    uChroma: { value: number };
    uTime: { value: number };
    uGrain: { value: number };
    uFlickAmt: { value: number };
    uDim: { value: number };
    uSkew: { value: number };
    uBend: { value: number };
    uNoise: { value: THREE.Texture | null };
    uFlick: { value: THREE.Texture | null };
    uEdge: { value: THREE.Vector4 };
    uAlphaMap: { value: number };
};

export function createNotchedMaterial(shared: { noise: THREE.Texture | null; flick: THREE.Texture | null }) {
    const uniforms: NotchedUniforms = {
        uSize: { value: new THREE.Vector2(100, 100) },
        uRadius: { value: 12 },
        uNotch: { value: new THREE.Vector4(1, 0, 0, 0) },
        uNotch2: { value: new THREE.Vector4(1, 0, 0, 0) },
        uLook: { value: new THREE.Vector2() },
        uChamfer: { value: new THREE.Vector2(2, 0) },
        uMapF: { value: null },
        uMapB: { value: null },
        uFace: { value: new THREE.Vector4(0, 0, 16 / 9, 16 / 9) },
        uBaseF: { value: new THREE.Color('#888') },
        uBaseB: { value: new THREE.Color('#888') },
        uSingle: { value: 0 },
        uZoom: { value: 1 },
        uFocus: { value: new THREE.Vector2(0.5, 0.5) },
        uParallax: { value: new THREE.Vector2() },
        uWash: { value: new THREE.Vector4(1, 1, 1, 0) },
        uOpacity: { value: 1 },
        uChroma: { value: 0 },
        uTime: { value: 0 },
        uGrain: { value: 0.03 },
        uFlickAmt: { value: 0.03 },
        uDim: { value: 0 },
        uSkew: { value: 0 },
        uBend: { value: 0 },
        uNoise: { value: shared.noise },
        uFlick: { value: shared.flick },
        uEdge: { value: new THREE.Vector4(1, 1, 1, 0) },
        uAlphaMap: { value: 0 },
    };
    return new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
    });
}

import * as THREE from 'three';

import { SNOISE } from '../utils/glsl';

type Options = THREE.MeshStandardMaterialParameters & {
    bumpScale?: number;
    bumpStrength?: number;
    /** Seed noise per instance so every brick has its own grain. */
    instanced?: boolean;
};

/** MeshStandardMaterial + procedural snow grain (derivative bump + albedo noise). */
export function createSnowMaterial({ bumpScale = 3, bumpStrength = 0.6, instanced = false, ...params }: Options) {
    const mat = new THREE.MeshStandardMaterial(params);
    mat.onBeforeCompile = (shader) => {
        shader.uniforms.uBumpScale = { value: bumpScale };
        shader.uniforms.uBumpStrength = { value: bumpStrength };
        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec3 vNoiseP;')
            .replace(
                '#include <begin_vertex>',
                instanced
                    ? '#include <begin_vertex>\nvNoiseP = position * vec3(2.2, 1.4, 1.0) + float(gl_InstanceID) * 3.17;'
                    : '#include <begin_vertex>\nvNoiseP = (modelMatrix * vec4(position, 1.0)).xyz;',
            );
        shader.fragmentShader = shader.fragmentShader
            .replace(
                '#include <common>',
                `#include <common>\nvarying vec3 vNoiseP;\nuniform float uBumpScale;\nuniform float uBumpStrength;\n${SNOISE}\nfloat snowH(vec3 p){ return snoise(p * uBumpScale) * 0.6 + snoise(p * uBumpScale * 2.7) * 0.28 + snoise(p * uBumpScale * 6.1) * 0.12; }`,
            )
            .replace('#include <color_fragment>', '#include <color_fragment>\nfloat snowGrain = snowH(vNoiseP);\ndiffuseColor.rgb *= 0.94 + 0.08 * snowGrain;')
            .replace(
                '#include <normal_fragment_maps>',
                `#include <normal_fragment_maps>
                {
                    vec3 dpdx = dFdx(-vViewPosition);
                    vec3 dpdy = dFdy(-vViewPosition);
                    float dhdx = dFdx(snowGrain);
                    float dhdy = dFdy(snowGrain);
                    vec3 r1 = cross(dpdy, normal);
                    vec3 r2 = cross(normal, dpdx);
                    float det = dot(dpdx, r1);
                    vec3 grad = sign(det) * (dhdx * r1 + dhdy * r2);
                    normal = normalize(abs(det) * normal - uBumpStrength * grad);
                }`,
            );
    };
    mat.customProgramCacheKey = () => `snow-${instanced}-${bumpScale}`;
    return mat;
}

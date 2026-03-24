// https://cydstumpel.nl/ — original by Cyd Stumpel
// BentPlaneGeometry by Paul West @prisoner849
// https://discourse.threejs.org/t/simple-curved-plane/26647/10

import { extend } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Bent Plane Geometry ──────────────────────────────────────────────────────
// Takes a flat PlaneGeometry and curves its vertices in an arc.
// The `radius` controls the tightness of the bend (smaller = tighter curve).

export class BentPlaneGeometry extends THREE.PlaneGeometry {
    constructor(radius: number, ...args: ConstructorParameters<typeof THREE.PlaneGeometry>) {
        super(...args);
        const p = this.parameters;
        const hw = p.width * 0.5;
        const a = new THREE.Vector2(-hw, 0);
        const b = new THREE.Vector2(0, radius);
        const c = new THREE.Vector2(hw, 0);
        const ab = new THREE.Vector2().subVectors(a, b);
        const bc = new THREE.Vector2().subVectors(b, c);
        const ac = new THREE.Vector2().subVectors(a, c);
        const r = (ab.length() * bc.length() * ac.length()) / (2 * Math.abs(ab.cross(ac)));
        const center = new THREE.Vector2(0, radius - r);
        const baseV = new THREE.Vector2().subVectors(a, center);
        const baseAngle = baseV.angle() - Math.PI * 0.5;
        const arc = baseAngle * 2;
        const uv = this.attributes.uv;
        const pos = this.attributes.position;
        const mainV = new THREE.Vector2();
        for (let i = 0; i < uv.count; i++) {
            const uvRatio = 1 - uv.getX(i);
            const y = pos.getY(i);
            mainV.copy(c).rotateAround(center, arc * uvRatio);
            pos.setXYZ(i, mainV.x, y, -mainV.y);
        }
        pos.needsUpdate = true;
    }
}

// ─── Mesh Sine Material ───────────────────────────────────────────────────────
// Extends MeshBasicMaterial with a custom vertex shader that animates vertices
// using a sine wave. The `time` uniform is driven externally (e.g. scroll delta).

export class MeshSineMaterial extends THREE.MeshBasicMaterial {
    readonly time: { value: number };

    constructor(parameters: THREE.MeshBasicMaterialParameters = {}) {
        super(parameters);
        this.setValues(parameters);
        this.time = { value: 0 };
    }

    onBeforeCompile(shader: THREE.WebGLProgramParametersWithUniforms) {
        shader.uniforms.time = this.time;
        shader.vertexShader = `uniform float time;\n${shader.vertexShader}`;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = vec3(position.x, position.y + sin(time + uv.x * PI * 4.0) / 4.0, position.z);`);
    }
}

// Register custom elements so JSX can use <bentPlaneGeometry> and <meshSineMaterial>
extend({ BentPlaneGeometry, MeshSineMaterial });

// ─── Type augmentation for R3F JSX ───────────────────────────────────────────
import type { ThreeElement } from '@react-three/fiber';

declare module '@react-three/fiber' {
    type ThreeElements = {
        bentPlaneGeometry: ThreeElement<typeof BentPlaneGeometry>;
        meshSineMaterial: ThreeElement<typeof MeshSineMaterial>;
    };
}

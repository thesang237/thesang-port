'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { noise3D } from './noise';
import type { Params } from './types';

const MAX_GRID = 20;
const CUBE_SIZE = 0.85;
const GAP = 1.0;
const MAX_CUBES = MAX_GRID ** 3;

// Module-level temporaries — never recreated, same as original
const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
const _matrix = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _color = new THREE.Color();
const _bright = new THREE.Color();
const _dark = new THREE.Color();

type Props = { paramsRef: { current: Params } };

export function CubeGrid({ paramsRef }: Props) {
    const meshRef = useRef<THREE.InstancedMesh>(null!);
    const geometry = useMemo(() => new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE), []);
    const material = useMemo(() => new THREE.MeshStandardMaterial({ metalness: 0.15, roughness: 0.6 }), []);

    useEffect(() => {
        return () => {
            geometry.dispose();
            material.dispose();
        };
    }, [geometry, material]);

    useFrame(({ clock }) => {
        const mesh = meshRef.current;
        if (!mesh) return;
        const p = paramsRef.current;
        const t = clock.getElapsedTime();

        const gx = Math.round(p.gridX);
        const gy = Math.round(p.gridY);
        const gz = Math.round(p.gridZ);
        const activeCount = gx * gy * gz;
        const offsetX = (gx - 1) * GAP * 0.5;
        const offsetY = (gy - 1) * GAP * 0.5;
        const offsetZ = (gz - 1) * GAP * 0.5;

        _bright.set(p.brightColor);
        _dark.set(p.darkColor);

        let idx = 0;
        for (let x = 0; x < gx; x++) {
            for (let y = 0; y < gy; y++) {
                for (let z = 0; z < gz; z++) {
                    const normX = gx > 1 ? (x / (gx - 1)) * 19 : 9.5;
                    const normY = gy > 1 ? (y / (gy - 1)) * 19 : 9.5;
                    const normZ = gz > 1 ? (z / (gz - 1)) * 19 : 9.5;

                    const nx = normX * p.freq + t * p.speed;
                    const ny = normY * p.freq + t * p.speed * 0.7;
                    const nz = normZ * p.freq + t * p.speed * 0.5;

                    let n: number;
                    switch (p.noiseType) {
                        case 'ridged':
                            n = 1.0 - Math.abs(noise3D(nx, ny, nz)) * 2.0;
                            break;
                        case 'billow':
                            n = Math.abs(noise3D(nx, ny, nz)) * 2.0 - 0.5;
                            break;
                        case 'fbm':
                            n = noise3D(nx, ny, nz) * 0.5 + noise3D(nx * 2, ny * 2, nz * 2) * 0.25 + noise3D(nx * 4, ny * 4, nz * 4) * 0.125;
                            break;
                        case 'waveRadial': {
                            const d = Math.sqrt((normX - 9.5) ** 2 + (normY - 9.5) ** 2 + (normZ - 9.5) ** 2);
                            n = Math.sin(d * p.freq * 2.0 - t * p.speed * 3.0);
                            break;
                        }
                        case 'wavePlanar':
                            n = Math.sin(x * p.freq * 1.5 + t * p.speed * 2.0) * Math.sin(y * p.freq * 1.5 + t * p.speed * 1.7) * Math.sin(z * p.freq * 1.5 + t * p.speed * 1.3);
                            break;
                        case 'waveCross':
                            n = (Math.sin(x * p.freq * 2.0 + t * p.speed * 2.5) + Math.sin(y * p.freq * 2.0 + t * p.speed * 2.0) + Math.sin(z * p.freq * 2.0 + t * p.speed * 1.5)) / 3.0;
                            break;
                        case 'waveSpiral': {
                            const cx = normX - 9.5;
                            const cz = normZ - 9.5;
                            const angle = Math.atan2(cz, cx);
                            const dist = Math.sqrt(cx ** 2 + cz ** 2);
                            n = Math.sin(dist * p.freq * 2.0 + angle * 3.0 - t * p.speed * 3.0) * Math.cos(y * p.freq * 1.5 + t * p.speed);
                            break;
                        }
                        case 'waveDiamond': {
                            const manhattan = Math.abs(normX - 9.5) + Math.abs(normY - 9.5) + Math.abs(normZ - 9.5);
                            n = Math.sin(manhattan * p.freq * 1.2 - t * p.speed * 3.0);
                            break;
                        }
                        default:
                            n = noise3D(nx, ny, nz);
                    }

                    const nNorm = Math.pow(Math.max(0, Math.min(1, n * 0.5 + 0.5)), p.exag);
                    const s = 0.02 + nNorm * nNorm * p.scaleMax;

                    _pos.set(x * GAP - offsetX, y * GAP - offsetY, z * GAP - offsetZ);
                    _scale.set(s * p.scaleX, s * p.scaleY, s * p.scaleZ);
                    _matrix.compose(_pos, _quat.identity(), _scale);
                    mesh.setMatrixAt(idx, _matrix);

                    const contrasted = Math.pow(nNorm, p.contrast);
                    _color.copy(_dark).lerp(_bright, contrasted).multiplyScalar(p.colorMix);
                    mesh.setColorAt(idx, _color);

                    idx++;
                }
            }
        }

        for (let i = activeCount; i < MAX_CUBES; i++) {
            mesh.setMatrixAt(i, zeroMatrix);
        }

        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });

    return <instancedMesh ref={meshRef} args={[geometry, material, MAX_CUBES]} castShadow receiveShadow />;
}

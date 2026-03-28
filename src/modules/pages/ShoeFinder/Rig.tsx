'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { easing } from 'maath';
import * as THREE from 'three';

import { CONFIG } from './gridConfig';
import { rigState } from './gridState';

type RigProps = {
    gridW: number;
    gridH: number;
};

export function Rig({ gridW, gridH }: RigProps) {
    const { camera, gl } = useThree();
    const prevPos = useRef(new THREE.Vector3());
    const hasSetInitialZoom = useRef(false);

    useEffect(() => {
        if (!hasSetInitialZoom.current && rigState.zoom) {
            // eslint-disable-next-line react-hooks/immutability
            (camera as THREE.PerspectiveCamera).position.z = rigState.zoom;
            hasSetInitialZoom.current = true;
        }
    }, [camera]);

    const getBounds = () => {
        const cam = camera as THREE.PerspectiveCamera;
        const dist = cam.position.z;
        const vFov = (cam.fov * Math.PI) / 180;
        const visibleHeight = 2 * Math.tan(vFov / 2) * dist;
        const visibleWidth = visibleHeight * cam.aspect;
        const xLimit = Math.max(0, (gridW - visibleWidth) / 2 + 2);
        const yLimit = Math.max(0, (gridH - visibleHeight) / 2 + 2);
        return { x: xLimit, y: yLimit, visibleHeight };
    };

    useEffect(() => {
        const canvas = gl.domElement;
        let isDown = false;
        let startX = 0,
            startY = 0;
        let initialRigX = 0,
            initialRigY = 0;
        let maxDragDistance = 0;

        const onDown = (e: PointerEvent) => {
            isDown = true;
            startX = e.clientX;
            startY = e.clientY;
            initialRigX = rigState.target.x;
            initialRigY = rigState.target.y;
            maxDragDistance = 0;
            rigState.isDragging = false;
            canvas.style.cursor = 'grabbing';
        };

        const onMove = (e: PointerEvent) => {
            if (!isDown) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            maxDragDistance = Math.max(maxDragDistance, distance);
            const threshold = 'ontouchstart' in window ? 15 : CONFIG.clickThreshold;
            if (maxDragDistance > threshold) {
                rigState.isDragging = true;
                rigState.activeId = null;
            }
            const { x: bx, y: by, visibleHeight } = getBounds();
            const sensitivity = (visibleHeight / window.innerHeight) * CONFIG.dragSpeed;
            let rawX = initialRigX + dx * sensitivity;
            let rawY = initialRigY - dy * sensitivity;
            if (rawX > bx) rawX = bx + (rawX - bx) * CONFIG.dragResistance;
            if (rawX < -bx) rawX = -bx + (rawX + bx) * CONFIG.dragResistance;
            if (rawY > by) rawY = by + (rawY - by) * CONFIG.dragResistance;
            if (rawY < -by) rawY = -by + (rawY + by) * CONFIG.dragResistance;
            const maxOvershoot = 3;
            rawX = Math.max(-bx - maxOvershoot, Math.min(bx + maxOvershoot, rawX));
            rawY = Math.max(-by - maxOvershoot, Math.min(by + maxOvershoot, rawY));
            rigState.target.set(rawX, rawY, 0);
        };

        const onUp = () => {
            if (!isDown) return;
            isDown = false;
            rigState.isDragging = false;
            canvas.style.cursor = 'grab';
            if (rigState.activeId !== null) return;
            const { x: bx, y: by } = getBounds();
            const cam = camera as THREE.PerspectiveCamera;
            const isZoomedOut = cam.position.z > CONFIG.zoomIn + 2;
            const snapX = isZoomedOut ? 0 : Math.max(-bx, Math.min(bx, rigState.target.x));
            const snapY = isZoomedOut ? 2 : Math.max(-by, Math.min(by, rigState.target.y));
            rigState.target.set(snapX, snapY, 0);
        };

        canvas.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        // eslint-disable-next-line react-hooks/immutability
        canvas.style.cursor = 'grab';

        return () => {
            canvas.removeEventListener('pointerdown', onDown);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
        };
    }, [gl, camera, gridW, gridH]);

    useFrame((_, delta) => {
        easing.damp3(rigState.current, rigState.target, CONFIG.dampFactor, delta);

        easing.damp(camera.position as any, 'z', rigState.zoom, CONFIG.zoomDamp, delta);
        rigState.velocity.copy(rigState.current).sub(prevPos.current);
        prevPos.current.copy(rigState.current);
        const zoomFactor = Math.min(1, CONFIG.zoomIn / rigState.zoom);
        const tiltX = rigState.velocity.y * CONFIG.tiltFactor * zoomFactor;
        const tiltY = -rigState.velocity.x * CONFIG.tiltFactor * zoomFactor;

        easing.damp(camera.rotation as any, 'x', tiltX, 0.2, delta);

        easing.damp(camera.rotation as any, 'y', tiltY, 0.2, delta);
    });

    return null;
}

import type { RefObject } from 'react';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger, CustomEase);
CustomEase.create('floema-out', '0.22,1,0.36,1');
export { gsap, ScrollTrigger };
export const motion = { ease: 'floema-out', reveal: 0.7, stagger: 0.07, exit: 0.24, enter: 0.56, pillStretch: 0.48, pillGlow: 0.24, collectionCycle: 850, heroCruise: 1.4, heroBoost: 5 };
export const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
export type SceneDials = {
    progress: number;
    scrollVelocity: number;
    chargerMatch: number;
    cubeOffset: number;
    material: number;
    pointerX: number;
    pointerY: number;
    dragX: number;
    dragY: number;
    dragging: boolean;
};
export const createDials = (): SceneDials => ({ progress: 0, scrollVelocity: 0, chargerMatch: 0, cubeOffset: 0, material: 0, pointerX: 0, pointerY: 0, dragX: 0, dragY: 0, dragging: false });

export type SceneDialsRef = RefObject<SceneDials>;

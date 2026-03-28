import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

const pageTransitionEase = CustomEase.create('pageTransition', 'M0,0 C0.38,0.05 0.48,0.58 0.65,0.82 0.82,1 1,1 1,1');

export function defaultTransition(currentContainer: HTMLElement, nextContainer: HTMLElement): gsap.core.Timeline {
    gsap.set(nextContainer, {
        clipPath: 'inset(100% 0% 0% 0%)',
        opacity: 1,
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        zIndex: 10,
    });

    const tl = gsap.timeline();

    tl.to(
        currentContainer,
        {
            y: '-30vh',
            opacity: 0.4,
            scale: 0.8,
            duration: 0.7,
            force3D: true,
            ease: pageTransitionEase,
        },
        0,
    ).to(
        nextContainer,
        {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 0.7,
            force3D: true,
            ease: pageTransitionEase,
        },
        0,
    );

    return tl;
}

export function getTransition(currentNamespace: string, nextNamespace: string): (current: HTMLElement, next: HTMLElement) => gsap.core.Timeline {
    const registry: Record<string, (c: HTMLElement, n: HTMLElement) => gsap.core.Timeline> = {
        'home-to-about': defaultTransition,
        'about-to-home': defaultTransition,
        default: defaultTransition,
    };
    const key = `${currentNamespace}-to-${nextNamespace}`;
    return registry[key] ?? registry.default;
}

import { gsap } from 'gsap';
import { SplitText } from 'gsap/dist/SplitText';

gsap.registerPlugin(SplitText);

function wrapLines(split: InstanceType<typeof SplitText>) {
    split.lines.forEach((line) => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
      overflow: hidden;
      line-height: 100%;
      transform: translateZ(0);
      backface-visibility: hidden;
      margin-bottom: 0.1rem;
    `;
        line.parentNode!.insertBefore(wrapper, line);
        wrapper.appendChild(line);
    });

    gsap.set(split.lines, {
        y: '100%',
        force3D: true,
        willChange: 'transform',
    });
}

function wrapChars(split: InstanceType<typeof SplitText>) {
    gsap.set(split.chars, {
        y: '100%',
        force3D: true,
        rotateX: 60,
    });
}

export type EnterResult = {
    timeline: gsap.core.Timeline;
    cleanup: () => void;
};

export function enterAnimation(container: HTMLElement, delay = 0): EnterResult | null {
    const h1 = container.querySelector<HTMLElement>('h1');
    const content = container.querySelector<HTMLElement>('.hero_content');
    const linesRight = container.querySelectorAll<HTMLElement>('.inner_linesright');
    const linesLeft = container.querySelectorAll<HTMLElement>('.inner_linesleft');
    const ps = container.querySelectorAll<HTMLElement>('.anim_p');
    const ps2 = container.querySelectorAll<HTMLElement>('.anim_p2');

    if (!h1) return null;

    gsap.set(h1, { opacity: 1 });

    const splitH1 = new SplitText(h1, { type: 'chars' });
    const splitP = new SplitText(ps, { type: 'lines' });
    const splitP2 = new SplitText(ps2, { type: 'lines' });

    wrapChars(splitH1);
    wrapLines(splitP);
    wrapLines(splitP2);

    gsap.set(linesRight, { x: '-100%', force3D: true });
    gsap.set(linesLeft, { x: '-100%', force3D: true });

    if (content) gsap.set(content, { opacity: 1 });

    const isMobile = window.innerWidth < 900;

    const tl = gsap.timeline({ defaults: { force3D: true, lazy: false } });

    tl.to(
        splitH1.chars,
        {
            rotateX: 0,
            y: 0,
            force3D: true,
            duration: 2.1,
            stagger: 0.035,
            ease: 'expo.out',
        },
        delay,
    )
        .to(
            splitP.lines,
            {
                y: 0,
                duration: 1.65,
                stagger: { amount: 0.08, from: 'end' },
                force3D: true,
                ease: 'power3.out',
            },
            isMobile ? delay : delay + 0.2,
        )
        .to(
            splitP2.lines,
            {
                y: 0,
                duration: 1.65,
                stagger: { amount: 0.08, from: 'end' },
                force3D: true,
                ease: 'power3.out',
            },
            delay + 0.2,
        )
        .to(
            linesRight,
            {
                x: 0,
                duration: 1,
                stagger: { amount: 0.25, from: 'start' },
                ease: 'power2.inOut',
            },
            0,
        )
        .to(
            linesLeft,
            {
                x: 0,
                duration: 1,
                stagger: { amount: 0.25, from: 'start' },
                ease: 'power2.inOut',
            },
            0,
        );

    return {
        timeline: tl,
        cleanup: () => {
            splitH1.revert();
            splitP.revert();
            splitP2.revert();
        },
    };
}

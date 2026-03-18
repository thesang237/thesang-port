export enum MotionLinesType {
    FADE_FROM_BOTTOM = 'fade-from-bottom',
}

export const InitialVarsMotionLinesMap: Record<MotionLinesType, gsap.TweenVars> = {
    [MotionLinesType.FADE_FROM_BOTTOM]: {
        yPercent: 120,
        willChange: 'transform',
    },
};

export const InVarsMotionLinesMap: Record<MotionLinesType, gsap.TweenVars> = {
    [MotionLinesType.FADE_FROM_BOTTOM]: {
        yPercent: 0,
        stagger: 0.2,
    },
};

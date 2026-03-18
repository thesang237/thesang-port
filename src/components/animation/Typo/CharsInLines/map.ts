export enum MotionCharsInLinesType {
    FADE_FROM_BOTTOM_CENTER = 'fade-from-bottom-center',
}

export const InitialVarsMotionCharsInLinesMap: Record<MotionCharsInLinesType, gsap.TweenVars> = {
    [MotionCharsInLinesType.FADE_FROM_BOTTOM_CENTER]: {
        yPercent: 120,
        willChange: 'transform',
    },
};

export const InVarsMotionCharsInLinesMap: Record<MotionCharsInLinesType, gsap.TweenVars> = {
    [MotionCharsInLinesType.FADE_FROM_BOTTOM_CENTER]: {
        yPercent: 0,
        stagger: { from: 'center', amount: 0.2 },
    },
};

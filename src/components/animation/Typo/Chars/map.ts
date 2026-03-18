export enum MotionCharsType {
    FADE_FROM_BOTTOM_CENTER = 'fade-from-bottom-center',
}

export const InitialVarsMotionCharsMap: Record<MotionCharsType, gsap.TweenVars> = {
    [MotionCharsType.FADE_FROM_BOTTOM_CENTER]: {
        yPercent: 100,
        willChange: 'transform',
    },
};

export const InVarsMotionCharsMap: Record<MotionCharsType, gsap.TweenVars> = {
    [MotionCharsType.FADE_FROM_BOTTOM_CENTER]: {
        yPercent: 0,
        stagger: { from: 'center', amount: 0.2 },
    },
};

export enum MotionWordsType {
    FADE_FROM_BOTTOM_CENTER = 'fade-from-bottom-center',
}

export const InitialVarsMotionWordsMap: Record<MotionWordsType, gsap.TweenVars> = {
    [MotionWordsType.FADE_FROM_BOTTOM_CENTER]: {
        yPercent: 120,
        willChange: 'transform',
    },
};

export const InVarsMotionWordsMap: Record<MotionWordsType, gsap.TweenVars> = {
    [MotionWordsType.FADE_FROM_BOTTOM_CENTER]: {
        yPercent: 0,
        stagger: { from: 'center', amount: 0.2 },
    },
};

export enum MotionFadeDirection {
    TOP = 'top',
    BOTTOM = 'bottom',
    LEFT = 'left',
    RIGHT = 'right',
}

export const InitialVarsMotionFadeMap: Record<MotionFadeDirection, gsap.TweenVars> = {
    [MotionFadeDirection.TOP]: {
        opacity: 0,
        y: '-48px',
        willChange: 'transform,opacity',
    },
    [MotionFadeDirection.BOTTOM]: {
        opacity: 0,
        y: '48px',
        willChange: 'transform,opacity',
    },
    [MotionFadeDirection.LEFT]: {
        opacity: 0,
        x: '-48px',
        willChange: 'transform,opacity',
    },
    [MotionFadeDirection.RIGHT]: {
        opacity: 0,
        x: '48px',
        willChange: 'transform,opacity',
    },
};

export const InVarsMotionFadeMap: Record<MotionFadeDirection, gsap.TweenVars> = {
    [MotionFadeDirection.TOP]: {
        opacity: 1,
        y: '0',
    },
    [MotionFadeDirection.BOTTOM]: {
        opacity: 1,
        y: '0',
    },
    [MotionFadeDirection.LEFT]: {
        opacity: 1,
        x: '0',
    },
    [MotionFadeDirection.RIGHT]: {
        opacity: 1,
        x: '0',
    },
};

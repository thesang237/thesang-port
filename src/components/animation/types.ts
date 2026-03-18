export type AnimateInParams = {
    initVars?: gsap.TweenVars;
    inVars?: gsap.TweenVars;
};

export type AnimateOutParams = {
    outVars?: gsap.TweenVars;
};

export type ResetParams = {
    resetVars?: gsap.TweenVars;
};

export enum SplitType {
    LINES = 'lines',
    WORDS = 'words',
    CHARS = 'chars',
}

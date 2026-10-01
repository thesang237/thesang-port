// Mutable state shared between the DOM hero sequence and the WebGL layer (no React re-renders).
export const heroState = {
    /** 0 = full-screen hero, 1 = small card (pinned scrub progress) */
    progress: 0,
    /** pointer in viewport px */
    mouse: { x: -9999, y: -9999, active: false },
};

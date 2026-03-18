import type { Variants } from 'framer-motion';

export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 48 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.165, 0.84, 0.44, 1] },
    },
};

export const fadeInDown: Variants = {
    hidden: { opacity: 0, y: -48 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.165, 0.84, 0.44, 1] },
    },
};

export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.6, ease: [0.165, 0.84, 0.44, 1] },
    },
};

export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.6, ease: [0.165, 0.84, 0.44, 1] },
    },
};

export const slideInLeft: Variants = {
    hidden: { opacity: 0, x: -48 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.7, ease: [0.165, 0.84, 0.44, 1] },
    },
};

export const slideInRight: Variants = {
    hidden: { opacity: 0, x: 48 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.7, ease: [0.165, 0.84, 0.44, 1] },
    },
};

export const staggerContainer: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

export const staggerContainerFast: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.06,
            delayChildren: 0.05,
        },
    },
};

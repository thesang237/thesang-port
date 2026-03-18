'use client';

import type { FC, HTMLAttributes, ReactNode } from 'react';
import React from 'react';
import clsx from 'clsx';
import gsap from 'gsap';

import { SplitType } from '@/components/animation/types';
import { InitialVarsMotionCharsInLinesMap, InVarsMotionCharsInLinesMap, MotionCharsInLinesType } from '@/components/animation/Typo/CharsInLines/map';
import type { UseTypoMotionConfig } from '@/components/animation/Typo/hooks/useTypoMotion';
import useTypoMotion from '@/components/animation/Typo/hooks/useTypoMotion';

type Props = HTMLAttributes<HTMLElement> & {
    config?: UseTypoMotionConfig;
    children: ReactNode;
    type?: MotionCharsInLinesType;
    as?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span';
};

const MotionCharsInLines: FC<Props> = ({ children, type = MotionCharsInLinesType.FADE_FROM_BOTTOM_CENTER, config, as: Tag = 'p', className, ...props }) => {
    const { ref } = useTypoMotion({
        config: {
            ...config,
            splitType: 'chars, words, lines',
            animateOnType: SplitType.CHARS,
            maskOnType: SplitType.LINES,
        },
        initVars: InitialVarsMotionCharsInLinesMap[type],
        animateIn: ({ splitInstanceRef, inVars }) => {
            const lines = splitInstanceRef?.[SplitType.LINES] ?? [];

            const { scrollTrigger, onStart, onComplete } = inVars ?? {};

            const tl = gsap.timeline({
                scrollTrigger,
                onStart,
                onComplete,
            });

            lines.forEach((line, index) => {
                const charsInLine = line.querySelectorAll('.char');

                tl.to(
                    charsInLine,
                    {
                        duration: 1.6,
                        ease: 'power3.out',
                        stagger: 0.2,
                        ...InVarsMotionCharsInLinesMap[type],
                    },
                    '<' + (index * 0.2).toString(),
                );
            });

            return tl;
        },
    });

    return React.createElement(Tag, { ref, className: clsx('fix-split-text', className), ...props }, children);
};

export default MotionCharsInLines;

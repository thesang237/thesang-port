'use client';

import type { FC, HTMLAttributes, ReactNode } from 'react';
import React from 'react';
import clsx from 'clsx';

import { SplitType } from '@/components/animation/types';
import { InitialVarsMotionCharsMap, InVarsMotionCharsMap, MotionCharsType } from '@/components/animation/Typo/Chars/map';
import type { UseTypoMotionConfig } from '@/components/animation/Typo/hooks/useTypoMotion';
import useTypoMotion from '@/components/animation/Typo/hooks/useTypoMotion';

type Props = HTMLAttributes<HTMLElement> & {
    config?: UseTypoMotionConfig;
    children: ReactNode;
    type?: MotionCharsType;
    as?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span';
};

const MotionChars: FC<Props> = ({ children, type = MotionCharsType.FADE_FROM_BOTTOM_CENTER, config, as: Tag = 'p', className, ...props }) => {
    const { ref } = useTypoMotion({
        config: {
            ...config,
            splitType: 'chars',
            animateOnType: SplitType.CHARS,
            maskOnType: SplitType.LINES,
        },
        initVars: InitialVarsMotionCharsMap[type],
        inVars: InVarsMotionCharsMap[type],
    });

    return React.createElement(Tag, { ref, className: clsx('fix-split-text', className), ...props }, children);
};

export default MotionChars;

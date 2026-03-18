'use client';

import type { FC, HTMLAttributes, ReactNode } from 'react';
import React from 'react';
import clsx from 'clsx';

import { SplitType } from '@/components/animation/types';
import type { UseTypoMotionConfig } from '@/components/animation/Typo/hooks/useTypoMotion';
import useTypoMotion from '@/components/animation/Typo/hooks/useTypoMotion';
import { InitialVarsMotionLinesMap, InVarsMotionLinesMap, MotionLinesType } from '@/components/animation/Typo/Lines/map';

type Props = HTMLAttributes<HTMLElement> & {
    children: ReactNode;
    config?: UseTypoMotionConfig;
    type?: MotionLinesType;
    as?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span';
};

const MotionLines: FC<Props> = ({ children, type = MotionLinesType.FADE_FROM_BOTTOM, config, as: Tag = 'p', className, ...props }) => {
    const { ref } = useTypoMotion({
        config: {
            ...config,
            splitType: 'lines',
            animateOnType: SplitType.LINES,
            maskOnType: SplitType.LINES,
        },
        initVars: InitialVarsMotionLinesMap[type],
        inVars: InVarsMotionLinesMap[type],
    });

    return React.createElement(Tag, { ref, className: clsx('fix-split-text', className), ...props }, children);
};

export default MotionLines;

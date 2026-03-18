'use client';

import type { FC, HTMLAttributes, ReactNode } from 'react';
import React from 'react';
import clsx from 'clsx';

import { SplitType } from '@/components/animation/types';
import type { UseTypoMotionConfig } from '@/components/animation/Typo/hooks/useTypoMotion';
import useTypoMotion from '@/components/animation/Typo/hooks/useTypoMotion';
import { InitialVarsMotionWordsMap, InVarsMotionWordsMap, MotionWordsType } from '@/components/animation/Typo/Words/map';

type Props = HTMLAttributes<HTMLElement> & {
    config?: UseTypoMotionConfig;
    children: ReactNode;
    type?: MotionWordsType;
    as?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span';
};

const MotionWords: FC<Props> = ({ children, type = MotionWordsType.FADE_FROM_BOTTOM_CENTER, config, as: Tag = 'p', className, ...props }) => {
    const { ref } = useTypoMotion({
        config: {
            ...config,
            splitType: 'words, lines',
            animateOnType: SplitType.WORDS,
            maskOnType: SplitType.LINES,
        },
        initVars: InitialVarsMotionWordsMap[type],
        inVars: InVarsMotionWordsMap[type],
    });

    return React.createElement(Tag, { ref, className: clsx('fix-split-text', className), ...props }, children);
};

export default MotionWords;

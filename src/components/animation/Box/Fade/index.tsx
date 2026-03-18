'use client';

import type { FC, HTMLAttributes, ReactElement } from 'react';

import { InitialVarsMotionFadeMap, InVarsMotionFadeMap, MotionFadeDirection } from '@/components/animation/Box/Fade/map';
import type { UseBoxMotionConfig } from '@/components/animation/Box/hooks/useBoxMotion';
import useBoxMotion from '@/components/animation/Box/hooks/useBoxMotion';
import { cn } from '@/utils/cn';

type Props = HTMLAttributes<HTMLDivElement> & {
    type?: MotionFadeDirection;
    config?: UseBoxMotionConfig;
    children: ReactElement;
};

const MotionFade: FC<Props> = ({ type = MotionFadeDirection.BOTTOM, children, config, className, ...props }) => {
    const { ref } = useBoxMotion({
        config,
        initVars: InitialVarsMotionFadeMap[type],
        inVars: InVarsMotionFadeMap[type],
    });

    return (
        <div ref={ref} className={cn(className)} {...props}>
            {children}
        </div>
    );
};

export default MotionFade;
